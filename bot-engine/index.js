const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { getAikoResponse } = require('./brain');
const firebase = require('./firebase');

let reconnectAttempts = 0;
const MAX_RECONNECTS = 5;

async function connectToWhatsApp() {
    console.log("Initializing WhatsApp Bot via Baileys...");
    const AUTH_DIR = 'auth_info_baileys';

    // Try to restore session from Firebase before anything else
    await firebase.restoreSessionFromFirebase(AUTH_DIR);

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: true, // Let it print in terminal for easier scanning
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"], // More standard browser identity
        connectTimeoutMs: 60000,   // Increase timeout for GitHub Actions
        defaultQueryTimeoutMs: 0,  // Disable some internal Baileys timeouts
        syncFullHistory: false,    // Reduce data load to avoid 408/405
        getMessage: async (key) => { return { conversation: 'Aiko is processing...' } }
    });

    sock.ev.on('creds.update', async () => {
        await saveCreds();
        await firebase.saveSessionToFirebase(AUTH_DIR);
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log("Scan the QR code above with your WhatsApp app.");
            const qrcodeDataURL = await require('qrcode').toDataURL(qr);
            await firebase.updateQR(qrcodeDataURL);
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const isLoggedOut = statusCode === DisconnectReason.loggedOut;
            console.log(`Connection closed (${statusCode}). LoggedOut: ${isLoggedOut}`);
            await firebase.updateConnectionStatus(false);

            if (isLoggedOut) {
                console.log("Logged out. Delete auth_info_baileys and restart.");
                process.exit(0);
            }

            reconnectAttempts++;
            if (reconnectAttempts >= MAX_RECONNECTS) {
                console.log(`Max reconnect attempts (${MAX_RECONNECTS}) reached. Exiting for GitHub Actions to restart.`);
                process.exit(0); // exit 0 so action doesn't fail - just restarts on schedule
            }

            console.log(`Reconnecting... attempt ${reconnectAttempts}/${MAX_RECONNECTS}`);
            setTimeout(connectToWhatsApp, 3000);
        } else if (connection === 'open') {
            reconnectAttempts = 0;
            console.log('✅ Bot is connected and ready to receive messages!');
            await firebase.updateConnectionStatus(true);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (let m of messages) {
            if (m.key.fromMe) continue;

            const sender = m.key.remoteJid;
            const messageContent = m.message?.conversation || m.message?.extendedTextMessage?.text;

            if (messageContent) {
                console.log(`📩 From ${sender}: ${messageContent}`);
                await firebase.logMessage(sender, messageContent, false);

                if (messageContent.toLowerCase() === 'menu' || messageContent.toLowerCase() === 'help') {
                    const menuText = `*Welcome to Teched Studios* 🚀\n\nHow can Aiko help you today?\n1️⃣ Web Development\n2️⃣ Mobile Apps\n3️⃣ Talk to a Developer\n\nPlease reply with a number or simply type your query!`;
                    await sock.sendMessage(sender, { text: menuText });
                    await firebase.logMessage(sender, menuText, true);
                    continue;
                }

                sock.sendPresenceUpdate('composing', sender);
                const pushName = m.pushName || "Valued Client";
                const aikoReply = await getAikoResponse(messageContent, pushName);
                await sock.sendMessage(sender, { text: aikoReply });
                await firebase.logMessage(sender, aikoReply, true);
                console.log(`✅ Replied to ${sender}`);
            }
        }
    });
}

connectToWhatsApp();


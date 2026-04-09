const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { getAikoResponse } = require('./brain');
const firebase = require('./firebase');

async function connectToWhatsApp () {
    console.log("Initializing WhatsApp Bot via Baileys...");
    
    // Auth state is saved in auth_info_baileys folder so session persists
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        printQRInTerminal: false, // We'll handle it manually to get the base64/raw text 
        auth: state,
        logger: pino({ level: 'silent' }) // suppress noisy logs
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Print the QR code in terminal
            qrcode.generate(qr, { small: true });
            console.log("Scan the QR code above with your WhatsApp app.");
            
            // Generate QR base64 for dashboard
            const qrcodeDataURL = await require('qrcode').toDataURL(qr);
            await firebase.updateQR(qrcodeDataURL);
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to', lastDisconnect.error?.output?.statusCode, ', reconnecting:', shouldReconnect);
            
            firebase.updateConnectionStatus(false);
            
            if (shouldReconnect) {
                // reconnect if not logged out
                connectToWhatsApp();
            } else {
                console.log("You have been logged out. Please delete the auth_info_baileys folder and restart to scan a new QR code.");
            }
        } else if (connection === 'open') {
            console.log('Bot is connected and ready to receive messages!');
            firebase.updateConnectionStatus(true);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (let m of messages) {
            // Skip messages from the bot itself
            if (m.key.fromMe) continue;

            const sender = m.key.remoteJid;
            const messageContent = m.message?.conversation || m.message?.extendedTextMessage?.text;

            if (messageContent) {
                console.log(`Received message from ${sender}: ${messageContent}`);
                
                // Log incoming message to Firebase Admin Dashboard
                await firebase.logMessage(sender, messageContent, false);

                // Quick Menu Interception
                if (messageContent.toLowerCase() === 'menu' || messageContent.toLowerCase() === 'help') {
                    const menuText = `*Welcome to Teched Studios* 🚀\n\nHow can Aiko help you today?\n1️⃣ Web Development\n2️⃣ Mobile Apps\n3️⃣ Talk to a Developer\n\nPlease reply with a number or simply type your query!`;
                    await sock.sendMessage(sender, { text: menuText });
                    await firebase.logMessage(sender, menuText, true);
                    continue;
                }

                // If not menu, send it to Aiko's Brain (Llama API)
                sock.sendPresenceUpdate('composing', sender);
                
                const pushName = m.pushName || "Valued Client";
                const aikoReply = await getAikoResponse(messageContent, pushName);
                
                await sock.sendMessage(sender, { text: aikoReply });
                
                // Log outgoing message
                await firebase.logMessage(sender, aikoReply, true);
                console.log(`Replied to ${sender}: ${aikoReply}`);
            }
        }
    });
}

// Start the bot
connectToWhatsApp();

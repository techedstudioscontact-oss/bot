const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Use the service account key from the root directory
const serviceAccount = require('../teched-wa-bot-firebase-adminsdk-fbsvc-bf6468b556.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://teched-wa-bot-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function updateQR(qrCodeBase64) {
    try {
        await db.ref('status').update({
            qrCode: qrCodeBase64,
            status: 'WAITING_FOR_SCAN',
            updatedAt: new Date().toISOString()
        });
        console.log("✅ QR Code updated on Firebase for Admin Panel.");
    } catch (e) {
        console.error("Error updating QR:", e.message);
    }
}

async function updateConnectionStatus(isConnected) {
    try {
        const body = {
            status: isConnected ? 'CONNECTED' : 'DISCONNECTED',
            updatedAt: new Date().toISOString()
        };
        if (isConnected) body.qrCode = null;

        await db.ref('status').update(body);
    } catch (e) {
        console.error("Error updating status:", e.message);
    }
}

async function logMessage(contact, messageText, isReply = false) {
    try {
        await db.ref('messages').push({
            contact: contact,
            text: messageText,
            isReply: isReply,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Error logging message:", e.message);
    }
}

async function saveSessionToFirebase(dir) {
    try {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        const sessionData = {};
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = fs.readFileSync(path.join(dir, file), 'utf-8');
                sessionData[file.replace(/\./g, '_dot_')] = JSON.parse(content);
            }
        }

        await db.ref('session').set(sessionData);
        console.log("📂 Session saved to Firebase.");
    } catch (e) {
        console.error("Error saving session:", e.message);
    }
}

async function restoreSessionFromFirebase(dir) {
    try {
        const snapshot = await db.ref('session').once('value');
        const sessionData = snapshot.val();
        
        if (!sessionData) return false;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        for (const [key, value] of Object.entries(sessionData)) {
            const fileName = key.replace(/_dot_/g, '.');
            fs.writeFileSync(path.join(dir, fileName), JSON.stringify(value));
        }
        console.log("📂 Session restored from Firebase.");
        return true;
    } catch (e) {
        console.error("Error restoring session:", e.message);
        return false;
    }
}

function listenForReset(callback) {
    db.ref('status/status').on('value', (snapshot) => {
        if (snapshot.val() === 'RESET_REQUESTED') {
            console.log("🔄 Reset requested from Dashboard!");
            callback();
        }
    });
}

async function clearSession() {
    try {
        await db.ref('session').remove();
        console.log("📂 Firebase session cleared.");
    } catch (e) {
        console.error("Error clearing session from Firebase:", e.message);
    }
}

module.exports = {
    updateQR,
    updateConnectionStatus,
    logMessage,
    saveSessionToFirebase,
    restoreSessionFromFirebase,
    listenForReset,
    clearSession
};

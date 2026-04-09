// Firebase Realtime Database - Simple REST API (No Auth Required in Test Mode)
// This matches the JavaGoat tutorial approach exactly
const FIREBASE_URL = "https://teched-wa-bot-default-rtdb.asia-southeast1.firebasedatabase.app";

// Function to store the generated QR code so the PHP admin panel can read it
async function updateQR(qrCodeBase64) {
    try {
        await fetch(`${FIREBASE_URL}/status.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                qrCode: qrCodeBase64,
                status: 'WAITING_FOR_SCAN',
                updatedAt: new Date().toISOString()
            })
        });
        console.log("✅ QR Code updated on Firebase for Admin Panel.");
    } catch (e) {
        console.error("Error updating QR:", e.message);
    }
}

// Function to update connection status
async function updateConnectionStatus(isConnected) {
    try {
        const body = {
            status: isConnected ? 'CONNECTED' : 'DISCONNECTED',
            updatedAt: new Date().toISOString()
        };
        if (isConnected) body.qrCode = null;

        await fetch(`${FIREBASE_URL}/status.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (e) {
        console.error("Error updating status:", e.message);
    }
}

// Function to log received messages to Firebase
async function logMessage(contact, messageText, isReply = false) {
    try {
        await fetch(`${FIREBASE_URL}/messages.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contact: contact,
                text: messageText,
                isReply: isReply,
                timestamp: new Date().toISOString()
            })
        });
    } catch (e) {
        console.error("Error logging message:", e.message);
    }
}

// Session Persistence logic (for GitHub Actions)
const fs = require('fs');
const path = require('path');

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

        await fetch(`${FIREBASE_URL}/session.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
        });
        console.log("📂 Session saved to Firebase.");
    } catch (e) {
        console.error("Error saving session:", e.message);
    }
}

async function restoreSessionFromFirebase(dir) {
    try {
        const response = await fetch(`${FIREBASE_URL}/session.json`);
        const sessionData = await response.json();
        
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

module.exports = {
    updateQR,
    updateConnectionStatus,
    logMessage,
    saveSessionToFirebase,
    restoreSessionFromFirebase
};

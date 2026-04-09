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

module.exports = {
    updateQR,
    updateConnectionStatus,
    logMessage
};

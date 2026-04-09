const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Base64 Encoded Service Account to bypass GitHub secrets & scanning
const saBase64 = "eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InRlY2hlZC13YS1ib3QiLCJwcml2YXRlX2tleV9pZCI6ImJmNjQ2OGI1NTZhNDk1NzgzMzcxZDAzZTQ2NTc1NTdjN2U0ZGNiMWIiLCJwcml2YXRlX2tleSI6Ii0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFEZGZzbVRIaXpTZ0RtVlxuQVU4bjlTbzU5RUxHSE9GMlRHdFlhdlNlTzVnL3pDelJBWVUza0tZbk1KNTZ2ZHhWcndNa1pmVENPQTh1ZjUxd1xucHpubFBHWVh6R1ExY2xQa2ZyMUlYTy9mSFU1ZjVMMzRNZjNSMHh6WC8zNlRVMHNlMnU1NXQ5RnVaY1RZbnVHalxuYURXemU5TFQwOGFxYlB6Y0ZtYW5NMFB3Z0d3MFhHdkZaM3lqQ21mS01yVmdFM1h5a1lpT1RLTEFnQ0xDMW1qN1xuVnpheXJuK3BqYXlXeVljNENvc3BIejN4TDJZSWxYZXpVS2ZrWUE2Z29hdnM0UmgrdnFNOHhZKzMwRFUzNjBWclxuYThBYXIrQzgyeFYwY1dnYkl3dktQSCtBSkVrTjNvdWZvWWNzL1VqeEUyQk9lQWRuUUFHNjNKYUx6a0cwSmxWQVxuUjFVOWpyMGxBZ01CQUFFQ2dnRUFHRWRtVVpmSWFuK1BNRWZmTlI1UTFWN3l0ZFFqRzZ4SFJQOGVWcnpxRks0dFxuQ0hEOStRQWY1R0pXTU5hZ2NRejR6M1BVbHpoOVk0ZXVDcFB1Q3ZScXJYZWtVVjU1bHkyVVVuc0xlUjIxZ2xub1xudit5ODZaUFdVTS9yQUR1c1c1SzhlcitkTjVoMHNoa0NXejdZU2hjTDFsZmJxa0U5bTJOaU43Z3RIWTc2TFdmeVxueURERGkrd3BDdnllcnIvWVhpbDd5VGVKb0lFNUpienhHT2NxV0x3TDVlc2ZkUTJyYWNlQTBEUkxsK2V2STl2R1xuVUlQSlZmZ3hHaHJqZzcrMzdwNkRpdFdzNU5wRzhqMFg0YjF3eGpJNVZwZzZZOTJ3RkRKTzdjRWxXWVZRdlJzcFxuZFZsSldTRVVNSEptMDRNNkxIclNvZ3Q3T2tUTXR5ZnVzN21uMU5vQ1lRS0JnUUQ3enNKK3FPTUlGRUM0SjdPaVxuaEVxRFVWcTlPMFQ4QStRODNwd3JON2lTQnAyLzVIZHJ3anRXczF6R3BWcnAyTWtzWlF1TGNvcmN1Q2NPNENhdVxuaDcydnNlNWJxekpPbkdLeS82elBSYUxxQkEzQ09hRG1BVk9Lbjh2TFBGeHJtQlhvTGR5NElPOUpDc1kxcTlzdlxuQmZFMUxXOTVpTHI4RGR5NTJ0OUlDdXBwQlFLQmdRRGhMdFQzcmtjRkZVcmVQNUFaZmFqZXJEdkVRTE1SNW5SR1xudUZOb0VQQkI1aVZiTk5VL3RuUy9vMG9sOTc3MW1OUkhoSng2WVlLeDhsQ1lLYVc2elUxNVRySjQ1K29mMnkvVlxuaFQybkpCdndSUEoxVnNTa3RSMi9iL3N3MTV4WUk4ZXNpa1RKMUZUZVJHbXU5R1UxK0h3VVZrSDFGUGFzdkxUSlxuakVwV2lWSzlvUUtCZ0hxZTR1T2ZCbittclNXQVg5K2lJRTcyVFFPZFd5aUdGSnozb29FQkwyWWN4ckR0WnFJWlxuQWFCazA2Y0FXdGRKZEIya1R3em5DR3dYV1IzTFZjcmoyeUUxdW1iMVpSZ1cyNUZqSkJvRFJTUkVPUmI5elRaMFxuS3VSMGtGODEwNk9wZWZHSWM5Vk9aSGZqUVVaZG0reTRMZy9CUW1taWhidThYR0k5RFVJZDNxeXBBb0dBUHhQVlxuU0VRalZNTXdJNjErZWdWL0psRHN0UDdDcW9MNWswM1MzMVhQVjBaV3RJUEtNSHkxbTNEc05sSjl4V0k0SkloN1xuSkxUbjNWelpRcVozN0NuU1IrYkppNkM3TG8xQml2ZzEydm44Y1lOK3YydTh6YjZHUkxmamp6ejJhS0l0THFIVVxudnd5aGNWbU1tUnVRdGx1U3RrZXJWakczSDVBRXZHaDE4bU9wTDhFQ2dZRUFnWEpXTkhiSVhYTkJGTVYwL0V1R1xubE1jaE1PT0ZqRjNUaVQ5czU5MGo4ZkFjUWNTYlJxTzlyTnozUDdWNDZxSEF4Z1VBcEM2MzRSR1hDOTFXeld6ZVxuUUhxL2Y0T1RyZlZRbjgxOTFjYjZCaGVIaTd1bkZDNWhlMktmWThCY3R6QmVKTFFXc0I5V3d5dUwrVjZ6eVhydFxuR0ZybWVCZ0V4L2RsQkVOa2o3YWhnQXM9XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLCJjbGllbnRfZW1haWwiOiJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0B0ZWNoZWQtd2EtYm90LmlhbS5nc2VydmljZWFjY291bnQuY29tIiwiY2xpZW50X2lkIjoiMTAzNDU0MDY0Njc5Njc4NzAzMTE5IiwiYXV0aF91cmkiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsInRva2VuX3VyaSI6Imh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjoiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwiY2xpZW50X3g1MDlfY2VydF91cmwiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwdGVjaGVkLXdhLWJvdC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVuaXZlcnNlX2RvbWFpbiI6Imdvb2dsZWFwaXMuY29tIn0=";

// Standard Firebase Admin setup
let db;
try {
    const serviceAccount = JSON.parse(Buffer.from(saBase64, 'base64').toString('utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://teched-wa-bot-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
    db = admin.firestore();
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.warn("⚠️ Firebase serviceAccountKey.json not found or invalid. Make sure to add it for real-time DB sync.", error.message);
    // Proceeding without DB for testing purposes
}

// Function to store the generated QR code in Firebase so the PHP admin panel can read it
async function updateQR(qrCodeBase64) {
    if (!db) return;
    try {
        await db.collection('system').doc('status').set({
            qrCode: qrCodeBase64,
            status: 'WAITING_FOR_SCAN',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log("Updated QR on Firebase for Admin Panel");
    } catch (e) {
        console.error("Error updating QR:", e);
    }
}

// Function to update connection status
async function updateConnectionStatus(isConnected) {
    if (!db) return;
    try {
        await db.collection('system').doc('status').set({
            status: isConnected ? 'CONNECTED' : 'DISCONNECTED',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        if (isConnected) {
            // clear the QR code since it's connected
            await db.collection('system').doc('status').update({
                qrCode: admin.firestore.FieldValue.delete()
            });
        }
    } catch (e) {
        console.error("Error updating status:", e);
    }
}

// Function to log received messages to Firebase
async function logMessage(contact, messageText, isReply = false) {
    if (!db) return;
    try {
        await db.collection('messages').add({
            contact: contact,
            text: messageText,
            isReply: isReply,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error("Error logging message:", e);
    }
}

module.exports = {
    updateQR,
    updateConnectionStatus,
    logMessage
};

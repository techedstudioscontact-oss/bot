import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCApYzYcwrFZhyOQ0qVosgHbbU6yOvErIk",
    authDomain: "teched-wa-bot.firebaseapp.com",
    databaseURL: "https://teched-wa-bot-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "teched-wa-bot",
    storageBucket: "teched-wa-bot.firebasestorage.app",
    messagingSenderId: "85831984725",
    appId: "1:85831984725:web:88f49a81ddf26dce48d6dc",
    measurementId: "G-VXXWWWQYTM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Simple Auth Logic
const loginBtn = document.getElementById('login-btn');
const authPass = document.getElementById('auth-pass');
const loginOverlay = document.getElementById('login-overlay');
const mainContent = document.getElementById('main-content');
const loginError = document.getElementById('login-error');

loginBtn.addEventListener('click', () => {
    // Matches existing PHP password for consistency
    if (authPass.value === 'admin123') {
        loginOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        initDashboard();
    } else {
        loginError.textContent = 'Invalid credentials. Try again.';
    }
});

function initDashboard() {
    const statusRef = ref(db, 'status');
    const messagesRef = ref(db, 'messages');
    
    // Listen for Status & QR
    onValue(statusRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateStatusUI(data);
        }
    });

    // Listen for Messages
    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateMessagesUI(data);
        }
    });
}

function updateStatusUI(data) {
    const badge = document.getElementById('stat-badge');
    const pulse = document.getElementById('global-pulse');
    const connText = document.getElementById('connection-text');
    const qrImg = document.getElementById('qr-display');
    const qrLoading = document.getElementById('qr-loading');
    const instructions = document.getElementById('link-instructions');
    const syncTime = document.getElementById('sync-time');

    if (data.status === 'CONNECTED') {
        badge.textContent = 'ONLINE';
        badge.className = 'badge online';
        pulse.className = 'pulse green';
        connText.textContent = 'SYSTEM ACTIVE';
        qrImg.style.display = 'none';
        qrLoading.style.display = 'none';
        instructions.style.display = 'none';
    } else {
        badge.textContent = 'OFFLINE';
        badge.className = 'badge offline';
        pulse.className = 'pulse red';
        connText.textContent = 'AWAITING LINK';

        if (data.qrCode) {
            qrImg.src = data.qrCode;
            qrImg.style.display = 'block';
            qrLoading.style.display = 'none';
            instructions.style.display = 'block';
        } else {
            qrImg.style.display = 'none';
            qrLoading.style.display = 'block';
            instructions.style.display = 'none';
        }
    }

    if (data.updatedAt) {
        const date = new Date(data.updatedAt);
        syncTime.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

function updateMessagesUI(data) {
    const feed = document.getElementById('ops-feed');
    feed.innerHTML = '';
    
    // Sort by timestamp descending
    const messages = Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    messages.slice(0, 20).forEach(msg => {
        const div = document.createElement('div');
        div.className = `msg-item ${msg.isReply ? 'reply-item' : ''}`;
        
        const sender = msg.isReply ? 'AIKO ENGINE' : (msg.contact ? msg.contact.split('@')[0] : 'UNKNOWN');
        
        div.innerHTML = `
            <span class="sender">${sender}</span>
            <div class="content">${msg.text}</div>
        `;
        feed.appendChild(div);
    });

    if (messages.length === 0) {
        feed.innerHTML = '<div class="feed-placeholder">No recent activity detected...</div>';
    }
}

// Reset Logic
document.getElementById('reset-system').addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset the WhatsApp connection?')) {
        await set(ref(db, 'status'), {
            status: 'RESET_REQUESTED',
            updatedAt: new Date().toISOString()
        });
        alert('Reset signal sent. The bot will restart and generate a new QR code soon.');
    }
});

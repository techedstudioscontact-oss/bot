<?php
session_start();
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header("Location: index.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aiko Admin Dashboard</title>
    <style>
        body {
            margin: 0; padding: 20px;
            background: #09090b;
            color: #fff;
            font-family: 'Inter', sans-serif;
            display: flex; flex-direction: column; align-items: center;
        }
        .header {
            width: 100%; max-width: 900px;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 20px;
        }
        .header h1 { margin: 0; background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; color: transparent; }
        .dashboard-grid {
            display: grid; grid-template-columns: 1fr 2fr; gap: 20px;
            width: 100%; max-width: 900px;
        }
        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 20px; border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-height: 300px;
        }
        .card h3 { margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;}
        #qr-container { text-align: center; }
                #qr-container img { 
            max-width: 280px; 
            border-radius: 8px; 
            margin-top: 20px; 
            background: #fff; 
            padding: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .status-badge {
            display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 14px; font-weight: bold;
        }
        .status-connected { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e;}
        .status-disconnected { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444;}
        
        #messages-list { list-style: none; padding: 0; margin: 0; height: 240px; overflow-y: auto;}
        #messages-list li {
            padding: 10px; margin-bottom: 10px; border-radius: 8px;
            background: rgba(0,0,0,0.3); border-left: 3px solid #38bdf8;
            font-size: 14px;
        }
        .reply-msg { border-left-color: #4ade80 !important; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Aiko AI Control Panel</h1>
        <div style="display: flex; gap: 15px; align-items: center;">
            <button id="reset-btn" style="background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid #ef4444; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;">Reset Connection</button>
            <a href="logout.php" style="color: #a1a1aa; text-decoration: none; font-size: 14px;">Logout</a>
        </div>
    </div>

    <div class="dashboard-grid">
        <div class="card">
            <h3>Bot Connection</h3>
            <div style="text-align: center; margin-bottom: 20px;">
                <span id="bot-status" class="status-badge status-disconnected">Checking...</span>
            </div>
            
            <div id="qr-container">
                <div id="qr-loading" style="padding: 40px 0; color: #a1a1aa;">
                    <div style="margin-bottom: 15px;">⏳ Initializing Session...</div>
                    <small>If this takes too long, please restart the bot.</small>
                </div>
                <img id="qr-image" src="" alt="WhatsApp QR Code" style="display: none;">
                
                <div id="scan-tips" style="display: none; margin-top: 25px; text-align: left; font-size: 13px; color: #a1a1aa; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px;">
                    <strong style="color: #38bdf8; display: block; margin-bottom: 5px;">How to Link:</strong>
                    1. Open WhatsApp on your phone<br>
                    2. Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong><br>
                    3. Tap on <strong>Link a Device</strong><br>
                    4. Point your phone to this screen to capture the code
                </div>
            </div>
        </div>

        <div class="card">
            <h3>Recent Logs & Messages</h3>
            <ul id="messages-list">
                <li style="color: #a1a1aa; border:none; text-align:center; padding-top: 50px;">
                    Waiting for network activity...
                </li>
            </ul>
        </div>
    </div>

    <!-- Firebase JS SDK setup -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
        import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

        // Actual Firebase Config from Console
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

        // Listen for QR and Bot Status updates (Realtime Database version)
        const statusRef = ref(db, 'status');
        onValue(statusRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const statusBadge = document.getElementById('bot-status');
                if (data.status === 'CONNECTED') {
                    statusBadge.textContent = "CONNECTED (ONLINE)";
                    statusBadge.className = "status-badge status-connected";
                    document.getElementById('qr-image').style.display = 'none';
                    document.getElementById('qr-loading').style.display = 'none';
                } else {
                    statusBadge.textContent = "DISCONNECTED";
                    statusBadge.className = "status-badge status-disconnected";
                    
                    if (data.qrCode) {
                        document.getElementById('qr-image').src = data.qrCode;
                        document.getElementById('qr-image').style.display = 'inline';
                        document.getElementById('qr-loading').style.display = 'none';
                        document.getElementById('scan-tips').style.display = 'block';
                    } else {
                        document.getElementById('qr-image').style.display = 'none';
                        document.getElementById('qr-loading').style.display = 'block';
                        document.getElementById('qr-loading').textContent = 'Waiting for bot to generate QR...';
                        document.getElementById('scan-tips').style.display = 'none';
                    }
                }
            }
        });

        // Listen for Live Messages (Realtime Database version)
        const messagesRef = ref(db, 'messages');
        onValue(messagesRef, (snapshot) => {
            const list = document.getElementById('messages-list');
            list.innerHTML = '';
            const data = snapshot.val();
            if (data) {
                // Realtime DB objects are unordered, so we convert to array and sort by timestamp
                const messagesArray = Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                messagesArray.slice(0, 15).forEach((msg) => {
                    const li = document.createElement('li');
                    if(msg.isReply) li.className = "reply-msg";
                    const num = msg.contact ? msg.contact.split('@')[0] : 'Unknown';
                    li.innerHTML = `<strong>${msg.isReply ? 'Aiko (Bot)' : num}</strong><br/>${msg.text}`;
                    list.appendChild(li);
                });
            }
            if(list.innerHTML === '') {
                list.innerHTML = '<li style="color: #a1a1aa; border:none; text-align:center;">Waiting for new messages...</li>';
            }
        });
    </script>
</body>
</html>

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
        #qr-container img { max-width: 200px; border-radius: 8px; margin-top: 20px; }
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
        <div>
            <form method="POST" style="margin:0;"><a href="logout.php" style="color:#f87171; text-decoration:none;">Logout</a></form>
        </div>
    </div>

    <div class="dashboard-grid">
        <div class="card">
            <h3>Bot Status</h3>
            <div style="text-align: center;">
                <span id="bot-status" class="status-badge status-disconnected">Checking...</span>
            </div>
            
            <div id="qr-container">
                <p style="font-size: 13px; color: #a1a1aa; margin-top: 20px;">If disconnected, scan the QR code below using WhatsApp Linked Devices.</p>
                <img id="qr-image" src="" alt="Waiting for QR..." style="display: none;">
                <div id="qr-loading">Waiting for bot to generate QR...</div>
            </div>
        </div>

        <div class="card">
            <h3>Live Operations</h3>
            <ul id="messages-list">
                <!-- Messages populated by Firebase -->
                <li style="color: #a1a1aa; border:none; text-align:center;">Waiting for new messages...</li>
            </ul>
        </div>
    </div>

    <!-- Firebase JS SDK setup -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
        import { getFirestore, doc, onSnapshot, collection, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
        const db = getFirestore(app);

        // Listen for QR and Bot Status updates
        const statusDoc = doc(db, 'system', 'status');
        onSnapshot(statusDoc, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
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
                    }
                }
            }
        });

        // Listen for Live Messages
        const q = query(collection(db, "messages"), orderBy("timestamp", "desc"), limit(10));
        onSnapshot(q, (snapshot) => {
            const list = document.getElementById('messages-list');
            list.innerHTML = '';
            snapshot.forEach((doc) => {
                const data = doc.data();
                const li = document.createElement('li');
                if(data.isReply) li.className = "reply-msg";
                const num = data.contact.split('@')[0];
                li.innerHTML = `<strong>${data.isReply ? 'Aiko (Bot)' : num}</strong><br/>${data.text}`;
                list.appendChild(li);
            });
            if(list.innerHTML === '') {
                list.innerHTML = '<li style="color: #a1a1aa; border:none; text-align:center;">Waiting for new messages...</li>';
            }
        });
    </script>
</body>
</html>

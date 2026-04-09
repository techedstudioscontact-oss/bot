<?php
session_start();

// Simple hardcoded login for demo purposes
// In production, encrypt this or use a database
$ADMIN_USER = "teched";
$ADMIN_PASS = "admin123";

if (isset($_POST['login'])) {
    if ($_POST['username'] === $ADMIN_USER && $_POST['password'] === $ADMIN_PASS) {
        $_SESSION['logged_in'] = true;
        header("Location: admin.php");
        exit();
    } else {
        $error = "Invalid credentials!";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teched Studios - WhatsApp Admin</title>
    <style>
        body {
            margin: 0; padding: 0;
            background: linear-gradient(135deg, #09090b, #18181b);
            color: #fff;
            font-family: 'Inter', sans-serif;
            display: flex; justify-content: center; align-items: center;
            height: 100vh;
        }
        .login-box {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 40px; border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            width: 320px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        }
        .login-box h2 {
            margin-top: 0; color: #38bdf8;
        }
        input {
            width: 90%; padding: 12px; margin: 10px 0;
            background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255,255,255,0.2);
            color: white; border-radius: 8px; outline: none;
        }
        button {
            width: 100%; padding: 12px; margin-top: 20px;
            background: linear-gradient(90deg, #38bdf8, #818cf8);
            border: none; border-radius: 8px; color: white;
            font-weight: bold; cursor: pointer; transition: 0.3s;
        }
        button:hover { opacity: 0.8; }
        .error { color: #f87171; font-size: 14px; }
    </style>
</head>
<body>
    <div class="login-box">
        <h2>Aiko Admin Portal</h2>
        <p>WhatsApp Automation System</p>
        <?php if(isset($error)) { echo "<p class='error'>$error</p>"; } ?>
        <form method="POST">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit" name="login">Sign In</button>
        </form>
    </div>
</body>
</html>

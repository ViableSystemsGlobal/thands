<?php
// Simple Hostinger SMTP Email handler using environment variables
// Upload this to: your-domain.com/api/send-email.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Required fields from request
    $to = $input['to'] ?? '';
    $subject = $input['subject'] ?? '';
    $message = $input['message'] ?? '';
    
    if (empty($to) || empty($subject) || empty($message)) {
        throw new Exception('Missing required fields: to, subject, message');
    }
    
    // Email configuration from environment variables
    $smtp_host = $_ENV['SMTP_HOST'] ?? 'mail.yourdomain.com';
    $smtp_port = $_ENV['SMTP_PORT'] ?? 587;
    $smtp_username = $_ENV['SMTP_USERNAME'] ?? '';
    $smtp_password = $_ENV['SMTP_PASSWORD'] ?? '';
    $from_email = $_ENV['SMTP_FROM_EMAIL'] ?? '';
    $from_name = $_ENV['SMTP_FROM_NAME'] ?? 'TailoredHands';
    $smtp_secure = $_ENV['SMTP_SECURE'] ?? 'true';
    
    // Validate SMTP configuration
    if (empty($smtp_username) || empty($smtp_password) || empty($from_email)) {
        throw new Exception('SMTP configuration missing in environment variables');
    }
    
    // Create email content
    $html_message = "
    <html>
    <head>
        <title>{$subject}</title>
    </head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div>
            " . nl2br(htmlspecialchars($message)) . "
        </div>
        <br><br>
        <p style='color: #666; font-size: 12px;'>
            Sent from TailoredHands
        </p>
    </body>
    </html>";
    
    // Email headers
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: {$from_name} <{$from_email}>" . "\r\n";
    $headers .= "Reply-To: {$from_email}" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Configure PHP for SMTP
    ini_set('SMTP', $smtp_host);
    ini_set('smtp_port', $smtp_port);
    ini_set('sendmail_from', $from_email);
    
    // Send email
    $mail_sent = mail($to, $subject, $html_message, $headers);
    
    if ($mail_sent) {
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully via Hostinger',
            'service' => 'Hostinger_SMTP',
            'to' => $to,
            'from' => $from_email,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        $error = error_get_last();
        throw new Exception('Email sending failed: ' . ($error['message'] ?? 'Unknown error'));
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?> 
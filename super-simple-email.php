<?php
// Super Simple Email handler for Hostinger
// Uses PHP's built-in mail() - no external libraries needed
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
    
    // Extract email data
    $to = $input['to'] ?? '';
    $subject = $input['subject'] ?? '';
    $message = $input['message'] ?? '';
    $from_email = $input['from_email'] ?? '';
    $from_name = $input['from_name'] ?? 'TailoredHands';
    
    // Validate required fields
    if (empty($to) || empty($subject) || empty($message) || empty($from_email)) {
        throw new Exception('Missing required fields: to, subject, message, from_email');
    }
    
    // Create HTML email content
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
            Sent from TailoredHands Notification System
        </p>
    </body>
    </html>";
    
    // Set email headers
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: {$from_name} <{$from_email}>" . "\r\n";
    $headers .= "Reply-To: {$from_email}" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Send email using PHP's built-in mail() function
    $mail_sent = mail($to, $subject, $html_message, $headers);
    
    if ($mail_sent) {
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully',
            'service' => 'PHP_Mail',
            'to' => $to,
            'from' => $from_email,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        // Get the last error
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
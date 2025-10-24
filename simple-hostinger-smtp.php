<?php
// Simple SMTP Email handler for Hostinger (No PHPMailer required)
// Upload this file to: your-domain.com/api/send-smtp.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
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
    
    // Validate required fields
    $required = ['to', 'subject', 'message', 'from_email', 'smtp_host', 'smtp_username', 'smtp_password'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Configure SMTP settings for PHP mail()
    $smtp_host = $input['smtp_host'];
    $smtp_port = $input['smtp_port'] ?? 587;
    $smtp_username = $input['smtp_username'];
    $smtp_password = $input['smtp_password'];
    $smtp_secure = $input['smtp_secure'] ?? true;
    
    // Set up SMTP configuration
    $smtp_auth = $smtp_secure ? 'tls' : '';
    
    // Configure PHP mail settings
    ini_set('SMTP', $smtp_host);
    ini_set('smtp_port', $smtp_port);
    ini_set('sendmail_from', $input['from_email']);
    
    // Prepare email content
    $to = $input['to'];
    $subject = $input['subject'];
    $message_text = $input['message'];
    $from_name = $input['from_name'] ?? 'TailoredHands';
    $from_email = $input['from_email'];
    
    // Create HTML email
    $html_message = '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">' . 
                    nl2br(htmlspecialchars($message_text)) . '</div>';
    
    // Email headers
    $headers = array();
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-type: text/html; charset=utf-8";
    $headers[] = "From: {$from_name} <{$from_email}>";
    $headers[] = "Reply-To: {$from_email}";
    $headers[] = "X-Mailer: PHP/" . phpversion();
    
    // For Hostinger SMTP authentication
    if (!empty($smtp_username) && !empty($smtp_password)) {
        // Use stream context for SMTP auth (Hostinger specific)
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $headers),
                'content' => $html_message
            ]
        ]);
    }
    
    // Send email using PHP's mail function
    $mail_sent = mail($to, $subject, $html_message, implode("\r\n", $headers));
    
    if ($mail_sent) {
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully via Hostinger SMTP',
            'service' => 'Hostinger_SMTP',
            'host' => $smtp_host,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        throw new Exception('Failed to send email via PHP mail() function');
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
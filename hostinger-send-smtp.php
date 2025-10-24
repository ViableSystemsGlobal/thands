<?php
// SMTP Email handler for Hostinger
// Upload this file to: your-domain.com/api/send-smtp.php
// Requires PHPMailer: composer require phpmailer/phpmailer

require_once 'vendor/autoload.php'; // If using Composer
// OR include PHPMailer files manually if not using Composer:
// require_once 'PHPMailer/src/Exception.php';
// require_once 'PHPMailer/src/PHPMailer.php';
// require_once 'PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

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
    
    // Create PHPMailer instance
    $mail = new PHPMailer(true);
    
    // Server settings
    $mail->isSMTP();
    $mail->Host = $input['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $input['smtp_username'];
    $mail->Password = $input['smtp_password'];
    $mail->Port = $input['smtp_port'] ?? 587;
    
    // Set encryption
    if (isset($input['smtp_secure']) && $input['smtp_secure']) {
        if ($input['smtp_port'] == 465) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }
    }
    
    // Enable debugging in development (disable in production)
    // $mail->SMTPDebug = SMTP::DEBUG_SERVER;
    
    // Recipients
    $mail->setFrom($input['from_email'], $input['from_name'] ?? 'TailoredHands');
    $mail->addAddress($input['to']);
    $mail->addReplyTo($input['from_email'], $input['from_name'] ?? 'TailoredHands');
    
    // Content
    $mail->isHTML(true);
    $mail->Subject = $input['subject'];
    $mail->Body = '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">' . 
                  nl2br(htmlspecialchars($input['message'])) . '</div>';
    $mail->AltBody = strip_tags($input['message']);
    
    // Send email
    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully via SMTP',
        'service' => 'SMTP',
        'host' => $input['smtp_host'],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?> 
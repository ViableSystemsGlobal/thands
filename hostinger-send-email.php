<?php
// Simple SendGrid email handler for Hostinger
// Upload this file to: your-domain.com/api/send-email.php

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
    $required = ['to', 'subject', 'message', 'from_email', 'api_key'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Prepare SendGrid email data
    $emailData = [
        'personalizations' => [
            [
                'to' => [['email' => $input['to']]],
                'subject' => $input['subject']
            ]
        ],
        'from' => [
            'email' => $input['from_email'],
            'name' => $input['from_name'] ?? 'TailoredHands'
        ],
        'content' => [
            [
                'type' => 'text/plain',
                'value' => $input['message']
            ],
            [
                'type' => 'text/html',
                'value' => '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">' . 
                          nl2br(htmlspecialchars($input['message'])) . '</div>'
            ]
        ],
        'reply_to' => [
            'email' => $input['from_email'],
            'name' => $input['from_name'] ?? 'TailoredHands'
        ]
    ];
    
    // Send to SendGrid API
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://api.sendgrid.com/v3/mail/send',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($emailData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $input['api_key']
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception('cURL error: ' . $error);
    }
    
    if ($httpCode >= 200 && $httpCode < 300) {
        // SendGrid success (usually returns 202)
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully via SendGrid',
            'service' => 'SendGrid',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        // SendGrid error
        $errorData = json_decode($response, true);
        $errorMessage = 'SendGrid API error: ' . $httpCode;
        
        if ($errorData && isset($errorData['errors'][0]['message'])) {
            $errorMessage .= ' - ' . $errorData['errors'][0]['message'];
        }
        
        throw new Exception($errorMessage);
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
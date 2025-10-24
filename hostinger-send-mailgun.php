<?php
// Mailgun Email handler for Hostinger
// Upload this file to: your-domain.com/api/send-mailgun.php

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
    $required = ['to', 'subject', 'message', 'from_email', 'api_key', 'domain'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Prepare email data for Mailgun
    $postData = [
        'from' => ($input['from_name'] ?? 'TailoredHands') . ' <' . $input['from_email'] . '>',
        'to' => $input['to'],
        'subject' => $input['subject'],
        'text' => $input['message'],
        'html' => '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">' . 
                  nl2br(htmlspecialchars($input['message'])) . '</div>'
    ];
    
    // Send to Mailgun API
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://api.mailgun.net/v3/' . $input['domain'] . '/messages',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_HTTPHEADER => [
            'Authorization: Basic ' . base64_encode('api:' . $input['api_key'])
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
        // Mailgun success
        $responseData = json_decode($response, true);
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully via Mailgun',
            'service' => 'Mailgun',
            'domain' => $input['domain'],
            'mailgun_id' => $responseData['id'] ?? null,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        // Mailgun error
        $errorData = json_decode($response, true);
        $errorMessage = 'Mailgun API error: ' . $httpCode;
        
        if ($errorData && isset($errorData['message'])) {
            $errorMessage .= ' - ' . $errorData['message'];
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
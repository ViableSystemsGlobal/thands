# 📧 TailoredHands Email Configuration Guide

## 🎯 **Redesigned Email System**

The email system now supports multiple services with a clean dropdown selector:

- **Hostinger SMTP** (Recommended) - Use your hosting email accounts
- **SendGrid API** - Professional email delivery service  
- **Mailgun API** - Developer-friendly with advanced features
- **Generic SMTP** - Works with Gmail, Outlook, etc.

## 🚀 **Setup Instructions**

### **Step 1: Choose Your Email Service**

1. Go to **Admin Panel → Communication → Email Configuration**
2. Select your preferred service from the dropdown
3. Configure the service-specific settings
4. Test your configuration

### **Step 2: Backend Setup**

Upload the corresponding PHP files to your Hostinger server:

#### **For Hostinger SMTP or Generic SMTP:**
```bash
Upload: hostinger-send-smtp.php → /public_html/api/send-smtp.php
```

#### **For SendGrid API:**
```bash
Upload: hostinger-send-email.php → /public_html/api/send-email.php
```

#### **For Mailgun API:**
```bash
Upload: hostinger-send-mailgun.php → /public_html/api/send-mailgun.php
```

### **Step 3: Update Frontend URLs**

In `src/lib/services/email.js`, replace `yourdomain.com` with your actual domain:

```javascript
// Change these URLs:
'https://yourdomain.com/api/send-smtp.php'
'https://yourdomain.com/api/send-email.php'  
'https://yourdomain.com/api/send-mailgun.php'

// To your actual domain:
'https://your-actual-domain.com/api/send-smtp.php'
'https://your-actual-domain.com/api/send-email.php'
'https://your-actual-domain.com/api/send-mailgun.php'
```

## 📋 **Service-Specific Configuration**

### **🏢 Hostinger SMTP (Recommended)**

**Settings needed:**
- SMTP Host: `mail.yourdomain.com`
- Port: `587` (STARTTLS) or `465` (SSL)
- Username: Your full email address
- Password: Your email account password

**Requirements:**
- PHPMailer library (install via Composer or manually)
- Email account created in Hostinger control panel

### **✉️ SendGrid API**

**Settings needed:**
- API Key: Get from SendGrid dashboard

**Setup steps:**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Go to Settings → API Keys  
3. Create "Full Access" API key
4. Verify your sender identity/domain

### **🌐 Mailgun API**

**Settings needed:**
- API Key: Private API key from Mailgun
- Domain: Your Mailgun domain (e.g., `mg.yourdomain.com`)

**Setup steps:**
1. Sign up at [mailgun.com](https://mailgun.com)
2. Add and verify your domain
3. Configure DNS records
4. Get Private API key

### **📬 Generic SMTP**

**Common providers:**

**Gmail:**
- Host: `smtp.gmail.com`
- Port: `587`
- Use App Password (not regular password)

**Outlook/Hotmail:**
- Host: `smtp-mail.outlook.com` 
- Port: `587`
- Use account password

## 🔧 **PHP Dependencies**

### **For SMTP (Hostinger/Generic):**
```bash
# Via Composer (recommended)
composer require phpmailer/phpmailer

# OR download PHPMailer manually and include files
```

### **For SendGrid/Mailgun:**
No additional dependencies - uses cURL (built into PHP)

## ✅ **Testing Your Setup**

1. Complete the configuration in admin panel
2. Enter a test recipient email
3. Click "Send Test Email"  
4. Check for success/error messages
5. Verify email received in recipient's inbox

## 🔍 **Troubleshooting**

### **SMTP Issues:**
- Check SMTP host/port settings
- Verify email account credentials
- Ensure PHPMailer is installed
- Check firewall/port restrictions

### **API Issues:**
- Verify API keys are correct
- Check domain verification status
- Ensure backend PHP files are uploaded
- Check server error logs

### **General Issues:**
- Update frontend URLs to your domain
- Check CORS headers in PHP files
- Verify database email_config table structure
- Check notification_logs for detailed errors

## 🎯 **Benefits of New System**

✅ **Multiple Options** - Choose the best service for your needs  
✅ **Clean Interface** - Simple dropdown selection  
✅ **Real Validation** - Live configuration status  
✅ **Easy Testing** - Built-in test functionality  
✅ **Proper Logging** - All attempts logged to database  
✅ **Production Ready** - Robust error handling  

## 📞 **Support**

If you need help with setup:
1. Check the admin panel status indicators
2. Look at browser console for error messages  
3. Check your server error logs
4. Verify all required fields are filled 
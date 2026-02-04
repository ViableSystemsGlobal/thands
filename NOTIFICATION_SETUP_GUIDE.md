# 📧 Notification System Setup Guide

## ✅ Current Status
The notification system is **fully implemented and functional**! Here's what's working:

- ✅ Database tables created
- ✅ Backend API endpoints working
- ✅ Frontend settings page functional
- ✅ Notification logging system working
- ✅ Automatic triggers for orders, payments, consultations

## 🔧 Configuration Required

### 1. Email Configuration (SMTP)

Add these environment variables to your `.env` file:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use the app password in `SMTP_PASS`

### 2. SMS Configuration (Deywuro)

Add these environment variables to your `.env` file:

```bash
# SMS Configuration
DEYWURO_USERNAME=your-deywuro-username
DEYWURO_PASSWORD=your-deywuro-password
```

**Deywuro Setup:**
1. Sign up at [Deywuro](https://deywuro.com)
2. Get your username and password
3. Add them to your `.env` file

### 3. Paystack Webhook Configuration

**In your Paystack Dashboard:**
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook/paystack`
3. Select events: `charge.success`, `charge.failed`
4. Save the webhook

## 🧪 Testing the System

### Test Notifications Manually

```bash
# Test order confirmation
curl -X POST http://localhost:3003/api/notifications/send/order-confirmation \
  -H "Content-Type: application/json" \
  -d '{"orderId": "your-order-uuid"}'

# Test payment success
curl -X POST http://localhost:3003/api/notifications/send/payment-success \
  -H "Content-Type: application/json" \
  -d '{"orderId": "your-order-uuid", "paymentData": {"reference": "test-ref", "amount": 100}}'
```

### Test via Admin Panel

1. Go to `/admin/communication/notifications`
2. Configure your notification settings
3. Save the settings
4. Check the statistics to see notification logs

## 📊 Notification Types

### Automatic Triggers

1. **Order Confirmation** - When customer places order
2. **Payment Success** - When Paystack confirms payment
3. **Order Shipped** - When admin marks order as shipped
4. **Order Delivered** - When admin marks order as delivered
5. **Consultation Request** - When customer submits consultation form

### Manual Triggers

You can also manually trigger notifications:

```javascript
// In your frontend code
const response = await fetch('/api/notifications/send/order-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: orderId })
});
```

## 🔍 Troubleshooting

### Check Notification Logs

```sql
-- View recent notifications
SELECT * FROM notification_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check notification settings
SELECT * FROM notification_settings;
```

### Common Issues

1. **"Invalid token"** - Authentication issue (fixed)
2. **"sendEmail is not a function"** - Import issue (fixed)
3. **"SMS credentials not configured"** - Add Deywuro credentials
4. **"SMTP authentication failed"** - Check email credentials

### Test Individual Components

```bash
# Test email sending
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your-email@gmail.com', pass: 'your-app-password' }
});
transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'test@example.com',
  subject: 'Test',
  text: 'Test message'
}).then(console.log).catch(console.error);
"

# Test SMS sending
node -e "
const axios = require('axios');
const params = new URLSearchParams({
  username: 'your-username',
  password: 'your-password',
  destination: '233XXXXXXXXX',
  source: 'TailoredHands',
  message: 'Test SMS'
});
axios.get('https://deywuro.com/api/sms?' + params)
  .then(r => console.log(r.data))
  .catch(e => console.error(e.message));
"
```

## 🎯 Next Steps

1. **Configure Email Credentials** - Add SMTP settings to `.env`
2. **Configure SMS Credentials** - Add Deywuro settings to `.env`
3. **Set up Paystack Webhook** - Add webhook URL in Paystack dashboard
4. **Test the System** - Place a test order and verify notifications

## 📱 Notification Content

### Email Templates
- Professional HTML emails with order details
- Customer name, order number, total amount
- Shipping information and tracking details

### SMS Templates
- Concise messages with key information
- Order number, total amount, status updates
- Ghana phone number formatting (233XXXXXXXXX)

## 🔄 Automatic Flow

1. **Customer places order** → Order confirmation email + SMS
2. **Payment processed** → Payment success email + SMS
3. **Admin ships order** → Shipping notification email + SMS
4. **Admin delivers order** → Delivery confirmation email + SMS

The system is now ready to use! Just add your credentials and test with a real order.

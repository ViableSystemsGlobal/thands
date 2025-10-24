# 💳 Paystack Payment Integration Setup Guide

## 🎯 Overview

This guide will help you complete the Paystack payment integration for your Tailored Hands e-commerce store.

## 📋 Prerequisites

1. **Paystack Account**: Sign up at [paystack.com](https://paystack.com)
2. **Test API Keys**: Get your test keys from Paystack Dashboard
3. **Admin Access**: Access to your store's admin panel

## 🔧 Step-by-Step Setup

### Step 1: Configure Paystack Keys

1. **Login to Admin Panel**
   ```
   http://localhost:5173/admin/login
   ```

2. **Navigate to Settings**
   - Go to Settings → Payment Settings
   - Enter your Paystack Public Key
   - Enter your Paystack Secret Key

3. **Test Keys (for development)**
   ```
   Public Key: pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
   Secret Key: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 2: Database Setup

The payment integration requires additional database tables and fields.

**Option A: Automatic Setup (Recommended)**
1. Navigate to Settings → Database Setup (if available)
2. Click "Run Complete Setup"

**Option B: Manual Setup**
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Add payment fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'paystack',
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_completed_at ON orders(payment_completed_at);

-- Create payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  status VARCHAR(20) NOT NULL,
  gateway VARCHAR(50) DEFAULT 'paystack',
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payment logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_number ON payment_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_payment_logs_reference ON payment_logs(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Enable RLS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
```

### Step 3: Test Payment Flow

1. **Add Products to Cart**
   - Go to the shop page
   - Add some products to your cart

2. **Proceed to Checkout**
   - Fill in shipping information
   - Click "Place Order & Proceed to Payment"

3. **Payment Process**
   - Order will be created with "pending" status
   - Paystack payment modal will open
   - Use test card details (see below)

4. **Test Card Details**
   ```
   Card Number: 4084084084084081
   CVV: 408
   Expiry: Any future date (e.g., 12/25)
   Pin: 0000
   OTP: 123456
   ```

### Step 4: Verify Integration

**Check Order Status:**
1. After successful payment, you'll be redirected to success page
2. Order status should change from "pending" to "paid"
3. Check admin panel → Orders for payment details

**Verify Database:**
1. Check `orders` table for `payment_reference` and `payment_completed_at`
2. Check `payment_logs` table for transaction records

## 🚀 Features Included

### ✅ Complete Payment Flow
- Order creation with pending status
- Paystack payment modal integration
- Payment verification
- Automatic order status updates
- Payment success/failure handling

### ✅ Admin Features
- Payment settings configuration
- Order payment status tracking
- Payment reference display
- Database setup tools

### ✅ Customer Experience
- Seamless checkout flow
- Real-time payment processing
- Payment success confirmation
- Order tracking with payment status

### ✅ Security & Reliability
- Payment verification with Paystack API
- Secure API key handling
- Transaction logging
- Error handling and user feedback

## 🔍 Testing Scenarios

### Successful Payment
1. Complete checkout process
2. Use valid test card details
3. Verify order status changes to "paid"
4. Check payment reference is saved

### Failed Payment
1. Use invalid card details or cancel payment
2. Verify order remains in "pending" status
3. Customer can retry payment from order status page

### Payment Retry
1. Go to order status page for pending order
2. Click "Pay Now" button
3. Complete payment process
4. Verify status updates

## 🛠 Troubleshooting

### Common Issues

**Payment Modal Not Opening**
- Check Paystack keys are configured
- Verify internet connection
- Check browser console for errors

**Payment Not Verifying**
- Ensure secret key is correct
- Check payment reference format
- Verify API endpoints are accessible

**Database Errors**
- Run database setup scripts
- Check table permissions
- Verify RLS policies

### Debug Steps

1. **Check Browser Console**
   ```javascript
   // Check for JavaScript errors
   console.log('Payment config loaded');
   ```

2. **Verify API Keys**
   - Test keys should start with `pk_test_` and `sk_test_`
   - Live keys start with `pk_live_` and `sk_live_`

3. **Database Verification**
   ```sql
   -- Check if payment fields exist
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'orders' AND column_name LIKE 'payment%';
   
   -- Check payment logs table
   SELECT * FROM payment_logs LIMIT 5;
   ```

## 📊 Going Live

### Before Production

1. **Switch to Live Keys**
   - Replace test keys with live keys in admin settings
   - Test with small amount first

2. **Webhook Setup** (Optional)
   - Configure Paystack webhooks for real-time updates
   - Set webhook URL to your domain + `/api/webhook/paystack`

3. **Security Review**
   - Ensure SSL is enabled
   - Verify RLS policies are active
   - Test payment flow thoroughly

### Production Checklist

- [ ] Live Paystack keys configured
- [ ] SSL certificate installed
- [ ] Database backup completed
- [ ] Payment flow tested
- [ ] Error monitoring setup
- [ ] Customer notification emails working

## 🎉 Success!

Your Paystack payment integration is now complete! Customers can:

- Add products to cart
- Complete secure checkout
- Pay with cards, bank transfer, or mobile money
- Receive payment confirmations
- Track order status with payment information

## 🆘 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify Paystack dashboard for transaction logs
3. Review database logs for payment records
4. Test with different browsers/devices

## 🔗 Useful Links

- [Paystack Documentation](https://paystack.com/docs)
- [Test Cards Reference](https://paystack.com/docs/payments/test-payments)
- [Paystack Dashboard](https://dashboard.paystack.com)
- [React Paystack Docs](https://github.com/iamraphson/react-paystack) 
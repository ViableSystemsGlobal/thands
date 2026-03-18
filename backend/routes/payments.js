const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Paystack webhook handler
router.post('/webhook/paystack', async (req, res) => {
  try {
    // Verify Paystack webhook signature
    const signature = req.headers['x-paystack-signature'];
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      console.error('❌ PAYSTACK_SECRET_KEY not configured — cannot verify webhook');
      return res.status(500).json({ error: 'Webhook verification not configured' });
    }

    if (!signature) {
      console.error('❌ Missing x-paystack-signature header');
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    // Compute expected HMAC-SHA512 signature
    const rawBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    console.log('💰 Paystack Webhook Received (verified):', req.body);

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const { reference, amount, customer, metadata } = data;
      
      console.log('✅ Payment successful for reference:', reference);
      console.log('💰 Amount:', amount);
      console.log('👤 Customer:', customer);

      // Find the order by payment reference
      const orderResult = await query(
        'SELECT * FROM orders WHERE payment_reference = $1',
        [reference]
      );

      if (orderResult.rows.length === 0) {
        console.log('❌ Order not found for reference:', reference);
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult.rows[0];

      // Update order payment status
      await query(
        'UPDATE orders SET payment_status = $1, status = $2, updated_at = NOW() WHERE id = $3',
        ['paid', 'confirmed', order.id]
      );

      console.log('✅ Order payment status updated for order:', order.order_number);

      // Send payment success notification
      try {
        const notificationResponse = await fetch(`${'http://localhost:' + (process.env.PORT || 3003)}/api/notifications/send/payment-success`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}` // You might need to adjust this
          },
          body: JSON.stringify({
            orderId: order.id,
            paymentData: {
              reference: reference,
              amount: amount,
              customer: customer
            }
          })
        });

        if (notificationResponse.ok) {
          console.log('📧 Payment success notification sent');
        } else {
          console.error('❌ Failed to send payment success notification');
        }
      } catch (notificationError) {
        console.error('❌ Error sending payment success notification:', notificationError);
      }

      // Send admin notification for new order
      try {
        console.log('📧 [PAYMENT WEBHOOK] Sending admin order notification for order:', order.id);
        console.log('📧 [PAYMENT WEBHOOK] Order details:', {
          order_number: order.order_number,
          order_id: order.id,
          payment_status: order.payment_status
        });
        
        // Use direct function call instead of HTTP to avoid network issues
        const notificationsModule = require('./notifications');
        console.log('📧 [PAYMENT WEBHOOK] Notifications module loaded:', typeof notificationsModule.sendAdminOrderNotification);
        
        if (typeof notificationsModule.sendAdminOrderNotification === 'function') {
          const result = await notificationsModule.sendAdminOrderNotification(order.id);
          console.log('✅ [PAYMENT WEBHOOK] Admin order notification result:', result);
        } else {
          console.error('❌ [PAYMENT WEBHOOK] sendAdminOrderNotification is not a function');
          // Fallback to HTTP call
          const adminNotificationResponse = await fetch(`${'http://localhost:' + (process.env.PORT || 3003)}/api/notifications/send/admin/order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderId: order.id
            })
          });
          const adminNotificationData = await adminNotificationResponse.json().catch(() => ({}));
          console.log('✅ [PAYMENT WEBHOOK] Admin order notification (HTTP fallback):', adminNotificationData);
        }
      } catch (adminNotificationError) {
        console.error('❌ [PAYMENT WEBHOOK] Error sending admin order notification:', adminNotificationError.message || adminNotificationError);
        console.error('❌ [PAYMENT WEBHOOK] Admin notification error stack:', adminNotificationError.stack);
        // Don't fail payment processing if admin notification fails
      }

      res.json({ success: true, message: 'Payment processed successfully' });
    } else if (event === 'charge.failed') {
      console.log('❌ Payment failed for reference:', data.reference);
      
      // Find and update order status
      const orderResult = await query(
        'SELECT * FROM orders WHERE payment_reference = $1',
        [data.reference]
      );

      if (orderResult.rows.length > 0) {
        await query(
          'UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2',
          ['failed', orderResult.rows[0].id]
        );
        console.log('❌ Order payment status updated to failed');
      }

      res.json({ success: true, message: 'Payment failure processed' });
    } else {
      console.log('ℹ️ Unhandled Paystack event:', event);
      res.json({ success: true, message: 'Event received but not processed' });
    }

  } catch (error) {
    console.error('❌ Paystack webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Manual payment confirmation endpoint (admin only)
router.post('/confirm/:orderId', authenticateToken, async (req, res) => {
  const adminRoles = ['super_admin', 'admin', 'manager'];
  if (!adminRoles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { orderId } = req.params;
    const { paymentReference, amount } = req.body;

    console.log('💰 Manual payment confirmation for order:', orderId);

    // Update order payment status
    const result = await query(
      'UPDATE orders SET payment_status = $1, status = $2, payment_reference = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      ['paid', 'confirmed', paymentReference, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];
    console.log('✅ Order payment confirmed:', order.order_number);

    // Send payment success notification (customer)
    try {
      const notificationResponse = await fetch(`${'http://localhost:' + (process.env.PORT || 3003)}/api/notifications/send/payment-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentData: {
            reference: paymentReference,
            amount: amount
          }
        })
      });

      if (notificationResponse.ok) {
        console.log('📧 Payment success notification sent');
      } else {
        console.error('❌ Failed to send payment success notification');
      }
    } catch (notificationError) {
      console.error('❌ Error sending payment success notification:', notificationError);
    }

    // Send admin notification for new order
    try {
      console.log('📧 [MANUAL PAYMENT CONFIRM] Sending admin order notification for order:', order.id);
      const { sendAdminOrderNotification } = require('./notifications');
      if (typeof sendAdminOrderNotification === 'function') {
        const result = await sendAdminOrderNotification(order.id);
        console.log('✅ [MANUAL PAYMENT CONFIRM] Admin order notification result:', result);
      } else {
        console.error('❌ [MANUAL PAYMENT CONFIRM] sendAdminOrderNotification is not a function');
      }
    } catch (adminNotificationError) {
      console.error('❌ [MANUAL PAYMENT CONFIRM] Error sending admin order notification:', adminNotificationError.message || adminNotificationError);
    }

    res.json({ success: true, order: order });

  } catch (error) {
    console.error('❌ Manual payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

module.exports = router;

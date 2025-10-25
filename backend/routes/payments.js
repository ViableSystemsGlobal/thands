const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Paystack webhook handler
router.post('/webhook/paystack', async (req, res) => {
  try {
    console.log('💰 Paystack Webhook Received:', req.body);

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
        const notificationResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3003'}/api/notifications/send/payment-success`, {
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

// Manual payment confirmation endpoint (for testing)
router.post('/confirm/:orderId', async (req, res) => {
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

    // Send payment success notification
    try {
      const notificationResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3003'}/api/notifications/send/payment-success`, {
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

    res.json({ success: true, order: order });

  } catch (error) {
    console.error('❌ Manual payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

module.exports = router;

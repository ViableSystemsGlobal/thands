const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

/**
 * Handle Shippo webhooks for tracking updates
 * POST /api/shippo/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    console.log('📦 Shippo Webhook: Received event:', event);
    console.log('📦 Shippo Webhook: Data:', JSON.stringify(data, null, 2));

    // Verify webhook signature (optional but recommended)
    const signature = req.headers['x-shippo-signature'];
    if (process.env.SHIPPO_WEBHOOK_SECRET && signature) {
      // In production, verify the signature here
      console.log('🔐 Shippo Webhook: Signature verification would happen here');
    }

    switch (event) {
      case 'transaction.updated':
        await handleTransactionUpdate(data);
        break;
        
      case 'track.updated':
        await handleTrackingUpdate(data);
        break;
        
      case 'shipment.updated':
        await handleShipmentUpdate(data);
        break;
        
      default:
        console.log('📦 Shippo Webhook: Unhandled event type:', event);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('❌ Shippo webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Webhook processing failed' 
    });
  }
});

/**
 * Handle transaction updates (label creation, status changes)
 */
async function handleTransactionUpdate(data) {
  try {
    const { object_id, status, tracking_number, carrier, servicelevel } = data;
    
    console.log('📦 Transaction Update:', {
      id: object_id,
      status,
      tracking: tracking_number,
      carrier: carrier,
      service: servicelevel?.name
    });

    // Find order by tracking number or rate ID
    let orderResult;
    if (tracking_number) {
      orderResult = await query(
        'SELECT * FROM orders WHERE tracking_number = $1',
        [tracking_number]
      );
    } else {
      orderResult = await query(
        'SELECT * FROM orders WHERE shipping_rate_id = $1',
        [object_id]
      );
    }

    if (orderResult.rows.length === 0) {
      console.log('⚠️  No order found for transaction:', object_id);
      return;
    }

    const order = orderResult.rows[0];

    // Update order based on transaction status
    let newStatus = order.status;
    switch (status) {
      case 'SUCCESS':
        newStatus = 'shipped';
        break;
      case 'ERROR':
        newStatus = 'processing'; // Keep as processing if label creation failed
        break;
      case 'REFUNDED':
        newStatus = 'cancelled';
        break;
    }

    // Update order with new information
    await query(
      `UPDATE orders SET 
        status = $1,
        tracking_number = $2,
        shipping_carrier = $3,
        shipping_service = $4,
        updated_at = NOW()
      WHERE id = $5`,
      [
        newStatus,
        tracking_number || order.tracking_number,
        carrier || order.shipping_carrier,
        servicelevel?.name || order.shipping_service,
        order.id
      ]
    );

    console.log(`✅ Order ${order.order_number} updated: ${order.status} -> ${newStatus}`);

    // Log the webhook event
    await query(`
      INSERT INTO notification_logs (type, recipient, method, status, order_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'shipping_webhook',
      order.shipping_email || order.customer_email,
      'webhook',
      'processed',
      order.id
    ]);

  } catch (error) {
    console.error('❌ Transaction update error:', error);
  }
}

/**
 * Handle tracking updates
 */
async function handleTrackingUpdate(data) {
  try {
    const { tracking_number, status, location } = data;
    
    console.log('📦 Tracking Update:', {
      tracking: tracking_number,
      status,
      location: location?.city + ', ' + location?.state
    });

    // Find order by tracking number
    const orderResult = await query(
      'SELECT * FROM orders WHERE tracking_number = $1',
      [tracking_number]
    );

    if (orderResult.rows.length === 0) {
      console.log('⚠️  No order found for tracking number:', tracking_number);
      return;
    }

    const order = orderResult.rows[0];

    // Update order status based on tracking status
    let newStatus = order.status;
    switch (status) {
      case 'TRANSIT':
        newStatus = 'shipped';
        break;
      case 'DELIVERED':
        newStatus = 'delivered';
        break;
      case 'FAILURE':
        newStatus = 'processing'; // Handle delivery failure
        break;
    }

    if (newStatus !== order.status) {
      await query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
        [newStatus, order.id]
      );

      console.log(`✅ Order ${order.order_number} status updated: ${order.status} -> ${newStatus}`);

      // Send notification to customer if delivered
      if (newStatus === 'delivered') {
        try {
          const notificationResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3003'}/api/notifications/send/order-delivered`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`
            },
            body: JSON.stringify({
              orderId: order.id
            })
          });

          if (notificationResponse.ok) {
            console.log('📧 Delivery notification sent for order:', order.order_number);
          }
        } catch (notificationError) {
          console.error('❌ Failed to send delivery notification:', notificationError);
        }
      }
    }

  } catch (error) {
    console.error('❌ Tracking update error:', error);
  }
}

/**
 * Handle shipment updates
 */
async function handleShipmentUpdate(data) {
  try {
    const { object_id, status, rates } = data;
    
    console.log('📦 Shipment Update:', {
      id: object_id,
      status,
      ratesCount: rates?.length || 0
    });

    // This could be used to update shipping rates or handle shipment status changes
    // For now, we'll just log it
    console.log('📦 Shipment update processed for shipment:', object_id);

  } catch (error) {
    console.error('❌ Shipment update error:', error);
  }
}

/**
 * Test webhook endpoint
 * GET /api/shippo/test
 */
router.get('/test', async (req, res) => {
  try {
    // Test webhook processing
    const testData = {
      event: 'transaction.updated',
      data: {
        object_id: 'test-transaction-id',
        status: 'SUCCESS',
        tracking_number: 'TEST123456789',
        carrier: 'DHL Express',
        servicelevel: { name: 'Express' }
      }
    };

    await handleTransactionUpdate(testData.data);

    res.json({ 
      success: true, 
      message: 'Test webhook processed successfully' 
    });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

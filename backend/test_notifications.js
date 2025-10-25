const { query } = require('./config/database');

async function testNotifications() {
  try {
    console.log('🧪 Testing notification system...');

    // Get the most recent order
    const orderResult = await query(`
      SELECT o.*, c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 1
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ No orders found');
      return;
    }

    const order = orderResult.rows[0];
    console.log(`📦 Testing with order: ${order.order_number}`);
    console.log(`👤 Customer: ${order.shipping_first_name} ${order.shipping_last_name}`);
    console.log(`📧 Email: ${order.shipping_email}`);
    console.log(`📱 Phone: ${order.shipping_phone}`);

    // Test order confirmation notification
    console.log('\n📧 Testing order confirmation notification...');
    try {
      const response = await fetch('http://localhost:3003/api/notifications/send/order-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          orderId: order.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Order confirmation notification sent:', result);
      } else {
        console.log('❌ Order confirmation failed:', response.status, await response.text());
      }
    } catch (error) {
      console.log('❌ Order confirmation error:', error.message);
    }

    // Test payment success notification
    console.log('\n💰 Testing payment success notification...');
    try {
      const response = await fetch('http://localhost:3003/api/notifications/send/payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentData: {
            reference: 'TEST-' + Date.now(),
            amount: order.base_total
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Payment success notification sent:', result);
      } else {
        console.log('❌ Payment success failed:', response.status, await response.text());
      }
    } catch (error) {
      console.log('❌ Payment success error:', error.message);
    }

    // Check notification logs
    console.log('\n📊 Checking notification logs...');
    const logsResult = await query('SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 5');
    console.log('Recent notification logs:');
    logsResult.rows.forEach(log => {
      console.log(`- ${log.type} to ${log.recipient} via ${log.method}: ${log.status}`);
    });

  } catch (error) {
    console.error('❌ Test error:', error);
  }
  process.exit(0);
}

testNotifications();

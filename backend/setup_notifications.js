const { query } = require('./config/database');

async function setupNotificationTables() {
  try {
    console.log('📧 Setting up notification tables...');

    // Create notification settings table
    await query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id SERIAL PRIMARY KEY,
        email_enabled BOOLEAN DEFAULT true,
        sms_enabled BOOLEAN DEFAULT true,
        order_confirmation_email BOOLEAN DEFAULT true,
        order_confirmation_sms BOOLEAN DEFAULT true,
        payment_success_email BOOLEAN DEFAULT true,
        payment_success_sms BOOLEAN DEFAULT true,
        order_shipped_email BOOLEAN DEFAULT true,
        order_shipped_sms BOOLEAN DEFAULT true,
        order_delivered_email BOOLEAN DEFAULT true,
        order_delivered_sms BOOLEAN DEFAULT false,
        gift_voucher_email BOOLEAN DEFAULT true,
        gift_voucher_sms BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create notification logs table
    await query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        method VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        error_message TEXT,
        order_id INTEGER,
        consultation_id INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_order_id ON notification_logs(order_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_consultation_id ON notification_logs(consultation_id)
    `);

    // Insert default settings if none exist
    const existingSettings = await query('SELECT COUNT(*) as count FROM notification_settings');
    if (parseInt(existingSettings.rows[0].count) === 0) {
      await query(`
        INSERT INTO notification_settings (
          email_enabled, sms_enabled, order_confirmation_email, order_confirmation_sms,
          payment_success_email, payment_success_sms, order_shipped_email, order_shipped_sms,
          order_delivered_email, order_delivered_sms, gift_voucher_email, gift_voucher_sms
        ) VALUES (true, true, true, true, true, true, true, true, true, false, true, false)
      `);
      console.log('✅ Default notification settings created');
    }

    console.log('✅ Notification tables setup completed successfully');

  } catch (error) {
    console.error('❌ Error setting up notification tables:', error);
    throw error;
  }
}

// Run the setup
setupNotificationTables()
  .then(() => {
    console.log('🎉 Notification setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });

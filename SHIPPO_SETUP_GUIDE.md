# Shippo Integration Setup Guide

This guide will help you set up Shippo API integration for international shipping in your TailoredHands application.

## Prerequisites

1. **Shippo Account**: Sign up at [shippo.com](https://shippo.com)
2. **API Keys**: Get your API key from the Shippo dashboard
3. **Webhook URL**: Set up webhook endpoints for tracking updates

## Step 1: Get Shippo API Credentials

1. Go to [Shippo Dashboard](https://goshippo.com/dashboard/)
2. Navigate to **Settings** → **API Keys**
3. Create a new API key or use the existing one
4. Copy your **API Key** and **Webhook Secret**

## Step 2: Configure Environment Variables

Add the following to your `.env` file in the backend directory:

```env
# Shippo Configuration
SHIPPO_API_KEY=your_shippo_api_key_here
SHIPPO_WEBHOOK_SECRET=your_shippo_webhook_secret_here
SHIPPO_FROM_NAME=TailoredHands
SHIPPO_FROM_STREET=123 Business Street
SHIPPO_FROM_CITY=Accra
SHIPPO_FROM_STATE=Greater Accra
SHIPPO_FROM_ZIP=00233
SHIPPO_FROM_COUNTRY=GH
```

## Step 3: Set Up Webhooks

1. In your Shippo dashboard, go to **Settings** → **Webhooks**
2. Add a new webhook with the following URL:
   ```
   https://yourdomain.com/api/shippo/webhook
   ```
3. Select the following events:
   - `transaction.updated`
   - `track.updated`
   - `shipment.updated`

## Step 4: Test the Integration

### Test API Connection
```bash
curl -X GET "http://localhost:3003/api/shipping/carriers/US" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Webhook (Development)
```bash
curl -X GET "http://localhost:3003/api/shippo/test"
```

## Step 5: Database Setup

The shipping fields have been automatically added to your orders table. You can verify this by checking:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE 'shipping_%';
```

## Features Available

### 1. **Shipping Rate Calculation**
- Get real-time shipping rates for international orders
- Support for multiple carriers (DHL, FedEx, UPS, etc.)
- Automatic currency conversion

### 2. **Label Generation**
- Create shipping labels directly from the admin panel
- Download PDF labels
- Automatic tracking number assignment

### 3. **Order Management Integration**
- International orders require tracking numbers before marking as "shipped"
- Automatic status updates via webhooks
- Customer notifications for shipping updates

### 4. **Admin Interface**
- Manage shipping for international orders
- View shipping rates and select carriers
- Track shipments and download labels

## API Endpoints

### Shipping Routes
- `POST /api/shipping/rates` - Get shipping rates for an order
- `POST /api/shipping/label` - Create shipping label
- `GET /api/shipping/track/:trackingNumber` - Track shipment
- `GET /api/shipping/international` - Get international orders
- `GET /api/shipping/needing-labels` - Get orders needing labels
- `POST /api/shipping/validate-address` - Validate shipping address
- `GET /api/shipping/carriers/:countryCode` - Get supported carriers

### Webhook Routes
- `POST /api/shippo/webhook` - Handle Shippo webhooks
- `GET /api/shippo/test` - Test webhook processing

## Usage Examples

### 1. Get Shipping Rates
```javascript
const response = await fetch('/api/shipping/rates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    orderId: 'order-uuid',
    address: {
      name: 'John Doe',
      street1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US'
    }
  })
});
```

### 2. Create Shipping Label
```javascript
const response = await fetch('/api/shipping/label', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    orderId: 'order-uuid',
    rateId: 'shippo_rate_id'
  })
});
```

## Troubleshooting

### Common Issues

1. **"Shippo is not configured" Error**
   - Check that `SHIPPO_API_KEY` is set in your `.env` file
   - Restart your backend server after adding the environment variable

2. **No Shipping Rates Available**
   - Verify the destination address is complete and valid
   - Check that the origin address (Ghana) is properly configured
   - Ensure the package dimensions and weight are reasonable

3. **Webhook Not Receiving Updates**
   - Verify the webhook URL is accessible from the internet
   - Check that the webhook secret matches your configuration
   - Ensure the webhook events are properly selected in Shippo dashboard

4. **Label Creation Fails**
   - Verify the rate ID is valid and not expired
   - Check that the order has all required shipping information
   - Ensure the package dimensions are within carrier limits

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed logs for shipping operations.

## Security Considerations

1. **API Key Security**: Never commit your Shippo API key to version control
2. **Webhook Security**: Verify webhook signatures in production
3. **Rate Limiting**: Shippo has rate limits; implement caching for frequently requested data
4. **Data Privacy**: Ensure customer shipping data is handled according to privacy regulations

## Cost Management

1. **Rate Caching**: Cache shipping rates to avoid repeated API calls
2. **Label Optimization**: Only create labels when orders are confirmed
3. **Webhook Efficiency**: Process webhook events asynchronously to avoid timeouts

## Support

- **Shippo Documentation**: [docs.goshippo.com](https://docs.goshippo.com)
- **Shippo Support**: Available through their dashboard
- **API Status**: Check [status.goshippo.com](https://status.goshippo.com) for service updates

## Next Steps

1. Test the integration with a small order
2. Set up monitoring for shipping operations
3. Configure customer notifications for shipping updates
4. Implement shipping cost calculation in your pricing
5. Set up automated label creation for confirmed orders

---

**Note**: This integration is designed for international shipping only. Domestic orders within Ghana will continue to use your existing shipping methods.

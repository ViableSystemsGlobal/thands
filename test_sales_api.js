const fetch = require('node-fetch');

async function testSalesAPI() {
  try {
    console.log('🧪 Testing Sales API...');
    
    // Test the sales test endpoint first
    const testResponse = await fetch('http://localhost:3003/api/sales/test', {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // You'll need to replace this with a real token
      }
    });
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Sales Test Endpoint:', testData);
    } else {
      console.log('❌ Sales Test Failed:', testResponse.status, await testResponse.text());
    }
    
    // Test the analytics endpoint
    const analyticsResponse = await fetch('http://localhost:3003/api/sales/analytics?start_date=2024-01-01&end_date=2024-12-31', {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // You'll need to replace this with a real token
      }
    });
    
    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      console.log('✅ Sales Analytics:', analyticsData);
    } else {
      console.log('❌ Sales Analytics Failed:', analyticsResponse.status, await analyticsResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

testSalesAPI();

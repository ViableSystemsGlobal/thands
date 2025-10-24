const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const router = express.Router();

// Get sales analytics and reports (Admin only)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Sales Analytics: Request received');

    // Check if user is admin
    const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
    if (!adminRoles.includes(req.user.role)) {
      console.log('❌ Sales Analytics: Admin access required');
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('✅ Sales Analytics: Admin access confirmed');

    const {
      start_date,
      end_date,
      comparison_start_date,
      comparison_end_date
    } = req.query;

    console.log('📅 Sales Analytics: Date filters:', {
      start_date,
      end_date,
      comparison_start_date,
      comparison_end_date
    });

    // Build current period query
    let currentParams = [];
    let currentParamCount = 0;
    let currentQuery = `
      SELECT 
        o.*,
        c.first_name,
        c.last_name,
        c.email as customer_email,
        oi.quantity,
        oi.price as item_price,
        p.name as product_name,
        p.category as product_category
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 1=1
    `;

    // Add date filters for current period
    if (start_date) {
      currentParamCount++;
      currentQuery += ` AND o.created_at >= $${currentParamCount}`;
      currentParams.push(start_date);
    }
    if (end_date) {
      currentParamCount++;
      currentQuery += ` AND o.created_at <= $${currentParamCount}`;
      currentParams.push(end_date);
    }

    currentQuery += ' ORDER BY o.created_at DESC';

    // Build comparison period query
    let comparisonParams = [];
    let comparisonParamCount = 0;
    let comparisonQuery = `
      SELECT 
        o.*,
        c.first_name,
        c.last_name,
        c.email as customer_email,
        oi.quantity,
        oi.price as item_price,
        p.name as product_name,
        p.category as product_category
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 1=1
    `;

    // Add date filters for comparison period
    if (comparison_start_date) {
      comparisonParamCount++;
      comparisonQuery += ` AND o.created_at >= $${comparisonParamCount}`;
      comparisonParams.push(comparison_start_date);
    }
    if (comparison_end_date) {
      comparisonParamCount++;
      comparisonQuery += ` AND o.created_at <= $${comparisonParamCount}`;
      comparisonParams.push(comparison_end_date);
    }

    comparisonQuery += ' ORDER BY o.created_at DESC';

    console.log('📦 Sales Analytics: Fetching current period orders...');
    const currentResult = await query(currentQuery, currentParams);
    const currentOrders = currentResult.rows;

    console.log('📦 Sales Analytics: Fetching comparison period orders...');
    const comparisonResult = await query(comparisonQuery, comparisonParams);
    const comparisonOrders = comparisonResult.rows;

    console.log('✅ Sales Analytics: Orders fetched:', {
      current: currentOrders.length,
      comparison: comparisonOrders.length
    });

    // Calculate current period metrics
    const currentSales = currentOrders.reduce((sum, order) => sum + (parseFloat(order.base_total) || 0), 0);
    const currentOrdersCount = new Set(currentOrders.map(o => o.id)).size; // Unique orders
    const currentAOV = currentOrdersCount > 0 ? currentSales / currentOrdersCount : 0;
    const currentUniqueCustomers = new Set(currentOrders.map(o => o.customer_id).filter(Boolean)).size;

    // Calculate comparison period metrics
    const comparisonSales = comparisonOrders.reduce((sum, order) => sum + (parseFloat(order.base_total) || 0), 0);
    const comparisonOrdersCount = new Set(comparisonOrders.map(o => o.id)).size;
    const comparisonAOV = comparisonOrdersCount > 0 ? comparisonSales / comparisonOrdersCount : 0;
    const comparisonUniqueCustomers = new Set(comparisonOrders.map(o => o.customer_id).filter(Boolean)).size;

    // Calculate percentage changes
    const salesChange = comparisonSales > 0 ? ((currentSales - comparisonSales) / comparisonSales) * 100 : 0;
    const ordersChange = comparisonOrdersCount > 0 ? ((currentOrdersCount - comparisonOrdersCount) / comparisonOrdersCount) * 100 : 0;
    const aovChange = comparisonAOV > 0 ? ((currentAOV - comparisonAOV) / comparisonAOV) * 100 : 0;
    const customersChange = comparisonUniqueCustomers > 0 ? ((currentUniqueCustomers - comparisonUniqueCustomers) / comparisonUniqueCustomers) * 100 : 0;

    // Calculate refund rate (simplified)
    const refundedOrders = currentOrders.filter(order => order.status === 'cancelled').length;
    const refundRate = currentOrdersCount > 0 ? (refundedOrders / currentOrdersCount) * 100 : 0;

    // Generate time series data
    const timeSeriesData = generateTimeSeriesData(currentOrders, start_date, end_date);

    // Generate category data
    const categoryData = generateCategoryData(currentOrders);

    // Generate product performance data
    const productData = generateProductPerformanceData(currentOrders);

    // Generate payment method data
    const paymentData = generatePaymentMethodData(currentOrders);

    // Generate recent transactions
    const recentTransactions = generateRecentTransactions(currentOrders);

    // Generate top customers
    const topCustomers = generateTopCustomers(currentOrders);

    const analytics = {
      metrics: {
        totalSales: currentSales,
        totalSalesChange: salesChange,
        averageOrderValue: currentAOV,
        averageOrderValueChange: aovChange,
        totalOrders: currentOrdersCount,
        totalOrdersChange: ordersChange,
        uniqueCustomers: currentUniqueCustomers,
        uniqueCustomersChange: customersChange,
        conversionRate: 0, // Would need website traffic data
        conversionRateChange: 0,
        refundRate: refundRate,
        refundRateChange: 0
      },
      charts: {
        timeSeries: timeSeriesData,
        category: categoryData,
        productPerformance: productData,
        paymentMethods: paymentData
      },
      tables: {
        recentTransactions,
        topCustomers
      }
    };

    console.log('✅ Sales Analytics: Analytics generated:', {
      totalSales: currentSales,
      totalOrders: currentOrdersCount,
      uniqueCustomers: currentUniqueCustomers
    });

    res.json(analytics);

  } catch (error) {
    console.error('❌ Sales Analytics Error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch sales analytics', details: error.message });
  }
});

// Helper function to generate time series data
const generateTimeSeriesData = (orders, startDate, endDate) => {
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  const labels = [];
  const dataPoints = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === dateStr;
    });
    
    const daySales = dayOrders.reduce((sum, order) => sum + (parseFloat(order.base_total) || 0), 0);
    dataPoints.push(daySales);
  }

  return {
    labels,
    datasets: [{
      label: 'Sales Revenue',
      data: dataPoints,
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };
};

// Helper function to generate category data
const generateCategoryData = (orders) => {
  const categorySales = {};
  
  orders.forEach(order => {
    if (order.product_category) {
      categorySales[order.product_category] = (categorySales[order.product_category] || 0) + (parseFloat(order.item_price) * order.quantity);
    }
  });

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  return {
    labels: Object.keys(categorySales),
    datasets: [{
      label: 'Sales by Category',
      data: Object.values(categorySales),
      backgroundColor: colors.slice(0, Object.keys(categorySales).length)
    }]
  };
};

// Helper function to generate product performance data
const generateProductPerformanceData = (orders) => {
  const productSales = {};
  
  orders.forEach(order => {
    if (order.product_name) {
      productSales[order.product_name] = (productSales[order.product_name] || 0) + (parseFloat(order.item_price) * order.quantity);
    }
  });

  const sortedProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return {
    labels: sortedProducts.map(([name]) => name.length > 20 ? name.substring(0, 20) + '...' : name),
    datasets: [{
      label: 'Revenue',
      data: sortedProducts.map(([,sales]) => sales),
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
      borderWidth: 1
    }]
  };
};

// Helper function to generate payment method data
const generatePaymentMethodData = (orders) => {
  const paymentMethods = {};
  
  orders.forEach(order => {
    const method = order.payment_method || 'Unknown';
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;
  });

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return {
    labels: Object.keys(paymentMethods),
    datasets: [{
      label: 'Orders by Payment Method',
      data: Object.values(paymentMethods),
      backgroundColor: colors.slice(0, Object.keys(paymentMethods).length)
    }]
  };
};

// Helper function to generate recent transactions
const generateRecentTransactions = (orders) => {
  // Get unique orders (not order items)
  const uniqueOrders = [];
  const seenOrderIds = new Set();
  
  orders.forEach(order => {
    if (!seenOrderIds.has(order.id)) {
      seenOrderIds.add(order.id);
      uniqueOrders.push(order);
    }
  });

  return uniqueOrders
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map(order => ({
      id: order.order_number || order.id,
      amount: parseFloat(order.base_total) || 0,
      date: order.created_at,
      customer: order.first_name && order.last_name 
        ? `${order.first_name} ${order.last_name}`
        : order.customer_email || 'Guest',
      status: order.status,
      payment_method: order.payment_method || 'Unknown'
    }));
};

// Helper function to generate top customers
const generateTopCustomers = (orders) => {
  const customerSales = {};
  
  // Get unique orders (not order items)
  const uniqueOrders = [];
  const seenOrderIds = new Set();
  
  orders.forEach(order => {
    if (!seenOrderIds.has(order.id)) {
      seenOrderIds.add(order.id);
      uniqueOrders.push(order);
    }
  });

  uniqueOrders.forEach(order => {
    const customerId = order.customer_id || 'guest';
    const customerName = order.first_name && order.last_name
      ? `${order.first_name} ${order.last_name}`
      : order.customer_email || 'Guest Customer';
    
    if (!customerSales[customerId]) {
      customerSales[customerId] = {
        name: customerName,
        email: order.customer_email || 'N/A',
        totalSpent: 0,
        orderCount: 0
      };
    }
    
    customerSales[customerId].totalSpent += parseFloat(order.base_total) || 0;
    customerSales[customerId].orderCount += 1;
  });

  return Object.values(customerSales)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);
};

module.exports = router;

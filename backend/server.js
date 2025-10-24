const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { createSocketServer } = require('./socketServer');
require('dotenv').config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images) - without helmet middleware
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// API endpoint for serving images with optimization
app.use('/api/images', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, require('./middleware/imageOptimization'), express.static('uploads'));

// Rate limiting (increased for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/chat-leads', require('./routes/chatLeads'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/product-sizes', require('./routes/productSizes'));
// IMPORTANT: Specific routes must come before general routes
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/email', require('./routes/email'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/gift-vouchers', require('./routes/giftVouchers'));
app.use('/api/knowledge-base', require('./routes/knowledgeBase'));

// Public exchange rate endpoint
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query('SELECT exchange_rate_ghs FROM settings LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.json({ exchange_rate: 16.0 }); // Default fallback
    }

    res.json({ 
      exchange_rate: parseFloat(result.rows[0].exchange_rate_ghs) || 16.0 
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.json({ exchange_rate: 16.0 }); // Default fallback
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize WebSocket server
const io = createSocketServer(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };

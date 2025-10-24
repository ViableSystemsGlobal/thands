# TailoredHands Backend API

This is the local testing backend API that replaces Supabase functionality for the TailoredHands e-commerce application.

## 🚀 Quick Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp config.env .env

# Edit .env with your settings
# Update database credentials, JWT secret, etc.
```

### 3. Setup Database
```bash
# Run the database setup script
node setup.js
```

This will:
- Create the `tailoredhands_local` database
- Run all migrations
- Insert sample data
- Verify the setup

### 4. Start Development Server
```bash
npm run dev
```

The API will be available at: `http://localhost:3001`

## 📊 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories/list` - Get all categories
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

### Other Endpoints (Placeholder)
- `/api/orders` - Order management
- `/api/customers` - Customer management
- `/api/admin` - Admin functions
- `/api/chat` - Chat system
- `/api/email` - Email sending

## 🗄️ Database Schema

The database includes all tables from your Supabase setup:
- `users` - User accounts (replaces Supabase auth)
- `profiles` - User profile information
- `products` - Product catalog
- `product_sizes` - Product size variations
- `categories` - Product categories
- `orders` - Order management
- `order_items` - Order line items
- `customers` - Customer information
- `cart_items` - Shopping cart
- `wishlist_items` - User wishlists
- `gift_voucher_types` - Gift voucher definitions
- `gift_vouchers` - Issued gift vouchers
- `shipping_rules` - Shipping configuration
- `settings` - Application settings
- `chat_sessions` - Chat conversations
- `chat_messages` - Chat messages
- `chat_leads` - Chat lead tracking
- `knowledge_base` - Chatbot knowledge

## 🔧 Configuration

### Environment Variables
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tailoredhands_local
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (Hostinger SMTP)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=TailoredHands

# OpenAI
OPENAI_API_KEY=your-openai-key

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## 🧪 Testing

### Test the API
```bash
# Health check
curl http://localhost:3001/api/health

# Get products
curl http://localhost:3001/api/products

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'
```

### Test with Frontend
1. Start the backend: `npm run dev`
2. Start the frontend: `npm run dev` (in main directory)
3. Update frontend to use `http://localhost:3001/api` instead of Supabase

## 🔄 Migration Strategy

This backend is designed to be a **drop-in replacement** for Supabase:

1. **Phase 1**: Test locally with this backend
2. **Phase 2**: Update frontend to use new API endpoints
3. **Phase 3**: Deploy to your Hostinger VPS
4. **Phase 4**: Migrate production data from Supabase

## 📝 Development Notes

- All endpoints return JSON responses
- Authentication uses JWT tokens
- File uploads are stored locally in `./uploads`
- Database uses PostgreSQL with UUID primary keys
- Rate limiting is enabled for API protection
- CORS is configured for frontend integration

## 🚨 Important Notes

- This is for **local testing only**
- Update `.env` with your actual credentials
- The JWT secret should be changed for production
- File uploads are stored locally (configure cloud storage for production)
- Database passwords should be strong in production

## 🔧 Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify the `postgres` user has create database permissions

### Port Already in Use
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

### Permission Issues
```bash
# Fix upload directory permissions
chmod 755 uploads/
```

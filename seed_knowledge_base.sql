-- Execute this SQL in your Supabase SQL Editor to seed the knowledge base
-- Make sure you've already run the chatbot schema migration first

-- Clear existing data (if any) and seed with Tailored Hands business information
TRUNCATE TABLE public.knowledge_base RESTART IDENTITY;

INSERT INTO public.knowledge_base (title, category, content, tags, is_active) VALUES

-- Business Overview
('About Tailored Hands', 'General', 
'Tailored Hands is more than a modern fashion brand—it''s a bold movement to redefine formal wear in Africa and beyond. We are a bespoke fashion and tailoring business that creates distinctive, ready-to-wear pieces and custom clothing that embody culture, confidence, and class. Grounded in African identity and inspired by a higher mission, we craft garments with meticulous attention to detail. Our tagline is "Crafting Elegance, Tailoring Excellence" and we specialize in both ready-to-wear collections and made-to-measure bespoke pieces.', 
ARRAY['about', 'company', 'business', 'bespoke', 'fashion', 'african'], true),

-- Contact Information
('Contact Information', 'General',
'You can reach Tailored Hands through multiple channels:
- Email: sales@tailoredhands.africa or hello@tailoredhands.africa
- Website: www.tailoredhands.africa
- Business Hours: Monday-Friday 9:00 AM - 6:00 PM, Saturday 10:00 AM - 4:00 PM, Sunday: Closed
- We respond to inquiries within 24 hours during business days
- For urgent matters or custom orders, email is the fastest way to reach us', 
ARRAY['contact', 'email', 'hours', 'support'], true),

-- Bespoke Services
('Bespoke Tailoring Services', 'Services',
'We offer comprehensive bespoke tailoring services where garments are crafted from scratch according to your exact measurements and preferences. Our bespoke process includes:
1. Initial consultation (in-person or virtual)
2. Precise measurements and fitting
3. Fabric selection from premium materials
4. Multiple fittings to ensure perfect fit
5. Final adjustments and delivery
Timeline: 2-3 weeks from consultation to final fitting
Bespoke items cannot be returned unless there is a fault in craftsmanship.', 
ARRAY['bespoke', 'custom', 'tailoring', 'measurements', 'consultation'], true),

-- Ready to Wear Collections
('Ready-to-Wear Collections', 'Products',
'Our ready-to-wear collections feature contemporary African-inspired designs available in standard sizes:
- Kaftans: Traditional and modern styles
- African-inspired clothing: Cultural fusion pieces
- Short-sleeve shirts and blouses
- Business casual and formal wear
- Evening and special occasion wear
Ready-to-wear items are in stock and ship within 1-2 business days after payment confirmation.', 
ARRAY['ready-to-wear', 'collections', 'kaftans', 'african', 'clothing'], true),

-- Product Categories
('Product Categories', 'Products',
'We offer a wide range of clothing categories:
1. SHIRTS: Custom tailored shirts and blouses in premium cotton and other fabrics
2. SUITS: Complete business suits with jacket and trousers, fully customizable
3. DRESSES: Elegant evening dresses and custom gowns for special occasions
4. KAFTANS: Traditional and contemporary kaftan styles
5. AFRICAN WEAR: Modern African-inspired formal and casual clothing
6. ACCESSORIES: Silk ties, belts, and fashion accessories
All items available in both ready-to-wear and made-to-measure options.', 
ARRAY['products', 'shirts', 'suits', 'dresses', 'accessories'], true),

-- Shipping and Delivery
('Shipping and Delivery', 'Shipping',
'We offer worldwide shipping with the following details:
DOMESTIC (GHANA):
- Standard shipping: 2-5 business days
- Cost: Free for orders over $100, otherwise $15
- Express shipping available upon request

INTERNATIONAL:
- Standard shipping: 7-14 business days  
- Cost: Free for orders over $200, otherwise $50
- Shipping costs and delivery times vary by location
- Tracking information provided for all shipments
- Customs duties may apply for international orders

You can view specific shipping details during checkout based on your location.', 
ARRAY['shipping', 'delivery', 'international', 'ghana', 'tracking'], true),

-- Returns and Exchange Policy
('Returns and Exchange Policy', 'Policies',
'RETURN POLICY:
- Ready-to-wear items: 14 days from delivery for returns
- Items must be in original condition with tags attached
- Bespoke and custom-made items cannot be returned unless there is a fault in craftsmanship
- Customer pays return shipping costs unless item is defective

ORDER MODIFICATIONS:
- Ready-to-wear items: Can be modified within 24 hours of placing order
- Bespoke orders: Modifications can be discussed during fitting process
- Contact us immediately at sales@tailoredhands.africa for any changes', 
ARRAY['returns', 'exchange', 'policy', 'modifications'], true),

-- Payment Information
('Payment Options', 'Payment',
'We accept multiple payment methods for your convenience:
- Paystack (Credit/Debit cards, Bank transfers)
- Major credit cards (Visa, Mastercard)
- Mobile money payments
- Bank transfers
- Gift vouchers

PAYMENT SECURITY:
- All payments are processed securely through Paystack
- We do not store your payment information
- Payment confirmation emails are sent immediately
- Orders are processed only after payment confirmation', 
ARRAY['payment', 'paystack', 'credit cards', 'mobile money', 'security'], true),

-- Gift Services
('Gift Vouchers and Gift Wrapping', 'Services',
'GIFT VOUCHERS:
We offer gift vouchers in various amounts:
- Basic Gift Card: $50 (perfect for alterations or accessories)
- Premium Gift Card: $100 (great for custom shirts or dresses)  
- Luxury Gift Card: $250 (ideal for suits or multiple items)
- Ultimate Gift Card: $500 (perfect for complete wardrobe makeover)
- Valid for 12 months from purchase date
- Can be used for any products on our website

GIFT WRAPPING:
- Complimentary gift wrapping service available
- Select during checkout and include personalized message
- Perfect for special occasions and corporate gifts', 
ARRAY['gift vouchers', 'gift wrapping', 'gifts', 'special occasions'], true),

-- Consultation Services
('Consultation Services', 'Services',
'We offer two types of consultations:

1. DESIGN CONSULTATION:
- For customers who already have design inspiration
- Submit your details and design ideas online
- We provide feedback and recommendations
- Perfect for specific style preferences

2. BOOKING CONSULTATION:
- In-person or video consultation with expert tailors
- Comprehensive style assessment
- Fabric selection guidance
- Measurement taking and fitting discussion
- Ideal for first-time bespoke customers

Both consultation types help ensure your garments perfectly match your style preferences and requirements.', 
ARRAY['consultation', 'design', 'booking', 'style', 'expert advice'], true),

-- Order Process
('How to Place an Order', 'Orders',
'ORDERING PROCESS:
1. Browse our collections or book a consultation for bespoke items
2. Select your items and add to cart
3. Proceed to checkout and provide shipping information
4. Choose payment method and complete payment
5. Receive order confirmation email
6. Track your order status in your account

ORDER TRACKING:
- Track orders at: www.tailoredhands.africa/track-order
- Order status updates sent via email
- Customer account shows real-time order progress
- Contact us for any order inquiries at sales@tailoredhands.africa', 
ARRAY['orders', 'ordering process', 'tracking', 'account'], true),

-- Sizing and Measurements
('Sizing and Measurements', 'Sizing',
'READY-TO-WEAR SIZING:
- Standard international sizes available
- Size guide provided for each product category
- Contact us for specific size questions

BESPOKE MEASUREMENTS:
- Professional measurement service available
- Virtual measurement guidance provided
- Multiple fittings included in bespoke service
- Precise measurements ensure perfect fit
- Measurement appointments can be scheduled

SIZING SUPPORT:
- Detailed size charts on product pages
- Customer service assistance for sizing questions
- Measurement guides available for download', 
ARRAY['sizing', 'measurements', 'size guide', 'fitting'], true),

-- Frequently Asked Questions
('Common Questions', 'FAQ',
'FREQUENTLY ASKED QUESTIONS:

Q: What is bespoke tailoring?
A: Bespoke tailoring creates custom-fitted clothing made specifically for you, crafted from scratch according to your exact measurements and preferences.

Q: How long does bespoke tailoring take?
A: 2-3 weeks from consultation to final fitting, including measurements, fabric selection, fittings, and adjustments.

Q: Do you ship internationally?
A: Yes, we offer worldwide shipping. Costs and delivery times vary by location.

Q: Can I modify my order?
A: Ready-to-wear items can be modified within 24 hours. Bespoke orders can be discussed during fittings.

Q: Do you offer gift wrapping?
A: Yes, complimentary gift wrapping is available during checkout with personalized messages.', 
ARRAY['faq', 'questions', 'bespoke', 'shipping', 'modifications'], true),

-- Customer Account Benefits
('Customer Account Benefits', 'Account',
'Creating an account with Tailored Hands provides:
- Order history and tracking
- Saved measurements for future bespoke orders
- Wishlist for favorite items
- Faster checkout process
- Exclusive member promotions
- Personal style preferences saved
- Priority customer service
- Early access to new collections

ACCOUNT MANAGEMENT:
- Update personal information and addresses
- View past orders and reorder favorites
- Track current orders in real-time
- Manage payment methods securely', 
ARRAY['account', 'benefits', 'customer', 'wishlist', 'tracking'], true),

-- Production and Quality
('Quality and Production Process', 'Quality',
'QUALITY STANDARDS:
- Premium fabrics sourced from trusted suppliers
- Skilled artisans with years of tailoring experience
- Multiple quality checkpoints during production
- Final inspection before shipping
- Attention to traditional African craftsmanship techniques

PRODUCTION TIMELINE:
- Ready-to-wear: 1-2 business days processing
- Bespoke items: 3-5 business days production
- Quality check: 1 business day
- Shipping: 2-3 business days domestic, 7-14 international

Each garment undergoes thorough quality inspection to ensure it meets our high standards before delivery.', 
ARRAY['quality', 'production', 'craftsmanship', 'timeline', 'inspection'], true);

-- Verify the data was inserted
SELECT COUNT(*) as total_entries FROM public.knowledge_base;
SELECT category, COUNT(*) as count FROM public.knowledge_base GROUP BY category ORDER BY category; 
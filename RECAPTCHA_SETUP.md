# Google reCAPTCHA Setup Guide

## Step 1: Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create)
2. Create a new site with the following settings:
   - **reCAPTCHA type**: reCAPTCHA v2 ("I'm not a robot" checkbox)
   - **Domains**: Add your domain(s):
     - `localhost` (for development)
     - `127.0.0.1` (for local development)
     - `your-production-domain.com` (for production)
3. Copy the **Site Key** and **Secret Key**

## Step 2: Add Environment Variables

Add these lines to your `.env` file:

```bash
# Google reCAPTCHA Configuration
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key-here
```

## Step 3: Install Dependencies

The necessary reCAPTCHA package has been added to your project. Run:

```bash
npm install react-google-recaptcha
```

## Step 4: reCAPTCHA Integration

reCAPTCHA has been integrated into:
- ✅ Customer Sign Up form
- ✅ Customer Sign In form  
- ✅ Admin Login form

## Step 5: Testing

1. Start your development server: `npm run dev`
2. Navigate to the login/signup pages
3. You should see the reCAPTCHA checkbox
4. Complete the reCAPTCHA verification before submitting forms

## Security Features

- **Frontend validation**: Users must complete reCAPTCHA before form submission
- **Backend validation**: Server-side verification of reCAPTCHA tokens
- **Error handling**: Graceful fallback if reCAPTCHA fails to load
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Production Deployment

For production:
1. Update the domain list in Google reCAPTCHA admin console
2. Replace the keys in your production environment variables
3. Test thoroughly in production environment

## Troubleshooting

- **reCAPTCHA not loading**: Check console for errors, verify site key
- **Verification failing**: Check secret key, ensure domains are correctly configured
- **Development issues**: Make sure localhost is added to allowed domains 
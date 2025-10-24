# reCAPTCHA Setup Instructions

## Current Status
✅ reCAPTCHA is now working in test mode for development
✅ Both Contact and Consultation forms have reCAPTCHA integration
✅ Mock reCAPTCHA allows testing without real keys

## To Enable Real reCAPTCHA:

1. **Get reCAPTCHA Keys:**
   - Go to https://www.google.com/recaptcha/admin/create
   - Choose "reCAPTCHA v2" ("I'm not a robot" checkbox)
   - Add domains: `localhost`, `127.0.0.1`, and your production domain
   - Copy the Site Key and Secret Key

2. **Create .env file in project root:**
   ```bash
   VITE_RECAPTCHA_SITE_KEY=your-actual-site-key-here
   RECAPTCHA_SECRET_KEY=your-actual-secret-key-here
   ```

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

## Current Test Mode Features:
- ✅ Shows "reCAPTCHA Test Mode" button
- ✅ Click to verify (generates test token)
- ✅ Shows verification status
- ✅ Reset functionality
- ✅ Works with form validation

## Forms with reCAPTCHA:
- ✅ Contact Us form
- ✅ Consultation/Bespoke form (final step)

The forms will work perfectly in test mode for development and testing! 
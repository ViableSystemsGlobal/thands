# Email Service Setup with Supabase Edge Function

This guide explains how to set up email sending using a Supabase Edge Function instead of a PHP backend.

## Overview

Your email service now uses:
- **Supabase Edge Function** - Handles email sending server-side
- **Hostinger SMTP** - Actual email delivery
- **Environment Variables** - Secure credential storage

## Setup Steps

### 1. Deploy the Edge Function

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Login to Supabase (if not already)
supabase login

# Deploy the email function
supabase functions deploy send-email
```

### 2. Configure SMTP Credentials

Set your Hostinger SMTP credentials as Supabase secrets:

```bash
# Required secrets
supabase secrets set SMTP_HOST=mail.yourdomain.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USERNAME=your-email@yourdomain.com
supabase secrets set SMTP_PASSWORD=your-email-password
supabase secrets set SMTP_FROM_EMAIL=noreply@yourdomain.com
supabase secrets set SMTP_FROM_NAME="TailoredHands"
```

### 3. Get Your Hostinger SMTP Settings

From your Hostinger control panel:

1. Go to **Email** → **Email Accounts**
2. Create or select an email account
3. Note down these settings:
   - **SMTP Server**: Usually `mail.yourdomain.com`
   - **SMTP Port**: `587` (recommended) or `465`
   - **Username**: Your full email address
   - **Password**: Your email password

### 4. Test the Configuration

1. Go to **Admin** → **Communication** → **Email** in your app
2. Use the test email form to send a test email
3. Check that the email is received successfully

## How It Works

1. **Frontend** calls `supabase.functions.invoke('send-email')`
2. **Edge Function** receives the request with email data
3. **Edge Function** uses SMTP credentials from environment variables
4. **Edge Function** connects to Hostinger SMTP server
5. **Email is sent** through Hostinger's mail servers
6. **Response** is returned to frontend with success/error status

## Benefits

✅ **No PHP hosting required** - Everything runs on Supabase  
✅ **Secure credentials** - SMTP details stored as encrypted secrets  
✅ **Better error handling** - Proper error responses and logging  
✅ **Easy maintenance** - No separate server management  
✅ **Scalable** - Handles concurrent email requests automatically  

## Troubleshooting

### Edge Function Not Found
```bash
# Redeploy the function
supabase functions deploy send-email
```

### SMTP Authentication Failed
- Verify your email credentials in Hostinger
- Check that SMTP is enabled for your email account
- Try using your email password (not cPanel password)

### Connection Timeout
- Verify SMTP_HOST is correct (usually `mail.yourdomain.com`)
- Try port 465 instead of 587
- Check Hostinger's SMTP documentation for your specific plan

### Permission Denied
```bash
# Make sure you're logged into the correct Supabase project
supabase projects list
supabase link --project-ref YOUR_PROJECT_REF
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | Hostinger SMTP server | `mail.yourdomain.com` |
| `SMTP_PORT` | SMTP port | `587` or `465` |
| `SMTP_USERNAME` | Full email address | `admin@yourdomain.com` |
| `SMTP_PASSWORD` | Email account password | `your-secure-password` |
| `SMTP_FROM_EMAIL` | Default sender email | `noreply@yourdomain.com` |
| `SMTP_FROM_NAME` | Default sender name | `TailoredHands` |

## Security Notes

- SMTP credentials are stored as encrypted Supabase secrets
- Credentials are never exposed to the frontend
- Edge Function runs in a secure Deno environment
- All communication uses HTTPS/TLS encryption 
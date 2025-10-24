# Chatbot Setup Guide

This guide will help you set up the AI-powered chatbot for your TailoredHands e-commerce platform.

## Overview

The chatbot system provides:
- AI-powered customer support
- Lead generation and capture
- Integration with your existing customer database
- Real-time chat functionality

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- OpenAI API account
- Supabase project (optional, for advanced features)

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

### Required Environment Variables
Add these to your `.env` file:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the database migrations:

```bash
# Run the main database setup
npm run db:setup

# Run chatbot-specific migrations
npm run db:migrate:chatbot
```

### 4. Start the Application

```bash
# Start the backend server
npm run dev:backend

# Start the frontend (in another terminal)
npm run dev:frontend
```

## Configuration

### OpenAI Configuration

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file as `OPENAI_API_KEY`
3. Ensure you have sufficient credits in your OpenAI account

### Chatbot Features

The chatbot includes:
- **Smart Responses**: AI-powered responses to customer queries
- **Lead Capture**: Automatically captures customer information
- **Context Awareness**: Remembers conversation history
- **Integration**: Works with your existing product catalog

### Customization

You can customize the chatbot by:
- Modifying response templates in `src/lib/chatService.js`
- Adding new conversation flows
- Integrating with your product database
- Setting up automated follow-ups

## Testing

Test the chatbot by:
1. Opening your website
2. Clicking the chat widget
3. Sending test messages
4. Checking the admin panel for captured leads

## Troubleshooting

### Common Issues

1. **Chatbot not responding**: Check OpenAI API key and credits
2. **Database errors**: Ensure PostgreSQL is running and migrations are applied
3. **CORS issues**: Verify frontend and backend URLs in configuration

### Support

For additional help:
- Check the console logs for error messages
- Verify all environment variables are set
- Ensure database connections are working

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor API usage to prevent unexpected charges

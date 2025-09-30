# LINE Bot Setup Guide

This guide will help you set up the LINE Bot functionality for your expense tracker application.

## Prerequisites

1. A LINE Developer account
2. Your expense tracker application running
3. A publicly accessible webhook URL (for production)

## Step 1: Create a LINE Bot Channel

1. Go to the [LINE Developers Console](https://developers.line.biz/)
2. Log in with your LINE account
3. Click "Create a new provider" or select an existing provider
4. Click "Create a new channel"
5. Select "Messaging API" as the channel type
6. Fill in the required information:
   - Channel name: "Expense Tracker Bot" (or your preferred name)
   - Channel description: "AI-powered expense tracking assistant"
   - Category: Select an appropriate category
   - Subcategory: Select an appropriate subcategory
7. Agree to the terms and conditions
8. Click "Create"

## Step 2: Configure the Bot Channel

1. In your bot channel settings, go to the "Messaging API" tab
2. Note down the following values:
   - **Channel ID** (Channel access token section)
   - **Channel secret** (Basic settings section)
   - **Channel access token** (Messaging API section)

3. In the "Messaging API" tab, configure:
   - **Webhook URL**: `https://your-domain.com/api/line/webhook`
   - **Webhook usage**: Enable
   - **Auto-reply messages**: Disable (we'll handle responses programmatically)
   - **Greeting messages**: Disable (we'll handle responses programmatically)

## Step 3: Set Up Environment Variables

Add the following variables to your `.env` file:

```env
# LINE Bot Configuration
LINE_BOT_CHANNEL_ID=your-line-bot-channel-id
LINE_BOT_CHANNEL_SECRET=your-line-bot-channel-secret
LINE_BOT_CHANNEL_ACCESS_TOKEN=your-line-bot-channel-access-token
LINE_BOT_WEBHOOK_URL=https://your-domain.com/api/line/webhook
```

## Step 4: Install Dependencies

The LINE Bot SDK is already added to your `package.json`. Install it by running:

```bash
npm install
```

## Step 5: Deploy and Configure Webhook

### For Development (using ngrok)

1. Install ngrok: `npm install -g ngrok`
2. Start your application: `npm run server`
3. In another terminal, expose your local server:
   ```bash
   ngrok http 3001
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Set your webhook URL to: `https://abc123.ngrok.io/api/line/webhook`
6. Update your `.env` file with the ngrok URL

### For Production

1. Deploy your application to a server with a public domain
2. Set the webhook URL to: `https://your-domain.com/api/line/webhook`
3. Ensure your server is accessible from the internet

## Step 6: Test the Bot

1. Add your bot as a friend on LINE by scanning the QR code or searching for the bot
2. Send a message like: "I spent $25 on lunch today"
3. The bot should respond with expense categorization and confirmation

## How It Works

### Message Processing Flow

1. User sends a message to the LINE Bot
2. LINE sends the message to your webhook endpoint (`/api/line/webhook`)
3. The bot processes the message using the same logic as the web chat interface
4. The bot extracts expense information (amount, description)
5. The bot uses AI to categorize the expense
6. The bot creates the expense in the database
7. The bot sends a confirmation message back to the user

### User Management

- LINE users are automatically created in your database when they first interact with the bot
- Each LINE user gets their own expense categories and AI prompts
- LINE users are separate from web app users (they can't access the web interface)

### Supported Message Formats

The bot understands natural language messages like:
- "I spent $25 on lunch today"
- "Coffee $4.50 at Starbucks"
- "Gas $45"
- "Movie tickets $30"
- "Dinner $80 at restaurant"

## Troubleshooting

### Bot Not Responding

1. Check that your webhook URL is correctly configured
2. Verify that your server is running and accessible
3. Check the server logs for errors
4. Ensure all environment variables are set correctly

### Webhook Verification Failed

1. Make sure your webhook URL is using HTTPS
2. Check that the webhook endpoint is returning a 200 status code
3. Verify that the LINE Bot SDK middleware is properly configured

### Database Errors

1. Ensure your database is running and accessible
2. Check that the database schema includes the `line_user_id` field
3. Verify database connection settings

## Security Considerations

1. Keep your Channel Secret and Access Token secure
2. Use HTTPS for your webhook URL
3. Validate all incoming messages
4. Implement rate limiting if needed
5. Monitor for suspicious activity

## Advanced Configuration

### Customizing Responses

You can modify the bot's responses by editing the `line-bot-service.js` file. The main response logic is in the `processExpenseMessage` method.

### Adding New Features

To add new features to the bot:

1. Modify the `handleEvent` method to handle different message types
2. Add new processing methods in `LineBotService`
3. Update the webhook endpoint if needed

### Integration with Web App

The bot uses the same API endpoints as the web application, so any changes to the expense processing logic will automatically apply to both interfaces.

## Support

If you encounter issues:

1. Check the server logs for error messages
2. Verify your LINE Bot channel configuration
3. Test your webhook endpoint manually
4. Check the LINE Developers Console for webhook delivery status

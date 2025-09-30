# Authentication Setup Guide

## Quick Setup Steps

### 1. Environment Variables
Copy the example environment file and configure it:
```bash
cp env.example .env
```

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

### 3. LINE Login Setup (Optional)
1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new channel or select existing one
3. Go to "LINE Login" tab
4. Set callback URL: `http://localhost:3001/api/auth/line/callback`
5. Copy the Channel ID and Channel Secret to your `.env` file

### 4. Database Setup
Make sure your PostgreSQL database is running and update the `DATABASE_URL` in your `.env` file.

### 5. Start the Application
```bash
# Install dependencies
npm install

# Start the backend server
npm run server

# In another terminal, start the frontend
npm run dev
```

## Environment Variables Reference

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/expense_tracker
PGSSL=false

# JWT & Session
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# Frontend
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# LINE Login (Optional)
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CALLBACK_URL=http://localhost:3001/api/auth/line/callback

# Environment
NODE_ENV=development
```

## Testing the Authentication

1. Start both servers (backend and frontend)
2. Open the application in your browser
3. You should see a login screen with Google and LINE buttons
4. Click on either button to test the OAuth flow
5. After successful authentication, you'll be redirected back to the app
6. Your user profile should appear in the header
7. All expense data will now be user-specific

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**: Make sure the callback URL in your OAuth provider matches exactly what's in your `.env` file.

2. **Database connection error**: Verify your `DATABASE_URL` is correct and the database is running.

3. **JWT errors**: Make sure you have strong, unique secrets for `JWT_SECRET` and `SESSION_SECRET`.

4. **CORS errors**: Ensure `FRONTEND_URL` in your `.env` matches your frontend development server URL.

### Logs to Check:
- Backend server logs for authentication errors
- Browser console for frontend errors
- Database logs for connection issues


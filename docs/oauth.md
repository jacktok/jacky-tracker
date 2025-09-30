# OAuth Setup Guide

This guide covers setting up OAuth authentication providers for the Jacky Tracker application. The app supports Google OAuth 2.0 and LINE Login for user authentication.

## 🔐 Supported OAuth Providers

- **Google OAuth 2.0** (Required) - Primary authentication method
- **LINE Login** (Optional) - Alternative authentication method

## 🔧 Google OAuth 2.0 Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" dropdown
   - Click "New Project"
   - Project name: `Jacky Tracker` (or your preferred name)
   - Organization: Select your organization (if applicable)
   - Click "Create"

3. **Select the Project**
   - Make sure your new project is selected in the dropdown

### Step 2: Enable Required APIs

1. **Navigate to APIs & Services**
   - Go to "APIs & Services" → "Library"

2. **Enable Google+ API**
   - Search for "Google+ API"
   - Click on "Google+ API"
   - Click "Enable"

3. **Enable People API (Optional)**
   - Search for "People API"
   - Click on "People API"
   - Click "Enable"
   - This provides additional user profile information

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Navigate to "APIs & Services" → "OAuth consent screen"

2. **Choose User Type**
   - Select "External" for public apps
   - Select "Internal" for organization-only apps
   - Click "Create"

3. **Fill App Information**
   - **App name**: `Jacky Tracker`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - Click "Save and Continue"

4. **Configure Scopes**
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`
   - Click "Update" → "Save and Continue"

5. **Add Test Users (if External)**
   - Add email addresses of users who can test the app
   - Click "Save and Continue"

6. **Review and Submit**
   - Review all information
   - Click "Back to Dashboard"

### Step 4: Create OAuth Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" → "Credentials"

2. **Create OAuth 2.0 Client ID**
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: `Jacky Tracker Web Client`

3. **Configure Authorized Redirect URIs**
   - **Development**: `http://localhost:3001/api/auth/google/callback`
   - **Production**: `https://yourdomain.com/api/auth/google/callback`
   - Click "Create"

4. **Get Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Add them to your `.env` file

### Step 5: Configure Environment Variables

Add these variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

## 📱 LINE Login Setup (Optional)

### Step 1: Create LINE Developers Account

1. **Go to LINE Developers Console**
   - Visit [developers.line.biz](https://developers.line.biz/)
   - Sign in with your LINE account

2. **Create Developer Account** (if first time)
   - Fill in required information
   - Verify your email address

### Step 2: Create Channel

1. **Create New Channel**
   - Click "Create a new channel"
   - Select "LINE Login"

2. **Fill Channel Information**
   - **Channel name**: `Jacky Tracker`
   - **Channel description**: `Money tracking application`
   - **Category**: Select appropriate category
   - **Subcategory**: Select appropriate subcategory
   - **Channel icon**: Upload app icon (optional)
   - **Email address**: Your email address
   - **Privacy policy URL**: Your privacy policy URL (optional)
   - **Terms of use URL**: Your terms of use URL (optional)

3. **Complete Channel Creation**
   - Review all information
   - Click "Create"

### Step 3: Configure LINE Login

1. **Go to LINE Login Tab**
   - Click on your channel
   - Go to "LINE Login" tab

2. **Configure Callback URL**
   - **Development**: `http://localhost:3001/api/auth/line/callback`
   - **Production**: `https://yourdomain.com/api/auth/line/callback`
   - Click "Add"

3. **Configure Scopes**
   - **Profile**: ✅ (Required)
   - **OpenID**: ✅ (Required)
   - **Email**: ✅ (Optional, for email access)

4. **Save Configuration**
   - Click "Save" to apply changes

### Step 4: Get Credentials

1. **Go to Basic Settings**
   - Click "Basic settings" tab

2. **Copy Credentials**
   - **Channel ID**: Copy this value
   - **Channel Secret**: Click "Show" and copy this value

3. **Add to Environment**
   - Add credentials to your `.env` file

### Step 5: Configure Environment Variables

Add these variables to your `.env` file:

```env
# LINE OAuth Configuration
LINE_CHANNEL_ID=your-actual-channel-id-here
LINE_CHANNEL_SECRET=your-actual-channel-secret-here
LINE_CALLBACK_URL=http://localhost:3001/api/auth/line/callback
```

## 🔄 OAuth Flow Testing

### Test Google OAuth

1. **Start the Application**
   ```bash
   npm run server  # Backend
   npm run dev     # Frontend
   ```

2. **Access the App**
   - Go to http://localhost:5173
   - Click "Sign in with Google"

3. **Complete OAuth Flow**
   - You'll be redirected to Google
   - Sign in with your Google account
   - Grant permissions to the app
   - You'll be redirected back to the app

4. **Verify Success**
   - Check that you're logged in
   - Your Google profile should appear in the header
   - You should have access to expense tracking features

### Test LINE OAuth

1. **Access the App**
   - Go to http://localhost:5173
   - Click "Sign in with LINE"

2. **Complete OAuth Flow**
   - You'll be redirected to LINE
   - Sign in with your LINE account
   - Grant permissions to the app
   - You'll be redirected back to the app

3. **Verify Success**
   - Check that you're logged in
   - Your LINE profile should appear in the header

## 🚨 Common OAuth Issues

### Google OAuth Issues

| Issue | Solution |
|-------|----------|
| "Invalid redirect URI" | Ensure callback URL matches exactly in Google Console |
| "Client ID not found" | Verify `GOOGLE_CLIENT_ID` is correct |
| "Invalid client secret" | Verify `GOOGLE_CLIENT_SECRET` is correct |
| "Access blocked" | Check OAuth consent screen configuration |
| "Scope not authorized" | Add required scopes in Google Console |

### LINE OAuth Issues

| Issue | Solution |
|-------|----------|
| "Invalid callback URL" | Ensure callback URL matches exactly in LINE Console |
| "Channel not found" | Verify `LINE_CHANNEL_ID` is correct |
| "Invalid channel secret" | Verify `LINE_CHANNEL_SECRET` is correct |
| "Access denied" | Check channel status and permissions |
| "Scope error" | Verify required scopes are enabled |

### General OAuth Issues

| Issue | Solution |
|-------|----------|
| "CORS error" | Check `FRONTEND_URL` in `.env` file |
| "Network error" | Verify backend server is running |
| "Redirect loop" | Check callback URLs and frontend URL |
| "Token error" | Verify JWT_SECRET is set correctly |

## 🔒 Security Considerations

### OAuth Security Best Practices

1. **Keep Secrets Secret**
   - Never commit OAuth secrets to version control
   - Use environment variables for all secrets
   - Rotate secrets regularly in production

2. **Validate Redirect URIs**
   - Use exact URL matching
   - Avoid wildcards in production
   - Use HTTPS in production

3. **Scope Management**
   - Request only necessary permissions
   - Regularly review granted permissions
   - Implement proper error handling

4. **Token Security**
   - Use secure JWT secrets
   - Implement token expiration
   - Handle token refresh properly

### Production Considerations

1. **HTTPS Required**
   - All OAuth callbacks must use HTTPS
   - Update callback URLs for production
   - Use proper SSL certificates

2. **Domain Validation**
   - Verify domain ownership
   - Use consistent domain names
   - Update OAuth provider settings

3. **Monitoring**
   - Monitor OAuth usage
   - Log authentication attempts
   - Set up alerts for failures

## 📚 OAuth Provider Documentation

### Google OAuth 2.0
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google+ API Documentation](https://developers.google.com/+/api/)
- [Google OAuth Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

### LINE Login
- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/)
- [LINE Login Scopes](https://developers.line.biz/en/docs/line-login/integrate-line-login/#scopes)
- [LINE Login API Reference](https://developers.line.biz/en/reference/line-login/)

## 🆘 Troubleshooting

### Debug OAuth Issues

1. **Check Server Logs**
   ```bash
   # Backend server logs
   npm run server
   ```

2. **Check Browser Console**
   - Open Developer Tools
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Verify Environment Variables**
   ```bash
   # Check if variables are loaded
   node -e "console.log(process.env.GOOGLE_CLIENT_ID)"
   ```

4. **Test OAuth URLs**
   - Test callback URLs manually
   - Verify OAuth provider settings
   - Check for typos in URLs

### Get Help

- Check the [Troubleshooting Guide](./troubleshooting.md)
- Review OAuth provider documentation
- Check application logs for detailed error messages
- Verify all environment variables are set correctly

---

**OAuth setup complete! Your users can now sign in securely. 🔐**

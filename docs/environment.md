# Environment Configuration Guide

This guide covers all environment variables used in the Jacky Tracker application, their purposes, and how to configure them properly.

## 📁 Environment File Structure

The application uses a `.env` file for configuration. Copy `env.example` to `.env` and customize the values:

```bash
cp env.example .env
```

## 🔧 Configuration Variables

### Database Configuration

#### `DATABASE_URL` (Required)
- **Purpose**: PostgreSQL connection string
- **Format**: `postgresql://username:password@host:port/database`
- **Example**: `postgresql://myuser:mypassword@localhost:5432/expense_tracker`
- **Production**: `postgresql://user:pass@db.example.com:5432/expense_tracker`

#### `PGSSL` (Optional)
- **Purpose**: Enable SSL for database connections
- **Values**: `true` or `false`
- **Default**: `false`
- **Production**: Set to `true` for secure connections

### Authentication & Security

#### `JWT_SECRET` (Required)
- **Purpose**: Secret key for JWT token signing
- **Generate**: Use a secure random generator
- **Length**: At least 32 characters (recommended: 64+ characters)
- **Security**: Keep this secret and never commit to version control

#### `SESSION_SECRET` (Required)
- **Purpose**: Secret key for session management
- **Generate**: Use a secure random generator
- **Length**: At least 32 characters (recommended: 64+ characters)
- **Security**: Keep this secret and never commit to version control

### Frontend Configuration

#### `FRONTEND_URL` (Required)
- **Purpose**: Frontend application URL for CORS and redirects
- **Development**: `http://localhost:5173`
- **Production**: `https://yourdomain.com`
- **Note**: Must match your frontend server URL

### Google OAuth Configuration

#### `GOOGLE_CLIENT_ID` (Required)
- **Purpose**: Google OAuth 2.0 client identifier
- **Obtain**: From Google Cloud Console
- **Format**: `123456789-abcdefg.apps.googleusercontent.com`
- **Security**: Can be public (included in frontend)

#### `GOOGLE_CLIENT_SECRET` (Required)
- **Purpose**: Google OAuth 2.0 client secret
- **Obtain**: From Google Cloud Console
- **Format**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`
- **Security**: Keep secret, server-side only

#### `GOOGLE_CALLBACK_URL` (Required)
- **Purpose**: OAuth callback URL for Google
- **Development**: `http://localhost:3001/api/auth/google/callback`
- **Production**: `https://yourdomain.com/api/auth/google/callback`
- **Note**: Must match exactly in Google Cloud Console

### LINE OAuth Configuration (Optional)

#### `LINE_CHANNEL_ID` (Optional)
- **Purpose**: LINE Login channel identifier
- **Obtain**: From LINE Developers Console
- **Format**: `1234567890`
- **Security**: Can be public

#### `LINE_CHANNEL_SECRET` (Optional)
- **Purpose**: LINE Login channel secret
- **Obtain**: From LINE Developers Console
- **Format**: `abcdefghijklmnopqrstuvwxyz123456`
- **Security**: Keep secret, server-side only

#### `LINE_CALLBACK_URL` (Optional)
- **Purpose**: OAuth callback URL for LINE
- **Development**: `http://localhost:3001/api/auth/line/callback`
- **Production**: `https://yourdomain.com/api/auth/line/callback`
- **Note**: Must match exactly in LINE Developers Console

### Environment Settings

#### `NODE_ENV` (Required)
- **Purpose**: Application environment mode
- **Values**: `development`, `production`, `test`
- **Development**: `development`
- **Production**: `production`
- **Effects**: Affects logging, error handling, and optimizations

## 🔐 Security Best Practices

### Secret Management
- **Never commit** `.env` files to version control
- **Use strong secrets** for JWT and session keys
- **Rotate secrets** regularly in production
- **Use environment-specific** files (`.env.development`, `.env.production`)

### Generating Secure Secrets

You can generate secure secrets using these methods:

#### Method 1: Using Node.js (Recommended)
```bash
# Generate JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

#### Method 2: Using OpenSSL
```bash
# Generate JWT secret
openssl rand -hex 64

# Generate session secret
openssl rand -hex 64
```

#### Method 3: Using Online Generator
- Use a secure random string generator
- Ensure it generates at least 64 characters
- Never use the same secret for both JWT and session

### Database Security
- **Use strong passwords** for database users
- **Enable SSL** in production (`PGSSL=true`)
- **Restrict database access** to application servers only
- **Use connection pooling** for better performance

### OAuth Security
- **Validate redirect URIs** exactly match configured URLs
- **Use HTTPS** in production for all OAuth callbacks
- **Regularly review** OAuth app permissions
- **Monitor OAuth usage** for suspicious activity

## 🌍 Environment-Specific Configuration

### Development Environment
```env
NODE_ENV=development
DATABASE_URL=postgresql://devuser:devpass@localhost:5432/expense_tracker_dev
FRONTEND_URL=http://localhost:5173
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
LINE_CALLBACK_URL=http://localhost:3001/api/auth/line/callback
```

### Production Environment
```env
NODE_ENV=production
DATABASE_URL=postgresql://produser:strongpassword@db.example.com:5432/expense_tracker
PGSSL=true
FRONTEND_URL=https://tracker.example.com
GOOGLE_CALLBACK_URL=https://api.example.com/api/auth/google/callback
LINE_CALLBACK_URL=https://api.example.com/api/auth/line/callback
```

### Test Environment
```env
NODE_ENV=test
DATABASE_URL=postgresql://testuser:testpass@localhost:5432/expense_tracker_test
FRONTEND_URL=http://localhost:5173
# Use test OAuth credentials
```

## 🔄 Environment Variable Loading

The application loads environment variables in this order:

1. **System environment variables** (highest priority)
2. **`.env` file** in project root
3. **Default values** (lowest priority)

### Loading Order Example
```bash
# System environment (overrides .env)
export DATABASE_URL="postgresql://system:pass@localhost:5432/system_db"

# .env file
DATABASE_URL=postgresql://env:pass@localhost:5432/env_db

# Application will use: postgresql://system:pass@localhost:5432/system_db
```

## 🛠️ Configuration Validation

The application validates environment variables on startup:

### Required Variables
- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Optional Variables
- `PGSSL`
- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `NODE_ENV`

### Validation Errors
If required variables are missing, the application will:
1. Log detailed error messages
2. Exit with error code 1
3. Display helpful setup instructions

## 📝 Configuration Examples

### Minimal Configuration
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/expense_tracker
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Full Configuration
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/expense_tracker
PGSSL=false

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# Frontend
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# LINE OAuth
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=abcdefghijklmnopqrstuvwxyz123456
LINE_CALLBACK_URL=http://localhost:3001/api/auth/line/callback

# Environment
NODE_ENV=development
```

## 🚨 Common Configuration Issues

### Database Connection Issues
- **Wrong format**: Ensure `postgresql://` prefix
- **Wrong credentials**: Verify username/password
- **Wrong host/port**: Check database server location
- **Database doesn't exist**: Create the database first

### OAuth Issues
- **Redirect mismatch**: URLs must match exactly
- **Missing credentials**: Get from OAuth provider console
- **Wrong environment**: Use correct URLs for dev/prod

### CORS Issues
- **Wrong frontend URL**: Must match your frontend server
- **Protocol mismatch**: http vs https
- **Port mismatch**: Check frontend server port

## 📚 Related Documentation

- [Quick Start Guide](./quick-start.md) - Get running quickly
- [Complete Setup Guide](./setup.md) - Detailed setup instructions
- [OAuth Setup Guide](./oauth.md) - OAuth provider configuration
- [Database Setup Guide](./database.md) - Database configuration
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions

---

**Need help with configuration? Check the troubleshooting guide or create an issue! 🆘**

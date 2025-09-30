# Complete Setup Guide

This comprehensive guide will walk you through setting up the Jacky Tracker application from scratch, including all prerequisites, configuration, and verification steps.

## 📋 Prerequisites

### Required Software

1. **Node.js 18+**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`
   - Verify npm: `npm --version`

2. **PostgreSQL 12+**
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - Verify installation: `psql --version`
   - Ensure PostgreSQL service is running

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

### Optional but Recommended

- **VS Code** with TypeScript and React extensions
- **Postman** for API testing
- **pgAdmin** for database management

## 🚀 Installation Steps

### Step 1: Clone and Install

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd jacky-tracker

# Install dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit the environment file
notepad .env  # Windows
# or
code .env     # VS Code
```

### Step 3: Database Setup

#### Option A: Using createdb (Recommended)
```bash
# Create database
createdb expense_tracker

# Verify database exists
psql -l | grep expense_tracker
```

#### Option B: Using psql
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE expense_tracker;

# Create user (optional)
CREATE USER tracker_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO tracker_user;

# Exit psql
\q
```

#### Option C: Using pgAdmin
1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `expense_tracker`
4. Click "Save"

### Step 4: OAuth Provider Setup

#### Google OAuth 2.0 Setup

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com/)

2. **Create or Select Project**
   - Click "Select a project" → "New Project"
   - Name: "Jacky Tracker" (or your preferred name)
   - Click "Create"

3. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click on it and press "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Jacky Tracker Web Client"

5. **Configure Redirect URIs**
   - Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`

6. **Get Credentials**
   - Copy the Client ID and Client Secret
   - Add them to your `.env` file

#### LINE Login Setup (Optional)

1. **Go to LINE Developers Console**
   - Visit [developers.line.biz](https://developers.line.biz/)

2. **Create Channel**
   - Click "Create a new channel"
   - Channel type: "LINE Login"
   - Fill in required information

3. **Configure Callback URL**
   - Go to "LINE Login" tab
   - Callback URL: `http://localhost:3001/api/auth/line/callback`
   - For production: `https://yourdomain.com/api/auth/line/callback`

4. **Get Credentials**
   - Copy Channel ID and Channel Secret
   - Add them to your `.env` file

### Step 5: Complete Environment Configuration

Your `.env` file should look like this:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/expense_tracker
PGSSL=false

# JWT Configuration (Generate your own secure secrets)
JWT_SECRET=your-super-secret-jwt-key-here

# Session Configuration (Generate your own secure secrets)
SESSION_SECRET=your-super-secret-session-key-here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# LINE OAuth Configuration (Optional)
LINE_CHANNEL_ID=your-actual-line-channel-id
LINE_CHANNEL_SECRET=your-actual-line-channel-secret
LINE_CALLBACK_URL=http://localhost:3001/api/auth/line/callback

# Environment
NODE_ENV=development
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend development server
npm run dev
```

### Production Mode

```bash
# Build the frontend
npm run build

# Start production server
npm start
```

## ✅ Verification Steps

### 1. Backend Health Check
```bash
# Test backend API
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 2. Frontend Access
- Open browser to http://localhost:5173
- You should see the login screen
- Click "Sign in with Google" to test OAuth

### 3. Database Connection
- Check backend logs for "Database connected successfully"
- If you see connection errors, verify your `DATABASE_URL`

### 4. OAuth Flow Test
1. Click "Sign in with Google"
2. Complete Google OAuth flow
3. You should be redirected back to the app
4. Check that your user profile appears in the header

### 5. Feature Test
1. Add a new expense
2. Verify it appears in the table
3. Test filtering and search
4. Test category management

## 🔧 Configuration Options

### Database Options
- **Host**: Change `localhost` to your database host
- **Port**: Change `5432` to your database port
- **SSL**: Set `PGSSL=true` for secure connections

### Frontend Options
- **Port**: Change `5173` to your preferred port
- **URL**: Update `FRONTEND_URL` for production

### OAuth Options
- **Callback URLs**: Must match exactly in OAuth provider settings
- **Scopes**: Additional scopes can be added in the OAuth provider

## 🐛 Common Issues

### Database Connection Failed
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists
- Check user permissions

### OAuth Redirect Mismatch
- Verify callback URLs match exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches

### Port Already in Use
- Change ports in `.env` file
- Kill processes using the ports
- Use different ports for development

## 📚 Next Steps

After successful setup:

1. **Read [Development Guide](./development.md)** for development workflow
2. **Check [API Documentation](./api.md)** for backend endpoints
3. **Review [Component Guide](./components.md)** for frontend components
4. **Explore [Deployment Guide](./deployment.md)** for production setup

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review error messages in browser console and server logs
3. Verify all prerequisites are installed correctly
4. Ensure all environment variables are set properly

---

**Your Jacky Tracker is now ready to use! 🎉**

# Quick Start Guide

Get your Jacky Tracker application running in 5 minutes! This guide covers the essential steps to get you up and running quickly.

## ⚡ Prerequisites

Before you start, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your settings
notepad .env  # Windows
# or
code .env     # VS Code
```

**Minimal required configuration:**
```env
# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/expense_tracker

# Secrets (Generate your own secure secrets)
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# OAuth (REQUIRED for authentication)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 3: Set Up Database
```bash
# Create the database
createdb expense_tracker

# Or using psql
psql -U postgres -c "CREATE DATABASE expense_tracker;"
```

### Step 4: Start the Application
```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend development server
npm run dev
```

### Step 5: Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔑 OAuth Setup (Required)

You need OAuth credentials for user authentication:

### Google OAuth (5 minutes)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Copy Client ID and Secret to your `.env` file

### LINE OAuth (Optional)
1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new channel
3. Set callback URL: `http://localhost:3001/api/auth/line/callback`
4. Copy Channel ID and Secret to your `.env` file

## ✅ Verify Setup

1. **Check Backend**: Visit http://localhost:3001/api/health
2. **Check Frontend**: Visit http://localhost:5173
3. **Test Authentication**: Click login button and try Google OAuth
4. **Test Features**: Add an expense and verify it saves

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection error | Check `DATABASE_URL` in `.env` |
| OAuth redirect error | Verify callback URLs match exactly |
| Frontend not loading | Check if `npm run dev` is running |
| Backend not starting | Check if port 3001 is available |

## 📚 Next Steps

Once you have the basic setup working:

1. **Read the [Complete Setup Guide](./setup.md)** for detailed configuration
2. **Check [Environment Configuration](./environment.md)** for all available options
3. **Review [Troubleshooting Guide](./troubleshooting.md)** for common issues
4. **Explore [Development Guide](./development.md)** for development workflow

## 🎯 What You Get

After completing this setup, you'll have:

- ✅ **User Authentication** with Google OAuth
- ✅ **Personal Expense Tracking** with user-specific data
- ✅ **Modern React UI** with TypeScript
- ✅ **Responsive Design** that works on all devices
- ✅ **Real-time Updates** with optimistic UI
- ✅ **Data Export/Import** functionality
- ✅ **Category Management** system
- ✅ **Advanced Filtering** and search

---

**Ready to track your expenses? Let's go! 💰**

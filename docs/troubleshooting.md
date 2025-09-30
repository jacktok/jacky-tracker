# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Jacky Tracker application. Follow the steps below to resolve problems quickly.

## 🚨 Quick Diagnosis

### Check Application Status

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check if frontend is running
curl http://localhost:5173

# Check if database is running
psql -U postgres -c "SELECT 1;"
```

### Check Logs

```bash
# Backend logs
npm run server

# Frontend logs (in browser)
# Open Developer Tools → Console tab

# Database logs
# Windows: Event Viewer → Windows Logs → Application
# macOS: tail -f /usr/local/var/log/postgres.log
# Linux: sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🔧 Common Issues and Solutions

### Database Issues

#### "Database connection failed"

**Symptoms:**
- Backend server won't start
- Error: "Connection refused" or "Authentication failed"
- Application shows database errors

**Solutions:**

1. **Check PostgreSQL is running**
   ```bash
   # Windows
   net start postgresql-x64-15
   
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

2. **Verify database exists**
   ```bash
   psql -U postgres -l | grep expense_tracker
   ```

3. **Check connection string**
   ```env
   # Verify DATABASE_URL format
   DATABASE_URL=postgresql://username:password@localhost:5432/expense_tracker
   ```

4. **Test connection manually**
   ```bash
   psql "postgresql://username:password@localhost:5432/expense_tracker"
   ```

#### "Database does not exist"

**Solutions:**

1. **Create the database**
   ```bash
   createdb expense_tracker
   # or
   psql -U postgres -c "CREATE DATABASE expense_tracker;"
   ```

2. **Check database name spelling**
   - Ensure it matches exactly in `DATABASE_URL`

#### "Permission denied"

**Solutions:**

1. **Grant user privileges**
   ```sql
   -- Connect as postgres user
   psql -U postgres
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO your_username;
   ```

2. **Check pg_hba.conf**
   - Ensure user authentication method is correct
   - Restart PostgreSQL after changes

### OAuth Issues

#### "Invalid redirect URI"

**Symptoms:**
- OAuth flow starts but fails at redirect
- Error: "redirect_uri_mismatch"
- User gets redirected to error page

**Solutions:**

1. **Check callback URLs match exactly**
   ```env
   # .env file
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
   LINE_CALLBACK_URL=http://localhost:3001/api/auth/line/callback
   ```

2. **Verify OAuth provider settings**
   - Google Console: APIs & Services → Credentials
   - LINE Console: Channel → LINE Login tab
   - URLs must match exactly (including http/https)

3. **Check for trailing slashes**
   - Remove any trailing slashes from URLs
   - Ensure URLs don't end with `/`

#### "Client ID not found"

**Solutions:**

1. **Verify credentials in .env**
   ```env
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```

2. **Check OAuth provider console**
   - Ensure credentials are correct
   - Verify project/channel is active

3. **Test credentials manually**
   ```bash
   # Test Google OAuth
   curl "https://accounts.google.com/.well-known/openid_configuration"
   ```

#### "Access blocked" or "Access denied"

**Solutions:**

1. **Check OAuth consent screen**
   - Google Console: OAuth consent screen
   - Ensure app is properly configured
   - Add test users if needed

2. **Verify scopes**
   - Check required scopes are enabled
   - Update scopes if needed

3. **Check channel status**
   - LINE Console: Ensure channel is active
   - Verify callback URL is configured

### Frontend Issues

#### "Cannot connect to backend"

**Symptoms:**
- Frontend loads but shows connection errors
- API calls fail
- CORS errors in browser console

**Solutions:**

1. **Check backend is running**
   ```bash
   npm run server
   # Should show: "Server running on port 3001"
   ```

2. **Verify FRONTEND_URL**
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

3. **Check CORS settings**
   - Ensure `FRONTEND_URL` matches your frontend server
   - Check for protocol mismatches (http vs https)

4. **Test backend directly**
   ```bash
   curl http://localhost:3001/api/health
   ```

#### "Page not loading"

**Solutions:**

1. **Check frontend server**
   ```bash
   npm run dev
   # Should show: "Local: http://localhost:5173"
   ```

2. **Check port conflicts**
   - Ensure port 5173 is available
   - Kill other processes using the port

3. **Clear browser cache**
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache and cookies

#### "Build errors"

**Solutions:**

1. **Check Node.js version**
   ```bash
   node --version
   # Should be 18 or higher
   ```

2. **Reinstall dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check TypeScript errors**
   ```bash
   npm run type-check
   ```

### Environment Issues

#### "Environment variables not loaded"

**Symptoms:**
- Application shows undefined values
- Configuration errors on startup
- Missing environment variables

**Solutions:**

1. **Check .env file exists**
   ```bash
   ls -la .env
   # Should show the file
   ```

2. **Verify .env file format**
   ```env
   # No spaces around =
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   # Not: DATABASE_URL = postgresql://...
   ```

3. **Check for typos**
   - Variable names are case-sensitive
   - No spaces in variable names

4. **Restart application**
   ```bash
   # Stop and restart
   npm run server
   ```

#### "JWT errors"

**Solutions:**

1. **Check JWT_SECRET is set**
   ```env
   JWT_SECRET=your-jwt-secret-here
   ```

2. **Verify secret is long enough**
   - Should be at least 32 characters
   - Use generated secrets from setup

3. **Check SESSION_SECRET**
   ```env
   SESSION_SECRET=your-session-secret-here
   ```

### Port Issues

#### "Port already in use"

**Solutions:**

1. **Find process using port**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   netstat -ano | findstr :5173
   
   # macOS/Linux
   lsof -i :3001
   lsof -i :5173
   ```

2. **Kill the process**
   ```bash
   # Windows
   taskkill /PID <process_id> /F
   
   # macOS/Linux
   kill -9 <process_id>
   ```

3. **Use different ports**
   ```env
   # Change in .env file
   FRONTEND_URL=http://localhost:3000
   ```

### Performance Issues

#### "Application is slow"

**Solutions:**

1. **Check database performance**
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC;
   ```

2. **Add database indexes**
   ```sql
   CREATE INDEX idx_expenses_user_id ON expenses(user_id);
   CREATE INDEX idx_expenses_date ON expenses(date);
   ```

3. **Check memory usage**
   ```bash
   # Check Node.js memory usage
   node --inspect server.js
   ```

4. **Optimize queries**
   - Use database query analyzer
   - Add proper indexes
   - Limit result sets

## 🔍 Debugging Steps

### Step 1: Check Prerequisites

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check PostgreSQL version
psql --version

# Check if PostgreSQL is running
pg_ctl status
```

### Step 2: Verify Configuration

```bash
# Check environment variables
node -e "console.log(process.env.DATABASE_URL)"
node -e "console.log(process.env.GOOGLE_CLIENT_ID)"

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Test OAuth URLs
curl "https://accounts.google.com/.well-known/openid_configuration"
```

### Step 3: Check Logs

```bash
# Backend logs
npm run server 2>&1 | tee server.log

# Frontend logs (browser console)
# Open Developer Tools → Console

# Database logs
# Check PostgreSQL log files
```

### Step 4: Test Components

```bash
# Test backend API
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:5173

# Test database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

## 🆘 Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Verify all prerequisites are installed**
3. **Check environment configuration**
4. **Review application logs**
5. **Test each component individually**

### Information to Provide

When asking for help, include:

1. **Operating system and version**
2. **Node.js version** (`node --version`)
3. **Error messages** (exact text)
4. **Steps to reproduce** the issue
5. **Configuration** (sanitized .env file)
6. **Logs** (relevant error messages)

### Useful Commands

```bash
# System information
node --version
npm --version
psql --version

# Check running processes
ps aux | grep node
ps aux | grep postgres

# Check ports
netstat -tulpn | grep :3001
netstat -tulpn | grep :5173

# Check disk space
df -h

# Check memory usage
free -h
```

## 📚 Related Documentation

- [Quick Start Guide](./quick-start.md) - Basic setup
- [Complete Setup Guide](./setup.md) - Detailed setup
- [Environment Configuration](./environment.md) - Environment variables
- [Database Setup](./database.md) - Database configuration
- [OAuth Setup](./oauth.md) - Authentication setup

## 🔄 Reset Everything

If all else fails, you can reset the entire setup:

```bash
# Stop all services
npm run server &
kill %1

# Reset database
dropdb expense_tracker
createdb expense_tracker

# Reset dependencies
rm -rf node_modules package-lock.json
npm install

# Reset environment
cp env.example .env
# Edit .env with your settings

# Start fresh
npm run server
npm run dev
```

---

**Still having issues? Check the logs and don't hesitate to ask for help! 🆘**

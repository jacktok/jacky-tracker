# Database Setup Guide

This guide covers setting up PostgreSQL database for the Jacky Tracker application, including installation, configuration, and troubleshooting.

## 🐘 PostgreSQL Requirements

- **Version**: PostgreSQL 12 or higher
- **Platform**: Windows, macOS, Linux
- **Memory**: Minimum 512MB RAM
- **Storage**: At least 1GB free space

## 📥 Installation

### Windows

#### Option 1: Official Installer (Recommended)
1. **Download PostgreSQL**
   - Go to [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
   - Download the latest version installer

2. **Run Installer**
   - Run the downloaded `.exe` file
   - Follow the installation wizard
   - **Important**: Remember the password you set for the `postgres` user

3. **Verify Installation**
   ```cmd
   psql --version
   ```

#### Option 2: Using Chocolatey
```cmd
# Install Chocolatey (if not already installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install PostgreSQL
choco install postgresql
```

#### Option 3: Using Scoop
```cmd
# Install Scoop (if not already installed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install PostgreSQL
scoop install postgresql
```

### macOS

#### Option 1: Using Homebrew (Recommended)
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql
```

#### Option 2: Official Installer
1. Go to [postgresql.org/download/macosx](https://www.postgresql.org/download/macosx/)
2. Download the installer
3. Run the installer and follow the setup wizard

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Linux (CentOS/RHEL)

```bash
# Install PostgreSQL
sudo yum install postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup initdb

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 🔧 Database Configuration

### Step 1: Create Database

#### Using createdb (Recommended)
```bash
# Create database
createdb expense_tracker

# Verify database exists
psql -l | grep expense_tracker
```

#### Using psql
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE expense_tracker;

# Exit psql
\q
```

#### Using pgAdmin
1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `expense_tracker`
4. Click "Save"

### Step 2: Create Application User (Optional but Recommended)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create user
CREATE USER tracker_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO tracker_user;

# Grant schema privileges
\c expense_tracker
GRANT ALL ON SCHEMA public TO tracker_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tracker_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tracker_user;

# Exit psql
\q
```

### Step 3: Configure Connection String

Update your `.env` file with the correct database URL:

```env
# Using default postgres user
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/expense_tracker

# Using custom user
DATABASE_URL=postgresql://tracker_user:your_secure_password@localhost:5432/expense_tracker

# For remote database
DATABASE_URL=postgresql://username:password@db.example.com:5432/expense_tracker

# With SSL enabled
DATABASE_URL=postgresql://username:password@db.example.com:5432/expense_tracker?sslmode=require
```

## 🔒 Security Configuration

### Basic Security Settings

1. **Change Default Password**
   ```bash
   # Connect as postgres user
   psql -U postgres
   
   # Change password
   ALTER USER postgres PASSWORD 'new_secure_password';
   ```

2. **Configure pg_hba.conf**
   - Location: `C:\Program Files\PostgreSQL\15\data\pg_hba.conf` (Windows)
   - Location: `/etc/postgresql/15/main/pg_hba.conf` (Linux)
   - Location: `/usr/local/var/postgres/pg_hba.conf` (macOS)

   **Recommended settings:**
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   local   all             postgres                                peer
   local   all             all                                     md5
   host    all             all             127.0.0.1/32            md5
   host    all             all             ::1/128                 md5
   ```

3. **Restart PostgreSQL**
   ```bash
   # Windows (as Administrator)
   net stop postgresql-x64-15
   net start postgresql-x64-15
   
   # macOS
   brew services restart postgresql
   
   # Linux
   sudo systemctl restart postgresql
   ```

### Production Security

1. **Use SSL Connections**
   ```env
   PGSSL=true
   DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
   ```

2. **Create Dedicated User**
   - Don't use `postgres` user for applications
   - Create user with minimal required privileges
   - Use strong, unique passwords

3. **Network Security**
   - Use firewall rules to restrict database access
   - Consider VPN or private networks
   - Monitor connection attempts

## 🧪 Testing Database Connection

### Test Connection from Command Line

```bash
# Test connection
psql -h localhost -U postgres -d expense_tracker

# Test with custom user
psql -h localhost -U tracker_user -d expense_tracker

# Test connection string
psql "postgresql://username:password@localhost:5432/expense_tracker"
```

### Test Connection from Application

```bash
# Start the application
npm run server

# Check logs for connection status
# Should see: "Database connected successfully"
```

### Test with Node.js

```javascript
// test-db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0]);
    client.release();
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
```

```bash
# Run the test
node test-db.js
```

## 🚨 Common Database Issues

### Connection Issues

| Issue | Solution |
|-------|----------|
| "Connection refused" | PostgreSQL service not running |
| "Authentication failed" | Wrong username/password |
| "Database does not exist" | Create the database first |
| "Permission denied" | Check user privileges |
| "Connection timeout" | Check network/firewall settings |

### Service Issues

| Issue | Solution |
|-------|----------|
| Service won't start | Check logs for errors |
| Port already in use | Change port or kill conflicting process |
| Permission denied | Run as administrator/root |
| Configuration error | Check postgresql.conf and pg_hba.conf |

### Performance Issues

| Issue | Solution |
|-------|----------|
| Slow queries | Add database indexes |
| High memory usage | Adjust shared_buffers |
| Connection limits | Increase max_connections |
| Disk space | Clean up old data or add storage |

## 🔧 Database Management

### Backup Database

```bash
# Create backup
pg_dump -U postgres -h localhost expense_tracker > backup.sql

# Create compressed backup
pg_dump -U postgres -h localhost expense_tracker | gzip > backup.sql.gz

# Restore from backup
psql -U postgres -h localhost expense_tracker < backup.sql
```

### Monitor Database

```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('expense_tracker'));

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Maintenance Tasks

```sql
-- Analyze tables for better query planning
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Full vacuum (takes longer)
VACUUM FULL;

-- Reindex for better performance
REINDEX DATABASE expense_tracker;
```

## 🐳 Docker Database Setup

### Using Docker Compose

Create `docker-compose.db.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: expense_tracker
      POSTGRES_USER: tracker_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# Start database
docker-compose -f docker-compose.db.yml up -d

# Stop database
docker-compose -f docker-compose.db.yml down

# View logs
docker-compose -f docker-compose.db.yml logs postgres
```

### Using Docker Run

```bash
# Run PostgreSQL container
docker run -d \
  --name postgres-tracker \
  -e POSTGRES_DB=expense_tracker \
  -e POSTGRES_USER=tracker_user \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15

# Connect to container
docker exec -it postgres-tracker psql -U tracker_user -d expense_tracker
```

## 📊 Database Schema

The application automatically creates the required tables on first run. The schema includes:

- **users** - User accounts and profiles
- **expenses** - Expense records
- **categories** - Expense categories
- **sessions** - User sessions

### Manual Schema Creation

If you need to create tables manually:

```sql
-- Connect to database
psql -U postgres -d expense_tracker

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    line_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_sessions_expire ON sessions(expire);
```

## 📚 Related Documentation

- [Environment Configuration](./environment.md) - Database environment variables
- [Complete Setup Guide](./setup.md) - Full application setup
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions
- [Docker Setup](./docker.md) - Containerized deployment

## 🆘 Getting Help

### Database Logs

**Windows:**
- Event Viewer → Windows Logs → Application
- Look for PostgreSQL entries

**macOS:**
```bash
# View PostgreSQL logs
tail -f /usr/local/var/log/postgres.log
```

**Linux:**
```bash
# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Common Commands

```bash
# Check PostgreSQL status
pg_ctl status

# Start PostgreSQL
pg_ctl start

# Stop PostgreSQL
pg_ctl stop

# Restart PostgreSQL
pg_ctl restart

# Reload configuration
pg_ctl reload
```

---

**Database setup complete! Your Jacky Tracker is ready to store data. 🗄️**

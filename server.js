'use strict';

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LineStrategy } from 'passport-line';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import connectPgSimple from 'connect-pg-simple';

dotenv.config();
const pgSession = connectPgSimple(session);

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Session configuration
app.use(session({
  store: new pgSession({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL?.toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined
    }),
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL?.toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

async function ensureSchema() {
  await pool.query(`
    create extension if not exists pgcrypto;
    
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      name text not null,
      picture text,
      provider text not null check (provider in ('google', 'line')),
      provider_id text not null,
      created_at timestamp with time zone default now(),
      unique(provider, provider_id)
    );
    
    create table if not exists categories (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      name text not null,
      created_at timestamp with time zone default now(),
      unique(user_id, name)
    );
    
    create table if not exists expenses (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      date date not null,
      amount numeric(12,2) not null check (amount >= 0),
      category text not null,
      note text not null default ''
    );
  `);
}

// Passport strategies - only enable if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await pool.query(
        'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
        ['google', profile.id]
      );

      if (user.rows.length === 0) {
        // Create new user
        const result = await pool.query(
          'INSERT INTO users (email, name, picture, provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [
            profile.emails[0].value,
            profile.displayName,
            profile.photos[0]?.value,
            'google',
            profile.id
          ]
        );
        user = result;
        
        // Add default categories for new user
        const defaultCategories = [
          'Food', 'Transport', 'Housing', 'Utilities', 'Health',
          'Entertainment', 'Shopping', 'Education', 'Travel', 'Loan', 'Other'
        ];
        
        for (const category of defaultCategories) {
          await pool.query(
            'INSERT INTO categories (user_id, name) VALUES ($1, $2)',
            [user.rows[0].id, category]
          );
        }
      }

      return done(null, user.rows[0]);
    } catch (error) {
      return done(error, null);
    }
  }));
  console.log('Google OAuth strategy enabled');
} else {
  console.log('Google OAuth disabled - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

if (process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET) {
  passport.use(new LineStrategy({
    channelID: process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    callbackURL: process.env.LINE_CALLBACK_URL || "/api/auth/line/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await pool.query(
        'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
        ['line', profile.id]
      );

      if (user.rows.length === 0) {
        // Create new user
        const result = await pool.query(
          'INSERT INTO users (email, name, picture, provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [
            profile.emails?.[0]?.value || `${profile.id}@line.user`,
            profile.displayName,
            profile.photos?.[0]?.value,
            'line',
            profile.id
          ]
        );
        user = result;
        
        // Add default categories for new user
        const defaultCategories = [
          'Food', 'Transport', 'Housing', 'Utilities', 'Health',
          'Entertainment', 'Shopping', 'Education', 'Travel', 'Loan', 'Other'
        ];
        
        for (const category of defaultCategories) {
          await pool.query(
            'INSERT INTO categories (user_id, name) VALUES ($1, $2)',
            [user.rows[0].id, category]
          );
        }
      }

      return done(null, user.rows[0]);
    } catch (error) {
      return done(error, null);
    }
  }));
  console.log('LINE OAuth strategy enabled');
} else {
  console.log('LINE OAuth disabled - missing LINE_CHANNEL_ID or LINE_CHANNEL_SECRET');
}

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Auth routes - only register if strategies are enabled
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google' }),
    (req, res) => {
      const token = jwt.sign(
        { 
          userId: req.user.id, 
          email: req.user.email,
          name: req.user.name 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}`);
    }
  );
}

if (process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET) {
  app.get('/api/auth/line', passport.authenticate('line'));

  app.get('/api/auth/line/callback',
    passport.authenticate('line', { failureRedirect: '/login?error=line' }),
    (req, res) => {
      const token = jwt.sign(
        { 
          userId: req.user.id, 
          email: req.user.email,
          name: req.user.name 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}`);
    }
  );
}

// Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, picture, provider, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
      createdAt: user.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, to_char(date, 'YYYY-MM-DD') as date, cast(amount as float8) as amount, category, coalesce(note, '') as note FROM expenses WHERE user_id = $1 ORDER BY date desc",
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  const { date, amount, category, note } = req.body || {};
  if (!date || amount == null || !category) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await pool.query(
      "INSERT INTO expenses(user_id, date, amount, category, note) VALUES ($1, $2, $3, $4, $5) RETURNING id, to_char(date, 'YYYY-MM-DD') as date, cast(amount as float8) as amount, category, coalesce(note, '') as note",
      [req.user.userId, date, amount, category, note || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/expenses/bulk', authenticateToken, async (req, res) => {
  const items = (req.body && Array.isArray(req.body.expenses)) ? req.body.expenses : null;
  if (!items || !items.length) return res.status(400).json({ error: 'No expenses provided' });
  const client = await pool.connect();
  try {
    await client.query('begin');
    const results = [];
    for (const it of items) {
      const { date, amount, category, note } = it || {};
      if (!date || amount == null || !category) continue;
      const r = await client.query(
        "INSERT INTO expenses(user_id, date, amount, category, note) VALUES ($1, $2, $3, $4, $5) RETURNING id, to_char(date, 'YYYY-MM-DD') as date, cast(amount as float8) as amount, category, coalesce(note, '') as note",
        [req.user.userId, date, amount, category, note || '']
      );
      results.push(r.rows[0]);
    }
    await client.query('commit');
    res.status(201).json(results);
  } catch (e) {
    try { await client.query('rollback'); } catch {}
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add update route for expenses
app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  const { date, amount, category, note } = req.body || {};
  if (!date || amount == null || !category) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await pool.query(
      "UPDATE expenses SET date = $1, amount = $2, category = $3, note = $4 WHERE id = $5 AND user_id = $6 RETURNING id, to_char(date, 'YYYY-MM-DD') as date, cast(amount as float8) as amount, category, coalesce(note, '') as note",
      [date, amount, category, note || '', req.params.id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Category management endpoints
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name FROM categories WHERE user_id = $1 ORDER BY name',
      [req.user.userId]
    );
    res.json(result.rows.map(row => row.name));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  
  try {
    const result = await pool.query(
      'INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING name',
      [req.user.userId, name]
    );
    res.json(result.rows[0].name);
  } catch (e) {
    if (e.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Category already exists' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.put('/api/categories/:oldName', authenticateToken, async (req, res) => {
  const { newName } = req.body || {};
  if (!newName) return res.status(400).json({ error: 'New category name is required' });
  
  try {
    // Start a transaction
    await pool.query('BEGIN');
    
    // Update the category name
    const categoryResult = await pool.query(
      'UPDATE categories SET name = $1 WHERE user_id = $2 AND name = $3 RETURNING name',
      [newName, req.user.userId, req.params.oldName]
    );
    
    if (categoryResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Update all expenses with the old category name
    await pool.query(
      'UPDATE expenses SET category = $1 WHERE user_id = $2 AND category = $3',
      [newName, req.user.userId, req.params.oldName]
    );
    
    await pool.query('COMMIT');
    res.json({ message: 'Category renamed successfully' });
  } catch (e) {
    await pool.query('ROLLBACK');
    if (e.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Category already exists' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.delete('/api/categories/:name', authenticateToken, async (req, res) => {
  const { migrateTo } = req.body || {};
  
  try {
    // Start a transaction
    await pool.query('BEGIN');
    
    // Check if category exists
    const categoryResult = await pool.query(
      'SELECT name FROM categories WHERE user_id = $1 AND name = $2',
      [req.user.userId, req.params.name]
    );
    
    if (categoryResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // If migration target is specified, update all expenses
    if (migrateTo) {
      // Verify migration target exists
      const targetResult = await pool.query(
        'SELECT name FROM categories WHERE user_id = $1 AND name = $2',
        [req.user.userId, migrateTo]
      );
      
      if (targetResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: 'Migration target category not found' });
      }
      
      // Update all expenses with the old category to the new category
      await pool.query(
        'UPDATE expenses SET category = $1 WHERE user_id = $2 AND category = $3',
        [migrateTo, req.user.userId, req.params.name]
      );
    } else {
      // Delete all expenses with this category
      await pool.query(
        'DELETE FROM expenses WHERE user_id = $1 AND category = $2',
        [req.user.userId, req.params.name]
      );
    }
    
    // Delete the category
    await pool.query(
      'DELETE FROM categories WHERE user_id = $1 AND name = $2',
      [req.user.userId, req.params.name]
    );
    
    await pool.query('COMMIT');
    res.json({ message: 'Category deleted successfully' });
  } catch (e) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
ensureSchema().then(() => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(`API accessible on local network at http://[YOUR_IP]:${port}`);
  });
}).catch((e) => {
  console.error('Failed to init schema', e);
  process.exit(1);
});



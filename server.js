'use strict';

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import LineLoginV2 from './line-login-v2.js';
import LineBotService from './line-bot-service.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import connectPgSimple from 'connect-pg-simple';
import LLMService from './llm-service.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const pgSession = connectPgSimple(session);

const app = express();
const llmService = new LLMService();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to add default categories for new users
async function addDefaultCategoriesForUser(userId) {
  const defaultCategories = [
    'Food & Dining', 
    'Transportation', 
    'Shopping', 
    'Entertainment', 
    'Healthcare', 
    'Utilities', 
    'Housing', 
    'Loans', 
    'Personal Care', 
    'Travel', 
    'Miscellaneous'
  ];
  
  for (const category of defaultCategories) {
    await pool.query(
      'INSERT INTO categories (user_id, name) VALUES ($1, $2)',
      [userId, category]
    );
  }
  
  console.log(`Added ${defaultCategories.length} default categories for new user ${userId}`);
}

// Helper function to add default prompt for new users
async function addDefaultPromptForUser(userId) {
  const defaultPrompt = 'You are an expert expense categorization assistant. Classify this expense into the most appropriate category based on the description and amount. Consider the context and choose from the available categories: {categoriesList}. Be specific and accurate in your classification. Respond with ONLY a JSON object in this exact format: {"field": "Category Name", "is_new": true/false}';
  
  await pool.query(
    'INSERT INTO user_prompts (user_id, content) VALUES ($1, $2)',
    [userId, defaultPrompt]
  );
  
  console.log(`Added default prompt for new user ${userId}`);
}

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

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
      line_user_id text unique,
      created_at timestamp with time zone default now(),
      unique(provider, provider_id)
    );
    
    -- Account linking table to support multiple providers per user
    create table if not exists user_providers (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      provider text not null check (provider in ('google', 'line')),
      provider_id text not null,
      email text,
      name text,
      picture text,
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
    
    create table if not exists user_prompts (
      user_id uuid primary key references users(id) on delete cascade,
      content text not null,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );
    
    create table if not exists user_sessions (
      sid varchar not null collate "default",
      sess json not null,
      expire timestamp(6) not null
    );
    
    create unique index if not exists user_sessions_pkey on user_sessions(sid);
    create index if not exists user_sessions_expire_idx on user_sessions(expire);
  `);
}

// Passport strategies - only enable if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const providerId = profile.id;
      
      // Check if this Google account is already linked to a user
      let userProvider = await pool.query(
        'SELECT up.*, u.* FROM user_providers up JOIN users u ON up.user_id = u.id WHERE up.provider = $1 AND up.provider_id = $2',
        ['google', providerId]
      );

      if (userProvider.rows.length > 0) {
        // User exists, return the main user record
        return done(null, userProvider.rows[0]);
      }

      // Check if a user with this email already exists
      let existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        // User exists with this email, link this Google account to existing user
        await pool.query(
          'INSERT INTO user_providers (user_id, provider, provider_id, email, name, picture) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            existingUser.rows[0].id,
            'google',
            providerId,
            email,
            profile.displayName,
            profile.photos[0]?.value
          ]
        );
        return done(null, existingUser.rows[0]);
      }

      // Create new user and link Google account
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Create main user record
        const userResult = await client.query(
          'INSERT INTO users (email, name, picture, provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [
            email,
            profile.displayName,
            profile.photos[0]?.value,
            'google',
            providerId
          ]
        );
        
        // Add to user_providers table for consistency
        await client.query(
          'INSERT INTO user_providers (user_id, provider, provider_id, email, name, picture) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            userResult.rows[0].id,
            'google',
            providerId,
            email,
            profile.displayName,
            profile.photos[0]?.value
          ]
        );
        
        await client.query('COMMIT');
        
        // Add default categories and prompt for new user
        await addDefaultCategoriesForUser(userResult.rows[0].id);
        await addDefaultPromptForUser(userResult.rows[0].id);
        
        return done(null, userResult.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      return done(error, null);
    }
  }));
  console.log('Google OAuth strategy enabled');
} else {
  console.log('Google OAuth disabled - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// Initialize LINE Login v2
let lineLogin = null;
if (process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET) {
  console.log('LINE Login v2 Configuration:');
  console.log('- Channel ID:', process.env.LINE_CHANNEL_ID);
  console.log('- Channel Secret:', process.env.LINE_CHANNEL_SECRET ? '***hidden***' : 'NOT SET');
  console.log('- Callback URL:', process.env.LINE_CALLBACK_URL || "/api/auth/line/callback");
  
  lineLogin = new LineLoginV2(
    process.env.LINE_CHANNEL_ID,
    process.env.LINE_CHANNEL_SECRET,
    process.env.LINE_CALLBACK_URL || "/api/auth/line/callback"
  );
  
  console.log('LINE Login v2 strategy enabled');
} else {
  console.log('LINE OAuth disabled - missing LINE_CHANNEL_ID or LINE_CHANNEL_SECRET');
}

// LINE Bot Configuration
let lineBotService = null;
if (process.env.LINE_BOT_CHANNEL_ID && process.env.LINE_BOT_CHANNEL_SECRET && process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN) {
  const lineBotConfig = {
    channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_BOT_CHANNEL_SECRET,
  };
  
  lineBotService = new LineBotService(lineBotConfig);
  console.log('LINE Bot service enabled');
} else {
  console.log('LINE Bot disabled - missing LINE_BOT_CHANNEL_ID, LINE_BOT_CHANNEL_SECRET, or LINE_BOT_CHANNEL_ACCESS_TOKEN');
}

// Test endpoint to check LINE configuration
app.get('/api/test/line-config', (req, res) => {
  const config = {
    hasChannelId: !!process.env.LINE_CHANNEL_ID,
    hasChannelSecret: !!process.env.LINE_CHANNEL_SECRET,
    channelId: process.env.LINE_CHANNEL_ID,
    callbackUrl: process.env.LINE_CALLBACK_URL || "/api/auth/line/callback",
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    lineLoginInitialized: !!lineLogin
  };
  res.json(config);
});

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
  
  // Prepare for linking Google account
  app.post('/api/auth/google/prepare-link', authenticateToken, (req, res) => {
    try {
      // Store the current user ID in session for the callback
      req.session.linkingUserId = req.user.userId;
      res.json({ success: true, message: 'Ready to link Google account' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to prepare linking' });
    }
  });
  
  // Special endpoint for linking Google account when already logged in
  app.get('/api/auth/google/link', (req, res, next) => {
    // Check if user has prepared for linking
    if (!req.session.linkingUserId) {
      return res.status(401).json({ error: 'Please initiate linking from the settings page' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google' }),
    async (req, res) => {
      try {
        // Check if this was a linking request
        if (req.session.linkingUserId) {
          const linkingUserId = req.session.linkingUserId;
          delete req.session.linkingUserId;
          
          // Link the Google account to the existing user
          await pool.query(
            'INSERT INTO user_providers (user_id, provider, provider_id, email, name, picture) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              linkingUserId,
              'google',
              req.user.provider_id,
              req.user.email,
              req.user.name,
              req.user.picture
            ]
          );
          
          res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?linked=google`);
          return;
        }
        
        // Normal login flow
        const token = jwt.sign(
          { 
            userId: req.user.id, 
            email: req.user.email,
            name: req.user.name 
          },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}?token=${token}`);
      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=google`);
      }
    }
  );
}

if (process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET) {
  // LINE Login v2 routes
  app.get('/api/auth/line', (req, res) => {
    if (!lineLogin) {
      return res.status(500).json({ error: 'LINE Login not configured' });
    }
    const state = Math.random().toString(36).substring(7);
    req.session.lineState = state;
    const authUrl = lineLogin.getAuthUrl(state);
    res.redirect(authUrl);
  });
  
  // Prepare for linking LINE account
  app.post('/api/auth/line/prepare-link', authenticateToken, (req, res) => {
    try {
      // Store the current user ID in session for the callback
      req.session.linkingUserId = req.user.userId;
      res.json({ success: true, message: 'Ready to link LINE account' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to prepare linking' });
    }
  });
  
  // Special endpoint for linking LINE account when already logged in
  app.get('/api/auth/line/link', (req, res) => {
    if (!lineLogin) {
      return res.status(500).json({ error: 'LINE Login not configured' });
    }
    // Check if user has prepared for linking
    if (!req.session.linkingUserId) {
      return res.status(401).json({ error: 'Please initiate linking from the settings page' });
    }
    const state = Math.random().toString(36).substring(7);
    req.session.lineState = state;
    const authUrl = lineLogin.getAuthUrl(state);
    res.redirect(authUrl);
  });

  app.get('/api/auth/line/callback', async (req, res) => {
    if (!lineLogin) {
      return res.status(500).json({ error: 'LINE Login not configured' });
    }
    try {
      const { code, state } = req.query;
      
      // Verify state parameter
      if (!state || state !== req.session.lineState) {
        console.error('LINE OAuth: Invalid state parameter');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?error=line_oauth_failed`);
      }
      
      // Exchange code for token
      const tokenData = await lineLogin.exchangeCodeForToken(code);
      console.log('LINE token data received:', { 
        access_token: tokenData.access_token ? '***received***' : 'missing',
        id_token: tokenData.id_token ? '***received***' : 'missing'
      });
      
      // Get user profile from ID token (more reliable than API call)
      let profile;
      if (tokenData.id_token) {
        profile = await lineLogin.getIdTokenUser(tokenData.id_token);
      } else {
        // Fallback to API call if no ID token
        profile = await lineLogin.getUserProfile(tokenData.access_token);
      }
      
      console.log('LINE profile received:', { 
        id: profile.id, 
        name: profile.displayName,
        email: profile.email ? '***has email***' : 'no email'
      });
      
      const email = profile.email || `${profile.id}@line.user`;
      const providerId = profile.id;
      
      // Check if this LINE account is already linked to a user
      let userProvider = await pool.query(
        'SELECT up.*, u.* FROM user_providers up JOIN users u ON up.user_id = u.id WHERE up.provider = $1 AND up.provider_id = $2',
        ['line', providerId]
      );

      let user;
      if (userProvider.rows.length > 0) {
        // User exists, return the main user record
        user = userProvider.rows[0];
      } else if (req.session.linkingUserId) {
        // This is a linking request
        const linkingUserId = req.session.linkingUserId;
        delete req.session.linkingUserId;
        
        // Link the LINE account to the existing user
        await pool.query(
          'INSERT INTO user_providers (user_id, provider, provider_id, email, name, picture) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            linkingUserId,
            'line',
            providerId,
            email,
            profile.displayName,
            profile.pictureUrl
          ]
        );
        
        // Get the existing user
        const existingUser = await pool.query('SELECT * FROM users WHERE id = $1', [linkingUserId]);
        user = existingUser.rows[0];
        
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?linked=line`);
        return;
      } else {
        // Create new user and link LINE account
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // Create main user record
          const userResult = await client.query(
            'INSERT INTO users (email, name, picture, provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [
              email,
              profile.displayName,
              profile.pictureUrl,
              'line',
              providerId
            ]
          );
          
          // Add to user_providers table for consistency
          await client.query(
            'INSERT INTO user_providers (user_id, provider, provider_id, email, name, picture) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              userResult.rows[0].id,
              'line',
              providerId,
              email,
              profile.displayName,
              profile.pictureUrl
            ]
          );
          
          await client.query('COMMIT');
          
          // Add default categories and prompt for new user
          await addDefaultCategoriesForUser(userResult.rows[0].id);
          await addDefaultPromptForUser(userResult.rows[0].id);
          
          user = userResult.rows[0];
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
      
      // Clean up session state
      delete req.session.lineState;
      
      // Normal login flow
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          name: user.name 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}?token=${token}`);
    } catch (error) {
      console.error('LINE callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?error=line_oauth_failed`);
    }
  });
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

// Get linked accounts for current user
app.get('/api/auth/linked-accounts', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT provider, email, name, picture, created_at FROM user_providers WHERE user_id = $1 ORDER BY created_at',
      [req.user.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlink an account
app.delete('/api/auth/linked-accounts/:provider', authenticateToken, async (req, res) => {
  const { provider } = req.params;
  
  if (!['google', 'line'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }
  
  try {
    // Check if user has other linked accounts
    const otherAccounts = await pool.query(
      'SELECT COUNT(*) as count FROM user_providers WHERE user_id = $1 AND provider != $2',
      [req.user.userId, provider]
    );
    
    if (parseInt(otherAccounts.rows[0].count) === 0) {
      return res.status(400).json({ 
        error: 'Cannot unlink the only remaining account. Link another account first.' 
      });
    }
    
    // Remove the linked account
    await pool.query(
      'DELETE FROM user_providers WHERE user_id = $1 AND provider = $2',
      [req.user.userId, provider]
    );
    
    res.json({ message: 'Account unlinked successfully' });
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

// LLM-based category classification endpoint
app.post('/api/classify-expense', authenticateToken, async (req, res) => {
  const { message, amount, description, promptId } = req.body || {};
  
  if (!message || !amount) {
    return res.status(400).json({ error: 'Message and amount are required' });
  }
  
  try {
    // Get user's existing categories for context
    const categoriesResult = await pool.query(
      'SELECT name FROM categories WHERE user_id = $1 ORDER BY name',
      [req.user.userId]
    );
    const existingCategories = categoriesResult.rows.map(row => row.name);
    
    // Get user's custom prompt if exists
    let customPrompt = null;
    const promptResult = await pool.query(
      'SELECT content FROM user_prompts WHERE user_id = $1',
      [req.user.userId]
    );
    if (promptResult.rows.length > 0) {
      customPrompt = promptResult.rows[0].content;
    }
    
    // Use LLM service for classification
    const result = await llmService.classifyExpense(message, amount, description, existingCategories, customPrompt);
    
    res.json(result);
  } catch (e) {
    console.error('Classification error:', e);
    res.status(500).json({ error: 'Failed to classify expense' });
  }
});

// Get default prompt endpoint
app.get('/api/default-prompt', (req, res) => {
  try {
    const defaultPrompt = llmService.getDefaultPrompt();
    res.json({ content: defaultPrompt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User prompt management endpoints
app.get('/api/user-prompt', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT content, created_at, updated_at FROM user_prompts WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No custom prompt found' });
    }
    
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/user-prompt', authenticateToken, async (req, res) => {
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ error: 'Content is required' });
  
  try {
    const result = await pool.query(
      'INSERT INTO user_prompts (user_id, content) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET content = $2, updated_at = now() RETURNING content, created_at, updated_at',
      [req.user.userId, content]
    );
    
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/user-prompt', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM user_prompts WHERE user_id = $1 RETURNING user_id',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No custom prompt found' });
    }
    
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// LINE Bot Webhook Endpoint
if (lineBotService) {
  app.post('/api/line/webhook', lineBotService.getMiddleware(), async (req, res) => {
    try {
      const events = req.body.events;
      
      for (const event of events) {
        await lineBotService.handleEvent(event);
      }
      
      res.status(200).end();
    } catch (error) {
      console.error('LINE webhook error:', error);
      res.status(500).end();
    }
  });
  
  // Create LINE user
  app.post('/api/auth/line-user', async (req, res) => {
    try {
      const { lineUserId, name, email } = req.body;
      
      if (!lineUserId) {
        return res.status(400).json({ error: 'LINE user ID is required' });
      }
      
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE line_user_id = $1',
        [lineUserId]
      );
      
      if (existingUser.rows.length > 0) {
        const token = jwt.sign(
          { userId: existingUser.rows[0].id, email: existingUser.rows[0].email },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({ token, user: existingUser.rows[0] });
      }
      
      // Create new user
      const result = await pool.query(
        'INSERT INTO users (line_user_id, name, email, picture) VALUES ($1, $2, $3, $4) RETURNING *',
        [lineUserId, name, email, null]
      );
      
      const user = result.rows[0];
      
      // Add default categories and prompt for new user
      await addDefaultCategoriesForUser(user.id);
      await addDefaultPromptForUser(user.id);
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.json({ token, user });
    } catch (error) {
      console.error('Error creating LINE user:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get LINE user by ID
  app.get('/api/auth/line-user/:lineUserId', async (req, res) => {
    try {
      const { lineUserId } = req.params;
      
      const result = await pool.query(
        'SELECT * FROM users WHERE line_user_id = $1',
        [lineUserId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.json({ token, user });
    } catch (error) {
      console.error('Error getting LINE user:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  console.log('LINE Bot webhook endpoint enabled at /api/line/webhook');
}

// Catch-all handler: send back React's index.html file for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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



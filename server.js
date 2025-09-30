'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL?.toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined
});

async function ensureSchema() {
  await pool.query(`
    create extension if not exists pgcrypto;
    create table if not exists expenses (
      id uuid primary key default gen_random_uuid(),
      date date not null,
      amount numeric(12,2) not null check (amount >= 0),
      category text not null,
      note text not null default ''
    );
  `);
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const result = await pool.query("select id, to_char(date, 'YYYY-MM-DD') as date, cast(amount as float8) as amount, category, coalesce(note, '') as note from expenses order by date desc");
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { date, amount, category, note } = req.body || {};
  if (!date || amount == null || !category) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await pool.query(
      "insert into expenses(date, amount, category, note) values ($1, $2, $3, $4) returning id, to_char(date, 'YYYY-MM-DD') as date, cast(amount as float8) as amount, category, coalesce(note, '') as note",
      [date, amount, category, note || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/expenses/bulk', async (req, res) => {
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
        "insert into expenses(date, amount, category, note) values ($1, $2, $3, $4) returning id, to_char(date, 'YYYY-MM-DD') as date, cast(amount as float8) as amount, category, coalesce(note, '') as note",
        [date, amount, category, note || '']
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

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await pool.query('delete from expenses where id = $1', [req.params.id]);
    res.status(204).end();
  } catch (e) {
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



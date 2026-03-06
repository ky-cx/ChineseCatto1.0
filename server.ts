import express from 'express';
import session from 'express-session';
import axios from 'axios';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('chinese_catto.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    github_id INTEGER UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    username TEXT,
    avatar_url TEXT,
    cat_coins INTEGER DEFAULT 0,
    inventory TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS words (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    character TEXT,
    pinyin TEXT,
    meaning TEXT,
    created_at INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Ensure columns exist (for existing databases)
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const columns = tableInfo.map(c => c.name);

console.log('Current columns in users table:', columns);

if (!columns.includes('email')) {
  try { 
    console.log('Adding email column...');
    db.exec("ALTER TABLE users ADD COLUMN email TEXT"); 
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    console.log('Email column added successfully.');
  } catch(e: any) {
    console.error('Failed to add email column:', e.message);
  }
}
if (!columns.includes('password')) {
  try { 
    console.log('Adding password column...');
    db.exec("ALTER TABLE users ADD COLUMN password TEXT"); 
    console.log('Password column added successfully.');
  } catch(e: any) {
    console.error('Failed to add password column:', e.message);
  }
}
if (!columns.includes('cat_coins')) {
  try { 
    console.log('Adding cat_coins column...');
    db.exec("ALTER TABLE users ADD COLUMN cat_coins INTEGER DEFAULT 0"); 
    console.log('Cat_coins column added successfully.');
  } catch(e: any) {
    console.error('Failed to add cat_coins column:', e.message);
  }
}
if (!columns.includes('inventory')) {
  try { 
    console.log('Adding inventory column...');
    db.exec("ALTER TABLE users ADD COLUMN inventory TEXT DEFAULT '[]'"); 
    console.log('Inventory column added successfully.');
  } catch(e: any) {
    console.error('Failed to add inventory column:', e.message);
  }
}

import fs from 'fs';

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.set('trust proxy', 1);

  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'catto-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // API routes go here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/test', (req, res) => {
    res.send('Express is working!');
  });
  app.get('/api/debug/db', (req, res) => {
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
      const users = db.prepare('SELECT id, email, username FROM users LIMIT 5').all();
      res.json({ userCount: userCount.count, sampleUsers: users });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;
    console.log(`Register attempt for: ${email}`);
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
      const id = crypto.randomUUID();
      const username = email.split('@')[0];
      const avatar_url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${email}`;
      
      db.prepare('INSERT INTO users (id, email, password, username, avatar_url) VALUES (?, ?, ?, ?, ?)')
        .run(id, email, password, username, avatar_url);
      
      const user = { id, email, username, avatar_url, cat_coins: 0, inventory: '[]' };
      (req.session as any).userId = id;
      (req.session as any).user = user;
      console.log(`User registered successfully: ${id}`);
      res.json({ user });
    } catch (e: any) {
      console.error(`Registration error for ${email}:`, e.message);
      if (e.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as any;
    if (!user) {
      console.log(`Login failed for: ${email} - Invalid credentials`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    (req.session as any).userId = user.id;
    (req.session as any).user = user;
    console.log(`User logged in successfully: ${user.id}`);
    res.json({ user });
  });

  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID not configured' });
    }
    const baseUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user`;
    res.json({ url });
  });

  app.get('/api/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
      // Exchange code for token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { Accept: 'application/json' }
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user info
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const githubUser = userResponse.data;
      const email = githubUser.email || `${githubUser.login}@github.com`;

      // Upsert user in DB
      let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(githubUser.id) as any;
      if (!user) {
        const id = crypto.randomUUID();
        db.prepare('INSERT INTO users (id, github_id, username, avatar_url, email) VALUES (?, ?, ?, ?, ?)')
          .run(id, githubUser.id, githubUser.login, githubUser.avatar_url, email);
        user = { id, github_id: githubUser.id, username: githubUser.login, avatar_url: githubUser.avatar_url, email };
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).user = user;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. Closing window...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.json({ user: null });
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    res.json({ user });
  });

  app.post('/api/user/sync', (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { cat_coins, inventory } = req.body;
    db.prepare('UPDATE users SET cat_coins = ?, inventory = ? WHERE id = ?')
      .run(cat_coins, JSON.stringify(inventory), userId);
    
    res.json({ success: true });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Words API
  app.get('/api/words', (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const words = db.prepare('SELECT * FROM words WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json(words.map((w: any) => ({
      id: w.id,
      character: w.character,
      pinyin: w.pinyin,
      meaning: w.meaning,
      createdAt: w.created_at
    })));
  });

  app.post('/api/words', (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { character, pinyin, meaning } = req.body;
    const id = crypto.randomUUID();
    const createdAt = Date.now();

    db.prepare('INSERT INTO words (id, user_id, character, pinyin, meaning, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, userId, character, pinyin, meaning, createdAt);

    res.json({ id, character, pinyin, meaning, createdAt });
  });

  app.delete('/api/words/:id', (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    db.prepare('DELETE FROM words WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  } catch (e: any) {
    fs.writeFileSync('error.log', e.stack || e.message);
    console.error(e);
  }
}

startServer();

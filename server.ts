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
    username TEXT,
    avatar_url TEXT
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

import fs from 'fs';

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

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
  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID not configured' });
    }
    const redirectUri = `${process.env.APP_URL}/api/auth/github/callback`;
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

      // Upsert user in DB
      let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(githubUser.id) as any;
      if (!user) {
        const id = crypto.randomUUID();
        db.prepare('INSERT INTO users (id, github_id, username, avatar_url) VALUES (?, ?, ?, ?)')
          .run(id, githubUser.id, githubUser.login, githubUser.avatar_url);
        user = { id, github_id: githubUser.id, username: githubUser.login, avatar_url: githubUser.avatar_url };
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
    res.json({ user: (req.session as any).user || null });
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

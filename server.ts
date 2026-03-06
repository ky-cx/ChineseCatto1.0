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
const dbPath = process.env.RENDER ? '/var/data/chinese_catto.db' : 'chinese_catto.db';
const db = new Database(dbPath);

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
    inventory TEXT DEFAULT '[]',
    last_income_sync INTEGER,
    mood INTEGER DEFAULT 100,
    current_map_level INTEGER DEFAULT 1,
    timer_start_time INTEGER,
    streak_count INTEGER DEFAULT 0,
    last_streak_date TEXT
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
if (!columns.includes('last_income_sync')) {
  try { 
    console.log('Adding last_income_sync column...');
    db.exec("ALTER TABLE users ADD COLUMN last_income_sync INTEGER"); 
    console.log('Last_income_sync column added successfully.');
  } catch(e: any) {
    console.error('Failed to add last_income_sync column:', e.message);
  }
}
if (!columns.includes('mood')) {
  try { 
    console.log('Adding mood column...');
    db.exec("ALTER TABLE users ADD COLUMN mood INTEGER DEFAULT 100"); 
    console.log('Mood column added successfully.');
  } catch(e: any) {
    console.error('Failed to add mood column:', e.message);
  }
}
if (!columns.includes('current_map_level')) {
  try { 
    console.log('Adding current_map_level column...');
    db.exec("ALTER TABLE users ADD COLUMN current_map_level INTEGER DEFAULT 1"); 
    console.log('Current_map_level column added successfully.');
  } catch(e: any) {
    console.error('Failed to add current_map_level column:', e.message);
  }
}
if (!columns.includes('timer_start_time')) {
  try { 
    console.log('Adding timer_start_time column...');
    db.exec("ALTER TABLE users ADD COLUMN timer_start_time INTEGER"); 
    console.log('Timer_start_time column added successfully.');
  } catch(e: any) {
    console.error('Failed to add timer_start_time column:', e.message);
  }
}
if (!columns.includes('streak_count')) {
  try { 
    console.log('Adding streak_count column...');
    db.exec("ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0"); 
    console.log('Streak_count column added successfully.');
  } catch(e: any) {
    console.error('Failed to add streak_count column:', e.message);
  }
}
if (!columns.includes('last_streak_date')) {
  try { 
    console.log('Adding last_streak_date column...');
    db.exec("ALTER TABLE users ADD COLUMN last_streak_date TEXT"); 
    console.log('Last_streak_date column added successfully.');
  } catch(e: any) {
    console.error('Failed to add last_streak_date column:', e.message);
  }
}

import fs from 'fs';

function calculatePassiveIncome(user: any) {
  const now = Date.now();
  const lastSync = user.last_income_sync || now;
  const elapsedMs = now - lastSync;
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  
  // Rate: 1 coin per 1 minute
  const coinsToAward = Math.floor(elapsedMinutes / 1);
  
  if (coinsToAward > 0) {
    const newCoins = (user.cat_coins || 0) + coinsToAward;
    db.prepare('UPDATE users SET cat_coins = ?, last_income_sync = ? WHERE id = ?')
      .run(newCoins, now, user.id);
    user.cat_coins = newCoins;
    user.last_income_sync = now;
    user.passive_earned = coinsToAward; // Flag for frontend
  } else if (elapsedMs > 1000 * 60) {
    db.prepare('UPDATE users SET last_income_sync = ? WHERE id = ?')
      .run(now, user.id);
    user.last_income_sync = now;
  }
  return user;
}

function updateStreak(user: any) {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = user.last_streak_date;
  
  if (lastDate === today) return { streak_updated: false };

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = 1;
  let rewardCoins = 50; // Base reward
  let rewardMood = 10;

  if (lastDate === yesterday) {
    newStreak = (user.streak_count || 0) + 1;
    // Bonus for longer streaks
    rewardCoins += Math.min(newStreak * 10, 200);
    rewardMood += Math.min(newStreak * 2, 30);
  }

  db.prepare('UPDATE users SET streak_count = ?, last_streak_date = ?, cat_coins = cat_coins + ?, mood = MIN(100, mood + ?) WHERE id = ?')
    .run(newStreak, today, rewardCoins, rewardMood, user.id);
  
  user.streak_count = newStreak;
  user.last_streak_date = today;
  user.cat_coins += rewardCoins;
  user.mood = Math.min(100, user.mood + rewardMood);

  return { 
    streak_updated: true, 
    new_streak: newStreak, 
    reward_coins: rewardCoins,
    reward_mood: rewardMood
  };
}

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
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Register attempt for: ${normalizedEmail}`);

    try {
      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'This email is already registered. Please sign in instead!' });
      }

      const id = crypto.randomUUID();
      const username = normalizedEmail.split('@')[0];
      const avatar_url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${normalizedEmail}`;
      const now = Date.now();
      
      db.prepare('INSERT INTO users (id, email, password, username, avatar_url, last_income_sync) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, normalizedEmail, password, username, avatar_url, now);
      
      const userWithIncome = calculatePassiveIncome({ id, email: normalizedEmail, username, avatar_url, cat_coins: 0, inventory: '[]', mood: 100, current_map_level: 1, last_income_sync: now });
      (req.session as any).userId = id;
      (req.session as any).user = userWithIncome;
      console.log(`User registered successfully: ${id}`);
      res.json({ user: userWithIncome });
    } catch (e: any) {
      console.error(`Registration system error for ${email}:`, e.message);
      res.status(500).json({ error: 'Registration failed. Please try again later.' });
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

    const userWithIncome = calculatePassiveIncome(user);
    (req.session as any).userId = userWithIncome.id;
    (req.session as any).user = userWithIncome;
    console.log(`User logged in successfully: ${userWithIncome.id}`);
    res.json({ user: userWithIncome });
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
      const email = (githubUser.email || `${githubUser.login}@github.com`).toLowerCase();

      // Upsert user in DB
      let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(githubUser.id) as any;
      
      if (!user) {
        // Check if a user with this email already exists (e.g. registered via password)
        const existingByEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
        
        if (existingByEmail) {
          // Link GitHub to existing email account
          db.prepare('UPDATE users SET github_id = ?, avatar_url = ? WHERE id = ?')
            .run(githubUser.id, githubUser.avatar_url, existingByEmail.id);
          user = { ...existingByEmail, github_id: githubUser.id, avatar_url: githubUser.avatar_url };
          console.log(`Linked GitHub account ${githubUser.id} to existing user ${user.id}`);
        } else {
          // Create new user
          const id = crypto.randomUUID();
          const now = Date.now();
          db.prepare('INSERT INTO users (id, github_id, username, avatar_url, email, last_income_sync) VALUES (?, ?, ?, ?, ?, ?)')
            .run(id, githubUser.id, githubUser.login, githubUser.avatar_url, email, now);
          user = { id, github_id: githubUser.id, username: githubUser.login, avatar_url: githubUser.avatar_url, email, last_income_sync: now, mood: 100, current_map_level: 1 };
          console.log(`Created new user via GitHub: ${id}`);
        }
      }

      // Calculate passive income for GitHub user
      const userWithIncome = calculatePassiveIncome(user);

      // Set session
      (req.session as any).userId = userWithIncome.id;
      (req.session as any).user = userWithIncome;

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
    if (!user) return res.json({ user: null });

    const userWithIncome = calculatePassiveIncome(user);
    // Check streak on login/refresh
    const streakResult = updateStreak(userWithIncome);
    res.json({ user: userWithIncome, streak: streakResult });
  });

  app.post('/api/user/sync', (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { cat_coins, inventory, mood, current_map_level, timer_start_time } = req.body;
    const now = Date.now();
    
    // Update basic stats
    db.prepare('UPDATE users SET cat_coins = ?, inventory = ?, mood = ?, current_map_level = ?, timer_start_time = ?, last_income_sync = ? WHERE id = ?')
      .run(cat_coins, JSON.stringify(inventory), mood ?? 100, current_map_level ?? 1, timer_start_time ?? null, now, userId);
    
    // Also trigger streak update if they are active
    const streakResult = updateStreak(user);
    
    res.json({ success: true, streak: streakResult });
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

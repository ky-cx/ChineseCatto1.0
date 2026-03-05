Chinese Catto 1.0 🐱🇨🇳

A gamified Chinese-learning web app with a cute cat theme.
Learn vocabulary, chat with Catto, track progress, and build your personal word library.

Features

• Chinese learning levels (numbers, greetings, family, food, animals, colors, nature)
• Word collector (character, pinyin, meaning)
• AI chat assistant (Gemini-powered Catto chat)
• GitHub OAuth login (optional)
• Personal word library with create/delete support
• Gamified UI (cats, coins, inventory/shop, progress map)
• Dark/Light theme
• Local persistence with browser storage + SQLite backend

Tech Stack

• Frontend: React + TypeScript + Vite
• Backend: Express + TypeScript
• Database: SQLite (better-sqlite3)
• Auth: GitHub OAuth + express-session
• AI: Google Gemini (@google/genai)
• Styling/Animation: Tailwind + Motion + Lucide icons

Project Structure

copy


.
├── src/ # React frontend
├── server.ts # Express server + API routes + DB init
├── chinese_catto.db # SQLite database (generated at runtime)
├── .env.example # Environment variable template
└── README.md

Quick Start

1) Prerequisites

• Node.js 18+ (recommended latest LTS)
• npm

2) Install dependencies

Bash


npm install

3) Configure environment

Create .env.local (or .env) using .env.example:

copy


GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_long_random_secret

GitHub OAuth is optional for local testing, but required for GitHub login.
4) Run development server

Bash


npm run dev

App runs at:

• http://localhost:3000

Available Scripts

• npm run dev — start backend + Vite middleware in dev mode
• npm run build — build frontend
• npm run preview — preview build
• npm run lint — TypeScript check
• npm run clean — remove dist folder

API Endpoints (Summary)

• GET /api/health — health check
• GET /api/auth/github/url — get GitHub OAuth URL
• GET /api/auth/github/callback — OAuth callback
• GET /api/auth/me — current user
• POST /api/auth/logout — logout
• GET /api/words — list words
• POST /api/words — add word
• DELETE /api/words/:id — delete word

Notes

• In local development, if login/session cookies fail, check secure cookie settings in server.ts and HTTPS requirements.
• Keep .env* files private and never commit secrets.

Roadmap

• Better spaced-repetition review flow
• Pronunciation/audio support
• More level packs and quizzes
• Progress analytics dashboard
• Deployment guide (Render/Vercel + backend hosting)

Author

Conghui Xu

• LinkedIn: https://www.linkedin.com/in/cx27/
• Portfolio: https://ky-cx.github.io/

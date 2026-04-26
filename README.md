# Moving to Waco — Collaborative Move Planning Dashboard

A beautiful, mobile-first dashboard for planning a move together. Built with React, Supabase, and AI-powered natural language task creation.

## Features

✅ **Real-time Sync** — Changes appear instantly for both Ram and Fernanda  
✅ **Magic Link Auth** — No passwords needed, just email login  
✅ **AI Task Creation** — "Remind me to call the realtor Friday" → instant task  
✅ **Mobile-First Design** — Perfect for planning on the go  
✅ **Task Categories** — Housing, Current House, Job, Bills, General  
✅ **Priority & Due Dates** — Track what matters most  
✅ **Low Cost** — ~$1/month or less

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Database:** Supabase (real-time Postgres)
- **Auth:** Supabase magic links (email-only)
- **API:** Vercel serverless functions
- **AI:** Anthropic Claude for natural language → task parsing
- **Hosting:** Vercel + Supabase (both free tier)

## Quick Start

### For Development

1. Clone this repo
2. Copy `.env.example` to `.env.local` and fill in your keys
3. `npm install && npm run dev`
4. Open http://localhost:5173

### For Production

See [SETUP.md](./SETUP.md) for step-by-step deployment instructions.

## How It Works

1. **Login** — Click "Send login link" with your email
2. **Add Tasks** — Two ways:
   - Click "Add" for structured form
   - Click "Ask AI" to describe it naturally ("schedule house inspection Wednesday")
3. **Collaborate** — Both Ram and Fernanda see updates in real-time
4. **Track Progress** — Check off tasks as you complete them

## Project Structure

```
src/
├── App.tsx              # Main dashboard component
├── components/
│   ├── AuthProvider.tsx # Auth context wrapper
│   ├── LoginForm.tsx    # Email magic link form
│   └── AddTaskNL.tsx    # AI-powered task creation
├── lib/
│   └── supabase.ts      # Supabase client
└── ...

api/
├── parse-task.ts        # AI task parser (Vercel function)
└── tasks.ts             # CRUD API (Vercel function)
```

## Environment Variables

See `.env.example` for the full list. You'll need:

- Supabase URL & keys
- Anthropic API key

## Deployment

Push to GitHub, link to Vercel, add env vars → live in 2 minutes.

See [SETUP.md](./SETUP.md) for detailed instructions.

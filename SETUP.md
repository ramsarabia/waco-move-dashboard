# Waco Move Dashboard - Setup Guide

## Prerequisites
- GitHub account
- Vercel account (vercel.com)
- Supabase account (supabase.com)
- Anthropic API key (console.anthropic.com)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Name it "waco-move"
4. Save the generated password somewhere safe
5. Wait for project to be created

### Create Database Table

1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy and paste this SQL:

```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  assigned_to TEXT NOT NULL,
  due_date DATE,
  priority TEXT NOT NULL,
  last_updated_by TEXT NOT NULL,
  last_updated_at TIMESTAMP DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_access" 
  ON tasks FOR ALL 
  USING (auth.uid() IS NOT NULL);
```

4. Click "Run"

### Get Your Supabase Keys

1. Go to Settings → API
2. Copy:
   - `Project URL` → save as `SUPABASE_URL`
   - `anon public` → save as `SUPABASE_ANON_KEY` (VITE_ prefix)
   - `service_role secret` → save as `SUPABASE_SERVICE_KEY`

## Step 2: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Save it as `ANTHROPIC_API_KEY`

## Step 3: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it "waco-move-dashboard"
3. Click "Create repository"
4. Follow the instructions to push this code:

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/waco-move-dashboard.git
git push -u origin main
```

## Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your "waco-move-dashboard" GitHub repo
4. Click "Import"
5. Under "Environment Variables", add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_SERVICE_KEY` = your service role key
   - `ANTHROPIC_API_KEY` = your Anthropic API key
6. Click "Deploy"

Your app will be live at `https://your-project.vercel.app`

## Step 5: Enable Magic Link Auth in Supabase

1. In Supabase, go to Authentication → Providers
2. Make sure "Email" is enabled
3. Go to Authentication → URL Configuration
4. Add your Vercel URL as "Site URL": `https://your-project.vercel.app`
5. Add Redirect URL: `https://your-project.vercel.app`

## Step 6: Test It Out

1. Open your Vercel app URL
2. Try logging in with `ramsarabia@gmail.com` or `claufer94@gmail.com`
3. You'll get a magic link email - click it to log in
4. Start adding tasks!

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with your keys
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Run dev server
npm run dev
```

The serverless functions will only work when deployed to Vercel (or in Vercel's local dev environment).

## Troubleshooting

**"Magic link not working"** → Check that your Vercel URL is in Supabase's redirect URLs

**"API returns 401"** → Check that your SUPABASE_SERVICE_KEY is correct

**"Tasks not saving"** → Check Supabase SQL Editor to verify the tasks table exists

**"AI parsing fails"** → Check that ANTHROPIC_API_KEY is correct and has balance

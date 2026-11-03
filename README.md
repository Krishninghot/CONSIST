# CONSIST — Personal Consistency & Habit Engineering

> **No competition. Just you, chasing the dream you made as a kid.**

CONSIST is a production-grade personal consistency and habit engineering platform built with modern full-stack web architecture. It combines flexible habit scheduling, mathematical consistency scoring, interactive contribution heatmaps, goal milestone tracking, automated achievement unlocking, and private PostgreSQL Row Level Security.

---

## 🏗️ Repository Architecture

```text
consist-project/
├── frontend/                     # TanStack Start / React Application
│   ├── src/
│   │   ├── routes/              # TanStack Router file-based routes
│   │   │   ├── _authenticated/  # Protected app shell & pages
│   │   │   │   ├── _shell/
│   │   │   │   │   ├── dashboard.tsx    # Live Consistency Dashboard
│   │   │   │   │   ├── habits.tsx       # Habit Management & Creation
│   │   │   │   │   ├── calendar.tsx     # Calendar & Heatmap
│   │   │   │   │   ├── goals.tsx        # Measurable Goals & Milestones
│   │   │   │   │   ├── analytics.tsx    # Recharts Performance Analytics
│   │   │   │   │   ├── achievements.tsx # Achievement Showcase
│   │   │   │   │   ├── profile.tsx      # Personal Profile & Ambitions
│   │   │   │   │   └── settings.tsx     # Account & Notification Settings
│   │   │   ├── index.tsx        # Premium Landing Page
│   │   │   ├── auth.tsx         # Google OAuth, Email/Password & Instant Demo
│   │   │   └── onboarding.tsx   # Interactive Persona Onboarding
│   │   ├── components/          # Reusable UI component library & Radix primitives
│   │   ├── lib/                 # Consistency algorithms, React Query hooks, Demo DB
│   │   └── integrations/        # Supabase client & authentication storage
│   ├── public/                  # Static assets & icons
│   ├── package.json             # Frontend dependencies & build scripts
│   ├── vite.config.ts           # Vite + TanStack Router plugin configuration
│   └── vercel.json              # Vercel deployment specification
│
├── backend/                      # Database & Backend Infrastructure
│   ├── migrations/
│   │   └── 0000_consist_schema.sql  # Complete PostgreSQL schema, RLS & triggers
│   ├── seeds/
│   │   └── seed.sql                 # Achievements catalog and seed data
│   ├── supabase/
│   │   └── config.toml              # Supabase CLI configuration
│   ├── .env.example                 # Backend environment variable template
│   └── README.md                    # Backend & RLS documentation
│
├── package.json                 # Monorepo runner scripts
├── vercel.json                  # Root Vercel build configuration
├── .gitignore                   # Multi-tier ignore rules
└── README.md                    # Project documentation
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or yarn

### 1. Installation
Install dependencies inside the `frontend/` directory:
```bash
npm --prefix frontend install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in `frontend/`:
```bash
cp frontend/.env.example frontend/.env
```
Populate your Supabase project keys:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

### 3. Run Development Server
From the root directory:
```bash
npm run dev
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 🧪 Testing & Quality Assurance

Run the comprehensive unit and integration test suite:
```bash
npm run test
```
Run static TypeScript verification:
```bash
npm --prefix frontend run build
```

---

## 🚀 Vercel Deployment Guide

CONSIST is pre-configured for 1-click deployment on [Vercel](https://vercel.com).

### Option 1: Automatic Monorepo Build (Default)
When importing the root Git repository into Vercel:
1. Leave **Root Directory** as `./` (the root `vercel.json` directs Vercel to build `frontend/`).
2. Add your environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon Key (or Publishable Key)
3. Click **Deploy**.

### Option 2: Pointing Directly to Frontend
If you prefer setting the Vercel Root Directory to `frontend`:
1. In Vercel Project Settings $\rightarrow$ **General** $\rightarrow$ **Root Directory**, set `frontend`.
2. Vercel will automatically use `frontend/vercel.json` and build `.output/public`.

---

## 🗄️ Supabase Database Setup

To activate the real PostgreSQL database in your Supabase project:
1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** in the left sidebar $\rightarrow$ Click **New Query**.
3. Copy the entire contents of [`backend/migrations/0000_consist_schema.sql`](./backend/migrations/0000_consist_schema.sql).
4. Paste and click **Run**.

This immediately provisions:
- `profiles`, `habits`, `habit_completions`, `goals`, `goal_habits`, `achievements`, `notifications`.
- Strict PostgreSQL Row-Level Security (RLS) policies.
- Automatic profile creation trigger on signup.
- The `avatars` storage bucket for profile pictures.

---

## 🛡️ License

Private application — All rights reserved.

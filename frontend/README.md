# CONSIST

> _"No competition. Just you, chasing the dream you made as a kid."_
>
> **Build a life you are consistent with.**

CONSIST is a personal consistency and habit engineering platform built with TanStack Start, TypeScript, Supabase, and Tailwind CSS v4. Designed with an obsidian and gold aesthetic, it focuses strictly on personal accountability, mathematical consistency scoring, and seamless daily commitment tracking.

---

## Architecture & Technology Stack

- **Framework**: TanStack Start (SSR & server functions)
- **Router**: TanStack Router (type-safe file-based routing)
- **Data Layer**: TanStack Query (React Query v5)
- **Database & Auth**: Supabase (PostgreSQL, Row-Level Security, GoTrue Auth, Storage)
- **Styling**: Tailwind CSS v4 (Obsidian Dark Palette, OKLCH color tokens, `@tailwindcss/vite`)
- **Animations**: Framer Motion
- **Data Visualizations**: Recharts
- **Icons**: Lucide React
- **Notifications & Toasts**: Sonner
- **Testing**: Vitest + Testing Library

---

## Application Route Map

| Route           | Page                | Purpose                                                         | Protection                |
| --------------- | ------------------- | --------------------------------------------------------------- | ------------------------- |
| `/`             | Landing Page        | SaaS product entry, brand philosophy, feature previews          | Public                    |
| `/auth`         | Authentication      | Google OAuth sign-in & session bridge                           | Public                    |
| `/onboarding`   | Onboarding          | 7-step identity, timezone, and habit initialization             | Authenticated             |
| `/dashboard`    | Daily Dashboard     | Real-time consistency score, progress ring, today's commitments | Authenticated + Onboarded |
| `/habits`       | Habits Management   | CRUD, flexible schedules, daily logging, category filters       | Authenticated + Onboarded |
| `/calendar`     | Activity Calendar   | Monthly interactive grid, day detail inspection, yearly heatmap | Authenticated + Onboarded |
| `/goals`        | Goals & Milestones  | Measurable targets, habit connection, manual progress tracking  | Authenticated + Onboarded |
| `/analytics`    | Deep-Dive Analytics | Line, bar, habit comparison, streak, and heat intensity charts  | Authenticated + Onboarded |
| `/achievements` | Trophy Gallery      | 8 seeded milestones with progress bars and unlock dates         | Authenticated + Onboarded |
| `/profile`      | Personal Profile    | Identity, avatar photo, interests & lifelong ambition tags      | Authenticated + Onboarded |
| `/settings`     | Settings & Privacy  | Notification toggles, quiet hours, data export, account purge   | Authenticated + Onboarded |

---

## Consistency & Streak Engine

All calculations are centralized in `src/lib/consistency.ts` to ensure identical results across the Dashboard, Calendar, and Analytics:

1. **Consistency Score**:
   $$\text{Consistency Score} = \frac{\text{Earned Credits on Eligible Occurrences}}{\text{Total Scheduled Eligible Occurrences}} \times 100$$
   - **Eligible occurrence**: Scheduled date, $\ge \text{start\_date}$, $\le \text{today}$, not marked as a rest day.
   - **Partial credit**: For time-based habits ($\text{time\_spent} / \text{target}$) or percentage-based habits ($\text{progress\_value} / \text{target}$).
   - **No fake data**: Returns `null` (displayed as `—`) when no eligible occurrences exist.
2. **Streaks**:
   - Evaluated strictly over scheduled occurrences.
   - Unscheduled days and rest days do not break an active streak.
   - Supports **grace recovery mode** (`grace_days`) where consecutive misses within allowance are forgiven as recoveries.
   - Today being pending does not break an ongoing streak.
3. **Heatmap Scaling**:
   - `heatLevel(done)` evaluates daily completions into 5 golden heat levels (`heat-0` to `heat-4`).

---

## Getting Started Locally

### 1. Prerequisites

- **Node.js**: v20 or higher
- **npm** or **pnpm**

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd consist

# Install dependencies
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase project credentials:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Supabase Database & Security Setup

### 1. Database Schema Migration

Run the initial SQL migration located at `drizzle/migrations/0000_consist_schema.sql` in your Supabase SQL Editor:

- Creates `profiles`, `habits`, `habit_completions`, `goals`, `goal_habits`, `achievements`, `user_achievements`, `notifications`, and `onboarding_preferences`.
- Seeds the 8 standard achievement milestones.
- Enables Row-Level Security (RLS) on all tables with strict user-isolated policies (`auth.uid() = user_id`).

### 2. Storage Bucket Setup

1. In your Supabase Dashboard, navigate to **Storage** > **New Bucket**.
2. Create a bucket named `avatars`.
3. Set bucket access to **Public**.
4. Add the following storage RLS policy:
   ```sql
   -- Allow users to upload their own avatar
   CREATE POLICY "Users can upload their own avatar"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

   -- Allow public read access to avatars
   CREATE POLICY "Public avatar access"
   ON storage.objects FOR SELECT TO public
   USING (bucket_id = 'avatars');
   ```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. In **Authorized redirect URIs**, add your Supabase Auth callback URL:
   ```
   https://<your-supabase-project-id>.supabase.co/auth/v1/callback
   ```
4. Copy the Client ID and Client Secret into **Supabase Dashboard** > **Authentication** > **Providers** > **Google**.
5. Enable the Google provider.

---

## Verification & Testing

Run all automated quality suites:

```bash
# Typecheck with TypeScript strict mode
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit

# Run unit and integration tests
npm test

# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Run full production build
npm run build
```

---

## Vercel Deployment Guide

1. **Push to GitHub / GitLab / Bitbucket**:
   Ensure `.env` is ignored by `.gitignore`.
2. **Import Project to Vercel**:
   - Root directory: `./` (or `consist` if in a subfolder).
   - Build command: `npm run build`
   - Output directory: `.output/public`
3. **Configure Environment Variables in Vercel**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Deploy**:
   Click **Deploy**. Nitro will package the TanStack Start client bundle and SSR handler for serverless edge execution.

---

## License

Private and proprietary. Built for personal consistency and ambition tracking.

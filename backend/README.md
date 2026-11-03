# CONSIST — Backend Architecture & Database Engine

The CONSIST backend is powered by **Supabase (PostgreSQL 15+)** with strict **Row Level Security (RLS)**, automated triggers, and PostgreSQL functions.

---

## 📁 Directory Structure

```text
backend/
├── migrations/
│   └── 0000_consist_schema.sql    # Complete PostgreSQL DDL schema & policies
├── seeds/
│   └── seed.sql                   # Achievement & catalog seed data
├── supabase/
│   └── config.toml                # Supabase CLI project configuration
├── .env.example                   # Environment configuration template
└── README.md                      # Backend documentation
```

---

## 🗄️ Database Tables & Schema Overview

| Table | Description | RLS Policy |
| :--- | :--- | :--- |
| `public.profiles` | User profile data, settings, timezone, week-start, and goals | Strict `auth.uid() = id` isolation |
| `public.onboarding_preferences` | User onboarding answers and focus areas | Strict `auth.uid() = user_id` isolation |
| `public.habits` | Habit configurations, target values, schedules, recovery grace | Strict `auth.uid() = user_id` isolation |
| `public.habit_completions` | Daily tracking records, progress, duration, notes | Keyed on `(habit_id, occurrence_date)` |
| `public.goals` | Target milestones, target values, progress history | Strict `auth.uid() = user_id` isolation |
| `public.goal_habits` | Many-to-many relationship linking habits to goals | Validates user ownership of both |
| `public.achievements` | Achievement definitions, milestone conditions, icons | Publicly readable to authenticated users |
| `public.user_achievements` | Unlocked achievements per user | Keyed on `(user_id, achievement_id)` |
| `public.notifications` | In-app notifications with deduplication keys | Keyed on `(user_id, dedupe_key)` |
| `storage.objects (avatars)` | User avatar image uploads | Isolated to folder `auth.uid()` |

---

## 🚀 Running Migrations

### Method 1: Via Supabase Dashboard (Recommended — 30 seconds)
1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Open [`backend/migrations/0000_consist_schema.sql`](./migrations/0000_consist_schema.sql), copy all lines, and paste into the editor.
5. Click **Run**.

### Method 2: Via Supabase CLI
```bash
# Link to your remote project
supabase link --project-ref <your-project-id>

# Push the migration
supabase db push
```

---

## 🔐 Security & RLS Rules
- Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- Users can **only** read, insert, update, or delete records belonging to their authenticated `auth.uid()`.
- Data isolation prevents cross-tenant access at the PostgreSQL engine level.


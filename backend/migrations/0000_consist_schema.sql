
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  interests text[] NOT NULL DEFAULT '{}',
  personal_goals text[] NOT NULL DEFAULT '{}',
  timezone text NOT NULL DEFAULT 'UTC',
  date_format text NOT NULL DEFAULT 'MMM d, yyyy',
  week_start smallint NOT NULL DEFAULT 1,
  notification_settings jsonb NOT NULL DEFAULT '{"reminders":true,"goals":true,"achievements":true,"streaks":true,"quiet_start":"22:00","quiet_end":"07:00"}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.onboarding_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  interests text[] NOT NULL DEFAULT '{}',
  personal_goals text[] NOT NULL DEFAULT '{}',
  tracking_preference text NOT NULL DEFAULT 'completion' CHECK (tracking_preference IN ('completion','time','percentage')),
  available_time text,
  reminder_preferences jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_preferences TO authenticated;
GRANT ALL ON public.onboarding_preferences TO service_role;
ALTER TABLE public.onboarding_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own onboarding" ON public.onboarding_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER onboarding_updated BEFORE UPDATE ON public.onboarding_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text,
  category text NOT NULL DEFAULT 'Personal development',
  icon text NOT NULL DEFAULT 'sparkles',
  color text NOT NULL DEFAULT 'gold',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  tracking_type text NOT NULL DEFAULT 'completion' CHECK (tracking_type IN ('completion','time','percentage')),
  target_value numeric NOT NULL DEFAULT 1 CHECK (target_value > 0),
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  schedule_configuration jsonb NOT NULL DEFAULT '{"type":"daily"}',
  recovery_configuration jsonb NOT NULL DEFAULT '{"mode":"strict","grace_days":0}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX habits_user_idx ON public.habits(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits" ON public.habits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER habits_updated BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  occurrence_date date NOT NULL,
  completion_status text NOT NULL DEFAULT 'completed' CHECK (completion_status IN ('completed','partial','skipped','rest')),
  progress_value numeric NOT NULL DEFAULT 0,
  time_spent integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, occurrence_date)
);
CREATE INDEX completions_user_date_idx ON public.habit_completions(user_id, occurrence_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_completions TO authenticated;
GRANT ALL ON public.habit_completions TO service_role;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completions" ON public.habit_completions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_id AND h.user_id = auth.uid()));
CREATE TRIGGER completions_updated BEFORE UPDATE ON public.habit_completions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description text,
  start_date date NOT NULL DEFAULT current_date,
  target_date date,
  target_value numeric NOT NULL DEFAULT 100 CHECK (target_value > 0),
  current_progress numeric NOT NULL DEFAULT 0 CHECK (current_progress >= 0),
  unit text NOT NULL DEFAULT '%',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  history jsonb NOT NULL DEFAULT '[]',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX goals_user_idx ON public.goals(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.goal_habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (goal_id, habit_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_habits TO authenticated;
GRANT ALL ON public.goal_habits TO service_role;
ALTER TABLE public.goal_habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal habits" ON public.goal_habits FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_id AND h.user_id = auth.uid()));

CREATE TABLE public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  unlock_condition jsonb NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements readable" ON public.achievements FOR SELECT TO authenticated USING (true);
INSERT INTO public.achievements (id, name, description, icon, unlock_condition, sort_order) VALUES
 ('first_habit','First Step','Create your first habit.','sprout','{"type":"habits_created","value":1}',1),
 ('first_completion','Momentum','Record your first completion.','zap','{"type":"completions","value":1}',2),
 ('streak_7','Seven Strong','Reach a 7-day streak on any habit.','flame','{"type":"streak","value":7}',3),
 ('streak_30','Unbroken Month','Reach a 30-day streak on any habit.','mountain','{"type":"streak","value":30}',4),
 ('completions_100','Centurion','Complete 100 commitments.','trophy','{"type":"completions","value":100}',5),
 ('first_goal','Dream Realised','Complete your first goal.','target','{"type":"goals_completed","value":1}',6),
 ('time_10h','Deep Work','Invest 10 hours in time-based habits.','hourglass','{"type":"minutes","value":600}',7),
 ('habits_5','Architect','Build 5 habits.','layers','{"type":"habits_created","value":5}',8);

CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements select" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own achievements insert" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general',
  dedupe_key text,
  read_status boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- BACKFILL PROFILES FOR EXISTING AUTH USERS
-- (Ensures users created before this script have a profile row)
-- =====================================================================
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email), raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- AVATAR STORAGE BUCKET & POLICIES
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar public select' AND tablename = 'objects') THEN
    CREATE POLICY "Avatar public select" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar authenticated upload' AND tablename = 'objects') THEN
    CREATE POLICY "Avatar authenticated upload" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar authenticated update' AND tablename = 'objects') THEN
    CREATE POLICY "Avatar authenticated update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar authenticated delete' AND tablename = 'objects') THEN
    CREATE POLICY "Avatar authenticated delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'avatars');
  END IF;
END $$;


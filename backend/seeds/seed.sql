-- =====================================================================
-- CONSIST — Backend Seed Script
-- =====================================================================
-- This script seeds the achievements catalog and default configuration.
-- Can be executed via Supabase SQL Editor or `supabase db reset`.
-- =====================================================================

INSERT INTO public.achievements (id, name, description, icon, unlock_condition, sort_order) VALUES
 ('first_habit', 'First Step', 'Create your first habit commitment.', 'sprout', '{"type":"habits_created","value":1}', 1),
 ('first_completion', 'Momentum', 'Record your first completed commitment.', 'zap', '{"type":"completions","value":1}', 2),
 ('streak_7', 'Seven Strong', 'Reach a 7-day streak on any habit.', 'flame', '{"type":"streak","value":7}', 3),
 ('streak_30', 'Unbroken Month', 'Reach a 30-day streak on any habit.', 'mountain', '{"type":"streak","value":30}', 4),
 ('completions_100', 'Centurion', 'Complete 100 commitments across all habits.', 'trophy', '{"type":"completions","value":100}', 5),
 ('first_goal', 'Dream Realised', 'Complete your first measurable goal.', 'target', '{"type":"goals_completed","value":1}', 6),
 ('time_10h', 'Deep Work', 'Invest 10 hours in time-based habits.', 'hourglass', '{"type":"minutes","value":600}', 7),
 ('habits_5', 'Architect', 'Build 5 active habits in CONSIST.', 'layers', '{"type":"habits_created","value":5}', 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  unlock_condition = EXCLUDED.unlock_condition,
  sort_order = EXCLUDED.sort_order;


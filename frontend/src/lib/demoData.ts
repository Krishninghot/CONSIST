import { format, subDays } from "date-fns";
import type { Habit, Completion, Goal, Profile, Notification, Achievement } from "./data";
import type { Database } from "@/integrations/supabase/types";

type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];
type OnboardingPreferences = Database["public"]["Tables"]["onboarding_preferences"]["Row"];
type GoalHabit = Database["public"]["Tables"]["goal_habits"]["Row"];

export const DEMO_USER_ID = "00000000-0000-4000-a000-000000000001";

export function isDemoActive(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("consist:demo-mode") === "true";
}

export function enableDemoMode(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("consist:demo-mode", "true");
  ensureDemoDataSeeded();
}

export function disableDemoMode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("consist:demo-mode");
}

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`consist:demo:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`consist:demo:${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to write to demo storage", e);
  }
}

export function ensureDemoDataSeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("consist:demo:seeded") === "true") return;

  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Demo Profile
  const profile: Profile = {
    id: DEMO_USER_ID,
    full_name: "Alex Rivera",
    avatar_url: null,
    interests: ["Health & Fitness", "Deep Work & Coding", "Mindfulness", "Reading"],
    personal_goals: [
      "Reach 90%+ daily consistency",
      "Run 100km this month",
      "Master system architecture",
    ],
    timezone: "UTC",
    date_format: "yyyy-MM-dd",
    week_start: 1,
    notification_settings: {
      reminders: true,
      goals: true,
      achievements: true,
      streaks: true,
      quiet_start: "22:00",
      quiet_end: "07:00",
    },
    onboarding_completed: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: nowIso,
  };

  // 2. Demo Habits
  const habits: Habit[] = [
    {
      id: "h1-meditation",
      user_id: DEMO_USER_ID,
      name: "Morning Meditation",
      description: "15 minutes of unguided mindfulness breathwork before looking at screens.",
      category: "Mindfulness",
      icon: "brain",
      color: "#8B5CF6",
      priority: "high",
      tracking_type: "completion",
      target_value: 1,
      start_date: "2026-01-01",
      end_date: null,
      status: "active",
      schedule_configuration: { mode: "daily" },
      recovery_configuration: { enabled: true, allow_rest_day: true },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: nowIso,
    },
    {
      id: "h2-deep-work",
      user_id: DEMO_USER_ID,
      name: "Deep Work Sprint",
      description: "Focused uninterrupted engineering and architecture work.",
      category: "Work",
      icon: "laptop",
      color: "#F5BD38",
      priority: "urgent",
      tracking_type: "time",
      target_value: 90,
      start_date: "2026-01-01",
      end_date: null,
      status: "active",
      schedule_configuration: { mode: "weekdays" },
      recovery_configuration: { enabled: true },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: nowIso,
    },
    {
      id: "h3-run",
      user_id: DEMO_USER_ID,
      name: "5km Endurance Run",
      description: "Zone 2 aerobic conditioning run.",
      category: "Fitness",
      icon: "activity",
      color: "#10B981",
      priority: "medium",
      tracking_type: "percentage",
      target_value: 100,
      start_date: "2026-01-01",
      end_date: null,
      status: "active",
      schedule_configuration: { mode: "alternate" },
      recovery_configuration: { enabled: true, allow_rest_day: true },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: nowIso,
    },
    {
      id: "h4-reading",
      user_id: DEMO_USER_ID,
      name: "Technical Reading",
      description: "Reading distributed systems, algorithms, and design books.",
      category: "Learning",
      icon: "book-open",
      color: "#3B82F6",
      priority: "medium",
      tracking_type: "time",
      target_value: 30,
      start_date: "2026-01-01",
      end_date: null,
      status: "active",
      schedule_configuration: { mode: "daily" },
      recovery_configuration: { enabled: true },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: nowIso,
    },
    {
      id: "h5-reflection",
      user_id: DEMO_USER_ID,
      name: "Evening Reflection",
      description: "Review today's commitments, log lessons learned, and prepare tomorrow's plan.",
      category: "Mindfulness",
      icon: "moon",
      color: "#EC4899",
      priority: "low",
      tracking_type: "completion",
      target_value: 1,
      start_date: "2026-01-01",
      end_date: null,
      status: "active",
      schedule_configuration: { mode: "daily" },
      recovery_configuration: { enabled: true },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: nowIso,
    },
  ];

  // 3. Demo Completions for the past 28 days
  const completions: Completion[] = [];
  for (let d = 0; d < 28; d++) {
    const dayDate = subDays(now, d);
    const dayKey = format(dayDate, "yyyy-MM-dd");

    // Meditation: almost every day
    if (d !== 4 && d !== 15) {
      completions.push({
        id: `c-med-${d}`,
        user_id: DEMO_USER_ID,
        habit_id: "h1-meditation",
        occurrence_date: dayKey,
        completion_status: "completed",
        progress_value: 1,
        time_spent: 15,
        notes: d === 0 ? "Felt deeply calm and focused today." : null,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    // Deep Work: weekdays
    const dayOfWeek = dayDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const isPartial = d === 2 || d === 11;
      completions.push({
        id: `c-work-${d}`,
        user_id: DEMO_USER_ID,
        habit_id: "h2-deep-work",
        occurrence_date: dayKey,
        completion_status: isPartial ? "partial" : "completed",
        progress_value: isPartial ? 55 : 90,
        time_spent: isPartial ? 55 : 90,
        notes: isPartial ? "Had team syncs mid-day, wrapped 55 min." : null,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    // Run: every other day
    if (d % 2 === 0 && d !== 8) {
      completions.push({
        id: `c-run-${d}`,
        user_id: DEMO_USER_ID,
        habit_id: "h3-run",
        occurrence_date: dayKey,
        completion_status: "completed",
        progress_value: 100,
        time_spent: 26,
        notes: null,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    // Reading: high completion rate
    if (d !== 6 && d !== 18 && d !== 24) {
      completions.push({
        id: `c-read-${d}`,
        user_id: DEMO_USER_ID,
        habit_id: "h4-reading",
        occurrence_date: dayKey,
        completion_status: "completed",
        progress_value: 30,
        time_spent: 30,
        notes: null,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    // Reflection: most days
    if (d !== 1 && d !== 10) {
      completions.push({
        id: `c-ref-${d}`,
        user_id: DEMO_USER_ID,
        habit_id: "h5-reflection",
        occurrence_date: dayKey,
        completion_status: "completed",
        progress_value: 1,
        time_spent: 5,
        notes: null,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }
  }

  // 4. Demo Goals
  const goals: Goal[] = [
    {
      id: "g1-mental-health",
      user_id: DEMO_USER_ID,
      title: "Build Peak Mental & Physical Resilience",
      description: "Maintain consecutive 30-day habits in mindfulness, fitness, and deep work.",
      status: "active",
      unit: "%",
      target_value: 100,
      current_progress: 82,
      start_date: "2026-01-01",
      target_date: "2026-12-31",
      completed_at: null,
      history: [
        { date: "2026-01-15", progress: 25 },
        { date: "2026-02-01", progress: 50 },
        { date: "2026-02-15", progress: 82 },
      ],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: nowIso,
    },
    {
      id: "g2-systems",
      user_id: DEMO_USER_ID,
      title: "Master Advanced Agentic Architecture",
      description: "Complete 50 hours of intensive autonomous agent implementation and research.",
      status: "active",
      unit: "hours",
      target_value: 50,
      current_progress: 38,
      start_date: "2026-01-10",
      target_date: "2026-11-30",
      completed_at: null,
      history: [
        { date: "2026-01-20", progress: 14 },
        { date: "2026-02-05", progress: 28 },
        { date: "2026-02-18", progress: 38 },
      ],
      created_at: "2026-01-10T00:00:00Z",
      updated_at: nowIso,
    },
    {
      id: "g3-consistency-engine",
      user_id: DEMO_USER_ID,
      title: "Ship Consistency Engine v1",
      description: "Deploy production-grade habit and personal growth tracking architecture.",
      status: "completed",
      unit: "%",
      target_value: 100,
      current_progress: 100,
      start_date: "2026-01-01",
      target_date: "2026-02-01",
      completed_at: "2026-02-01T12:00:00Z",
      history: [
        { date: "2026-01-10", progress: 40 },
        { date: "2026-01-25", progress: 85 },
        { date: "2026-02-01", progress: 100 },
      ],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: nowIso,
    },
  ];

  // 5. Goal Habits
  const goalHabits: GoalHabit[] = [
    {
      id: "gh-1",
      user_id: DEMO_USER_ID,
      goal_id: "g1-mental-health",
      habit_id: "h1-meditation",
      created_at: nowIso,
    },
    {
      id: "gh-2",
      user_id: DEMO_USER_ID,
      goal_id: "g1-mental-health",
      habit_id: "h3-run",
      created_at: nowIso,
    },
    {
      id: "gh-3",
      user_id: DEMO_USER_ID,
      goal_id: "g2-systems",
      habit_id: "h2-deep-work",
      created_at: nowIso,
    },
    {
      id: "gh-4",
      user_id: DEMO_USER_ID,
      goal_id: "g2-systems",
      habit_id: "h4-reading",
      created_at: nowIso,
    },
  ];

  // 6. Achievements catalog
  const achievements: Achievement[] = [
    {
      id: "ach-first-habit",
      name: "First Habit",
      description: "Created your very first habit commitment.",
      icon: "Sparkles",
      sort_order: 1,
      unlock_condition: { type: "habit_count", count: 1 },
    },
    {
      id: "ach-first-step",
      name: "First Completion",
      description: "Marked your first daily habit commitment complete.",
      icon: "CheckCircle",
      sort_order: 2,
      unlock_condition: { type: "completion_count", count: 1 },
    },
    {
      id: "ach-streak-7",
      name: "7-Day Consistency",
      description: "Maintained a continuous 7-day streak on any habit.",
      icon: "Flame",
      sort_order: 3,
      unlock_condition: { type: "streak", days: 7 },
    },
    {
      id: "ach-streak-30",
      name: "30-Day Master",
      description: "Maintained an unbroken 30-day streak on any habit.",
      icon: "Flame",
      sort_order: 4,
      unlock_condition: { type: "streak", days: 30 },
    },
    {
      id: "ach-centurion",
      name: "Centurion",
      description: "Logged over 100 completed commitments across all habits.",
      icon: "Award",
      sort_order: 5,
      unlock_condition: { type: "completion_count", count: 100 },
    },
    {
      id: "ach-first-goal",
      name: "Goal Completed",
      description: "Reached 100% on your first measurable goal.",
      icon: "Trophy",
      sort_order: 6,
      unlock_condition: { type: "goal_completed", count: 1 },
    },
  ];

  // 7. User Unlocked Achievements
  const userAchievements: UserAchievement[] = [
    {
      id: "ua-1",
      user_id: DEMO_USER_ID,
      achievement_id: "ach-first-habit",
      unlocked_at: "2026-01-01T10:00:00Z",
    },
    {
      id: "ua-2",
      user_id: DEMO_USER_ID,
      achievement_id: "ach-first-step",
      unlocked_at: "2026-01-01T18:00:00Z",
    },
    {
      id: "ua-3",
      user_id: DEMO_USER_ID,
      achievement_id: "ach-streak-7",
      unlocked_at: "2026-01-08T18:00:00Z",
    },
    {
      id: "ua-4",
      user_id: DEMO_USER_ID,
      achievement_id: "ach-centurion",
      unlocked_at: "2026-01-29T18:00:00Z",
    },
    {
      id: "ua-5",
      user_id: DEMO_USER_ID,
      achievement_id: "ach-first-goal",
      unlocked_at: "2026-02-01T12:00:00Z",
    },
  ];

  // 8. Notifications
  const notifications: Notification[] = [
    {
      id: "n-1",
      user_id: DEMO_USER_ID,
      notification_type: "streak",
      title: "7-Day Streak Maintained!",
      message: "You've stayed consistent with Morning Meditation for 7 consecutive days.",
      read_status: false,
      dedupe_key: "demo-streak-1",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "n-2",
      user_id: DEMO_USER_ID,
      notification_type: "goal",
      title: "Goal Completed: Ship Consistency Engine v1",
      message: "Congratulations! You reached 100% on your milestone goal.",
      read_status: true,
      dedupe_key: "demo-goal-1",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: "n-3",
      user_id: DEMO_USER_ID,
      notification_type: "achievement",
      title: "Achievement Unlocked: Centurion",
      message: "You have completed 100+ commitments in CONSIST.",
      read_status: true,
      dedupe_key: "demo-ach-1",
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ];

  // 9. Onboarding
  const onboarding: OnboardingPreferences = {
    id: "onb-1",
    user_id: DEMO_USER_ID,
    available_time: "60_plus",
    interests: ["Health & Fitness", "Deep Work & Coding"],
    personal_goals: ["Reach 90%+ daily consistency"],
    reminder_preferences: { daily: true, quiet_hours: false },
    tracking_preference: "completion",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: nowIso,
  };

  setStorage("profile", profile);
  setStorage("habits", habits);
  setStorage("completions", completions);
  setStorage("goals", goals);
  setStorage("goal_habits", goalHabits);
  setStorage("achievements", achievements);
  setStorage("user_achievements", userAchievements);
  setStorage("notifications", notifications);
  setStorage("onboarding", onboarding);

  localStorage.setItem("consist:demo:seeded", "true");
}

/* Demo CRUD operations */
export const demoDb = {
  getProfile: () => getStorage<Profile | null>("profile", null),
  setProfile: (p: Partial<Profile>) => {
    const cur = getStorage<Profile>("profile", {
      id: DEMO_USER_ID,
      full_name: "Alex Rivera",
      avatar_url: null,
      interests: [],
      personal_goals: [],
      timezone: "UTC",
      date_format: "yyyy-MM-dd",
      week_start: 1,
      notification_settings: {},
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const updated = { ...cur, ...p, updated_at: new Date().toISOString() };
    setStorage("profile", updated);
    return updated;
  },

  getHabits: () => getStorage<Habit[]>("habits", []),
  saveHabit: (habit: Partial<Habit> & { name: string }) => {
    const list = getStorage<Habit[]>("habits", []);
    const id = habit.id || `h-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const existingIdx = list.findIndex((h) => h.id === id);

    const fullHabit: Habit = {
      id,
      user_id: DEMO_USER_ID,
      name: habit.name,
      description: habit.description ?? null,
      category: habit.category ?? "General",
      icon: habit.icon ?? "check-circle",
      color: habit.color ?? "#F5BD38",
      priority: habit.priority ?? "medium",
      tracking_type: habit.tracking_type ?? "completion",
      target_value: habit.target_value ?? 1,
      start_date: habit.start_date ?? format(new Date(), "yyyy-MM-dd"),
      end_date: habit.end_date ?? null,
      status: habit.status ?? "active",
      schedule_configuration: habit.schedule_configuration ?? { mode: "daily" },
      recovery_configuration: habit.recovery_configuration ?? { enabled: true },
      created_at: existingIdx >= 0 ? list[existingIdx]!.created_at : nowIso,
      updated_at: nowIso,
    };

    if (existingIdx >= 0) {
      list[existingIdx] = fullHabit;
    } else {
      list.push(fullHabit);
    }
    setStorage("habits", list);
    return fullHabit;
  },
  deleteHabit: (id: string) => {
    const list = getStorage<Habit[]>("habits", []).filter((h) => h.id !== id);
    setStorage("habits", list);
  },

  getCompletions: () => getStorage<Completion[]>("completions", []),
  logCompletion: (input: {
    habit_id: string;
    occurrence_date: string;
    completion_status: string;
    progress_value?: number;
    time_spent?: number;
    notes?: string | null;
  }) => {
    const list = getStorage<Completion[]>("completions", []);
    const existingIdx = list.findIndex(
      (c) => c.habit_id === input.habit_id && c.occurrence_date === input.occurrence_date,
    );

    if (input.completion_status === "clear") {
      if (existingIdx >= 0) {
        list.splice(existingIdx, 1);
        setStorage("completions", list);
      }
      return;
    }

    const nowIso = new Date().toISOString();
    const item: Completion = {
      id: existingIdx >= 0 ? list[existingIdx]!.id : `c-${Date.now()}`,
      user_id: DEMO_USER_ID,
      habit_id: input.habit_id,
      occurrence_date: input.occurrence_date,
      completion_status: input.completion_status,
      progress_value: input.progress_value ?? 1,
      time_spent: input.time_spent ?? 0,
      notes: input.notes ?? null,
      created_at: existingIdx >= 0 ? list[existingIdx]!.created_at : nowIso,
      updated_at: nowIso,
    };

    if (existingIdx >= 0) {
      list[existingIdx] = item;
    } else {
      list.push(item);
    }
    setStorage("completions", list);
    return item;
  },

  getGoals: () => getStorage<Goal[]>("goals", []),
  saveGoal: (goal: Partial<Goal> & { title: string }) => {
    const list = getStorage<Goal[]>("goals", []);
    const id = goal.id || `g-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const existingIdx = list.findIndex((g) => g.id === id);

    const fullGoal: Goal = {
      id,
      user_id: DEMO_USER_ID,
      title: goal.title,
      description: goal.description ?? null,
      unit: goal.unit ?? "%",
      target_value: goal.target_value ?? 100,
      current_progress: goal.current_progress ?? 0,
      start_date: goal.start_date ?? format(new Date(), "yyyy-MM-dd"),
      target_date: goal.target_date ?? null,
      status: goal.status ?? "active",
      completed_at: goal.completed_at ?? null,
      history: goal.history ?? [],
      created_at: existingIdx >= 0 ? list[existingIdx]!.created_at : nowIso,
      updated_at: nowIso,
    };

    if (existingIdx >= 0) {
      list[existingIdx] = fullGoal;
    } else {
      list.push(fullGoal);
    }
    setStorage("goals", list);
    return fullGoal;
  },
  deleteGoal: (id: string) => {
    const list = getStorage<Goal[]>("goals", []).filter((g) => g.id !== id);
    setStorage("goals", list);
  },

  getGoalHabits: () => getStorage<GoalHabit[]>("goal_habits", []),
  setGoalHabits: (goalId: string, habitIds: string[]) => {
    let list = getStorage<GoalHabit[]>("goal_habits", []).filter((gh) => gh.goal_id !== goalId);
    const nowIso = new Date().toISOString();
    for (const hid of habitIds) {
      list.push({
        id: `gh-${Date.now()}-${hid}`,
        goal_id: goalId,
        habit_id: hid,
        user_id: DEMO_USER_ID,
        created_at: nowIso,
      });
    }
    setStorage("goal_habits", list);
  },

  getAchievements: () => getStorage<Achievement[]>("achievements", []),
  getUserAchievements: () => getStorage<UserAchievement[]>("user_achievements", []),
  getNotifications: () => getStorage<Notification[]>("notifications", []),
  markNotificationRead: (id: string) => {
    const list = getStorage<Notification[]>("notifications", []);
    for (const n of list) {
      if (n.id === id) n.read_status = true;
    }
    setStorage("notifications", list);
  },
  markAllNotificationsRead: () => {
    const list = getStorage<Notification[]>("notifications", []);
    for (const n of list) n.read_status = true;
    setStorage("notifications", list);
  },
  deleteNotification: (id: string) => {
    const list = getStorage<Notification[]>("notifications", []).filter((n) => n.id !== id);
    setStorage("notifications", list);
  },

  getOnboarding: () => getStorage<OnboardingPreferences | null>("onboarding", null),
  setOnboarding: (data: Partial<OnboardingPreferences>) => {
    const cur = getStorage<OnboardingPreferences>("onboarding", {
      id: "onb-1",
      user_id: DEMO_USER_ID,
      available_time: "60_plus",
      interests: ["Health & Fitness", "Deep Work & Coding"],
      personal_goals: ["Reach 90%+ daily consistency"],
      reminder_preferences: { daily: true, quiet_hours: false },
      tracking_preference: "completion",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const updated = { ...cur, ...data, updated_at: new Date().toISOString() };
    setStorage("onboarding", updated);
    return updated;
  },
};


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { addDays, format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { computeStreak, indexCompletions, isScheduled, toKey, type HabitLike } from "./consistency";
import { isDemoActive, demoDb, DEMO_USER_ID, ensureDemoDataSeeded } from "./demoData";

type T = Database["public"]["Tables"];
export type Habit = T["habits"]["Row"];
export type Completion = T["habit_completions"]["Row"];
export type Goal = T["goals"]["Row"];
export type Profile = T["profiles"]["Row"];
export type Notification = T["notifications"]["Row"];
export type Achievement = T["achievements"]["Row"];

export const todayKey = () => toKey(new Date());

async function uid() {
  if (isDemoActive()) return DEMO_USER_ID;
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}
function check<R>(r: { data: R; error: { message: string } | null }) {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

/* ---------------- queries ---------------- */
export const useUser = () =>
  useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      if (isDemoActive()) {
        return {
          id: DEMO_USER_ID,
          email: "alex.rivera@consist.app",
          user_metadata: { full_name: "Alex Rivera" },
          app_metadata: { provider: "email" },
        } as unknown as (typeof supabase.auth.getUser extends () => Promise<{ data: { user: infer U } }> ? U : never);
      }
      return (await supabase.auth.getUser()).data.user;
    },
  });

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (isDemoActive()) {
        ensureDemoDataSeeded();
        return demoDb.getProfile();
      }
      try {
        const userId = await uid();
        const res = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (res.error) {
          if (
            res.error.message.includes("schema cache") ||
            res.error.message.includes("Could not find the table")
          ) {
            return null;
          }
          throw new Error(res.error.message);
        }
        return res.data;
      } catch (e) {
        console.warn("Profile fetch error:", e);
        return null;
      }
    },
  });

export const useHabits = () =>
  useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      if (isDemoActive()) {
        ensureDemoDataSeeded();
        return demoDb.getHabits();
      }
      const res = await supabase.from("habits").select("*").order("created_at");
      if (res.error) {
        if (
          res.error.message.includes("schema cache") ||
          res.error.message.includes("Could not find the table")
        ) {
          return [];
        }
        throw new Error(res.error.message);
      }
      return res.data ?? [];
    },
  });

export const useCompletions = () =>
  useQuery({
    queryKey: ["completions"],
    queryFn: async () => {
      if (isDemoActive()) {
        ensureDemoDataSeeded();
        return demoDb.getCompletions();
      }
      const all: Completion[] = [];
      for (let from = 0; ; from += 1000) {
        const res = await supabase
          .from("habit_completions")
          .select("*")
          .order("occurrence_date")
          .range(from, from + 999);
        if (res.error) {
          if (
            res.error.message.includes("schema cache") ||
            res.error.message.includes("Could not find the table")
          ) {
            return [];
          }
          throw new Error(res.error.message);
        }
        const rows = res.data ?? [];
        all.push(...rows);
        if (rows.length < 1000) break;
      }
      return all;
    },
  });

export const useGoals = () =>
  useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      if (isDemoActive()) {
        ensureDemoDataSeeded();
        return demoDb.getGoals();
      }
      const res = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (res.error) {
        if (
          res.error.message.includes("schema cache") ||
          res.error.message.includes("Could not find the table")
        ) {
          return [];
        }
        throw new Error(res.error.message);
      }
      return res.data ?? [];
    },
  });

export const useGoalHabits = () =>
  useQuery({
    queryKey: ["goal_habits"],
    queryFn: async () => {
      if (isDemoActive()) {
        ensureDemoDataSeeded();
        return demoDb.getGoalHabits();
      }
      const res = await supabase.from("goal_habits").select("*");
      if (res.error) {
        if (
          res.error.message.includes("schema cache") ||
          res.error.message.includes("Could not find the table")
        ) {
          return [];
        }
        throw new Error(res.error.message);
      }
      return res.data ?? [];
    },
  });

export const useAchievements = () =>
  useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      if (isDemoActive()) {
        ensureDemoDataSeeded();
        return demoDb.getAchievements();
      }
      const res = await supabase.from("achievements").select("*").order("sort_order");
      if (res.error) {
        if (
          res.error.message.includes("schema cache") ||
          res.error.message.includes("Could not find the table")
        ) {
          return [];
        }
        throw new Error(res.error.message);
      }
      return res.data ?? [];
    },
  });

export const useUserAchievements = () =>
  useQuery({
    queryKey: ["user_achievements"],
    queryFn: async () => {
      if (isDemoActive()) {
        ensureDemoDataSeeded();
        return demoDb.getUserAchievements();
      }
      const res = await supabase.from("user_achievements").select("*");
      if (res.error) {
        if (
          res.error.message.includes("schema cache") ||
          res.error.message.includes("Could not find the table")
        ) {
          return [];
        }
        throw new Error(res.error.message);
      }
      return res.data ?? [];
    },
  });

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (isDemoActive()) {
        ensureDemoDataSeeded();
        return demoDb.getNotifications();
      }
      const res = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (res.error) {
        if (
          res.error.message.includes("schema cache") ||
          res.error.message.includes("Could not find the table")
        ) {
          return [];
        }
        throw new Error(res.error.message);
      }
      return res.data ?? [];
    },
  });

export const useOnboarding = () =>
  useQuery({
    queryKey: ["onboarding"],
    queryFn: async () => {
      if (isDemoActive()) {
        ensureDemoDataSeeded();
        return demoDb.getOnboarding();
      }
      const res = await supabase.from("onboarding_preferences").select("*").maybeSingle();
      if (res.error) {
        if (
          res.error.message.includes("schema cache") ||
          res.error.message.includes("Could not find the table")
        ) {
          return null;
        }
        throw new Error(res.error.message);
      }
      return res.data;
    },
  });

/** Combined, memoised view of all habit data. */
export function useHabitData() {
  const h = useHabits();
  const c = useCompletions();
  const habits = (h.data ?? []) as Habit[];
  const completions = (c.data ?? []) as Completion[];
  const idx = useMemo(() => indexCompletions(completions), [completions]);
  const today = todayKey();
  const streaks = useMemo(() => {
    const m = new Map<string, ReturnType<typeof computeStreak>>();
    for (const x of habits) m.set(x.id, computeStreak(x as HabitLike, idx, today));
    return m;
  }, [habits, idx, today]);
  return {
    habits,
    completions,
    idx,
    streaks,
    today,
    isLoading: h.isLoading || c.isLoading,
    error: h.error || c.error,
  };
}

/* ---------------- mutations ---------------- */
function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export type HabitInput = Omit<T["habits"]["Insert"], "user_id">;
export type HabitSaveInput =
  (HabitInput & { id?: string | undefined }) | (Partial<HabitInput> & { id: string });

export function useSaveHabit() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...v }: HabitSaveInput) => {
      if (isDemoActive()) {
        const saved = demoDb.saveHabit({ id, ...v } as Partial<Habit> & { name: string });
        return saved;
      }
      if (id) return check(await supabase.from("habits").update(v).eq("id", id).select().single());
      return check(
        await supabase
          .from("habits")
          .insert({ ...(v as HabitInput), user_id: await uid() })
          .select()
          .single(),
      );
    },
    onSuccess: (_d, v) => {
      inv("habits");
      toast.success(v.id ? "Habit updated" : "Habit created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteHabit() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemoActive()) {
        demoDb.deleteHabit(id);
        return;
      }
      return check(await supabase.from("habits").delete().eq("id", id));
    },
    onSuccess: () => {
      inv("habits", "completions", "goal_habits");
      toast.success("Habit deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface LogInput {
  habit: Habit;
  date: string;
  status: "completed" | "partial" | "skipped" | "rest" | "clear";
  progress?: number | undefined;
  minutes?: number | undefined;
  notes?: string | null | undefined;
}

/** Upsert keyed on (habit_id, occurrence_date) — prevents duplicate records. */
export function useLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (i: LogInput) => {
      if (isDemoActive()) {
        demoDb.logCompletion({
          habit_id: i.habit.id,
          occurrence_date: i.date,
          completion_status: i.status,
          progress_value:
            i.progress ?? (i.status === "completed" ? Number(i.habit.target_value) : 0),
          time_spent: i.minutes ?? 0,
          notes: i.notes ?? null,
        });
        return;
      }
      if (i.status === "clear") {
        check(
          await supabase
            .from("habit_completions")
            .delete()
            .eq("habit_id", i.habit.id)
            .eq("occurrence_date", i.date),
        );
        return;
      }
      check(
        await supabase.from("habit_completions").upsert(
          {
            user_id: await uid(),
            habit_id: i.habit.id,
            occurrence_date: i.date,
            completion_status: i.status,
            progress_value:
              i.progress ?? (i.status === "completed" ? Number(i.habit.target_value) : 0),
            time_spent: i.minutes ?? 0,
            notes: i.notes ?? null,
          },
          { onConflict: "habit_id,occurrence_date" },
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["completions"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export type GoalInput = Omit<T["goals"]["Insert"], "user_id" | "id">;
export type GoalSaveInput =
  | (GoalInput & { id?: string | undefined; habitIds?: string[] | undefined })
  | (Partial<GoalInput> & { id: string; habitIds?: string[] | undefined });

export function useSaveGoal() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, habitIds, ...v }: GoalSaveInput) => {
      if (isDemoActive()) {
        const saved = demoDb.saveGoal({ id, ...v } as Partial<Goal> & { title: string });
        if (habitIds !== undefined) {
          demoDb.setGoalHabits(saved.id, habitIds);
        }
        return saved;
      }
      const userId = await uid();
      const g = id
        ? check(await supabase.from("goals").update(v).eq("id", id).select().single())
        : check(
            await supabase
              .from("goals")
              .insert({ ...(v as GoalInput), user_id: userId })
              .select()
              .single(),
          );
      if (!g) throw new Error("Failed to save goal");
      if (habitIds !== undefined) {
        check(await supabase.from("goal_habits").delete().eq("goal_id", g.id));
        if (habitIds.length)
          check(
            await supabase
              .from("goal_habits")
              .insert(habitIds.map((habit_id) => ({ goal_id: g.id, habit_id, user_id: userId }))),
          );
      }
      return g;
    },
    onSuccess: (_d, v) => {
      inv("goals", "goal_habits");
      toast.success(v.id ? "Goal updated" : "Goal created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGoal() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemoActive()) {
        demoDb.deleteGoal(id);
        return;
      }
      return check(await supabase.from("goals").delete().eq("id", id));
    },
    onSuccess: () => {
      inv("goals", "goal_habits");
      toast.success("Goal deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProfile() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: T["profiles"]["Update"]) => {
      if (isDemoActive()) {
        return demoDb.setProfile(v);
      }
      const userId = await uid();
      const res = await supabase
        .from("profiles")
        .upsert({ ...v, id: userId }, { onConflict: "id" })
        .select()
        .single();
      return check(res);
    },
    onSuccess: () => {
      inv("profile");
      toast.success("Profile updated successfully");
    },
    onError: (e: Error) => {
      if (
        e.message.includes("schema cache") ||
        e.message.includes("Could not find the table 'public.profiles'")
      ) {
        toast.error(
          "Supabase tables not found. Run the schema migration (0000_consist_schema.sql) in your Supabase SQL Editor.",
          { duration: 8000 },
        );
      } else {
        toast.error(e.message);
      }
    },
  });
}

export function useNotificationActions() {
  const inv = useInvalidate();
  const markRead = useMutation({
    mutationFn: async (id: string | "all") => {
      if (isDemoActive()) {
        if (id === "all") demoDb.markAllNotificationsRead();
        else demoDb.markNotificationRead(id);
        return;
      }
      const q = supabase.from("notifications").update({ read_status: true });
      check(await (id === "all" ? q.eq("read_status", false) : q.eq("id", id)));
    },
    onSuccess: () => inv("notifications"),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoActive()) {
        demoDb.deleteNotification(id);
        return;
      }
      return check(await supabase.from("notifications").delete().eq("id", id));
    },
    onSuccess: () => inv("notifications"),
  });
  return { markRead, remove };
}

/* ---------------- background engine: achievements + notifications ---------------- */
export type NotificationSettings = {
  reminders?: boolean;
  goals?: boolean;
  achievements?: boolean;
  streaks?: boolean;
  quiet_hours?: { enabled?: boolean; start?: string; end?: string };
};

function isQuietTime(quiet?: { enabled?: boolean; start?: string; end?: string }) {
  if (!quiet?.enabled || !quiet.start || !quiet.end) return false;
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const [sH = 0, sM = 0] = quiet.start.split(":").map(Number);
  const [eH = 0, eM = 0] = quiet.end.split(":").map(Number);
  const startMins = sH * 60 + sM;
  const endMins = eH * 60 + eM;
  if (startMins <= endMins) {
    return currentMins >= startMins && currentMins <= endMins;
  }
  return currentMins >= startMins || currentMins <= endMins;
}

/** Unlocks achievements from real activity and creates deduplicated in-app notifications. */
export function useEngine() {
  const { habits, completions, idx, streaks, today, isLoading } = useHabitData();
  const goals = useGoals();
  const ach = useAchievements();
  const mine = useUserAchievements();
  const profile = useProfile();
  const qc = useQueryClient();
  const unlockingRef = useRef(new Set<string>());
  const sentNotesRef = useRef(new Set<string>());

  useEffect(() => {
    if (isLoading || !goals.data || !ach.data || !mine.data || !profile.data) return;
    const settings = (profile.data.notification_settings ?? {}) as NotificationSettings;
    const have = new Set(mine.data.map((m) => m.achievement_id));
    const totalDone = completions.filter((c) => c.completion_status === "completed").length;
    const maxStreak = Math.max(
      0,
      ...[...streaks.values()].map((s) => Math.max(s.longest, s.current)),
    );
    const minutes = completions.reduce((a, c) => a + (c.time_spent || 0), 0);
    const goalsDone = goals.data.filter((g) => g.status === "completed").length;
    const metric = (t: string) =>
      t === "habits_created"
        ? habits.length
        : t === "completions"
          ? totalDone
          : t === "streak"
            ? maxStreak
            : t === "minutes"
              ? minutes
              : t === "goals_completed"
                ? goalsDone
                : 0;

    const newly = ach.data.filter((a) => {
      const cond = a.unlock_condition as { type: string; value: number };
      return !have.has(a.id) && !unlockingRef.current.has(a.id) && metric(cond.type) >= cond.value;
    });

    const inQuietHours = isQuietTime(settings.quiet_hours);

    const notes: {
      title: string;
      message: string;
      notification_type: string;
      dedupe_key: string;
    }[] = [];
    if (settings.achievements !== false)
      for (const a of newly)
        notes.push({
          title: `Achievement unlocked: ${a.name}`,
          message: a.description,
          notification_type: "achievement",
          dedupe_key: `ach:${a.id}`,
        });

    if (settings.reminders !== false && !inQuietHours) {
      const pending = habits.filter(
        (h) =>
          h.status === "active" &&
          isScheduled(h as HabitLike, today) &&
          !idx.get(`${h.id}|${today}`),
      );
      if (pending.length && new Date().getHours() >= 12)
        notes.push({
          title: "Commitments waiting",
          message: `${pending.length} commitment${pending.length > 1 ? "s" : ""} still open for today.`,
          notification_type: "reminder",
          dedupe_key: `rem:${today}`,
        });
    }
    if (settings.streaks !== false && !inQuietHours)
      for (const h of habits) {
        const s = streaks.get(h.id);
        for (const m of [7, 30, 100])
          if (s && s.current === m)
            notes.push({
              title: `${m}-day streak`,
              message: `“${h.name}” has a ${m}-day streak. Keep going.`,
              notification_type: "streak",
              dedupe_key: `streak:${h.id}:${m}:${today}`,
            });
      }
    if (settings.goals !== false && !inQuietHours) {
      const soon = toKey(addDays(new Date(), 3));
      for (const g of goals.data)
        if (
          g.status === "active" &&
          g.target_date &&
          g.target_date >= today &&
          g.target_date <= soon
        )
          notes.push({
            title: "Goal deadline approaching",
            message: `“${g.title}” is due ${format(new Date(g.target_date + "T00:00"), "MMM d")}.`,
            notification_type: "goal",
            dedupe_key: `goal:${g.id}:${g.target_date}`,
          });
    }

    const unhandledNotes = notes.filter((n) => !sentNotesRef.current.has(n.dedupe_key));

    if (!newly.length && !unhandledNotes.length) return;

    // Immediately mark in flight
    newly.forEach((a) => unlockingRef.current.add(a.id));
    unhandledNotes.forEach((n) => sentNotesRef.current.add(n.dedupe_key));

    (async () => {
      const userId = profile.data!.id;
      if (isDemoActive()) {
        if (newly.length) {
          newly.forEach((a) =>
            toast.success(`Achievement unlocked · ${a.name}`, { description: a.description }),
          );
        }
        return;
      }
      if (newly.length) {
        await supabase.from("user_achievements").upsert(
          newly.map((a) => ({ user_id: userId, achievement_id: a.id })),
          { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
        );
        newly.forEach((a) =>
          toast.success(`Achievement unlocked · ${a.name}`, { description: a.description }),
        );
        qc.invalidateQueries({ queryKey: ["user_achievements"] });
      }
      if (unhandledNotes.length) {
        await supabase.from("notifications").upsert(
          unhandledNotes.map((n) => ({ ...n, user_id: userId })),
          { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
        );
        qc.invalidateQueries({ queryKey: ["notifications"] });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, habits, completions, goals.data, ach.data, mine.data, profile.data, today]);
}

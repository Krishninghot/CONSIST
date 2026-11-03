/**
 * CONSIST business logic: scheduling, streaks and consistency score.
 *
 * Consistency Score = completed eligible occurrences / eligible occurrences × 100
 * Eligible occurrence = a date where the habit is scheduled, within its start/end
 * range, not in the future, and not marked as a rest day ("rest" record or rest weekday).
 * A partial record counts as progress_value/target (capped at 1).
 * Today counts as eligible only once it has a record (so today never drags the score down).
 */
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export type TrackingType = "completion" | "time" | "percentage";
export type ScheduleConfig =
  | { type: "daily"; rest_days?: number[] }
  | { type: "weekdays"; rest_days?: number[] }
  | { type: "days"; days: number[]; rest_days?: number[] } // 0=Sun..6=Sat
  | { type: "interval"; every: number; rest_days?: number[] };
export type RecoveryConfig = { mode: "strict" | "grace"; grace_days?: number };

export interface HabitLike {
  id: string;
  start_date: string; // yyyy-MM-dd
  end_date?: string | null;
  status: string;
  tracking_type: TrackingType | string;
  target_value: number;
  schedule_configuration: ScheduleConfig | unknown;
  recovery_configuration?: RecoveryConfig | unknown;
}
export interface CompletionLike {
  habit_id: string;
  occurrence_date: string;
  completion_status: string;
  progress_value: number;
  time_spent: number;
  notes?: string | null | undefined;
}

export const toKey = (d: Date) => format(d, "yyyy-MM-dd");
export const fromKey = (k: string) => parseISO(k);

function sched(h: HabitLike): ScheduleConfig {
  const s = h.schedule_configuration as ScheduleConfig | null;
  return s && typeof s === "object" && "type" in s ? s : { type: "daily" };
}

/** Is the habit expected on this date (ignores rest days)? */
export function isScheduled(h: HabitLike, dateKey: string): boolean {
  if (dateKey < h.start_date) return false;
  if (h.end_date && dateKey > h.end_date) return false;
  const d = fromKey(dateKey);
  const dow = d.getDay();
  const s = sched(h);
  switch (s.type) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "days":
      return (s.days ?? []).includes(dow);
    case "interval": {
      const every = Math.max(1, s.every || 1);
      return differenceInCalendarDays(d, fromKey(h.start_date)) % every === 0;
    }
  }
}

export function isRestWeekday(h: HabitLike, dateKey: string) {
  return (sched(h).rest_days ?? []).includes(fromKey(dateKey).getDay());
}

/** Completion credit 0..1 for one record. */
export function credit(h: HabitLike, c?: CompletionLike): number {
  if (!c) return 0;
  if (c.completion_status === "completed") return 1;
  if (c.completion_status === "partial") {
    const t = Number(h.target_value) || 1;
    const v = h.tracking_type === "time" ? c.time_spent : c.progress_value;
    return Math.max(0, Math.min(1, v / t));
  }
  return 0;
}

export function isDone(h: HabitLike, c?: CompletionLike) {
  return credit(h, c) >= 1;
}

export type DayState = "done" | "partial" | "missed" | "rest" | "pending" | "unscheduled";

export function dayState(
  h: HabitLike,
  dateKey: string,
  c: CompletionLike | undefined,
  todayKey: string,
): DayState {
  if (!isScheduled(h, dateKey)) return "unscheduled";
  if (c?.completion_status === "rest" || (isRestWeekday(h, dateKey) && !c)) return "rest";
  if (isDone(h, c)) return "done";
  if (c && credit(h, c) > 0) return "partial";
  if (dateKey >= todayKey) return "pending";
  return "missed";
}

export function indexCompletions(cs: CompletionLike[]) {
  const m = new Map<string, CompletionLike>();
  for (const c of cs) m.set(`${c.habit_id}|${c.occurrence_date}`, c);
  return m;
}

export interface StreakInfo {
  current: number;
  longest: number;
  totalDone: number;
  missed: number;
  recoveries: number;
  history: { start: string; end: string; length: number }[];
}

/**
 * Habit-specific streaks over scheduled occurrences only. Unscheduled dates and rest
 * days never break a streak. In "grace" mode, up to `grace_days` consecutive misses
 * are forgiven (counted as a recovery) without resetting the streak.
 * Today being still pending does not break the current streak.
 */
export function computeStreak(
  h: HabitLike,
  idx: Map<string, CompletionLike>,
  todayKey: string,
): StreakInfo {
  const rec = (h.recovery_configuration as RecoveryConfig) ?? { mode: "strict" };
  const grace = rec.mode === "grace" ? Math.max(0, rec.grace_days ?? 1) : 0;
  let cur = 0,
    longest = 0,
    totalDone = 0,
    missed = 0,
    recoveries = 0,
    missRun = 0;
  let runStart: string | null = null,
    lastDone: string | null = null;
  const history: StreakInfo["history"] = [];
  const close = () => {
    if (cur > 0 && runStart && lastDone)
      history.push({ start: runStart, end: lastDone, length: cur });
    cur = 0;
    runStart = null;
  };
  let d = fromKey(h.start_date);
  const end = fromKey(todayKey);
  let guard = 0;
  while (d <= end && guard++ < 4000) {
    const k = toKey(d);
    const st = dayState(h, k, idx.get(`${h.id}|${k}`), todayKey);
    if (st === "done") {
      if (missRun > 0 && cur > 0) recoveries++;
      missRun = 0;
      cur++;
      totalDone++;
      lastDone = k;
      if (!runStart) runStart = k;
      longest = Math.max(longest, cur);
    } else if (st === "missed" || st === "partial") {
      if (st === "missed" || k < todayKey) missed++;
      missRun++;
      if (missRun > grace) close();
    }
    d = addDays(d, 1);
  }
  const current = cur;
  if (cur > 0 && runStart && lastDone)
    history.push({ start: runStart, end: lastDone, length: cur });
  return { current, longest, totalDone, missed, recoveries, history };
}

export interface ScoreResult {
  score: number | null;
  eligible: number;
  earned: number;
}

/** Consistency over [fromKey, toKey] inclusive across habits. score=null when no eligible data. */
export function consistency(
  habits: HabitLike[],
  idx: Map<string, CompletionLike>,
  from: string,
  to: string,
  todayKey: string,
): ScoreResult {
  let eligible = 0,
    earned = 0;
  const last = to > todayKey ? todayKey : to;
  for (const h of habits) {
    if (h.status === "archived") continue;
    let d = fromKey(from > h.start_date ? from : h.start_date);
    let guard = 0;
    while (toKey(d) <= last && guard++ < 4000) {
      const k = toKey(d);
      const c = idx.get(`${h.id}|${k}`);
      const st = dayState(h, k, c, todayKey);
      if (st === "done" || st === "partial" || st === "missed") {
        eligible++;
        earned += credit(h, c);
      } else if (st === "pending" && k === todayKey) {
        // today only counts once acted on
      }
      d = addDays(d, 1);
    }
  }
  return { score: eligible ? Math.round((earned / eligible) * 100) : null, eligible, earned };
}

/** Per-day activity used by heatmaps: count of done-equivalent credits + scheduled count. */
export function dailyActivity(
  habits: HabitLike[],
  idx: Map<string, CompletionLike>,
  from: string,
  to: string,
  todayKey: string,
) {
  const out: { date: string; done: number; scheduled: number; pct: number; minutes: number }[] = [];
  let d = fromKey(from);
  let guard = 0;
  while (toKey(d) <= to && guard++ < 800) {
    const k = toKey(d);
    let done = 0,
      scheduled = 0,
      minutes = 0;
    for (const h of habits) {
      if (h.status === "archived") continue;
      const c = idx.get(`${h.id}|${k}`);
      const st = dayState(h, k, c, todayKey);
      if (c) minutes += c.time_spent || 0;
      if (st === "unscheduled" || st === "rest") continue;
      if (st === "pending" && k > todayKey) continue;
      scheduled++;
      done += credit(h, c);
    }
    out.push({
      date: k,
      done: Math.round(done * 10) / 10,
      scheduled,
      pct: scheduled ? Math.round((done / scheduled) * 100) : 0,
      minutes,
    });
    d = addDays(d, 1);
  }
  return out;
}

export function heatLevel(done: number): 0 | 1 | 2 | 3 | 4 {
  if (done <= 0) return 0;
  if (done < 2) return 1;
  if (done < 3) return 2;
  if (done < 5) return 3;
  return 4;
}

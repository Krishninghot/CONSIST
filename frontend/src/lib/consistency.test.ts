import { describe, it, expect } from "vitest";
import {
  computeStreak,
  consistency,
  indexCompletions,
  isScheduled,
  isRestWeekday,
  credit,
  dayState,
  type HabitLike,
  type CompletionLike,
} from "./consistency";

const base: HabitLike = {
  id: "h",
  start_date: "2026-01-05", // Monday
  status: "active",
  tracking_type: "completion",
  target_value: 1,
  schedule_configuration: { type: "daily" },
  recovery_configuration: { mode: "strict" },
};

const done = (d: string, overrides?: Partial<CompletionLike>): CompletionLike => ({
  habit_id: "h",
  occurrence_date: d,
  completion_status: "completed",
  progress_value: 1,
  time_spent: 0,
  ...overrides,
});

describe("schedule", () => {
  it("weekday habit is not scheduled on Saturday", () => {
    expect(
      isScheduled({ ...base, schedule_configuration: { type: "weekdays" } }, "2026-01-10"),
    ).toBe(false);
  });

  it("specific days habit respects configured days (Mon, Wed, Fri)", () => {
    const habit = { ...base, schedule_configuration: { type: "days", days: [1, 3, 5] } };
    expect(isScheduled(habit, "2026-01-05")).toBe(true); // Monday (1)
    expect(isScheduled(habit, "2026-01-06")).toBe(false); // Tuesday (2)
    expect(isScheduled(habit, "2026-01-07")).toBe(true); // Wednesday (3)
    expect(isScheduled(habit, "2026-01-08")).toBe(false); // Thursday (4)
    expect(isScheduled(habit, "2026-01-09")).toBe(true); // Friday (5)
  });

  it("interval schedule (every 2 days) alternates correctly from start_date", () => {
    const habit = { ...base, schedule_configuration: { type: "interval", every: 2 } };
    expect(isScheduled(habit, "2026-01-05")).toBe(true); // Day 0
    expect(isScheduled(habit, "2026-01-06")).toBe(false); // Day 1
    expect(isScheduled(habit, "2026-01-07")).toBe(true); // Day 2
    expect(isScheduled(habit, "2026-01-08")).toBe(false); // Day 3
  });

  it("does not schedule before start_date or after end_date", () => {
    const habit = { ...base, start_date: "2026-01-05", end_date: "2026-01-10" };
    expect(isScheduled(habit, "2026-01-04")).toBe(false);
    expect(isScheduled(habit, "2026-01-10")).toBe(true);
    expect(isScheduled(habit, "2026-01-11")).toBe(false);
  });

  it("identifies designated rest weekdays correctly", () => {
    const habit = { ...base, schedule_configuration: { type: "daily", rest_days: [0, 6] } };
    expect(isRestWeekday(habit, "2026-01-10")).toBe(true); // Saturday (6)
    expect(isRestWeekday(habit, "2026-01-11")).toBe(true); // Sunday (0)
    expect(isRestWeekday(habit, "2026-01-12")).toBe(false); // Monday (1)
  });
});

describe("tracking credits", () => {
  it("gives full credit (1) for completed simple habit", () => {
    expect(credit(base, done("2026-01-05"))).toBe(1);
  });

  it("gives fractional credit for time-based habits", () => {
    const timeHabit: HabitLike = {
      ...base,
      tracking_type: "time",
      target_value: 60,
    };
    const c45 = done("2026-01-05", { completion_status: "partial", time_spent: 45 });
    expect(credit(timeHabit, c45)).toBe(0.75);

    const c60 = done("2026-01-05", { completion_status: "completed", time_spent: 60 });
    expect(credit(timeHabit, c60)).toBe(1);
  });

  it("gives fractional credit for percentage/quantity habits", () => {
    const pctHabit: HabitLike = {
      ...base,
      tracking_type: "percentage",
      target_value: 20,
    };
    const c10 = done("2026-01-05", { completion_status: "partial", progress_value: 10 });
    expect(credit(pctHabit, c10)).toBe(0.5);
  });
});

describe("streaks", () => {
  it("unscheduled weekend does not break a weekday streak", () => {
    const h = { ...base, schedule_configuration: { type: "weekdays" } };
    const idx = indexCompletions(["2026-01-08", "2026-01-09", "2026-01-12"].map((d) => done(d)));
    expect(computeStreak(h, idx, "2026-01-12").current).toBe(3);
  });

  it("strict mode resets after one missed scheduled day", () => {
    const idx = indexCompletions(["2026-01-05", "2026-01-07"].map((d) => done(d)));
    expect(computeStreak(base, idx, "2026-01-07").current).toBe(1);
  });

  it("grace of 1 day keeps the streak alive", () => {
    const idx = indexCompletions(["2026-01-05", "2026-01-07"].map((d) => done(d)));
    const s = computeStreak(
      { ...base, recovery_configuration: { mode: "grace", grace_days: 1 } },
      idx,
      "2026-01-07",
    );
    expect(s.current).toBe(2);
    expect(s.recoveries).toBe(1);
  });

  it("designated rest day does not break active streak", () => {
    const h = { ...base, schedule_configuration: { type: "daily", rest_days: [3] } }; // Wednesday rest
    const idx = indexCompletions([
      done("2026-01-05"), // Mon
      done("2026-01-06"), // Tue
      // Wed is rest day, no record needed
      done("2026-01-08"), // Thu
    ]);
    expect(computeStreak(h, idx, "2026-01-08").current).toBe(3);
  });

  it("today being pending does not break streak before day ends", () => {
    const idx = indexCompletions([
      done("2026-01-05"),
      done("2026-01-06"),
      // 2026-01-07 is today and has no record yet
    ]);
    const s = computeStreak(base, idx, "2026-01-07");
    expect(s.current).toBe(2);
  });
});

describe("consistency score", () => {
  it("is null with no eligible occurrences (no invented scores)", () => {
    expect(
      consistency([base], new Map(), "2026-01-05", "2026-01-05", "2026-01-05").score,
    ).toBeNull();
  });

  it("2 of 4 past scheduled days = 50%", () => {
    const idx = indexCompletions(["2026-01-05", "2026-01-06"].map((d) => done(d)));
    expect(consistency([base], idx, "2026-01-05", "2026-01-08", "2026-01-09").score).toBe(50);
  });

  it("accounts for partial completion in earned score", () => {
    const timeHabit: HabitLike = { ...base, tracking_type: "time", target_value: 60 };
    const idx = indexCompletions([
      done("2026-01-05", { completion_status: "completed", time_spent: 60 }), // 1.0
      done("2026-01-06", { completion_status: "partial", time_spent: 30 }), // 0.5
    ]);
    // 2 days eligible: 1.5 earned / 2 = 75%
    expect(consistency([timeHabit], idx, "2026-01-05", "2026-01-06", "2026-01-07").score).toBe(75);
  });

  it("handles month boundary transitions (e.g. Jan 31 to Feb 1) without interruption", () => {
    const monthHabit: HabitLike = {
      ...base,
      start_date: "2026-01-30",
    };
    const idx = indexCompletions([
      done("2026-01-30"),
      done("2026-01-31"),
      done("2026-02-01"),
      done("2026-02-02"),
    ]);
    const s = computeStreak(monthHabit, idx, "2026-02-02");
    expect(s.current).toBe(4);
    expect(s.longest).toBe(4);
  });

  it("ignores archived habits in consistency score calculation", () => {
    const activeHabit: HabitLike = { ...base, id: "active-1" };
    const archivedHabit: HabitLike = { ...base, id: "archived-1", status: "archived" };
    const idx = indexCompletions([
      done("2026-01-05", { habit_id: "active-1" }),
      // archived habit has no record, but shouldn't drag down score
    ]);
    const res = consistency(
      [activeHabit, archivedHabit],
      idx,
      "2026-01-05",
      "2026-01-05",
      "2026-01-06",
    );
    expect(res.eligible).toBe(1);
    expect(res.score).toBe(100);
  });
});

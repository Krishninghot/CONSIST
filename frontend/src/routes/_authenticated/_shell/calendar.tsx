import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Moon,
  SkipForward,
  MinusCircle,
  BarChart2,
  Flame,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Card, HeatCell, HeatLegend, EmptyState } from "@/components/consist/ui";
import { HabitIcon } from "@/components/consist/icons";
import { cn } from "@/lib/utils";
import { useHabitData, todayKey } from "@/lib/data";
import { dailyActivity, dayState, isScheduled, toKey, type DayState } from "@/lib/consistency";

export const Route = createFileRoute("/_authenticated/_shell/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — CONSIST" },
      { name: "description", content: "Monthly activity calendar and contribution heatmap." },
      { property: "og:title", content: "Calendar — CONSIST" },
      {
        property: "og:description",
        content: "Monthly activity calendar and contribution heatmap.",
      },
    ],
  }),
  component: Page,
});

/* ── helpers ─────────────────────────────────────────────── */
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const stateConfig: Record<DayState, { label: string; color: string; icon: React.ElementType }> = {
  done: { label: "Completed", color: "text-emerald-400", icon: CheckCircle2 },
  partial: { label: "Partial", color: "text-amber-400", icon: MinusCircle },
  missed: { label: "Missed", color: "text-red-400", icon: Circle },
  rest: { label: "Rest day", color: "text-blue-400", icon: Moon },
  pending: { label: "Pending", color: "text-muted-foreground", icon: Circle },
  unscheduled: { label: "Unscheduled", color: "text-muted-foreground/40", icon: Circle },
};

/* ── heatmap section ─────────────────────────────────────── */
function YearHeatmap({
  habits,
  idx,
  today,
  onSelectDate,
  selectedDate,
}: {
  habits: ReturnType<typeof useHabitData>["habits"];
  idx: ReturnType<typeof useHabitData>["idx"];
  today: string;
  onSelectDate: (key: string) => void;
  selectedDate: string | null;
}) {
  const [heatYear, setHeatYear] = useState(() => new Date().getFullYear());
  const yearStart = `${heatYear}-01-01`;
  const yearEnd = `${heatYear}-12-31`;

  const activityMap = useMemo(() => {
    const raw = dailyActivity(habits, idx, yearStart, yearEnd > today ? today : yearEnd, today);
    const m = new Map<string, number>();
    for (const d of raw) m.set(d.date, d.done);
    return m;
  }, [habits, idx, yearStart, yearEnd, today]);

  // Build weeks grid (Sun-start)
  const gridStart = startOfWeek(new Date(`${heatYear}-01-01`));
  const gridEnd = endOfWeek(new Date(`${heatYear}-12-31`));
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const totalActive = [...activityMap.values()].filter((v) => v > 0).length;
  const totalDone = [...activityMap.values()].reduce((a, b) => a + b, 0);

  return (
    <Card className="overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Activity Heatmap</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {totalActive} active days · {Math.round(totalDone)} completions in {heatYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setHeatYear((y) => y - 1)}
            disabled={heatYear <= 2020}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm font-medium tabular-nums">{heatYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setHeatYear((y) => y + 1)}
            disabled={heatYear >= new Date().getFullYear()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month labels */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${weeks.length * 14 + 32}px` }}>
          {/* Month labels row */}
          <div className="mb-1 ml-8 flex">
            {weeks.map((week, wi) => {
              const firstOfWeek = week[0]!;
              const show = firstOfWeek.getDate() <= 7;
              return (
                <div key={wi} className="w-[14px] shrink-0 text-[9px] text-muted-foreground">
                  {show ? format(firstOfWeek, "MMM") : ""}
                </div>
              );
            })}
          </div>
          {/* Day rows */}
          <div className="flex gap-0">
            {/* Day-of-week labels */}
            <div className="mr-1 flex flex-col gap-[2px]">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <div key={d} className="h-[12px] text-[9px] leading-[12px] text-muted-foreground">
                  {d % 2 === 1 ? ["S", "M", "T", "W", "T", "F", "S"][d] : ""}
                </div>
              ))}
            </div>
            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day) => {
                  const k = toKey(day);
                  const inYear = day.getFullYear() === heatYear;
                  const done = inYear ? (activityMap.get(k) ?? 0) : 0;
                  const isFuture = k > today;
                  return (
                    <HeatCell
                      key={k}
                      done={inYear && !isFuture ? done : 0}
                      title={
                        inYear
                          ? `${format(day, "MMM d, yyyy")}: ${Math.round(done)} completions`
                          : undefined
                      }
                      onClick={inYear && !isFuture ? () => onSelectDate(k) : undefined}
                      size="h-[12px] w-[12px]"
                      selected={selectedDate === k}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <HeatLegend />
      </div>
    </Card>
  );
}

/* ── day detail panel ────────────────────────────────────── */
function DayDetail({
  dateKey,
  habits,
  idx,
  today,
  onClose,
}: {
  dateKey: string;
  habits: ReturnType<typeof useHabitData>["habits"];
  idx: ReturnType<typeof useHabitData>["idx"];
  today: string;
  onClose: () => void;
}) {
  const date = new Date(dateKey + "T12:00:00");
  const isFuture = dateKey > today;

  const { scheduledRows, unscheduledRows } = useMemo(() => {
    const active = habits.filter((h) => h.status !== "archived");
    const scheduled: Array<{
      h: (typeof habits)[number];
      c: ReturnType<typeof idx.get>;
      state: DayState;
    }> = [];
    const unscheduled: Array<{
      h: (typeof habits)[number];
      c: ReturnType<typeof idx.get>;
      state: DayState;
    }> = [];

    for (const h of active) {
      const c = idx.get(`${h.id}|${dateKey}`);
      const state = dayState(h, dateKey, c, today);
      if (state !== "unscheduled" || c) {
        scheduled.push({ h, c, state });
      } else {
        unscheduled.push({ h, c, state: "unscheduled" });
      }
    }

    const order: DayState[] = ["done", "partial", "missed", "rest", "pending", "unscheduled"];
    scheduled.sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state));
    return { scheduledRows: scheduled, unscheduledRows: unscheduled };
  }, [habits, idx, dateKey, today]);

  const done = scheduledRows.filter((r) => r.state === "done").length;
  const partial = scheduledRows.filter((r) => r.state === "partial").length;
  const missed = scheduledRows.filter((r) => r.state === "missed").length;
  const rest = scheduledRows.filter((r) => r.state === "rest").length;
  const scheduled = scheduledRows.filter((r) => r.state !== "unscheduled").length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.25 }}
      className="surface-card flex flex-col"
    >
      <div className="flex items-start justify-between border-b border-border/50 p-5">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {format(date, "EEEE")}
          </div>
          <div className="mt-0.5 text-xl font-semibold">{format(date, "MMMM d, yyyy")}</div>
          {isToday(date) && (
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              Today
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Summary chips */}
      {!isFuture && scheduled > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border/50 px-5 py-3">
          {done > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> {done} done
            </span>
          )}
          {partial > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400">
              <MinusCircle className="h-3 w-3" /> {partial} partial
            </span>
          )}
          {missed > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400">
              <Circle className="h-3 w-3" /> {missed} missed
            </span>
          )}
          {rest > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400">
              <Moon className="h-3 w-3" /> {rest} rest
            </span>
          )}
        </div>
      )}

      {/* Habit rows */}
      <div className="flex-1 overflow-y-auto">
        {scheduledRows.length === 0 && unscheduledRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {isFuture ? "This day is in the future." : "No habits were scheduled for this day."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {scheduledRows.map(({ h, c, state }) => {
              const cfg = stateConfig[state];
              const Icon = cfg.icon;
              const progressPct =
                state === "partial" && h.target_value > 0
                  ? Math.round(
                      ((h.tracking_type === "time"
                        ? (c?.time_spent ?? 0)
                        : (c?.progress_value ?? 0)) /
                        h.target_value) *
                        100,
                    )
                  : null;

              return (
                <div key={h.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{
                      backgroundColor: `${h.color ?? "#F5BD38"}20`,
                      color: h.color ?? "#F5BD38",
                    }}
                  >
                    <HabitIcon name={h.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{h.name}</span>
                      {progressPct !== null && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {progressPct}%
                        </span>
                      )}
                    </div>
                    {c?.notes && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.notes}</p>
                    )}
                    {h.tracking_type === "time" && c && c.time_spent > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.time_spent} min / {h.target_value} min target
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium shrink-0",
                      cfg.color,
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </span>
                </div>
              );
            })}

            {/* Unscheduled habits */}
            {unscheduledRows.length > 0 && (
              <div className="p-4 bg-white/[0.01]">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-2">
                  Unscheduled on this date ({unscheduledRows.length})
                </div>
                <div className="space-y-2">
                  {unscheduledRows.map(({ h }) => (
                    <div key={h.id} className="flex items-center gap-3 py-1.5 opacity-60">
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                        style={{
                          backgroundColor: `${h.color ?? "#F5BD38"}15`,
                          color: h.color ?? "#F5BD38",
                        }}
                      >
                        <HabitIcon name={h.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-xs font-medium text-muted-foreground">
                        {h.name}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground/50">
                        Off schedule
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── main page ───────────────────────────────────────────── */
function Page() {
  const { habits, idx, today, isLoading } = useHabitData();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activeHabits = useMemo(() => habits.filter((h) => h.status !== "archived"), [habits]);

  // Monthly activity data
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const fromKey = toKey(monthStart);
  const toKeyMonth = toKey(monthEnd > new Date() ? new Date() : monthEnd);

  const activityMap = useMemo(() => {
    const raw = dailyActivity(activeHabits, idx, fromKey, toKeyMonth, today);
    const m = new Map<string, { done: number; scheduled: number; pct: number }>();
    for (const d of raw) m.set(d.date, { done: d.done, scheduled: d.scheduled, pct: d.pct });
    return m;
  }, [activeHabits, idx, fromKey, toKeyMonth, today]);

  // Build calendar grid (full weeks, Sun-start)
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < calDays.length; i += 7) {
    weeks.push(calDays.slice(i, i + 7));
  }

  // Monthly summary stats
  const monthStats = useMemo(() => {
    const vals = [...activityMap.values()];
    const activeDays = vals.filter((v) => v.scheduled > 0 && v.done > 0).length;
    const totalScheduled = vals.reduce((a, b) => a + b.scheduled, 0);
    const totalDone = vals.reduce((a, b) => a + b.done, 0);
    const pct = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : null;
    return { activeDays, totalScheduled, totalDone: Math.round(totalDone), pct };
  }, [activityMap]);

  const handleSelectDate = (k: string) => {
    setSelectedDate((prev) => (prev === k ? null : k));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Track your daily activity and visualize consistency over time."
        actions={
          <Link to="/habits">
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart2 className="h-4 w-4" /> View Habits
            </Button>
          </Link>
        }
      />

      {activeHabits.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No habits yet"
          text="Create your first habit and your activity will appear here."
          action={
            <Link to="/habits">
              <Button size="sm" className="gap-2 bg-gold text-background hover:bg-gold/90">
                Get started
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Monthly calendar section */}
          <div className={cn("grid gap-6", selectedDate ? "lg:grid-cols-[1fr_320px]" : "")}>
            <Card>
              {/* Calendar header */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">{format(viewDate, "MMMM yyyy")}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {monthStats.activeDays} active days ·{" "}
                    {monthStats.pct !== null ? `${monthStats.pct}% completion` : "No data yet"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewDate((d) => subMonths(d, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setViewDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewDate((d) => addMonths(d, 1))}
                    disabled={isSameMonth(viewDate, new Date())}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Day-of-week headers */}
              <div className="mb-2 grid grid-cols-7 text-center">
                {DAY_LABELS.map((d) => (
                  <div
                    key={d}
                    className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="space-y-1">
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1">
                    {week.map((day) => {
                      const k = toKey(day);
                      const inMonth = isSameMonth(day, viewDate);
                      const isFuture = k > today;
                      const isSelected = selectedDate === k;
                      const data = activityMap.get(k);
                      const pct = data?.pct ?? 0;
                      const scheduled = data?.scheduled ?? 0;
                      const todayFlag = isToday(day);

                      return (
                        <button
                          key={k}
                          type="button"
                          disabled={isFuture || !inMonth}
                          onClick={() => inMonth && !isFuture && handleSelectDate(k)}
                          className={cn(
                            "group relative flex min-h-[56px] flex-col rounded-lg border p-1.5 text-left transition-all",
                            inMonth ? "cursor-pointer" : "cursor-default opacity-30",
                            isFuture && "opacity-30 cursor-default",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : todayFlag
                                ? "border-primary/50 bg-primary/5"
                                : "border-border/40 hover:border-border hover:bg-white/[0.02]",
                          )}
                        >
                          {/* Date number */}
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                              todayFlag
                                ? "bg-primary text-background font-semibold"
                                : inMonth
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                            )}
                          >
                            {format(day, "d")}
                          </span>

                          {/* Activity indicator */}
                          {inMonth && !isFuture && scheduled > 0 && (
                            <div className="mt-auto">
                              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    pct >= 100
                                      ? "bg-emerald-500"
                                      : pct >= 50
                                        ? "bg-primary"
                                        : pct > 0
                                          ? "bg-amber-500"
                                          : "bg-red-500/60",
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Dot for no activity yet */}
                          {inMonth && !isFuture && scheduled === 0 && (
                            <div className="mt-auto flex justify-center">
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 border-t border-border/50 pt-4">
                {[
                  { label: "Complete", color: "bg-emerald-500" },
                  { label: "Partial", color: "bg-primary" },
                  { label: "Started", color: "bg-amber-500" },
                  { label: "Missed", color: "bg-red-500/60" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-4 rounded-full", item.color)} />
                    <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Day detail panel */}
            <AnimatePresence>
              {selectedDate && (
                <DayDetail
                  dateKey={selectedDate}
                  habits={activeHabits}
                  idx={idx}
                  today={today}
                  onClose={() => setSelectedDate(null)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Monthly summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Active Days",
                value: monthStats.activeDays,
                icon: Flame,
                suffix: "",
              },
              {
                label: "Completion",
                value: monthStats.pct !== null ? monthStats.pct : "—",
                icon: CheckCircle2,
                suffix: monthStats.pct !== null ? "%" : "",
              },
              {
                label: "Total Done",
                value: monthStats.totalDone,
                icon: SkipForward,
                suffix: "",
              },
              {
                label: "Scheduled",
                value: monthStats.totalScheduled,
                icon: CalendarDays,
                suffix: "",
              },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">
                  {s.value}
                  {s.suffix}
                </div>
              </Card>
            ))}
          </div>

          {/* Year heatmap */}
          <YearHeatmap
            habits={activeHabits}
            idx={idx}
            today={today}
            onSelectDate={handleSelectDate}
            selectedDate={selectedDate}
          />
        </>
      )}
    </div>
  );
}

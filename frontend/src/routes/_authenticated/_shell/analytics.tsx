import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, startOfWeek, startOfMonth, eachDayOfInterval, subDays } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  Flame,
  Clock,
  Trophy,
  Activity,
  Target,
  BarChart2,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Card, HeatCell, HeatLegend, EmptyState } from "@/components/consist/ui";
import { HabitIcon } from "@/components/consist/icons";
import { cn } from "@/lib/utils";
import { useHabitData, todayKey } from "@/lib/data";
import { consistency, computeStreak, dailyActivity, toKey, fromKey } from "@/lib/consistency";
import { addDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/_shell/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — CONSIST" },
      { name: "description", content: "Deep-dive analytics for your habits and consistency." },
      { property: "og:title", content: "Analytics — CONSIST" },
      {
        property: "og:description",
        content: "Deep-dive analytics for your habits and consistency.",
      },
    ],
  }),
  component: Page,
});

/* ── types ───────────────────────────────────────────────── */
type Period = "week" | "month";

/* ── tooltip styling ─────────────────────────────────────── */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card rounded-lg border border-border/60 p-3 text-xs shadow-xl">
      {label && <p className="mb-2 font-medium text-muted-foreground">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── stat card ───────────────────────────────────────────── */
function StatChip({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn("p-4", accent && "border-primary/30 bg-primary/5")}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-lg text-primary",
            accent ? "bg-primary/20" : "bg-primary/10",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </Card>
  );
}

/* ── section heading ─────────────────────────────────────── */
function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground/70">{sub}</p>}
    </div>
  );
}

/* ── main page ───────────────────────────────────────────── */
function Page() {
  const { habits, idx, today, isLoading } = useHabitData();
  const [period, setPeriod] = useState<Period>("week");

  const activeHabits = useMemo(() => habits.filter((h) => h.status !== "archived"), [habits]);

  const fromDate = useMemo(() => {
    const t = fromKey(today);
    if (period === "week") return toKey(startOfWeek(t, { weekStartsOn: 1 }));
    return toKey(startOfMonth(t));
  }, [period, today]);

  // ── daily activity data ───────────────────────────────────
  const activity = useMemo(
    () => dailyActivity(activeHabits, idx, fromDate, today, today),
    [activeHabits, idx, fromDate, today],
  );

  // ── overall consistency ───────────────────────────────────
  const score = useMemo(
    () => consistency(activeHabits, idx, fromDate, today, today),
    [activeHabits, idx, fromDate, today],
  );

  // ── per-habit stats ───────────────────────────────────────
  const habitStats = useMemo(() => {
    return activeHabits.map((h) => {
      const s = computeStreak(h, idx, today);
      const c = consistency([h], idx, fromDate, today, today);
      const timeMins = [...idx.values()]
        .filter(
          (r) => r.habit_id === h.id && r.occurrence_date >= fromDate && r.occurrence_date <= today,
        )
        .reduce((acc, r) => acc + (r.time_spent || 0), 0);
      return { h, streak: s, score: c.score, timeMins };
    });
  }, [activeHabits, idx, fromDate, today]);

  // ── aggregate stats ───────────────────────────────────────
  const totalCompletions = useMemo(
    () => activity.reduce((a, d) => a + Math.round(d.done), 0),
    [activity],
  );
  const totalScheduled = useMemo(() => activity.reduce((a, d) => a + d.scheduled, 0), [activity]);
  const totalMinutes = useMemo(
    () =>
      habitStats.filter((h) => h.h.tracking_type === "time").reduce((a, h) => a + h.timeMins, 0),
    [habitStats],
  );

  // Global streak (max current streak across habits)
  const globalCurrentStreak = useMemo(
    () => Math.max(0, ...habitStats.map((h) => h.streak.current)),
    [habitStats],
  );
  const globalLongestStreak = useMemo(
    () => Math.max(0, ...habitStats.map((h) => h.streak.longest)),
    [habitStats],
  );

  // Best / worst by consistency score
  const sortedByScore = useMemo(
    () =>
      [...habitStats]
        .filter((h) => h.score !== null)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [habitStats],
  );
  const bestHabit = sortedByScore[0] ?? null;
  const worstHabit = sortedByScore[sortedByScore.length - 1] ?? null;

  // ── chart data ────────────────────────────────────────────

  // Chart A: daily completion line
  const lineData = useMemo(
    () =>
      activity.map((d) => ({
        date: format(fromKey(d.date), period === "week" ? "EEE" : "MMM d"),
        pct: d.pct,
        done: Math.round(d.done),
        scheduled: d.scheduled,
      })),
    [activity, period],
  );

  // Chart B: completed vs scheduled bar
  const barData = lineData;

  // Chart C: per-habit performance
  const habitPerfData = useMemo(
    () =>
      habitStats
        .filter((h) => h.score !== null)
        .map((h) => ({
          name: h.h.name.length > 16 ? h.h.name.slice(0, 14) + "…" : h.h.name,
          score: h.score ?? 0,
          color: h.h.color ?? "#F5BD38",
        }))
        .sort((a, b) => b.score - a.score),
    [habitStats],
  );

  // Chart D: streak history (current streak run per habit)
  const streakData = useMemo(
    () =>
      habitStats
        .filter((h) => h.streak.longest > 0)
        .map((h) => ({
          name: h.h.name.length > 16 ? h.h.name.slice(0, 14) + "…" : h.h.name,
          current: h.streak.current,
          longest: h.streak.longest,
          color: h.h.color ?? "#F5BD38",
        }))
        .sort((a, b) => b.longest - a.longest),
    [habitStats],
  );

  // Chart E: time investment
  const timeData = useMemo(
    () =>
      habitStats
        .filter((h) => h.h.tracking_type === "time" && h.timeMins > 0)
        .map((h) => ({
          name: h.h.name.length > 16 ? h.h.name.slice(0, 14) + "…" : h.h.name,
          minutes: h.timeMins,
          color: h.h.color ?? "#F5BD38",
        }))
        .sort((a, b) => b.minutes - a.minutes),
    [habitStats],
  );

  // Chart F: activity heatmap (last 10 weeks)
  const heatDays = useMemo(() => {
    const end = fromKey(today);
    const start = subDays(end, 69); // 10 weeks
    return eachDayOfInterval({ start, end });
  }, [today]);

  const heatMap = useMemo(() => {
    const raw = dailyActivity(activeHabits, idx, toKey(subDays(fromKey(today), 69)), today, today);
    const m = new Map<string, number>();
    for (const d of raw) m.set(d.date, d.done);
    return m;
  }, [activeHabits, idx, today]);

  const heatWeeks: Date[][] = useMemo(() => {
    const gridStart = startOfWeek(heatDays[0]!, { weekStartsOn: 0 });
    const gridDays = eachDayOfInterval({ start: gridStart, end: heatDays[heatDays.length - 1]! });
    const weeks: Date[][] = [];
    for (let i = 0; i < gridDays.length; i += 7) weeks.push(gridDays.slice(i, i + 7));
    return weeks;
  }, [heatDays]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const noData = activeHabits.length === 0;
  const hasActivity = score.eligible > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        subtitle={`Insights for ${period === "week" ? "this week" : "this month"}.`}
        actions={
          <div className="flex gap-1 rounded-lg border border-border/60 bg-card p-1">
            {(["week", "month"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  period === p
                    ? "bg-primary text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
        }
      />

      {noData ? (
        <EmptyState
          icon={BarChart2}
          title="No data yet"
          text="Create your first habit and start tracking to see analytics here."
          action={
            <Link to="/habits">
              <Button size="sm" className="gap-2 bg-gold text-background hover:bg-gold/90">
                Create a habit
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* ── Stats Strip ─────────────────────────────────────── */}
          <div>
            <SectionHeading
              title="Summary"
              sub={`Period: ${period === "week" ? "This Week" : "This Month"}`}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <StatChip
                icon={CheckCircle2}
                label="Completions"
                value={totalCompletions}
                hint={`of ${totalScheduled} scheduled`}
                accent
              />
              <StatChip
                icon={TrendingUp}
                label="Completion Rate"
                value={score.score !== null ? `${score.score}%` : "—"}
                hint={hasActivity ? `${score.eligible} eligible occurrences` : "No eligible data"}
              />
              <StatChip
                icon={Flame}
                label="Current Streak"
                value={globalCurrentStreak > 0 ? `${globalCurrentStreak}d` : "—"}
                hint="Best active streak"
              />
              <StatChip
                icon={Trophy}
                label="Longest Streak"
                value={globalLongestStreak > 0 ? `${globalLongestStreak}d` : "—"}
                hint="All-time best"
              />
              <StatChip
                icon={Clock}
                label="Time Invested"
                value={
                  totalMinutes > 0
                    ? totalMinutes >= 60
                      ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`
                      : `${totalMinutes}m`
                    : "—"
                }
                hint="Time-based habits"
              />
              <StatChip
                icon={Activity}
                label="Active Habits"
                value={activeHabits.length}
                hint={`${habits.filter((h) => h.status === "paused").length} paused`}
              />
              {bestHabit && (
                <StatChip
                  icon={ArrowUpRight}
                  label="Best Habit"
                  value={`${bestHabit.score}%`}
                  hint={bestHabit.h.name}
                />
              )}
              {worstHabit && worstHabit !== bestHabit && (
                <StatChip
                  icon={ArrowDownRight}
                  label="Needs Work"
                  value={`${worstHabit.score}%`}
                  hint={worstHabit.h.name}
                />
              )}
            </div>
          </div>

          {/* ── Chart A: Daily Completion Line ───────────────────── */}
          {lineData.length > 0 && (
            <div>
              <SectionHeading
                title="Daily Completion %"
                sub="How much of your schedule you completed each day"
              />
              <Card>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={lineData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="pct"
                      name="Completion %"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ fill: "var(--primary)", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* ── Chart B: Completed vs Scheduled ──────────────────── */}
          {barData.length > 0 && (
            <div>
              <SectionHeading
                title="Completed vs Scheduled"
                sub="Actual completions against your daily schedule"
              />
              <Card>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={barData}
                    margin={{ top: 4, right: 16, bottom: 0, left: -20 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        color: "var(--muted-foreground)",
                        paddingTop: 8,
                      }}
                    />
                    <RechartsBar
                      dataKey="scheduled"
                      name="Scheduled"
                      fill="rgba(255,255,255,0.08)"
                      radius={[4, 4, 0, 0]}
                    />
                    <RechartsBar
                      dataKey="done"
                      name="Completed"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* ── Chart C: Habit Performance ───────────────────────── */}
          {habitPerfData.length > 0 && (
            <div>
              <SectionHeading
                title="Habit Performance"
                sub={`Consistency % per habit — ${period === "week" ? "this week" : "this month"}`}
              />
              <Card>
                <ResponsiveContainer width="100%" height={Math.max(180, habitPerfData.length * 40)}>
                  <BarChart
                    data={habitPerfData}
                    layout="vertical"
                    margin={{ top: 4, right: 40, bottom: 0, left: 8 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="rgba(255,255,255,0.04)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <RechartsBar dataKey="score" name="Score %" radius={[0, 4, 4, 0]}>
                      {habitPerfData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </RechartsBar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* ── Chart D: Streak History ───────────────────────────── */}
          {streakData.length > 0 && (
            <div>
              <SectionHeading
                title="Streak History"
                sub="Current vs longest all-time streak per habit"
              />
              <Card>
                <ResponsiveContainer width="100%" height={Math.max(180, streakData.length * 48)}>
                  <BarChart
                    data={streakData}
                    layout="vertical"
                    margin={{ top: 4, right: 40, bottom: 0, left: 8 }}
                    barCategoryGap="25%"
                    barGap={4}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="rgba(255,255,255,0.04)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}d`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        color: "var(--muted-foreground)",
                        paddingTop: 8,
                      }}
                    />
                    <RechartsBar
                      dataKey="longest"
                      name="Longest"
                      fill="rgba(245,189,56,0.25)"
                      radius={[0, 4, 4, 0]}
                    />
                    <RechartsBar
                      dataKey="current"
                      name="Current"
                      fill="var(--primary)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* ── Chart E: Time Investment ──────────────────────────── */}
          {timeData.length > 0 && (
            <div>
              <SectionHeading title="Time Investment" sub="Minutes invested in time-based habits" />
              <Card>
                <ResponsiveContainer width="100%" height={Math.max(160, timeData.length * 44)}>
                  <BarChart
                    data={timeData}
                    layout="vertical"
                    margin={{ top: 4, right: 60, bottom: 0, left: 8 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="rgba(255,255,255,0.04)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}m`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <RechartsBar dataKey="minutes" name="Minutes" radius={[0, 4, 4, 0]}>
                      {timeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </RechartsBar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* ── Chart F: Activity Heatmap (10 weeks) ─────────────── */}
          <div>
            <SectionHeading
              title="Activity Heatmap"
              sub="Daily completion intensity — last 10 weeks"
            />
            <Card>
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${heatWeeks.length * 16 + 48}px` }}>
                  {/* Month labels */}
                  <div className="mb-1 ml-8 flex">
                    {heatWeeks.map((week, wi) => {
                      const firstOfWeek = week[0]!;
                      const show = firstOfWeek.getDate() <= 7;
                      return (
                        <div
                          key={wi}
                          className="w-[16px] shrink-0 text-[9px] text-muted-foreground"
                        >
                          {show ? format(firstOfWeek, "MMM") : ""}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-0">
                    {/* Day labels */}
                    <div className="mr-1 flex flex-col gap-[3px]">
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                        <div
                          key={d}
                          className="h-[13px] text-[9px] leading-[13px] text-muted-foreground"
                        >
                          {d % 2 === 1 ? ["S", "M", "T", "W", "T", "F", "S"][d] : ""}
                        </div>
                      ))}
                    </div>
                    {/* Cells */}
                    {heatWeeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((day) => {
                          const k = toKey(day);
                          const done = heatMap.get(k) ?? 0;
                          const isFuture = k > today;
                          return (
                            <HeatCell
                              key={k}
                              done={isFuture ? 0 : done}
                              title={`${format(day, "MMM d, yyyy")}: ${Math.round(done)} completions`}
                              size="h-[13px] w-[13px]"
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
          </div>

          {/* ── Individual Habit Breakdown ────────────────────────── */}
          {habitStats.length > 0 && (
            <div>
              <SectionHeading title="Habit Breakdown" sub="Detailed stats per habit" />
              <div className="space-y-2">
                {habitStats
                  .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                  .map(({ h, streak, score: hScore, timeMins }) => (
                    <Card key={h.id} className="p-4">
                      <div className="flex items-center gap-3">
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
                            <span className="truncate font-medium">{h.name}</span>
                            <span className="shrink-0 rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                              {h.category ?? "general"}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {hScore !== null ? `${hScore}%` : "—"} consistency
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {streak.current}d streak
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              {streak.longest}d best
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {streak.totalDone} done
                            </span>
                            {h.tracking_type === "time" && timeMins > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeMins >= 60
                                  ? `${Math.floor(timeMins / 60)}h ${timeMins % 60}m`
                                  : `${timeMins}m`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <motion.div
                            className="text-2xl font-semibold tabular-nums text-primary"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            {hScore !== null ? `${hScore}%` : "—"}
                          </motion.div>
                          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <motion.div
                              className="h-full rounded-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${hScore ?? 0}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

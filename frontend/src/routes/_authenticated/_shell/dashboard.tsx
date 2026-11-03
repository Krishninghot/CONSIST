import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  format,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  formatDistanceToNow,
} from "date-fns";
import {
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  Target,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  BookOpen,
  Check,
  Moon,
  SkipForward,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

import { Button } from "@/components/ui/button";
import { HabitDialog } from "@/components/consist/HabitDialog";
import { HabitRow } from "@/components/consist/HabitRow";
import { HabitIcon } from "@/components/consist/icons";
import {
  PageHeader,
  Stat,
  Card,
  ProgressRing,
  Bar as ProgressBar,
  HeatCell,
  HeatLegend,
  EmptyState,
} from "@/components/consist/ui";
import { cn } from "@/lib/utils";
import {
  useHabitData,
  useGoals,
  useProfile,
  useAchievements,
  useUserAchievements,
  todayKey,
  type Habit,
} from "@/lib/data";
import {
  isScheduled,
  credit,
  consistency,
  dailyActivity,
  dayState,
  toKey,
  type HabitLike,
} from "@/lib/consistency";

export const Route = createFileRoute("/_authenticated/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CONSIST" },
      { name: "description", content: "Your real-time daily consistency dashboard." },
      { property: "og:title", content: "Dashboard — CONSIST" },
    ],
  }),
  component: DashboardPage,
});

export function DashboardPage() {
  const { habits, completions, idx, streaks, today, isLoading } = useHabitData();
  const goalsQuery = useGoals();
  const profileQuery = useProfile();
  const achQuery = useAchievements();
  const userAchQuery = useUserAchievements();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterToday, setFilterToday] = useState<"all" | "pending" | "completed">("all");

  const profile = profileQuery.data;
  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);
  const achievements = useMemo(() => achQuery.data ?? [], [achQuery.data]);
  const userAchievements = useMemo(() => userAchQuery.data ?? [], [userAchQuery.data]);

  // Active habits list
  const activeHabits = useMemo(() => habits.filter((h) => h.status === "active"), [habits]);

  // Personalized Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = profile?.full_name?.split(" ")[0] || "Builder";
    if (hour < 12) return `Good morning, ${name}.`;
    if (hour < 18) return `Good afternoon, ${name}.`;
    return `Good evening, ${name}.`;
  }, [profile?.full_name]);

  // Current formatted date string
  const formattedToday = useMemo(() => {
    const pattern = profile?.date_format || "EEEE, MMMM d, yyyy";
    try {
      return format(new Date(), pattern);
    } catch {
      return format(new Date(), "EEEE, MMMM d, yyyy");
    }
  }, [profile?.date_format]);

  // Habits scheduled for today
  const todayHabits = useMemo(() => {
    return activeHabits.filter((h) => isScheduled(h as HabitLike, today));
  }, [activeHabits, today]);

  // Filtered today's commitments
  const filteredTodayHabits = useMemo(() => {
    return todayHabits.filter((h) => {
      const rec = idx.get(`${h.id}|${today}`);
      const isDone = rec ? credit(h as HabitLike, rec) >= 1 : false;
      if (filterToday === "pending") return !isDone;
      if (filterToday === "completed") return isDone;
      return true;
    });
  }, [todayHabits, idx, today, filterToday]);

  // Today's completion stats
  const todayStats = useMemo(() => {
    let completed = 0;
    for (const h of todayHabits) {
      const rec = idx.get(`${h.id}|${today}`);
      if (rec && credit(h as HabitLike, rec) >= 1) {
        completed++;
      }
    }
    const total = todayHabits.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const remaining = total - completed;
    return { completed, total, percent, remaining };
  }, [todayHabits, idx, today]);

  // Statistics across real records
  const overallStats = useMemo(() => {
    // Current streak (highest among active habits)
    let maxCurrentStreak = 0;
    let maxLongestStreak = 0;
    for (const h of activeHabits) {
      const s = streaks.get(h.id);
      if (s) {
        if (s.current > maxCurrentStreak) maxCurrentStreak = s.current;
        if (s.longest > maxLongestStreak) maxLongestStreak = s.longest;
      }
    }

    // All-time completed occurrences
    const completedCount = completions.filter((c) => c.completion_status === "completed").length;

    // 30-day consistency score calculated strictly over real eligible occurrences
    const past30 = toKey(subDays(new Date(), 30));
    const scoreResult = consistency(activeHabits as HabitLike[], idx, past30, today, today);

    // This week's consistency
    const weekStartDay = (profile?.week_start ?? 1) as 0 | 1;
    const weekStart = toKey(startOfWeek(new Date(), { weekStartsOn: weekStartDay }));
    const weekEnd = toKey(endOfWeek(new Date(), { weekStartsOn: weekStartDay }));
    const weeklyResult = consistency(activeHabits as HabitLike[], idx, weekStart, weekEnd, today);

    return {
      consistencyScore: scoreResult.score,
      maxCurrentStreak,
      maxLongestStreak,
      completedCount,
      weeklyScore: weeklyResult.score,
      activeHabitsCount: activeHabits.length,
    };
  }, [activeHabits, completions, streaks, idx, today, profile?.week_start]);

  // Weekly Performance Data for Recharts Bar Chart
  const weeklyChartData = useMemo(() => {
    const weekStartDay = (profile?.week_start ?? 1) as 0 | 1;
    const start = startOfWeek(new Date(), { weekStartsOn: weekStartDay });
    const end = endOfWeek(new Date(), { weekStartsOn: weekStartDay });
    const days = eachDayOfInterval({ start, end });

    return days.map((d) => {
      const key = toKey(d);
      const isCurrentDay = key === today;
      const isFuture = key > today;

      let scheduled = 0;
      let earned = 0;
      let minutes = 0;

      for (const h of activeHabits) {
        const c = idx.get(`${h.id}|${key}`);
        if (c) minutes += c.time_spent || 0;
        const st = dayState(h as HabitLike, key, c, today);
        if (st === "unscheduled" || st === "rest") continue;
        if (st === "pending" && isFuture) continue;

        scheduled++;
        earned += credit(h as HabitLike, c);
      }

      const percent = scheduled > 0 ? Math.round((earned / scheduled) * 100) : 0;

      return {
        key,
        day: format(d, "EEE"),
        fullDate: format(d, "MMM d"),
        percent,
        scheduled,
        earned: Math.round(earned * 10) / 10,
        minutes,
        isCurrentDay,
        isFuture,
      };
    });
  }, [activeHabits, idx, today, profile?.week_start]);

  // Compact 8-Week Activity Heatmap Data
  const heatmapData = useMemo(() => {
    const fromDate = toKey(subDays(new Date(), 55)); // ~8 weeks
    return dailyActivity(activeHabits as HabitLike[], idx, fromDate, today, today);
  }, [activeHabits, idx, today]);

  // Recent Activity Feed
  const recentActivities = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      timestamp: Date;
      type: "completion" | "goal" | "achievement";
      icon: typeof Check;
    }> = [];

    // 1. Recent completions
    const sortedCompletions = [...completions]
      .filter((c) => c.completion_status !== "skipped")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const habitsMap = new Map<string, Habit>(habits.map((h) => [h.id, h]));

    for (const c of sortedCompletions) {
      const h = habitsMap.get(c.habit_id);
      if (!h) continue;

      let sub = `Completed on ${format(new Date(c.occurrence_date + "T00:00"), "MMM d")}`;
      if (c.completion_status === "rest") {
        sub = `Scheduled rest day logged (${format(new Date(c.occurrence_date + "T00:00"), "MMM d")})`;
      } else if (h.tracking_type === "time" && c.time_spent > 0) {
        sub = `Invested ${c.time_spent} minutes (${format(new Date(c.occurrence_date + "T00:00"), "MMM d")})`;
      } else if (h.tracking_type === "percentage" && c.progress_value > 0) {
        sub = `Logged progress: ${c.progress_value}/${h.target_value} (${format(new Date(c.occurrence_date + "T00:00"), "MMM d")})`;
      }
      if (c.notes) sub += ` — "${c.notes}"`;

      items.push({
        id: c.id,
        title: h.name,
        subtitle: sub,
        timestamp: new Date(c.created_at),
        type: "completion",
        icon: c.completion_status === "rest" ? Moon : Check,
      });
    }

    // 2. Recent unlocked achievements
    const achMap = new Map(achievements.map((a) => [a.id, a]));
    for (const ua of userAchievements.slice(0, 3)) {
      const a = achMap.get(ua.achievement_id);
      if (a) {
        items.push({
          id: `ua-${ua.id}`,
          title: `Unlocked: ${a.name}`,
          subtitle: a.description,
          timestamp: new Date(ua.unlocked_at),
          type: "achievement",
          icon: Trophy,
        });
      }
    }

    // 3. Active goals
    for (const g of goals.slice(0, 2)) {
      items.push({
        id: `g-${g.id}`,
        title: `Goal: ${g.title}`,
        subtitle: `Progress: ${g.current_progress}/${g.target_value}${g.unit}`,
        timestamp: new Date(g.updated_at),
        type: "goal",
        icon: Target,
      });
    }

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 6);
  }, [completions, habits, achievements, userAchievements, goals]);

  // Active Goals Preview
  const activeGoals = useMemo(() => {
    return goals.filter((g) => g.status === "active").slice(0, 3);
  }, [goals]);

  return (
    <div className="space-y-8">
      {/* 1. Header with Personalized Greeting & Brand Statement */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>{formattedToday}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            {greeting}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            No competition. Just you, chasing the dream you made as a kid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="gold" onClick={() => setDialogOpen(true)} className="shadow-gold">
            <Plus className="mr-2 h-4 w-4" /> Quick Add Habit
          </Button>
        </div>
      </div>

      {/* Zero Habits Empty State Welcome Banner */}
      {habits.length === 0 && !isLoading && (
        <Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-surface to-surface p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Welcome to your personal growth system
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Start with your first non-negotiable commitment.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Consistent people do not wait for motivation. Choose one routine—like morning
                sunlight, 20 pages of reading, or 45 minutes of deep focus—and let the compound
                effect do the rest.
              </p>
            </div>
            <Button
              variant="gold"
              size="lg"
              onClick={() => setDialogOpen(true)}
              className="shadow-gold shrink-0 h-11 px-6 font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> Create First Habit
            </Button>
          </div>
        </Card>
      )}

      {/* 2. Statistic Cards Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Stat
          icon={Sparkles}
          label="Consistency Score"
          value={overallStats.consistencyScore !== null ? `${overallStats.consistencyScore}%` : "—"}
          hint={
            overallStats.consistencyScore !== null
              ? "30-day scheduled adherence"
              : "No eligible occurrences yet"
          }
        />
        <Stat
          icon={CheckCircle2}
          label="Today's Done"
          value={`${todayStats.completed} / ${todayStats.total}`}
          hint={
            todayStats.total > 0 ? `${todayStats.remaining} remaining today` : "No habits scheduled"
          }
        />
        <Stat
          icon={Flame}
          label="Active Streak"
          value={
            overallStats.maxCurrentStreak > 0 ? `${overallStats.maxCurrentStreak} days` : "0 days"
          }
          hint="Top unbroken streak"
        />
        <Stat
          icon={Award}
          label="Personal Best"
          value={
            overallStats.maxLongestStreak > 0 ? `${overallStats.maxLongestStreak} days` : "0 days"
          }
          hint="All-time longest streak"
        />
        <Stat
          icon={Activity}
          label="Active Habits"
          value={overallStats.activeHabitsCount}
          hint="Daily routines configured"
        />
        <Stat
          icon={Trophy}
          label="Total Done"
          value={overallStats.completedCount}
          hint="All-time completed logs"
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (2 Cols): Today's Commitments & Weekly Performance */}
        <div className="space-y-8 lg:col-span-2">
          {/* 3. Today's Commitments Section */}
          <div className="surface-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground sm:text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Today's Non-Negotiables
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {todayStats.total > 0
                    ? `${todayStats.completed} of ${todayStats.total} commitments completed today.`
                    : "No commitments scheduled for today."}
                </p>
              </div>

              {/* Filter Tabs */}
              {todayHabits.length > 0 && (
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 text-xs">
                  {(
                    [
                      ["all", `All (${todayHabits.length})`],
                      ["pending", `Pending (${todayStats.remaining})`],
                      ["completed", `Done (${todayStats.completed})`],
                    ] as const
                  ).map(([tab, label]) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilterToday(tab)}
                      className={cn(
                        "rounded-md px-2.5 py-1 font-medium transition-colors",
                        filterToday === tab
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List of Today's Habits */}
            <div className="mt-4 space-y-3">
              {todayHabits.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {habits.length === 0
                      ? "You have no habits yet."
                      : "No habits scheduled for today."}
                  </p>
                  <p>
                    {habits.length === 0
                      ? "Create your first habit to begin tracking daily commitments."
                      : "Today is a designated rest day or unscheduled day. Enjoy your momentum!"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    className="mt-4 text-xs"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add a habit
                  </Button>
                </div>
              ) : filteredTodayHabits.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {filterToday === "pending"
                      ? "All caught up! Every scheduled habit is completed today. 🎉"
                      : "No completed habits yet for today."}
                  </p>
                </div>
              ) : (
                filteredTodayHabits.map((h) => {
                  const record = idx.get(`${h.id}|${today}`);
                  const streak = streaks.get(h.id)?.current;
                  return (
                    <HabitRow key={h.id} habit={h} date={today} record={record} streak={streak} />
                  );
                })
              )}
            </div>
          </div>

          {/* 5. Weekly Performance (Interactive Recharts Bar Chart) */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Weekly Adherence Performance
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daily completion percentages across the current week.
                </p>
              </div>
              <span className="text-xs font-semibold text-primary">
                Weekly Score:{" "}
                {overallStats.weeklyScore !== null ? `${overallStats.weeklyScore}%` : "—"}
              </span>
            </div>

            <div className="mt-6 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    cursor={{ fill: "oklch(1 0 0 / 4%)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      if (!d) return null;

                      return (
                        <div className="rounded-xl border border-border bg-popover p-3 text-xs shadow-xl space-y-1">
                          <div className="font-semibold text-foreground">
                            {d.day} · {d.fullDate} {d.isCurrentDay && "(Today)"}
                          </div>
                          <div className="text-primary font-mono text-sm">
                            {d.isFuture ? "Pending" : `${d.percent}% Completed`}
                          </div>
                          <div className="text-muted-foreground text-[11px]">
                            {d.earned} of {d.scheduled} commitments met
                          </div>
                          {d.minutes > 0 && (
                            <div className="text-muted-foreground text-[11px]">
                              Time invested: {d.minutes} minutes
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <RechartsBar dataKey="percent" radius={[6, 6, 2, 2]}>
                    {weeklyChartData.map((entry, index) => {
                      const isGold = entry.isCurrentDay || entry.percent >= 80;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.isFuture
                              ? "oklch(0.24 0.006 250)"
                              : entry.percent === 0
                                ? "oklch(0.24 0.006 250)"
                                : isGold
                                  ? "oklch(0.83 0.155 82)"
                                  : "oklch(0.58 0.11 80)"
                          }
                          className="transition-all hover:opacity-80"
                        />
                      );
                    })}
                  </RechartsBar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Daily Progress Ring, Goals Preview, Compact Heatmap, Recent Activity */}
        <div className="space-y-6">
          {/* 4. Daily Progress Ring Card */}
          <div className="surface-card flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Today's Adherence Ring
            </h3>
            <ProgressRing
              value={todayStats.total > 0 ? todayStats.percent : null}
              size={140}
              stroke={10}
              sub={
                todayStats.total > 0
                  ? `${todayStats.completed} of ${todayStats.total} done`
                  : "No scheduled habits"
              }
            />
            <div className="mt-4 text-xs text-muted-foreground">
              {todayStats.total === 0 ? (
                "Take a breath — no commitments today."
              ) : todayStats.remaining === 0 ? (
                <span className="font-semibold text-primary">
                  All commitments satisfied for today! 🎯
                </span>
              ) : (
                <span>
                  <strong className="text-foreground">{todayStats.remaining}</strong> commitment
                  {todayStats.remaining > 1 ? "s" : ""} left to complete today.
                </span>
              )}
            </div>
          </div>

          {/* 7. Active Goals Preview Card */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" /> Active Goals
              </h3>
              <Link to="/goals" className="text-xs text-primary hover:underline flex items-center">
                All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            {activeGoals.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                <p>No active goals defined yet.</p>
                <Link to="/goals" className="mt-2 inline-block text-primary hover:underline">
                  Set a milestone goal &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.map((g) => {
                  const targetNum = Number(g.target_value) || 100;
                  const currentNum = Number(g.current_progress) || 0;
                  const pct = Math.min(100, Math.round((currentNum / targetNum) * 100));

                  return (
                    <div
                      key={g.id}
                      className="space-y-1.5 rounded-lg border border-border/60 bg-card p-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[170px]">
                          {g.title}
                        </span>
                        <span className="font-mono text-primary text-[11px] font-semibold">
                          {pct}%
                        </span>
                      </div>
                      <ProgressBar value={pct} className="h-1.5" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>
                          {currentNum} / {targetNum} {g.unit}
                        </span>
                        {g.target_date && (
                          <span>Due {format(new Date(g.target_date + "T00:00"), "MMM d")}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 8. Compact Recent Activity Heatmap */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" /> 8-Week Rhythm
              </h3>
              <Link
                to="/calendar"
                className="text-xs text-primary hover:underline flex items-center"
              >
                Calendar <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            {/* Heatmap cells */}
            <div className="grid grid-cols-8 gap-1.5 pt-1">
              {heatmapData.map((d) => (
                <HeatCell
                  key={d.date}
                  done={d.done}
                  title={`${d.date}: ${d.done} completed / ${d.scheduled} scheduled (${d.pct}%)`}
                  size="h-3.5 w-full"
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/40">
              <HeatLegend />
              <Link
                to="/calendar"
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                View Details
              </Link>
            </div>
          </div>

          {/* 6. Recent Activity Feed */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" /> Recent Activity
              </h3>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p>No activity recorded yet.</p>
                <p className="mt-1">Log a habit commitment to build your timeline.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-start gap-2.5 text-xs">
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary mt-0.5">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">{item.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {item.subtitle}
                        </div>
                        <div className="text-[10px] text-muted-foreground/70">
                          {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Habit Creation Dialog */}
      <HabitDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

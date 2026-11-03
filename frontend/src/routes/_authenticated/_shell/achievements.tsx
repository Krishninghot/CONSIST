import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Trophy,
  Lock,
  CheckCircle2,
  Sparkles,
  Flame,
  Target,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Card, EmptyState, Bar as ProgressBar } from "@/components/consist/ui";
import { AchIcon } from "@/components/consist/icons";
import { cn } from "@/lib/utils";
import {
  useAchievements,
  useUserAchievements,
  useHabitData,
  useGoals,
  type Achievement,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_shell/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — CONSIST" },
      { name: "description", content: "Your consistency gallery and unlocked milestones." },
      { property: "og:title", content: "Achievements — CONSIST" },
      { property: "og:description", content: "Your consistency gallery and unlocked milestones." },
    ],
  }),
  component: Page,
});

type FilterTab = "all" | "unlocked" | "locked";

function Page() {
  const achQuery = useAchievements();
  const userAchQuery = useUserAchievements();
  const { habits, completions, streaks, isLoading: isHabitLoading } = useHabitData();
  const goalsQuery = useGoals();

  const [filter, setFilter] = useState<FilterTab>("all");

  const achievements = useMemo(() => achQuery.data ?? [], [achQuery.data]);
  const userAchievements = useMemo(() => userAchQuery.data ?? [], [userAchQuery.data]);
  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);

  // Unlocked map: achievement_id -> unlocked_at
  const unlockedMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ua of userAchievements) {
      map.set(ua.achievement_id, ua.unlocked_at);
    }
    return map;
  }, [userAchievements]);

  // Calculated user metrics for progress bars
  const metrics = useMemo(() => {
    const habitsCreated = habits.length;
    const completionsCount = completions.filter((c) => c.completion_status === "completed").length;
    const maxStreak = Math.max(
      0,
      ...[...streaks.values()].map((s) => Math.max(s.longest, s.current)),
    );
    const minutesTotal = completions.reduce((acc, c) => acc + (c.time_spent || 0), 0);
    const goalsCompleted = goals.filter((g) => g.status === "completed").length;

    return {
      habits_created: habitsCreated,
      completions: completionsCount,
      streak: maxStreak,
      minutes: minutesTotal,
      goals_completed: goalsCompleted,
    };
  }, [habits, completions, streaks, goals]);

  // Enhanced achievement items with progress and status
  const items = useMemo(() => {
    return achievements.map((ach) => {
      const isUnlocked = unlockedMap.has(ach.id);
      const unlockedAt = unlockedMap.get(ach.id) ?? null;
      const cond = (ach.unlock_condition as { type: string; value: number } | null) ?? {
        type: "completions",
        value: 1,
      };

      const currentRaw = (metrics as Record<string, number>)[cond.type] ?? 0;
      const current = Math.min(cond.value, currentRaw);
      const target = cond.value;
      const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));

      let progressLabel = `${current} / ${target}`;
      if (cond.type === "minutes") {
        const curHrs = Math.floor(current / 60);
        const curMins = current % 60;
        const tgtHrs = Math.round(target / 60);
        progressLabel = `${curHrs > 0 ? `${curHrs}h ` : ""}${curMins}m / ${tgtHrs}h`;
      } else if (cond.type === "streak") {
        progressLabel = `${current} / ${target} days`;
      } else if (cond.type === "completions") {
        progressLabel = `${current} / ${target} done`;
      } else if (cond.type === "habits_created") {
        progressLabel = `${current} / ${target} habits`;
      } else if (cond.type === "goals_completed") {
        progressLabel = `${current} / ${target} goals`;
      }

      return {
        ...ach,
        isUnlocked,
        unlockedAt,
        cond,
        current,
        target,
        pct: isUnlocked ? 100 : pct,
        progressLabel,
      };
    });
  }, [achievements, unlockedMap, metrics]);

  // Filtering
  const filtered = useMemo(() => {
    if (filter === "unlocked") return items.filter((a) => a.isUnlocked);
    if (filter === "locked") return items.filter((a) => !a.isUnlocked);
    return items;
  }, [items, filter]);

  const unlockedCount = useMemo(() => items.filter((a) => a.isUnlocked).length, [items]);
  const totalCount = items.length;
  const overallPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const isLoading =
    achQuery.isLoading || userAchQuery.isLoading || isHabitLoading || goalsQuery.isLoading;

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
        title="Achievements Gallery"
        subtitle="Permanent trophies honoring your consistency milestones and dedication."
        actions={
          <Link to="/habits">
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" /> Build Habits
            </Button>
          </Link>
        }
      />

      {/* Summary Header Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Trophies Unlocked",
            value: `${unlockedCount} / ${totalCount}`,
            icon: Trophy,
          },
          {
            label: "Completion Rate",
            value: `${overallPct}%`,
            icon: ShieldCheck,
          },
          {
            label: "Longest Streak",
            value: `${metrics.streak}d`,
            icon: Flame,
          },
          {
            label: "Focus Time",
            value:
              metrics.minutes >= 60
                ? `${Math.floor(metrics.minutes / 60)}h ${metrics.minutes % 60}m`
                : `${metrics.minutes}m`,
            icon: Clock,
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
            <div className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-3">
        <div className="flex gap-1">
          {(
            [
              ["all", `All (${totalCount})`],
              ["unlocked", `Unlocked (${unlockedCount})`],
              ["locked", `In Progress (${totalCount - unlockedCount})`],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === tab
                  ? "bg-primary text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={filter === "unlocked" ? "No trophies unlocked yet" : "All trophies unlocked"}
          text={
            filter === "unlocked"
              ? "Complete your daily habits and achieve goals to earn your first trophy."
              : "Incredible dedication! You have conquered every available milestone."
          }
          action={
            <Link to="/habits">
              <Button
                size="sm"
                className="gap-2 bg-gold text-background hover:bg-gold/90 shadow-gold"
              >
                View Today's Habits
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence>
            {filtered.map((item) => {
              const isUnlocked = item.isUnlocked;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={cn(
                      "relative flex flex-col justify-between h-full p-5 overflow-hidden transition-all duration-300",
                      isUnlocked
                        ? "border-primary/40 bg-card hover:border-primary/70 shadow-gold"
                        : "border-border/40 opacity-75 hover:opacity-100",
                    )}
                  >
                    {/* Golden Ambient Glow for Unlocked */}
                    {isUnlocked && (
                      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                    )}

                    <div>
                      {/* Top Row: Icon Badge & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={cn(
                            "grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300",
                            isUnlocked
                              ? "bg-primary/15 text-primary shadow-gold ring-1 ring-primary/30"
                              : "bg-muted text-muted-foreground/60 ring-1 ring-border/50",
                          )}
                        >
                          <AchIcon name={item.icon} className="h-6 w-6" />
                        </div>

                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                            <CheckCircle2 className="h-3 w-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Progress & Unlock Date */}
                    <div className="mt-5 space-y-2 pt-3 border-t border-border/40">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">
                          {isUnlocked ? "Completed" : "Progress"}
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {item.progressLabel}
                        </span>
                      </div>

                      <ProgressBar value={item.pct} />

                      {/* Unlock Date / Remaining */}
                      <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between">
                        {isUnlocked && item.unlockedAt ? (
                          <span className="text-primary font-medium">
                            Unlocked {format(new Date(item.unlockedAt), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span>{item.pct}% toward unlocking</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

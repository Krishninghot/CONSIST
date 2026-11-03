import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, addDays } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  Flame,
  Clock,
  Sparkles,
  MoreVertical,
  Edit2,
  Copy,
  Pause,
  Play,
  Archive,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Percent,
  Calendar,
  AlertTriangle,
  X,
  Layers,
  ArrowUpDown,
  Check,
  Moon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { HabitDialog, CATEGORIES, COLORS } from "@/components/consist/HabitDialog";
import { HabitIcon } from "@/components/consist/icons";
import { PageHeader, EmptyState, Stat, Bar } from "@/components/consist/ui";
import { cn } from "@/lib/utils";
import {
  useHabitData,
  useSaveHabit,
  useDeleteHabit,
  useLog,
  todayKey,
  type Habit,
} from "@/lib/data";
import {
  dayState,
  isScheduled,
  credit,
  consistency,
  toKey,
  type HabitLike,
  type ScheduleConfig,
} from "@/lib/consistency";

export const Route = createFileRoute("/_authenticated/_shell/habits")({
  head: () => ({
    meta: [
      { title: "Habits — CONSIST" },
      { name: "description", content: "Manage, organize and track your daily habits in CONSIST." },
      { property: "og:title", content: "Habits — CONSIST" },
    ],
  }),
  component: HabitsPage,
});

type StatusFilter = "all" | "active" | "paused" | "archived";
type SortOption = "streak-desc" | "name-asc" | "priority-desc" | "created-desc";

function formatSchedule(h: Habit): string {
  const s = (h.schedule_configuration ?? { type: "daily" }) as ScheduleConfig;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let base = "Every day";
  if (s.type === "weekdays") base = "Mon – Fri";
  else if (s.type === "days") {
    const days = (s.days ?? []).map((d) => dayNames[d]).filter(Boolean);
    base = days.length ? days.join(", ") : "Specific days";
  } else if (s.type === "interval") {
    base = `Every ${s.every || 2} days`;
  }

  if (s.rest_days?.length) {
    const rests = s.rest_days.map((d) => dayNames[d]).filter(Boolean);
    if (rests.length) base += ` (Rest: ${rests.join(", ")})`;
  }
  return base;
}

export function HabitsPage() {
  const { habits, completions, idx, streaks, today, isLoading } = useHabitData();
  const saveHabit = useSaveHabit();
  const deleteHabit = useDeleteHabit();
  const logMutation = useLog();

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  // Filters & Controls State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [trackingFilter, setTrackingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("streak-desc");

  // Status Counts
  const counts = useMemo(() => {
    let active = 0,
      paused = 0,
      archived = 0;
    for (const h of habits) {
      if (h.status === "active") active++;
      else if (h.status === "paused") paused++;
      else if (h.status === "archived") archived++;
    }
    return { all: habits.length, active, paused, archived };
  }, [habits]);

  // Overall statistics
  const stats = useMemo(() => {
    const activeHabits = habits.filter((h) => h.status === "active");
    let maxStreak = 0;
    let scheduledTodayCount = 0;
    let doneTodayCount = 0;

    for (const h of activeHabits) {
      const s = streaks.get(h.id);
      if (s && s.current > maxStreak) maxStreak = s.current;

      if (isScheduled(h as HabitLike, today)) {
        scheduledTodayCount++;
        const rec = idx.get(`${h.id}|${today}`);
        if (rec && credit(h as HabitLike, rec) >= 1) {
          doneTodayCount++;
        }
      }
    }

    // 30-day consistency score
    const past30 = toKey(subDays(new Date(), 30));
    const scoreResult = consistency(activeHabits as HabitLike[], idx, past30, today, today);

    return {
      activeCount: activeHabits.length,
      maxStreak,
      scheduledTodayCount,
      doneTodayCount,
      consistencyScore: scoreResult.score,
    };
  }, [habits, streaks, idx, today]);

  // Filtered and Sorted Habits
  const filteredHabits = useMemo(() => {
    return habits
      .filter((h) => {
        // Status filter
        if (statusFilter !== "all" && h.status !== statusFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = h.name.toLowerCase().includes(q);
          const matchDesc = h.description?.toLowerCase().includes(q);
          const matchCat = h.category.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        // Category filter
        if (categoryFilter !== "all" && h.category !== categoryFilter) return false;

        // Priority filter
        if (priorityFilter !== "all" && h.priority !== priorityFilter) return false;

        // Tracking filter
        if (trackingFilter !== "all" && h.tracking_type !== trackingFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "streak-desc") {
          const streakA = streaks.get(a.id)?.current ?? 0;
          const streakB = streaks.get(b.id)?.current ?? 0;
          return streakB - streakA;
        }
        if (sortBy === "name-asc") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "priority-desc") {
          const weight = { high: 3, medium: 2, low: 1 };
          const pA = weight[a.priority as "low" | "medium" | "high"] ?? 0;
          const pB = weight[b.priority as "low" | "medium" | "high"] ?? 0;
          return pB - pA;
        }
        if (sortBy === "created-desc") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
  }, [
    habits,
    statusFilter,
    searchQuery,
    categoryFilter,
    priorityFilter,
    trackingFilter,
    sortBy,
    streaks,
  ]);

  // Quick Action Handlers
  const handleOpenCreate = () => {
    setEditingHabit(null);
    setDialogOpen(true);
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const handleDuplicate = async (habit: Habit) => {
    await saveHabit.mutateAsync({
      name: `${habit.name} (Copy)`,
      description: habit.description,
      category: habit.category,
      icon: habit.icon,
      color: habit.color,
      priority: habit.priority as "low" | "medium" | "high",
      tracking_type: habit.tracking_type as "completion" | "time" | "percentage",
      target_value: Number(habit.target_value),
      start_date: todayKey(),
      end_date: habit.end_date,
      schedule_configuration: habit.schedule_configuration as ScheduleConfig,
      recovery_configuration: habit.recovery_configuration,
      status: "active",
    });
  };

  const handleTogglePause = async (habit: Habit) => {
    const nextStatus = habit.status === "paused" ? "active" : "paused";
    await saveHabit.mutateAsync({
      id: habit.id,
      status: nextStatus,
    });
  };

  const handleToggleArchive = async (habit: Habit) => {
    const nextStatus = habit.status === "archived" ? "active" : "archived";
    await saveHabit.mutateAsync({
      id: habit.id,
      status: nextStatus,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHabit) return;
    await deleteHabit.mutateAsync(deletingHabit.id);
    setDeletingHabit(null);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all" ||
    trackingFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setTrackingFilter("all");
  };

  // Past 7 days keys
  const past7Days = useMemo(() => {
    const keys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      keys.push(toKey(subDays(new Date(), i)));
    }
    return keys;
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="My Habits"
        subtitle="Build, organize, and maintain your non-negotiable daily commitments."
        actions={
          <Button variant="gold" onClick={handleOpenCreate} className="shadow-gold">
            <Plus className="mr-2 h-4 w-4" /> Create Habit
          </Button>
        }
      />

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          icon={CheckCircle2}
          label="Active Habits"
          value={stats.activeCount}
          hint={`${counts.all} total defined`}
        />
        <Stat
          icon={Flame}
          label="Top Active Streak"
          value={stats.maxStreak > 0 ? `${stats.maxStreak} days` : "0 days"}
          hint="Unbroken momentum"
        />
        <Stat
          icon={Clock}
          label="Today's Progress"
          value={`${stats.doneTodayCount} / ${stats.scheduledTodayCount}`}
          hint="Scheduled today"
        />
        <Stat
          icon={Sparkles}
          label="Consistency Score"
          value={stats.consistencyScore !== null ? `${stats.consistencyScore}%` : "—"}
          hint="Last 30 days adherence"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex border-b border-border/80">
        {(
          [
            ["active", `Active (${counts.active})`],
            ["paused", `Paused (${counts.paused})`],
            ["archived", `Archived (${counts.archived})`],
            ["all", `All (${counts.all})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition-colors hover:text-foreground",
              statusFilter === key
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search habits or categories..."
            className="pl-9 bg-card border-border/80 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 min-w-32 bg-card text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 min-w-28 bg-card text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>

          {/* Tracking Filter */}
          <Select value={trackingFilter} onValueChange={setTrackingFilter}>
            <SelectTrigger className="h-9 min-w-28 bg-card text-xs">
              <SelectValue placeholder="Tracking" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracking</SelectItem>
              <SelectItem value="completion">Completion</SelectItem>
              <SelectItem value="time">Time-based</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9 min-w-32 bg-card text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="streak-desc">Highest Streak</SelectItem>
              <SelectItem value="name-asc">Alphabetical (A-Z)</SelectItem>
              <SelectItem value="priority-desc">Priority</SelectItem>
              <SelectItem value="created-desc">Newest First</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Habits List / Grid */}
      {filteredHabits.length === 0 ? (
        hasActiveFilters ? (
          <div className="surface-card p-12 text-center">
            <h3 className="text-base font-semibold">No matching habits found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search terms or filters to locate your habits.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
              Reset Filters
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title={
              statusFilter === "archived"
                ? "No archived habits"
                : statusFilter === "paused"
                  ? "No paused habits"
                  : "Start building your first habit"
            }
            text={
              statusFilter === "archived"
                ? "Habits you archive will appear here."
                : statusFilter === "paused"
                  ? "Habits you temporarily pause will appear here."
                  : "Consistent people do not rely on motivation. They design non-negotiable systems."
            }
            action={
              statusFilter === "active" || statusFilter === "all" ? (
                <Button variant="gold" onClick={handleOpenCreate} className="shadow-gold">
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Habit
                </Button>
              ) : null
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredHabits.map((h) => {
              const streak = streaks.get(h.id);
              const colorInfo = COLORS.find((c) => c.id === h.color) ?? COLORS[0]!;
              const targetNum = Number(h.target_value) || 1;
              const todayRec = idx.get(`${h.id}|${today}`);
              const isTodayDone = todayRec ? credit(h as HabitLike, todayRec) >= 1 : false;

              return (
                <motion.div
                  key={h.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "surface-card flex flex-col justify-between p-5 border transition-all duration-200 hover:border-primary/40",
                    h.status === "paused" && "opacity-80 border-dashed",
                    h.status === "archived" && "opacity-60 grayscale-[40%]",
                  )}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-xl border",
                            colorInfo.border,
                            colorInfo.text,
                            "bg-primary/10",
                          )}
                        >
                          <HabitIcon name={h.icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                            {h.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{h.category}</span>
                            <span>·</span>
                            <span className="capitalize">{h.priority}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-popover">
                          <DropdownMenuItem onClick={() => handleEdit(h)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Habit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(h)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {h.status !== "archived" ? (
                            <DropdownMenuItem onClick={() => handleTogglePause(h)}>
                              {h.status === "paused" ? (
                                <>
                                  <Play className="mr-2 h-4 w-4 text-emerald-400" /> Resume Habit
                                </>
                              ) : (
                                <>
                                  <Pause className="mr-2 h-4 w-4 text-amber-400" /> Pause Habit
                                </>
                              )}
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem onClick={() => handleToggleArchive(h)}>
                            {h.status === "archived" ? (
                              <>
                                <RotateCcw className="mr-2 h-4 w-4" /> Restore Habit
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 h-4 w-4" /> Archive Habit
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingHabit(h)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Habit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {h.description && (
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                        {h.description}
                      </p>
                    )}

                    {/* Metadata Badges */}
                    <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded-md border border-border bg-card px-2 py-0.5 text-muted-foreground">
                        {h.tracking_type === "completion"
                          ? "Simple completion"
                          : h.tracking_type === "time"
                            ? `${targetNum} min/day`
                            : `Target: ${targetNum}`}
                      </span>
                      <span className="rounded-md border border-border bg-card px-2 py-0.5 text-muted-foreground">
                        {formatSchedule(h)}
                      </span>
                      {h.status === "paused" && (
                        <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-400 font-medium">
                          Paused
                        </span>
                      )}
                      {h.status === "archived" && (
                        <span className="rounded-md border border-muted bg-muted px-2 py-0.5 text-muted-foreground">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Streak & Past 7 Days Mini Tracker */}
                  <div className="mt-5 border-t border-border/60 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Flame
                          className={cn(
                            "h-4 w-4",
                            (streak?.current ?? 0) > 0
                              ? "text-primary fill-primary/20"
                              : "text-muted-foreground",
                          )}
                        />
                        <span className="text-xs font-semibold text-foreground">
                          {streak?.current ?? 0}
                          <span className="font-normal text-muted-foreground ml-1">day streak</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Best: {streak?.longest ?? 0}d
                      </span>
                    </div>

                    {/* 7-Day Mini Completion Timeline */}
                    <div className="flex items-center justify-between gap-1">
                      {past7Days.map((dKey) => {
                        const rec = idx.get(`${h.id}|${dKey}`);
                        const st = dayState(h as HabitLike, dKey, rec, today);
                        const isCurrentDay = dKey === today;
                        const dayLabel = format(new Date(dKey + "T00:00"), "EEE");

                        return (
                          <div key={dKey} className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (isCurrentDay) {
                                  if (isTodayDone) {
                                    logMutation.mutate({ habit: h, date: today, status: "clear" });
                                  } else {
                                    logMutation.mutate({
                                      habit: h,
                                      date: today,
                                      status: "completed",
                                      minutes: h.tracking_type === "time" ? targetNum : 0,
                                      progress:
                                        h.tracking_type === "percentage" ? targetNum : undefined,
                                    });
                                  }
                                }
                              }}
                              className={cn(
                                "h-6 w-6 rounded-md grid place-items-center text-[10px] font-mono transition-transform",
                                st === "done" &&
                                  "bg-gold text-primary-foreground font-bold shadow-sm",
                                st === "partial" && "bg-heat-2 text-foreground",
                                st === "rest" &&
                                  "bg-violet-500/20 text-violet-400 border border-violet-500/40",
                                st === "missed" && "bg-destructive/15 text-destructive/80",
                                st === "pending" &&
                                  "border border-dashed border-primary/40 text-muted-foreground",
                                st === "unscheduled" && "bg-card text-muted-foreground/30",
                                isCurrentDay &&
                                  "ring-1 ring-primary ring-offset-1 ring-offset-background hover:scale-110",
                                !isCurrentDay && "cursor-default",
                              )}
                              title={`${dayLabel} (${dKey}): ${st}`}
                            >
                              {st === "done" ? (
                                <Check className="h-3 w-3 stroke-[3]" />
                              ) : st === "rest" ? (
                                <Moon className="h-2.5 w-2.5" />
                              ) : isCurrentDay ? (
                                "•"
                              ) : (
                                ""
                              )}
                            </button>
                            <span className="text-[9px] text-muted-foreground">
                              {dayLabel.slice(0, 1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Habit Create / Edit Dialog */}
      <HabitDialog open={dialogOpen} onOpenChange={setDialogOpen} habit={editingHabit} />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deletingHabit}
        onOpenChange={(o) => {
          if (!o) setDeletingHabit(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Habit
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">"{deletingHabit?.name}"</strong>? This will
              permanently remove the habit and all its logged history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Habit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

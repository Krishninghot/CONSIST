import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  Sparkles,
  Link2,
  Check,
  Pause,
  Play,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { PageHeader, Card, EmptyState, Bar as ProgressBar } from "@/components/consist/ui";
import { HabitIcon } from "@/components/consist/icons";
import { cn } from "@/lib/utils";
import {
  useGoals,
  useGoalHabits,
  useHabitData,
  useSaveGoal,
  useDeleteGoal,
  todayKey,
  type Goal,
  type Habit,
} from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_shell/goals")({
  head: () => ({
    meta: [
      { title: "Goals — CONSIST" },
      { name: "description", content: "Set ambitious targets and track your milestones." },
      { property: "og:title", content: "Goals — CONSIST" },
      { property: "og:description", content: "Set ambitious targets and track your milestones." },
    ],
  }),
  component: Page,
});

/* ── Goal Dialog (Create & Edit) ─────────────────────────── */
interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  linkedHabitIds?: string[];
  habits: Habit[];
}

function GoalDialog({ open, onOpenChange, goal, linkedHabitIds = [], habits }: GoalDialogProps) {
  const saveGoal = useSaveGoal();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [targetValue, setTargetValue] = useState(String(goal?.target_value ?? 100));
  const [unit, setUnit] = useState(goal?.unit ?? "%");
  const [currentProgress, setCurrentProgress] = useState(String(goal?.current_progress ?? 0));
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");
  const [selectedHabits, setSelectedHabits] = useState<string[]>(linkedHabitIds);

  const resetForm = () => {
    setTitle(goal?.title ?? "");
    setDescription(goal?.description ?? "");
    setTargetValue(String(goal?.target_value ?? 100));
    setUnit(goal?.unit ?? "%");
    setCurrentProgress(String(goal?.current_progress ?? 0));
    setTargetDate(goal?.target_date ?? "");
    setSelectedHabits(linkedHabitIds);
  };

  const handleOpenChange = (v: boolean) => {
    if (v) resetForm();
    onOpenChange(v);
  };

  const toggleHabit = (id: string) => {
    setSelectedHabits((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }
    const target = parseFloat(targetValue);
    if (isNaN(target) || target <= 0) {
      toast.error("Target value must be greater than zero");
      return;
    }
    const current = parseFloat(currentProgress) || 0;
    if (current < 0) {
      toast.error("Current progress cannot be negative");
      return;
    }

    const payload = goal
      ? {
          id: goal.id,
          title: title.trim(),
          description: description.trim() || null,
          target_value: target,
          current_progress: current,
          unit: unit.trim() || "%",
          start_date: goal.start_date,
          target_date: targetDate || null,
          status: goal.status ?? (current >= target ? "completed" : "active"),
          completed_at:
            current >= target && !goal.completed_at
              ? new Date().toISOString()
              : (goal.completed_at ?? null),
          habitIds: selectedHabits,
        }
      : {
          title: title.trim(),
          description: description.trim() || null,
          target_value: target,
          current_progress: current,
          unit: unit.trim() || "%",
          start_date: todayKey(),
          target_date: targetDate || null,
          status: current >= target ? "completed" : "active",
          completed_at: current >= target ? new Date().toISOString() : null,
          habitIds: selectedHabits,
        };

    saveGoal.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          <DialogDescription>
            {goal
              ? "Update your measurable ambition and linked daily commitments."
              : "Set a clear, measurable outcome to anchor your daily habits."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Goal Title *</Label>
            <Input
              id="goal-title"
              placeholder="e.g. Master Machine Learning, Run Marathon, Read 24 Books"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-desc">Description</Label>
            <Textarea
              id="goal-desc"
              placeholder="Why does this goal matter to you? What does success look like?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-current">Current</Label>
              <Input
                id="goal-current"
                type="number"
                step="any"
                min="0"
                value={currentProgress}
                onChange={(e) => setCurrentProgress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">Target *</Label>
              <Input
                id="goal-target"
                type="number"
                step="any"
                min="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-unit">Unit</Label>
              <Input
                id="goal-unit"
                placeholder="%, books, hrs"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-date">Target Date (Deadline)</Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* Habit Linking Section */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" />
                Linked Habits
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {selectedHabits.length} linked
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Connect the daily habits that directly build toward this goal.
            </p>

            {habits.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">
                No habits created yet. You can create habits from the Habits page.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-lg border border-border/50 p-2">
                {habits
                  .filter((h) => h.status !== "archived")
                  .map((h) => {
                    const isSelected = selectedHabits.includes(h.id);
                    return (
                      <button
                        type="button"
                        key={h.id}
                        onClick={() => toggleHabit(h.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                          isSelected
                            ? "bg-primary/10 border border-primary/40 text-foreground"
                            : "hover:bg-white/[0.03] text-muted-foreground",
                        )}
                      >
                        <span
                          className="grid h-6 w-6 shrink-0 place-items-center rounded"
                          style={{
                            backgroundColor: `${h.color ?? "#F5BD38"}20`,
                            color: h.color ?? "#F5BD38",
                          }}
                        >
                          <HabitIcon name={h.icon} className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate font-medium flex-1">{h.name}</span>
                        <div
                          className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0",
                            isSelected
                              ? "border-primary bg-primary text-background"
                              : "border-border/60",
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveGoal.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gold text-background hover:bg-gold/90"
              disabled={saveGoal.isPending}
            >
              {saveGoal.isPending ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Progress Update Dialog ──────────────────────────────── */
interface ProgressDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProgressDialog({ goal, open, onOpenChange }: ProgressDialogProps) {
  const saveGoal = useSaveGoal();
  const [val, setVal] = useState(String(goal?.current_progress ?? 0));
  const [note, setNote] = useState("");

  const handleOpenChange = (v: boolean) => {
    if (v && goal) {
      setVal(String(goal.current_progress));
      setNote("");
    }
    onOpenChange(v);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      toast.error("Progress must be a valid non-negative number");
      return;
    }

    const isComplete = num >= goal.target_value;
    const historyEntry = {
      date: todayKey(),
      value: num,
      timestamp: new Date().toISOString(),
      note: note.trim() || undefined,
    };
    const prevHistory = Array.isArray(goal.history) ? goal.history : [];

    saveGoal.mutate(
      {
        id: goal.id,
        current_progress: num,
        status: isComplete && goal.status === "active" ? "completed" : goal.status,
        completed_at:
          isComplete && !goal.completed_at ? new Date().toISOString() : goal.completed_at,
        history: [...prevHistory, historyEntry],
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          if (isComplete && goal.status !== "completed") {
            toast.success(`Goal completed! Congratulations on achieving "${goal.title}"! 🎉`);
          }
        },
      },
    );
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
          <DialogDescription>
            {goal.title} ({goal.target_value} {goal.unit})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="progress-input">Current Value ({goal.unit})</Label>
            <Input
              id="progress-input"
              type="number"
              step="any"
              min="0"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              required
            />
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex gap-2">
            {[1, 5, 10].map((inc) => (
              <Button
                key={inc}
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setVal(String(Math.max(0, (parseFloat(val) || 0) + inc)))}
              >
                +{inc}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="progress-note">Progress Note (Optional)</Label>
            <Input
              id="progress-note"
              placeholder="e.g. Completed module 3, ran 5k"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveGoal.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gold text-background hover:bg-gold/90"
              disabled={saveGoal.isPending}
            >
              {saveGoal.isPending ? "Saving..." : "Save Progress"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page Component ─────────────────────────────────── */
type FilterStatus = "all" | "active" | "completed" | "archived";

function Page() {
  const goalsQuery = useGoals();
  const goalHabitsQuery = useGoalHabits();
  const { habits, isLoading: isHabitsLoading } = useHabitData();
  const saveGoal = useSaveGoal();
  const deleteGoal = useDeleteGoal();

  const [filter, setFilter] = useState<FilterStatus>("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);
  const goalHabits = useMemo(() => goalHabitsQuery.data ?? [], [goalHabitsQuery.data]);

  // Group linked habits by goal_id
  const habitMap = useMemo(() => {
    const m = new Map<string, Habit>();
    habits.forEach((h) => m.set(h.id, h));
    return m;
  }, [habits]);

  const linkedHabitsByGoal = useMemo(() => {
    const map = new Map<string, Habit[]>();
    for (const gh of goalHabits) {
      const h = habitMap.get(gh.habit_id);
      if (h) {
        const arr = map.get(gh.goal_id) ?? [];
        arr.push(h);
        map.set(gh.goal_id, arr);
      }
    }
    return map;
  }, [goalHabits, habitMap]);

  // Filtering
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (filter === "all") return true;
      if (filter === "active") return g.status === "active" || g.status === "paused";
      if (filter === "completed") return g.status === "completed";
      if (filter === "archived") return g.status === "archived";
      return true;
    });
  }, [goals, filter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = goals.length;
    const active = goals.filter((g) => g.status === "active").length;
    const completed = goals.filter((g) => g.status === "completed").length;
    const avgPct =
      total > 0
        ? Math.round(
            goals.reduce(
              (acc, g) =>
                acc + Math.min(100, (g.current_progress / Math.max(1, g.target_value)) * 100),
              0,
            ) / total,
          )
        : 0;
    return { total, active, completed, avgPct };
  }, [goals]);

  const handleToggleComplete = (goal: Goal) => {
    const isNowComplete = goal.status !== "completed";
    saveGoal.mutate({
      id: goal.id,
      status: isNowComplete ? "completed" : "active",
      completed_at: isNowComplete ? new Date().toISOString() : null,
      current_progress: isNowComplete
        ? Math.max(goal.current_progress, goal.target_value)
        : goal.current_progress,
    });
  };

  const handleToggleArchive = (goal: Goal) => {
    const isNowArchived = goal.status !== "archived";
    saveGoal.mutate({
      id: goal.id,
      status: isNowArchived ? "archived" : "active",
    });
  };

  const handleTogglePause = (goal: Goal) => {
    const isNowPaused = goal.status !== "paused";
    saveGoal.mutate({
      id: goal.id,
      status: isNowPaused ? "paused" : "active",
    });
  };

  const isLoading = goalsQuery.isLoading || isHabitsLoading;

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
        title="Goals & Milestones"
        subtitle="Turn lifelong ambitions into measurable targets connected to daily habits."
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="gap-2 bg-gold text-background hover:bg-gold/90 shadow-gold"
          >
            <Plus className="h-4 w-4" />
            Create Goal
          </Button>
        }
      />

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Goals", value: stats.active, icon: Target },
          { label: "Completed", value: stats.completed, icon: CheckCircle2 },
          { label: "Average Progress", value: `${stats.avgPct}%`, icon: TrendingUp },
          { label: "Total Goals", value: stats.total, icon: Sparkles },
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
              ["active", `Active (${stats.active})`],
              ["completed", `Completed (${stats.completed})`],
              ["all", `All (${stats.total})`],
              ["archived", `Archived (${goals.filter((g) => g.status === "archived").length})`],
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

      {/* Goals List / Empty State */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={
            filter === "active"
              ? "No active goals"
              : filter === "completed"
                ? "No completed goals yet"
                : "No goals found"
          }
          text={
            filter === "active"
              ? "Define your personal milestones and track daily progress toward them."
              : "Complete your goals through consistent daily effort."
          }
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="gap-2 bg-gold text-background hover:bg-gold/90 shadow-gold"
            >
              <Plus className="h-4 w-4" />
              Create your first goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredGoals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((goal.current_progress / Math.max(1, goal.target_value)) * 100),
              );
              const linkedHabits = linkedHabitsByGoal.get(goal.id) ?? [];
              const isCompleted = goal.status === "completed";
              const isPaused = goal.status === "paused";
              const isArchived = goal.status === "archived";

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="flex flex-col justify-between h-full p-5 space-y-4">
                    {/* Top row: Status & Actions */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : isPaused
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : isArchived
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-primary/10 text-primary border border-primary/20",
                          )}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Completed
                            </>
                          ) : isPaused ? (
                            <>
                              <Pause className="h-3 w-3" /> Paused
                            </>
                          ) : isArchived ? (
                            <>
                              <Archive className="h-3 w-3" /> Archived
                            </>
                          ) : (
                            <>
                              <Target className="h-3 w-3" /> Active
                            </>
                          )}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingGoal(goal)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit Goal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setProgressGoal(goal)}>
                              <TrendingUp className="mr-2 h-3.5 w-3.5" />
                              Update Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleComplete(goal)}>
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              {isCompleted ? "Reopen Goal" : "Mark as Complete"}
                            </DropdownMenuItem>
                            {!isCompleted && !isArchived && (
                              <DropdownMenuItem onClick={() => handleTogglePause(goal)}>
                                {isPaused ? (
                                  <>
                                    <Play className="mr-2 h-3.5 w-3.5" /> Resume Goal
                                  </>
                                ) : (
                                  <>
                                    <Pause className="mr-2 h-3.5 w-3.5" /> Pause Goal
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleToggleArchive(goal)}>
                              <Archive className="mr-2 h-3.5 w-3.5" />
                              {isArchived ? "Unarchive Goal" : "Archive Goal"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingGoalId(goal.id)}
                              className="text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete Goal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Title & Description */}
                      <h3 className="mt-2 text-base font-semibold leading-snug tracking-tight">
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {goal.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold tabular-nums text-foreground">
                          {goal.current_progress} / {goal.target_value} {goal.unit}
                        </span>
                        <span className="font-semibold tabular-nums text-primary">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} />

                      {/* Dates */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        {goal.target_date ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Target: {format(new Date(goal.target_date + "T00:00"), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span>No deadline set</span>
                        )}
                        {goal.completed_at && (
                          <span className="text-emerald-400">
                            Done {format(new Date(goal.completed_at), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Linked Habits */}
                    {linkedHabits.length > 0 && (
                      <div className="pt-2 border-t border-border/40">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mb-1.5">
                          <Link2 className="h-3 w-3" />
                          <span>Linked Habits ({linkedHabits.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {linkedHabits.map((h) => (
                            <span
                              key={h.id}
                              className="inline-flex items-center gap-1 rounded-md bg-white/[0.03] border border-border/40 px-2 py-0.5 text-[10px] font-medium text-foreground"
                            >
                              <span
                                className="grid h-3.5 w-3.5 place-items-center rounded"
                                style={{ color: h.color ?? "#F5BD38" }}
                              >
                                <HabitIcon name={h.icon} className="h-3 w-3" />
                              </span>
                              <span className="truncate max-w-[100px]">{h.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Footer Action */}
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-1.5"
                        onClick={() => setProgressGoal(goal)}
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        Update Progress
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Goal Create Dialog */}
      <GoalDialog open={createOpen} onOpenChange={setCreateOpen} habits={habits} />

      {/* Goal Edit Dialog */}
      {editingGoal && (
        <GoalDialog
          open={!!editingGoal}
          onOpenChange={(open) => !open && setEditingGoal(null)}
          goal={editingGoal}
          linkedHabitIds={linkedHabitsByGoal.get(editingGoal.id)?.map((h) => h.id) ?? []}
          habits={habits}
        />
      )}

      {/* Progress Update Dialog */}
      <ProgressDialog
        goal={progressGoal}
        open={!!progressGoal}
        onOpenChange={(open) => !open && setProgressGoal(null)}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deletingGoalId}
        onOpenChange={(open) => !open && setDeletingGoalId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All linked progress records will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deletingGoalId) {
                  deleteGoal.mutate(deletingGoalId);
                  setDeletingGoalId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

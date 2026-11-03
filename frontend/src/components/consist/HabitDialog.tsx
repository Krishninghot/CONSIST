import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { todayKey, useSaveHabit, type Habit } from "@/lib/data";
import type { ScheduleConfig, RecoveryConfig } from "@/lib/consistency";
import { HABIT_ICONS, HabitIcon } from "./icons";
import { Sparkles, AlertCircle } from "lucide-react";

export const CATEGORIES = [
  "Education",
  "Fitness",
  "Career",
  "Health",
  "Personal development",
  "Finance",
  "Creativity",
  "Productivity",
  "Technology",
  "Other",
] as const;

export const COLORS = [
  {
    id: "gold",
    label: "Gold",
    bg: "bg-[#F5BD38]",
    text: "text-[#F5BD38]",
    border: "border-[#F5BD38]/40",
  },
  {
    id: "emerald",
    label: "Emerald",
    bg: "bg-emerald-500",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
  },
  {
    id: "cyan",
    label: "Cyan",
    bg: "bg-cyan-500",
    text: "text-cyan-400",
    border: "border-cyan-500/40",
  },
  {
    id: "violet",
    label: "Violet",
    bg: "bg-violet-500",
    text: "text-violet-400",
    border: "border-violet-500/40",
  },
  {
    id: "rose",
    label: "Rose",
    bg: "bg-rose-500",
    text: "text-rose-400",
    border: "border-rose-500/40",
  },
  {
    id: "blue",
    label: "Blue",
    bg: "bg-blue-500",
    text: "text-blue-400",
    border: "border-blue-500/40",
  },
] as const;

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const PRESETS = [
  {
    name: "Deep Work & Writing",
    category: "Career",
    icon: "briefcase",
    tracking: "time" as const,
    target: 90,
    color: "gold",
    scheduleType: "weekdays" as const,
  },
  {
    name: "Read 25 Pages",
    category: "Education",
    icon: "book-open",
    tracking: "percentage" as const,
    target: 25,
    color: "cyan",
    scheduleType: "daily" as const,
  },
  {
    name: "Strength Workout",
    category: "Fitness",
    icon: "dumbbell",
    tracking: "time" as const,
    target: 45,
    color: "emerald",
    scheduleType: "days" as const,
    days: [1, 3, 5],
  },
  {
    name: "Morning Meditation",
    category: "Personal development",
    icon: "sparkles",
    tracking: "completion" as const,
    target: 1,
    color: "violet",
    scheduleType: "daily" as const,
  },
  {
    name: "Drink 3L Water",
    category: "Health",
    icon: "heart",
    tracking: "percentage" as const,
    target: 3000,
    color: "blue",
    scheduleType: "daily" as const,
  },
];

export function HabitDialog({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  habit?: Habit | null;
}) {
  const save = useSaveHabit();
  const [f, setF] = useState(() => init(habit));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setF(init(habit));
      setError(null);
    }
  }, [open, habit]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setF((prev) => ({
      ...prev,
      name: preset.name,
      category: preset.category,
      icon: preset.icon,
      tracking: preset.tracking,
      target: preset.target,
      color: preset.color,
      scheduleType: preset.scheduleType,
      days: preset.days ?? prev.days,
    }));
  };

  const submit = async () => {
    setError(null);
    if (!f.name.trim()) {
      setError("Please provide a name for this habit.");
      return;
    }
    if (f.name.trim().length > 120) {
      setError("Habit name must be 120 characters or less.");
      return;
    }
    if (f.tracking !== "completion" && (isNaN(f.target) || f.target <= 0)) {
      setError("Target value must be a positive number greater than 0.");
      return;
    }
    if (f.end && f.end < f.start) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    const schedule: ScheduleConfig =
      f.scheduleType === "days"
        ? { type: "days", days: f.days, rest_days: f.rest }
        : f.scheduleType === "interval"
          ? { type: "interval", every: f.every, rest_days: f.rest }
          : { type: f.scheduleType, rest_days: f.rest };

    const recovery: RecoveryConfig = {
      mode: f.recovery,
      grace_days: f.recovery === "grace" ? f.grace : 0,
    };

    const habitData = {
      name: f.name.trim(),
      description: f.description.trim() || null,
      category: f.category,
      icon: f.icon,
      color: f.color,
      priority: f.priority,
      tracking_type: f.tracking,
      target_value: f.tracking === "completion" ? 1 : Math.max(1, f.target),
      start_date: f.start,
      end_date: f.end || null,
      schedule_configuration: schedule,
      recovery_configuration: recovery,
      status: f.status,
    };

    try {
      if (habit?.id) {
        await save.mutateAsync({ ...habitData, id: habit.id });
      } else {
        await save.mutateAsync(habitData);
      }
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save habit.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit Habit" : "Create a Habit"}</DialogTitle>
          <DialogDescription>
            {habit
              ? "Modify your habit schedule, target or recovery rules."
              : "Define a daily or recurring commitment to build consistent momentum."}
          </DialogDescription>
        </DialogHeader>

        {/* Quick Presets for New Habits */}
        {!habit && (
          <div className="rounded-xl border border-border/60 bg-surface/50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Quick Presets</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 pt-1">
          {/* Habit Name */}
          <div className="space-y-1.5">
            <Label htmlFor="habit-name">Name *</Label>
            <Input
              id="habit-name"
              value={f.name}
              maxLength={120}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Read 20 pages"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="habit-desc">Why this matters (Description)</Label>
            <Textarea
              id="habit-desc"
              rows={2}
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Why does this habit matter to you? (optional)"
            />
          </div>

          {/* Icon Picker */}
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border rounded-lg bg-surface/30">
              {Object.keys(HABIT_ICONS).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set("icon", k)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg border transition-colors",
                    f.icon === k
                      ? "border-primary bg-primary/20 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card",
                  )}
                  title={k}
                >
                  <HabitIcon name={k} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Theme Color</Label>
              <div className="flex items-center gap-2 pt-1">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set("color", c.id)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform",
                      c.bg,
                      f.color === c.id
                        ? "scale-125 border-foreground ring-2 ring-primary/60"
                        : "border-transparent opacity-80 hover:opacity-100",
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <Field label="Priority">
              <Pick
                value={f.priority}
                onChange={(v) => set("priority", v as "low" | "medium" | "high")}
                items={[
                  ["low", "Low Priority"],
                  ["medium", "Medium Priority"],
                  ["high", "High Priority"],
                ]}
              />
            </Field>
          </div>

          {/* Category & Tracking Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <Pick
                value={f.category}
                onChange={(v) => set("category", v)}
                items={CATEGORIES.map((c) => [c, c])}
              />
            </Field>

            <Field label="Tracking Method">
              <Pick
                value={f.tracking}
                onChange={(v) => set("tracking", v as "completion" | "time" | "percentage")}
                items={[
                  ["completion", "Simple Completion (Yes/No)"],
                  ["time", "Time Investment (Minutes)"],
                  ["percentage", "Quantity / Percentage"],
                ]}
              />
            </Field>
          </div>

          {/* Target Value (if not simple completion) */}
          {f.tracking !== "completion" && (
            <div className="rounded-xl border border-border/70 bg-surface/40 p-3 space-y-1.5">
              <Label htmlFor="habit-target">
                {f.tracking === "time"
                  ? "Target Duration (Minutes per day) *"
                  : "Target Amount / Units *"}
              </Label>
              <Input
                id="habit-target"
                type="number"
                min={1}
                value={f.target}
                onChange={(e) => set("target", Number(e.target.value))}
                placeholder={f.tracking === "time" ? "e.g. 45" : "e.g. 25"}
              />
              <span className="text-[11px] text-muted-foreground">
                {f.tracking === "time"
                  ? "You will be able to log minutes spent each day towards this target."
                  : "Track quantity progress (e.g. 25 pages, 3000 ml water)."}
              </span>
            </div>
          )}

          {/* Schedule Configuration */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-surface/30 p-3.5">
            <Field label="Schedule Type">
              <Pick
                value={f.scheduleType}
                onChange={(v) =>
                  set("scheduleType", v as "daily" | "weekdays" | "days" | "interval")
                }
                items={[
                  ["daily", "Every Day"],
                  ["weekdays", "Weekdays Only (Mon – Fri)"],
                  ["days", "Specific Days of the Week"],
                  ["interval", "Repeating Interval (Every N days)"],
                ]}
              />
            </Field>

            {f.scheduleType === "days" && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">Select Days of the Week</Label>
                <DayPicker value={f.days} onChange={(v) => set("days", v)} />
              </div>
            )}

            {f.scheduleType === "interval" && (
              <Field label="Repeat Every How Many Days?">
                <Input
                  type="number"
                  min={2}
                  max={30}
                  value={f.every}
                  onChange={(e) => set("every", Math.max(1, Number(e.target.value)))}
                />
              </Field>
            )}

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs text-muted-foreground">
                Designated Rest Days (Never break your streak)
              </Label>
              <DayPicker value={f.rest} onChange={(v) => set("rest", v)} />
            </div>
          </div>

          {/* Recovery / Streak Rules & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Streak Recovery Rule">
              <Pick
                value={f.recovery}
                onChange={(v) => set("recovery", v as "strict" | "grace")}
                items={[
                  ["strict", "Strict (1 Miss Resets Streak)"],
                  ["grace", "Grace Recovery (Forgive Misses)"],
                ]}
              />
            </Field>

            {f.recovery === "grace" && (
              <Field label="Grace Days Allowed">
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={f.grace}
                  onChange={(e) => set("grace", Math.max(1, Math.min(7, Number(e.target.value))))}
                />
              </Field>
            )}

            <Field label="Start Date">
              <Input type="date" value={f.start} onChange={(e) => set("start", e.target.value)} />
            </Field>

            <Field label="End Date (Optional)">
              <Input type="date" value={f.end} onChange={(e) => set("end", e.target.value)} />
            </Field>

            {habit && (
              <Field label="Habit Status">
                <Pick
                  value={f.status}
                  onChange={(v) => set("status", v as "active" | "paused" | "archived")}
                  items={[
                    ["active", "Active"],
                    ["paused", "Paused"],
                    ["archived", "Archived"],
                  ]}
                />
              </Field>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="gold"
            disabled={!f.name.trim() || save.isPending}
            onClick={submit}
            className="shadow-gold px-6"
          >
            {save.isPending ? "Saving…" : habit ? "Save Changes" : "Create Habit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function init(h?: Habit | null) {
  const s = (h?.schedule_configuration ?? { type: "daily" }) as ScheduleConfig;
  const r = (h?.recovery_configuration ?? { mode: "strict" }) as RecoveryConfig;
  return {
    name: h?.name ?? "",
    description: h?.description ?? "",
    category: h?.category ?? "Personal development",
    icon: h?.icon ?? "sparkles",
    color: h?.color ?? "gold",
    priority: (h?.priority ?? "medium") as "low" | "medium" | "high",
    tracking: (h?.tracking_type ?? "completion") as "completion" | "time" | "percentage",
    target: Number(h?.target_value ?? 30),
    start: h?.start_date ?? todayKey(),
    end: h?.end_date ?? "",
    scheduleType: (s.type ?? "daily") as "daily" | "weekdays" | "days" | "interval",
    days: s.type === "days" ? (s.days ?? [1, 3, 5]) : [1, 3, 5],
    every: s.type === "interval" ? (s.every ?? 2) : 2,
    rest: s.rest_days ?? [],
    recovery: (r.mode ?? "strict") as "strict" | "grace",
    grace: r.grace_days || 1,
    status: (h?.status ?? "active") as "active" | "paused" | "archived",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Pick({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: (readonly [string, string] | [string, string])[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map(([v, l]) =>
          v ? (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ) : null,
        )}
      </SelectContent>
    </Select>
  );
}

function DayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex gap-1.5">
      {DAYS.map((d, i) => {
        const isSelected = value.includes(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(isSelected ? value.filter((x) => x !== i) : [...value, i])}
            className={cn(
              "h-8 w-8 rounded-lg border text-xs font-medium transition-colors",
              isSelected
                ? "border-primary bg-primary/20 text-primary font-bold shadow-sm"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-card",
            )}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

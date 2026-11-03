import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Flame, Moon, MoreHorizontal, SkipForward, Undo2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLog, type Completion, type Habit } from "@/lib/data";
import { credit, type HabitLike, type CompletionLike } from "@/lib/consistency";
import { HabitIcon } from "./icons";
import { Bar } from "./ui";

/** One-tap / time / percentage tracking row for a given date. */
export function HabitRow({
  habit,
  date,
  record,
  streak,
}: {
  habit: Habit;
  date: string;
  record?: CompletionLike | undefined;
  streak?: number | undefined;
}) {
  const log = useLog();
  const c = credit(habit as HabitLike, record);
  const done = c >= 1;
  const status = record?.completion_status;
  const target = Number(habit.target_value) || 1;
  const [open, setOpen] = useState(false);

  const [amount, setAmount] = useState<number>(() =>
    habit.tracking_type === "time"
      ? (record?.time_spent ?? 0)
      : Number(record?.progress_value ?? 0),
  );
  const [notes, setNotes] = useState<string>(() => record?.notes ?? "");

  useEffect(() => {
    setAmount(
      habit.tracking_type === "time"
        ? (record?.time_spent ?? 0)
        : Number(record?.progress_value ?? 0),
    );
    setNotes(record?.notes ?? "");
  }, [record, habit.tracking_type]);

  const toggle = () => {
    if (done || status === "skipped" || status === "rest") {
      return log.mutate({ habit, date, status: "clear" });
    }
    log.mutate({
      habit,
      date,
      status: "completed",
      minutes: habit.tracking_type === "time" ? target : 0,
      progress: habit.tracking_type === "percentage" ? target : undefined,
    });
  };

  const saveAmount = (newAmount = amount) => {
    const full = newAmount >= target;
    log.mutate({
      habit,
      date,
      status: newAmount <= 0 ? "clear" : full ? "completed" : "partial",
      progress: habit.tracking_type === "percentage" ? newAmount : undefined,
      minutes: habit.tracking_type === "time" ? newAmount : 0,
      notes: notes.trim() || null,
    });
    setOpen(false);
  };

  const adjustAmount = (delta: number) => {
    const next = Math.max(0, amount + delta);
    setAmount(next);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-surface p-3 transition-colors",
        done && "border-primary/25 bg-surface/80",
      )}
    >
      {/* 1-Tap Toggle Button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={toggle}
        disabled={log.isPending}
        aria-label={done ? "Undo" : "Mark complete"}
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all",
          done
            ? "border-transparent bg-gold text-primary-foreground shadow-gold"
            : status === "rest"
              ? "border-border bg-card text-muted-foreground"
              : status === "skipped"
                ? "border-border bg-card text-muted-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-card",
        )}
      >
        {done ? (
          <Check className="h-5 w-5 stroke-[2.5]" />
        ) : status === "rest" ? (
          <Moon className="h-4 w-4" />
        ) : status === "skipped" ? (
          <SkipForward className="h-4 w-4" />
        ) : (
          <HabitIcon name={habit.icon} className="h-4 w-4" />
        )}
      </motion.button>

      {/* Habit Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm font-medium",
              done && "text-muted-foreground line-through decoration-primary/50",
            )}
          >
            {habit.name}
          </span>
          {streak !== undefined && streak > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-primary font-medium">
              <Flame className="h-3 w-3" />
              {streak}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{habit.category}</span>
          {habit.tracking_type !== "completion" && (
            <>
              <span>·</span>
              <span className="font-mono">
                {habit.tracking_type === "time"
                  ? `${record?.time_spent ?? 0}/${target} min`
                  : `${Number(record?.progress_value ?? 0)}/${target}`}
              </span>
              <Bar value={c * 100} className="h-1 max-w-20" />
            </>
          )}
          {status === "rest" && <span className="text-muted-foreground font-medium">Rest day</span>}
          {status === "skipped" && (
            <span className="text-muted-foreground font-medium">Skipped</span>
          )}
          {record?.notes && (
            <span className="truncate max-w-[120px] italic text-[10px] text-muted-foreground/80">
              "{record.notes}"
            </span>
          )}
        </div>
      </div>

      {/* Options & Detailed Tracking Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Tracking options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-72 space-y-3 bg-popover border border-border p-4 shadow-xl"
        >
          <div className="text-xs font-semibold text-foreground border-b pb-2 flex items-center justify-between">
            <span>{habit.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{date}</span>
          </div>

          {/* Amount / Minutes Stepper & Input */}
          {habit.tracking_type !== "completion" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">
                  {habit.tracking_type === "time" ? "Minutes invested" : "Progress quantity"}
                </label>
                <span className="text-xs font-mono text-primary">Target: {target}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-2 text-xs"
                  onClick={() => adjustAmount(habit.tracking_type === "time" ? 15 : 5)}
                >
                  +{habit.tracking_type === "time" ? "15m" : "5"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-2 text-xs"
                  onClick={() => setAmount(target)}
                  title="Fill target"
                >
                  Max
                </Button>
              </div>
            </div>
          )}

          {/* Notes field */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Daily note</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reflections, context, or notes (optional)"
              className="text-xs"
            />
          </div>

          {/* Action buttons */}
          <Button
            variant="gold"
            size="sm"
            className="w-full shadow-gold"
            onClick={() =>
              habit.tracking_type === "completion"
                ? () => {
                    log.mutate({ habit, date, status: "completed", notes: notes.trim() || null });
                    setOpen(false);
                  }
                : saveAmount()
            }
          >
            Save Record
          </Button>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <Button
              variant="soft"
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                log.mutate({ habit, date, status: "skipped", notes: notes.trim() || null });
                setOpen(false);
              }}
            >
              <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip
            </Button>
            <Button
              variant="soft"
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                log.mutate({ habit, date, status: "rest", notes: notes.trim() || null });
                setOpen(false);
              }}
            >
              <Moon className="h-3.5 w-3.5 mr-1" /> Rest
            </Button>
            <Button
              variant="soft"
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                log.mutate({ habit, date, status: "clear" });
                setOpen(false);
              }}
            >
              <Undo2 className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

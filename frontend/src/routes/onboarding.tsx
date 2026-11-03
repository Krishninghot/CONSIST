import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Dumbbell,
  Flame,
  Heart,
  Layers,
  Loader2,
  Moon,
  Palette,
  Percent,
  Plus,
  ShieldAlert,
  Sparkles,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/consist/Logo";
import { ProgressRing, Card, PreviewBadge } from "@/components/consist/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.pathname } });
    }
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Get Started — CONSIST" },
      { name: "description", content: "Personalize your CONSIST experience." },
    ],
  }),
  component: OnboardingPage,
});

const INTERESTS = [
  { id: "Education", label: "Education", icon: BookOpen, desc: "Reading, study, skills" },
  { id: "Fitness", label: "Fitness", icon: Dumbbell, desc: "Strength, cardio, mobility" },
  { id: "Career", label: "Career", icon: Briefcase, desc: "Deep work, projects, mastery" },
  { id: "Health", label: "Health", icon: Heart, desc: "Sleep, nutrition, hydration" },
  {
    id: "Personal development",
    label: "Personal Development",
    icon: Sparkles,
    desc: "Mindset, journaling, discipline",
  },
  { id: "Finance", label: "Finance", icon: DollarSign, desc: "Budgeting, investing, saving" },
  { id: "Creativity", label: "Creativity", icon: Palette, desc: "Writing, art, building" },
  { id: "Productivity", label: "Productivity", icon: Zap, desc: "Planning, daily focus, routines" },
];

const SUGGESTED_GOALS: Record<string, string[]> = {
  Education: ["Read 20 non-fiction books this year", "Study a new discipline 45 min/day"],
  Fitness: ["Workout 4 times every week", "Run a total of 500 km this year"],
  Career: [
    "Complete 90 minutes of distraction-free deep work daily",
    "Ship 1 major personal project per quarter",
  ],
  Health: ["Sleep at least 7.5 hours every night", "Drink 3 liters of water daily"],
  "Personal development": [
    "Maintain an unbroken 30-day journaling streak",
    "Daily morning mindfulness practice",
  ],
  Finance: ["Track daily spending and save 25% of income", "Review investments every Sunday"],
  Creativity: [
    "Write 500 words of creative writing daily",
    "Spend 3 hours weekly practicing a craft",
  ],
  Productivity: [
    "Plan tomorrow's priority tasks every evening",
    "Complete daily top-3 commitments before noon",
  ],
};

const TRACKING_PREFERENCES = [
  {
    id: "completion",
    title: "Simple Completion",
    desc: "Single tap checkmark (Yes / No). Ideal for routines like meditation, cold shower, supplements.",
    icon: CheckCircle2,
    example: "Mark 'Morning Sunlight' as Done",
  },
  {
    id: "time",
    title: "Time Investment",
    desc: "Log minutes invested against a target. Ideal for deep work, reading, workouts, practice.",
    icon: Clock,
    example: "Log 45 min of 'Deep Focus'",
  },
  {
    id: "percentage",
    title: "Quantity & Percentage",
    desc: "Measure numeric units towards a goal. Ideal for water intake (ml), pages read, pushups.",
    icon: Percent,
    example: "Log 25 / 30 pages read",
  },
];

const AVAILABILITY_OPTIONS = [
  {
    id: "15-30m",
    label: "15 – 30 minutes / day",
    sub: "Light, sustainable habits for high-busy schedules",
  },
  {
    id: "30-60m",
    label: "30 – 60 minutes / day",
    sub: "Balanced foundation for steady personal progress",
  },
  {
    id: "1-2h",
    label: "1 – 2 hours / day",
    sub: "Deep commitment to transformation and focused crafts",
  },
  {
    id: "2h+",
    label: "2+ hours / day",
    sub: "Intensive focus mode for dedicated career or fitness milestones",
  },
];

function OnboardingPage() {
  const profileQuery = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const [dateFormat, setDateFormat] = useState("MMM d, yyyy");
  const [weekStart, setWeekStart] = useState<1 | 0>(1); // 1 = Monday, 0 = Sunday
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [trackingPreference, setTrackingPreference] = useState<
    "completion" | "time" | "percentage"
  >("completion");
  const [availability, setAvailability] = useState("30-60m");
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [streakCelebrations, setStreakCelebrations] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  // Prefill profile data if available
  useEffect(() => {
    if (profileQuery.data) {
      if (profileQuery.data.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      if (profileQuery.data.full_name) {
        setFullName(profileQuery.data.full_name);
      }
      if (profileQuery.data.timezone) {
        setTimezone(profileQuery.data.timezone);
      }
      if (profileQuery.data.interests?.length) {
        setSelectedInterests(profileQuery.data.interests);
      }
      if (profileQuery.data.personal_goals?.length) {
        setGoals(profileQuery.data.personal_goals);
      }
    }
  }, [profileQuery.data, navigate]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const addGoal = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !goals.includes(trimmed)) {
      setGoals((prev) => [...prev, trimmed]);
      setCustomGoal("");
    }
  };

  const removeGoal = (index: number) => {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!fullName.trim()) {
        setError("Please enter your name to personalize your experience.");
        return false;
      }
    } else if (currentStep === 2) {
      if (selectedInterests.length === 0) {
        setError("Please select at least one area of interest.");
        return false;
      }
    } else if (currentStep === 3) {
      if (goals.length === 0) {
        setError("Please choose or write at least one personal goal.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 7));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error("Authentication session expired. Please sign in again.");

      const notificationSettings = {
        reminders: remindersEnabled,
        goals: goalAlerts,
        achievements: true,
        streaks: streakCelebrations,
        quiet_start: quietStart,
        quiet_end: quietEnd,
      };

      // 1. Save onboarding preferences record
      const { error: prefErr } = await supabase.from("onboarding_preferences").upsert(
        {
          user_id: user.id,
          interests: selectedInterests,
          personal_goals: goals,
          tracking_preference: trackingPreference,
          available_time: availability,
          reminder_preferences: notificationSettings,
        },
        { onConflict: "user_id" },
      );
      if (prefErr) throw prefErr;

      // 2. Update user profile and mark onboarding_completed: true
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          timezone,
          date_format: dateFormat,
          week_start: weekStart,
          interests: selectedInterests,
          personal_goals: goals,
          notification_settings: notificationSettings,
          onboarding_completed: true,
        })
        .eq("id", user.id);
      if (profErr) throw profErr;

      // Invalidate queries so shell layout updates
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["onboarding"] });

      // Clean redirect to dashboard with genuinely clean slate
      navigate({ to: "/dashboard", replace: true });
    } catch (err: unknown) {
      console.error("Failed to complete onboarding:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save your preferences. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between px-4 py-8 sm:px-8">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />

      {/* Header */}
      <header className="relative mx-auto flex w-full max-w-3xl items-center justify-between pb-6 border-b border-border/40">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">Step {step} of 7</span>
          {/* Progress bar */}
          <div className="h-1.5 w-24 sm:w-32 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Step Content */}
      <main className="relative mx-auto w-full max-w-2xl py-8 flex-1 flex flex-col justify-center">
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step 1
                </span>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Let's set up your profile.</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your identity on CONSIST is personal and private.
                </p>
              </div>

              <div className="space-y-4 surface-card p-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name / Preferred Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maya Chen"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="e.g. America/New_York"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select
                      id="dateFormat"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="MMM d, yyyy">MMM d, yyyy (Jan 15, 2026)</option>
                      <option value="yyyy-MM-dd">yyyy-MM-dd (2026-01-15)</option>
                      <option value="dd/MM/yyyy">dd/MM/yyyy (15/01/2026)</option>
                      <option value="MM/dd/yyyy">MM/dd/yyyy (01/15/2026)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Week Starts On</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWeekStart(1)}
                      className={cn(
                        "rounded-lg border p-3 text-left text-sm transition-colors",
                        weekStart === 1
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      Monday (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeekStart(0)}
                      className={cn(
                        "rounded-lg border p-3 text-left text-sm transition-colors",
                        weekStart === 0
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      Sunday
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Interests */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step 2
                </span>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  What areas do you want to build?
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select the key focus areas for your habits and commitments.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INTERESTS.map(({ id, label, icon: Icon, desc }) => {
                  const selected = selectedInterests.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleInterest(id)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/50"
                          : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                          selected
                            ? "bg-gold text-primary-foreground"
                            : "bg-surface text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          {selected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Personal Goals */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step 3
                </span>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  What are your personal goals?
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose suggested milestones based on your interests or type your own custom
                  targets.
                </p>
              </div>

              {/* Active Goals List */}
              <div className="surface-card p-5 space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Your Selected Goals
                </Label>
                {goals.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No goals added yet. Pick from below or type a goal.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {goals.map((g, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-surface px-3 py-2 text-sm"
                      >
                        <span className="text-foreground">{g}</span>
                        <button
                          type="button"
                          onClick={() => removeGoal(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Goal Input */}
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Input
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="e.g. Meditate for 10 min daily"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addGoal(customGoal);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() => addGoal(customGoal)}
                    disabled={!customGoal.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Suggestions based on interests */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Suggestions you might like:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedInterests
                    .flatMap((int) => SUGGESTED_GOALS[int] || [])
                    .map((sugg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => addGoal(sugg)}
                        disabled={goals.includes(sugg)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                          goals.includes(sugg)
                            ? "border-primary/40 bg-primary/10 text-primary opacity-60 cursor-default"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        + {sugg}
                      </button>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Tracking Preference */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step 4
                </span>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">How do you prefer to track?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select your default tracking style. You can also customize this per-habit later.
                </p>
              </div>

              <div className="space-y-3">
                {TRACKING_PREFERENCES.map(({ id, title, desc, icon: Icon, example }) => {
                  const selected = trackingPreference === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTrackingPreference(id as typeof trackingPreference)}
                      className={cn(
                        "flex w-full items-start gap-4 rounded-xl border p-5 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/50"
                          : "border-border/80 bg-card hover:border-primary/40",
                      )}
                    >
                      <div
                        className={cn(
                          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                          selected
                            ? "bg-gold text-primary-foreground shadow-gold"
                            : "bg-surface text-muted-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold text-foreground">{title}</span>
                          {selected && <Check className="h-5 w-5 text-primary" />}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        <div className="mt-2 text-[11px] text-primary/80 font-mono">
                          Example: {example}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 5: Daily Availability */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step 5
                </span>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  What is your daily availability?
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Setting realistic time bounds prevents burnout and ensures consistent long-term
                  execution.
                </p>
              </div>

              <div className="space-y-3">
                {AVAILABILITY_OPTIONS.map(({ id, label, sub }) => {
                  const selected = availability === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAvailability(id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/50"
                          : "border-border/80 bg-card hover:border-primary/40",
                      )}
                    >
                      <div>
                        <div className="text-sm font-semibold text-foreground">{label}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
                      </div>
                      {selected && <Check className="h-5 w-5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 6: Reminder Preferences */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step 6
                </span>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Configure your quiet hours & alerts.
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stay accountable without annoying interruptions.
                </p>
              </div>

              <div className="surface-card p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Daily Commitment Reminders
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Gentle reminder at midday if scheduled habits remain open
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(e) => setRemindersEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Streak Milestone Celebrations
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Notify when you reach 7, 30, and 100 days of consistency
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={streakCelebrations}
                    onChange={(e) => setStreakCelebrations(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Goal Deadline Warnings
                    </div>
                    <div className="text-xs text-muted-foreground">
                      3-day warning when a milestone target date approaches
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={goalAlerts}
                    onChange={(e) => setGoalAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <div className="text-sm font-medium text-foreground">Quiet Hours Window</div>
                  <div className="text-xs text-muted-foreground">
                    No alerts will trigger during this time window
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start Time</Label>
                      <Input
                        type="time"
                        value={quietStart}
                        onChange={(e) => setQuietStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End Time</Label>
                      <Input
                        type="time"
                        value={quietEnd}
                        onChange={(e) => setQuietEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 7: Sample Dashboard Preview */}
          {step === 7 && (
            <motion.div
              key="step-7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step 7
                </span>
                <div className="flex items-center gap-3">
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    Your CONSIST Experience Preview
                  </h1>
                  <PreviewBadge />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Here is what your personal dashboard will look like. Your account will start
                  completely clean.
                </p>
              </div>

              {/* Sample Dashboard Preview Card */}
              <div className="surface-card p-6 space-y-6 border-primary/30">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{fullName || "Your Name"}</h3>
                    <p className="text-xs text-muted-foreground">
                      Focus: {selectedInterests.slice(0, 3).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium">
                      <Flame className="h-3 w-3" /> Ready to Start
                    </span>
                  </div>
                </div>

                {/* Consistency Score Simulation */}
                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 rounded-xl border border-border/60 bg-surface/50 p-4">
                  <div className="text-center sm:text-left">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Starting Metric
                    </div>
                    <div className="text-xl font-bold mt-1 text-foreground">
                      Day 1 of Consistency
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      100% adherence starts with your first action today.
                    </p>
                  </div>
                  <ProgressRing value={100} size={90} stroke={7} />
                </div>

                {/* Sample Habit Rows */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sample Daily Agenda Preview
                  </span>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {selectedInterests.includes("Education")
                            ? "Read 20 pages"
                            : "Daily Mindset Focus"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Daily Habit · Scheduled for Today
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Tap to log</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-muted-foreground">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {selectedInterests.includes("Fitness")
                            ? "Physical Movement & Strength"
                            : "Hydration & Health"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Flexible Grace-Day Mode Enabled
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Pending</span>
                  </div>
                </div>

                <div className="rounded-lg border border-border/40 bg-surface/60 p-3 text-xs text-muted-foreground">
                  <strong className="text-foreground">Clean Account Guarantee:</strong> No fake
                  habits or sample metrics will be saved. When you enter, you will create your real
                  non-negotiable commitments.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Footer Controls */}
      <footer className="relative mx-auto flex w-full max-w-2xl items-center justify-between pt-6 border-t border-border/40">
        {step > 1 ? (
          <Button variant="ghost" onClick={handleBack} disabled={submitting}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        ) : (
          <div />
        )}

        {step < 7 ? (
          <Button variant="gold" onClick={handleNext}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="gold"
            onClick={handleFinish}
            disabled={submitting}
            className="shadow-gold px-6"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...
              </>
            ) : (
              <>
                Launch My Dashboard <Sparkles className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </footer>
    </div>
  );
}

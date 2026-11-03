import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Flame,
  ShieldCheck,
  Sparkles,
  Zap,
  Clock,
  Target,
  Trophy,
  ChevronRight,
  Heart,
  Layers,
  CalendarDays,
  LineChart,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/consist/Logo";
import { ProgressRing, Stat } from "@/components/consist/ui";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

export function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSignedIn(true);
    });
  }, []);

  const targetAuth = signedIn ? "/dashboard" : "/auth";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background ambient lighting and grid */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-75" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 md:flex text-sm text-muted-foreground">
            <a href="#preview" className="transition-colors hover:text-foreground">
              Preview
            </a>
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#philosophy" className="transition-colors hover:text-foreground">
              Philosophy
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link to={targetAuth}>{signedIn ? "Dashboard" : "Sign In"}</Link>
            </Button>
            <Button variant="gold" size="sm" asChild className="font-medium shadow-gold">
              <Link to={targetAuth}>Start Your Journey</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 text-center sm:px-8 md:pt-28 md:pb-24">
        <div className="mx-auto max-w-4xl">
          {/* Brand Philosophy Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary sm:text-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            No competition. Just you, chasing the dream you made as a kid.
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:leading-[1.1]"
          >
            Build a life you are <br className="hidden sm:inline" />
            <span className="text-gold">consistent with.</span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl leading-relaxed"
          >
            Create better habits, track your daily commitments, visualize your progress and turn
            your ambitions into meaningful personal growth.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              variant="gold"
              size="lg"
              asChild
              className="h-12 px-8 text-base font-semibold shadow-gold transition-all duration-300 hover:scale-[1.02]"
            >
              <Link to={targetAuth}>
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-12 border-border/80 px-8 text-base text-foreground transition-all duration-300 hover:bg-surface hover:text-foreground"
            >
              <a href="#preview">Explore CONSIST</a>
            </Button>
          </motion.div>

          {/* Highlights Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>100% Private & User-Owned</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Grace-Day Recovery System</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Zero Comparison Pressure</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="preview" className="relative px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="relative rounded-2xl border border-border/70 bg-surface/90 p-3 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-primary/20 via-transparent to-transparent opacity-50 blur-sm" />

            {/* Mock Dashboard Header */}
            <div className="relative mb-6 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Today's Focus
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">Good morning, builder.</h2>
                <p className="text-xs text-muted-foreground">
                  4 of 5 commitments completed today · Keep the momentum going.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Flame className="h-3.5 w-3.5" /> 28-day streak
                </span>
                <span className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                  Consistency Score: <strong className="text-foreground">94%</strong>
                </span>
              </div>
            </div>

            {/* Dashboard Widgets Grid */}
            <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: Habits Agenda */}
              <div className="space-y-3 lg:col-span-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Today's Commitments
                </h3>

                {/* Mock Habit 1 */}
                <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-card p-3.5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-primary-foreground shadow-gold">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium line-through text-muted-foreground">
                        Deep Work & Focused Writing
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Career · 90/90 min completed
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                    <Flame className="h-3.5 w-3.5" /> 28
                  </span>
                </div>

                {/* Mock Habit 2 */}
                <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-card p-3.5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-primary-foreground shadow-gold">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium line-through text-muted-foreground">
                        Morning Sunlight & Mobility
                      </div>
                      <div className="text-[11px] text-muted-foreground">Health · Daily habit</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                    <Flame className="h-3.5 w-3.5" /> 42
                  </span>
                </div>

                {/* Mock Habit 3 */}
                <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-card p-3.5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-primary-foreground shadow-gold">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium line-through text-muted-foreground">
                        Read 25 Pages of Non-Fiction
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Education · 25/25 pages
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                    <Flame className="h-3.5 w-3.5" /> 19
                  </span>
                </div>

                {/* Mock Habit 4 - In Progress */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Strength Workout</div>
                      <div className="text-[11px] text-muted-foreground">Fitness · 35/45 min</div>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-mono">In progress</span>
                </div>

                {/* Mock Habit 5 - Rest Day */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 opacity-75">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Cold Immersion
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Scheduled Rest Day · Streak preserved
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Rest</span>
                </div>
              </div>

              {/* Right Column: Consistency Ring & Heatmap Preview */}
              <div className="flex flex-col gap-4">
                <div className="surface-card flex flex-col items-center justify-center p-6 text-center">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    30-Day Consistency Score
                  </h4>
                  <div className="mt-4">
                    <ProgressRing
                      value={94}
                      size={130}
                      stroke={10}
                      sub="Scheduled occurrences kept"
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Rest days & unscheduled dates do not penalize your score.
                  </p>
                </div>

                <div className="surface-card p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Activity Rhythm
                    </h4>
                    <span className="text-[11px] text-primary">Last 8 Weeks</span>
                  </div>
                  {/* Heatmap mockup cells */}
                  <div className="mt-3 grid grid-cols-8 gap-1.5">
                    {Array.from({ length: 40 }).map((_, i) => {
                      const heatLevel =
                        i % 7 === 0
                          ? "bg-heat-1"
                          : i % 5 === 0
                            ? "bg-heat-2"
                            : i % 3 === 0
                              ? "bg-heat-4"
                              : "bg-heat-3";
                      return (
                        <div
                          key={i}
                          className={`h-4 w-full rounded-[3px] transition-transform hover:scale-125 ${heatLevel}`}
                          title={`Day ${i + 1}`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Low activity</span>
                    <span className="text-primary font-medium">Consistent daily execution</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles & Philosophy */}
      <section id="philosophy" className="px-4 py-20 sm:px-8 border-t border-border/40">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            The CONSIST Philosophy
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Forget social pressure. <br />
            <span className="text-gold">Focus on your personal compound growth.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Most habit trackers turn self-improvement into a vanity metric contest. CONSIST is
            private, grounded in honest mathematics, and built for people who want results instead
            of dopamine hits.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
            <div className="surface-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">100% Private</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                No public leaderboards. No social feeds. No peer judgment. Your ambitions and daily
                efforts belong solely to you.
              </p>
            </div>

            <div className="surface-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Grace-Day Recovery</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Life isn't a straight line. Configure grace periods so an unavoidable emergency
                won't erase 6 months of genuine hard work.
              </p>
            </div>

            <div className="surface-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Honest Mathematics</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Consistency score measures your adherence strictly over scheduled occurrences. Rest
                days are respected, not penalized.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section id="features" className="px-4 py-20 sm:px-8 bg-surface/40 border-t border-border/40">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Capabilities
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Engineered for real-world commitments.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Feature 1 */}
            <div className="surface-card flex flex-col justify-between p-8">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">Three Distinct Tracking Modes</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Every habit requires a different metric. Track simple binary completions (yes/no),
                  investment of time in minutes (deep work, meditation), or target amounts and
                  percentages (hydration, pages, savings).
                </p>
              </div>
              <div className="mt-6 rounded-lg border border-border/60 bg-card p-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Reading: Deep Work (Target: 60 min)</span>
                  <span className="text-primary font-medium">45 / 60 min (75%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: "75%" }} />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="surface-card flex flex-col justify-between p-8">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">Flexible Schedule Architecture</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Define daily habits, weekday routines, specific day selections, or interval
                  occurrences (e.g. every 2 days). Mark scheduled rest days so your recovery is
                  intentional.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                {["Every Day", "Weekdays", "Mon · Wed · Fri", "Every 2 Days", "Weekend Rest"].map(
                  (s) => (
                    <span
                      key={s}
                      className="rounded-md border border-border bg-card px-2.5 py-1 text-muted-foreground"
                    >
                      {s}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* Feature 3 */}
            <div className="surface-card flex flex-col justify-between p-8">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <LineChart className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">Long-Term Analytics & Trends</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Gain deep visibility into your performance. Spot which days of the week have your
                  highest completion rates, see cumulative hours invested in your craft, and track
                  your streak longevity.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-around border-t border-border/60 pt-4 text-center">
                <div>
                  <div className="text-lg font-bold text-foreground">142</div>
                  <div className="text-[11px] text-muted-foreground">Completions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-primary">48.5h</div>
                  <div className="text-[11px] text-muted-foreground">Time Invested</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">94%</div>
                  <div className="text-[11px] text-muted-foreground">Consistency</div>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="surface-card flex flex-col justify-between p-8">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">Meaningful Milestone Achievements</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Unlock achievements tied directly to genuine milestones: First Step, Seven Strong,
                  Unbroken Month, Deep Work 10 Hours, and Centurion (100 commitments completed).
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                  <Flame className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Seven Strong</div>
                  <div className="text-muted-foreground">Reached a 7-day streak on your habits</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How CONSIST Works */}
      <section id="how-it-works" className="px-4 py-20 sm:px-8 border-t border-border/40">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Simple Framework
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              How CONSIST works.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              A frictionless 3-step loop designed to turn daily intention into lasting automatic
              discipline.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="relative surface-card p-6">
              <span className="text-4xl font-extrabold text-primary/20">01</span>
              <h3 className="mt-3 text-lg font-semibold">Define Commitments</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Set up habits in categories that matter to you. Pick flexible schedules, rest days,
                and recovery modes.
              </p>
            </div>

            <div className="relative surface-card p-6">
              <span className="text-4xl font-extrabold text-primary/20">02</span>
              <h3 className="mt-3 text-lg font-semibold">Show Up & Log</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Single tap to mark complete, log minutes, record partial progress, or schedule
                intentional rest without friction.
              </p>
            </div>

            <div className="relative surface-card p-6">
              <span className="text-4xl font-extrabold text-primary/20">03</span>
              <h3 className="mt-3 text-lg font-semibold">Watch It Compound</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Track your consistency score, build unbroken streaks, unlock achievements, and watch
                personal growth compound.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative px-4 py-24 sm:px-8 border-t border-border/40 overflow-hidden text-center">
        <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80" />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Start today
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Ready to chase the dream you made as a kid?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            No algorithm. No likes. No competition. Just you, showing up every day for the life you
            promised yourself.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              variant="gold"
              size="lg"
              asChild
              className="h-12 px-9 text-base font-semibold shadow-gold transition-all duration-300 hover:scale-[1.02]"
            >
              <Link to={targetAuth}>
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-border/40 bg-surface/50 py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Logo />
            <span className="hidden sm:inline text-border">|</span>
            <span>No competition. Just you, chasing the dream you made as a kid.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#preview" className="hover:text-foreground transition-colors">
              Preview
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#philosophy" className="hover:text-foreground transition-colors">
              Philosophy
            </a>
            <Link to={targetAuth} className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
          <div>© {new Date().getFullYear()} CONSIST. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

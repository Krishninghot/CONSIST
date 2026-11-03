import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  User,
  Camera,
  Mail,
  Calendar,
  Sparkles,
  Flame,
  CheckCircle2,
  TrendingUp,
  Tag,
  Target,
  Plus,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader, Card, Stat } from "@/components/consist/ui";
import { cn } from "@/lib/utils";
import {
  useProfile,
  useUser,
  useUpdateProfile,
  useHabitData,
  todayKey,
  type Profile,
} from "@/lib/data";
import { consistency, toKey } from "@/lib/consistency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { subDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/_shell/profile")({
  head: () => ({
    meta: [
      { title: "Profile — CONSIST" },
      { name: "description", content: "Your personal CONSIST profile and identity." },
      { property: "og:title", content: "Profile — CONSIST" },
      { property: "og:description", content: "Your personal CONSIST profile and identity." },
    ],
  }),
  component: Page,
});

const SUGGESTED_INTERESTS = [
  "Fitness",
  "Coding",
  "Reading",
  "Writing",
  "Meditation",
  "Languages",
  "Deep Work",
  "Nutrition",
  "Music",
  "Design",
];

const SUGGESTED_GOALS = [
  "Run a half marathon",
  "Read 24 books this year",
  "Learn a new language",
  "Build a profitable SaaS",
  "100 days of consistency",
  "Wake up at 6 AM daily",
];

function Page() {
  const userQuery = useUser();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const { habits, completions, idx, today, isLoading: isHabitLoading } = useHabitData();

  const user = userQuery.data;
  const profile = profileQuery.data;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [personalGoals, setPersonalGoals] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Synchronize state once profile loads
  if (profile && !isInitialized) {
    setFullName(profile.full_name ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setInterests(profile.interests ?? []);
    setPersonalGoals(profile.personal_goals ?? []);
    setIsInitialized(true);
  }

  // Active Habits & Completions calculation
  const activeHabits = useMemo(() => habits.filter((h) => h.status === "active"), [habits]);
  const totalCompletions = useMemo(
    () => completions.filter((c) => c.completion_status === "completed").length,
    [completions],
  );

  // Consistency Score (last 30 days)
  const consistencyScore = useMemo(() => {
    const thirtyDaysAgo = toKey(subDays(new Date(), 29));
    const res = consistency(habits, idx, thirtyDaysAgo, today, today);
    return res.score;
  }, [habits, idx, today]);

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, or WebP)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Fallback to base64 data url for seamless local/preview support
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setAvatarUrl(result);
          updateProfile.mutate({ avatar_url: result });
          toast.success("Profile photo updated");
        };
        reader.readAsDataURL(file);
      } else {
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        setAvatarUrl(data.publicUrl);
        updateProfile.mutate({ avatar_url: data.publicUrl });
        toast.success("Profile photo updated");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload photo";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleAddInterest = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (interests.includes(trimmed)) {
      toast.info("Interest already added");
      return;
    }
    setInterests([...interests, trimmed]);
    setNewInterest("");
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter((i) => i !== item));
  };

  const handleAddGoal = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (personalGoals.includes(trimmed)) {
      toast.info("Goal already added");
      return;
    }
    setPersonalGoals([...personalGoals, trimmed]);
    setNewGoal("");
  };

  const handleRemoveGoal = (item: string) => {
    setPersonalGoals(personalGoals.filter((g) => g !== item));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl || null,
        interests,
        personal_goals: personalGoals,
      },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
        },
      },
    );
  };

  const isLoading = profileQuery.isLoading || userQuery.isLoading || isHabitLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const joinDate = user?.created_at
    ? format(new Date(user.created_at), "MMMM yyyy")
    : profile?.created_at
      ? format(new Date(profile.created_at), "MMMM yyyy")
      : "Recently";

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Personal Profile"
        subtitle="Manage your personal identity, core interests, and lifelong ambitions."
      />

      {/* Hero Profile Card */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Upload Action */}
          <div className="relative group shrink-0">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 border-primary/30 ring-4 ring-background shadow-xl">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {fullName ? fullName.slice(0, 2).toUpperCase() : "CO"}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs gap-1"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  <span>Change</span>
                </>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {fullName || "Consistent Builder"}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email ?? "Signed In User"}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {joinDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Member
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-1 max-w-xl">
              "No competition. Just you, chasing the dream you made as a kid."
            </p>
          </div>
        </div>
      </Card>

      {/* Consistency Metrics Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Consistency Score
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-primary">
            {consistencyScore !== null ? `${consistencyScore}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Last 30 days overall performance</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Active Habits
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Flame className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{activeHabits.length}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Daily commitments in motion</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Completions
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{totalCompletions}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Milestones logged all-time</p>
        </Card>
      </div>

      {/* Profile Form */}
      <Card className="p-6">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Account Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email ?? ""}
                  disabled
                  className="opacity-70 cursor-not-allowed bg-muted/40"
                />
              </div>
            </div>
          </div>

          {/* Interests Section */}
          <div className="space-y-3 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <Tag className="h-4 w-4 text-primary" />
                  Personal Interests
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select or add the core areas of your personal and professional focus.
                </p>
              </div>
            </div>

            {/* Current Tags */}
            <div className="flex flex-wrap gap-2 min-h-8">
              {interests.length === 0 ? (
                <span className="text-xs italic text-muted-foreground">
                  No interests added yet.
                </span>
              ) : (
                interests.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-border/60 px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(item)}
                      className="hover:text-red-400 transition-colors"
                      aria-label={`Remove ${item}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Interest Input */}
            <div className="flex gap-2 max-w-md">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInterest(newInterest);
                  }
                }}
                placeholder="Type an interest (e.g. Chess, Running)..."
                className="h-9 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddInterest(newInterest)}
                disabled={!newInterest.trim()}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>

            {/* Suggested Chips */}
            <div className="pt-1">
              <span className="text-[11px] text-muted-foreground mr-2 font-medium">
                Suggestions:
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {SUGGESTED_INTERESTS.filter((s) => !interests.includes(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddInterest(s)}
                    className="rounded-full bg-white/[0.02] border border-border/40 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Goals Section */}
          <div className="space-y-3 pt-4 border-t border-border/40">
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Target className="h-4 w-4 text-primary" />
                Lifelong Ambitions & Dreams
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                The big-picture aspirations you are working toward.
              </p>
            </div>

            {/* Current Goals */}
            <div className="flex flex-wrap gap-2 min-h-8">
              {personalGoals.length === 0 ? (
                <span className="text-xs italic text-muted-foreground">
                  No personal goals added yet.
                </span>
              ) : (
                personalGoals.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {g}
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(g)}
                      className="hover:text-red-400 text-muted-foreground transition-colors"
                      aria-label={`Remove ${g}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Goal Input */}
            <div className="flex gap-2 max-w-md">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddGoal(newGoal);
                  }
                }}
                placeholder="Type an ambition (e.g. Master AI)..."
                className="h-9 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddGoal(newGoal)}
                disabled={!newGoal.trim()}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>

            {/* Suggested Goals */}
            <div className="pt-1">
              <span className="text-[11px] text-muted-foreground mr-2 font-medium">
                Suggestions:
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {SUGGESTED_GOALS.filter((s) => !personalGoals.includes(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddGoal(s)}
                    className="rounded-full bg-white/[0.02] border border-border/40 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/40">
            <Button
              type="submit"
              className="gap-2 bg-gold text-background hover:bg-gold/90 shadow-gold"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

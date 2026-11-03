import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Globe,
  Shield,
  LogOut,
  Trash2,
  Moon,
  AlertTriangle,
  Download,
  Save,
  Check,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PageHeader, Card } from "@/components/consist/ui";
import { cn } from "@/lib/utils";
import {
  useProfile,
  useUser,
  useUpdateProfile,
  useHabitData,
  useGoals,
  useAchievements,
  useUserAchievements,
  type NotificationSettings,
} from "@/lib/data";
import { useSignOut } from "./route";
import { deleteAccount } from "@/lib/account.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CONSIST" },
      { name: "description", content: "Manage your account, preferences, and privacy." },
      { property: "og:title", content: "Settings — CONSIST" },
      { property: "og:description", content: "Manage your account, preferences, and privacy." },
    ],
  }),
  component: Page,
});

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function Page() {
  const profileQuery = useProfile();
  const userQuery = useUser();
  const updateProfile = useUpdateProfile();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const profile = profileQuery.data;
  const user = userQuery.data;

  const { habits, completions } = useHabitData();
  const goalsQuery = useGoals();
  const achQuery = useAchievements();
  const userAchQuery = useUserAchievements();

  // Settings State
  const [activeTab, setActiveTab] = useState<"notifications" | "regional" | "account" | "privacy">(
    "notifications",
  );

  // Notification Preferences
  const existingNotes = (profile?.notification_settings ?? {}) as NotificationSettings;
  const [reminders, setReminders] = useState(existingNotes.reminders !== false);
  const [goalReminders, setGoalReminders] = useState(existingNotes.goals !== false);
  const [achievements, setAchievements] = useState(existingNotes.achievements !== false);
  const [streaks, setStreaks] = useState(existingNotes.streaks !== false);

  // Quiet hours
  const quiet = existingNotes.quiet_hours ?? {};
  const [quietEnabled, setQuietEnabled] = useState(quiet.enabled ?? false);
  const [quietStart, setQuietStart] = useState(quiet.start ?? "22:00");
  const [quietEnd, setQuietEnd] = useState(quiet.end ?? "08:00");

  // Regional Preferences
  const [timezone, setTimezone] = useState(profile?.timezone ?? "UTC");
  const [dateFormat, setDateFormat] = useState(profile?.date_format ?? "yyyy-MM-dd");
  const [weekStart, setWeekStart] = useState(String(profile?.week_start ?? 1));

  // Danger Zone
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Save Notifications
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: NotificationSettings = {
      reminders,
      goals: goalReminders,
      achievements,
      streaks,
      quiet_hours: {
        enabled: quietEnabled,
        start: quietStart,
        end: quietEnd,
      },
    };

    updateProfile.mutate(
      {
        notification_settings: updatedSettings,
      },
      {
        onSuccess: () => {
          toast.success("Notification preferences saved");
        },
      },
    );
  };

  // Save Regional
  const handleSaveRegional = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        timezone,
        date_format: dateFormat,
        week_start: parseInt(weekStart, 10),
      },
      {
        onSuccess: () => {
          toast.success("Regional preferences saved");
        },
      },
    );
  };

  // Export JSON snapshot
  const handleExportData = () => {
    setIsExporting(true);
    try {
      const exportObject = {
        exportedAt: new Date().toISOString(),
        profile: profile ?? null,
        habits: habits ?? [],
        completions: completions ?? [],
        goals: goalsQuery.data ?? [],
        achievements: userAchQuery.data ?? [],
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportObject, null, 2),
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `consist-backup-${new Date().toISOString().split("T")[0]}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Data export downloaded successfully");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  // Permanent Account Deletion
  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Your account and all associated data have been permanently deleted");
      await signOut();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      toast.error(msg);
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  const isLoading = profileQuery.isLoading || userQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Manage notifications, regional preferences, and security settings."
      />

      {/* Settings Navigation Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-3 overflow-x-auto">
        {[
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "regional", label: "Regional & Format", icon: Globe },
          { id: "privacy", label: "Privacy & Data", icon: Shield },
          { id: "account", label: "Account", icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-background shadow-gold"
                  : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── NOTIFICATIONS TAB ──────────────────────────────────── */}
      {activeTab === "notifications" && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold">In-App Notification Alerts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose which in-app updates, streaks, and milestone reminders you want to receive.
            </p>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-6">
            <div className="space-y-4 divide-y divide-border/40">
              {/* Daily Habit Reminders */}
              <div className="flex items-center justify-between pt-3 first:pt-0">
                <div className="space-y-0.5">
                  <Label htmlFor="reminders" className="text-sm font-medium">
                    Daily Habit Commitments
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Afternoon alerts when scheduled commitments remain incomplete.
                  </p>
                </div>
                <Switch id="reminders" checked={reminders} onCheckedChange={setReminders} />
              </div>

              {/* Goal Deadlines */}
              <div className="flex items-center justify-between pt-3">
                <div className="space-y-0.5">
                  <Label htmlFor="goals" className="text-sm font-medium">
                    Goal Deadlines
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Alerts when an active goal target deadline is within 3 days.
                  </p>
                </div>
                <Switch id="goals" checked={goalReminders} onCheckedChange={setGoalReminders} />
              </div>

              {/* Achievement Unlocks */}
              <div className="flex items-center justify-between pt-3">
                <div className="space-y-0.5">
                  <Label htmlFor="achievements" className="text-sm font-medium">
                    Achievement Trophies
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications whenever you conquer a new consistency milestone.
                  </p>
                </div>
                <Switch
                  id="achievements"
                  checked={achievements}
                  onCheckedChange={setAchievements}
                />
              </div>

              {/* Streak Milestones */}
              <div className="flex items-center justify-between pt-3">
                <div className="space-y-0.5">
                  <Label htmlFor="streaks" className="text-sm font-medium">
                    Streak Milestones
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Celebrate 7-day, 30-day, and 100-day unbroken streaks.
                  </p>
                </div>
                <Switch id="streaks" checked={streaks} onCheckedChange={setStreaks} />
              </div>
            </div>

            {/* Quiet Hours Section */}
            <div className="pt-4 border-t border-border/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Moon className="h-4 w-4 text-primary" />
                    Quiet Hours
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mute habit reminders during focus or sleep periods.
                  </p>
                </div>
                <Switch checked={quietEnabled} onCheckedChange={setQuietEnabled} />
              </div>

              {quietEnabled && (
                <div className="grid grid-cols-2 gap-4 max-w-sm pl-6 border-l-2 border-primary/40">
                  <div className="space-y-1.5">
                    <Label htmlFor="quiet-start" className="text-xs text-muted-foreground">
                      Start Time
                    </Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quiet-end" className="text-xs text-muted-foreground">
                      End Time
                    </Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* In-app note */}
            <div className="rounded-lg border border-border/50 bg-white/[0.02] p-3 text-xs text-muted-foreground">
              <p className="leading-relaxed">
                <span className="text-foreground font-medium">In-app notifications:</span> All
                alerts are stored securely in your in-app notification center. No external email or
                browser push tokens are required.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="gap-2 bg-gold text-background hover:bg-gold/90 shadow-gold"
                disabled={updateProfile.isPending}
              >
                <Save className="h-4 w-4" /> Save Preferences
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── REGIONAL & FORMAT TAB ──────────────────────────────── */}
      {activeTab === "regional" && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold">Regional & Calendar Preferences</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize how dates, weeks, and time calculations are presented.
            </p>
          </div>

          <form onSubmit={handleSaveRegional} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Timezone */}
              <div className="space-y-1.5">
                <Label htmlFor="tz-select">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="tz-select" className="w-full">
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Used for day boundary transitions and scheduling.
                </p>
              </div>

              {/* Date Format */}
              <div className="space-y-1.5">
                <Label htmlFor="date-format-select">Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger id="date-format-select" className="w-full">
                    <SelectValue placeholder="Select Date Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (2026-11-03)</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (11/03/2026)</SelectItem>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (03/11/2026)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Controls formatting across calendar and charts.
                </p>
              </div>

              {/* Week Start */}
              <div className="space-y-1.5">
                <Label htmlFor="week-start-select">Week Starts On</Label>
                <Select value={weekStart} onValueChange={setWeekStart}>
                  <SelectTrigger id="week-start-select" className="w-full">
                    <SelectValue placeholder="Select First Day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday (Standard)</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Defines the start of the week for weekly analytics charts.
                </p>
              </div>

              {/* Theme Note */}
              <div className="space-y-1.5">
                <Label>Theme</Label>
                <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <Moon className="h-4 w-4 text-primary" />
                  <span>Obsidian Dark Mode (Permanent)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  CONSIST is designed exclusively in refined obsidian and gold.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="gap-2 bg-gold text-background hover:bg-gold/90 shadow-gold"
                disabled={updateProfile.isPending}
              >
                <Save className="h-4 w-4" /> Save Regional Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── PRIVACY & DATA TAB ─────────────────────────────────── */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">Data Isolation & Security</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              CONSIST uses strict Supabase Row-Level Security (RLS) on all database tables. Your
              habits, daily logs, goals, and achievements belong exclusively to your authenticated
              user UUID. No other user or outside client has access to your tracking records.
            </p>

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={isExporting}
                className="gap-2 text-xs"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export All My Data (JSON)
              </Button>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/30 p-6 space-y-4 bg-red-500/[0.02]">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-semibold text-foreground">Danger Zone</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently delete your account and all associated habits, daily completions, goals,
              achievements, and personal profiles. This action is irreversible.
            </p>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirmDeleteText("");
                setDeleteOpen(true);
              }}
              className="gap-2 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Account
            </Button>
          </Card>
        </div>
      )}

      {/* ── ACCOUNT TAB ────────────────────────────────────────── */}
      {activeTab === "account" && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold">Account Overview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review your authentication identity and session controls.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-border/40">
            <div className="flex items-center justify-between pt-2 first:pt-0">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Email Address</span>
                <p className="text-sm font-semibold">{user?.email ?? "Not signed in"}</p>
              </div>
              <Link to="/profile">
                <Button variant="outline" size="sm" className="text-xs">
                  Edit Profile
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs text-muted-foreground font-medium">User ID</span>
                <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px] sm:max-w-md">
                  {user?.id ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Session Control</span>
                <p className="text-xs text-muted-foreground">Sign out of this browser session.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="gap-1.5 text-xs text-red-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Account Deletion Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                This will immediately purge all your habits, daily completion history, streaks,
                goals, and unlocked achievements.
              </p>
              <p className="font-semibold text-foreground">
                To confirm, type <span className="text-red-400">DELETE</span> below:
              </p>
              <Input
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="DELETE"
                className="font-mono text-xs uppercase"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={confirmDeleteText !== "DELETE" || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Deleting...
                </>
              ) : (
                "Permanently Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

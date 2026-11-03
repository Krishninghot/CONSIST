import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CalendarDays,
  ChevronsLeft,
  Flame,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  Target,
  Trophy,
  Trash2,
  User,
  CheckCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/consist/Logo";
import { cn } from "@/lib/utils";
import { useEngine, useNotificationActions, useNotifications, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_shell")({ component: Shell });

const MAIN = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/habits", label: "My Habits", icon: ListChecks },
  { to: "/calendar", label: "Activity Calendar", icon: CalendarDays },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/analytics", label: "Analytics", icon: LineChart },
] as const;
const PERSONAL = [
  { to: "/achievements", label: "Achievements", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem("consist:demo-mode");
    }
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function Shell() {
  const profile = useProfile();
  const navigate = useNavigate();
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEngine();

  useEffect(() => {
    if (profile.data && !profile.data.onboarding_completed)
      navigate({ to: "/onboarding", replace: true });
  }, [profile.data, navigate]);
  useEffect(() => setMobile(false), [loc.pathname]);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar transition-[width] duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <NavContent collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-3 flex items-center justify-center gap-2 rounded-lg border p-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <NavContent collapsed={false} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobile(true)}
              aria-label="Open menu"
            >
              <Menu />
            </Button>
            <span className="lg:hidden">
              <Logo collapsed />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <ProfileMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={loc.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function NavContent({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-3">
      <Link to="/dashboard" className="mb-6 flex h-12 items-center px-2">
        <Logo collapsed={collapsed} />
      </Link>
      <NavGroup title="Main" items={MAIN} collapsed={collapsed} />
      <NavGroup title="Personal" items={PERSONAL} collapsed={collapsed} />
      {!collapsed && (
        <div className="mt-auto rounded-xl border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          <span className="text-gold font-semibold">No competition.</span> Just you, chasing the
          dream you made as a kid.
        </div>
      )}
    </div>
  );
}

function NavGroup({
  title,
  items,
  collapsed,
}: {
  title: string;
  items: readonly { to: string; label: string; icon: typeof Bell }[];
  collapsed: boolean;
}) {
  return (
    <div className="mb-5">
      {!collapsed && (
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          {title}
        </div>
      )}
      <nav className="space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            title={label}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
            activeProps={{
              className:
                "bg-sidebar-accent !text-foreground [&_svg]:text-primary before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-primary",
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function NotificationCenter() {
  const { data = [] } = useNotifications();
  const { markRead, remove } = useNotificationActions();
  const [catFilter, setCatFilter] = useState<string>("all");
  const unread = data.filter((n) => !n.read_status).length;

  const filtered = useMemo(() => {
    if (catFilter === "all") return data;
    return data.filter((n) => n.notification_type === catFilter);
  }, [data, catFilter]);

  const getIcon = (type: string) => {
    switch (type) {
      case "streak":
        return <Flame className="h-3.5 w-3.5 text-amber-400" />;
      case "achievement":
        return <Trophy className="h-3.5 w-3.5 text-primary" />;
      case "goal":
        return <Target className="h-3.5 w-3.5 text-emerald-400" />;
      case "reminder":
      default:
        return <Bell className="h-3.5 w-3.5 text-blue-400" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-84 sm:w-96 bg-popover p-0 shadow-2xl border-border/60"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {unread} new
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={() => markRead.mutate("all")}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 border-b border-border/40 px-3 py-1.5 overflow-x-auto">
          {(
            [
              ["all", "All"],
              ["reminder", "Reminders"],
              ["streak", "Streaks"],
              ["achievement", "Trophies"],
              ["goal", "Goals"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setCatFilter(id)}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap",
                catFilter === id
                  ? "bg-primary text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border/30">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-muted-foreground">
              {catFilter === "all" ? "You're all caught up." : "No notifications in this category."}
            </p>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read_status && markRead.mutate(n.id)}
                className={cn(
                  "group flex cursor-pointer gap-3 px-4 py-3 hover:bg-accent/50 transition-colors",
                  !n.read_status && "bg-primary/[0.04]",
                )}
              >
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.04]">
                  {getIcon(n.notification_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold truncate text-foreground">
                      {n.title}
                    </span>
                    {!n.read_status && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {n.message}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove.mutate(n.id);
                  }}
                  className="opacity-0 transition-opacity group-hover:opacity-100 p-1 hover:text-red-400 self-center"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProfileMenu() {
  const { data } = useProfile();
  const signOut = useSignOut();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-primary focus-visible:ring-2">
        <Avatar className="h-9 w-9 border">
          <AvatarImage src={data?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-card text-xs">
            {(data?.full_name ?? "?").slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover">
        <div className="px-2 py-1.5 text-sm font-medium">{data?.full_name ?? "You"}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { heatLevel } from "@/lib/consistency";

export function Card({
  className,
  children,
  hover,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "surface-card p-5",
        hover && "transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toFixed(decimals) + suffix);
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.9, ease: "easeOut" });
    return c.stop;
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 9,
  label,
  sub,
}: {
  value: number | null;
  size?: number;
  stroke?: number;
  label?: ReactNode;
  sub?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`rg${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--primary-glow)" />
            <stop offset="1" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--muted)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#rg${size})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (v / 100) * c }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold tabular-nums">
          {label ?? (value === null ? "—" : <CountUp value={v} suffix="%" />)}
        </span>
        {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <motion.div
        className="h-full rounded-full bg-gold"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Card hover>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-6 py-14 text-center">
      <div className="pointer-events-none absolute inset-0 grid-lines" />
      <div className="relative mb-4 grid h-14 w-14 place-items-center rounded-2xl border bg-card text-primary shadow-gold">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="relative text-base font-semibold">{title}</h3>
      <p className="relative mt-1.5 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

const heatClass = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];
export function HeatCell({
  done,
  title,
  onClick,
  size = "h-3 w-3",
  selected,
}: {
  done: number;
  title?: string | undefined;
  onClick?: (() => void) | undefined;
  size?: string | undefined;
  selected?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        size,
        "rounded-[3px] transition-transform hover:scale-125",
        heatClass[heatLevel(done)],
        selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        !onClick && "cursor-default",
      )}
    />
  );
}
export function HeatLegend() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      Less{" "}
      {heatClass.map((c) => (
        <span key={c} className={cn("h-3 w-3 rounded-[3px]", c)} />
      ))}{" "}
      More
    </div>
  );
}

export function PreviewBadge() {
  return (
    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
      Preview data
    </span>
  );
}

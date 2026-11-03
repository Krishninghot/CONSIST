import { cn } from "@/lib/utils";

/** CONSIST mark: three ascending arcs forming a continuous forward path. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden>
      <defs>
        <linearGradient id="cg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--primary-glow)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--card)" stroke="var(--border)" />
      <path
        d="M8 22 A8 8 0 0 1 16 14"
        stroke="url(#cg)"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M11 22 A5 5 0 0 1 16 17 L19 17 A5 5 0 0 0 24 12"
        stroke="url(#cg)"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="24" cy="9" r="2" fill="var(--primary)" />
    </svg>
  );
}

export function Logo({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-[0.28em] text-foreground">CONSIST</span>
      )}
    </span>
  );
}

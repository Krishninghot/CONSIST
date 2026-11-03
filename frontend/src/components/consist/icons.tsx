import {
  BookOpen,
  Brain,
  Code2,
  Dumbbell,
  Droplets,
  Flame,
  Heart,
  Hourglass,
  Layers,
  Moon,
  Mountain,
  Music,
  Palette,
  PenLine,
  PiggyBank,
  Sparkles,
  Sprout,
  Sun,
  Target,
  Trophy,
  Zap,
  Footprints,
  Languages,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export const HABIT_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  book: BookOpen,
  brain: Brain,
  code: Code2,
  dumbbell: Dumbbell,
  water: Droplets,
  heart: Heart,
  moon: Moon,
  sun: Sun,
  music: Music,
  palette: Palette,
  pen: PenLine,
  money: PiggyBank,
  walk: Footprints,
  lang: Languages,
  work: Briefcase,
};
export const ACH_ICONS: Record<string, LucideIcon> = {
  sprout: Sprout,
  zap: Zap,
  flame: Flame,
  mountain: Mountain,
  trophy: Trophy,
  target: Target,
  hourglass: Hourglass,
  layers: Layers,
};

export function HabitIcon({ name, className }: { name: string; className?: string }) {
  const I = HABIT_ICONS[name] ?? Sparkles;
  return <I className={className} />;
}
export function AchIcon({ name, className }: { name: string; className?: string }) {
  const I = ACH_ICONS[name] ?? Trophy;
  return <I className={className} />;
}

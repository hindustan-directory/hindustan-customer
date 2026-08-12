export type Accent = {
  bar: string;
  surface: string;
  avatar: string;
  avatarText: string;
  pill: string;
  pillText: string;
  icon: string;
  iconWrap: string;
};

export const ACCENTS: Accent[] = [
  {
    bar: "bg-brand-500",
    surface: "bg-brand-50",
    avatar: "bg-brand-100",
    avatarText: "text-brand-800",
    pill: "bg-brand-100",
    pillText: "text-brand-800",
    icon: "#2563EB",
    iconWrap: "bg-brand-100",
  },
  {
    bar: "bg-indigo-500",
    surface: "bg-indigo-50",
    avatar: "bg-indigo-100",
    avatarText: "text-indigo-800",
    pill: "bg-indigo-100",
    pillText: "text-indigo-800",
    icon: "#4F46E5",
    iconWrap: "bg-indigo-100",
  },
  {
    bar: "bg-violet-500",
    surface: "bg-violet-50",
    avatar: "bg-violet-100",
    avatarText: "text-violet-800",
    pill: "bg-violet-100",
    pillText: "text-violet-800",
    icon: "#7C3AED",
    iconWrap: "bg-violet-100",
  },
  {
    bar: "bg-fuchsia-500",
    surface: "bg-fuchsia-50",
    avatar: "bg-fuchsia-100",
    avatarText: "text-fuchsia-800",
    pill: "bg-fuchsia-100",
    pillText: "text-fuchsia-800",
    icon: "#C026D3",
    iconWrap: "bg-fuchsia-100",
  },
  {
    bar: "bg-teal-500",
    surface: "bg-teal-50",
    avatar: "bg-teal-100",
    avatarText: "text-teal-800",
    pill: "bg-teal-100",
    pillText: "text-teal-800",
    icon: "#0D9488",
    iconWrap: "bg-teal-100",
  },
  {
    bar: "bg-emerald-500",
    surface: "bg-emerald-50",
    avatar: "bg-emerald-100",
    avatarText: "text-emerald-800",
    pill: "bg-emerald-100",
    pillText: "text-emerald-800",
    icon: "#059669",
    iconWrap: "bg-emerald-100",
  },
  {
    bar: "bg-cyan-500",
    surface: "bg-cyan-50",
    avatar: "bg-cyan-100",
    avatarText: "text-cyan-800",
    pill: "bg-cyan-100",
    pillText: "text-cyan-800",
    icon: "#0891B2",
    iconWrap: "bg-cyan-100",
  },
  {
    bar: "bg-sky-500",
    surface: "bg-sky-50",
    avatar: "bg-sky-100",
    avatarText: "text-sky-800",
    pill: "bg-sky-100",
    pillText: "text-sky-800",
    icon: "#0284C7",
    iconWrap: "bg-sky-100",
  },
  {
    bar: "bg-amber-500",
    surface: "bg-amber-50",
    avatar: "bg-amber-100",
    avatarText: "text-amber-900",
    pill: "bg-amber-100",
    pillText: "text-amber-900",
    icon: "#D97706",
    iconWrap: "bg-amber-100",
  },
  {
    bar: "bg-orange-500",
    surface: "bg-orange-50",
    avatar: "bg-orange-100",
    avatarText: "text-orange-900",
    pill: "bg-orange-100",
    pillText: "text-orange-900",
    icon: "#EA580C",
    iconWrap: "bg-orange-100",
  },
  {
    bar: "bg-lime-500",
    surface: "bg-lime-50",
    avatar: "bg-lime-100",
    avatarText: "text-lime-800",
    pill: "bg-lime-100",
    pillText: "text-lime-800",
    icon: "#65A30D",
    iconWrap: "bg-lime-100",
  },
  {
    bar: "bg-pink-500",
    surface: "bg-pink-50",
    avatar: "bg-pink-100",
    avatarText: "text-pink-800",
    pill: "bg-pink-100",
    pillText: "text-pink-800",
    icon: "#DB2777",
    iconWrap: "bg-pink-100",
  },
];

export function accentFor(key: string): Accent {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCENTS[Math.abs(hash) % ACCENTS.length]!;
}

export function initial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export type BadgeKey =
  | "none"
  | "first_container"
  | "active_collector"
  | "eco_leader"
  | "regional_example"
  | "national_example";

export type Badge = {
  key: BadgeKey;
  min: number;
  label: string;
  tone: string;
};

export const badges: Badge[] = [
  { key: "none", min: 0, label: "Hali nishon yo'q", tone: "bg-slate-100 text-slate-700" },
  { key: "first_container", min: 1, label: "Birinchi konteyner", tone: "bg-[var(--brand-mint)] text-[var(--brand-deep)]" },
  { key: "active_collector", min: 3, label: "Faol yig'uvchi", tone: "bg-emerald-100 text-emerald-800" },
  { key: "eco_leader", min: 10, label: "Eko yetakchi", tone: "bg-[var(--brand-primary)] text-white" },
  { key: "regional_example", min: 25, label: "Hududiy namuna", tone: "bg-[var(--brand-warm)] text-[#4a3510]" },
  { key: "national_example", min: 50, label: "Milliy namuna", tone: "bg-[#18392b] text-white" },
];

export function getBadgeForContainers(totalContainers: number) {
  return [...badges].reverse().find((badge) => totalContainers >= badge.min) ?? badges[0];
}

export function getNextBadgeProgress(totalContainers: number) {
  const next = badges.find((badge) => badge.min > totalContainers);

  if (!next) {
    return {
      next: null,
      remaining: 0,
      text: "Eng yuqori nishon qo'lga kiritilgan.",
    };
  }

  const remaining = next.min - totalContainers;
  return {
    next,
    remaining,
    text: `${next.label} uchun yana ${remaining} ta tasdiqlangan konteyner kerak.`,
  };
}

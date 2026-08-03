export const CATEGORIES = [
  "Pain relief",
  "Antibiotics",
  "Cold & flu",
  "Allergy",
  "Digestive",
  "Vitamins",
  "First aid",
  "Skin",
  "Eye & ear",
  "Chronic care",
  "Children",
  "Other",
] as const;

export const UNITS = ["tablets", "capsules", "ml", "sachets", "drops", "units"] as const;

export const FREQUENCIES = [
  "As needed",
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Weekly",
] as const;

export const STORAGE_OPTIONS = [
  "Room temperature",
  "Cool & dry place",
  "Refrigerate 2–8°C",
  "Away from sunlight",
  "Keep out of reach of children",
] as const;

export const MEMBER_COLORS = ["sage", "olive", "forest", "amber", "clay"] as const;
export type MemberColor = (typeof MEMBER_COLORS)[number];

export const memberSwatch: Record<string, string> = {
  sage: "bg-secondary text-secondary-foreground",
  olive: "bg-accent text-accent-foreground",
  forest: "bg-primary text-primary-foreground",
  amber: "bg-warning text-warning-foreground",
  clay: "bg-destructive text-destructive-foreground",
};

export type ExpiryLevel = "expired" | "critical" | "soon" | "watch" | "fresh";

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysUntil(dateStr: string) {
  const [y = 1970, m = 1, d = 1] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - startOfToday().getTime()) / 86400000);
}

export function expiryLevel(dateStr: string): ExpiryLevel {
  const d = daysUntil(dateStr);
  if (d < 0) return "expired";
  if (d <= 7) return "critical";
  if (d <= 30) return "soon";
  if (d <= 90) return "watch";
  return "fresh";
}

export const levelMeta: Record<
  ExpiryLevel,
  { label: string; dot: string; chip: string; text: string }
> = {
  expired: {
    label: "Expired",
    dot: "bg-destructive",
    chip: "bg-destructive/10 text-destructive",
    text: "text-destructive",
  },
  critical: {
    label: "Expiring now",
    dot: "bg-destructive",
    chip: "bg-destructive/10 text-destructive",
    text: "text-destructive",
  },
  soon: {
    label: "Expiring soon",
    dot: "bg-warning",
    chip: "bg-warning/15 text-warning",
    text: "text-warning",
  },
  watch: {
    label: "Keep an eye",
    dot: "bg-accent",
    chip: "bg-accent/12 text-accent",
    text: "text-accent",
  },
  fresh: {
    label: "Good",
    dot: "bg-success",
    chip: "bg-success/12 text-success",
    text: "text-success",
  },
};

export function expiryPhrase(dateStr: string) {
  const d = daysUntil(dateStr);
  if (d < -1) return `Expired ${Math.abs(d)} days ago`;
  if (d === -1) return "Expired yesterday";
  if (d === 0) return "Expires today";
  if (d === 1) return "Expires tomorrow";
  if (d < 45) return `${d} days left`;
  if (d < 365) return `${Math.round(d / 30)} months left`;
  return `${(d / 365).toFixed(1)} years left`;
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const [y = 1970, m = 1, d = 1] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function toISODate(date: Date) {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** 0–100 score describing how healthy the whole cabinet is. */
export function cabinetScore(meds: { expiry_date: string; quantity: number; low_threshold: number }[]) {
  if (meds.length === 0) return 100;
  let penalty = 0;
  for (const m of meds) {
    const level = expiryLevel(m.expiry_date);
    if (level === "expired") penalty += 100;
    else if (level === "critical") penalty += 55;
    else if (level === "soon") penalty += 25;
    else if (level === "watch") penalty += 6;
    if (m.quantity <= m.low_threshold) penalty += 12;
  }
  return Math.max(0, Math.round(100 - penalty / meds.length));
}

export function scoreWord(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Healthy";
  if (score >= 55) return "Needs a look";
  if (score >= 35) return "Attention needed";
  return "Action required";
}

export const REMINDER_WINDOWS = [30, 14, 7, 1] as const;

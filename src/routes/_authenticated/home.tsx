import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bell, Boxes, Clock3, PackageOpen, Plus, Sparkles, TriangleAlert } from "lucide-react";
import { Screen } from "@/components/Screen";
import { MedicineCard } from "@/components/MedicineCard";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useFamilyMembers, useMedicines, useMedicinesRealtime, useProfile } from "@/lib/data";
import {
  cabinetScore,
  daysUntil,
  expiryLevel,
  expiryPhrase,
  formatDate,
  REMINDER_WINDOWS,
  scoreWord,
} from "@/lib/shelflife";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your cabinet — ShelfLife" },
      { name: "description", content: "A calm overview of your family's medicine cabinet." },
      { property: "og:title", content: "Your cabinet — ShelfLife" },
      { property: "og:description", content: "Cabinet health, expiring medicines and reminders." },
    ],
  }),
  component: HomeScreen,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function HomeScreen() {
  useMedicinesRealtime();
  const { data: meds, isLoading } = useMedicines();
  const { data: members } = useFamilyMembers();
  const { data: profile } = useProfile();

  const memberMap = useMemo(
    () => Object.fromEntries((members ?? []).map((m) => [m.id, m])),
    [members],
  );

  const stats = useMemo(() => {
    const list = meds ?? [];
    const score = cabinetScore(
      list.map((m) => ({
        expiry_date: m.expiry_date,
        quantity: Number(m.quantity),
        low_threshold: Number(m.low_threshold),
      })),
    );
    const expiring = list.filter((m) => {
      const d = daysUntil(m.expiry_date);
      return d >= 0 && d <= 30;
    });
    const expired = list.filter((m) => daysUntil(m.expiry_date) < 0);
    const low = list.filter((m) => Number(m.quantity) <= Number(m.low_threshold));
    const recent = [...list]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 3);
    const reminders = list
      .flatMap((m) => {
        const d = daysUntil(m.expiry_date);
        const window = REMINDER_WINDOWS.find((w) => d <= w && d > (REMINDER_WINDOWS.find((x) => x < w) ?? -1));
        return d >= 0 && window ? [{ med: m, window }] : [];
      })
      .sort((a, b) => daysUntil(a.med.expiry_date) - daysUntil(b.med.expiry_date))
      .slice(0, 3);
    return { score, expiring, expired, low, recent, reminders, total: list.length };
  }, [meds]);

  const firstName = (profile?.full_name ?? "").split(" ")[0];

  return (
    <Screen>
      <div
        className="rise pb-1"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 6px)" }}
      >
        <p className="label-xs text-muted-foreground">{greeting()}</p>
        <h1 className="mt-1 text-[27px] leading-tight font-semibold">
          {firstName ? `${firstName}'s cabinet` : "Your cabinet"}
        </h1>
      </div>

      {isLoading ? (
        <div className="mt-6">
          <ListSkeleton rows={3} />
        </div>
      ) : stats.total === 0 ? (
        <EmptyState
          icon={<PackageOpen className="h-6 w-6" strokeWidth={1.5} />}
          title="Your shelf is empty"
          body="Add your first medicine and ShelfLife will keep track of its expiry date for you."
          action={
            <Button asChild className="h-12 rounded-xl px-6">
              <Link to="/add">
                <Plus className="mr-1 h-4 w-4" /> Add a medicine
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-7 pt-5">
          <ScoreCard score={stats.score} expiring={stats.expiring.length} expired={stats.expired.length} />

          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="Medicines" value={stats.total} icon={Boxes} />
            <Stat label="Expiring" value={stats.expiring.length} icon={Clock3} tone="warning" />
            <Stat label="Running low" value={stats.low.length} icon={TriangleAlert} tone="accent" />
          </div>

          {stats.expired.length > 0 && (
            <Link
              to="/medicines"
              search={{ filter: "expired" }}
              className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/8 p-3.5"
            >
              <TriangleAlert className="h-5 w-5 shrink-0 text-destructive" strokeWidth={1.7} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-destructive">
                  {stats.expired.length} expired {stats.expired.length === 1 ? "medicine" : "medicines"}
                </p>
                <p className="text-[12.5px] text-destructive/80">Time to dispose of these safely.</p>
              </div>
            </Link>
          )}

          <Section
            title="Expiring soon"
            hint="Next 30 days"
            to="/medicines"
            search={{ filter: "soon" }}
            show={stats.expiring.length > 0}
          >
            <div className="space-y-2.5">
              {stats.expiring.slice(0, 3).map((m) => (
                <MedicineCard key={m.id} med={m} member={memberMap[m.member_id ?? ""]} />
              ))}
            </div>
          </Section>

          <Section title="Upcoming reminders" show={stats.reminders.length > 0}>
            <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card">
              {stats.reminders.map(({ med, window }) => (
                <li key={med.id} className="flex items-center gap-3 p-3.5">
                  <Bell className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.7} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{med.name}</p>
                    <p className="text-[12.5px] text-muted-foreground">
                      {window}-day notice · {formatDate(med.expiry_date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[12.5px] font-medium",
                      expiryLevel(med.expiry_date) === "soon" ? "text-warning" : "text-destructive",
                    )}
                  >
                    {expiryPhrase(med.expiry_date)}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Running low" show={stats.low.length > 0}>
            <div className="space-y-2.5">
              {stats.low.slice(0, 3).map((m) => (
                <MedicineCard key={m.id} med={m} member={memberMap[m.member_id ?? ""]} />
              ))}
            </div>
          </Section>

          <Section title="Recently added" show={stats.recent.length > 0}>
            <div className="space-y-2.5">
              {stats.recent.map((m) => (
                <MedicineCard key={m.id} med={m} member={memberMap[m.member_id ?? ""]} />
              ))}
            </div>
          </Section>
        </div>
      )}
    </Screen>
  );
}

function ScoreCard({
  score,
  expiring,
  expired,
}: {
  score: number;
  expiring: number;
  expired: number;
}) {
  const circumference = 2 * Math.PI * 42;
  const tone = score >= 75 ? "text-success" : score >= 55 ? "text-warning" : "text-destructive";

  return (
    <div className="rise flex items-center gap-5 rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="7" className="stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className={cn("transition-[stroke-dashoffset] duration-700", tone)}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * score) / 100}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[26px] leading-none font-semibold">{score}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="label-xs text-muted-foreground">Cabinet health</p>
        <p className="mt-1 flex items-center gap-1.5 text-[19px] font-semibold">
          {scoreWord(score)}
          {score >= 90 && <Sparkles className="h-4 w-4 text-success" strokeWidth={1.7} />}
        </p>
        <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
          {expired > 0
            ? `${expired} expired and ${expiring} expiring soon.`
            : expiring > 0
              ? `${expiring} ${expiring === 1 ? "medicine needs" : "medicines need"} attention this month.`
              : "Nothing needs your attention today."}
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Boxes;
  tone?: "warning" | "accent";
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3.5">
      <Icon
        className={cn(
          "h-4 w-4",
          tone === "warning" ? "text-warning" : tone === "accent" ? "text-accent" : "text-primary",
        )}
        strokeWidth={1.7}
      />
      <p className="mt-2.5 text-[21px] leading-none font-semibold">{value}</p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({
  title,
  hint,
  to,
  search,
  show,
  children,
}: {
  title: string;
  hint?: string;
  to?: string;
  search?: Record<string, string>;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {to ? (
          <Link
            to={to as never}
            search={search as never}
            className="text-[12.5px] font-medium text-muted-foreground"
          >
            {hint ?? "See all"}
          </Link>
        ) : (
          hint && <span className="text-[12.5px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Screen } from "@/components/Screen";
import { MedicineCard } from "@/components/MedicineCard";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { Calendar } from "@/components/ui/calendar";
import { useFamilyMembers, useMedicines, useMedicinesRealtime } from "@/lib/data";
import { daysUntil, formatDate, toISODate } from "@/lib/shelflife";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Expiry calendar — ShelfLife" },
      { name: "description", content: "See which medicines expire on any given day." },
      { property: "og:title", content: "Expiry calendar — ShelfLife" },
      { property: "og:description", content: "A month view of every upcoming expiry date." },
    ],
  }),
  component: CalendarScreen,
});

function CalendarScreen() {
  useMedicinesRealtime();
  const { data: meds, isLoading } = useMedicines();
  const { data: members } = useFamilyMembers();
  const [selected, setSelected] = useState<Date>(new Date());

  const memberMap = useMemo(
    () => Object.fromEntries((members ?? []).map((m) => [m.id, m])),
    [members],
  );

  const byDate = useMemo(() => {
    const map: Record<string, typeof meds> = {};
    for (const m of meds ?? []) {
      (map[m.expiry_date] ??= []).push(m);
    }
    return map;
  }, [meds]);

  const modifiers = useMemo(() => {
    const expired: Date[] = [];
    const soon: Date[] = [];
    const later: Date[] = [];
    for (const key of Object.keys(byDate)) {
      const [y = 1970, mo = 1, d = 1] = key.split("-").map(Number);
      const date = new Date(y, mo - 1, d);
      const diff = daysUntil(key);
      if (diff < 0) expired.push(date);
      else if (diff <= 30) soon.push(date);
      else later.push(date);
    }
    return { expired, soon, later };
  }, [byDate]);

  const dayList = byDate[toISODate(selected)] ?? [];

  return (
    <Screen title="Calendar" subtitle="Expiry dates at a glance">
      {isLoading ? (
        <ListSkeleton rows={2} />
      ) : (
        <>
          <div className="rise rounded-2xl border border-border/70 bg-card p-2">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(d) => d && setSelected(d)}
              showOutsideDays
              modifiers={modifiers}
              modifiersClassNames={{
                expired: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-destructive",
                soon: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-warning",
                later: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-success",
              }}
              className="pointer-events-auto mx-auto p-2"
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-[11.5px] text-muted-foreground">
            <Legend className="bg-destructive" label="Expired" />
            <Legend className="bg-warning" label="Within 30 days" />
            <Legend className="bg-success" label="Later" />
          </div>

          <div className="mt-6">
            <h2 className="mb-2.5 text-[15px] font-semibold">{formatDate(toISODate(selected))}</h2>
            {dayList.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-6 w-6" strokeWidth={1.5} />}
                title="Nothing expires today"
                body="Pick another date to see what's coming up."
              />
            ) : (
              <div className="space-y-2.5">
                {dayList.map((m) => (
                  <MedicineCard key={m.id} med={m} member={memberMap[m.member_id ?? ""]} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Screen>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

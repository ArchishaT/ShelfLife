import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowUpDown, PackageOpen, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Screen } from "@/components/Screen";
import { MedicineCard } from "@/components/MedicineCard";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFamilyMembers, useMedicines, useMedicinesRealtime } from "@/lib/data";
import { CATEGORIES, daysUntil, initials, memberSwatch } from "@/lib/shelflife";
import { cn } from "@/lib/utils";

const filterSchema = z.enum(["all", "soon", "expired", "low"]);
type SortKey = "expiry" | "name" | "added";

export const Route = createFileRoute("/_authenticated/medicines")({
  validateSearch: z.object({
    filter: filterSchema.optional(),
    member: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Medicines — ShelfLife" },
      { name: "description", content: "Search, filter and browse every medicine in your cabinet." },
      { property: "og:title", content: "Medicines — ShelfLife" },
      { property: "og:description", content: "Your full medicine inventory in one place." },
    ],
  }),
  component: MedicinesScreen,
});

const filterLabels: Record<z.infer<typeof filterSchema>, string> = {
  all: "All",
  soon: "Expiring soon",
  expired: "Expired",
  low: "Running low",
};

function MedicinesScreen() {
  useMedicinesRealtime();
  const search = Route.useSearch() as { filter?: z.infer<typeof filterSchema>; member?: string };
  const navigate = useNavigate();
  const { data: meds, isLoading } = useMedicines();
  const { data: members } = useFamilyMembers();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("expiry");

  const filter = search.filter ?? "all";
  const memberFilter = search.member;
  const memberMap = useMemo(
    () => Object.fromEntries((members ?? []).map((m) => [m.id, m])),
    [members],
  );

  const list = useMemo(() => {
    let out = [...(meds ?? [])];
    if (filter === "soon") out = out.filter((m) => daysUntil(m.expiry_date) >= 0 && daysUntil(m.expiry_date) <= 30);
    if (filter === "expired") out = out.filter((m) => daysUntil(m.expiry_date) < 0);
    if (filter === "low") out = out.filter((m) => Number(m.quantity) <= Number(m.low_threshold));
    if (memberFilter) out = out.filter((m) => m.member_id === memberFilter);
    if (category !== "All") out = out.filter((m) => m.category === category);
    const q = query.trim().toLowerCase();
    if (q)
      out = out.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.manufacturer ?? "").toLowerCase().includes(q),
      );
    out.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "added") return a.created_at < b.created_at ? 1 : -1;
      return a.expiry_date.localeCompare(b.expiry_date);
    });
    return out;
  }, [meds, filter, memberFilter, category, query, sort]);

  const activeMember = memberFilter ? memberMap[memberFilter] : undefined;

  function setFilter(next: z.infer<typeof filterSchema>) {
    navigate({
      to: "/medicines",
      search: (prev: Record<string, unknown>) => ({ ...prev, filter: next === "all" ? undefined : next }),
      replace: true,
    });
  }

  return (
    <Screen
      title="Medicines"
      subtitle={`${list.length} of ${meds?.length ?? 0}`}
      action={
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSort(sort === "expiry" ? "name" : sort === "name" ? "added" : "expiry")}
            className="tap flex items-center gap-1 rounded-lg px-2 text-[12.5px] font-medium text-muted-foreground"
            aria-label="Change sorting"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sort === "expiry" ? "Expiry" : sort === "name" ? "A–Z" : "Newest"}
          </button>
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="tap grid w-9 place-items-center rounded-lg text-foreground/70"
                aria-label="Filters"
              >
                <SlidersHorizontal className="h-[18px] w-[18px]" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl px-5 pb-8">
              <SheetHeader className="px-0">
                <SheetTitle className="text-left text-[17px]">Filter</SheetTitle>
              </SheetHeader>
              <div className="space-y-6">
                <div>
                  <p className="label-xs mb-2.5 text-muted-foreground">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(filterLabels) as (keyof typeof filterLabels)[]).map((k) => (
                      <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
                        {filterLabels[k]}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label-xs mb-2.5 text-muted-foreground">Category</p>
                  <div className="flex flex-wrap gap-2">
                    <Chip active={category === "All"} onClick={() => setCategory("All")}>
                      All
                    </Chip>
                    {CATEGORIES.map((c) => (
                      <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                        {c}
                      </Chip>
                    ))}
                  </div>
                </div>
                {(members?.length ?? 0) > 0 && (
                  <div>
                    <p className="label-xs mb-2.5 text-muted-foreground">Family member</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        active={!memberFilter}
                        onClick={() =>
                          navigate({
                            to: "/medicines",
                            search: (prev: Record<string, unknown>) => ({ ...prev, member: undefined }),
                            replace: true,
                          })
                        }
                      >
                        Everyone
                      </Chip>
                      {members?.map((m) => (
                        <Chip
                          key={m.id}
                          active={memberFilter === m.id}
                          onClick={() =>
                            navigate({
                              to: "/medicines",
                              search: (prev: Record<string, unknown>) => ({ ...prev, member: m.id }),
                              replace: true,
                            })
                          }
                        >
                          <span
                            className={cn(
                              "mr-1.5 grid h-4 w-4 place-items-center rounded-full text-[8px] font-semibold",
                              memberSwatch[m.color] ?? memberSwatch["sage"],
                            )}
                          >
                            {initials(m.name)}
                          </span>
                          {m.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      }
    >
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medicines"
          maxLength={80}
          className="h-11 rounded-xl bg-card pr-9 pl-10"
          aria-label="Search medicines"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {(filter !== "all" || activeMember || category !== "All") && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filter !== "all" && (
            <ActiveChip label={filterLabels[filter]} onClear={() => setFilter("all")} />
          )}
          {category !== "All" && (
            <ActiveChip label={category} onClear={() => setCategory("All")} />
          )}
          {activeMember && (
            <ActiveChip
              label={activeMember.name}
              onClear={() =>
                navigate({
                  to: "/medicines",
                  search: (prev: Record<string, unknown>) => ({ ...prev, member: undefined }),
                  replace: true,
                })
              }
            />
          )}
        </div>
      )}

      <div className="mt-4">
        {isLoading ? (
          <ListSkeleton />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="h-6 w-6" strokeWidth={1.5} />}
            title={meds?.length ? "Nothing matches" : "No medicines yet"}
            body={
              meds?.length
                ? "Try a different search or clear your filters."
                : "Add your first medicine and we'll watch its expiry date for you."
            }
            action={
              !meds?.length && (
                <Button asChild className="h-12 rounded-xl px-6">
                  <Link to="/add">
                    <Plus className="mr-1 h-4 w-4" /> Add a medicine
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-2.5">
            {list.map((m) => (
              <MedicineCard key={m.id} med={m} member={memberMap[m.member_id ?? ""]} />
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground/80",
      )}
    >
      {children}
    </button>
  );
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[12.5px] font-medium text-primary"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}

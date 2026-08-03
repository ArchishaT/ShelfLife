import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { MedicinePhoto } from "./MedicinePhoto";
import type { FamilyMember, Medicine } from "@/lib/data";
import { expiryLevel, expiryPhrase, levelMeta, initials, memberSwatch } from "@/lib/shelflife";
import { cn } from "@/lib/utils";

export function MedicineCard({
  med,
  member,
}: {
  med: Medicine;
  member?: FamilyMember | undefined;
}) {
  const level = expiryLevel(med.expiry_date);
  const meta = levelMeta[level];
  const low = Number(med.quantity) <= Number(med.low_threshold);

  return (
    <Link
      to="/medicine/$id"
      params={{ id: med.id }}
      className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] transition-all duration-200 active:scale-[0.985]"
    >
      <MedicinePhoto path={med.photo_url} className="h-14 w-14 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold">{med.name}</h3>
          {low && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />}
        </div>
        <p className="truncate text-[12.5px] text-muted-foreground">
          {med.category}
          {med.dosage ? ` · ${med.dosage}` : ""}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
          <span className={cn("truncate text-[12.5px] font-medium", meta.text)}>
            {expiryPhrase(med.expiry_date)}
          </span>
        </div>
      </div>
      {member && (
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold",
            memberSwatch[member.color] ?? memberSwatch["sage"],
          )}
          title={member.name}
        >
          {initials(member.name)}
        </span>
      )}
    </Link>
  );
}

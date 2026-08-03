import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Building2,
  CalendarDays,
  Clock3,
  Layers,
  Pencil,
  Pill,
  ShoppingBag,
  Thermometer,
  Trash2,
  User,
} from "lucide-react";
import { Screen } from "@/components/Screen";
import { MedicinePhoto } from "@/components/MedicinePhoto";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useDeleteMedicine,
  useFamilyMembers,
  useMedicine,
  useRestoreMedicine,
  type Medicine,
} from "@/lib/data";
import { daysUntil, expiryLevel, expiryPhrase, formatDate, levelMeta } from "@/lib/shelflife";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/medicine/$id")({
  head: () => ({
    meta: [
      { title: "Medicine details — ShelfLife" },
      { name: "description", content: "Dosage, expiry countdown and storage notes for this medicine." },
      { property: "og:title", content: "Medicine details — ShelfLife" },
      { property: "og:description", content: "Dosage, expiry countdown and storage notes." },
    ],
  }),
  component: MedicineDetail,
});

function MedicineDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: med, isLoading } = useMedicine(id);
  const { data: members } = useFamilyMembers();
  const remove = useDeleteMedicine();
  const restore = useRestoreMedicine();

  if (isLoading) {
    return (
      <Screen title="Medicine" back="/medicines">
        <div className="h-56 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="mt-5 h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-muted" />
      </Screen>
    );
  }

  if (!med) {
    return (
      <Screen title="Medicine" back="/medicines">
        <p className="pt-10 text-center text-[14px] text-muted-foreground">
          This medicine is no longer in your cabinet.
        </p>
      </Screen>
    );
  }

  const level = expiryLevel(med.expiry_date);
  const meta = levelMeta[level];
  const days = daysUntil(med.expiry_date);
  const member = members?.find((m) => m.id === med.member_id);
  const low = Number(med.quantity) <= Number(med.low_threshold);

  async function handleDelete(row: Medicine) {
    await remove.mutateAsync(row.id);
    navigate({ to: "/medicines" });
    toast("Medicine removed", {
      description: row.name,
      action: {
        label: "Undo",
        onClick: () => {
          restore.mutate(row, {
            onSuccess: () => toast.success("Restored to your cabinet"),
            onError: () => toast.error("Couldn't restore that one"),
          });
        },
      },
    });
  }

  return (
    <Screen
      title={med.name}
      back="/medicines"
      action={
        <Link
          to="/add"
          search={{ id: med.id }}
          className="tap flex items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-primary"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Link>
      }
    >
      <div className="rise space-y-6">
        <MedicinePhoto
          path={med.photo_url}
          className="h-56 w-full rounded-2xl border border-border/70"
          iconClass="h-9 w-9"
        />

        <div>
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
            <span className={cn("label-xs", meta.text)}>{meta.label}</span>
          </div>
          <h2 className="mt-2 text-[26px] leading-tight font-semibold">{med.name}</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {med.category}
            {med.manufacturer ? ` · ${med.manufacturer}` : ""}
          </p>
        </div>

        <div className={cn("rounded-2xl border p-5", "border-border/70 bg-card")}>
          <p className="label-xs text-muted-foreground">
            {days < 0 ? "Expired" : "Days remaining"}
          </p>
          <p className={cn("mt-1.5 text-[38px] leading-none font-semibold", meta.text)}>
            {Math.abs(days)}
          </p>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            {expiryPhrase(med.expiry_date)} · {formatDate(med.expiry_date)}
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                level === "expired" || level === "critical"
                  ? "bg-destructive"
                  : level === "soon"
                    ? "bg-warning"
                    : "bg-success",
              )}
              style={{ width: `${Math.max(4, Math.min(100, ((days < 0 ? 0 : days) / 365) * 100))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Tile
            icon={Layers}
            label="Quantity left"
            value={`${Number(med.quantity)} ${med.unit}`}
            tone={low ? "warning" : undefined}
          />
          <Tile icon={Pill} label="Dosage" value={med.dosage || "—"} />
          <Tile icon={Clock3} label="Frequency" value={med.frequency || "As needed"} />
          <Tile icon={User} label="Belongs to" value={member?.name ?? "Everyone"} />
          <Tile icon={ShoppingBag} label="Purchased" value={formatDate(med.purchase_date)} />
          <Tile icon={CalendarDays} label="Expires" value={formatDate(med.expiry_date)} />
        </div>

        {med.storage_instructions && (
          <Panel icon={Thermometer} title="Storage">
            {med.storage_instructions}
          </Panel>
        )}
        {med.manufacturer && (
          <Panel icon={Building2} title="Manufacturer">
            {med.manufacturer}
          </Panel>
        )}
        {med.notes && (
          <Panel icon={Pencil} title="Notes">
            {med.notes}
          </Panel>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="h-12 w-full rounded-xl text-destructive hover:bg-destructive/8 hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove from cabinet
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="mx-auto max-w-[340px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[17px]">Remove {med.name}?</AlertDialogTitle>
              <AlertDialogDescription className="text-[13.5px]">
                It will disappear from your cabinet. You can undo this right after.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel className="h-11 rounded-xl">Keep it</AlertDialogCancel>
              <AlertDialogAction
                className="h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => handleDelete(med)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Screen>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Pill;
  label: string;
  value: string;
  tone?: "warning" | undefined;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
        <span className="text-[11.5px]">{label}</span>
      </div>
      <p className={cn("mt-1.5 truncate text-[14.5px] font-medium", tone === "warning" && "text-warning")}>
        {value}
      </p>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Pill;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
        <span className="label-xs">{title}</span>
      </div>
      <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  );
}

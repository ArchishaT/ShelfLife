import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, Check, ChevronLeft, ImagePlus, Loader2 } from "lucide-react";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useFamilyMembers,
  useMedicine,
  useSaveMedicine,
  uploadMedicinePhoto,
  type MedicineInput,
} from "@/lib/data";
import {
  CATEGORIES,
  FREQUENCIES,
  STORAGE_OPTIONS,
  UNITS,
  initials,
  memberSwatch,
  toISODate,
} from "@/lib/shelflife";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/add")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Add a medicine — ShelfLife" },
      { name: "description", content: "Add a medicine with expiry date, dosage and a photo." },
      { property: "og:title", content: "Add a medicine — ShelfLife" },
      { property: "og:description", content: "Three quick steps to track a new medicine." },
    ],
  }),
  component: AddScreen,
});

type Form = {
  name: string;
  category: string;
  manufacturer: string;
  expiry_date: string;
  purchase_date: string;
  quantity: string;
  unit: string;
  low_threshold: string;
  dosage: string;
  frequency: string;
  storage_instructions: string;
  member_id: string;
  notes: string;
};

const empty: Form = {
  name: "",
  category: "Pain relief",
  manufacturer: "",
  expiry_date: "",
  purchase_date: toISODate(new Date()),
  quantity: "1",
  unit: "tablets",
  low_threshold: "5",
  dosage: "",
  frequency: "As needed",
  storage_instructions: "Room temperature",
  member_id: "",
  notes: "",
};

const STEPS = ["Basics", "Dates", "Details"];

function AddScreen() {
  const { id } = Route.useSearch() as { id?: string };
  const navigate = useNavigate();
  const { data: existing } = useMedicine(id ?? "");
  const { data: members } = useFamilyMembers();
  const save = useSaveMedicine();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(empty);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || !existing) return;
    setForm({
      name: existing.name,
      category: existing.category,
      manufacturer: existing.manufacturer ?? "",
      expiry_date: existing.expiry_date,
      purchase_date: existing.purchase_date ?? toISODate(new Date()),
      quantity: String(Number(existing.quantity)),
      unit: existing.unit,
      low_threshold: String(Number(existing.low_threshold)),
      dosage: existing.dosage ?? "",
      frequency: existing.frequency ?? "As needed",
      storage_instructions: existing.storage_instructions ?? "Room temperature",
      member_id: existing.member_id ?? "",
      notes: existing.notes ?? "",
    });
  }, [id, existing]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const stepValid = useMemo(() => {
    if (step === 0) return form.name.trim().length > 1 && form.name.length <= 80;
    if (step === 1) return !!form.expiry_date;
    return true;
  }, [step, form]);

  async function submit() {
    if (!form.expiry_date || !form.name.trim()) {
      toast.error("A name and expiry date are required");
      return;
    }
    setSaving(true);
    try {
      let photoPath: string | null = existing?.photo_url ?? null;
      if (file) photoPath = await uploadMedicinePhoto(file);
      const values: MedicineInput = {
        name: form.name.trim().slice(0, 80),
        category: form.category,
        manufacturer: form.manufacturer.trim().slice(0, 80) || null,
        expiry_date: form.expiry_date,
        purchase_date: form.purchase_date || null,
        quantity: Number(form.quantity) || 0,
        unit: form.unit,
        low_threshold: Number(form.low_threshold) || 0,
        dosage: form.dosage.trim().slice(0, 60) || null,
        frequency: form.frequency,
        storage_instructions: form.storage_instructions,
        member_id: form.member_id || null,
        notes: form.notes.trim().slice(0, 500) || null,
        photo_url: photoPath,
      };
      const saved = await save.mutateAsync(id ? { id, values } : { values });
      toast.success(id ? "Medicine updated" : `${values.name} added to your cabinet`);
      navigate({ to: "/medicine/$id", params: { id: saved.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save that medicine");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      title={id ? "Edit medicine" : "Add medicine"}
      back="/home"
    >
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
            <p
              className={cn(
                "mt-1.5 text-[11px]",
                i === step ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      <div key={step} className="rise space-y-5">
        {step === 0 && (
          <>
            <Field label="Medicine name">
              <Input
                autoFocus
                value={form.name}
                maxLength={80}
                onChange={(e) => set("name")(e.target.value)}
                placeholder="e.g. Ibuprofen 400mg"
                className="h-12 rounded-xl bg-card"
              />
            </Field>
            <Field label="Category">
              <Picker value={form.category} onChange={set("category")} options={[...CATEGORIES]} />
            </Field>
            <Field label="Manufacturer" optional>
              <Input
                value={form.manufacturer}
                maxLength={80}
                onChange={(e) => set("manufacturer")(e.target.value)}
                placeholder="e.g. Bayer"
                className="h-12 rounded-xl bg-card"
              />
            </Field>
            <Field label="Belongs to">
              <div className="flex flex-wrap gap-2">
                <MemberChip active={!form.member_id} onClick={() => set("member_id")("")}>
                  Everyone
                </MemberChip>
                {members?.map((m) => (
                  <MemberChip
                    key={m.id}
                    active={form.member_id === m.id}
                    onClick={() => set("member_id")(m.id)}
                  >
                    <span
                      className={cn(
                        "mr-1.5 grid h-4.5 w-4.5 place-items-center rounded-full text-[9px] font-semibold",
                        memberSwatch[m.color] ?? memberSwatch["sage"],
                      )}
                    >
                      {initials(m.name)}
                    </span>
                    {m.name}
                  </MemberChip>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Expiry date">
              <Input
                type="date"
                value={form.expiry_date}
                onChange={(e) => set("expiry_date")(e.target.value)}
                className="h-12 rounded-xl bg-card"
              />
            </Field>
            <Field label="Purchase date" optional>
              <Input
                type="date"
                value={form.purchase_date}
                onChange={(e) => set("purchase_date")(e.target.value)}
                className="h-12 rounded-xl bg-card"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={9999}
                  value={form.quantity}
                  onChange={(e) => set("quantity")(e.target.value)}
                  className="h-12 rounded-xl bg-card"
                />
              </Field>
              <Field label="Unit">
                <Picker value={form.unit} onChange={set("unit")} options={[...UNITS]} />
              </Field>
            </div>
            <Field label="Warn me when below">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={9999}
                value={form.low_threshold}
                onChange={(e) => set("low_threshold")(e.target.value)}
                className="h-12 rounded-xl bg-card"
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Dosage" optional>
              <Input
                value={form.dosage}
                maxLength={60}
                onChange={(e) => set("dosage")(e.target.value)}
                placeholder="e.g. 1 tablet after meals"
                className="h-12 rounded-xl bg-card"
              />
            </Field>
            <Field label="Frequency">
              <Picker value={form.frequency} onChange={set("frequency")} options={[...FREQUENCIES]} />
            </Field>
            <Field label="Storage">
              <Picker
                value={form.storage_instructions}
                onChange={set("storage_instructions")}
                options={[...STORAGE_OPTIONS]}
              />
            </Field>
            <Field label="Photo" optional>
              <label className="tap flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3.5">
                {preview ? (
                  <img
                    src={preview}
                    alt="Selected medicine"
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid h-14 w-14 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <ImagePlus className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">
                    {preview ? "Change photo" : "Add a photo"}
                  </span>
                  <span className="block text-[12.5px] text-muted-foreground">
                    Snap the box so it's easy to recognise
                  </span>
                </span>
                <Camera className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 6 * 1024 * 1024) {
                      toast.error("Please pick an image under 6 MB");
                      return;
                    }
                    setFile(f);
                  }}
                />
              </label>
            </Field>
            <Field label="Notes" optional>
              <Textarea
                value={form.notes}
                maxLength={500}
                rows={3}
                onChange={(e) => set("notes")(e.target.value)}
                placeholder="Anything worth remembering"
                className="rounded-xl bg-card"
              />
            </Field>
          </>
        )}
      </div>

      <div
        className="sticky bottom-0 -mx-5 mt-8 flex gap-2.5 border-t border-border/70 bg-background/95 px-5 pt-3.5 backdrop-blur"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
      >
        {step > 0 && (
          <Button
            variant="outline"
            className="h-12 rounded-xl px-4"
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            className="h-12 flex-1 rounded-xl"
            disabled={!stepValid}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button className="h-12 flex-1 rounded-xl" disabled={saving} onClick={submit}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                {id ? "Save changes" : "Add to cabinet"}
              </>
            )}
          </Button>
        )}
      </div>
    </Screen>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="label-xs text-muted-foreground">
        {label}
        {optional && <span className="ml-1 normal-case opacity-70">optional</span>}
      </Label>
      {children}
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12 w-full rounded-xl bg-card !h-12">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-[14px]">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MemberChip({
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
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
      )}
    >
      {children}
    </button>
  );
}

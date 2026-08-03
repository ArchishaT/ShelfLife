import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, LogOut, Moon, Plus, Trash2, UserRound } from "lucide-react";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import {
  useDeleteMember,
  useFamilyMembers,
  useMedicines,
  useProfile,
  useSaveMember,
  useUpdateProfile,
} from "@/lib/data";
import { MEMBER_COLORS, initials, memberSwatch } from "@/lib/shelflife";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & family — ShelfLife" },
      { name: "description", content: "Manage your household members, reminders and appearance." },
      { property: "og:title", content: "Profile & family — ShelfLife" },
      { property: "og:description", content: "Household members, reminders and appearance." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: members } = useFamilyMembers();
  const { data: meds } = useMedicines();
  const updateProfile = useUpdateProfile();
  const saveMember = useSaveMember();
  const deleteMember = useDeleteMember();

  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [color, setColor] = useState<string>(MEMBER_COLORS[0]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (profile?.dark_mode !== undefined) applyTheme(profile?.dark_mode ? "dark" : "light");
  }, [profile?.dark_mode]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function addMember() {
    if (name.trim().length < 2) {
      toast.error("Please enter a name");
      return;
    }
    await saveMember.mutateAsync({
      name: name.trim().slice(0, 40),
      relation: relation.trim().slice(0, 30) || "Family",
      color,
    });
    setName("");
    setRelation("");
    setOpen(false);
    toast.success("Family member added");
  }

  return (
    <Screen title="Profile" subtitle={profile?.full_name ?? "Your household"}>
      <div className="rise space-y-7">
        <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-[18px] font-semibold text-primary-foreground">
            {initials(profile?.full_name || "S L")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold">{profile?.full_name || "ShelfLife user"}</p>
            <p className="truncate text-[13px] text-muted-foreground">
              {meds?.length ?? 0} medicines · {members?.length ?? 0} family members
            </p>
          </div>
        </div>

        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Family</h2>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="tap flex items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-primary">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl px-5 pb-8">
                <SheetHeader className="px-0">
                  <SheetTitle className="text-left text-[17px]">New family member</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="label-xs text-muted-foreground">Name</Label>
                    <Input
                      value={name}
                      maxLength={40}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya"
                      className="h-12 rounded-xl bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="label-xs text-muted-foreground">Relation</Label>
                    <Input
                      value={relation}
                      maxLength={30}
                      onChange={(e) => setRelation(e.target.value)}
                      placeholder="e.g. Daughter"
                      className="h-12 rounded-xl bg-card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-xs text-muted-foreground">Colour</Label>
                    <div className="flex gap-2">
                      {MEMBER_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          aria-label={c}
                          className={cn(
                            "h-9 w-9 rounded-full ring-offset-2 ring-offset-background",
                            memberSwatch[c],
                            color === c && "ring-2 ring-primary",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <Button className="h-12 w-full rounded-xl" onClick={addMember}>
                    Add member
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {members?.length ? (
            <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-3.5">
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                      memberSwatch[m.color] ?? memberSwatch["sage"],
                    )}
                  >
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{m.name}</p>
                    <p className="truncate text-[12.5px] text-muted-foreground">{m.relation}</p>
                  </div>
                  <button
                    aria-label={`Remove ${m.name}`}
                    onClick={() =>
                      deleteMember.mutate(m.id, {
                        onSuccess: () => toast("Family member removed"),
                      })
                    }
                    className="tap grid w-9 place-items-center rounded-lg text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-5 text-center">
              <UserRound className="mx-auto h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
              <p className="mt-2 text-[13.5px] text-muted-foreground">
                Add the people you keep medicines for.
              </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2.5 text-[15px] font-semibold">Preferences</h2>
          <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card">
            <Row icon={Moon} title="Dark mode" body="Easier on the eyes at night">
              <Switch
                checked={!!profile?.dark_mode}
                onCheckedChange={(v) => {
                  applyTheme(v ? "dark" : "light");
                  updateProfile.mutate({ dark_mode: v });
                }}
              />
            </Row>
            <Row icon={Bell} title="Expiry reminders" body="30, 14, 7 and 1 day before">
              <Switch
                checked={profile?.notify_30 ?? true}
                onCheckedChange={(v) =>
                  updateProfile.mutate({ notify_30: v, notify_14: v, notify_7: v, notify_1: v })
                }
              />
            </Row>
          </ul>
        </section>

        <Button
          variant="ghost"
          onClick={signOut}
          className="h-12 w-full rounded-xl text-destructive hover:bg-destructive/8 hover:text-destructive"
        >
          <LogOut className="mr-1.5 h-4 w-4" /> Sign out
        </Button>
      </div>
    </Screen>
  );
}

function Row({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: typeof Bell;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 p-3.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">{title}</p>
        <p className="text-[12.5px] text-muted-foreground">{body}</p>
      </div>
      {children}
    </li>
  );
}

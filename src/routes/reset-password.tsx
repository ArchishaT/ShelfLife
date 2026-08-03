import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Wordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — ShelfLife" },
      { name: "description", content: "Choose a new password for your ShelfLife account." },
      { property: "og:title", content: "Set a new password — ShelfLife" },
      { property: "og:description", content: "Choose a new password for your ShelfLife account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().min(8, "Use at least 8 characters").max(72).safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/home", replace: true });
  }

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background px-7 pb-10"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 26px)" }}
    >
      <Wordmark />
      <form onSubmit={submit} className="flex flex-1 flex-col justify-center">
        <h1 className="text-[30px] leading-tight font-semibold">Set a new password</h1>
        <p className="mt-2 text-[14.5px] text-muted-foreground">
          Choose something you'll remember.
        </p>
        <div className="mt-8 space-y-1.5">
          <Label className="label-xs text-muted-foreground">New password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="At least 8 characters"
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <Button type="submit" disabled={busy} className="mt-7 h-13 rounded-xl text-[15px]">
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}

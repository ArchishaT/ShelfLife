import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup", "forgot"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — ShelfLife" },
      { name: "description", content: "Sign in or create your ShelfLife medicine cabinet." },
      { property: "og:title", content: "Sign in — ShelfLife" },
      { property: "og:description", content: "Your family's medicine cabinet, safely organised." },
    ],
  }),
  component: AuthScreen,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);

function AuthScreen() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<"confirm" | "reset" | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    if (mode !== "forgot") {
      const parsedPassword = passwordSchema.safeParse(password);
      if (!parsedPassword.success) {
        toast.error(parsedPassword.error.issues[0]?.message ?? "Invalid password");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsedEmail.data,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/home", replace: true });
        else setSent("confirm");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsedEmail.data,
          password,
        });
        if (error) throw error;
        navigate({ to: "/home", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    // Requires the Google provider to be enabled in Supabase
    // (Authentication → Providers → Google) with a Google Cloud OAuth client
    // configured — see the "Adding Google OAuth" section in the README.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setBusy(false);
      toast.error("Google sign-in didn't work. Please try again.");
      return;
    }
    // signInWithOAuth redirects the browser to Google; nothing left to do here.
  }

  if (sent) {
    return (
      <Shell>
        <div className="rise flex flex-1 flex-col justify-center">
          <h1 className="text-[28px] leading-tight font-semibold">Check your inbox</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {sent === "confirm"
              ? `We sent a confirmation link to ${email}. Tap it to open your cabinet.`
              : `We sent a password reset link to ${email}.`}
          </p>
          <Button
            variant="outline"
            className="mt-8 h-12 rounded-xl"
            onClick={() => {
              setSent(null);
              setMode("signin");
            }}
          >
            Back to sign in
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <form onSubmit={submit} className="flex flex-1 flex-col justify-center py-6">
        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => setMode("signin")}
            className="tap mb-4 -ml-1 flex w-fit items-center gap-1 text-[13px] text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        <h1 className="text-[30px] leading-tight font-semibold">
          {mode === "signup"
            ? "Create your cabinet"
            : mode === "signin"
              ? "Welcome back"
              : "Reset your password"}
        </h1>
        <p className="mt-2 text-[14.5px] text-muted-foreground">
          {mode === "signup"
            ? "A calmer, safer medicine drawer starts here."
            : mode === "signin"
              ? "Everything is exactly where you left it."
              : "We'll email you a secure link."}
        </p>

        <div className="mt-8 space-y-4">
          {mode === "signup" && (
            <Field label="Your name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={80}
                placeholder="Maya Ellison"
                className="h-12 rounded-xl bg-card"
              />
            </Field>
          )}
          <Field label="Email">
            <Input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="h-12 rounded-xl bg-card"
            />
          </Field>
          {mode !== "forgot" && (
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                placeholder="At least 8 characters"
                className="h-12 rounded-xl bg-card"
              />
            </Field>
          )}
        </div>

        <Button type="submit" disabled={busy} className="mt-7 h-13 rounded-xl text-[15px]">
          {busy
            ? "One moment…"
            : mode === "signup"
              ? "Create account"
              : mode === "signin"
                ? "Sign in"
                : "Send reset link"}
        </Button>

        {mode !== "forgot" && (
          <>
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="label-xs text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={google}
              className="h-12 rounded-xl bg-card text-[14.5px]"
            >
              Continue with Google
            </Button>
          </>
        )}

        <div className="mt-8 space-y-2 text-center text-[13.5px]">
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="tap text-muted-foreground underline underline-offset-4"
            >
              Forgot your password?
            </button>
          )}
          {mode !== "forgot" && (
            <p className="text-muted-foreground">
              {mode === "signup" ? "Already have an account? " : "New to ShelfLife? "}
              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="font-medium text-primary underline underline-offset-4"
              >
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>
          )}
        </div>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background px-7 pb-10"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 26px)" }}
    >
      <Wordmark />
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="label-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

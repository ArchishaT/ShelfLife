import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck, HeartPulse, LayoutGrid } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShelfLife — Know what's safe. Keep what matters." },
      {
        name: "description",
        content:
          "A calm home for your family's medicine cabinet. Track expiry dates, organise by family member and never keep an expired medicine again.",
      },
      { property: "og:title", content: "ShelfLife — Know what's safe. Keep what matters." },
      {
        property: "og:description",
        content: "Track medicine expiry dates and keep your family's cabinet safe.",
      },
    ],
  }),
  component: Welcome,
});

const slides = [
  {
    icon: LayoutGrid,
    title: "Organise your\nmedicine cabinet",
    body: "Every box, bottle and blister pack in one calm place — with photos, dosage and storage notes.",
  },
  {
    icon: CalendarCheck,
    title: "Never miss an\nexpiry date again",
    body: "ShelfLife counts the days for you and speaks up 30, 14, 7 and 1 day before anything expires.",
  },
  {
    icon: HeartPulse,
    title: "Keep your\nfamily safe",
    body: "Give each person their own shelf, so you always know whose medicine is whose.",
  },
];

function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate({ to: "/home", replace: true });
      else setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center gap-4 bg-background">
        <Logo size={56} className="rise" />
        <p className="wordmark rise text-2xl text-primary">ShelfLife</p>
      </div>
    );
  }

  const slide = slides[step]!;
  const Icon = slide.icon;
  const last = step === slides.length - 1;

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background px-7"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 28px)" }}
    >
      <div className="flex items-center justify-between">
        <Logo size={30} />
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="tap px-2 text-[13px] font-medium text-muted-foreground"
        >
          Skip
        </button>
      </div>

      <div key={step} className="rise flex flex-1 flex-col justify-center">
        <div className="mb-9 grid h-16 w-16 place-items-center rounded-2xl bg-primary/8 text-primary">
          <Icon className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <h1 className="text-[34px] leading-[1.1] font-semibold whitespace-pre-line">
          {slide.title}
        </h1>
        <p className="mt-4 max-w-[19rem] text-[15px] leading-relaxed text-muted-foreground">
          {slide.body}
        </p>
      </div>

      <div className="flex items-center gap-2 pb-6">
        {slides.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === step ? "w-7 bg-primary" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>

      <div className="space-y-2.5 pb-10">
        <Button
          size="lg"
          className="h-13 w-full rounded-xl text-[15px]"
          onClick={() => (last ? navigate({ to: "/auth" }) : setStep(step + 1))}
        >
          {last ? "Create your cabinet" : "Continue"}
        </Button>
        {last ? (
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-full rounded-xl text-[15px]"
            onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
          >
            I already have an account
          </Button>
        ) : (
          <p className="pt-1 text-center text-[12.5px] text-muted-foreground">
            Know what's safe. Keep what matters.
          </p>
        )}
      </div>
    </div>
  );
}

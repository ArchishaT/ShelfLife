import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

/** Phone-shaped shell. Every screen in ShelfLife is mobile-first. */
export function Screen({
  title,
  subtitle,
  back,
  action,
  children,
  nav = true,
  className,
}: {
  title?: string;
  subtitle?: string;
  back?: string;
  action?: ReactNode;
  children: ReactNode;
  nav?: boolean;
  className?: string;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background shadow-[0_0_80px_oklch(0.3_0.02_150_/_0.06)]">
      {title && (
        <header
          className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-5 pb-3 backdrop-blur-xl"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {back && (
                <Link
                  to={back}
                  aria-label="Go back"
                  className="tap -ml-2 flex w-9 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:text-foreground"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-[19px] font-semibold">{title}</h1>
                {subtitle && (
                  <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            {action}
          </div>
        </header>
      )}
      <main className={cn("flex-1 px-5 pt-5", nav ? "pb-28" : "pb-10", className)}>{children}</main>
      {nav && <BottomNav />}
    </div>
  );
}

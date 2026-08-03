import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Home, Pill, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-border bg-card/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 items-end px-1 pt-1.5 pb-1.5">
        {tabs.slice(0, 2).map((t) => (
          <NavItem key={t.to} {...t} active={pathname.startsWith(t.to)} />
        ))}
        <li className="flex justify-center">
          <Link
            to="/add"
            aria-label="Add a medicine"
            className={cn(
              "-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-lift)] transition-transform duration-200 active:scale-92",
              pathname.startsWith("/add") && "ring-4 ring-secondary/40",
            )}
          >
            <Plus className="h-6 w-6" strokeWidth={2.2} />
          </Link>
        </li>
        {tabs.slice(2).map((t) => (
          <NavItem key={t.to} {...t} active={pathname.startsWith(t.to)} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className={cn(
          "tap flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[10.5px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.1 : 1.6} />
        {label}
      </Link>
    </li>
  );
}

import {
  CalendarDays,
  CircleGauge,
  History,
  Landmark,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: CircleGauge },
  { href: "/months", label: "Months", icon: CalendarDays },
  { href: "/savings", label: "Savings", icon: Landmark },
  { href: "/history", label: "History", icon: History },
  { href: "/members", label: "Members", icon: Users },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
] as const;

function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label="Application navigation"
      className={cn(
        mobile
          ? "flex gap-2 overflow-x-auto px-4 py-3"
          : "flex flex-1 flex-col gap-1 px-3 py-6",
      )}
    >
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "focus-ring inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
            mobile
              ? "bg-card text-card-foreground hover:bg-accent border"
              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-emerald-50",
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh md:grid md:grid-cols-[15.5rem_1fr]">
      <aside className="bg-sidebar text-sidebar-foreground hidden min-h-svh flex-col md:flex">
        <div className="border-sidebar-border border-b px-5 py-5">
          <Brand inverse />
        </div>
        <AppNavigation />
        <div className="border-sidebar-border border-t p-5 text-sm text-emerald-100">
          Private group workspace
        </div>
      </aside>
      <div className="min-w-0">
        <header className="bg-card border-b md:hidden">
          <div className="flex min-h-16 items-center justify-between px-4">
            <Brand compact />
            <Badge variant="secondary">Shell preview</Badge>
          </div>
          <AppNavigation mobile />
        </header>
        <div className="border-b bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-950">
          Foundation preview — authentication and financial data are not
          connected.
        </div>
        <main className="p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

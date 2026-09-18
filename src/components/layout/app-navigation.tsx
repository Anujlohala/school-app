"use client";
import {
  CalendarDays,
  CircleGauge,
  History,
  Landmark,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
const items = [
  { href: "/dashboard", label: "Overview", icon: CircleGauge },
  { href: "/months", label: "Monthly records", icon: CalendarDays },
  { href: "/savings", label: "Savings", icon: Landmark },
  { href: "/history", label: "History", icon: History },
  { href: "/members", label: "Members", icon: Users },
];
export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Application navigation"}
      className={
        mobile
          ? "flex gap-2 overflow-x-auto px-4 py-3"
          : "flex flex-col gap-2 p-4"
      }
    >
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "focus-ring flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-xs font-semibold transition-colors",
            pathname === href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-primary",
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

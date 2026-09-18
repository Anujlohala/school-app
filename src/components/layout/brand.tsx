import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandProps = { compact?: boolean; inverse?: boolean };

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-ring inline-flex min-h-11 items-center gap-3 rounded-lg",
        inverse ? "text-sidebar-foreground" : "text-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10 place-items-center rounded-xl text-sm font-extrabold tracking-tight",
          inverse
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        68
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-extrabold tracking-tight">
            Oxford 2068
          </span>
          <span
            className={cn(
              "text-xs",
              inverse ? "text-emerald-100" : "text-muted-foreground",
            )}
          >
            Circle
          </span>
        </span>
      )}
    </Link>
  );
}

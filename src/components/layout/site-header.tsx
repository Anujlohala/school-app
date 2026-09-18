import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="bg-background/95 border-b">
      <div className="content-wrap flex min-h-20 items-center justify-between gap-4">
        <Brand />
        <nav aria-label="Public navigation" className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "min-h-11 px-4",
            )}
          >
            Member login
          </Link>
          <Link
            href="/admin/login"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "hidden min-h-11 px-4 sm:inline-flex",
            )}
          >
            Admin login
          </Link>
        </nav>
      </div>
    </header>
  );
}

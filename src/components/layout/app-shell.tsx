import { Eye, CircleHelp } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/layout/brand";
import { AppNavigation } from "@/components/layout/app-navigation";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/features/auth/logout-button";

export function AppShell({
  children,
  role,
}: {
  children: ReactNode;
  role: "admin" | "member";
}) {
  return (
    <div className="min-h-svh md:grid md:grid-cols-[14rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="focus-ring bg-card fixed top-3 left-3 z-50 -translate-y-24 rounded-lg px-4 py-3 focus:translate-y-0"
      >
        Skip to content
      </a>
      <aside className="bg-card hidden min-h-svh flex-col border-r md:flex">
        <div className="sticky top-0 flex h-svh flex-col">
          <div className="border-b px-5 py-6">
            <Brand />
            <p className="text-muted-foreground mt-3 text-[10px] tracking-widest uppercase">
              Batch of 2068 · 11 friends
            </p>
          </div>
          <p className="text-muted-foreground px-7 pt-7 text-[10px] font-bold tracking-widest uppercase">
            Your circle
          </p>
          <AppNavigation admin={role === "admin"} />
          <div className="text-muted-foreground mt-auto p-6 text-xs">
            <CircleHelp aria-hidden="true" className="mb-3 size-5" />
            <p className="text-foreground font-semibold">
              Built on friendship.
            </p>
            <p className="mt-1">Kept together by trust.</p>
            <div className="mt-5 border-t pt-4 text-[10px]">
              Oxford 2068 Circle
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="bg-card border-b">
          <div className="flex min-h-18 items-center justify-between gap-3 px-4 sm:px-8">
            <div className="md:hidden">
              <Brand />
            </div>
            <p className="text-muted-foreground hidden text-xs md:block">
              Our circle. Our shared progress.
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant="outline" className="h-7 gap-2 px-3">
                <Eye aria-hidden="true" />
                {role === "admin" ? "Administrator" : "Member · Read only"}
              </Badge>
              <LogoutButton />
            </div>
          </div>
          <div className="border-t md:hidden">
            <AppNavigation mobile admin={role === "admin"} />
          </div>
        </header>
        <div className="border-b bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-950">
          <strong>Development workspace.</strong> Dashboard financial figures
          are sample data.
        </div>
        <main
          id="main-content"
          className="mx-auto max-w-[1440px] p-4 sm:p-7 lg:p-9"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAccount } from "@/server/queries/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export async function LoginScreen({ admin = false }: { admin?: boolean }) {
  const account = await getAccount();
  if (account) redirect(account.role === "admin" ? "/admin" : "/dashboard");
  return (
    <div className="bg-auth-background flex min-h-svh flex-col">
      <header className="border-primary/10 border-b">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-x-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-5">
            <Brand />
            <span className="text-muted-foreground hidden text-[10px] font-semibold tracking-widest uppercase sm:block">
              Batch 2068 · Nepal
            </span>
          </div>
          <Badge variant="outline" className="bg-card/70 h-7 px-3 text-[10px]">
            Private circle
          </Badge>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-[440px]">
          <Card className="border-primary/10 gap-0 border p-6 shadow-[0_8px_32px_rgba(23,74,58,0.06)] ring-0 sm:p-10">
            <div className="mb-7">
              <span className="bg-secondary text-primary mb-5 inline-flex size-11 items-center justify-center rounded-xl">
                {admin ? (
                  <ShieldCheck aria-hidden="true" className="size-5" />
                ) : (
                  <Users aria-hidden="true" className="size-5" />
                )}
              </span>
              <p className="text-primary mb-2 text-[10px] font-bold tracking-[0.16em] uppercase">
                {admin ? "Administrator access" : "The shared member account"}
              </p>
              <h1 className="text-primary text-2xl font-bold tracking-tight">
                {admin ? "Admin console access" : "Welcome back"}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {admin
                  ? "A dedicated sign-in for managing our circle’s records."
                  : "Sign in to Oxford 2068 Circle. One shared view for every friend."}
              </p>
            </div>
            <LoginForm key={admin ? "admin" : "member"} admin={admin} />
            <div className="mt-6 border-t pt-4 text-center">
              <Link
                href={admin ? "/login" : "/admin/login"}
                className="focus-ring text-muted-foreground hover:text-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-2 text-xs"
              >
                {admin ? (
                  <ArrowLeft aria-hidden="true" className="size-3.5" />
                ) : (
                  <ShieldCheck aria-hidden="true" className="size-3.5" />
                )}
                {admin
                  ? "Return to member sign-in"
                  : "Switch to administrator sign-in"}
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <footer className="border-primary/10 bg-card/50 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-center text-[11px] sm:flex-row sm:px-8 sm:text-left">
          <p>Made for the Oxford 2068 friend circle.</p>
          <p>
            {admin ? "Administrator access" : "11 friends · One shared journey"}
          </p>
        </div>
      </footer>
    </div>
  );
}

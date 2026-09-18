import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LoginPlaceholder({
  audience,
}: {
  audience: "Administrator" | "Member";
}) {
  const isAdmin = audience === "Administrator";
  return (
    <main className="content-wrap grid min-h-svh place-items-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <Card className="border-border/90 shadow-sm">
          <CardHeader className="space-y-4">
            <span className="bg-accent text-accent-foreground grid size-11 place-items-center rounded-xl">
              <LockKeyhole aria-hidden="true" className="size-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">{audience} sign-in</CardTitle>
              <CardDescription className="mt-2 text-base leading-7">
                {isAdmin
                  ? "Administrator access will manage the group’s records after authentication is connected."
                  : "Members will use the shared read-only account to review the group’s records."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-muted/50 text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
              This is a scaffold placeholder. No credentials are accepted or
              stored yet.
            </div>
            <Button className="min-h-11 w-full" disabled>
              Sign-in coming in the authentication slice
            </Button>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "min-h-11 w-full",
              )}
            >
              <ArrowLeft aria-hidden="true" />
              Back to home
            </Link>
          </CardContent>
        </Card>
        <p className="text-muted-foreground mt-5 text-center text-sm">
          <Link
            className="focus-ring rounded underline underline-offset-4"
            href={isAdmin ? "/login" : "/admin/login"}
          >
            {isAdmin ? "Use member access" : "Administrator access"}
          </Link>
        </p>
      </div>
    </main>
  );
}

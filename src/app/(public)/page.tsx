import { ArrowRight, LockKeyhole, Users } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main>
        <section className="content-wrap grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-32">
          <div>
            <Badge variant="secondary" className="mb-6">
              Private group access
            </Badge>
            <h1 className="max-w-3xl text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              One clear record for the Oxford 2068 Circle.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
              A private place for school friends to review Dhukuti and
              shared-savings records. Group information stays behind sign-in.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "lg" }), "min-h-12 px-6")}
              >
                Member login
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="/admin/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-12 px-6",
                )}
              >
                Administrator login
              </Link>
            </div>
          </div>
          <Card className="border-border/90 bg-card overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="bg-primary text-primary-foreground p-6 sm:p-8">
                <span className="grid size-12 place-items-center rounded-xl bg-white/12">
                  <Users aria-hidden="true" className="size-6" />
                </span>
                <p className="mt-8 text-sm font-bold tracking-wide text-emerald-100 uppercase">
                  Built for the circle
                </p>
                <p className="mt-2 text-2xl font-bold">
                  11 friends, one shared view
                </p>
              </div>
              <div className="flex gap-4 p-6 sm:p-8">
                <span className="bg-accent text-accent-foreground grid size-11 shrink-0 place-items-center rounded-xl">
                  <LockKeyhole aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="font-bold">No public financial information</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    The live dashboard will require authenticated group access.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="content-wrap text-muted-foreground text-sm">
          Oxford 2068 Circle · Nepal
        </div>
      </footer>
    </div>
  );
}

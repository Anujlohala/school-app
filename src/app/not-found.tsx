import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="content-wrap grid min-h-svh place-items-center py-16">
      <div className="max-w-lg text-center">
        <p className="text-primary text-sm font-bold tracking-wide uppercase">
          404
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground mt-4">
          This route is not part of the Oxford 2068 Circle scaffold.
        </p>
        <Link href="/" className={cn(buttonVariants(), "mt-7 min-h-11 px-5")}>
          Return home
        </Link>
      </div>
    </main>
  );
}

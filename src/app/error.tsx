"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="content-wrap grid min-h-svh place-items-center py-16">
      <div className="bg-card max-w-lg rounded-2xl border p-8 text-center shadow-sm">
        <TriangleAlert
          aria-hidden="true"
          className="text-destructive mx-auto size-9"
        />
        <h1 className="mt-5 text-2xl font-extrabold">Something went wrong</h1>
        <p className="text-muted-foreground mt-3">
          The page could not be prepared. No changes were made to any records.
        </p>
        <Button className="mt-6 min-h-11" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}

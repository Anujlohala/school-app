import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="content-wrap py-16" aria-label="Loading page">
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    </main>
  );
}

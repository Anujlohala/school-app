import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedRouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
      className="mx-auto max-w-6xl space-y-7"
    >
      <span className="sr-only">Loading page content…</span>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-3 w-32 motion-reduce:animate-none" />
        <Skeleton className="h-9 w-full max-w-md motion-reduce:animate-none" />
        <Skeleton className="h-4 w-full max-w-2xl motion-reduce:animate-none" />
      </div>

      <div
        aria-hidden="true"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="bg-card space-y-5 rounded-xl border p-5">
            <Skeleton className="h-3 w-28 motion-reduce:animate-none" />
            <Skeleton className="h-8 w-36 motion-reduce:animate-none" />
            <Skeleton className="h-3 w-full motion-reduce:animate-none" />
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]"
      >
        <div className="min-w-0 space-y-6">
          <div className="bg-primary/90 space-y-6 rounded-xl p-6 sm:p-7">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-4 w-36 bg-white/20 motion-reduce:animate-none" />
              <Skeleton className="h-6 w-28 bg-white/20 motion-reduce:animate-none" />
            </div>
            <Skeleton className="h-12 w-64 max-w-full bg-white/20 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-full bg-white/20 motion-reduce:animate-none" />
          </div>
          <div className="bg-card space-y-5 rounded-xl border p-5 sm:p-6">
            <div className="flex flex-wrap justify-between gap-4">
              <Skeleton className="h-7 w-44 motion-reduce:animate-none" />
              <Skeleton className="h-11 w-56 max-w-full motion-reduce:animate-none" />
            </div>
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 border-t pt-4"
              >
                <Skeleton className="h-9 w-48 max-w-[60%] motion-reduce:animate-none" />
                <Skeleton className="h-7 w-20 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="bg-card space-y-4 rounded-xl border p-5"
            >
              <Skeleton className="h-5 w-40 motion-reduce:animate-none" />
              <Skeleton className="h-8 w-32 motion-reduce:animate-none" />
              <Skeleton className="h-3 w-full motion-reduce:animate-none" />
              <Skeleton className="h-3 w-4/5 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

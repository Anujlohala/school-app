import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "focus-ring bg-secondary/60 text-foreground placeholder:text-muted-foreground aria-invalid:border-destructive focus:bg-card min-h-12 w-full rounded-lg border border-transparent px-3 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

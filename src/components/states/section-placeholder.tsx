import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SectionPlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  role?: "Admin" | "Member";
};

export function SectionPlaceholder({
  title,
  description,
  icon: Icon,
  role = "Member",
}: SectionPlaceholderProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-bold tracking-wide uppercase">
            Application foundation
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {title}
          </h1>
        </div>
        <Badge variant="outline" className="w-fit">
          {role} placeholder
        </Badge>
      </div>
      <Card className="border-border/90 shadow-sm">
        <CardHeader>
          <span className="bg-accent text-accent-foreground grid size-12 place-items-center rounded-xl">
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <CardTitle className="pt-3 text-xl">Structure ready</CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/40 text-muted-foreground rounded-xl border border-dashed p-5 text-sm">
            No live records, calculations, or actions are included in this
            scaffold.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

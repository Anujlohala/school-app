import { requireAccount } from "@/server/queries/auth";
import { CalendarDays } from "lucide-react";
import { SectionPlaceholder } from "@/components/states/section-placeholder";

export default async function MonthsPage() {
  await requireAccount();
  return (
    <SectionPlaceholder
      icon={CalendarDays}
      title="Monthly records"
      description="This route will provide cycle and month navigation plus read-only collection details for members."
    />
  );
}

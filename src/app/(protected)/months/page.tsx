import { CalendarDays } from "lucide-react";
import { SectionPlaceholder } from "@/components/states/section-placeholder";

export default function MonthsPage() {
  return (
    <SectionPlaceholder
      icon={CalendarDays}
      title="Monthly records"
      description="This route will provide cycle and month navigation plus read-only collection details for members."
    />
  );
}

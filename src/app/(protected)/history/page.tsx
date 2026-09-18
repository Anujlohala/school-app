import { History } from "lucide-react";
import { SectionPlaceholder } from "@/components/states/section-placeholder";

export default function HistoryPage() {
  return (
    <SectionPlaceholder
      icon={History}
      title="History"
      description="Completed months, cycles, winner history, and last-updated information will be available here."
    />
  );
}

import { CircleGauge } from "lucide-react";
import { SectionPlaceholder } from "@/components/states/section-placeholder";

export default function DashboardPage() {
  return (
    <SectionPlaceholder
      icon={CircleGauge}
      title="Dashboard"
      description="The authenticated dashboard will eventually summarize the current cycle, collections, savings, winner progress, and next meeting."
    />
  );
}

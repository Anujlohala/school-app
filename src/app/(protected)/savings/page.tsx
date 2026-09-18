import { Landmark } from "lucide-react";
import { SectionPlaceholder } from "@/components/states/section-placeholder";

export default function SavingsPage() {
  return (
    <SectionPlaceholder
      icon={Landmark}
      title="Saving fund"
      description="This route will separate received fixed saving, winner interest, extra contributions, carried balance, and pending saving."
    />
  );
}

import { Users } from "lucide-react";
import { SectionPlaceholder } from "@/components/states/section-placeholder";

export default function MembersPage() {
  return (
    <SectionPlaceholder
      icon={Users}
      title="Members and winners"
      description="The roster, winner order, winning month, and remaining eligibility will appear here."
    />
  );
}

import { ShieldCheck } from "lucide-react";
import { SectionPlaceholder } from "@/components/states/section-placeholder";

export default function AdminPage() {
  return (
    <SectionPlaceholder
      icon={ShieldCheck}
      role="Admin"
      title="Administration"
      description="Administrator-only cycle, winner, payment, meeting-date, and contribution tools will be implemented after authorization and database safeguards."
    />
  );
}

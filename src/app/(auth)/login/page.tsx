import type { Metadata } from "next";

import { LoginPlaceholder } from "@/components/states/login-placeholder";

export const metadata: Metadata = { title: "Member sign-in" };

export default function MemberLoginPage() {
  return <LoginPlaceholder audience="Member" />;
}

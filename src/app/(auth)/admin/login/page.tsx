import type { Metadata } from "next";

import { LoginPlaceholder } from "@/components/states/login-placeholder";

export const metadata: Metadata = { title: "Administrator sign-in" };

export default function AdminLoginPage() {
  return <LoginPlaceholder audience="Administrator" />;
}

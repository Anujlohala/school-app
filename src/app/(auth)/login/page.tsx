import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth/login-screen";
export const metadata: Metadata = { title: "Member sign-in" };
export default function MemberLoginPage() {
  return <LoginScreen />;
}

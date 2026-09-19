import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth/login-screen";
export const metadata: Metadata = { title: "Administrator sign-in" };
export default function AdminLoginPage() {
  return <LoginScreen admin />;
}

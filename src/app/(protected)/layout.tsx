import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

import { requireAccount } from "@/server/queries/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const account = await requireAccount();
  return <AppShell role={account.role}>{children}</AppShell>;
}

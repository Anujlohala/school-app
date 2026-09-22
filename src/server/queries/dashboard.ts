import "server-only";

import { buildDashboardData } from "@/domain/dashboard";
import { listCycles } from "@/server/queries/cycles";
import { listSavingFunds } from "@/server/queries/savings";

export async function getDashboardData(now = new Date()) {
  const [cycles, funds] = await Promise.all([listCycles(), listSavingFunds()]);
  return buildDashboardData(cycles, funds, kathmanduDate(now));
}

export function kathmanduDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kathmandu",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

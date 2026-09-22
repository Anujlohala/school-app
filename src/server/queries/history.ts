import "server-only";

import { buildHistoryData } from "@/domain/history";
import { listCycles } from "@/server/queries/cycles";
import { listSavingFunds } from "@/server/queries/savings";

export async function getHistoryData() {
  const [cycles, funds] = await Promise.all([listCycles(), listSavingFunds()]);
  return buildHistoryData(cycles, funds);
}

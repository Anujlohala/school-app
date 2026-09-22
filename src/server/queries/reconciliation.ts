import "server-only";

import { buildReconciliationData } from "@/domain/reconciliation";
import { requireAccount } from "@/server/queries/auth";
import { listCycles } from "@/server/queries/cycles";
import { listSavingFunds } from "@/server/queries/savings";

export async function getReconciliationData() {
  await requireAccount(true);
  const [cycles, funds] = await Promise.all([listCycles(), listSavingFunds()]);
  return buildReconciliationData(cycles, funds);
}

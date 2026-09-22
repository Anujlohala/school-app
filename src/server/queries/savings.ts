import "server-only";

import type { PaymentMethod } from "@/domain/payment";
import type { ExtraContribution, SavingFund } from "@/domain/saving";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAccount } from "./auth";

type SummaryRow = {
  cycle_id: string;
  cycle_number: number;
  fixed_saving_received: number;
  interest_received: number;
  extra_contributions: number;
  pending_fixed_saving: number;
  pending_interest: number;
  actual_cycle_saving: number;
  carried_from_previous_cycles: number;
  cumulative_balance: number;
};

type ContributionRow = {
  id: string;
  cycle_id: string;
  month_id: string | null;
  member_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

type MemberRow = { id: string; full_name: string };
type MonthRow = { id: string; month_number: number };

export async function listSavingFunds(): Promise<SavingFund[]> {
  await requireAccount();
  const supabase = await createSupabaseServerClient();
  const [summaryResult, contributionResult, memberResult, monthResult] =
    await Promise.all([
      supabase
        .from("saving_fund_summary")
        .select(
          "cycle_id,cycle_number,fixed_saving_received,interest_received,extra_contributions,pending_fixed_saving,pending_interest,actual_cycle_saving,carried_from_previous_cycles,cumulative_balance",
        )
        .order("cycle_number"),
      supabase
        .from("extra_contributions")
        .select(
          "id,cycle_id,month_id,member_id,amount,payment_method,reason,created_at,updated_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("members").select("id,full_name"),
      supabase.from("cycle_months").select("id,month_number"),
    ]);
  if (
    summaryResult.error ||
    contributionResult.error ||
    memberResult.error ||
    monthResult.error
  ) {
    console.error("savings.list failed", {
      summaryCode: summaryResult.error?.code,
      contributionCode: contributionResult.error?.code,
      memberCode: memberResult.error?.code,
      monthCode: monthResult.error?.code,
    });
    throw new Error("The saving fund could not be loaded. Please try again.");
  }
  const summaries = (summaryResult.data ?? []) as SummaryRow[];
  const contributions = (contributionResult.data ??
    []) as unknown as ContributionRow[];
  const members = new Map(
    ((memberResult.data ?? []) as MemberRow[]).map((member) => [
      member.id,
      member.full_name,
    ]),
  );
  const months = new Map(
    ((monthResult.data ?? []) as MonthRow[]).map((month) => [
      month.id,
      month.month_number,
    ]),
  );
  return summaries.map((summary) => ({
    cycleId: summary.cycle_id,
    cycleNumber: summary.cycle_number,
    fixedSavingReceived: summary.fixed_saving_received,
    interestReceived: summary.interest_received,
    extraContributions: summary.extra_contributions,
    pendingFixedSaving: summary.pending_fixed_saving,
    pendingInterest: summary.pending_interest,
    actualCycleSaving: summary.actual_cycle_saving,
    carriedFromPreviousCycles: summary.carried_from_previous_cycles,
    cumulativeBalance: summary.cumulative_balance,
    contributions: contributions
      .filter((contribution) => contribution.cycle_id === summary.cycle_id)
      .map((contribution): ExtraContribution => ({
        id: contribution.id,
        cycleId: contribution.cycle_id,
        monthId: contribution.month_id,
        monthNumber: contribution.month_id
          ? (months.get(contribution.month_id) ?? null)
          : null,
        memberId: contribution.member_id,
        memberName: members.get(contribution.member_id) ?? "Unknown member",
        amount: contribution.amount,
        paymentMethod: contribution.payment_method,
        reason: contribution.reason,
        createdAt: contribution.created_at,
        updatedAt: contribution.updated_at,
      })),
  }));
}

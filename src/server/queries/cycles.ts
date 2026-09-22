import "server-only";

import type { Cycle } from "@/domain/cycle";
import type { PaymentMethod } from "@/domain/payment";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAccount } from "./auth";

type CycleRow = {
  id: string;
  cycle_number: number;
  status: Cycle["status"];
  member_count: number;
  contribution_amount: number;
  fixed_saving_amount: number;
  interest_amount: number;
  started_on: string;
  updated_at: string;
};
type RosterRow = {
  cycle_id: string;
  member_id: string;
  display_order: number;
  members: { full_name: string; active: boolean } | null;
};
type MonthRow = {
  id: string;
  cycle_id: string;
  month_number: number;
  scheduled_date: string;
  date_overridden: boolean;
  status: Cycle["months"][number]["status"];
  winner_member_id: string | null;
  updated_at: string;
};
type PaymentRow = {
  id: string;
  month_id: string;
  member_id: string;
  dhukuti_due: number;
  fixed_saving_due: number;
  interest_due: number;
  total_due: number;
  payment_status: "pending" | "paid";
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  members: { full_name: string } | null;
};

export async function listCycles(): Promise<Cycle[]> {
  await requireAccount();
  const supabase = await createSupabaseServerClient();
  const { data: cycleRows, error: cycleError } = await supabase
    .from("cycles")
    .select(
      "id,cycle_number,status,member_count,contribution_amount,fixed_saving_amount,interest_amount,started_on,updated_at",
    )
    .order("cycle_number", { ascending: false });
  if (cycleError) {
    console.error("cycles.list failed", { code: cycleError.code });
    throw new Error("Cycle records could not be loaded. Please try again.");
  }
  const cycles = (cycleRows ?? []) as CycleRow[];
  if (!cycles.length) return [];
  const cycleIds = cycles.map((cycle) => cycle.id);
  const [rosterResult, monthResult, paymentResult] = await Promise.all([
    supabase
      .from("cycle_members")
      .select("cycle_id,member_id,display_order,members(full_name,active)")
      .in("cycle_id", cycleIds)
      .order("display_order"),
    supabase
      .from("cycle_months")
      .select(
        "id,cycle_id,month_number,scheduled_date,date_overridden,status,winner_member_id,updated_at",
      )
      .in("cycle_id", cycleIds)
      .order("month_number"),
    supabase
      .from("member_monthly_payments")
      .select(
        "id,month_id,member_id,dhukuti_due,fixed_saving_due,interest_due,total_due,payment_status,payment_method,paid_at,created_at,updated_at,members(full_name)",
      )
      .order("created_at"),
  ]);
  if (rosterResult.error || monthResult.error || paymentResult.error) {
    console.error("cycles.details failed", {
      rosterCode: rosterResult.error?.code,
      monthCode: monthResult.error?.code,
      paymentCode: paymentResult.error?.code,
    });
    throw new Error("Cycle details could not be loaded. Please try again.");
  }
  const roster = (rosterResult.data ?? []) as unknown as RosterRow[];
  const months = (monthResult.data ?? []) as MonthRow[];
  const payments = (paymentResult.data ?? []) as unknown as PaymentRow[];
  return cycles.map((cycle) => ({
    id: cycle.id,
    cycleNumber: cycle.cycle_number,
    status: cycle.status,
    memberCount: cycle.member_count,
    contributionAmount: cycle.contribution_amount,
    fixedSavingAmount: cycle.fixed_saving_amount,
    interestAmount: cycle.interest_amount,
    startedOn: cycle.started_on,
    updatedAt: cycle.updated_at,
    members: roster
      .filter((member) => member.cycle_id === cycle.id && member.members)
      .map((member) => ({
        memberId: member.member_id,
        fullName: member.members?.full_name ?? "Unknown member",
        active: member.members?.active ?? false,
        displayOrder: member.display_order,
      })),
    months: months
      .filter((month) => month.cycle_id === cycle.id)
      .map((month) => ({
        id: month.id,
        monthNumber: month.month_number,
        scheduledDate: month.scheduled_date,
        dateOverridden: month.date_overridden,
        status: month.status,
        updatedAt: month.updated_at,
        winnerMemberId: month.winner_member_id,
        winnerName:
          roster.find(
            (member) =>
              member.cycle_id === cycle.id &&
              member.member_id === month.winner_member_id,
          )?.members?.full_name ?? null,
        payments: payments
          .filter((payment) => payment.month_id === month.id)
          .sort(
            (left, right) =>
              (roster.find(
                (member) =>
                  member.cycle_id === cycle.id &&
                  member.member_id === left.member_id,
              )?.display_order ?? 99) -
              (roster.find(
                (member) =>
                  member.cycle_id === cycle.id &&
                  member.member_id === right.member_id,
              )?.display_order ?? 99),
          )
          .map((payment) => ({
            id: payment.id,
            memberId: payment.member_id,
            memberName: payment.members?.full_name ?? "Unknown member",
            dhukutiDue: payment.dhukuti_due,
            fixedSavingDue: payment.fixed_saving_due,
            interestDue: payment.interest_due,
            totalDue: payment.total_due,
            paymentStatus: payment.payment_status,
            paymentMethod: payment.payment_method,
            paidAt: payment.paid_at,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at,
          })),
      })),
  }));
}

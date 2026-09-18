import { describe, expect, it } from "vitest";
import {
  samplePayments,
  sampleSummary,
} from "@/features/dashboard/sample-data";

describe("dashboard sample reconciliation", () => {
  it("represents a complete Month 11 roster with full obligations", () => {
    expect(new Set(samplePayments.map((row) => row.winningMonth)).size).toBe(
      11,
    );
    expect(samplePayments.find((row) => row.winningMonth === 11)?.total).toBe(
      100,
    );
    expect(
      samplePayments
        .filter((row) => row.winningMonth < 11)
        .every((row) => row.total === 2300),
    ).toBe(true);
    expect(sampleSummary.received).toBe(16200);
    expect(sampleSummary.pending).toBe(6900);
    expect(sampleSummary.paidCount).toBe(8);
    expect(sampleSummary.dhukutiReceived).toBe(14000);
  });
  it("reconciles received savings plus pending savings against the full-cycle baseline", () => {
    const receivedSavings = sampleSummary.fixedSaving + sampleSummary.interest;
    expect(receivedSavings).toBe(22200);
    expect(receivedSavings + sampleSummary.pendingSaving).toBe(23100);
    expect(receivedSavings + sampleSummary.extra + sampleSummary.carried).toBe(
      22700,
    );
  });
});

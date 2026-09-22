import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Cycle } from "@/domain/cycle";
import type { ExtraContribution } from "@/domain/saving";
import {
  AddContributionForm,
  EditContributionForm,
} from "@/features/savings/contribution-forms";

const mock = vi.hoisted(() => ({ add: vi.fn(), update: vi.fn() }));
vi.mock("@/server/actions/savings", () => ({
  addExtraContribution: mock.add,
  updateExtraContribution: mock.update,
}));

const cycle: Cycle = {
  id: "10000000-0000-4000-8000-000000000000",
  cycleNumber: 1,
  status: "active",
  memberCount: 1,
  contributionAmount: 2000,
  fixedSavingAmount: 100,
  interestAmount: 200,
  startedOn: "2026-01-01",
  completedOn: null,
  updatedAt: "2026-09-22T00:00:00Z",
  members: [
    {
      memberId: "20000000-0000-4000-8000-000000000000",
      fullName: "Asha",
      active: true,
      displayOrder: 1,
    },
  ],
  months: [
    {
      id: "30000000-0000-4000-8000-000000000000",
      monthNumber: 1,
      scheduledDate: "2026-01-31",
      dateOverridden: false,
      status: "open",
      updatedAt: "2026-09-22T00:00:00Z",
      winnerMemberId: null,
      winnerName: null,
      payments: [],
    },
  ],
};

const contribution: ExtraContribution = {
  id: "40000000-0000-4000-8000-000000000000",
  cycleId: cycle.id,
  monthId: cycle.months[0]!.id,
  monthNumber: 1,
  memberId: cycle.members[0]!.memberId,
  memberName: "Asha",
  amount: 500,
  paymentMethod: "cash",
  reason: "Community support",
  createdAt: "2026-09-22T00:00:00Z",
  updatedAt: "2026-09-22T00:00:00Z",
};

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe("extra contribution forms", () => {
  it("submits contributor, optional month, amount, method, and reason", async () => {
    mock.add.mockResolvedValue({ ok: true, message: "Recorded" });
    render(<AddContributionForm cycle={cycle} />);
    fireEvent.change(screen.getByLabelText("Contributor"), {
      target: { value: cycle.members[0]!.memberId },
    });
    fireEvent.change(screen.getByLabelText("Related month (optional)"), {
      target: { value: cycle.months[0]!.id },
    });
    fireEvent.change(screen.getByLabelText("Amount (NPR)"), {
      target: { value: "500" },
    });
    fireEvent.change(screen.getByLabelText("Payment method"), {
      target: { value: "esewa" },
    });
    fireEvent.change(screen.getByLabelText("Public reason (optional)"), {
      target: { value: "Community support" },
    });
    const form = screen
      .getByRole("button", { name: "Record contribution" })
      .closest("form")!;
    await act(async () => fireEvent.submit(form));
    const submitted = mock.add.mock.calls[0]?.[2] as FormData;
    expect(submitted.get("memberId")).toBe(cycle.members[0]!.memberId);
    expect(submitted.get("monthId")).toBe(cycle.months[0]!.id);
    expect(submitted.get("amount")).toBe("500");
    expect(submitted.get("paymentMethod")).toBe("esewa");
  });

  it("submits correction fields for an existing contribution", async () => {
    mock.update.mockResolvedValue({ ok: true, message: "Updated" });
    render(<EditContributionForm contribution={contribution} />);
    fireEvent.change(screen.getByLabelText("Amount (NPR)"), {
      target: { value: "600" },
    });
    fireEvent.change(screen.getByLabelText("Payment method"), {
      target: { value: "bank_transfer" },
    });
    const form = screen
      .getByRole("button", { name: "Save correction" })
      .closest("form")!;
    await act(async () => fireEvent.submit(form));
    expect(mock.update).toHaveBeenCalledWith(
      contribution.id,
      contribution.updatedAt,
      expect.anything(),
      expect.any(FormData),
    );
  });
});

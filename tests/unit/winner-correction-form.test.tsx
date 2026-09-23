import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WinnerCorrectionForm } from "@/features/months/winner-correction-form";

const mock = vi.hoisted(() => ({ correct: vi.fn() }));
vi.mock("@/server/actions/winners", () => ({
  correctMonthWinner: mock.correct,
}));

const replacement = {
  memberId: "20000000-0000-4000-8000-000000000000",
  fullName: "Raj Dhaubanjar",
  active: true,
  displayOrder: 2,
};
const props = {
  monthId: "30000000-0000-4000-8000-000000000000",
  monthNumber: 10,
  updatedAt: "2026-09-23T00:00:00.123456+00:00",
  currentWinnerMemberId: "10000000-0000-4000-8000-000000000000",
  currentWinnerName: "Siddhartha Suwal",
  members: [replacement],
  receivedPaymentCount: 0,
};

beforeEach(() => {
  vi.resetAllMocks();
  mock.correct.mockResolvedValue({ ok: true, message: "Corrected" });
});
afterEach(cleanup);

describe("winner correction confirmation", () => {
  it("requires a reviewed replacement before submitting", async () => {
    render(<WinnerCorrectionForm {...props} />);
    fireEvent.click(screen.getByText("Edit winner"));
    const select = screen.getByLabelText("Correct winner");
    const checkbox = screen.getByRole("checkbox");
    const button = screen.getByRole("button", {
      name: "Save winner correction",
    });
    expect(button).toBeDisabled();
    fireEvent.change(select, { target: { value: replacement.memberId } });
    fireEvent.click(checkbox);
    expect(button).toBeEnabled();
    await act(async () => fireEvent.submit(button.closest("form")!));
    expect(mock.correct).toHaveBeenCalledWith(
      props.monthId,
      props.currentWinnerMemberId,
      props.updatedAt,
      expect.anything(),
      expect.any(FormData),
    );
  });

  it("blocks editing while an affected payment is received", () => {
    render(<WinnerCorrectionForm {...props} receivedPaymentCount={2} />);
    fireEvent.click(screen.getByText("Edit winner"));
    expect(screen.getByText(/Return the 2 received payments/)).toBeVisible();
    expect(screen.queryByLabelText("Correct winner")).not.toBeInTheDocument();
  });
});

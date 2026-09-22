import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ActivateCycleForm,
  CompleteCycleForm,
} from "@/features/cycles/cycle-actions";
import { CycleSetupForm } from "@/features/cycles/cycle-setup-form";

const mock = vi.hoisted(() => ({
  save: vi.fn(),
  activate: vi.fn(),
  complete: vi.fn(),
}));
vi.mock("@/server/actions/cycles", () => ({
  saveCycleDraft: mock.save,
  activateCycle: mock.activate,
  completeCycle: mock.complete,
  overrideMeetingDate: vi.fn(),
}));

const members = Array.from({ length: 11 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  full_name: `Member ${index}`,
  active: true,
  updated_at: "2026-09-22T00:00:00Z",
}));
const cycleId = "10000000-0000-4000-8000-000000000000";

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe("draft form recovery", () => {
  it("preserves all edited amounts after failure and submits them on retry", async () => {
    const submissions: string[][] = [];
    mock.save.mockImplementation(
      async (_id, _version, _previous, form: FormData) => {
        submissions.push(
          ["contributionAmount", "fixedSavingAmount", "interestAmount"].map(
            (name) => String(form.get(name)),
          ),
        );
        return {
          ok: false,
          message: "Could not save the cycle. Please try again.",
        };
      },
    );
    render(<CycleSetupForm activeMembers={members} draft={undefined} />);
    fireEvent.change(screen.getByLabelText("Starting month"), {
      target: { value: "2026-09" },
    });
    const amounts = [
      screen.getByLabelText("Dhukuti contribution (NPR)"),
      screen.getByLabelText("Fixed saving (NPR)"),
      screen.getByLabelText("Winner interest (NPR)"),
    ];
    const values = ["3000", "150", "250"];
    amounts.forEach((input, index) =>
      fireEvent.change(input, { target: { value: values[index] } }),
    );
    const form = screen
      .getByRole("button", { name: "Save draft cycle" })
      .closest("form")!;
    await act(async () => fireEvent.submit(form));
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
    amounts.forEach((input, index) =>
      expect(input).toHaveValue(Number(values[index])),
    );
    await act(async () => fireEvent.submit(form));
    expect(submissions).toEqual([values, values]);
  });
});

describe("activation confirmation", () => {
  it("requires a new confirmation after the reviewed draft version changes", async () => {
    mock.activate.mockResolvedValue({ ok: true, message: "Activated" });
    const initialVersion = "2026-09-22T00:00:00.123456+00:00";
    const updatedVersion = "2026-09-22T00:00:01.654321+00:00";
    const { rerender } = render(
      <ActivateCycleForm cycleId={cycleId} updatedAt={initialVersion} />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(
      screen.getByRole("button", { name: "Activate cycle" }),
    ).toBeDisabled();
    fireEvent.click(checkbox);
    expect(
      screen.getByRole("button", { name: "Activate cycle" }),
    ).toBeEnabled();
    // Unrelated re-renders should preserve the review of the same version.
    rerender(
      <ActivateCycleForm cycleId={cycleId} updatedAt={initialVersion} />,
    );
    expect(checkbox).toBeChecked();
    rerender(
      <ActivateCycleForm cycleId={cycleId} updatedAt={updatedVersion} />,
    );
    expect(checkbox).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Activate cycle" }),
    ).toBeDisabled();
    fireEvent.click(checkbox);
    await act(async () => fireEvent.submit(checkbox.closest("form")!));
    expect(mock.activate).toHaveBeenCalledWith(
      cycleId,
      updatedVersion,
      expect.anything(),
      expect.any(FormData),
    );
    const submittedForm = mock.activate.mock.calls[0]?.[3] as FormData;
    expect(submittedForm.get("confirmation")).toBe("confirmed");
  });

  it("does not carry confirmation to a different cycle", () => {
    const updatedAt = "2026-09-22T00:00:00Z";
    const { rerender } = render(
      <ActivateCycleForm cycleId={cycleId} updatedAt={updatedAt} />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    rerender(
      <ActivateCycleForm
        cycleId="20000000-0000-4000-8000-000000000000"
        updatedAt={updatedAt}
      />,
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Activate cycle" }),
    ).toBeDisabled();
  });

  it("explains and disables activation while another cycle is active", () => {
    render(
      <ActivateCycleForm
        cycleId={cycleId}
        updatedAt="2026-09-22T00:00:00Z"
        blockedByCycleNumber={1}
      />,
    );
    expect(screen.getByText(/Complete active Cycle 1/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Activate cycle" }),
    ).toBeDisabled();
  });
});

describe("completion confirmation", () => {
  it("ties confirmation to the reviewed financial version", async () => {
    mock.complete.mockResolvedValue({ ok: true, message: "Completed" });
    const first = "2026-09-22T00:00:02Z";
    const second = "2026-09-22T00:00:03Z";
    const { rerender } = render(
      <CompleteCycleForm cycleId={cycleId} reviewVersion={first} />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(
      screen.getByRole("button", { name: "Complete cycle" }),
    ).toBeEnabled();
    rerender(<CompleteCycleForm cycleId={cycleId} reviewVersion={second} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () =>
      fireEvent.submit(screen.getByRole("checkbox").closest("form")!),
    );
    expect(mock.complete).toHaveBeenCalledWith(
      cycleId,
      second,
      expect.anything(),
      expect.any(FormData),
    );
  });
});

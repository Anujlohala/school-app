import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WinnerForm } from "@/features/months/winner-form";

const mock = vi.hoisted(() => ({ record: vi.fn() }));
vi.mock("@/server/actions/winners", () => ({ recordMonthWinner: mock.record }));

const members = [
  {
    memberId: "10000000-0000-4000-8000-000000000000",
    fullName: "Asha",
    active: true,
    displayOrder: 1,
  },
  {
    memberId: "20000000-0000-4000-8000-000000000000",
    fullName: "Bina",
    active: true,
    displayOrder: 2,
  },
];
const firstMemberId = members[0]!.memberId;
const secondMemberId = members[1]!.memberId;

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe("winner confirmation", () => {
  it.each([
    {
      change: "month version",
      monthId: "30000000-0000-4000-8000-000000000000",
      updatedAt: "2026-09-22T01:00:00.123456+00:00",
    },
    {
      change: "month identity",
      monthId: "40000000-0000-4000-8000-000000000000",
      updatedAt: "2026-09-22T00:00:00.123456+00:00",
    },
  ])(
    "requires a fresh review when the $change changes",
    async ({ monthId, updatedAt }) => {
      mock.record.mockResolvedValue({ ok: true, message: "Saved" });
      const initialProps = {
        monthId: "30000000-0000-4000-8000-000000000000",
        updatedAt: "2026-09-22T00:00:00.123456+00:00",
        members,
      };
      const { rerender } = render(<WinnerForm {...initialProps} />);
      fireEvent.change(screen.getByLabelText("Chitta winner"), {
        target: { value: firstMemberId },
      });
      const checkbox = screen.getByRole("checkbox");
      const button = screen.getByRole("button", {
        name: "Record winner and obligations",
      });
      fireEvent.click(checkbox);
      rerender(<WinnerForm {...initialProps} />);
      expect(checkbox).toBeChecked();
      expect(button).toBeEnabled();

      rerender(
        <WinnerForm
          {...initialProps}
          monthId={monthId}
          updatedAt={updatedAt}
        />,
      );
      expect(checkbox).not.toBeChecked();
      expect(button).toBeDisabled();
      expect(mock.record).not.toHaveBeenCalled();
      fireEvent.click(checkbox);
      await act(async () => fireEvent.submit(button.closest("form")!));
      expect(mock.record).toHaveBeenCalledWith(
        monthId,
        updatedAt,
        expect.anything(),
        expect.any(FormData),
      );
      const submitted = mock.record.mock.calls[0]?.[3] as FormData;
      expect(submitted.get("winnerMemberId")).toBe(firstMemberId);
      expect(submitted.get("confirmation")).toBe("confirmed");
    },
  );

  it("requires a fresh confirmation when the selected winner changes", async () => {
    mock.record.mockResolvedValue({ ok: true, message: "Saved" });
    render(
      <WinnerForm
        monthId="30000000-0000-4000-8000-000000000000"
        updatedAt="2026-09-22T00:00:00Z"
        members={members}
      />,
    );
    const select = screen.getByLabelText("Chitta winner");
    const checkbox = screen.getByRole("checkbox");
    const button = screen.getByRole("button", {
      name: "Record winner and obligations",
    });
    expect(button).toBeDisabled();
    fireEvent.change(select, { target: { value: firstMemberId } });
    fireEvent.click(checkbox);
    expect(button).toBeEnabled();
    fireEvent.change(select, { target: { value: secondMemberId } });
    expect(checkbox).not.toBeChecked();
    expect(button).toBeDisabled();
    fireEvent.click(checkbox);
    await act(async () => fireEvent.submit(button.closest("form")!));
    const submitted = mock.record.mock.calls[0]?.[3] as FormData;
    expect(submitted.get("winnerMemberId")).toBe(secondMemberId);
    expect(submitted.get("confirmation")).toBe("confirmed");
  });
});

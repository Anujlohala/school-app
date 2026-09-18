// Fictional preview records only; never a production fallback.
export type SamplePayment = {
  id: number;
  name: string;
  winningMonth: number;
  dhukuti: number;
  saving: number;
  interest: number;
  total: number;
  paid: boolean;
  method: string | null;
};
const names = [
  "Aarav Sharma",
  "Bikash Thapa",
  "Chirag Shrestha",
  "Deepak Karki",
  "Gaurav Basnet",
  "Kiran Adhikari",
  "Manish Rai",
  "Nabin Pandey",
  "Pratik Gurung",
  "Suman Poudel",
  "Rohan Joshi",
];
export const samplePayments: SamplePayment[] = names.map((name, index) => {
  const winner = index === 10;
  const paid = index < 7 || winner;
  const dhukuti = winner ? 0 : 2000;
  const saving = 100;
  const interest = winner ? 0 : 200;
  return {
    id: index + 1,
    name,
    winningMonth: index + 1,
    dhukuti,
    saving,
    interest,
    total: dhukuti + saving + interest,
    paid,
    method: paid
      ? (["eSewa", "Bank transfer", "Cash"][index % 3] ?? "Cash")
      : null,
  };
});
// All obligations in the first ten sample months were received.
const historical = Array.from({ length: 10 }, (_, month) =>
  names.map((_, member) => ({
    saving: 100,
    interest: member < month ? 200 : 0,
  })),
).flat();
const received = samplePayments.filter((row) => row.paid);
const pending = samplePayments.filter((row) => !row.paid);
export const sampleSummary = {
  received: received.reduce((sum, row) => sum + row.total, 0),
  pending: pending.reduce((sum, row) => sum + row.total, 0),
  paidCount: received.length,
  fixedSaving:
    historical.reduce((sum, row) => sum + row.saving, 0) +
    received.reduce((sum, row) => sum + row.saving, 0),
  interest:
    historical.reduce((sum, row) => sum + row.interest, 0) +
    received.reduce((sum, row) => sum + row.interest, 0),
  extra: 500,
  carried: 0,
  pendingSaving: pending.reduce(
    (sum, row) => sum + row.saving + row.interest,
    0,
  ),
  dhukutiReceived: received.reduce((sum, row) => sum + row.dhukuti, 0),
};

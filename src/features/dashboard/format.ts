export function npr(amount: number) {
  return `NPR ${new Intl.NumberFormat("en-IN").format(amount)}`;
}

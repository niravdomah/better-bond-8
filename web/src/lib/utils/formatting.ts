/**
 * Format a number as South African Rand (ZAR).
 * Uses space as thousands separator and comma as decimal separator.
 * Example: 1234567.89 => "R 1 234 567,89"
 */
export function formatCurrency(value: number): string {
  const fixed = value.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const isNegative = intPart.startsWith("-");
  const absInt = isNegative ? intPart.slice(1) : intPart;
  const withSpaces = absInt.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R${isNegative ? " -" : " "}${withSpaces},${decPart}`;
}

/**
 * Format a percentage value.
 * Example: 0.945 => "0.945%"
 */
export function formatPercentage(value: number): string {
  return `${value}%`;
}

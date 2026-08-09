/**
 * Salary band definitions (annual INR). MUST match the contract
 * (`confidential_salary_benchmarking.compact`) exactly — the frontend uses them
 * to derive the band a contributed salary maps to, and to render band
 * ranges computed on-chain.
 */
export const SALARY_BANDS: readonly { readonly low: bigint; readonly high: bigint; readonly label: string }[] = [
  { low: 1n, high: 300000n, label: '₹0 – ₹3L' },
  { low: 300000n, high: 500000n, label: '₹3L – ₹5L' },
  { low: 500000n, high: 800000n, label: '₹5L – ₹8L' },
  { low: 800000n, high: 1200000n, label: '₹8L – ₹12L' },
  { low: 1200000n, high: 1800000n, label: '₹12L – ₹18L' },
  { low: 1800000n, high: 2500000n, label: '₹18L – ₹25L' },
  { low: 2500000n, high: 4000000n, label: '₹25L – ₹40L' },
  { low: 4000000n, high: 100000000n, label: '₹40L+' },
];

export const MIN_BAND = 0;
export const MAX_BAND = SALARY_BANDS.length - 1;

/** Largest salary the contract accepts (Uint constrained in `submitSalaryContribution`). */
export const MAX_SALARY = 1_000_000_000n;

/** Maximum years of experience the contract accepts. */
export const MAX_EXPERIENCE_YEARS = 50n;

export function bandForSalary(salary: bigint): number {
  for (let b = 0; b < SALARY_BANDS.length; b++) {
    const band = SALARY_BANDS[b]!;
    if (salary >= band.low && salary <= band.high) return b;
  }
  return MAX_BAND;
}

export function isValidBand(band: number): boolean {
  return Number.isInteger(band) && band >= MIN_BAND && band <= MAX_BAND;
}

export function bandLabel(band: bigint | number | undefined): string {
  const index = Number(band);
  if (Number.isNaN(index) || index < MIN_BAND || index > MAX_BAND) return '—';
  return SALARY_BANDS[index]!.label;
}

export function formatInr(amount: bigint | number): string {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}
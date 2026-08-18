/*
 * Guards the frontend's salary-band model (frontend/src/lib/bands.ts) against
 * drifting from the contract's fixed INR bands
 * (contracts/confidential_salary_benchmarking.compact).
 *
 * The contract validates salaries against these exact boundaries
 * (validateBand), so the UI must map a salary to exactly the band the contract
 * will accept it in — otherwise the same input would be rendered differently
 * than it is proven on-chain.
 */
import { describe, expect, it } from 'vitest';
import {
  bandForSalary,
  bandLabel,
  SALARY_BANDS,
  MIN_BAND,
  MAX_BAND,
  MAX_SALARY,
  MAX_EXPERIENCE_YEARS,
  isValidBand,
  formatInr,
} from '../frontend/src/lib/bands';

// Must match the contract's validateBand arrays exactly.
const CONTRACT_BAND_LOWS = [1n, 300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n];
const CONTRACT_BAND_HIGHS = [300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n, 100000000n];

describe('salary band model (frontend/src/lib/bands.ts)', () => {
  it('keeps the band boundaries in lock-step with the contract', () => {
    expect(SALARY_BANDS).toHaveLength(CONTRACT_BAND_LOWS.length);
    for (let i = 0; i < SALARY_BANDS.length; i++) {
      expect(SALARY_BANDS[i]!.low).toBe(CONTRACT_BAND_LOWS[i]);
      expect(SALARY_BANDS[i]!.high).toBe(CONTRACT_BAND_HIGHS[i]);
    }
  });

  it('maps every band boundary to a band the contract accepts it in', () => {
    for (let i = 0; i < SALARY_BANDS.length; i++) {
      const low = SALARY_BANDS[i]!.low;
      const high = SALARY_BANDS[i]!.high;
      // Both bands include a shared boundary, and `bandForSalary` takes the
      // first match. For band 0 the low edge is uniquely its own; for every
      // other band the low edge is the previous band's inclusive high edge.
      expect(bandForSalary(low)).toBe(i === 0 ? 0 : i - 1);
      // The inclusive high edge lands in band i (its own band), except for the
      // top band whose high edge is the contract ceiling.
      expect(bandForSalary(high)).toBe(i);
    }
    // Every boundary value the UI maps must be accepted by the contract's
    // validateBand for the band the UI claims. Spot-check a few.
    expect(bandForSalary(300000n)).toBe(0); // 1 ≤ 300000 ≤ 300000 (band 0)
    expect(bandForSalary(4000000n)).toBe(6); // 2500000 ≤ 4000000 ≤ 4000000 (band 6)
  });

  it('maps interior salaries to the correct coarse band', () => {
    expect(bandForSalary(50000n)).toBe(0);
    expect(bandForSalary(400000n)).toBe(1);
    expect(bandForSalary(650000n)).toBe(2);
    expect(bandForSalary(950000n)).toBe(3);
    expect(bandForSalary(1_500_000n)).toBe(4);
    expect(bandForSalary(2_000_000n)).toBe(5);
    expect(bandForSalary(3_000_000n)).toBe(6);
    expect(bandForSalary(10_000_000n)).toBe(7);
  });

  it('caps the contract maximum salary and experience in the UI model', () => {
    // The contract rejects salaries above 1e9 INR and experience above 50.
    expect(MAX_SALARY).toBe(1_000_000_000n);
    expect(MAX_EXPERIENCE_YEARS).toBe(50n);
    // A salary above the contract ceiling still resolves to the top band,
    // but the UI form blocks it via MAX_SALARY before it reaches the contract.
    expect(bandForSalary(MAX_SALARY)).toBe(MAX_BAND);
  });

  it('renders band labels and INR amounts without leaking precision', () => {
    expect(bandLabel(3)).toBe('₹8L – ₹12L');
    expect(bandLabel(7)).toBe('₹40L+');
    // Out-of-range / missing bands render as an em dash, never a fake value.
    expect(bandLabel(8)).toBe('—');
    expect(bandLabel(-1)).toBe('—');
    expect(bandLabel(undefined)).toBe('—');
    expect(bandLabel(3n)).toBe('₹8L – ₹12L');
    expect(formatInr(1200000)).toBe('₹12,00,000');
  });

  it('validates band indices for the fixed 8-band model', () => {
    expect(isValidBand(MIN_BAND)).toBe(true);
    expect(isValidBand(MAX_BAND)).toBe(true);
    expect(isValidBand(8)).toBe(false);
    expect(isValidBand(-1)).toBe(false);
    expect(isValidBand(1.5)).toBe(false);
    expect(SALARY_BANDS.length).toBe(8);
  });
});

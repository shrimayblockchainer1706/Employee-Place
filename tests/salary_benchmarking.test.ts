import { describe, it, expect, beforeEach } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Buffer } from 'buffer';
import {
  SalaryPoolSimulator,
  type BenchmarkView,
} from './simulator.js';
import {
  createSalaryPoolPrivateState,
  withContributorKey,
  withSalary,
  withYearsOfExperience,
  type SalaryPoolPrivateState,
} from '../src/witnesses.js';

setNetworkId('undeployed');

const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

// BigInt-safe JSON so the whole public ledger can be stringified for
// privacy assertions (the real ledger is CBOR-encoded on-chain).
const stringifyLedger = (value: unknown): string =>
  JSON.stringify(value, (_key, val) =>
    typeof val === 'bigint' ? `${val}n` : val instanceof Uint8Array ? Array.from(val).join(',') : val,
  );

// Salary bands [low, high] (annual INR) — must match the contract exactly.
const BAND_LOWS = [1n, 300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n];
const BAND_HIGHS = [300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n, 100000000n];

const THRESHOLD = 5n;

/** A private state holding a salary in `band` with a per-test-fresh key. */
const privateStateWithBand = (band: number): SalaryPoolPrivateState => {
  const mid = (BAND_LOWS[band] + BAND_HIGHS[band]) / 2n;
  return withYearsOfExperience(
    withSalary(withContributorKey(createSalaryPoolPrivateState(), randomBytes(32)), mid),
    3n,
  );
};

const DEFAULT_SALARY = 950000n; // band 3 (₹8L–₹12L)

const stateWithSalary = (
  salary: bigint,
  years: bigint,
  key: Uint8Array = randomBytes(32),
): SalaryPoolPrivateState =>
  withYearsOfExperience(withSalary(withContributorKey(createSalaryPoolPrivateState(), key), salary), years);

describe('Confidential Salary Benchmarking Pool smart contract', () => {
  let sim: SalaryPoolSimulator;

  beforeEach(() => {
    sim = new SalaryPoolSimulator(
      stateWithSalary(DEFAULT_SALARY, 3n),
    );
  });

  it('generates a deterministic, empty initial ledger state', () => {
    const ledgerState = sim.getLedger();
    expect(ledgerState.pools.isEmpty()).toBe(true);
    expect(ledgerState.round).toEqual(1n);
  });

  it('lets anyone open a category; the label is public', () => {
    const ledgerState = sim.openCategory(0n, 'Software Engineer / Bengaluru');
    expect(ledgerState.pools.member(0n)).toBe(true);
    const pool = ledgerState.pools.lookup(0n);
    expect(pool.name).toEqual('Software Engineer / Bengaluru');
    expect(pool.open).toBe(true);
    expect(pool.contributorCount).toEqual(0n);
    expect(pool.totalContributions).toEqual(0n);
    expect(pool.benchmarkAvailable).toBe(false);
    // An empty histogram, not a leaked data point.
    expect(pool.binCounts).toEqual([0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]);
  });

  it('rejects opening the same category twice', () => {
    sim.openCategory(1n, 'Data Scientist / Pune');
    expect(() => sim.openCategory(1n, 'Duplicate')).toThrow('Category already open');
  });

  it('rejects a category id out of range', () => {
    expect(() => sim.openCategory(6n, 'Out of range')).toThrow('Category id out of range');
    expect(() => sim.openCategory(99n, 'Out of range')).toThrow('Category id out of range');
  });

  it('rejects a contribution to a category that is not open', () => {
    expect(() => sim.submitSalaryContribution(0n, 3n)).toThrow('Category is not open');
  });

  it('records a private salary only as a coarse histogram count, never its value', () => {
    const key = randomBytes(32);
    sim.setPrivateState(stateWithSalary(1_500_000n, 5n, key)); // band 4 (₹12L–₹18L)
    sim.openCategory(0n, 'Software Engineer / Chennai');

    const ledgerState = sim.submitSalaryContribution(0n, 4n);
    const pool = ledgerState.pools.lookup(0n);

    // Aggregate numbers only — no individual record.
    expect(pool.contributorCount).toEqual(1n);
    expect(pool.totalContributions).toEqual(1n);
    expect(pool.binCounts).toEqual([0n, 0n, 0n, 0n, 1n, 0n, 0n, 0n]);

    // The exact salary never appears anywhere in the public ledger.
    const serialized = stringifyLedger(ledgerState);
    expect(serialized).not.toContain('1500000');
    expect(serialized).not.toContain(Array.from(key).join(','));
  });

  it('rejects a salary that does not fall in the claimed public band', () => {
    sim.openCategory(0n, 'Product Manager / Delhi');
    // The default private salary is ₹9.5L — that lives in band 3 (₹8L–₹12L).
    // Claiming band 4 (₹12L–₹18L) must fail the internal consistency check.
    expect(() => sim.submitSalaryContribution(0n, 4n)).toThrow('Salary does not match selected band');
  });

  it('rejects an out-of-range salary', () => {
    sim.openCategory(0n, 'Product Manager / Delhi');
    // Salary below the minimum (1 INR) is out of range.
    sim.setPrivateState(stateWithSalary(0n, 3n));
    expect(() => sim.submitSalaryContribution(0n, 0n)).toThrow('Salary out of valid range');
    // Salary above the documented ceiling (1B INR) is out of range too.
    sim.setPrivateState(stateWithSalary(2_000_000_000n, 3n));
    expect(() => sim.submitSalaryContribution(0n, 7n)).toThrow('Salary out of valid range');
  });

  it('rejects an implausibly high years-of-experience value', () => {
    sim.openCategory(0n, 'Product Manager / Delhi');
    sim.setPrivateState(stateWithSalary(DEFAULT_SALARY, 51n));
    expect(() => sim.submitSalaryContribution(0n, 3n)).toThrow('Years of experience out of valid range');
  });

  it('rejects duplicate contributions from the same contributor key', () => {
    const key = randomBytes(32);
    sim.setPrivateState(stateWithSalary(DEFAULT_SALARY, 3n, key));
    sim.openCategory(0n, 'QA Engineer / Hyderabad');

    sim.submitSalaryContribution(0n, 3n);
    expect(() => sim.submitSalaryContribution(0n, 3n)).toThrow('Duplicate contribution from the same contributor');
  });

  it('allows the same contributor key in two different categories', () => {
    const key = randomBytes(32);
    sim.setPrivateState(stateWithSalary(DEFAULT_SALARY, 3n, key));
    sim.openCategory(0n, 'Software Engineer / Bengaluru');
    sim.openCategory(1n, 'Data Scientist / Pune');

    sim.submitSalaryContribution(0n, 3n);
    const ledgerState = sim.submitSalaryContribution(1n, 3n);
    expect(ledgerState.pools.lookup(0n).contributorCount).toEqual(1n);
    expect(ledgerState.pools.lookup(1n).contributorCount).toEqual(1n);
  });

  it('rejects an invalid band index', () => {
    sim.openCategory(0n, 'Software Engineer / Bengaluru');
    expect(() => sim.submitSalaryContribution(0n, 8n)).toThrow('Invalid salary band');
  });

  it('enforces a per-category contributor cap', () => {
    sim.openCategory(0n, 'Product Manager / Delhi');
    // 20 distinct contributors (cap is 20).
    for (let i = 0; i < 20; i++) {
      sim.setPrivateState(privateStateWithBand(i % 8));
      sim.submitSalaryContribution(0n, BigInt(i % 8));
    }
    // 21st is rejected.
    sim.setPrivateState(privateStateWithBand(3));
    expect(() => sim.submitSalaryContribution(0n, 3n)).toThrow('Category is full');
  });

  it('refuses to publish a benchmark below the anonymity threshold', () => {
    sim.openCategory(0n, 'Software Engineer / Bengaluru');
    for (let i = 0; i < 4; i++) {
      sim.setPrivateState(privateStateWithBand(i));
      sim.submitSalaryContribution(0n, BigInt(i));
    }
    expect(() => sim.updateBenchmark(0n)).toThrow('Not enough contributors to publish a benchmark');

    const view = sim.getBenchmark(0n);
    expect(view.available).toBe(false);
    expect(view.contributorCount).toEqual(4n);
  });

  it('publishes coarse quantile BANDS only once the threshold is reached', () => {
    sim.openCategory(0n, 'Data Engineer / Hyderabad');
    // Five contributors spread across bands 1–5 → histogram [0,1,1,1,1,1,0,0].
    for (let i = 1; i <= 5; i++) {
      sim.setPrivateState(privateStateWithBand(i));
      sim.submitSalaryContribution(0n, BigInt(i));
    }

    const ledgerState = sim.updateBenchmark(0n);
    const pool = ledgerState.pools.lookup(0n);
    expect(pool.benchmarkAvailable).toBe(true);
    // p25 = first band with 4·cum ≥ 5, median = first band with 2·cum > 5,
    // p75 = first band with 4·cum ≥ 15.
    expect(pool.p25Bin).toEqual(2n);
    expect(pool.medianBin).toEqual(3n);
    expect(pool.p75Bin).toEqual(4n);

    const view = sim.getBenchmark(0n);
    expect(view.available).toBe(true);
    expect(view.contributorCount).toEqual(5n);
    expect(view.medianBin).toEqual(3n);
    expect(view.p25Bin).toEqual(2n);
    expect(view.p75Bin).toEqual(4n);
  });

  it('reports contributor count even before the threshold is reached', () => {
    sim.openCategory(0n, 'Software Engineer / Bengaluru');
    sim.setPrivateState(privateStateWithBand(2));
    sim.submitSalaryContribution(0n, 2n);
    expect(sim.getContributorCount(0n)).toEqual(1n);
    expect(sim.getContributorCount(3n)).toEqual(0n); // unopened category
  });

  it('keeps the secret key irreversibly hidden — only a nullifier commitment is stored', () => {
    const key = randomBytes(32);
    sim.setPrivateState(stateWithSalary(DEFAULT_SALARY, 3n, key));
    sim.openCategory(0n, 'Software Engineer / Bengaluru');
    const ledgerState = sim.submitSalaryContribution(0n, 3n);

    const pool = ledgerState.pools.lookup(0n);
    expect(pool.nullifiers[0].length).toEqual(32);
    // The raw key must never be the stored commitment; it is a one-way hash.
    expect(hex(pool.nullifiers[0])).not.toEqual(hex(key));
    // The same key in a different category produces a different nullifier.
    sim.openCategory(1n, 'Data Scientist / Pune');
    const other = sim.submitSalaryContribution(1n, 3n);
    expect(hex(other.pools.lookup(1n).nullifiers[0])).not.toEqual(hex(pool.nullifiers[0]));
  });
});
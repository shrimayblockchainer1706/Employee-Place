/*
 * Tests the frontend's public-ledger projection (frontend/src/lib/ledger.ts) —
 * the exact code path that turns the network indexer's contract state into the
 * "Salary Pools" UI.
 *
 * Real on-chain ledger data is produced with the same compiled-contract
 * simulator used by the contract suite (tests/simulator.ts); only the
 * `queryContractState` transport is faked, mirroring what the indexer returns.
 */
import { describe, expect, it } from 'vitest';
import type { PublicDataProvider } from '@midnight-ntwrk/midnight-js-types';
import { SalaryPoolSimulator } from './simulator.js';
import { queryLedgerState } from '../frontend/src/lib/ledger';
import {
  createSalaryPoolPrivateState,
  withContributorKey,
  withSalary,
  withYearsOfExperience,
  type SalaryPoolPrivateState,
} from '../src/witnesses.js';

const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const stateWithSalary = (
  salary: bigint,
  years: bigint,
  key: Uint8Array = randomBytes(32),
): SalaryPoolPrivateState =>
  withYearsOfExperience(withSalary(withContributorKey(createSalaryPoolPrivateState(), key), salary), years);

/** Wraps a simulator's current raw contract state as an indexer-style response. */
const providerFromSimulator = (sim: SalaryPoolSimulator): PublicDataProvider =>
  ({
    queryContractState: async () => ({
      data: sim.circuitContext.currentQueryContext.state,
    }),
  }) as unknown as PublicDataProvider;

const CONTRACT_ADDRESS = '0xcafe';

describe('queryLedgerState — frontend ledger projection', () => {
  it('returns null when the indexer has no contract state', async () => {
    const provider = {
      queryContractState: async () => null,
    } as unknown as PublicDataProvider;
    expect(await queryLedgerState(provider, CONTRACT_ADDRESS)).toBeNull();
  });

  it('flattens an empty ledger into an empty pool list with the round', async () => {
    const sim = new SalaryPoolSimulator(stateWithSalary(950000n, 3n));
    const view = await queryLedgerState(providerFromSimulator(sim), CONTRACT_ADDRESS);
    expect(view).not.toBeNull();
    expect(view!.pools).toEqual([]);
    expect(view!.round).toBe(1n);
  });

  it('projects a single opened category into the UI pool view', async () => {
    const sim = new SalaryPoolSimulator(stateWithSalary(950000n, 3n));
    sim.openCategory(0n, 'Software Engineer / Bengaluru');

    const view = await queryLedgerState(providerFromSimulator(sim), CONTRACT_ADDRESS);
    expect(view!.pools).toHaveLength(1);
    const pool = view!.pools[0]!;
    expect(pool.category).toBe(0n);
    expect(pool.name).toBe('Software Engineer / Bengaluru');
    expect(pool.open).toBe(true);
    expect(pool.contributorCount).toBe(0n);
    expect(pool.benchmarkAvailable).toBe(false);
    expect(pool.binCounts).toEqual([0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]);
  });

  it('sorts pools by category id regardless of insertion order', async () => {
    const sim = new SalaryPoolSimulator(stateWithSalary(950000n, 3n));
    sim.openCategory(3n, 'Data Scientist / Pune');
    sim.openCategory(1n, 'QA Engineer / Hyderabad');

    const view = await queryLedgerState(providerFromSimulator(sim), CONTRACT_ADDRESS);
    expect(view!.pools.map((p) => p.category)).toEqual([1n, 3n]);
  });

  it('projects contributor counts and quantile bands after the threshold is reached', async () => {
    const sim = new SalaryPoolSimulator(stateWithSalary(950000n, 3n));
    sim.openCategory(0n, 'Data Engineer / Hyderabad');
    // Bands 1–5 each with a salary inside that band → histogram [0,1,1,1,1,1,0,0].
    const BAND_LOWS = [1n, 300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n];
    const BAND_HIGHS = [300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n, 100000000n];
    for (let band = 1n; band <= 5n; band++) {
      const salary = (BAND_LOWS[Number(band)]! + BAND_HIGHS[Number(band)]!) / 2n;
      sim.setPrivateState(stateWithSalary(salary, 3n));
      sim.submitSalaryContribution(0n, band);
    }
    sim.updateBenchmark(0n);

    const view = await queryLedgerState(providerFromSimulator(sim), CONTRACT_ADDRESS);
    const pool = view!.pools[0]!;
    expect(pool.contributorCount).toBe(5n);
    expect(pool.totalContributions).toBe(5n);
    expect(pool.benchmarkAvailable).toBe(true);
    // Only coarse band indices are exposed — never a salary value.
    expect(pool.p25Bin).toBe(2n);
    expect(pool.medianBin).toBe(3n);
    expect(pool.p75Bin).toBe(4n);
  });

  it('exposes only aggregate histogram counts for a private contribution', async () => {
    const sim = new SalaryPoolSimulator(stateWithSalary(950000n, 3n));
    sim.openCategory(0n, 'Software Engineer / Chennai');
    sim.submitSalaryContribution(0n, 3n);

    const view = await queryLedgerState(providerFromSimulator(sim), CONTRACT_ADDRESS);
    const pool = view!.pools[0]!;
    expect(pool.contributorCount).toBe(1n);
    expect(pool.binCounts[3]).toBe(1n);
    // The rest of the histogram stays at zero — nothing else about the salary
    // is revealed by the projection the UI renders.
    expect(pool.binCounts.filter((count) => count !== 0n)).toEqual([1n]);
  });
});

import type { PublicDataProvider } from '@midnight-ntwrk/midnight-js-types';
import { ledger as projectLedger } from '../contract/index';

export interface PoolView {
  readonly category: bigint;
  readonly name: string;
  readonly open: boolean;
  readonly contributorCount: bigint;
  readonly totalContributions: bigint;
  readonly binCounts: bigint[];
  readonly medianBin: bigint;
  readonly p25Bin: bigint;
  readonly p75Bin: bigint;
  readonly benchmarkAvailable: boolean;
}

export interface LedgerView {
  readonly pools: readonly PoolView[];
  readonly round: bigint;
}

/**
 * Reads the current (public) ledger state of the deployed contract from the
 * network indexer and flattens its `pools` map into a list of pool views for
 * the UI.
 *
 * The compiled contract's `ledger()` function projects the on-chain
 * `StateValue` into a typed Ledger, in exactly the same way the repo CLI does.
 */
export async function queryLedgerState(
  publicDataProvider: PublicDataProvider,
  contractAddress: string,
): Promise<LedgerView | null> {
  const contractState = await publicDataProvider.queryContractState(contractAddress);
  if (!contractState) return null;

  const projected = projectLedger(contractState.data);

  const pools: PoolView[] = [];
  for (const [category, pool] of projected.pools) {
    pools.push({
      category,
      name: pool.name,
      open: pool.open,
      contributorCount: pool.contributorCount,
      totalContributions: pool.totalContributions,
      binCounts: pool.binCounts,
      medianBin: pool.medianBin,
      p25Bin: pool.p25Bin,
      p75Bin: pool.p75Bin,
      benchmarkAvailable: pool.benchmarkAvailable,
    });
  }
  pools.sort((a, b) => (a.category < b.category ? -1 : a.category > b.category ? 1 : 0));

  return { pools, round: projected.round };
}
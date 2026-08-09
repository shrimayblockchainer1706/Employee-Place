// Shared provider construction for the Confidential Salary Benchmarking Pool
// tooling (CLI, deployer, E2E driver, fund, check-balance).
//
// The same provider set is used everywhere: a level-backed private state store,
// an indexer-backed public data provider, a node-based zk config provider, an
// HTTP proof provider, and the wallet facade acting as both wallet and
// midnight provider.
//
// PRIVACY: the level-backed private state provider stores the contributor's
// private witness values (secret key, salary, experience) encrypted on disk in
// `midnight-level-db/`. It is the ONLY place this data is persisted in the
// Node tooling, and the directory is git-ignored.

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import type { NetworkConfig } from './network';
import type { WalletContext } from './wallet';

// Identifier under which this contract's private state is stored.
export const PRIVATE_STATE_ID = 'salaryPoolPrivateState';

export const ZK_CONFIG_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'contracts',
  'managed',
  'confidential_salary_benchmarking',
);

export async function createProviders(walletCtx: WalletContext, networkConfig: NetworkConfig) {
  const privateStatePassword =
    process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Development-Placeholder-1';

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(ZK_CONFIG_DIR);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'salary-benchmarking-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}
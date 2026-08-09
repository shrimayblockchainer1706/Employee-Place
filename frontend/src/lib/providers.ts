/*
 * Builds the full Midnight JS SDK provider set from a connected wallet.
 *
 * Two "flavours" of provider sharing, mirroring the repo's Node tooling
 * (`src/providers.ts`) but adapted to the browser:
 *
 *   - private state: level-backed and encrypted in IndexedDB (browser-level).
 *                     Holds a contributor's pseudonym key + salary + experience
 *                     ONLY while a proof is being produced — it is never
 *                     stored on the ledger or transmitted anywhere.
 *   - public data:   the network's GraphQL indexer.
 *   - ZK config:      fetched from this app's static assets (compiled
 *                     zkir/keys).
 *   - proving:        via the local HTTP proof server when
 *                     `VITE_PROOF_SERVER_URL` is set (local devnet /
 *                     custom contracts), otherwise delegated to the wallet
 *                     via `ConnectedAPI.getProvingProvider`.
 */
import { BrowserLevel } from 'browser-level';
import type { AbstractLevel } from 'abstract-level';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { createProofProvider } from '@midnight-ntwrk/midnight-js-types';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { CostModel } from '@midnight-ntwrk/ledger-v8';
import type { ConnectedAPI, ShieldedAddress } from './connector-types';
import { createWalletProvider, createMidnightProvider } from './walletAdapter';
import { FetchZkConfigProvider } from './zk-config-provider';
import { CONTRACT_NAME } from './contract';
import type { SalaryPoolPrivateState } from './witnesses';
import { ensureNetworkConfigured, resolveNetworkId } from './network';

export const PRIVATE_STATE_ID = 'salaryPoolPrivateState';

export type SalaryPoolProviders = MidnightProviders<
  any,
  typeof PRIVATE_STATE_ID,
  SalaryPoolPrivateState
>;

/** Encrypted private state password — must satisfy the Midnight strength policy. */
const PRIVATE_STATE_PASSWORD = 'Midnight-Benchmarking-2026!';

const browserLevelFactory = (
  dbName: string,
): AbstractLevel<string | Buffer | Uint8Array, string, string> =>
  new BrowserLevel(dbName, { valueEncoding: 'utf8' }) as unknown as AbstractLevel<
    string | Buffer | Uint8Array,
    string,
    string
  >;

export async function buildProvidersFromConnectedAPI(
  connectedAPI: ConnectedAPI,
  shieldedAddresses: ShieldedAddress,
): Promise<SalaryPoolProviders> {
  // The SDK needs the global network id set before ANY contract/provider
  // operation; re-assert the configured network defensively (idempotent).
  ensureNetworkConfigured();
  const configuration = await connectedAPI.getConfiguration();

  const indexerUri = import.meta.env.VITE_INDEXER_URL?.trim() || configuration.indexerUri;
  const indexerWsUri = import.meta.env.VITE_INDEXER_WS_URL?.trim() || configuration.indexerWsUri;

  const privateStateProvider = levelPrivateStateProvider({
    privateStoragePasswordProvider: () => PRIVATE_STATE_PASSWORD,
    accountId: shieldedAddresses.shieldedAddress,
    privateStateStoreName: 'private-states',
    levelFactory: browserLevelFactory,
  });

  const publicDataProvider = indexerPublicDataProvider(indexerUri, indexerWsUri);

  const zkConfigProvider = new FetchZkConfigProvider(
    `${window.location.origin}/contract/compiled/${CONTRACT_NAME}`,
  );

  const proofServerUrl = import.meta.env.VITE_PROOF_SERVER_URL?.trim();

  let proofProvider;
  if (proofServerUrl) {
    // Proving against a local Midnight proof server (browser can reach it
    // directly; CORS is enabled by the docker-compose proof server).
    proofProvider = httpClientProofProvider(proofServerUrl, zkConfigProvider);
  } else {
    // Delegating proving to the wallet. It uses the supplied key-material
    // provider to fetch the compiled artifacts and proves on the wallet side.
    const proving = await connectedAPI.getProvingProvider(zkConfigProvider);
    proofProvider = createProofProvider(proving, CostModel.initialCostModel());
  }

  const walletProvider = createWalletProvider(connectedAPI, shieldedAddresses);
  const midnightProvider = createMidnightProvider(connectedAPI);

  return {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };
}
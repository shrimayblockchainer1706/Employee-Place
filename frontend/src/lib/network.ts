/*
 * Network identity + endpoint configuration for the browser dApp.
 *
 * Root cause of the historical "Network ID has not been configured. Call
 * setNetworkId() before any wallet or contract operation." error:
 *
 * `@midnight-ntwrk/midnight-js-contracts` (and the WASM runtime) call
 * `getNetworkId()` from `@midnight-ntwrk/midnight-js-network-id` internally
 * whenever a transaction is built (deploy / find / call). That module keeps a
 * module-level value that starts unset, so the FIRST contract operation throws
 * unless `setNetworkId()` was called beforehand. The app never called it.
 *
 * Every wallet/contract entry point in this app must therefore go through
 * `configureNetwork()` (or `ensureNetworkConfigured()`) BEFORE doing anything
 * else. That guarantees the "network → wallet → contract" ordering.
 *
 * The network ids and their endpoint defaults mirror the repo's Node tooling
 * (`src/network.ts`); they are the SAME values the wallet reports/expects
 * (`undeployed` / `preview` / `preprod`). Nothing here is invented.
 */
import { setNetworkId as sdkSetNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export type NetworkId = 'undeployed' | 'preview' | 'preprod';

export const NETWORK_IDS: readonly NetworkId[] = ['undeployed', 'preview', 'preprod'] as const;

export interface FrontendNetworkConfig {
  readonly networkId: NetworkId;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly proofServer: string;
}

/**
 * Endpoint defaults per network, aligned with `src/network.ts` in the repo.
 * The browser normally inherits indexer/proof-server endpoints from the wallet
 * (`ConnectedAPI.getConfiguration()`); these are only fallbacks / explicit
 * overrides (VITE_INDEXER_URL, VITE_INDEXER_WS_URL, VITE_PROOF_SERVER_URL).
 */
export const NETWORK_CONFIGS: Record<NetworkId, FrontendNetworkConfig> = {
  undeployed: {
    networkId: 'undeployed',
    indexer: 'http://127.0.0.1:8085/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8085/api/v4/graphql/ws',
    proofServer: 'http://127.0.0.1:6305',
  },
  preview: {
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    proofServer: 'http://127.0.0.1:6305',
  },
  preprod: {
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    proofServer: 'http://127.0.0.1:6305',
  },
};

export function isNetworkId(value: unknown): value is NetworkId {
  return typeof value === 'string' && (NETWORK_IDS as readonly string[]).includes(value);
}

/** Fallback network when no env var is present. Matches the dApp's default UI. */
export const DEFAULT_NETWORK_ID: NetworkId = 'preview';

/**
 * Resolve an arbitrary input to a valid {@link NetworkId}. Anything that is not
 * a known id falls back to `DEFAULT_NETWORK_ID` (never an invented value).
 */
export function resolveNetworkId(value: string | null | undefined): NetworkId {
  const trimmed = value?.trim() ?? '';
  return isNetworkId(trimmed) ? trimmed : DEFAULT_NETWORK_ID;
}

/** The network currently configured for the SDK (module-level, survives HMR). */
let activeNetworkId: NetworkId = DEFAULT_NETWORK_ID;

/**
 * Configure the SDK network identity. MUST be called before any wallet or
 * contract operation. Idempotent — safe to call on every connect/reconnect.
 */
export function configureNetwork(networkId: NetworkId): NetworkId {
  activeNetworkId = networkId;
  sdkSetNetworkId(networkId);
  return activeNetworkId;
}

/**
 * Re-assert the currently configured network id into the SDK. Cheap and
 * idempotent; guards contract call-sites so they never hit the unconfigured
 * error even if some code path forgot to configure first.
 */
export function ensureNetworkConfigured(): NetworkId {
  if (activeNetworkId === undefined) {
    activeNetworkId = DEFAULT_NETWORK_ID;
  }
  sdkSetNetworkId(activeNetworkId);
  return activeNetworkId;
}

export function getActiveNetworkId(): NetworkId {
  return activeNetworkId;
}

/** Resolve the network from Vite env (VITE_NETWORK), falling back safely. */
export function networkFromEnv(): NetworkId {
  return resolveNetworkId(import.meta.env.VITE_NETWORK);
}

/*
 * The Midnight DApp Connector surface used by this dApp, re-exported from the
 * official `@midnight-ntwrk/dapp-connector-api` package. Wallets expose their
 * `InitialAPI` instances on `window.midnight`; once a DApp calls
 * `connect(networkId)` the wallet returns a `ConnectedAPI` (after the user
 * approves) which this app adapts into the Midnight JS SDK providers.
 */

import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export type { InitialAPI, ConnectedAPI, Configuration } from '@midnight-ntwrk/dapp-connector-api';

/** A shielded (Zswap) address as revealed by the wallet to the dApp. */
export interface ShieldedAddress {
  readonly shieldedAddress: string;
  readonly shieldedCoinPublicKey: string;
  readonly shieldedEncryptionPublicKey: string;
}
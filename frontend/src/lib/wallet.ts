/*
 * Wallet connection for the Confidential Salary Benchmarking Pool dApp.
 *
 * Talks to the Midnight DApp Connector surface (`window.midnight`) using the
 * official `@midnight-ntwrk/dapp-connector-api` contract, and returns the
 * enabled `ConnectedAPI` plus the wallet's shielded address, which the provider
 * layer then adapts into the Midnight JS SDK providers.
 */
import { ErrorCodes } from '@midnight-ntwrk/dapp-connector-api';
import type { InitialAPI, ConnectedAPI, APIError } from '@midnight-ntwrk/dapp-connector-api';
import type { ShieldedAddress } from './connector-types';
import { configureNetwork, resolveNetworkId } from './network';

export type { NetworkId } from './network';
export { NETWORK_IDS } from './network';

export interface WalletConnection {
  readonly connectedAPI: ConnectedAPI;
  readonly shieldedAddresses: ShieldedAddress;
}

/**
 * Read-only, privacy-safe snapshot of the wallet connection state. Used to
 * surface wallet/network/DUST health in the UI (e.g. to diagnose the Midnight
 * `InvalidDustSpendProof` / Custom error 170 family, which originates in the
 * wallet's DUST state). Contains no secret or signing material.
 */
export interface WalletDiagnostics {
  readonly connection: 'connected' | 'disconnected';
  readonly networkId: string;
  /** Endpoints the wallet itself is using (indexer/node). */
  readonly configuredNetworkId?: string;
  readonly indexerUri?: string;
  readonly substrateNodeUri?: string;
  readonly dustBalance?: bigint;
  readonly dustCap?: bigint;
  /** Unshielded tNIGHT balance (native token) — the basis DUST is generated from. */
  readonly tNight?: bigint;
  /** Total unshielded balance across all unshielded token types. */
  readonly unshieldedTotal?: bigint;
}

const NATIVE_TOKEN_TYPE = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Fetch the wallet's current balance/network/DUST state. Every read is defensive:
 * failures are reported as `null`/`undefined` fields rather than thrown, so a
 * wallet that omits a method never breaks the connect flow.
 */
export async function collectWalletDiagnostics(
  connectedAPI: ConnectedAPI,
): Promise<WalletDiagnostics> {
  let connection: WalletDiagnostics['connection'] = 'disconnected';
  let networkId = '';
  try {
    const status = await connectedAPI.getConnectionStatus();
    connection = status.status;
    networkId = status.status === 'connected' ? status.networkId : '';
  } catch {
    /* ignore */
  }

  let configuredNetworkId: string | undefined;
  let indexerUri: string | undefined;
  let substrateNodeUri: string | undefined;
  try {
    const config = await connectedAPI.getConfiguration();
    configuredNetworkId = config.networkId;
    indexerUri = config.indexerUri;
    substrateNodeUri = config.substrateNodeUri;
  } catch {
    /* ignore */
  }

  let dustBalance: bigint | undefined;
  let dustCap: bigint | undefined;
  try {
    const dust = await connectedAPI.getDustBalance();
    dustBalance = dust.balance;
    dustCap = dust.cap;
  } catch {
    /* ignore */
  }

  let tNight: bigint | undefined;
  let unshieldedTotal: bigint | undefined;
  try {
    const balances = await connectedAPI.getUnshieldedBalances();
    const entries = Object.entries(balances).filter(([, value]) => typeof value === 'bigint');
    tNight = balances[NATIVE_TOKEN_TYPE];
    unshieldedTotal = entries.reduce((sum, [, value]) => sum + (value as bigint), 0n);
  } catch {
    /* ignore */
  }

  return {
    connection,
    networkId,
    configuredNetworkId,
    indexerUri,
    substrateNodeUri,
    dustBalance,
    dustCap,
    tNight,
    unshieldedTotal,
  };
}

export class WalletConnectionError extends Error {}

export function isWalletConnectorPresent(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.midnight === 'object' &&
    window.midnight !== null &&
    Object.keys(window.midnight).length > 0
  );
}

/** Every wallet instance injected into `window.midnight`. */
export function detectedWallets(): InitialAPI[] {
  if (!isWalletConnectorPresent()) return [];
  return Object.values(window.midnight as Record<string, unknown>).filter(
    (entry): entry is InitialAPI =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as InitialAPI).connect === 'function',
  );
}

/**
 * Picks the best wallet to connect to. Prefers an instance implementing the
 * same major version of the DApp Connector API as this app (so the method set
 * lines up), falling back to any wallet exposing a `connect` function.
 */
function pickWallet(wallets: InitialAPI[]): InitialAPI {
  const major = '4';
  return (
    wallets.find((w) => w.apiVersion?.startsWith(`${major}.`)) ??
    wallets[0]
  );
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** Maps DApp Connector `APIError` codes to user-facing messages. */
function walletErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && (error as APIError).type === 'DAppConnectorAPIError') {
    switch ((error as APIError).code) {
      case ErrorCodes.Rejected:
        return 'You rejected the connection request in your wallet.';
      case ErrorCodes.PermissionRejected:
        return 'Your wallet declined to share the requested permissions with this dApp.';
      case ErrorCodes.Disconnected:
        return 'The connection to your wallet was lost. Unlock the wallet and try again.';
      case ErrorCodes.InvalidRequest:
        return `The wallet rejected the request: ${(error as APIError).reason}`;
      default:
        return `Wallet error: ${(error as APIError).reason ?? describeError(error)}`;
    }
  }
  return describeError(error);
}

/**
 * Connects to the wallet and resolves the enabled API + the wallet's shielded
 * address. Throws {@link WalletConnectionError} when the wallet is absent or
 * the user declines the connection.
 */
export async function connectToWallet(
  networkId: string,
  _options?: { args?: readonly string[] },
): Promise<WalletConnection> {
  if (typeof window === 'undefined' || window.midnight === undefined || window.midnight === null) {
    throw new WalletConnectionError(
      'No Midnight wallet is installed or unlocked. Install a wallet that exposes the ' +
        'Midnight wallet connector (`window.midnight`), unlock it, and reload the page.',
    );
  }

  // ORDER: network → wallet. The Midnight SDK requires the global network id to
  // be set before any wallet or contract operation (its `getNetworkId()` throws
  // the "Network ID has not been configured" error otherwise). Configure it
  // explicitly with the requested network so nothing later re-enters on an
  // unconfigured module-level store.
  const configuredNetwork = configureNetwork(resolveNetworkId(networkId));

  const wallets = detectedWallets();
  if (wallets.length === 0) {
    throw new WalletConnectionError(
      'A Midnight wallet was detected, but it did not expose a usable connector. ' +
        'Unlock the wallet and reload the page.',
    );
  }

  const wallet = pickWallet(wallets);

  let connectedAPI: ConnectedAPI;
  try {
    connectedAPI = await wallet.connect(configuredNetwork);
  } catch (error) {
    throw new WalletConnectionError(walletErrorMessage(error));
  }

  try {
    const status = await connectedAPI.getConnectionStatus();
    if (status.status === 'disconnected') {
      throw new WalletConnectionError(
        'The wallet connection could not be established. Approve the connection request in your wallet and try again.',
      );
    }
    if (status.networkId !== configuredNetwork) {
      throw new WalletConnectionError(
        `Your wallet is connected to the "${status.networkId}" network, not "${configuredNetwork}". ` +
          'Open the wallet, switch to the requested network, then try again.',
      );
    }
  } catch (error) {
    if (error instanceof WalletConnectionError) throw error;
    throw new WalletConnectionError(walletErrorMessage(error));
  }

  const shieldedAddresses = (await connectedAPI.getShieldedAddresses().catch((error: unknown) => {
    throw new WalletConnectionError(walletErrorMessage(error));
  })) as ShieldedAddress;

  return { connectedAPI, shieldedAddresses };
}
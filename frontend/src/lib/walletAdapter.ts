/*
 * Adapts a connected wallet (`ConnectedAPI`) into the `WalletProvider` and
 * `MidnightProvider` types used throughout the Midnight JS SDK.
 *
 * PRIVACY & SECURITY: the wallet never exposes secret keys. Balancing and
 * signing happen inside the wallet; the dApp only ever holds serialized
 * transactions and the wallet's public keys.
 */
import { Transaction } from '@midnight-ntwrk/ledger-v8';
import type { WalletProvider, MidnightProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ConnectedAPI, ShieldedAddress } from './connector-types';

export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToUint8Array(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/, '');
  if (cleaned.length % 2 !== 0) throw new Error('Invalid hex string');
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) throw new Error('Invalid hex string');
  const out = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function createWalletProvider(
  connectedAPI: ConnectedAPI,
  shieldedAddresses: ShieldedAddress,
): WalletProvider {
  return {
    async balanceTx(unboundTx) {
      const serialized = uint8ArrayToHex(unboundTx.serialize());
      const response = await connectedAPI.balanceUnsealedTransaction(serialized);
      return Transaction.deserialize(
        'signature',
        'proof',
        'binding',
        hexToUint8Array(response.tx),
      );
    },
    getCoinPublicKey() {
      return shieldedAddresses.shieldedCoinPublicKey;
    },
    getEncryptionPublicKey() {
      return shieldedAddresses.shieldedEncryptionPublicKey;
    },
  };
}

export function createMidnightProvider(connectedAPI: ConnectedAPI): MidnightProvider {
  return {
    async submitTx(finalizedTx) {
      const serialized = uint8ArrayToHex(finalizedTx.serialize());
      await connectedAPI.submitTransaction(serialized);
      return finalizedTx.identifiers()[0];
    },
  };
}
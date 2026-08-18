/*
 * Tests the wallet adapter's serialization helpers
 * (frontend/src/lib/walletAdapter.ts) that bridge the browser wallet's
 * hex-encoded transactions to the Midnight SDK's `Transaction` objects.
 *
 * `uint8ArrayToHex` feeds `balanceUnsealedTransaction`, and
 * `hexToUint8Array` turns the wallet's response back into a `Transaction` —
 * a byte-level round-trip failure here would break every transaction the dApp
 * submits.
 */
import { describe, expect, it } from 'vitest';
import {
  uint8ArrayToHex,
  hexToUint8Array,
} from '../frontend/src/lib/walletAdapter';

describe('wallet adapter hex serialization', () => {
  it('round-trips arbitrary bytes through hex', () => {
    const bytes = new Uint8Array([0, 1, 2, 15, 16, 127, 128, 200, 255]);
    const hex = uint8ArrayToHex(bytes);
    expect(hex).toBe('0001020f107f80c8ff');
    expect(hexToUint8Array(hex)).toEqual(bytes);
  });

  it('round-trips a realistic transaction-sized payload', () => {
    // 256 random bytes approximating a serialized ledger transaction.
    const bytes = new Uint8Array(256);
    crypto.getRandomValues(bytes);
    expect(hexToUint8Array(uint8ArrayToHex(bytes))).toEqual(bytes);
  });

  it('accepts a 0x-prefixed input', () => {
    expect(hexToUint8Array('0x00ff10')).toEqual(new Uint8Array([0, 255, 16]));
  });

  it('handles empty input', () => {
    expect(uint8ArrayToHex(new Uint8Array(0))).toBe('');
    expect(hexToUint8Array('')).toEqual(new Uint8Array(0));
  });

  it('rejects malformed hex', () => {
    expect(() => hexToUint8Array('0x0')).toThrow('Invalid hex string'); // odd length
    expect(() => hexToUint8Array('zz00')).toThrow(); // non-hex characters
  });
});

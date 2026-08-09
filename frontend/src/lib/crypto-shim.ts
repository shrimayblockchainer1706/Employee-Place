// Browser crypto shim: re-exports crypto-browserify under the `crypto` module
// name so the Midnight SDK's Node-flavoured `crypto` imports work in the browser.
import cryptoBrowserify from 'crypto-browserify';

function timingSafeEqual(a: Buffer | Uint8Array, b: Buffer | Uint8Array): boolean {
  if (a.length !== b.length) {
    throw new RangeError('Input buffers must have the same byte length');
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export default { ...cryptoBrowserify, timingSafeEqual };

export const {
  Cipher,
  Cipheriv,
  Decipher,
  Decipheriv,
  DiffieHellman,
  DiffieHellmanGroup,
  Hash,
  Hmac,
  Sign,
  Verify,
  constants,
  createCipher,
  createCipheriv,
  createDecipher,
  createDecipheriv,
  createDiffieHellman,
  createDiffieHellmanGroup,
  createECDH,
  createHash,
  createHmac,
  createSign,
  createVerify,
  getCiphers,
  getHashes,
  pbkdf2,
  pbkdf2Sync,
  privateDecrypt,
  privateEncrypt,
  prng,
  pseudoRandomBytes,
  publicDecrypt,
  publicEncrypt,
  randomBytes,
  randomFill,
  randomFillSync,
  rng,
} = cryptoBrowserify as unknown as Record<string, unknown>;

export { timingSafeEqual };
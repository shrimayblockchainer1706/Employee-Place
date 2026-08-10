import { describe, expect, it } from 'vitest';
import { humanizeError } from '../frontend/src/lib/errors';

describe('humanizeError — Midnight node DUST rejections', () => {
  it('decodes Custom error 170 (InvalidDustSpendProof) into actionable guidance', () => {
    const message = humanizeError(
      new Error(
        "Unexpected error submitting scoped transaction '<unnamed>': Error: Operation failed: Invalid Transaction: Custom error: 170",
      ),
    );
    expect(message).toContain('InvalidDustSpendProof');
    expect(message).toContain('Custom error: 170');
    expect(message).toMatch(/wallet/i);
    expect(message).toMatch(/dust/i);
  });

  it('decodes Custom error 171 (OutOfDustValidityWindow)', () => {
    const message = humanizeError(new Error('1010: Invalid Transaction: Custom error: 171'));
    expect(message).toContain('OutOfDustValidityWindow');
    expect(message).toContain('Custom error: 171');
  });

  it('decodes unknown custom error codes without hiding the code', () => {
    const message = humanizeError(new Error('Invalid Transaction: Custom error: 199'));
    expect(message).toContain('Custom error: 199');
  });

  it('tolerates whitespace variants of the code separator', () => {
    const message = humanizeError(new Error('Invalid Transaction: Custom error:170'));
    expect(message).toContain('InvalidDustSpendProof');
  });

  it('leaves unrelated errors untouched', () => {
    const message = humanizeError(new Error('Category is not open'));
    expect(message).toContain('No salary pool has been opened');
  });
});
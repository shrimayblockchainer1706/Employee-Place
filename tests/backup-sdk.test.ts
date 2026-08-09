/*
 * SDK-level backup/restore integration test for the repository's tooling and
 * the browser backup panel.
 *
 * Uses the real @midnight-ntwrk/midnight-js-level-private-state-provider (the
 * same one the frontend wires up in frontend/src/lib/providers.ts) against a
 * temporary on-disk `level` database, verifying:
 *
 *   - private-state export with a strong export password round-trips,
 *   - a weak export password is rejected by the SDK policy,
 *   - an incorrect password on restore fails safely,
 *   - the skip/overwrite conflict strategy behaves,
 *   - signing-key export/import round-trips.
 *
 * No real passwords, keys or salaries are used — everything here is
 * throwaway test data.
 */
import { it, describe, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Level } from '../frontend/node_modules/level/index.js';
import { levelPrivateStateProvider } from '../frontend/node_modules/@midnight-ntwrk/midnight-js-level-private-state-provider/dist/index.mjs';

const STORAGE_PASSWORD = 'K7!pTw9@zQ4#mN2&xR5';
const EXPORT_PASSWORD = 'Qu9#bF7@dL2!eR5&tW1';
const CONTRACT_ADDRESS = '0xcontract-address';
const PRIVATE_STATE_ID = 'salaryPoolPrivateState';

const TEST_PRIVATE_STATE = { pseudonymKey: '0xtest', salary: 1200000n, yearsOfExperience: 5n };

function makeFactory(dir: string): (dbName: string) => unknown {
  return (dbName: string) => new Level(path.join(dir, dbName), { valueEncoding: 'utf8' });
}

function buildProvider(dir: string, accountId: string) {
  return levelPrivateStateProvider({
    privateStoragePasswordProvider: () => STORAGE_PASSWORD,
    accountId,
    privateStateStoreName: 'private-states',
    signingKeyStoreName: 'signing-keys',
    levelFactory: makeFactory(dir) as never,
  });
}

describe('Midnight SDK private-state backup / restore', () => {
  it('exports and re-imports private state with a strong export password', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mn-backup-pvt-'));
    try {
      const exporter = buildProvider(dir, 'account-a');
      await exporter.setContractAddress(CONTRACT_ADDRESS);
      await exporter.set(PRIVATE_STATE_ID, TEST_PRIVATE_STATE);

      const backup = await exporter.exportPrivateStates({ password: EXPORT_PASSWORD });
      expect(backup.format).toBe('midnight-private-state-export');

      const importer = buildProvider(dir, 'account-a-restore');
      await importer.setContractAddress(CONTRACT_ADDRESS);
      const result = await importer.importPrivateStates(backup, { password: EXPORT_PASSWORD });
      expect(result.imported).toBeGreaterThan(0);
      expect(result.skipped).toBe(0);

      expect(await importer.get(PRIVATE_STATE_ID)).toEqual(TEST_PRIVATE_STATE);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects a weak export password (SDK policy)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mn-backup-weak-'));
    try {
      const ctx = buildProvider(dir, 'account-b');
      await ctx.setContractAddress(CONTRACT_ADDRESS);
      await ctx.set(PRIVATE_STATE_ID, TEST_PRIVATE_STATE);

      await expect(ctx.exportPrivateStates({ password: 'short1!' })).rejects.toMatchObject({
        name: 'PrivateStateExportError',
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails a restore with an incorrect password', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mn-backup-wrong-'));
    try {
      const exporter = buildProvider(dir, 'account-c');
      await exporter.setContractAddress(CONTRACT_ADDRESS);
      await exporter.set(PRIVATE_STATE_ID, TEST_PRIVATE_STATE);
      const backup = await exporter.exportPrivateStates({ password: EXPORT_PASSWORD });

      const importer = buildProvider(dir, 'account-c-restore');
      await importer.setContractAddress(CONTRACT_ADDRESS);
      await expect(
        importer.importPrivateStates(backup, { password: STORAGE_PASSWORD }),
      ).rejects.toMatchObject({ name: 'ExportDecryptionError' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('skips entries that already exist when conflictStrategy is skip', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mn-backup-skip-'));
    try {
      const ctx = buildProvider(dir, 'account-d');
      await ctx.setContractAddress(CONTRACT_ADDRESS);
      await ctx.set(PRIVATE_STATE_ID, TEST_PRIVATE_STATE);
      const backup = await ctx.exportPrivateStates({ password: EXPORT_PASSWORD });

      const result = await ctx.importPrivateStates(backup, {
        password: EXPORT_PASSWORD,
        conflictStrategy: 'skip' as const,
      });
      expect(result.skipped).toBeGreaterThan(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('Midnight SDK signing-key backup / restore', () => {
  it('exports and re-imports a signing key with a strong export password', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mn-backup-key-'));
    try {
      const exporter = buildProvider(dir, 'account-pub');
      const TEST_KEY = '00'.repeat(32);
      await exporter.setSigningKey('addr-test-1', TEST_KEY);

      const backup = await exporter.exportSigningKeys({ password: EXPORT_PASSWORD });
      expect(backup.format).toBe('midnight-signing-key-export');

      const importer = buildProvider(dir, 'account-pub-restore');
      const result = await importer.importSigningKeys(backup, { password: EXPORT_PASSWORD });
      expect(result.imported).toBeGreaterThan(0);

      expect(await importer.getSigningKey('addr-test-1')).toBe(TEST_KEY);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
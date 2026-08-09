/*
 * Security / backup panel.
 *
 * Midnight stores private contract state and signing keys in encrypted
 * browser storage (IndexedDB). Clearing browser storage for the day destroys
 * them irreversibly, so the SDK exposes an encrypted export/import mechanism.
 *
 * Every action here is explicitly user-initiated:
 *   - no automatic downloads or uploads, and
 *   - exports are downloaded only to the user's device (encrypted), never
 *     sent anywhere.
 *
 * The exported payload and the password are never logged.
 */
import { useRef, useState, type RefObject } from 'react';
import { useMidnight } from '../hooks/useMidnight';
import { humanizeError } from '../lib/errors';
import { validateBackupPassword } from '../lib/password-policy';
import type {
  PrivateStateExport,
  SigningKeyExport,
} from '@midnight-ntwrk/midnight-js-types';

const PRIVATE_FORMAT = 'midnight-private-state-export';
const SIGNING_KEY_FORMAT = 'midnight-signing-key-export';

type ConflictStrategy = 'skip' | 'overwrite';

export default function BackupPanel() {
  const {
    isBusy,
    exportPrivateState,
    exportWalletSigningKeys,
    importPrivateState,
    importWalletSigningKeys,
  } = useMidnight();

  const [password, setPassword] = useState('');
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('skip');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<{ readonly ok: boolean; readonly text: string } | null>(null);

  const privateFileRef = useRef<HTMLInputElement>(null);
  const keyFileRef = useRef<HTMLInputElement>(null);

  const disabled = isBusy || working;

  const requirePassword = (): string | null => validateBackupPassword(password);

  const handleExportPrivate = async () => {
    setMessage(null);
    const passwordError = requirePassword();
    if (passwordError) {
      setMessage({ ok: false, text: passwordError });
      return;
    }
    setWorking(true);
    try {
      const backup = await exportPrivateState(password || undefined);
      downloadJson(`salary-pool-private-state-${timestamp()}.json`, backup);
      setMessage({
        ok: true,
        text: 'Private state backup downloaded. It is encrypted and only exists on this device — keep the file and any password you set in a safe place.',
      });
    } catch (error) {
      setMessage({ ok: false, text: humanizeError(error) });
    } finally {
      setWorking(false);
    }
  };

  const handleExportKeys = async () => {
    setMessage(null);
    const passwordError = requirePassword();
    if (passwordError) {
      setMessage({ ok: false, text: passwordError });
      return;
    }
    setWorking(true);
    try {
      const backup = await exportWalletSigningKeys(password || undefined);
      downloadJson(`salary-pool-signing-keys-${timestamp()}.json`, backup);
      setMessage({
        ok: true,
        text: 'Signing keys backup downloaded. It is encrypted and only exists on this device — keep the file and any password you set in a safe place.',
      });
    } catch (error) {
      setMessage({ ok: false, text: humanizeError(error) });
    } finally {
      setWorking(false);
    }
  };

  const readBackupFile = async <T extends { readonly format: string }>(
    file: File | undefined,
    expectedFormat: string,
  ): Promise<T> => {
    if (!file) throw new Error('No file selected.');
    const parsed: unknown = JSON.parse(await file.text());
    if (typeof parsed !== 'object' || parsed === null || (parsed as { format?: string }).format !== expectedFormat) {
      throw new Error(
        `This file is not a recognised Midnight backup (expected "${expectedFormat}").`,
      );
    }
    return parsed as T;
  };

  const clearFileInput = (ref: RefObject<HTMLInputElement>) => {
    if (ref.current) ref.current.value = '';
  };

  const handleRestorePrivate = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setWorking(true);
    try {
      const data = await readBackupFile<PrivateStateExport>(file, PRIVATE_FORMAT);
      const result = await importPrivateState(data, {
        password: password || undefined,
        conflictStrategy,
      });
      setMessage({
        ok: true,
        text: `Private state restored — ${result.imported} imported, ${result.skipped} skipped, ${result.overwritten} overwritten. Refresh the page if the wallet does not reflect it.`,
      });
    } catch (error) {
      setMessage({ ok: false, text: humanizeError(error) });
    } finally {
      setWorking(false);
      clearFileInput(privateFileRef);
    }
  };

  const handleRestoreKeys = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setWorking(true);
    try {
      const data = await readBackupFile<SigningKeyExport>(file, SIGNING_KEY_FORMAT);
      const result = await importWalletSigningKeys(data, {
        password: password || undefined,
        conflictStrategy,
      });
      setMessage({
        ok: true,
        text: `Signing keys restored — ${result.imported} imported, ${result.skipped} skipped, ${result.overwritten} overwritten.`,
      });
    } catch (error) {
      setMessage({ ok: false, text: humanizeError(error) });
    } finally {
      setWorking(false);
      clearFileInput(keyFileRef);
    }
  };

  return (
    <section className="panel">
      <h2>Backup & restore</h2>
      <p className="muted">
        This dApp keeps private contract state and signing keys in encrypted browser storage. They are
        permanently destroyed if you clear browser data, so back them up now. Exports are encrypted,
        downloaded only to this device, and never uploaded anywhere.
      </p>

      <div className="field">
        <label htmlFor="backup-password">Backup password (optional)</label>
        <input
          id="backup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Leave blank to use the app’s default storage password"
          disabled={disabled}
        />
        <small className="muted">
          If you set a password, remember it — you will need it to restore. Minimum 16 characters, mixing at
          least 3 of: uppercase, lowercase, digits, symbols, with no long repeated or predictable sequences.
        </small>
      </div>

      <div className="actions">
        <button className="primary" onClick={handleExportPrivate} disabled={disabled}>
          Backup private state
        </button>
        <button className="primary" onClick={handleExportKeys} disabled={disabled}>
          Backup signing keys
        </button>
      </div>

      <div className="field">
        <label htmlFor="backup-conflict">When restoring</label>
        <select
          id="backup-conflict"
          value={conflictStrategy}
          onChange={(event) => setConflictStrategy(event.target.value as ConflictStrategy)}
          disabled={disabled}
        >
          <option value="skip">Skip entries that already exist (safer)</option>
          <option value="overwrite">Overwrite existing entries</option>
        </select>

        <div className="actions">
          <button onClick={() => privateFileRef.current?.click()} disabled={disabled}>
            Restore private state…
          </button>
          <button onClick={() => keyFileRef.current?.click()} disabled={disabled}>
            Restore signing keys…
          </button>
          <input
            ref={privateFileRef}
            type="file"
            accept="application/json,.json"
            hidden
            disabled={disabled}
            onChange={(event) => void handleRestorePrivate(event.target.files?.[0])}
          />
          <input
            ref={keyFileRef}
            type="file"
            accept="application/json,.json"
            hidden
            disabled={disabled}
            onChange={(event) => void handleRestoreKeys(event.target.files?.[0])}
          />
        </div>
      </div>

      {working && <p className="busy">Working…</p>}
      {message && <p className={message.ok ? 'success' : 'error'}>{message.text}</p>}
    </section>
  );
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
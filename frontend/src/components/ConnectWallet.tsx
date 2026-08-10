import { useState } from 'react';
import { useMidnight } from '../hooks/useMidnight';
import { humanizeError } from '../lib/errors';

const NETWORKS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'preprod', label: 'Preprod' },
  { id: 'undeployed', label: 'Local devnet (undeployed)' },
];

export default function ConnectWallet() {
  const {
    status,
    error,
    networkName,
    contractAddress,
    walletAddress,
    walletDiagnostics,
    isBusy,
    busyLabel,
    connect,
    deploy,
    disconnect,
  } = useMidnight();

  const [networkId, setNetworkId] = useState(import.meta.env.VITE_NETWORK ?? 'preview');
  const [addressInput, setAddressInput] = useState(import.meta.env.VITE_CONTRACT_ADDRESS ?? '');
  const [deployError, setDeployError] = useState<string | null>(null);

  const connected = status === 'connected';

  const handleConnect = async () => {
    setDeployError(null);
    await connect(networkId, addressInput.trim() || null);
  };

  const handleDeploy = async () => {
    setDeployError(null);
    try {
      if (!connected) {
        await connect(networkId, null);
      }
      const freshAddress = await deploy(networkId);
      setAddressInput(freshAddress);
    } catch (error) {
      setDeployError(humanizeError(error));
    }
  };

  const shortAddr = (addr: string) =>
    addr.length > 24 ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : addr;

  const noDust = walletDiagnostics && walletDiagnostics.dustBalance !== undefined && walletDiagnostics.dustBalance === 0n;

  return (
    <section className="panel connect-panel">
      <h2>Wallet & Contract</h2>

      {!connected ? (
        <>
          <div className="field">
            <label htmlFor="network">Network</label>
            <select
              id="network"
              value={networkId}
              onChange={(e) => setNetworkId(e.target.value)}
              disabled={isBusy}
            >
              {NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="contract-address">
              Contract address <span className="muted">(optional — leave empty to deploy)</span>
            </label>
            <input
              id="contract-address"
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="0x… / c1…"
              disabled={isBusy}
            />
          </div>

          <div className="actions">
            <button className="primary" onClick={handleConnect} disabled={isBusy}>
              {busyLabel ?? 'Connect wallet'}
            </button>
            <button onClick={handleDeploy} disabled={isBusy || !addressInput}>
              Deploy new contract (proving may take a minute)
            </button>
          </div>

          {busyLabel && <p className="busy">{busyLabel}</p>}
        </>
      ) : (
        <div className="connected-summary">
          <p>
            <span className="badge success">Connected</span>{' '}
            {networkName && <span className="muted">on {networkName}</span>}
          </p>
          <p className="mono">
            Wallet: {walletAddress ? shortAddr(walletAddress) : '—'}
            <br />
            Contract: {contractAddress ? shortAddr(contractAddress) : 'no contract yet'}
          </p>
          <div className="actions">
            {!contractAddress && (
              <button className="primary" onClick={handleDeploy} disabled={isBusy}>
                {busyLabel ?? 'Deploy contract'}
              </button>
            )}
            <button onClick={disconnect} disabled={isBusy}>
              Disconnect
            </button>
          </div>

          {walletDiagnostics && (
            <div className="wallet-status">
              <h3>Wallet status</h3>
              <ul className="status-list">
                <li>
                  Wallet network: <strong>{walletDiagnostics.networkId || '—'}</strong>
                </li>
                <li>
                  DUST balance:{' '}
                  <strong>
                    {walletDiagnostics.dustBalance === undefined
                      ? '—'
                      : walletDiagnostics.dustBalance.toLocaleString()}
                  </strong>
                  {walletDiagnostics.dustCap !== undefined && (
                    <span className="muted"> (cap {walletDiagnostics.dustCap.toLocaleString()})</span>
                  )}
                </li>
                <li>
                  tNIGHT (unshielded):{' '}
                  <strong>
                    {walletDiagnostics.tNight === undefined
                      ? '—'
                      : walletDiagnostics.tNight.toLocaleString()}
                  </strong>
                </li>
                {walletDiagnostics.indexerUri && (
                  <li className="muted">Wallet indexer: {walletDiagnostics.indexerUri}</li>
                )}
                {walletDiagnostics.substrateNodeUri && (
                  <li className="muted">Wallet node: {walletDiagnostics.substrateNodeUri}</li>
                )}
              </ul>
              {noDust && (
                <p className="error">
                  DUST balance is 0. The wallet generates DUST from its tNIGHT balance — open the
                  wallet extension and wait for DUST to be generated before opening a category or
                  contributing.
                </p>
              )}
            </div>
          )}

          {busyLabel && <p className="busy">{busyLabel}</p>}
        </div>
      )}

      {deployError && <p className="error">{deployError}</p>}
    </section>
  );
}
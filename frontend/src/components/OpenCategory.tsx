import { useState } from 'react';
import { useMidnight } from '../hooks/useMidnight';
import { humanizeError } from '../lib/errors';

export default function OpenCategory() {
  const { status, ledger, open, isBusy } = useMidnight();

  const [category, setCategory] = useState(0);
  const [name, setName] = useState('Software Engineer / Bengaluru');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existing = ledger?.pools.find((p) => Number(p.category) === category) ?? null;
  const disabled = Boolean(existing && existing.open);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the category a name.');
      return;
    }

    try {
      const txId = await open(BigInt(category), trimmed);
      setResult(`Category opened: #${category} — "${trimmed}". Transaction: ${shortTx(txId)}`);
      setName('');
    } catch (err) {
      setError(humanizeError(err));
    }
  };

  return (
    <section className="panel">
      <h2>Open a category</h2>
      <p className="muted">
        Start a new role/location salary pool. The label is public — the salaries contributed to it are not.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="open-category">Category</label>
          <select
            id="open-category"
            value={category}
            onChange={(e) => setCategory(Number(e.target.value))}
            disabled={isBusy}
          >
            {[0, 1, 2, 3, 4, 5].map((cat) => {
              const pool = ledger?.pools.find((p) => Number(p.category) === cat);
              const inUse = Boolean(pool && pool.open);
              return (
                <option key={cat} value={cat} disabled={inUse}>
                  Category #{cat}
                  {inUse ? ` (already "${pool!.name}")` : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div className="field">
          <label htmlFor="open-name">Label (e.g. "Software Engineer / Bengaluru")</label>
          <input
            id="open-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            disabled={isBusy}
          />
        </div>

        <div className="actions">
          <button className="primary" type="submit" disabled={isBusy || status !== 'connected' || disabled}>
            Open category
          </button>
        </div>
      </form>

      {result && <p className="success">{result}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

function shortTx(txId: string): string {
  return txId.length > 14 ? `${txId.slice(0, 10)}…` : txId;
}
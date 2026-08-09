import { useMemo, useState } from 'react';
import { useMidnight } from '../hooks/useMidnight';
import {
  bandForSalary,
  bandLabel,
  MAX_EXPERIENCE_YEARS,
  MAX_SALARY,
} from '../lib/bands';
import { humanizeError } from '../lib/errors';

export default function ContributeSalary() {
  const { status, ledger, contribute, isBusy } = useMidnight();

  const [category, setCategory] = useState(0);
  const [salary, setSalary] = useState('1200000');
  const [years, setYears] = useState('5');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pools = useMemo(() => ledger?.pools ?? [], [ledger]);

  const salaryNum = Number(salary);
  const derivedBand =
    Number.isFinite(salaryNum) && salaryNum > 0 ? bandForSalary(BigInt(salaryNum)) : null;
  const derivedLabel = derivedBand !== null ? bandLabel(derivedBand) : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!Number.isFinite(salaryNum) || salaryNum <= 0) {
      setError('Enter a positive annual salary.');
      return;
    }
    const salaryBig = BigInt(salaryNum);
    if (salaryBig > MAX_SALARY) {
      setError(`Salaries above ₹${MAX_SALARY.toLocaleString('en-IN')} per year are not supported.`);
      return;
    }
    const yearsNum = Number(years);
    if (!Number.isFinite(yearsNum) || yearsNum < 0 || yearsNum > Number(MAX_EXPERIENCE_YEARS)) {
      setError(`Years of experience must be between 0 and ${MAX_EXPERIENCE_YEARS}.`);
      return;
    }

    try {
      const txId = await contribute(BigInt(category), salaryBig, BigInt(yearsNum));
      setResult(
        `Contribution submitted. The exact salary was never on the ledger — only its band (${derivedLabel}). Transaction: ${shortTx(txId)}`,
      );
      setSalary('');
    } catch (err) {
      setError(humanizeError(err));
    }
  };

  return (
    <section className="panel">
      <h2>Contribute your salary</h2>
      <p className="muted">
        Your exact salary and years of experience are proven in zero-knowledge and never leave your device.
        Only a coarse salary band is added to the pool's histogram.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="contrib-category">Category</label>
          <select
            id="contrib-category"
            value={category}
            onChange={(e) => setCategory(Number(e.target.value))}
            disabled={isBusy}
          >
            {[0, 1, 2, 3, 4, 5].map((cat) => {
              const pool = pools.find((p) => Number(p.category) === cat);
              const label = pool ? `#${cat} — ${pool.name}` : `Category #${cat}`;
              return (
                <option key={cat} value={cat} disabled={Boolean(pool && !pool.open)}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        <div className="field">
          <label htmlFor="contrib-salary">Annual salary (INR)</label>
          <input
            id="contrib-salary"
            type="number"
            min={1}
            max={Number(MAX_SALARY)}
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="e.g. 1200000"
            required
            disabled={isBusy}
          />
          {derivedLabel && (
            <small className="muted">
              Maps to the <strong>{derivedLabel}</strong> salary band.
            </small>
          )}
        </div>

        <div className="field">
          <label htmlFor="contrib-years">Years of experience</label>
          <input
            id="contrib-years"
            type="number"
            min={0}
            max={Number(MAX_EXPERIENCE_YEARS)}
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder="e.g. 5"
            required
            disabled={isBusy}
          />
        </div>

        <div className="actions">
          <button className="primary" type="submit" disabled={isBusy || status !== 'connected'}>
            Prove & submit contribution
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
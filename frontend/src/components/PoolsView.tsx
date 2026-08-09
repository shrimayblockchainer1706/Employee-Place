import { useMidnight } from '../hooks/useMidnight';
import { bandLabel, SALARY_BANDS } from '../lib/bands';

const MIN_CONTRIBUTORS = 5;

export default function PoolsView() {
  const { status, contractAddress, ledger, updateBenchmarkFor, isBusy, busyLabel } = useMidnight();

  if (status !== 'connected' || !contractAddress) {
    return (
      <section className="panel">
        <h2>Salary Pools</h2>
        <p className="muted">
          Connect a wallet and pick a contract to see live, privacy-preserving salary benchmarks.
        </p>
      </section>
    );
  }

  if (!ledger) {
    return (
      <section className="panel">
        <h2>Salary Pools</h2>
        <p className="muted">Loading the public ledger…</p>
      </section>
    );
  }

  if (ledger.pools.length === 0) {
    return (
      <section className="panel">
        <h2>Salary Pools</h2>
        <p className="muted">No categories opened yet. Open a category below to start collecting contributions.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Salary Pools</h2>
      <div className="pools">
        {ledger.pools.map((pool) => {
          const total = Number(pool.contributorCount);
          const reached = pool.benchmarkAvailable;
          const maxBin = Math.max(1, ...pool.binCounts.map(Number));
          return (
            <article className="pool" key={pool.category.toString()}>
              <header className="pool-header">
                <div>
                  <h3>{pool.name}</h3>
                  <span className="muted">
                    Category {pool.category.toString()} · {total} contributor{total === 1 ? '' : 's'}
                  </span>
                </div>
                <span className={reached ? 'badge success' : 'badge warning'}>
                  {reached
                    ? 'Benchmark published'
                    : total >= MIN_CONTRIBUTORS
                      ? 'Reached threshold — publish'
                      : `${MIN_CONTRIBUTORS - total} more to reach the threshold`}
                </span>
              </header>

              <div className="histogram" aria-label="Salary histogram">
                {SALARY_BANDS.map((band, index) => {
                  const count = Number(pool.binCounts[index] ?? 0n);
                  const width = count === 0 ? 0 : Math.max(4, Math.round((count / maxBin) * 100));
                  return (
                    <div className="hist-row" key={band.label}>
                      <span className="hist-label">{band.label}</span>
                      <div className="hist-bar-track">
                        <div className="hist-bar" style={{ width: `${width}%` }} />
                      </div>
                      <span className="hist-count">{count}</span>
                    </div>
                  );
                })}
              </div>

              {reached ? (
                <div className="quantiles">
                  <div>
                    <span className="quant-label">25th percentile</span>
                    <strong>{bandLabel(pool.p25Bin)}</strong>
                  </div>
                  <div>
                    <span className="quant-label">Median</span>
                    <strong>{bandLabel(pool.medianBin)}</strong>
                  </div>
                  <div>
                    <span className="quant-label">75th percentile</span>
                    <strong>{bandLabel(pool.p75Bin)}</strong>
                  </div>
                  <button
                    onClick={() => void updateBenchmarkFor(pool.category)}
                    disabled={isBusy}
                    title="Recompute and publish the quantile bands"
                  >
                    Recompute benchmark
                  </button>
                </div>
              ) : (
                <p className="muted">
                  The benchmark is not published until at least {MIN_CONTRIBUTORS} contributions are in — this
                  keeps every individual salary anonymous.
                </p>
              )}
            </article>
          );
        })}
      </div>
      {busyLabel && <p className="busy">{busyLabel}</p>}
    </section>
  );
}
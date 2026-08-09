import { MidnightServiceProvider, useMidnight } from './hooks/useMidnight';
import ConnectWallet from './components/ConnectWallet';
import PoolsView from './components/PoolsView';
import ContributeSalary from './components/ContributeSalary';
import OpenCategory from './components/OpenCategory';
import BackupPanel from './components/BackupPanel';

function ErrorBanner() {
  const { error } = useMidnight();
  if (!error) return null;
  return <p className="error global">{error}</p>;
}

function Dashboard() {
  const { status } = useMidnight();
  const connected = status === 'connected';

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <span className="kicker">Midnight · zero-knowledge</span>
          <h1>Confidential Salary Benchmarking Pool</h1>
          <p>
            Compare salaries without revealing yours. Contributions are privacy-preserving: the contract only
            ever learns the coarse band your salary falls into, and nothing about a single individual is
            published until enough people have contributed to protect anonymity.
          </p>
        </div>
      </header>

      <ErrorBanner />

      <main className="layout">
        <ConnectWallet />
        {connected && (
          <>
            <PoolsView />
            <div className="grid-2">
              <OpenCategory />
              <ContributeSalary />
            </div>
            <BackupPanel />
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          Built on Midnight — proofs are generated locally; neither the dApp server nor the network ever sees
          your salary.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <MidnightServiceProvider>
      <Dashboard />
    </MidnightServiceProvider>
  );
}
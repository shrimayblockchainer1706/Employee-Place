// Decode the deployed Preview contract's current public ledger using the
// exact same projection the CLI uses (ContractModule.ledger over indexer state).
import { WebSocket } from 'ws';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

globalThis.WebSocket = WebSocket;

const CONTRACT = 'fedc2b13aab47c0a625eff4430caf5db618889ea85fec31934b1ada8cbc3c3da';
const INDEXER = 'https://indexer.preview.midnight.network/api/v4/graphql';
const INDEXER_WS = 'wss://indexer.preview.midnight.network/api/v4/graphql/ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.join(__dirname, 'contracts', 'managed', 'confidential_salary_benchmarking', 'contract', 'index.js');
type ContractModuleType = typeof import('./contracts/managed/confidential_salary_benchmarking/contract/index.js');
const ContractModule = (await import(pathToFileURL(contractPath).href)) as ContractModuleType;

const publicDataProvider = indexerPublicDataProvider(INDEXER, INDEXER_WS);
const state = await publicDataProvider.queryContractState(CONTRACT);
if (!state) {
  console.log('NO_STATE');
  process.exit(1);
}
const ledger = ContractModule.ledger(state.data);
console.log('ROUND:', ledger.round.toString());
for (const [key, pool] of ledger.pools) {
  console.log(`POOL #${key} name="${pool.name}" open=${pool.open} contributors=${pool.contributorCount} total=${pool.totalContributions} benchmarkAvailable=${pool.benchmarkAvailable} bins=[${pool.binCounts.join(',')}] median=${pool.medianBin} p25=${pool.p25Bin} p75=${pool.p75Bin}`);
}
if (ledger.pools.isEmpty()) console.log('NO_POOLS');
process.exit(0);
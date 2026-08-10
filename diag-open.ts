// Headless reproduction of the browser "openCategory" flow via the Node tooling
// stack (WalletFacade + local proof server + Preview indexer/RPC).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './src/network';
import { createWallet, persistWalletState, unshieldedToken } from './src/wallet';
import { createProviders, PRIVATE_STATE_ID } from './src/providers';
import { witnesses, createSalaryPoolPrivateState } from './src/witnesses';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const network = 'preview';
const { config: networkConfig } = resolveNetwork({ argv: ['', '', '--network', network] });
const deployment = getDeployment(network);
if (!deployment) { console.log('NO_DEPLOYMENT'); process.exit(1); }
const SEED = getOrCreateSeed(network);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, 'contracts', 'managed', 'confidential_salary_benchmarking');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

type ContractModuleType = typeof import('./contracts/managed/confidential_salary_benchmarking/contract/index.js');
const ContractModule = (await import(pathToFileURL(contractPath).href)) as ContractModuleType;

const compiledContract = CompiledContract.make('confidential_salary_benchmarking', ContractModule.Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
console.log('Syncing...');
await walletCtx.wallet.waitForSyncedState();
await persistWalletState(network, walletCtx);
const balance = (await walletCtx.wallet.waitForSyncedState()).unshielded.balances[unshieldedToken().raw] ?? 0n;
console.log('BALANCE:', balance.toString());

const providers = await createProviders(walletCtx, networkConfig);
providers.privateStateProvider.setContractAddress(deployment.address);

const deployed = await findDeployedContract(providers as any, {
  compiledContract: compiledContract as any,
  contractAddress: deployment.address,
  privateStateId: PRIVATE_STATE_ID,
  initialPrivateState: createSalaryPoolPrivateState(),
});
console.log('CONNECTED to', deployment.address);

const dust = (await walletCtx.wallet.waitForSyncedState()).dust.balance(new Date());
console.log('DUST:', dust.toString());

console.log('OPENING CATEGORY 5: Diagnostics / Isolation (out of the way) ...');
try {
  const tx = await deployed.callTx.openCategory(5n, 'Diagnostics / Isolation');
  console.log('RESULT_OK');
  console.log('TX:');
  console.log(JSON.stringify(tx, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2).slice(0, 3000));
  console.log('TX_ID:', tx.public?.txId);
  console.log('TX_HASH:', tx.public?.txHash);
} catch (e: any) {
  console.log('RESULT_ERROR');
  let cur: any = e;
  let depth = 0;
  while (cur && depth < 8) {
    console.log(`[${depth}]`, cur?.message ?? String(cur));
    cur = cur?.cause;
    depth++;
  }
}
await persistWalletState(network, walletCtx);
await walletCtx.wallet.stop();
process.exit(0);
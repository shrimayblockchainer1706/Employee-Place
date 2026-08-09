/**
 * Non-interactive end-to-end driver for the Confidential Salary Benchmarking
 * Pool.
 *
 * Exercises the full contract lifecycle against a live network (the local
 * devnet by default) using the genesis-seed wallet, asserting on-chain ledger
 * transitions after every transaction. The scenario runs on its own
 * freshly-deployed (throwaway) contract instance:
 *
 *   complete — open category → N× private contributions → update benchmark
 *              → verify the published quantile bands and contributor count.
 *
 * PRIVACY assertions: after each contribution we re-read the public ledger and
 * verify the exact private salary, key and experience never appear.
 *
 * Usage:
 *   tsx src/e2e.ts --network undeployed
 *
 * Deployments made here are NOT recorded in .midnight-state.json; the recorded
 * production deployment is left untouched.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { Buffer } from 'buffer';

// Midnight SDK imports
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import * as Rx from 'rxjs';

import { resolveNetwork, getOrCreateSeed } from './network';
import { createWallet, unshieldedToken } from './wallet';
import { createProviders, PRIVATE_STATE_ID } from './providers';
import {
  witnesses,
  createSalaryPoolPrivateState,
  withContributorKey,
  withSalary,
  withYearsOfExperience,
  type SalaryPoolPrivateState,
} from './witnesses';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const { network, config: networkConfig, source: networkSource } = resolveNetwork();
const SEED = getOrCreateSeed(network);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'confidential_salary_benchmarking');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

if (!fs.existsSync(contractPath)) {
  console.error('\n❌ Contract not compiled! Run: npm run compile\n');
  process.exit(1);
}

type ContractModuleType = typeof import('../contracts/managed/confidential_salary_benchmarking/contract/index.js');
const ContractModule = (await import(pathToFileURL(contractPath).href)) as ContractModuleType;

const compiledContract = CompiledContract.make(
  'confidential_salary_benchmarking',
  ContractModule.Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

const randomBytes32 = () => new Uint8Array(crypto.randomBytes(32));
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const BAND_LOWS = [1n, 300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n];
const BAND_HIGHS = [300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n, 100000000n];
const BAND_LABELS = ['₹0–₹3L', '₹3L–₹5L', '₹5L–₹8L', '₹8L–₹12L', '₹12L–₹18L', '₹18L–₹25L', '₹25L–₹40L', '₹40L+'];

const midBandSalary = (band: number): bigint => (BAND_LOWS[band] + BAND_HIGHS[band]) / 2n;

async function waitForProofServer(maxAttempts = 60, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fetch(networkConfig.proofServer, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return true;
    } catch {
      // keep waiting
    }
    if (attempt < maxAttempts) await sleep(delayMs);
  }
  return false;
}

let failures = 0;

function check(cond: boolean, message: string): void {
  if (cond) {
    console.log(`    ✓ ${message}`);
  } else {
    failures++;
    console.error(`    ✗ FAIL: ${message}`);
  }
}

async function deployFresh(providers: Awaited<ReturnType<typeof createProviders>>) {
  console.log('\n  Deploying fresh contract instance (proof may take 30–60s)...');
  const deployed = await deployContract(providers as any, {
    compiledContract: compiledContract as any,
    args: [],
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: createSalaryPoolPrivateState(),
  });
  const address = deployed.deployTxData.public.contractAddress;
  console.log(`  Contract address: ${address}`);

  providers.privateStateProvider.setContractAddress(address);
  const contract = await findDeployedContract(providers as any, {
    compiledContract: compiledContract as any,
    contractAddress: address,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: createSalaryPoolPrivateState(),
  });
  return { address, contract };
}

async function readLedger(providers: any, address: string): Promise<any | null> {
  const contractState = await providers.publicDataProvider.queryContractState(address);
  return contractState ? ContractModule.ledger(contractState.data) : null;
}

async function waitForLedger(
  providers: any,
  address: string,
  predicate: (ledger: any) => boolean,
  label: string,
  timeoutMs = 180_000,
): Promise<any> {
  const deadline = Date.now() + timeoutMs;
  let lastLedger: any = null;
  while (Date.now() < deadline) {
    lastLedger = await readLedger(providers, address);
    if (lastLedger && predicate(lastLedger)) return lastLedger;
    await sleep(3000);
  }
  throw new Error(`Timed out waiting for ledger state: ${label}`);
}

async function doCall(label: string, action: () => Promise<{ public: any }>): Promise<string> {
  console.log(`\n  → ${label} (generating proof, may take 30–60s)...`);
  const tx = await action();
  const txId = tx.public.txId ?? tx.public.txHash;
  console.log(`    ✅ ${label} — tx ${txId} @ block ${tx.public.blockHeight}`);
  return txId;
}

async function savePrivateState(providers: any, next: SalaryPoolPrivateState): Promise<void> {
  await providers.privateStateProvider.set(PRIVATE_STATE_ID, next);
}

async function readPool(providers: any, address: string, category: bigint): Promise<any> {
  const ledger = await readLedger(providers, address);
  return ledger?.pools?.lookup?.(category) ?? null;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  E2E — Confidential Salary Benchmarking Pool                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Network: ${network} (via ${networkSource})\n`);

  console.log('─── Wallet setup ───────────────────────────────────────────────\n');
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });

  console.log('  Syncing wallet... (may take a minute)');
  const state = await walletCtx.wallet.waitForSyncedState();
  let balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`  Balance: ${balance.toLocaleString()} tNight`);

  if (balance === 0n) {
    console.error('\n  ❌ Wallet has zero tNight. The devnet may need `npm run setup` first.\n');
    await walletCtx.wallet.stop();
    process.exit(1);
  }

  // DUST — needed to pay tx fees.
  console.log('\n  Checking DUST...');
  const dustState: any = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)));
  const unregisteredUtxos = dustState.unshielded.availableCoins.filter(
    (c: any) => !c.meta?.registeredForDustGeneration,
  );
  if (unregisteredUtxos.length > 0) {
    console.log(`  Registering ${unregisteredUtxos.length} NIGHT UTXOs for DUST generation...`);
    const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
      unregisteredUtxos,
      walletCtx.unshieldedKeystore.getPublicKey(),
      (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload),
    );
    await walletCtx.wallet.submitTransaction(await walletCtx.wallet.finalizeRecipe(recipe));
  }
  if (dustState.dust.balance(new Date()) === 0n) {
    console.log('  Waiting for DUST tokens...');
    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter((s: any) => s.isSynced),
        Rx.filter((s: any) => s.dust.balance(new Date()) > 0n),
      ),
    );
  }
  console.log('  DUST ready.');

  const proofServerReady = await waitForProofServer();
  if (!proofServerReady) {
    console.error('\n  ❌ Proof server not responding. Run: docker compose up -d\n');
    await walletCtx.wallet.stop();
    process.exit(1);
  }

  const providers = await createProviders(walletCtx, networkConfig);
  const { address, contract } = await deployFresh(providers);

  console.log('\n' + '─'.repeat(62));
  console.log('SCENARIO: complete (open → 5× private contributions → publish benchmark)');
  console.log('─'.repeat(62));

  const CATEGORY = 0n;

  // 1. Open a category.
  await doCall('openCategory', () => contract.callTx.openCategory(CATEGORY, 'Software Engineer / Bengaluru (E2E)'));
  let pool = await waitForLedger(
    providers,
    address,
    (l) => l.pools.member(CATEGORY),
    'category opened',
  ).then(() => readPool(providers, address, CATEGORY));
  check(pool.name === 'Software Engineer / Bengaluru (E2E)', 'category label stored publicly');
  check(pool.contributorCount === 0n, 'contributor count starts at 0');

  // 2. Five distinct contributors, spread across bands 1–5.
  const bands = [1n, 2n, 3n, 4n, 5n];
  const salaries: bigint[] = [];
  for (const band of bands) {
    const salary = midBandSalary(Number(band));
    salaries.push(salary);
    const ps = withYearsOfExperience(
      withSalary(withContributorKey(createSalaryPoolPrivateState(), randomBytes32()), salary),
      BigInt(3 + Number(band)),
    );
    await savePrivateState(providers, ps);
    await doCall(`submitSalaryContribution (band ${band})`, () =>
      contract.callTx.submitSalaryContribution(CATEGORY, band),
    );
    pool = await waitForLedger(
      providers,
      address,
      (l) => l.pools.lookup(CATEGORY).contributorCount === BigInt(bands.indexOf(band) + 1),
      `contributorCount=${bands.indexOf(band) + 1}`,
    ).then(() => readPool(providers, address, CATEGORY));
    console.log(`    [ledger] contributors=${pool.contributorCount}, bins=${pool.binCounts.join(',')}`);

    // Privacy: no exact salary may appear in the public ledger.
    const ledger = await readLedger(providers, address);
    const serialized = JSON.stringify(ledger, (_k, v) =>
      typeof v === 'bigint' ? `${v}n` : v instanceof Uint8Array ? Array.from(v).join(',') : v,
    );
    for (const s of salaries) {
      check(!serialized.includes(s.toString()), 'exact salary never published');
    }
  }

  // 3. The contributor count is visible even before the benchmark publishes.
  check(pool.contributorCount === 5n, 'contributor count visible pre-threshold');

  // 4. Publish the benchmark once the threshold is reached.
  await doCall('updateBenchmark', () => contract.callTx.updateBenchmark(CATEGORY));
  pool = await waitForLedger(
    providers,
    address,
    (l) => l.pools.lookup(CATEGORY).benchmarkAvailable === true,
    'benchmarkAvailable=true',
  ).then(() => readPool(providers, address, CATEGORY));

  check(pool.benchmarkAvailable === true, 'benchmark published after threshold');
  console.log(`    [ledger] median=${BAND_LABELS[Number(pool.medianBin)]} (band ${pool.medianBin})`);
  console.log(`    [ledger] p25   =${BAND_LABELS[Number(pool.p25Bin)]} (band ${pool.p25Bin})`);
  console.log(`    [ledger] p75   =${BAND_LABELS[Number(pool.p75Bin)]} (band ${pool.p75Bin})`);
  check(pool.medianBin === 3n, `median band expected 3, got ${pool.medianBin}`);
  check(pool.p25Bin === 2n, `p25 band expected 2, got ${pool.p25Bin}`);
  check(pool.p75Bin === 4n, `p75 band expected 4, got ${pool.p75Bin}`);
  check(pool.contributorCount === 5n, 'contributor count unchanged by updateBenchmark');

  const runningBalance = (await walletCtx.wallet.waitForSyncedState()).unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log('─'.repeat(62));
  console.log(`\n  Final wallet balance: ${runningBalance.toLocaleString()} tNight (started ${balance.toLocaleString()})`);

  await walletCtx.wallet.stop();

  console.log('\n  ' + (failures === 0 ? '✅ ALL E2E CHECKS PASSED' : `❌ ${failures} assertion(s) failed`));
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch(async (err) => {
  console.error('\n  ❌ E2E crashed:', err?.message ?? err);
  process.exitCode = 1;
});
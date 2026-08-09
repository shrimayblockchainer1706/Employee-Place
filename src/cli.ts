/**
 * Interactive CLI for the Confidential Salary Benchmarking Pool contract.
 *
 * Flow on a deployed contract:
 *   1. Open a role/location category (its label is public)
 *   2. Contribute a salary privately — the salary, years of experience and the
 *      contributor key are zero-knowledge witness inputs. The contract only
 *      learns which coarse salary band the contribution belongs to.
 *   3. Update the benchmark once at least MIN_CONTRIBUTORS exist
 *   4. View the current benchmark / contributor counts
 *
 * PRIVACY: the contributor key, salary and years of experience live only in
 * the wallet's private state provider. They are used to build zero-knowledge
 * proofs and are never printed, logged, or written to the ledger.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { Buffer } from 'buffer';

// Midnight SDK imports
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken } from './wallet';
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

// Salary band definitions (annual INR) — must match the contract.
const BAND_LOWS = [0n, 300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n];
const BAND_HIGHS = [300000n, 500000n, 800000n, 1200000n, 1800000n, 2500000n, 4000000n, 100000000n];

function bandForSalary(salary: bigint): number {
  for (let b = 0; b < BAND_LOWS.length; b++) {
    if (salary >= BAND_LOWS[b] && salary <= BAND_HIGHS[b]) return b;
  }
  return 7;
}

const BAND_LABELS = [
  '₹0 – ₹3L',
  '₹3L – ₹5L',
  '₹5L – ₹8L',
  '₹8L – ₹12L',
  '₹12L – ₹18L',
  '₹18L – ₹25L',
  '₹25L – ₹40L',
  '₹40L+',
];

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(
  __dirname,
  '..',
  'contracts',
  'managed',
  'confidential_salary_benchmarking',
);
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

function randomBytes32(): Uint8Array {
  return new Uint8Array(crypto.randomBytes(32));
}

function isZero(bytes: Uint8Array): boolean {
  return bytes.every((b) => b === 0);
}

function showBand(bin: bigint | number | undefined): string {
  const b = typeof bin === 'bigint' ? Number(bin) : Number(bin ?? 0);
  return BAND_LABELS[b] ?? String(b);
}

function showPools(ledger: any): void {
  console.log('\n─── Categories & Pools ─────────────────────────────────────────');
  if (!ledger || !ledger.pools) {
    console.log('  (no contract state)');
    return;
  }
  let count = 0;
  for (const [key, pool] of ledger.pools) {
    count++;
    console.log(`  Category ${String(key)} — "${pool.name}"`);
    console.log(`    contributors: ${pool.contributorCount?.toString?.() ?? '0'}`);
    console.log(`    benchmark available: ${pool.benchmarkAvailable ? 'yes' : 'no'}`);
    if (pool.benchmarkAvailable) {
      console.log(`    median band: ${showBand(pool.medianBin)}`);
      console.log(`    25th band : ${showBand(pool.p25Bin)}`);
      console.log(`    75th band : ${showBand(pool.p75Bin)}`);
    } else {
      console.log('    (hidden until minimum contributors reach the threshold)');
    }
    console.log('');
  }
  if (count === 0) console.log('  (no categories opened yet)\n');
}

async function readAmount(rl: any, prompt: string): Promise<bigint> {
  const raw = await rl.question(prompt);
  return BigInt(raw.trim());
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('    Confidential Salary Benchmarking Pool — CLI');
  console.log('══════════════════════════════════════════════════════════════════\n');
  console.log('  Software engineers privately contribute salaries; aggregate');
  console.log('  salary benchmarks are only published once the anonymity');
  console.log('  threshold is reached.\n');

  const rl = createInterface({ input: stdin, output: stdout });

  const deployment = getDeployment(network);
  if (!deployment) {
    console.error(`No deploy on file for network ${network}. Run \`npm run setup -- --network ${network}\` first.`);
    process.exit(1);
  }
  console.log(`  Contract: ${deployment.address}`);
  console.log(`  Network: ${network}\n`);

  try {
    const seed = SEED;
    console.log('  Connecting to wallet...');
    const walletCtx = await createWallet({ network, networkConfig, seed });
    const restoredCount = Object.values(walletCtx.restored).filter(Boolean).length;
    if (restoredCount > 0) {
      console.log(`  Restored ${restoredCount}/3 child wallets from .midnight-wallet-state — sync will resume from saved point.`);
    }

    console.log('  Syncing with network...');
    const syncStart = Date.now();
    const syncInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - syncStart) / 1000);
      process.stdout.write(`\r  ⏳ Still syncing... (${elapsed}s elapsed)   `);
    }, 5000);
    const state = await walletCtx.wallet.waitForSyncedState();
    clearInterval(syncInterval);
    process.stdout.write('\r  ✓ Synced with network.\n');

    await persistWalletState(network, walletCtx);
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    if (balance === 0n && network !== 'undeployed' && networkConfig.faucet) {
      const address = walletCtx.unshieldedKeystore.getBech32Address();
      console.log('  ⚠ Wallet has no tNight. Fund it from the faucet to send transactions:');
      console.log(`     ${networkConfig.faucet}`);
      console.log(`     Wallet address: ${address}\n`);
    }

    console.log('  Connecting to contract...');
    const providers = await createProviders(walletCtx, networkConfig);
    providers.privateStateProvider.setContractAddress(deployment.address);

    const deployed: any = await findDeployedContract(providers, {
      compiledContract: compiledContract as any,
      contractAddress: deployment.address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: createSalaryPoolPrivateState(),
    });

    console.log('  ✅ Connected!\n');

    const readCurrentLedger = async () => {
      const contractState = await providers.publicDataProvider.queryContractState(deployment.address);
      return contractState ? ContractModule.ledger(contractState.data) : null;
    };

    // Use callTx methods that return a transaction with public + private data.
    const doCall = async (label: string, action: () => Promise<any>) => {
      console.log(`\n  ${label} — generating zero-knowledge proof (30–60s)...`);
      const tx = await action();
      console.log(`  ✅ ${label} succeeded.`);
      const pub = tx?.public ?? {};
      if (pub.txId) console.log(`  Transaction ID: ${pub.txId}`);
      if (pub.blockHeight !== undefined) console.log(`  Block height: ${pub.blockHeight}`);
      console.log('');
    };

    let running = true;
    while (running) {
      console.log('─── Menu ───────────────────────────────────────────────────────');
      console.log('  1. Open a role/location category');
      console.log('  2. Contribute my salary (private, proved, never revealed)');
      console.log('  3. Update benchmark (publish stats once threshold is reached)');
      console.log('  4. View benchmark for a category');
      console.log('  5. Show contract pools');
      console.log('  6. Check wallet balance');
      console.log('  7. Exit\n');

      const choice = await rl.question('  Your choice: ');

      try {
        switch (choice.trim()) {
          case '1': {
            const category = Number(await rl.question('  Category id (0–5): '));
            const name = (await rl.question('  Category label (e.g. "Software Engineer / Pune"): ')).trim();
            await doCall('Open category', () => deployed.callTx.openCategory(BigInt(category), name));
            showPools(await readCurrentLedger());
            break;
          }

          case '2': {
            const category = Number(await rl.question('  Category id (0–5): '));
            const salary = await readAmount(rl, '  Annual salary (INR): ');
            const years = await readAmount(rl, '  Years of experience: ');
            if (salary <= 0n) throw new Error('Salary must be positive');
            if (years > 50n) throw new Error('Experience must be ≤ 50 years');

            // A fresh contributor key keeps this contribution anonymous and
            // unique (it cannot be tied back to the earlier contribution).
            const key = randomBytes32();
            const band = bandForSalary(salary);

            let ps: SalaryPoolPrivateState = createSalaryPoolPrivateState();
            ps = withContributorKey(ps, key);
            ps = withSalary(withYearsOfExperience(ps, years), salary);
            await providers.privateStateProvider.set(PRIVATE_STATE_ID, {
              contributorKey: ps.contributorKey,
              salary: ps.salary,
              yearsOfExperience: ps.yearsOfExperience,
            });

            await doCall('Submit salary contribution', () =>
              deployed.callTx.submitSalaryContribution(BigInt(category), BigInt(band)),
            );
            console.log('  [Privacy] Your salary was proved in zero-knowledge and used only');
            console.log('  to increment one coarse histogram band. It was never revealed.');
            console.log(`  The contract only recorded that a salary in band "${showBand(band)}" arrived.\n`);
            showPools(await readCurrentLedger());
            break;
          }

          case '3': {
            const category = Number(await rl.question('  Category id (0–5): '));
            await doCall('Update benchmark', () => deployed.callTx.updateBenchmark(BigInt(category)));
            showPools(await readCurrentLedger());
            break;
          }

          case '4': {
            const category = Number(await rl.question('  Category id (0–5): '));
            const ledger = await readCurrentLedger();
            const pool = ledger?.pools?.lookup(BigInt(category));
            if (!pool) {
              console.log('\n  📋 Category not opened yet.\n');
              break;
            }
            if (!pool.benchmarkAvailable) {
              console.log('\n  📋 Not enough contributions yet.');
              console.log('     The benchmark will become available after the privacy threshold is reached.\n');
            } else {
              console.log(`\n  Employees contributing: ${pool.contributorCount?.toString?.() ?? 'n/a'}`);
              console.log(`  Median salary:   ${showBand(pool.medianBin)}`);
              console.log(`  25th percentile: ${showBand(pool.p25Bin)}`);
              console.log(`  75th percentile: ${showBand(pool.p75Bin)}`);
              console.log('  (Approximate percentile bands computed from the public histogram.)\n');
            }
            break;
          }

          case '5': {
            showPools(await readCurrentLedger());
            break;
          }

          case '6': {
            const currentState = await walletCtx.wallet.waitForSyncedState();
            const currentBalance = currentState.unshielded.balances[unshieldedToken().raw] ?? 0n;
            const dustBalance = currentState.dust.balance(new Date());
            console.log(`\n  tNight: ${currentBalance.toLocaleString()}`);
            console.log(`  DUST:   ${dustBalance.toLocaleString()}\n`);
            break;
          }

          case '7':
            running = false;
            console.log('\n  👋 Goodbye!\n');
            break;

          default:
            console.log('\n  ❌ Invalid choice. Please enter 1-7.\n');
        }
      } catch (error: any) {
        console.error('\n  ❌ Failed:', error?.message ?? error);
        const cause = error?.cause?.message ?? error?.cause?.toString?.();
        if (cause && cause !== error?.message) console.error(`     Cause: ${cause}`);
        console.log('');
      }
    }

    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
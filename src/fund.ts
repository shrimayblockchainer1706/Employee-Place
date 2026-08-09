/**
 * Send NIGHT from the local devnet's genesis wallet to a target address.
 *
 * The local `undeployed` devnet mints NIGHT only to the genesis wallet, so a
 * browser wallet (1AM/Lace in "Undeployed" mode) has no funds to pay for
 * transaction fees. This script transfers NIGHT to the browser wallet's
 * unshielded address; the wallet then auto-registers its UTXOs for DUST
 * generation (DUST is the transaction-fee token).
 *
 * Usage:
 *   npm run fund -- --address mn_addr_undeployed1... [--amount 1000]
 */
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';

import {
  MidnightBech32m,
  UnshieldedAddress,
} from '@midnight-ntwrk/wallet-sdk';

import { parseNetworkFlag, resolveNetwork, getOrCreateSeed } from './network';
import { createWallet, persistWalletState, unshieldedToken } from './wallet';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const NIGHT_UNITS = 10n ** 6n;

function parseArgs(argv: string[]): { address: string; amount: bigint } {
  let address = '';
  let amount = 1000n;
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--address') address = argv[i + 1] ?? '';
    else if (arg.startsWith('--address=')) address = arg.slice('--address='.length);
    else if (arg === '--amount') amount = BigInt(argv[i + 1] ?? '');
    else if (arg.startsWith('--amount=')) amount = BigInt(arg.slice('--amount='.length));
  }
  return { address, amount };
}

async function waitForDust(ctx: Awaited<ReturnType<typeof createWallet>>, timeoutMs = 600_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await Rx.firstValueFrom(ctx.wallet.state().pipe(Rx.filter((x: any) => x.isSynced)));
    if (s.dust.balance(new Date()) > 0n) return;
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('DUST was not generated in time. Check the node is healthy (docker compose ps).');
}

async function main(): Promise<void> {
  const { address, amount } = parseArgs(process.argv);
  if (!address) {
    console.error('Usage: npm run fund -- --address <mn_addr_undeployed_...> [--amount <NIGHT>]');
    process.exit(1);
  }

  let argv = [...process.argv];
  if (parseNetworkFlag(argv) === null) {
    argv = [argv[0], argv[1], '--network', 'undeployed', ...argv.slice(2)];
  }
  const { network, config: networkConfig } = resolveNetwork({ argv });
  if (network !== 'undeployed') {
    console.error('Funding from the genesis wallet only works on the local undeployed devnet.');
    process.exit(1);
  }

  const amountRaw = amount * NIGHT_UNITS;

  console.log('\n─── Fund browser wallet on local devnet ─────────────────────────\n');
  const seed = getOrCreateSeed('undeployed');
  const walletCtx = await createWallet({ network, networkConfig, seed });

  console.log('  Syncing with network...');
  const state = await walletCtx.wallet.waitForSyncedState();
  await persistWalletState(network, walletCtx);

  const sender = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`  Genesis wallet: ${sender}`);
  console.log(`  Balance: ${(balance / NIGHT_UNITS).toLocaleString()} NIGHT\n`);

  if (balance <= amountRaw) {
    console.error('  ❌ Genesis wallet has insufficient NIGHT for this transfer.');
    await walletCtx.wallet.stop();
    process.exit(1);
  }

  // Ensure the sender has DUST (the fee token) for the transfer.
  console.log('  Checking DUST...');
  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((x: any) => x.isSynced)));
  const unregistered = dustState.unshielded.availableCoins.filter(
    (c: any) => !c.meta?.registeredForDustGeneration,
  );
  if (unregistered.length > 0) {
    console.log(`  Registering ${unregistered.length} NIGHT UTXOs for DUST generation...`);
    const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
      unregistered,
      walletCtx.unshieldedKeystore.getPublicKey(),
      (payload) => walletCtx.unshieldedKeystore.signData(payload),
    );
    const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
    await walletCtx.wallet.submitTransaction(finalized);
  }
  if (dustState.dust.balance(new Date()) === 0n) {
    console.log('  Waiting for DUST to be generated...');
    await waitForDust(walletCtx);
  }
  console.log('  DUST ready.\n');

  const parsedRecipient = MidnightBech32m.parse(address);
  if (parsedRecipient.network !== 'undeployed') {
    console.error(`  ❌ Expected an undeployed address (mn_addr_undeployed1...), got: ${address}`);
    await walletCtx.wallet.stop();
    process.exit(1);
  }
  const recipient = parsedRecipient.decode(UnshieldedAddress, parsedRecipient.network);

  console.log(`  Transferring ${amount.toLocaleString()} NIGHT to ${address}...`);
  const recipe = await walletCtx.wallet.transferTransaction(
    [
      {
        type: 'unshielded',
        outputs: [{ type: unshieldedToken().raw, receiverAddress: recipient, amount: amountRaw }],
      },
    ],
    {
      shieldedSecretKeys: walletCtx.shieldedSecretKeys,
      dustSecretKey: walletCtx.dustSecretKey,
    },
    { ttl: new Date(Date.now() + 10 * 60 * 1000) },
  );
  const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
  const txId = await walletCtx.wallet.submitTransaction(finalized);

  console.log(`\n  ✅ Sent ${amount.toLocaleString()} NIGHT to ${address}`);
  console.log(`     Transaction: ${txId}`);
  console.log('\n  Next steps in the browser:');
  console.log('    1. In the wallet extension, wait for the balance to appear (~1 min).');
  console.log('    2. The wallet auto-registers UTXOs for DUST generation; a little DUST');
  console.log('       will appear shortly after the balance.');
  console.log('    3. Deploy the contract from the UI, then create a project.\n');

  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

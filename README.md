# Confidential Salary Benchmarking dApp

A zero-knowledge salary benchmarking application built on the **Midnight Network** (Preview). Users contribute their salary to a role/location category **privately**, and the dApp publishes an aggregate salary-band distribution and quantile benchmarks — **without ever publishing anyone's exact salary**.

Contributors can compare how their pay compares with others in the same role/location while keeping the precise number (and their years of experience) confidential.

> This project was built for the **INTO the Midnight — SPPU bootcamp**.

---

## How the privacy model works

The Midnight contract only ever learns **coarse, aggregate information** about a pool of contributions:

1. **Your exact salary is never published on-chain.** The contribution circuit receives the exact annual salary only as a private (zero-knowledge) witness.
2. **Your salary is collapsed into a coarse salary band.** The contract records just the index of the band the salary falls into (e.g. `₹12L – ₹18L`), not the salary itself. The `salary` witness is used to *prove* that the disclosed band index is consistent with the actual salary.
3. **Only the appropriate band count is recorded.** The public ledger stores a histogram of band counts per category, the total contribution count, and the sum of contributions — a single contribution advances exactly one histogram bin.
4. **Years of experience are a private input.** The proof verifies the experience value is within the valid range (0–50 years) without revealing it. Experience is not stored on-chain.
5. **The benchmark stays hidden until an anonymity threshold is reached.** A benchmark (25th percentile, median and 75th percentile band indices) is not published until a category has **at least 5 contributors**. Publishing is an explicit transaction (`Recompute benchmark` / `updateBenchmark`); below the threshold the contract refuses with *"Not enough contributors to publish a benchmark"* and only the aggregate histogram counts are visible.
6. **Duplicate contributions are prevented without identities.** Each contributor uses a fresh random pseudonym key; only a one-way nullifier commitment of that key is stored, so the same key cannot contribute twice to a category while the key itself never appears on-chain.

See `tests/salary_benchmarking.test.ts` for a full behavioral specification of these rules.

---

## Key features

- **Midnight wallet connection** — connects to the Midnight browser wallet extension through the official DApp-Connector API (`window.midnight`).
- **Preview network support** — Preview (public testnet) is the canonical browser network; `preprod` and the local `undeployed` devnet are also selectable.
- **Private salary contribution** — exact salary and experience are proven in zero-knowledge and never leave the device.
- **Salary-band histogram** — the public ledger stores and renders per-category band counts (`Salary Pools`).
- **Anonymity threshold** — benchmark quantiles are published only once a category reaches 5 contributors.
- **Category creation** — anyone can open one of the 6 category slots (0–5) with a public label (e.g. `Software Engineer / Bengaluru`).
- **Wallet / DUST diagnostics** — a `Wallet status` panel shows the wallet network, DUST balance and cap, tNIGHT balance, and the wallet's indexer/node endpoints.
- **Backup & restore** — password-encrypted export/import of private contract state and signing keys (`Security / backup` panel).
- **Error decoding** — actionable messages for common failures, including the Midnight node rejection `Custom error: 170` (`InvalidDustSpendProof`).

---

## Architecture

```
┌──────────────────────────┐          ┌──────────────────────────────┐
│ Browser (React + Vite)   │          │ Midnight wallet extension    │
│  - dApp UI                │          │  - holds secret keys         │
│  - Midnight JS SDK        │  DApp-   │  - signs + submits txs       │
│  - local proving (circuit)│  Connector│  - builds the DUST fee spend │
└───────┬──────────┬────────┘          └──────────────┬───────────────┘
        │          │                                 │
        │ wallet/  │httpClientProofProvider           │ submit / balance
        │ submit   │(VITE_PROOF_SERVER_URL)          │
        ▼          ▼                                 ▼
┌───────────────────┐                        ┌───────────────────────┐
│ Local proof server│                        │ Midnight Preview net  │
│ (docker compose,  │                        │  - RPC node (public)  │
│  port 6305, CORS) │                        │  - Indexer (GraphQL)  │
└───────────────────┘                        └───────────────────────┘
```

Components:

- **`frontend/` — React + Vite dApp.** React 18, TypeScript, Vite. Builds the salary-pool UI, adapts the wallet into Midnight JS SDK providers, and proves the custom contract circuits against the local proof server.
- **Midnight smart contract** — `contracts/confidential_salary_benchmarking.compact` (Compact source), compiled by `compact compile` into `contracts/managed/confidential_salary_benchmarking` (git-ignored, generated).
- **Midnight wallet extension** — stores secret keys, signs transactions, and constructs the DUST fee spend internally; the dApp never sees private keys.
- **Local proof server** — `docker compose` service exposing the Midnight proving endpoint on `127.0.0.1:6305` with CORS enabled. Used by the browser to prove the *custom contract circuits* (`VITE_PROOF_SERVER_URL`); the wallet extension uses its own proving endpoint for the DUST fee leg.
- **Preview network + indexer** — the public Preview indexer (`indexer.preview.midnight.network`) provides the GraphQL public-data provider used to read live on-chain contract state.

### How a transaction flows (browser → contract)

1. The wallet connects over the DApp Connector and the dApp builds the Midnight JS SDK provider set (private state, indexer public data, ZK config, proof provider, wallet & midnight providers).
2. `connectToContract` calls `findDeployedContract` with the on-chain contract address.
3. A user action (e.g. `openCategory`, `submitSalaryContribution`) builds an "unbound" contract transaction containing the circuit proof (produced locally against the proof server) plus the private witnesses (salary, experience, contributor key) — which never leave the device.
4. The dApp sends the unsealed transaction to the wallet via `balanceUnsealedTransaction`; the wallet adds the DUST fee spend and returns a signed, finalized transaction.
5. The dApp submits it via `submitTransaction`; the wallet relays it to the Midnight node, the transaction is proven and finalized, and the indexer exposes the updated public ledger state, which the dApp polls every 8 seconds.

---

## Privacy & security

What the dApp and contract actually do (see `frontend/src/lib/witnesses.ts` and the contract tests):

| Item | Visibility |
|---|---|
| Category label, category id, contributor count, band histogram, quantile band indices, round | **Public** (on-chain ledger) |
| Exact annual salary | **Private** — used only as a ZK witness; never stored, emitted, or rendered |
| Years of experience | **Private** — proven in range (0–50), never revealed |
| Contributor pseudonym key | **Private** — only a one-way nullifier commitment is stored on-chain |
| tNIGHT / DUST balances and network id | **Public** to the dApp for display (Wallet status panel) |

Privacy is *mathematical*, not just policy: the data is never placed on the ledger in the first place. That said, **the exact level of anonymity a contributor enjoys depends on the pool size** — with very few contributors in a category, a coarse band + timing could still imply information. The contract mitigates this by keeping quantile benchmarks unpublished below the 5-contributor threshold, but this is a mitigation, not an absolute anonymity guarantee. Nothing here constitutes a security or anonymity certificate.

---

## Getting started

Prerequisites: **Node.js ≥ 22**, a package manager (npm), and **Docker** (for the proof server). A **Midnight wallet browser extension** is required to use the dApp.

```bash
# 1. Clone the repository
git clone <your-public-repo-url>
cd Employee-Place

# 2. Install dependencies (root tooling + frontend)
npm install
npm --prefix frontend install

# 3. Compile the contract (generates contracts/managed/... used by CLI tooling)
npm run compile

# 4. Configure the frontend environment
cp frontend/.env.example frontend/.env.local
#   then edit frontend/.env.local (see "Environment variables" below)

# 5. Start the required proof server (docker compose, port 6305)
npm run proof-server:start

# 6. (Optional) fund/set up the CLI wallet & deploy a contract on Preview
npm run setup

# 7. Start the frontend dev server
npm run frontend:dev        # equivalent to npm --prefix frontend run dev
```

The dev server prints a local URL (default `http://localhost:5173`). Open it, connect your Midnight wallet, and interact.

### Other useful scripts (see `package.json`)

| Command | Purpose |
|---|---|
| `npm test` | Run the vitest suite |
| `npm run build` | Root TypeScript check (`tsc --noEmit`) |
| `npm --prefix frontend run typecheck` | Frontend TypeScript check |
| `npm run frontend:build` | Production build of the frontend (`frontend/dist`) |
| `npm run deploy` / `npm run cli` / `npm run check-balance` | CLI tooling against a network |
| `npm run proof-server:stop` | Stop the proof server |

---

## Environment variables

All variables are read from `frontend/.env.local` (copy `frontend/.env.example`). Use **placeholders** — never commit real values.

| Variable | Example / placeholder | Description |
|---|---|---|
| `VITE_NETWORK` | `preview` | Network the dApp requests from the wallet. `preview` is the canonical default; `preprod` and `undeployed` (local devnet) are also supported. |
| `VITE_CONTRACT_ADDRESS` | `<DEPLOYED_CONTRACT_ADDRESS>` | Address of the deployed contract to auto-connect to. Leave empty to use the in-app "Connect" flow / deploy panel. |
| `VITE_INDEXER_URL` | `https://indexer.preview.midnight.network/api/v4/graphql` | GraphQL endpoint used to read live contract state. Defaults to the wallet's configured indexer if unset. |
| `VITE_INDEXER_WS_URL` | `wss://indexer.preview.midnight.network/api/v4/graphql/ws` | Indexer WebSocket endpoint (public-data provider). |
| `VITE_PROOF_SERVER_URL` | `http://127.0.0.1:6305` | Local Midnight proof server used to prove the custom contract circuits (CORS enabled by `compose.yml`). |

> **⚠️ Never commit `.env.local` or any secret.** `.env.local` is already covered by `*.env.local` in `.gitignore`, and contains no secrets — but always keep credentials, wallet keys, seeds, and tokens out of the repository.

---

## Wallet setup

1. Install the **Midnight wallet** browser extension and create a wallet.
2. Switch the wallet to the **Preview** network (the dApp defaults to Preview; the Wallet status panel shows the network the wallet is actually connected to).
3. Make sure the wallet is **fully synchronized** to the chain tip before transacting.
4. Ensure **DUST balance > 0** — Midnight transactions pay their fee in DUST, which the wallet generates from its tNIGHT balance. The `Wallet status` panel shows DUST balance/cap and tNIGHT.
5. After connecting, the dApp shows the contract address and the **Wallet status** panel (network, DUST balance/cap, tNIGHT, indexer/node endpoints) so you can verify everything is healthy before acting.

### If you see `InvalidDustSpendProof` / `Custom error: 170`

The node rejected the transaction because the **DUST fee spend proof** did not verify against the chain state. This almost always means the wallet's DUST state is stale or out of sync. In order:

1. Open the wallet extension.
2. Confirm it is on **Preview** and fully synced to the chain tip.
3. Confirm the **DUST balance is greater than zero** (generate DUST from tNIGHT if needed).
4. Retry — the dApp builds a fresh transaction on every attempt, so a plain retry is safe.
5. If it still fails, fully reset / re-sync the wallet extension's local state (clear its cache and reconnect), then retry.

The dApp decodes `Custom error: 170` and `171` (and unknown node rejections) into these actionable steps automatically; the raw technical detail is always retained in the message.

---

## User guide

Use the actual UI, in the layout shown after connecting:

### A. Connect wallet
- In **Wallet & Contract**, pick the network (default **Preview**), optionally paste the deployed contract address, and click **Connect wallet**.
- Approve the connection in the wallet browser extension.
- Once connected you'll see your wallet address, contract address, and the **Wallet status** panel.

### B. Open a category
- In **Open a category**, choose a free category id (0–5) and give it a public label (e.g. `Software Engineer / Bengaluru`), then click **Open category**.
- Categories that are already open are disabled in the dropdown ("already …").
- The label is public; the salaries contributed to it are not.

### C. Contribute a salary
- In **Contribute your salary**, pick an open category, enter your **annual salary (INR)** (the form shows the band it maps to) and your **years of experience**, then click **Prove & submit contribution**.
- Approve the transaction (and its DUST fee) in the wallet extension.
- Only the coarse band count changes on-chain — your exact salary and experience never leave your device.

### D. View the benchmark
- The **Salary Pools** panel shows each category's band histogram and contributor count, plus the number still needed to reach the **5-contributor anonymity threshold**.
- Once the threshold is reached, other contributors press **Recompute benchmark** to publish the **25th percentile, median, and 75th percentile salary bands** (coarse bands, not exact salaries).
- Below the threshold, a message explains that the benchmark is withheld to keep individual salaries anonymous.

---

## Testing

The repository's verified status:

| Command | Expected |
|---|---|
| `npm test` | Pass — 4 test files, 44 tests (contract behavior via simulator, backup/restore, password policy, error decoding) |
| `npm run build` | Pass — root TypeScript check |
| `npm --prefix frontend run typecheck` | Pass — frontend TypeScript check |
| `npm --prefix frontend run build` | Pass — production Vite build of `frontend/dist` |

The contract behavior is covered by `tests/salary_benchmarking.test.ts` (using `tests/simulator.ts`), and the network/error handling by `tests/errors.test.ts`.

---

## Diagnostic tooling

The repository includes read-only diagnostics for the **Preview** deployment (all reference only public on-chain data):

- **`diag-open.ts`** — headless reproduction of the browser `openCategory` flow via the Node tooling stack (WalletFacade + local proof server + Preview): syncs a CLI wallet, connects to the deployed contract, submits `openCategory`, and prints the result. *Requires prior `npm run setup` state (git-ignored).*
- **`diag-state.ts`** — decodes the deployed contract's current public ledger (pools, bands, benchmark availability) from the Preview indexer.
- **`diag-tx.ts`** — watches the Preview indexer over GraphQL over WebSocket for transactions against the deployed contract.
- **`diag-verify.ts`** — verifies a known transaction hash (id, block height, contract action) and dumps/decode contract state from the Preview indexer.

These are engineering diagnostics, not part of the shipped application.

---

## Deployment

The frontend is a standard static Vite build — deploy `frontend/dist` to any static host (Vercel, Netlify, Cloudflare Pages, etc.).

Before building, note the requirements:

1. **Compile the contract** so design-time assets exist: `npm run compile` (produces `contracts/managed/…`, copied into the build by `vite-plugin-static-copy` at `/contract/compiled/…`).
2. **Set the `VITE_*` variables at build time** on the host (see Environment variables above) — e.g. `VITE_NETWORK=preview`, `VITE_CONTRACT_ADDRESS=<DEPLOYED_CONTRACT_ADDRESS>`, plus indexer and proof-server URLs. `Vite` bakes `VITE_*` values into the bundle.
3. **Build:** `npm --prefix frontend run build`, then deploy `frontend/dist`.

Vercel example: framework preset **Vite**, root directory `frontend`, build command `npm run build`, output directory `dist` — or simply use a static deploy of `frontend/dist`.

> ⚠️ **Important caveat for hosted demos:** proving the *custom contract circuits* is done by each visitor's browser against the **local proof server** (`VITE_PROOF_SERVER_URL`, `127.0.0.1:6305`). On a hosted site, a visitor must run the proof server on their own machine (or you must provide a hosted proving endpoint) for contract transactions to succeed. This is a functional requirement of the current architecture, not a hosting bug.

---

## Live Demo

**[🌐 Open the live application](https://employee-place-git-main-shrimayblockchainer1706s-projects.vercel.app/)**

---

## Demo Video

[▶️ Watch the Employee-Place demo video](./EmployeePlace.mp4)

---

## Repository structure

```
.
├── frontend/                         # React + Vite browser dApp
│   ├── src/
│   │   ├── App.tsx                   # layout: wallet, pools, open, contribute, backup
│   │   ├── components/               # ConnectWallet, PoolsView, OpenCategory,
│   │   │                             # ContributeSalary, BackupPanel
│   │   ├── hooks/useMidnight.tsx     # connection + contract action state / context
│   │   └── lib/                      # wallet adapter, providers, network, ledger,
│   │                                 # witnesses (privacy), errors, bands, backup
│   └── .env.example                  # environment template (copy to .env.local)
├── contracts/
│   ├── confidential_salary_benchmarking.compact   # Midnight contract source
│   └── managed/                      # generated compile output (git-ignored)
├── src/                              # Node CLI/tooling (wallet, deploy, fund, e2e)
│   ├── wallet.ts / providers.ts      # WalletFacade + provider construction
│   └── network.ts / setup.ts         # network resolution, state file, setup
├── tests/                            # vitest suite + contract simulator
│   ├── salary_benchmarking.test.ts
│   ├── errors.test.ts
│   ├── backup-sdk.test.ts
│   └── simulator.ts
├── diag-open.ts / diag-state.ts / diag-tx.ts / diag-verify.ts   # Preview diagnostics
├── compose.yml                       # local proof server (port 6305)
├── package.json                      # root scripts/deps
└── frontend/package.json             # frontend scripts/deps
```

---

## Known limitations

- **Preview / testnet environment** — the deployed contract lives on the public Preview network; it is a test network and state can be reset by infrastructure changes.
- **Wallet extension required** — the browser flow needs the Midnight wallet extension; there is no keyless/embedded fallback.
- **Local proof server required** — the browser proves custom contract circuits against the local proving server (`127.0.0.1:6305`); hosted/deployed visitors must also run it (see Deployment).
- **Anonymity threshold is fixed at 5 contributors** — below that, quantile benchmarks are withheld (only aggregate histogram counts are visible); above it, a coarse 3-quantile summary is published. Anonymity is a function of pool size; small pools offer weaker anonymity.
- **Fixed capacity** — at most **6 categories** (ids 0–5) and at most **20 contributors per category** (the contract rejects further contributions with "Category is full").
- **Salary model** — contributions are annual INR salaries in one of the contract's fixed bands; out-of-range salaries (> ₹100 crore) and experience > 50 years are rejected.
- **One contribution per pseudonym per category** — duplicate contributions from the same key are rejected.

---

## License

`package.json` declares **MIT**, but note that **no `LICENSE` file is included yet** — a `LICENSE` file should be added before publishing the repository publicly. A license can also be added later, in which case this section should be updated to match.


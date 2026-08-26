# Product Proposal

## Product Name

**Employee-Place — Confidential Salary Benchmarking Pool**

## One-Line Pitch

A zero-knowledge salary benchmarking dApp on the Midnight Network where employees privately contribute salary data and receive aggregate role/location benchmarks — without anyone's exact salary ever being revealed.

## Problem

Salary information is one of the most sensitive pieces of personal data an employee holds, yet existing salary benchmarks force a harmful trade-off:

- **Salary-sharing platforms require exposing your exact salary** to the platform operator and other users.
- **Self-reported surveys leak information** to whoever runs the survey and, often, to other participants.
- **Negotiating a raise** is hardest when neither side has credible, role-and-location-specific data.

An employee who wants a fair salary benchmark currently has to *trust someone with their exact number*. That trust is rarely warranted — data is leaked, sold, or correlated back to individuals.

## Solution

Employee-Place removes the trust requirement using Midnight's zero-knowledge privacy model:

1. **Exact salary never leaves the device.** The salary exists only as a zero-knowledge witness inside a proving circuit. The circuit proves that the salary falls inside a coarse band — nothing more.
2. **Only a coarse histogram is stored on-chain.** The ledger records *how many* salaries fell in each of 8 coarse INR bands, plus a contributor count — never a single salary.
3. **Quantile benchmarks are withheld until an anonymity threshold is reached.** Benchmark quantiles (25th percentile, median, 75th percentile) are published only once a category has at least 5 contributors; below that, the contract refuses to publish.
4. **Contributions are pseudonymous and unlinkable.** Each contribution uses a fresh random pseudonym key. Only a one-way nullifier commitment is stored on-chain, so the same key cannot contribute twice — while the key itself never appears on-chain.

The result: everyone learns the *distribution* of salaries in a role/location, and nobody learns *your* salary.

## Why Privacy Matters

Salary data is highly sensitive and personally identifiable. Publishing exact salaries — even under pseudonyms — creates re-identification risk through correlation with public information (job title, company, location, experience level). Midnight's zero-knowledge model ensures:

- The proving circuit only reveals that a salary belongs to a coarse band, not its magnitude.
- No wallet address, name, or identifier is linked to any contribution on-chain.
- Anonymity thresholds prevent statistical attacks on small groups.
- Experience data is validated in zero-knowledge and never stored at all.

## Target Users

- **Employees** in the technology and professional services sectors who want to understand how their compensation compares to peers in the same role and location.
- **HR and compensation teams** who want aggregate, privacy-preserving market data for salary benchmarking without collecting individual salary disclosures.
- **Job seekers** evaluating offers against real market data without requiring any individual to expose their salary.

## Core User Flow

1. **Connect wallet** — User connects the Midnight browser wallet extension to the dApp.
2. **Open a category** — Any user creates a role/location category (e.g. "Software Engineer / Bengaluru"). Category labels are public; contributions to them are private.
3. **Contribute salary** — User enters their annual salary (INR) and years of experience. The dApp proves in zero-knowledge that the salary falls inside the selected coarse band, and only the band count is written on-chain. Exact salary never leaves the device.
4. **View salary pools** — The dApp displays per-category band histograms and contributor counts from the on-chain ledger.
5. **Publish benchmark** — Once a category reaches 5 contributors, coarse quantile benchmarks (25th percentile, median, 75th percentile) are published as band ranges. Below the threshold, benchmarks are withheld to protect anonymity.

## Midnight / Technical Approach

Employee-Place is a real Midnight dApp — it does not simulate any part of the stack:

- **Compact smart contract** (`contracts/confidential_salary_benchmarking.compact`) with 5 circuits: `openCategory`, `submitSalaryContribution`, `updateBenchmark`, `getContributorCount`, and `getBenchmark`. Private inputs (salary, experience, pseudonym key) are zero-knowledge witnesses.
- **Midnight wallet extension** — holds all secret keys, builds and signs transactions, constructs the DUST fee spend. The dApp never sees private keys.
- **Midnight JS SDK providers** — the frontend builds the full provider set (private state, indexer public data, ZK config, proof provider) from the connected wallet.
- **Local proof server** — proves the custom contract circuits via `httpClientProofProvider`. The wallet uses its own proving endpoint for the DUST fee leg.
- **Preview network** — deployed on the Midnight Preview public testnet; the frontend reads live contract state via the Preview indexer's GraphQL API.

## Privacy Model

**What an observer CAN learn from the public ledger:**
- Category names, contributor counts, and total contributions.
- Per-category salary-band histogram (how many salaries fell in each coarse band).
- Nullifier commitments (prevents double-contributing without revealing identity).
- Published quantile band indices (only after the 5-contributor threshold).
- Network-level metadata: which wallet address submitted each transaction.

**What an observer CANNOT learn:**
- Any individual's exact salary.
- Any individual's years of experience.
- Which contribution belongs to which wallet or person.
- Exact quantile values (only coarse band approximations are published).

**Honest limitations:**
- Anonymity depends on pool size; small pools offer weaker anonymity.
- Network-level metadata (transaction timing, wallet address) is public.
- The 5-contributor threshold mitigates but does not eliminate re-identification risk.

## Competitive / Differentiating Value

| Feature | Traditional platforms | Employee-Place |
|---|---|---|
| Exact salary exposure | Required | Never |
| Data operator trust | Required | Not required |
| On-chain pseudonymity | N/A or weak | Cryptographic nullifiers |
| Statistical method | Exact values stored | Zero-knowledge band proofs |
| Anonymity threshold | None | 5-contributor minimum |
| Blockchain | None or public ledger with full data | Midnight (ZK-native L1) |
| Open source contract | Rare | Compact source + tests committed |

## Future Expansion

- **More category slots** — expand beyond the current 6 categories and 20-contributor cap.
- **Configurable anonymity threshold** — allow categories to set their own minimum contributor count.
- **Cross-category analytics** — aggregate benchmarks across related role/location categories.
- **Experience-weighted benchmarks** — factor in years of experience as a privacy-preserving dimension.
- **Multi-currency support** — extend beyond INR to USD, EUR, and other salary currencies.
- **DAO governance** — community-controlled parameter tuning (thresholds, bands, category management).
- **Mobile wallet support** — as Midnight wallet SDK expands to mobile, extend the dApp accordingly.

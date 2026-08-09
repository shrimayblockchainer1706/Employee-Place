/*
 * Re-exports the compiled Confidential Salary Benchmarking Pool contract so the
 * rest of the frontend can import `Contract`, `Ledger`, `ledger()` and the
 * contract's `Witnesses` type from one place.
 *
 * The generated module lives outside `frontend/` (at the repo root under
 * `contracts/managed/...`); Vite is configured (`server.fs.allow`) to serve it,
 * and its sibling `index.d.ts` provides full types.
 */
export * from '../../../contracts/managed/confidential_salary_benchmarking/contract/index.js';
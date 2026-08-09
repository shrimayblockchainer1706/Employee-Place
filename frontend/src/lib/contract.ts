import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { Contract } from '../contract/index';
import { witnesses } from './witnesses';

export const CONTRACT_NAME = 'confidential_salary_benchmarking';

/**
 * The compiled, witness-wired Confidential Salary Benchmarking Pool contract
 * binding. Same construction as the repo's Node tooling (src/deploy.ts), but
 * the compiled assets are resolved from the browser-served static tree rather
 * than the filesystem.
 */
export const compiledContract = CompiledContract.make(
  CONTRACT_NAME,
  Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(`./contract/compiled/${CONTRACT_NAME}`),
);
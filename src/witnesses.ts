/*
 * Private state + witness functions for the Confidential Salary Benchmarking
 * Pool.
 *
 * PRIVACY: This is the ONLY place in the Node tooling where an employee's
 * private data lives:
 *
 *   contributorKey       — the contributor's secret pseudonym key (32 bytes).
 *                          Only its one-way nullifier hash reaches the chain.
 *   salary               — the individual annual salary, in INR. It is used
 *                          ONLY as a zero-knowledge witness input; the exact
 *                          number is never stored, printed, logged, emitted,
 *                          put in the ledger, or returned by the contract.
 *   yearsOfExperience    — exact years of experience. Proved in-range, never
 *                          revealed.
 *
 * None of these values are ever written to the ledger, logged, or printed.
 */

import { type WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Ledger } from '../contracts/managed/confidential_salary_benchmarking/contract/index.js';

export type SalaryPoolPrivateState = {
  readonly contributorKey: Uint8Array;
  readonly salary: bigint;
  readonly yearsOfExperience: bigint;
};

export const createSalaryPoolPrivateState = (): SalaryPoolPrivateState => ({
  contributorKey: new Uint8Array(32),
  salary: 0n,
  yearsOfExperience: 0n,
});

export const withContributorKey = (
  privateState: SalaryPoolPrivateState,
  contributorKey: Uint8Array,
): SalaryPoolPrivateState => ({ ...privateState, contributorKey });

export const withSalary = (
  privateState: SalaryPoolPrivateState,
  salary: bigint,
): SalaryPoolPrivateState => ({ ...privateState, salary });

export const withYearsOfExperience = (
  privateState: SalaryPoolPrivateState,
  yearsOfExperience: bigint,
): SalaryPoolPrivateState => ({ ...privateState, yearsOfExperience });

export const witnesses = {
  contributor_key: ({
    privateState,
  }: WitnessContext<Ledger, SalaryPoolPrivateState>): [SalaryPoolPrivateState, Uint8Array] => [
    privateState,
    privateState.contributorKey,
  ],
  salary: ({
    privateState,
  }: WitnessContext<Ledger, SalaryPoolPrivateState>): [SalaryPoolPrivateState, bigint] => [
    privateState,
    privateState.salary,
  ],
  years_of_experience: ({
    privateState,
  }: WitnessContext<Ledger, SalaryPoolPrivateState>): [SalaryPoolPrivateState, bigint] => [
    privateState,
    privateState.yearsOfExperience,
  ],
};
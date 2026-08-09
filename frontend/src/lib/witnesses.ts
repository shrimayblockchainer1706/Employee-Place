/*
 * Browser private state + witness functions for the Confidential Salary
 * Benchmarking Pool.
 *
 * PRIVACY: This is the ONLY place in the frontend where an employee's private
 * data lives:
 *
 *   contributorKey      — the contributor's secret pseudonym key (32 bytes).
 *                         Only its one-way nullifier commitment reaches the
 *                         on-chain ledger.
 *   salary              — the individual annual salary, in INR. Used ONLY as a
 *                         zero-knowledge witness input; the exact number is
 *                         never stored on the ledger, emitted, or rendered.
 *   yearsOfExperience   — exact years of experience. Proved in-range, never
 *                         revealed.
 *
 * These values are held in memory for the duration of a contribution, stored
 * only inside the encrypted private-state provider (IndexedDB via
 * levelPrivateStateProvider) and NEVER logged, rendered, or sent anywhere.
 */

import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from '../contract/index';

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

const randomBytes32 = (): Uint8Array => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
};

export const isZeroBytes = (bytes: Uint8Array): boolean => bytes.every((b) => b === 0);

/**
 * Generate a fresh contributor pseudonym key. A fresh key per contribution
 * keeps each submission anonymous and unique (it cannot be linked to a wallet
 * or to any previous contribution). It is held only in private state.
 */
export const createContributorKey = (): Uint8Array => randomBytes32();
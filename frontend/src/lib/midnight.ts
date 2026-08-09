/*
 * Thin runtime wrapper around `midnight-js-contracts` for the Confidential
 * Salary Benchmarking Pool. Keeps all knowledge of private state, the private
 * state ID and the compiled contract bundle in one place so the React hooks
 * stay declarative.
 *
 * PRIVACY: the private state (contributor key, salary, experience) is written
 * ONLY into the encrypted browser private-state storage for the duration of a
 * proof and removed afterwards. Nothing derived from it is ever rendered.
 */
import {
  deployContract,
  findDeployedContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import { compiledContract } from './contract';
import { PRIVATE_STATE_ID, type SalaryPoolProviders } from './providers';
import {
  createSalaryPoolPrivateState,
  withContributorKey,
  withSalary,
  withYearsOfExperience,
  createContributorKey,
} from './witnesses';
import { bandForSalary } from './bands';
import { ensureNetworkConfigured } from './network';

export type { SalaryPoolProviders } from './providers';

export async function connectToContract(
  providers: SalaryPoolProviders,
  contractAddress: string,
) {
  ensureNetworkConfigured();
  providers.privateStateProvider.setContractAddress(contractAddress);
  return findDeployedContract(providers, {
    compiledContract,
    contractAddress,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: createSalaryPoolPrivateState(),
  });
}

export async function deployFreshContract(providers: SalaryPoolProviders) {
  ensureNetworkConfigured();
  return deployContract(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: createSalaryPoolPrivateState(),
  });
}

export interface ContributionInputs {
  readonly category: bigint;
  readonly salary: bigint;
  readonly yearsOfExperience: bigint;
}

/**
 * Privately contributes a salary to a category. The salary, the experience and
 * the fresh pseudonym key are written into encrypted private state, the
 * submitted circuit proves the salary belongs to the disclosed band, and the
 * exact values never leave the device.
 */
export async function submitSalaryContribution(
  providers: SalaryPoolProviders,
  contractAddress: string,
  circuitInterface: Awaited<ReturnType<typeof findDeployedContract>>['callTx'],
  inputs: ContributionInputs,
): Promise<string> {
  if (inputs.salary < 1n) throw new Error('Salary must be positive.');
  if (inputs.yearsOfExperience > 50n) {
    throw new Error('Experience must be 50 years or fewer.');
  }

  ensureNetworkConfigured();
  providers.privateStateProvider.setContractAddress(contractAddress);
  // A fresh contributor key per contribution keeps it anonymous & non‑linkable.
  const contributorKey = createContributorKey();
  const privateState = withYearsOfExperience(
    withSalary(withContributorKey(createSalaryPoolPrivateState(), contributorKey), inputs.salary),
    inputs.yearsOfExperience,
  );
  await providers.privateStateProvider.set(PRIVATE_STATE_ID, privateState);

  const tx = await circuitInterface.submitSalaryContribution(
    inputs.category,
    BigInt(bandForSalary(inputs.salary)),
  );
  return tx.public.txId;
}

export async function openCategory(
  providers: SalaryPoolProviders,
  contractAddress: string,
  circuitInterface: Awaited<ReturnType<typeof findDeployedContract>>['callTx'],
  category: bigint,
  name: string,
): Promise<string> {
  ensureNetworkConfigured();
  providers.privateStateProvider.setContractAddress(contractAddress);
  const tx = await circuitInterface.openCategory(category, name);
  return tx.public.txId;
}

export async function updateBenchmark(
  providers: SalaryPoolProviders,
  contractAddress: string,
  circuitInterface: Awaited<ReturnType<typeof findDeployedContract>>['callTx'],
  category: bigint,
): Promise<string> {
  ensureNetworkConfigured();
  providers.privateStateProvider.setContractAddress(contractAddress);
  const tx = await circuitInterface.updateBenchmark(category);
  return tx.public.txId;
}
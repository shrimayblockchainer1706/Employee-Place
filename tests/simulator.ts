/**
 * Headless simulator for the Confidential Salary Benchmarking Pool contract.
 *
 * Executes the compiled contract's impure circuits locally (no node, no
 * prover) so contract logic can be unit-tested with vitest — the same
 * approach used by Midnight's example-bboard `bboard-simulator`.
 */
import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  type Ledger,
  ledger,
} from '../contracts/managed/confidential_salary_benchmarking/contract/index.js';
import {
  type SalaryPoolPrivateState,
  witnesses,
} from '../src/witnesses.js';

export type BenchmarkView = {
  available: boolean;
  contributorCount: bigint;
  medianBin: bigint;
  p25Bin: bigint;
  p75Bin: bigint;
};

export class SalaryPoolSimulator {
  readonly contract: Contract<SalaryPoolPrivateState>;
  circuitContext: CircuitContext<SalaryPoolPrivateState>;

  constructor(privateState: SalaryPoolPrivateState) {
    this.contract = new Contract<SalaryPoolPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(privateState, '0'.repeat(64)),
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): SalaryPoolPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public setPrivateState(privateState: SalaryPoolPrivateState): void {
    this.circuitContext.currentPrivateState = privateState;
  }

  public openCategory(category: bigint, name: string): Ledger {
    this.circuitContext = this.contract.impureCircuits.openCategory(
      this.circuitContext,
      category,
      name,
    ).context;
    return this.getLedger();
  }

  public getPool(category: bigint) {
    return this.getLedger().pools.lookup(category);
  }

  public getContributorCount(category: bigint): bigint {
    return this.contract.impureCircuits.getContributorCount(
      this.circuitContext,
      category,
    ).result;
  }

  public getBenchmark(category: bigint): BenchmarkView {
    return this.contract.impureCircuits.getBenchmark(
      this.circuitContext,
      category,
    ).result as BenchmarkView;
  }

  public submitSalaryContribution(category: bigint, band: bigint): Ledger {
    this.circuitContext = this.contract.impureCircuits.submitSalaryContribution(
      this.circuitContext,
      category,
      band,
    ).context;
    return this.getLedger();
  }

  public updateBenchmark(category: bigint): Ledger {
    this.circuitContext = this.contract.impureCircuits.updateBenchmark(
      this.circuitContext,
      category,
    ).context;
    return this.getLedger();
  }
}
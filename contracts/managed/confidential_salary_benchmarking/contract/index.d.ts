import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  contributor_key(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  salary(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  years_of_experience(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  openCategory(context: __compactRuntime.CircuitContext<PS>,
               category_0: bigint,
               name_0: string): __compactRuntime.CircuitResults<PS, []>;
  submitSalaryContribution(context: __compactRuntime.CircuitContext<PS>,
                           category_0: bigint,
                           band_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  updateBenchmark(context: __compactRuntime.CircuitContext<PS>,
                  category_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  getContributorCount(context: __compactRuntime.CircuitContext<PS>,
                      category_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  getBenchmark(context: __compactRuntime.CircuitContext<PS>, category_0: bigint): __compactRuntime.CircuitResults<PS, { available: boolean,
                                                                                                                        contributorCount: bigint,
                                                                                                                        medianBin: bigint,
                                                                                                                        p25Bin: bigint,
                                                                                                                        p75Bin: bigint
                                                                                                                      }>;
}

export type ProvableCircuits<PS> = {
  openCategory(context: __compactRuntime.CircuitContext<PS>,
               category_0: bigint,
               name_0: string): __compactRuntime.CircuitResults<PS, []>;
  submitSalaryContribution(context: __compactRuntime.CircuitContext<PS>,
                           category_0: bigint,
                           band_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  updateBenchmark(context: __compactRuntime.CircuitContext<PS>,
                  category_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  getContributorCount(context: __compactRuntime.CircuitContext<PS>,
                      category_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  getBenchmark(context: __compactRuntime.CircuitContext<PS>, category_0: bigint): __compactRuntime.CircuitResults<PS, { available: boolean,
                                                                                                                        contributorCount: bigint,
                                                                                                                        medianBin: bigint,
                                                                                                                        p25Bin: bigint,
                                                                                                                        p75Bin: bigint
                                                                                                                      }>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  openCategory(context: __compactRuntime.CircuitContext<PS>,
               category_0: bigint,
               name_0: string): __compactRuntime.CircuitResults<PS, []>;
  submitSalaryContribution(context: __compactRuntime.CircuitContext<PS>,
                           category_0: bigint,
                           band_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  updateBenchmark(context: __compactRuntime.CircuitContext<PS>,
                  category_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  getContributorCount(context: __compactRuntime.CircuitContext<PS>,
                      category_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  getBenchmark(context: __compactRuntime.CircuitContext<PS>, category_0: bigint): __compactRuntime.CircuitResults<PS, { available: boolean,
                                                                                                                        contributorCount: bigint,
                                                                                                                        medianBin: bigint,
                                                                                                                        p25Bin: bigint,
                                                                                                                        p75Bin: bigint
                                                                                                                      }>;
}

export type Ledger = {
  pools: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): { category: bigint,
                             name: string,
                             open: boolean,
                             contributorCount: bigint,
                             totalContributions: bigint,
                             binCounts: bigint[],
                             nullifiers: Uint8Array[],
                             medianBin: bigint,
                             p25Bin: bigint,
                             p75Bin: bigint,
                             benchmarkAvailable: boolean
                           };
    [Symbol.iterator](): Iterator<[bigint, { category: bigint,
  name: string,
  open: boolean,
  contributorCount: bigint,
  totalContributions: bigint,
  binCounts: bigint[],
  nullifiers: Uint8Array[],
  medianBin: bigint,
  p25Bin: bigint,
  p75Bin: bigint,
  benchmarkAvailable: boolean
}]>
  };
  readonly round: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;

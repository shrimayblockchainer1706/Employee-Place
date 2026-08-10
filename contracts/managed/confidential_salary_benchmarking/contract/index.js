import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_1 = __compactRuntime.CompactTypeOpaqueString;

const _descriptor_2 = __compactRuntime.CompactTypeBoolean;

const _descriptor_3 = new __compactRuntime.CompactTypeVector(8, _descriptor_0);

const _descriptor_4 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_5 = new __compactRuntime.CompactTypeVector(20, _descriptor_4);

class _SalaryPool_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_5.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment()))))))))));
  }
  fromValue(value_0) {
    return {
      category: _descriptor_0.fromValue(value_0),
      name: _descriptor_1.fromValue(value_0),
      open: _descriptor_2.fromValue(value_0),
      contributorCount: _descriptor_0.fromValue(value_0),
      totalContributions: _descriptor_0.fromValue(value_0),
      binCounts: _descriptor_3.fromValue(value_0),
      nullifiers: _descriptor_5.fromValue(value_0),
      medianBin: _descriptor_0.fromValue(value_0),
      p25Bin: _descriptor_0.fromValue(value_0),
      p75Bin: _descriptor_0.fromValue(value_0),
      benchmarkAvailable: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.category).concat(_descriptor_1.toValue(value_0.name).concat(_descriptor_2.toValue(value_0.open).concat(_descriptor_0.toValue(value_0.contributorCount).concat(_descriptor_0.toValue(value_0.totalContributions).concat(_descriptor_3.toValue(value_0.binCounts).concat(_descriptor_5.toValue(value_0.nullifiers).concat(_descriptor_0.toValue(value_0.medianBin).concat(_descriptor_0.toValue(value_0.p25Bin).concat(_descriptor_0.toValue(value_0.p75Bin).concat(_descriptor_2.toValue(value_0.benchmarkAvailable)))))))))));
  }
}

const _descriptor_6 = new _SalaryPool_0();

class _BenchmarkView_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()))));
  }
  fromValue(value_0) {
    return {
      available: _descriptor_2.fromValue(value_0),
      contributorCount: _descriptor_0.fromValue(value_0),
      medianBin: _descriptor_0.fromValue(value_0),
      p25Bin: _descriptor_0.fromValue(value_0),
      p75Bin: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.available).concat(_descriptor_0.toValue(value_0.contributorCount).concat(_descriptor_0.toValue(value_0.medianBin).concat(_descriptor_0.toValue(value_0.p25Bin).concat(_descriptor_0.toValue(value_0.p75Bin)))));
  }
}

const _descriptor_7 = new _BenchmarkView_0();

const _descriptor_8 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

class _Stats_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      med: _descriptor_0.fromValue(value_0),
      p25: _descriptor_0.fromValue(value_0),
      p75: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.med).concat(_descriptor_0.toValue(value_0.p25).concat(_descriptor_0.toValue(value_0.p75)));
  }
}

const _descriptor_9 = new _Stats_0();

const _descriptor_10 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

const _descriptor_11 = new __compactRuntime.CompactTypeVector(3, _descriptor_4);

class _Either_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_4.alignment().concat(_descriptor_4.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_2.fromValue(value_0),
      left: _descriptor_4.fromValue(value_0),
      right: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.is_left).concat(_descriptor_4.toValue(value_0.left).concat(_descriptor_4.toValue(value_0.right)));
  }
}

const _descriptor_12 = new _Either_0();

class _ContractAddress_0 {
  alignment() {
    return _descriptor_4.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.bytes);
  }
}

const _descriptor_13 = new _ContractAddress_0();

const _descriptor_14 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.contributor_key) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named contributor_key');
    }
    if (typeof(witnesses_0.salary) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named salary');
    }
    if (typeof(witnesses_0.years_of_experience) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named years_of_experience');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      openCategory: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`openCategory: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const category_0 = args_1[1];
        const name_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('openCategory',
                                     'argument 1 (as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 149 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(category_0) === 'bigint' && category_0 >= 0n && category_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('openCategory',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 149 char 1',
                                     'Uint<0..18446744073709551616>',
                                     category_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(category_0).concat(_descriptor_1.toValue(name_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._openCategory_0(context,
                                              partialProofData,
                                              category_0,
                                              name_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      submitSalaryContribution: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`submitSalaryContribution: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const category_0 = args_1[1];
        const band_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('submitSalaryContribution',
                                     'argument 1 (as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 177 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(category_0) === 'bigint' && category_0 >= 0n && category_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('submitSalaryContribution',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 177 char 1',
                                     'Uint<0..18446744073709551616>',
                                     category_0)
        }
        if (!(typeof(band_0) === 'bigint' && band_0 >= 0n && band_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('submitSalaryContribution',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 177 char 1',
                                     'Uint<0..18446744073709551616>',
                                     band_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(category_0).concat(_descriptor_0.toValue(band_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._submitSalaryContribution_0(context,
                                                          partialProofData,
                                                          category_0,
                                                          band_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      updateBenchmark: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`updateBenchmark: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const category_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('updateBenchmark',
                                     'argument 1 (as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 235 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(category_0) === 'bigint' && category_0 >= 0n && category_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('updateBenchmark',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 235 char 1',
                                     'Uint<0..18446744073709551616>',
                                     category_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(category_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._updateBenchmark_0(context,
                                                 partialProofData,
                                                 category_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      getContributorCount: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`getContributorCount: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const category_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('getContributorCount',
                                     'argument 1 (as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 259 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(category_0) === 'bigint' && category_0 >= 0n && category_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('getContributorCount',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 259 char 1',
                                     'Uint<0..18446744073709551616>',
                                     category_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(category_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._getContributorCount_0(context,
                                                     partialProofData,
                                                     category_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      getBenchmark: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`getBenchmark: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const category_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('getBenchmark',
                                     'argument 1 (as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 270 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(category_0) === 'bigint' && category_0 >= 0n && category_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('getBenchmark',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'confidential_salary_benchmarking.compact line 270 char 1',
                                     'Uint<0..18446744073709551616>',
                                     category_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(category_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._getBenchmark_0(context,
                                              partialProofData,
                                              category_0);
        partialProofData.output = { value: _descriptor_7.toValue(result_0), alignment: _descriptor_7.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      openCategory: this.circuits.openCategory,
      submitSalaryContribution: this.circuits.submitSalaryContribution,
      updateBenchmark: this.circuits.updateBenchmark,
      getContributorCount: this.circuits.getContributorCount,
      getBenchmark: this.circuits.getBenchmark
    };
    this.provableCircuits = {
      openCategory: this.circuits.openCategory,
      submitSalaryContribution: this.circuits.submitSalaryContribution,
      updateBenchmark: this.circuits.updateBenchmark,
      getContributorCount: this.circuits.getContributorCount,
      getBenchmark: this.circuits.getBenchmark
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('openCategory', new __compactRuntime.ContractOperation());
    state_0.setOperation('submitSalaryContribution', new __compactRuntime.ContractOperation());
    state_0.setOperation('updateBenchmark', new __compactRuntime.ContractOperation());
    state_0.setOperation('getContributorCount', new __compactRuntime.ContractOperation());
    state_0.setOperation('getBenchmark', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(0n),
                                                                                              alignment: _descriptor_14.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(1n),
                                                                                              alignment: _descriptor_14.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_14.toValue(1n),
                                                                  alignment: _descriptor_14.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_8.toValue(tmp_0),
                                                                alignment: _descriptor_8.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_11, value_0);
    return result_0;
  }
  _contributor_key_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.contributor_key(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('contributor_key',
                                 'return value',
                                 'confidential_salary_benchmarking.compact line 94 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_4.toValue(result_0),
      alignment: _descriptor_4.alignment()
    });
    return result_0;
  }
  _salary_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.salary(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.typeError('salary',
                                 'return value',
                                 'confidential_salary_benchmarking.compact line 95 char 1',
                                 'Uint<0..340282366920938463463374607431768211456>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_10.toValue(result_0),
      alignment: _descriptor_10.alignment()
    });
    return result_0;
  }
  _years_of_experience_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.years_of_experience(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('years_of_experience',
                                 'return value',
                                 'confidential_salary_benchmarking.compact line 96 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _validateBand_0(band_0, s_0) {
    const LOW_0 = [1n,
                   300000n,
                   500000n,
                   800000n,
                   1200000n,
                   1800000n,
                   2500000n,
                   4000000n];
    const HIGH_0 = [300000n,
                    500000n,
                    800000n,
                    1200000n,
                    1800000n,
                    2500000n,
                    4000000n,
                    100000000n];
    this._folder_0(((t_0, i_0) =>
                    {
                      if (this._equal_0(i_0, band_0)) {
                        let t_1;
                        __compactRuntime.assert((t_1 = LOW_0[i_0], t_1 <= s_0)
                                                &&
                                                s_0 <= HIGH_0[i_0],
                                                'Salary does not match selected band');
                      }
                      return t_0;
                    }),
                   [],
                   [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n]);
    return [];
  }
  _nullifierOf_0(category_0, key_0) {
    return this._persistentHash_0([__compactRuntime.convertFieldToBytes(32,
                                                                        category_0,
                                                                        'confidential_salary_benchmarking.compact line 113 char 48'),
                                   new Uint8Array([99, 115, 98, 58, 115, 97, 108, 97, 114, 121, 58, 110, 117, 108, 108, 105, 102, 105, 101, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   key_0]);
  }
  _benchmarkStats_0(bins_0) {
    const indices_0 = [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n];
    const total_0 = this._folder_1(((acc_0, v_0) =>
                                    {
                                      return ((t1) => {
                                               if (t1 > 18446744073709551615n) {
                                                 throw new __compactRuntime.CompactError('confidential_salary_benchmarking.compact line 126 char 47: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                               }
                                               return t1;
                                             })(acc_0 + v_0);
                                    }),
                                   0n,
                                   bins_0);
    const __compact_pattern_tmp1_0 = this._folder_2(((acc_1, i_0) =>
                                                     {
                                                       const cum1_0 = ((t1) => {
                                                                        if (t1 > 18446744073709551615n) {
                                                                          throw new __compactRuntime.CompactError('confidential_salary_benchmarking.compact line 132 char 20: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                                                        }
                                                                        return t1;
                                                                      })(acc_1[0]
                                                                         +
                                                                         bins_0[i_0]);
                                                       const cum4_0 = ((t1) => {
                                                                        if (t1 > 18446744073709551615n) {
                                                                          throw new __compactRuntime.CompactError('confidential_salary_benchmarking.compact line 133 char 20: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                                                        }
                                                                        return t1;
                                                                      })(cum1_0
                                                                         *
                                                                         4n);
                                                       const three_0 = ((t1) => {
                                                                         if (t1 > 18446744073709551615n) {
                                                                           throw new __compactRuntime.CompactError('confidential_salary_benchmarking.compact line 134 char 21: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                                                         }
                                                                         return t1;
                                                                       })(total_0
                                                                          *
                                                                          3n);
                                                       const p25n_0 = this._equal_1(acc_1[1],
                                                                                    8n)
                                                                      &&
                                                                      cum4_0
                                                                      >=
                                                                      total_0
                                                                      ?
                                                                      i_0 :
                                                                      acc_1[1];
                                                       let t_0;
                                                       const medn_0 = this._equal_2(acc_1[2],
                                                                                    8n)
                                                                      &&
                                                                      (t_0 = ((t1) => {
                                                                               if (t1 > 18446744073709551615n) {
                                                                                 throw new __compactRuntime.CompactError('confidential_salary_benchmarking.compact line 136 char 46: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                                                               }
                                                                               return t1;
                                                                             })(cum1_0
                                                                                *
                                                                                2n),
                                                                       t_0
                                                                       >
                                                                       total_0)
                                                                      ?
                                                                      i_0 :
                                                                      acc_1[2];
                                                       const p75n_0 = this._equal_3(acc_1[3],
                                                                                    8n)
                                                                      &&
                                                                      cum4_0
                                                                      >=
                                                                      three_0
                                                                      ?
                                                                      i_0 :
                                                                      acc_1[3];
                                                       return [cum1_0,
                                                               p25n_0,
                                                               medn_0,
                                                               p75n_0];
                                                     }),
                                                    [0n, 8n, 8n, 8n],
                                                    indices_0);
    const cum_0 = __compact_pattern_tmp1_0[0];
    const p25_0 = __compact_pattern_tmp1_0[1];
    const med_0 = __compact_pattern_tmp1_0[2];
    const p75_0 = __compact_pattern_tmp1_0[3];
    return { med: med_0, p25: p25_0, p75: p75_0 };
  }
  _openCategory_0(context, partialProofData, category_0, name_0) {
    const revealedCategory_0 = category_0;
    const revealedName_0 = name_0;
    __compactRuntime.assert(category_0 < 6n, 'Category id out of range');
    __compactRuntime.assert(!_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_14.toValue(0n),
                                                                                                                   alignment: _descriptor_14.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(revealedCategory_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Category already open');
    const zeroes8_0 = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];
    const zeroes20_0 = [new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32),
                        new Uint8Array(32)];
    const tmp_0 = { category: revealedCategory_0,
                    name: revealedName_0,
                    open: true,
                    contributorCount: 0n,
                    totalContributions: 0n,
                    binCounts: zeroes8_0,
                    nullifiers: zeroes20_0,
                    medianBin: 0n,
                    p25Bin: 0n,
                    p75Bin: 0n,
                    benchmarkAvailable: false };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_14.toValue(0n),
                                                                  alignment: _descriptor_14.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(revealedCategory_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _submitSalaryContribution_0(context, partialProofData, category_0, band_0) {
    const revealedCategory_0 = category_0;
    const revealedBand_0 = band_0;
    const s_0 = this._salary_0(context, partialProofData);
    const exp_0 = this._years_of_experience_0(context, partialProofData);
    const key_0 = this._contributor_key_0(context, partialProofData);
    __compactRuntime.assert(_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_14.toValue(0n),
                                                                                                                  alignment: _descriptor_14.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(revealedCategory_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Category is not open');
    const pool_0 = _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_14.toValue(0n),
                                                                                                         alignment: _descriptor_14.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(revealedCategory_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    __compactRuntime.assert(band_0 < 8n, 'Invalid salary band');
    __compactRuntime.assert(s_0 >= 1n && s_0 <= 1000000000n,
                            'Salary out of valid range');
    __compactRuntime.assert(exp_0 <= 50n,
                            'Years of experience out of valid range');
    this._validateBand_0(revealedBand_0, s_0);
    let t_0;
    __compactRuntime.assert((t_0 = pool_0.contributorCount, t_0 < 20n),
                            'Category is full');
    const nullifier_0 = this._nullifierOf_0(revealedCategory_0, key_0);
    this._folder_3(context,
                   partialProofData,
                   ((context, partialProofData, t_1, i_0) =>
                    {
                      const existing_0 = pool_0.nullifiers[i_0];
                      __compactRuntime.assert(this._equal_4(existing_0,
                                                            new Uint8Array(32))
                                              ||
                                              !this._equal_5(existing_0,
                                                             nullifier_0),
                                              'Duplicate contribution from the same contributor');
                      return t_1;
                    }),
                   [],
                   [0n,
                    1n,
                    2n,
                    3n,
                    4n,
                    5n,
                    6n,
                    7n,
                    8n,
                    9n,
                    10n,
                    11n,
                    12n,
                    13n,
                    14n,
                    15n,
                    16n,
                    17n,
                    18n,
                    19n]);
    const idx_0 = [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n];
    const bins_0 = this._mapper_0(context,
                                  partialProofData,
                                  ((context, partialProofData, c_0, i_1) =>
                                   {
                                     if (this._equal_6(i_1, revealedBand_0)) {
                                       return ((t1) => {
                                                if (t1 > 18446744073709551615n) {
                                                  throw new __compactRuntime.CompactError('confidential_salary_benchmarking.compact line 203 char 66: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                                }
                                                return t1;
                                              })(c_0 + 1n);
                                     } else {
                                       return c_0;
                                     }
                                   }),
                                  pool_0.binCounts,
                                  idx_0);
    const revealedNullifier_0 = nullifier_0;
    const oldIndex_0 = pool_0.contributorCount;
    const idx20_0 = [0n,
                     1n,
                     2n,
                     3n,
                     4n,
                     5n,
                     6n,
                     7n,
                     8n,
                     9n,
                     10n,
                     11n,
                     12n,
                     13n,
                     14n,
                     15n,
                     16n,
                     17n,
                     18n,
                     19n];
    const newNullifiers_0 = this._mapper_1(context,
                                           partialProofData,
                                           ((context, partialProofData, n_0, i_2) =>
                                            {
                                              if (this._equal_7(i_2, oldIndex_0))
                                              {
                                                return revealedNullifier_0;
                                              } else {
                                                return n_0;
                                              }
                                            }),
                                           pool_0.nullifiers,
                                           idx20_0);
    const tmp_0 = { category: pool_0.category,
                    name: pool_0.name,
                    open: pool_0.open,
                    contributorCount:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('confidential_salary_benchmarking.compact line 222 char 23: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(pool_0.contributorCount + 1n),
                    totalContributions:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('confidential_salary_benchmarking.compact line 223 char 25: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(pool_0.totalContributions + 1n),
                    binCounts: bins_0,
                    nullifiers: newNullifiers_0,
                    medianBin: pool_0.medianBin,
                    p25Bin: pool_0.p25Bin,
                    p75Bin: pool_0.p75Bin,
                    benchmarkAvailable: pool_0.benchmarkAvailable };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_14.toValue(0n),
                                                                  alignment: _descriptor_14.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(revealedCategory_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_14.toValue(1n),
                                                                  alignment: _descriptor_14.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_8.toValue(tmp_1),
                                                                alignment: _descriptor_8.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _updateBenchmark_0(context, partialProofData, category_0) {
    const revealedCategory_0 = category_0;
    __compactRuntime.assert(_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_14.toValue(0n),
                                                                                                                  alignment: _descriptor_14.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(revealedCategory_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Category is not open');
    const pool_0 = _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_14.toValue(0n),
                                                                                                         alignment: _descriptor_14.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(revealedCategory_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    const threshold_0 = 5n;
    let t_0;
    __compactRuntime.assert((t_0 = pool_0.contributorCount, t_0 >= threshold_0),
                            'Not enough contributors to publish a benchmark');
    const stats_0 = this._benchmarkStats_0(pool_0.binCounts);
    const tmp_0 = { category: pool_0.category,
                    name: pool_0.name,
                    open: pool_0.open,
                    contributorCount: pool_0.contributorCount,
                    totalContributions: pool_0.totalContributions,
                    binCounts: pool_0.binCounts,
                    nullifiers: pool_0.nullifiers,
                    medianBin: stats_0.med,
                    p25Bin: stats_0.p25,
                    p75Bin: stats_0.p75,
                    benchmarkAvailable: true };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_14.toValue(0n),
                                                                  alignment: _descriptor_14.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(revealedCategory_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_14.toValue(1n),
                                                                  alignment: _descriptor_14.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_8.toValue(tmp_1),
                                                                alignment: _descriptor_8.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _getContributorCount_0(context, partialProofData, category_0) {
    const revealedCategory_0 = category_0;
    if (_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                  partialProofData,
                                                                  [
                                                                   { dup: { n: 0 } },
                                                                   { idx: { cached: false,
                                                                            pushPath: false,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_14.toValue(0n),
                                                                                              alignment: _descriptor_14.alignment() } }] } },
                                                                   { push: { storage: false,
                                                                             value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(revealedCategory_0),
                                                                                                                          alignment: _descriptor_0.alignment() }).encode() } },
                                                                   'member',
                                                                   { popeq: { cached: true,
                                                                              result: undefined } }]).value))
    {
      const pool_0 = _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_14.toValue(0n),
                                                                                                           alignment: _descriptor_14.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(revealedCategory_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
      return pool_0.contributorCount;
    } else {
      return 0n;
    }
  }
  _getBenchmark_0(context, partialProofData, category_0) {
    const revealedCategory_0 = category_0;
    if (_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                  partialProofData,
                                                                  [
                                                                   { dup: { n: 0 } },
                                                                   { idx: { cached: false,
                                                                            pushPath: false,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_14.toValue(0n),
                                                                                              alignment: _descriptor_14.alignment() } }] } },
                                                                   { push: { storage: false,
                                                                             value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(revealedCategory_0),
                                                                                                                          alignment: _descriptor_0.alignment() }).encode() } },
                                                                   'member',
                                                                   { popeq: { cached: true,
                                                                              result: undefined } }]).value))
    {
      const pool_0 = _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_14.toValue(0n),
                                                                                                           alignment: _descriptor_14.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(revealedCategory_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
      if (pool_0.benchmarkAvailable) {
        return { available: true,
                 contributorCount: pool_0.contributorCount,
                 medianBin: pool_0.medianBin,
                 p25Bin: pool_0.p25Bin,
                 p75Bin: pool_0.p75Bin };
      } else {
        return { available: false,
                 contributorCount: pool_0.contributorCount,
                 medianBin: 0n,
                 p25Bin: 0n,
                 p75Bin: 0n };
      }
    } else {
      return { available: false,
               contributorCount: 0n,
               medianBin: 0n,
               p25Bin: 0n,
               p75Bin: 0n };
    }
  }
  _equal_0(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _folder_0(f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(x, a0[i]); }
    return x;
  }
  _folder_1(f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(x, a0[i]); }
    return x;
  }
  _equal_1(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _folder_2(f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(x, a0[i]); }
    return x;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _folder_3(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 20; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_6(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _mapper_0(context, partialProofData, f, a0, a1) {
    let a = [];
    for (let i = 0; i < 8; i++) { a[i] = f(context, partialProofData, a0[i], a1[i]); }
    return a;
  }
  _equal_7(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _mapper_1(context, partialProofData, f, a0, a1) {
    let a = [];
    for (let i = 0; i < 20; i++) { a[i] = f(context, partialProofData, a0[i], a1[i]); }
    return a;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    pools: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_14.toValue(0n),
                                                                                                     alignment: _descriptor_14.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_14.toValue(0n),
                                                                                                     alignment: _descriptor_14.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'confidential_salary_benchmarking.compact line 86 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_14.toValue(0n),
                                                                                                     alignment: _descriptor_14.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'confidential_salary_benchmarking.compact line 86 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_14.toValue(0n),
                                                                                                     alignment: _descriptor_14.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_6.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get round() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_14.toValue(1n),
                                                                                                   alignment: _descriptor_14.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  contributor_key: (...args) => undefined,
  salary: (...args) => undefined,
  years_of_experience: (...args) => undefined
});
export const pureCircuits = {};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map

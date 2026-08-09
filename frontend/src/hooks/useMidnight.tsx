import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { connectToWallet, isWalletConnectorPresent } from '../lib/wallet';
import {
  connectToContract,
  deployFreshContract,
  submitSalaryContribution,
  openCategory,
  updateBenchmark,
} from '../lib/midnight';
import { buildProvidersFromConnectedAPI } from '../lib/providers';
import type { SalaryPoolProviders } from '../lib/providers';
import { queryLedgerState } from '../lib/ledger';
import type { LedgerView } from '../lib/ledger';
import { humanizeError } from '../lib/errors';
import { resolveNetworkId, configureNetwork } from '../lib/network';
import type {
  PrivateStateExport,
  SigningKeyExport,
  ImportPrivateStatesOptions,
  ImportSigningKeysOptions,
  ImportPrivateStatesResult,
  ImportSigningKeysResult,
} from '@midnight-ntwrk/midnight-js-types';

type ContractHandle = Awaited<ReturnType<typeof connectToContract>>;

export interface MidnightContextValue {
  readonly status: 'idle' | 'connecting' | 'connected' | 'error';
  readonly error: string | null;
  readonly networkName: string | null;
  readonly networkConfigured: boolean;
  readonly contractAddress: string | null;
  readonly walletAddress: string;
  /** True when wallet + network + contract are all ready for salary-pool actions. */
  readonly ready: boolean;
  readonly providers: SalaryPoolProviders | null;
  readonly contract: ContractHandle | null;
  readonly ledger: LedgerView | null;
  readonly isBusy: boolean;
  readonly busyLabel: string | null;
  readonly connect: (networkId: string, contractAddress: string | null) => Promise<void>;
  readonly deploy: (networkId: string) => Promise<string>;
  readonly disconnect: () => void;
  readonly refresh: () => Promise<void>;
  readonly open: (category: bigint, name: string) => Promise<string>;
  readonly contribute: (category: bigint, salary: bigint, years: bigint) => Promise<string>;
  readonly updateBenchmarkFor: (category: bigint) => Promise<string>;
  readonly exportPrivateState: (password?: string) => Promise<PrivateStateExport>;
  readonly exportWalletSigningKeys: (password?: string) => Promise<SigningKeyExport>;
  readonly importPrivateState: (
    data: PrivateStateExport,
    options?: ImportPrivateStatesOptions,
  ) => Promise<ImportPrivateStatesResult>;
  readonly importWalletSigningKeys: (
    data: SigningKeyExport,
    options?: ImportSigningKeysOptions,
  ) => Promise<ImportSigningKeysResult>;
}

const MidnightsContext = createContext<MidnightContextValue | undefined>(undefined);

const POLL_INTERVAL_MS = 8_000;

export function MidnightServiceProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MidnightContextValue['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [networkConfigured, setNetworkConfigured] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [providers, setProviders] = useState<SalaryPoolProviders | null>(null);
  const [contract, setContract] = useState<ContractHandle | null>(null);
  const [ledger, setLedger] = useState<LedgerView | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);

  const providersRef = useRef(providers);
  const contractRef = useRef(contract);
  const addressRef = useRef(contractAddress);
  useEffect(() => {
    providersRef.current = providers;
  }, [providers]);
  useEffect(() => {
    contractRef.current = contract;
  }, [contract]);
  useEffect(() => {
    addressRef.current = contractAddress;
  }, [contractAddress]);

  // Guards against concurrent connects (double-click / HMR / StrictMode) and
  // stale async completions overwriting newer state. A single in-flight
  // operation is tracked; any later connect while one is running is ignored.
  const inFlightRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const currentProviders = providersRef.current;
    const address = addressRef.current;
    if (!currentProviders || !address) return;
    const view = await queryLedgerState(currentProviders.publicDataProvider, address);
    if (mountedRef.current) setLedger(view);
  }, []);

  // Poll the public ledger so benchmarks update as new contributions arrive.
  useEffect(() => {
    if (status !== 'connected' || !contractAddress) return;
    void refresh();
    const timer = window.setInterval(() => {
      void refresh().catch((err) => {
        if (mountedRef.current) setError(humanizeError(err));
      });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [status, contractAddress, refresh]);

  const connect = useCallback(async (networkId: string, address: string | null) => {
    // Guard: if a connection flow is already running, ignore the new request.
    if (inFlightRef.current) return inFlightRef.current;
    const operation = (async () => {
      // ORDER: network → wallet → contract. Guarantee the SDK's global network
      // id is configured before ANY wallet or contract operation. This is the
      // exact path that previously produced "Network ID has not been
      // configured. Call setNetworkId() before any wallet or contract
      // operation."  `connectToWallet` also configures the id as a backstop.
      const resolved = resolveNetworkId(networkId);
      configureNetwork(resolved);
      setNetworkConfigured(true);

      setStatus('connecting');
      setError(null);
      setIsBusy(true);
      setBusyLabel('Connecting to wallet…');
      try {
        const conn = await connectToWallet(resolved);
        if (!mountedRef.current) return;
        const walletAddress = conn.shieldedAddresses.shieldedAddress;
        setWalletAddress(walletAddress);

        setBusyLabel('Preparing providers…');
        const builtProviders = await buildProvidersFromConnectedAPI(conn.connectedAPI, conn.shieldedAddresses);
        providersRef.current = builtProviders;

        if (address) {
          setBusyLabel('Connecting to the deployed contract…');
          const deployed = await connectToContract(builtProviders, address);
          if (!mountedRef.current) return;
          setContract(deployed);
          contractRef.current = deployed;
          setContractAddress(address);
          addressRef.current = address;
        } else {
          setContract(null);
          contractRef.current = null;
          setContractAddress(null);
          addressRef.current = null;
        }
        setProviders(builtProviders);
        setNetworkName(resolved);
        setStatus('connected');
      } catch (err) {
        if (!mountedRef.current) return;
        setStatus('error');
        setError(humanizeError(err));
      } finally {
        setIsBusy(false);
        setBusyLabel(null);
        inFlightRef.current = null;
      }
    })();
    inFlightRef.current = operation;
    await operation;
  }, []);

  const deploy = useCallback(async (networkId: string): Promise<string> => {
    const currentProviders = providersRef.current;
    if (!currentProviders) throw new Error('Connect to a wallet first.');
    // Network must be configured before the deploy transaction is built.
    const resolved = resolveNetworkId(networkId);
    configureNetwork(resolved);
    setNetworkConfigured(true);
    setIsBusy(true);
    setBusyLabel('Deploying the contract (proving, may take a minute)…');
    try {
      const deployed = await deployFreshContract(currentProviders);
      const address = deployed.deployTxData.public.contractAddress;
      if (mountedRef.current) {
        setContract(deployed);
        contractRef.current = deployed;
        setContractAddress(address);
        addressRef.current = address;
        setNetworkName(resolved);
      }
      return address;
    } finally {
      setIsBusy(false);
      setBusyLabel(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    inFlightRef.current = null;
    setStatus('idle');
    setProviders(null);
    setContract(null);
    setContractAddress(null);
    setLedger(null);
    setWalletAddress('');
    setNetworkName(null);
    setNetworkConfigured(false);
    setError(null);
    setBusyLabel(null);
    setIsBusy(false);
  }, []);

  // Automatically connect to a configured contract on first mount (e.g. when
  // VITE_CONTRACT_ADDRESS is set), without requiring a manual button click.
  // Guarded to run once per provider mount so React remounts (StrictMode/HMR)
  // cannot trigger duplicate connect flows.
  const autoConnectedRef = useRef(false);
  useEffect(() => {
    if (autoConnectedRef.current) return;
    autoConnectedRef.current = true;
    const configuredAddress = import.meta.env.VITE_CONTRACT_ADDRESS?.trim();
    if (!configuredAddress) return;
    const configuredNetwork = resolveNetworkId(import.meta.env.VITE_NETWORK);
    if (!isWalletConnectorPresent()) return;
    void connect(configuredNetwork, configuredAddress);
  }, [connect]);

  const ensureConnected = useCallback((): ContractHandle => {
    const currentContract = contractRef.current;
    if (!currentContract) {
      throw new Error('Not connected to a contract yet.');
    }
    return currentContract;
  }, []);

  const openCategoryFor = useCallback(
    async (category: bigint, name: string): Promise<string> => {
      const current = ensureConnected();
      const currentProviders = providersRef.current;
      const address = addressRef.current;
      if (!currentProviders || !address) throw new Error('Not connected.');
      setIsBusy(true);
      setBusyLabel('Opening category (proving…)…');
      try {
        const txId = await openCategory(currentProviders, address, current.callTx, category, name);
        await refresh();
        return txId;
      } finally {
        setIsBusy(false);
        setBusyLabel(null);
      }
    },
    [ensureConnected, refresh],
  );

  const contribute = useCallback(
    async (category: bigint, salary: bigint, years: bigint): Promise<string> => {
      const current = ensureConnected();
      const currentProviders = providersRef.current;
      const address = addressRef.current;
      if (!currentProviders || !address) throw new Error('Not connected.');
      setIsBusy(true);
      setBusyLabel('Proving your salary contribution…');
      try {
        const txId = await submitSalaryContribution(currentProviders, address, current.callTx, {
          category,
          salary,
          yearsOfExperience: years,
        });
        await refresh();
        return txId;
      } finally {
        setIsBusy(false);
        setBusyLabel(null);
      }
    },
    [ensureConnected, refresh],
  );

  const updateBenchmarkFor = useCallback(
    async (category: bigint): Promise<string> => {
      const current = ensureConnected();
      const currentProviders = providersRef.current;
      const address = addressRef.current;
      if (!currentProviders || !address) throw new Error('Not connected.');
      setIsBusy(true);
      setBusyLabel('Computing & publishing the benchmark…');
      try {
        const txId = await updateBenchmark(currentProviders, address, current.callTx, category);
        await refresh();
        return txId;
      } finally {
        setIsBusy(false);
        setBusyLabel(null);
      }
    },
    [ensureConnected, refresh],
  );

  const exportPrivateState = useCallback(async (password?: string): Promise<PrivateStateExport> => {
    const currentProviders = providersRef.current;
    if (!currentProviders) throw new Error('Connect to a wallet first.');
    return currentProviders.privateStateProvider.exportPrivateStates(
      password ? { password } : undefined,
    );
  }, []);

  const exportWalletSigningKeys = useCallback(
    async (password?: string): Promise<SigningKeyExport> => {
      const currentProviders = providersRef.current;
      if (!currentProviders) throw new Error('Connect to a wallet first.');
      return currentProviders.privateStateProvider.exportSigningKeys(
        password ? { password } : undefined,
      );
    },
    [],
  );

  const importPrivateState = useCallback(
    async (
      data: PrivateStateExport,
      options?: ImportPrivateStatesOptions,
    ): Promise<ImportPrivateStatesResult> => {
      const currentProviders = providersRef.current;
      if (!currentProviders) throw new Error('Connect to a wallet first.');
      return currentProviders.privateStateProvider.importPrivateStates(data, options);
    },
    [],
  );

  const importWalletSigningKeys = useCallback(
    async (data: SigningKeyExport, options?: ImportSigningKeysOptions): Promise<ImportSigningKeysResult> => {
      const currentProviders = providersRef.current;
      if (!currentProviders) throw new Error('Connect to a wallet first.');
      return currentProviders.privateStateProvider.importSigningKeys(data, options);
    },
    [],
  );

  const value = useMemo<MidnightContextValue>(
    () => ({
      status,
      error,
      networkName,
      networkConfigured,
      contractAddress,
      walletAddress,
      ready: status === 'connected' && !!contractAddress && !!contract,
      providers,
      contract,
      ledger,
      isBusy,
      busyLabel,
      connect,
      deploy,
      disconnect,
      refresh,
      open: openCategoryFor,
      contribute,
      updateBenchmarkFor,
      exportPrivateState,
      exportWalletSigningKeys,
      importPrivateState,
      importWalletSigningKeys,
    }),
    [
      status,
      error,
      networkName,
      networkConfigured,
      contractAddress,
      walletAddress,
      providers,
      contract,
      ledger,
      isBusy,
      busyLabel,
      connect,
      deploy,
      disconnect,
      refresh,
      openCategoryFor,
      contribute,
      updateBenchmarkFor,
      exportPrivateState,
      exportWalletSigningKeys,
      importPrivateState,
      importWalletSigningKeys,
    ],
  );

  return <MidnightsContext.Provider value={value}>{children}</MidnightsContext.Provider>;
}

export function useMidnight(): MidnightContextValue {
  const ctx = useContext(MidnightsContext);
  if (!ctx) throw new Error('useMidnight must be used within <MidnightServiceProvider>');
  return ctx;
}
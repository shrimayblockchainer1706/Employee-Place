import {
  createProverKey,
  createVerifierKey,
  createZKIR,
  ZKConfigProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type { ProverKey, VerifierKey, ZKIR } from '@midnight-ntwrk/midnight-js-types';

/**
 * A browser {@link ZKConfigProvider} that fetches the compiled zkir / prover /
 * verifier artifacts served as static files by this app (see
 * `lib/contract.ts`). Mirrors `NodeZkConfigProvider` (repo tooling) over HTTP
 * instead of the filesystem.
 *
 * Artifact layout (matches the `contracts/managed/...` output):
 *   <base>/zkir/<circuitId>.bzkir
 *   <base>/keys/<circuitId>.prover
 *   <base>/keys/<circuitId>.verifier
 */
export class FetchZkConfigProvider<K extends string> extends ZKConfigProvider<K> {
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async fetchStatic(subDir: string, circuitId: K, ext: string): Promise<Uint8Array> {
    const response = await fetch(`${this.baseUrl}/${subDir}/${circuitId}${ext}`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ZK artifact for circuit "${circuitId}" at ${this.baseUrl}/${subDir}/${circuitId}${ext} (HTTP ${response.status})`,
      );
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async getZKIR(circuitId: K): Promise<ZKIR> {
    return createZKIR(await this.fetchStatic('zkir', circuitId, '.bzkir'));
  }

  async getProverKey(circuitId: K): Promise<ProverKey> {
    return createProverKey(await this.fetchStatic('keys', circuitId, '.prover'));
  }

  async getVerifierKey(circuitId: K): Promise<VerifierKey> {
    return createVerifierKey(await this.fetchStatic('keys', circuitId, '.verifier'));
  }
}
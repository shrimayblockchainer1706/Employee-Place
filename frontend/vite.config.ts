import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMPILED_CONTRACT_SOURCE = path.resolve(__dirname, '..', 'contracts', 'managed', 'confidential_salary_benchmarking');

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    // The Midnight WASM runtimes define their classes (e.g.
    // ContractMaintenanceAuthority) inside wasm-bindgen glue, so class identity
    // is bound to a single WebAssembly instance. If the browser resolves more
    // than one copy of a runtime package (e.g. the compiled contract at the
    // repo root resolving `@midnight-ntwrk/compact-runtime` from the root
    // `node_modules` while the SDK resolves it from `frontend/node_modules`),
    // `instanceof` checks across the copies fail and the deployment errors with
    // "expected instance of ContractMaintenanceAuthority". Deduping the runtime
    // packages forces every importer to one physical copy.
    //
    // See https://github.com/midnightntwrk/midnight-js/issues/1052.
    dedupe: [
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/ledger-v8',
      '@midnight-ntwrk/compact-js',
    ],
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
      util: 'util',
      assert: 'assert',
      crypto: path.resolve(__dirname, 'src/lib/crypto-shim.ts'),
      stream: 'stream-browserify',
      events: 'events',
      'isomorphic-ws': path.resolve(__dirname, 'src/lib/ws-shim.ts'),
    },
  },
  plugins: [
    react(),
    wasm(),
    viteStaticCopy({
      targets: [
        {
          // Serves the compiled contract (zkir, keys, contract JS) at
          // /contract/compiled/confidential_salary_benchmarking for the
          // FetchZkConfigProvider. `src` is the directory itself, so it lands
          // under `dest` preserving its name. In dev this is served from the
          // source dir; on build it is copied to dist.
          src: COMPILED_CONTRACT_SOURCE,
          dest: 'contract/compiled',
        },
      ],
    }),
  ],
  optimizeDeps: {
    include: ['level', 'browser-level', 'abstract-level', 'level-supports', 'level-transcoder'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
  assetsInclude: ['**/*.wasm'],
  publicDir: 'public',
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
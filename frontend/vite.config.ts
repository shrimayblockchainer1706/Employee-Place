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
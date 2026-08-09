// MUST be imported first: browser polyfills the Midnight SDK relies on.
import { Buffer } from 'buffer';

globalThis.Buffer = Buffer;
(globalThis as unknown as { global: typeof globalThis }).global = globalThis;

const browserProcess = {
  env: {} as Record<string, string>,
  browser: true,
  version: '',
  platform: 'browser',
  argv: [] as string[],
  argv0: 'node',
  execPath: '',
  execArgv: [] as string[],
  pid: 0,
  ppid: 0,
  title: 'browser',
  arch: 'x64',
  cwd: () => '/',
  chdir: () => {},
  hrtime: () => [0, 0],
  nextTick: (cb: (...args: unknown[]) => void, ...args: unknown[]) => {
    try {
      queueMicrotask(() => cb(...args));
    } catch {
      setTimeout(() => cb(...args), 0);
    }
  },
  exit: () => {},
  getgid: () => 0,
  getuid: () => 0,
  setgid: () => {},
  setuid: () => {},
  kill: () => {},
  stderr: undefined,
  stdout: undefined,
  stdin: undefined,
  on: () => {},
  once: () => {},
  off: () => {},
  removeListener: () => {},
  removeAllListeners: () => {},
  setMaxListeners: () => {},
  getMaxListeners: () => 0,
  listeners: () => [],
  rawListeners: () => [],
  emit: () => true,
  prependListener: () => {},
  prependOnceListener: () => {},
  listenerCount: () => 0,
  eventNames: () => [],
} as unknown as NodeJS.Process;

if (!globalThis.process) {
  globalThis.process = browserProcess;
}
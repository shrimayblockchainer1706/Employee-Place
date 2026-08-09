declare module 'process/browser' {
  const process: NodeJS.Process;
  export default process;
}

declare module 'crypto-browserify' {
  const crypto: Record<string, unknown>;
  export default crypto;
}

declare module 'browser-level' {
  export class BrowserLevel<K = string, V = string> {
    constructor(location: string, options?: Record<string, unknown>);
  }
}
/*
 * Maps low-level SDK / contract / wallet errors to messages explaining what
 * happened in language a user understands. No private values are ever included.
 */

const CONTRACT_ASSERTION_TIPS: ReadonlyArray<{ readonly match: string; readonly tip: string }> = [
  {
    match: 'Duplicate contribution from the same contributor',
    tip: 'You have already contributed to this category. Each person can contribute only once per category.',
  },
  {
    match: 'Category is full',
    tip: 'This category already has the maximum number of contributions.',
  },
  {
    match: 'Category is not open',
    tip: 'No salary pool has been opened for this category yet.',
  },
  {
    match: 'Category already open',
    tip: 'A pool for this category already exists — open a different category id.',
  },
  {
    match: 'Salary does not match selected band',
    tip: 'Your salary does not fall into the band the form selected.',
  },
  {
    match: 'Invalid salary band',
    tip: 'The selected salary band is unknown.',
  },
  {
    match: 'Not enough contributors to publish a benchmark',
    tip: 'At least 5 contributions are needed before a benchmark can be published.',
  },
  {
    match: 'Salary out of valid range',
    tip: 'The salary must be between ₹1 and ₹100 crore per year.',
  },
  {
    match: 'Years of experience out of valid range',
    tip: 'Years of experience must be 50 or fewer.',
  },
  {
    match: 'Category id out of range',
    tip: 'Category ids must be between 0 and 5.',
  },
];

export function humanizeError(error: unknown): string {
  const message = extractMessage(error);
  if (!message) return 'Something went wrong. Please try again.';

  for (const { match, tip } of CONTRACT_ASSERTION_TIPS) {
    if (message.includes(match)) return tip;
  }

  if (message.toLowerCase().includes('not enough dust')) {
    return 'Your wallet does not have enough DUST tokens to pay the transaction fee.';
  }
  if (message.toLowerCase().includes('insufficient funds')) {
    return 'Your wallet does not have enough tNIGHT to pay the transaction fee.';
  }
  if (message.toLowerCase().includes('proof server')) {
    return 'The zero-knowledge proof server could not be reached. Make sure the local Proof Server is running (npm run proof-server:start).';
  }
  if (message.toLowerCase().includes('disconnected') || message.toLowerCase().includes('connection refused')) {
    return 'The connection to the network dropped. Please retry.';
  }
  if (message.toLowerCase().includes('no private states to export')) {
    return 'There is no private state stored for this wallet yet. Back it up after you deploy a contract or make a contribution.';
  }
  if (message.toLowerCase().includes('no signing keys to export')) {
    return 'No signing keys are stored yet. They are created once you deploy or interact with a contract.';
  }
  if (message.toLowerCase().includes('contract address not set')) {
    return 'Connect to (or deploy) a contract first, then create the backup from the Wallet & Contract panel.';
  }
  if (message.toLowerCase().includes('export')) {
    return 'The backup could not be exported. Check the password (minimum 16 characters, mixing uppercase, lowercase, digits and symbols) and try again.';
  }

  return message;
}

function extractMessage(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  for (let depth = 0; depth < 6 && current !== undefined && current !== null; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
    }
    const cause = (current as { cause?: unknown } | null)?.cause;
    if (cause && cause !== current) {
      current = cause;
    } else {
      break;
    }
  }
  try {
    parts.push(String(err));
  } catch {
    /* ignore */
  }
  return parts.join(' | ');
}
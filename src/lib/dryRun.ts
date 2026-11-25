import { AsyncLocalStorage } from 'node:async_hooks'

// A dry run executes the real operation inside a transaction that is always rolled back, so a preview
// is checked by the same rules as the confirmation. Effects outside the database (file uploads) look
// here and skip themselves: their database records are rolled back with everything else.
const storage = new AsyncLocalStorage<true>()

export function isDryRun() {
  return storage.getStore() === true
}

class DryRunRollback extends Error {}

/**
 * Runs `transaction` in dry-run mode. It receives `rollback`, to throw at the end of the transaction body
 * so the transaction helper rolls everything back; any other error is rethrown unchanged.
 */
export async function runDryRun(transaction: (rollback: () => never) => Promise<unknown>) {
  try {
    await storage.run(true, () => transaction(() => { throw new DryRunRollback() }))
  } catch (error) {
    if (!(error instanceof DryRunRollback)) throw error
  }
}

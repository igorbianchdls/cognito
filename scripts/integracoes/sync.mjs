#!/usr/bin/env node

import { runSyncCli } from '../../src/products/integracoes/cli/syncCli.mjs'
import { printError } from '../../src/products/integracoes/cli/shared/output.mjs'

try {
  const code = await runSyncCli()
  process.exit(code)
} catch (error) {
  printError(error)
  process.exit(1)
}

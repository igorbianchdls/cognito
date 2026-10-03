import { AsyncLocalStorage } from 'node:async_hooks'

export type ErpDatabaseContext = {
  tenantId: number
  userId: number
  statementTimeoutMs?: number
  readOnly?: boolean
}

const storage = new AsyncLocalStorage<ErpDatabaseContext>()

function normalizeContext(context: ErpDatabaseContext): ErpDatabaseContext {
  const tenantId = Number(context.tenantId)
  const userId = Number(context.userId)
  if (!Number.isInteger(tenantId) || tenantId <= 0 || !Number.isInteger(userId) || userId <= 0) {
    throw new Error('Contexto de banco ERP invalido.')
  }
  if (context.statementTimeoutMs !== undefined && (!Number.isInteger(context.statementTimeoutMs)
    || context.statementTimeoutMs < 100 || context.statementTimeoutMs > 30000)) {
    throw new Error('Tempo limite de banco ERP invalido.')
  }
  return { tenantId, userId, ...(context.statementTimeoutMs !== undefined ? { statementTimeoutMs: context.statementTimeoutMs } : {}),
    ...(context.readOnly !== undefined ? { readOnly: context.readOnly } : {}) }
}

export function setErpDatabaseContext(context: ErpDatabaseContext) {
  storage.enterWith(normalizeContext(context))
}

export function getErpDatabaseContext() {
  return storage.getStore() || null
}

export function runWithErpDatabaseContext<T>(context: ErpDatabaseContext, fn: () => T): T {
  return storage.run(normalizeContext(context), fn)
}

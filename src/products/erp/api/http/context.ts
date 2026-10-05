import { AsyncLocalStorage } from 'node:async_hooks'
import type { ErpAccessContext } from '../../server/erpAccess'

export type ErpHttpContext = { correlationId: string; request: Request; session?: ErpAccessContext }
export const erpHttpContext = new AsyncLocalStorage<ErpHttpContext>()

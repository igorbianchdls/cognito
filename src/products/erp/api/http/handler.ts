import { randomUUID } from 'node:crypto'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { resolveErpSession } from '../../server/erpAccess'
import { ErpDomainError } from '../../shared/erpErrors'
import { validateErpHttpParams, validateErpHttpQuery } from '../contracts/request'
import { erpHttpContext } from './context'
import { erpErrorResponse } from './responses'

type HttpOptions = { operation: string; authentication?: 'session' | 'cron' | 'none'; maxBodyBytes?: number }
type HttpHandler = (...args: never[]) => Promise<Response>

async function boundedRequest(request: Request, limit: number): Promise<Request> {
  if (!request.body || ['GET', 'HEAD'].includes(request.method)) return request
  const declared = request.headers.get('content-length')
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit)) throw new ErpDomainError('REQUEST_TOO_LARGE', 'A requisição excede o limite desta operação.', 413)
  const reader = request.body.getReader(), chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) { await reader.cancel(); throw new ErpDomainError('REQUEST_TOO_LARGE', 'A requisição excede o limite desta operação.', 413) }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = Buffer.concat(chunks)
  if (size) {
    if (!/^application\/(?:[\w.+-]+\+)?json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw new ErpDomainError('UNSUPPORTED_MEDIA_TYPE', 'Envie a requisição como application/json.', 415)
    try { JSON.parse(bytes.toString('utf8')) } catch { throw new ErpDomainError('INVALID_JSON', 'Envie um corpo JSON válido.', 400) }
  }
  // The incoming Next request may already have a consumed/locked stream. Build
  // from its URL and explicit transport fields instead of inheriting that body.
  return new Request(request.url, { method: request.method, headers: request.headers, signal: request.signal, body: bytes })
}

/** All HTTP handlers run inside one request scope; business repositories do not depend on this wrapper. */
export function withErpHttp<H extends HttpHandler>(handler: H, options: HttpOptions) {
  return async (...args: Parameters<H>): Promise<Response> => {
    const started = Date.now(), correlationId = randomUUID()
    const values = args as unknown as [Request, unknown?]
    return erpHttpContext.run({ correlationId, request: values[0] }, async () => {
      let response: Response
      let phase='session'
      try {
        const session = (options.authentication ?? 'session') === 'session' ? await resolveErpSession() : null
        if ((options.authentication ?? 'session') === 'session' && !session) throw new ErpDomainError('AUTH_REQUIRED', 'Entre na sua conta para acessar o ERP.', 401)
        if (session) erpHttpContext.getStore()!.session = session
        phase='transport'
        validateErpHttpQuery(values[0])
        await validateErpHttpParams(values[1])
        values[0] = await boundedRequest(values[0], options.maxBodyBytes ?? 1024 * 1024)
        phase='handler'
        const invoke = () => handler(...args)
        response = session ? await runWithErpDatabaseContext({ tenantId: session.tenantId, userId: session.sharedUserId, timeZone: session.timeZone,
          readOnly: ['GET', 'HEAD'].includes(values[0].method), statementTimeoutMs: ['GET', 'HEAD'].includes(values[0].method) ? 10000 : 30000 }, invoke) : await invoke()
      } catch (error) {
        if(error instanceof TypeError) console.error(JSON.stringify({scope:'erp-transport',operation:options.operation,phase,errorType:error.name,message:error.message,correlationId}))
        response = erpErrorResponse(error)
      }
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'no-store'); headers.set('x-correlation-id', correlationId)
      console.info(JSON.stringify({ scope: 'erp-api', operation: options.operation, correlationId, status: response.status, durationMs: Date.now() - started }))
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    })
  }
}

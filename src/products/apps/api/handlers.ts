import { randomUUID } from 'node:crypto'
import { auth } from '@clerk/nextjs/server'
import { z, ZodError } from 'zod'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { TablesError } from '@/products/tables/shared/contracts'
import { AppsError, draftSchema, expectedSchema, manifestSchema, metadataSchema, uuid } from '../shared/contracts'
import { transaction } from '../server/database'
import { getApp, versions } from '../server/repository'
import * as service from '../server/service'
import { publish, unpublish } from '../server/publishing'
import { dataOperation, openRuntime, runtimeDataSchema, runtimeManifest } from '../server/runtime'
import { checkSources, tablesOperation, tablesRequestSchema } from '../server/tablesSource'

async function bodyOf(request: Request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) throw new AppsError('INVALID_BODY', 'Envie dados JSON.', 415)
  const reader = request.body?.getReader(); if (!reader) throw new AppsError('INVALID_BODY', 'Informe os dados.')
  const parts: Uint8Array[] = []; let size = 0
  try { for (;;) { const p = await reader.read(); if (p.done) break; size += p.value.byteLength; if (size > 2_000_000) { await reader.cancel(); throw new AppsError('BODY_TOO_LARGE', 'O pacote é muito grande.', 413) } parts.push(p.value) } }
  finally { reader.releaseLock() }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown } catch { throw new AppsError('INVALID_BODY', 'Confira os dados enviados.') }
}
const catalogQuery = z.object({ busca: z.string().max(100).default(''), filtro: z.enum(['todos', 'publicados', 'construcao', 'arquivados', 'favoritos', 'lixeira']).default('todos'), pagina: z.coerce.number().int().min(1).max(10000).default(1), ordem: z.enum(['atualizacao', 'nome']).default('atualizacao') }).strict()
export async function appsHandler(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const correlationId = randomUUID(), headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Correlation-Id': correlationId }
  const json = (data: unknown, status = 200) => Response.json(data, { status, headers })
  try {
    const write = request.method !== 'GET', origin = request.headers.get('origin')
    if (write && (request.headers.get('sec-fetch-site') === 'cross-site' || origin && origin !== new URL(request.url).origin)) throw new AppsError('INVALID_ORIGIN', 'Atualize a página e tente novamente.', 403)
    const tenant = await resolveAuthTenant({ access: 'read' }), browser = await auth()
    if (!tenant || !browser.sessionId) throw new AppsError('UNAUTHENTICATED', 'Entre e selecione uma empresa para continuar.', 401)
    const s = { ...tenant, browserSession: browser.sessionId }, path = (await context.params).path ?? [], [id, action] = path
    if (path.length > 2) throw new AppsError('NOT_FOUND', 'Recurso não encontrado.', 404)
    if (id) uuid.parse(id)
    const body = write ? await bodyOf(request) : undefined
    // Tables data used by an app: the app transaction only authorizes; the data runs in the Tables transaction.
    if (id && action === 'tabelas' && request.method === 'POST') {
      const { token, versao, ...input } = tablesRequestSchema.extend({ token: z.string().max(4000).optional(), versao: uuid.optional() }).strict().parse(body)
      const manifest = await transaction(s, false, db => runtimeManifest(db, s, id, { token, versao }))
      return json(await tablesOperation(s, manifest, input))
    }
    return await transaction(s, write && action !== 'favorito' && !(action === 'dados' && (body as { operacao?: string })?.operacao === 'listar'), async db => {
      if (!id && request.method === 'GET') {
        const q = catalogQuery.parse(Object.fromEntries(new URL(request.url).searchParams))
        return json(await service.catalog(db, s, q.busca, q.filtro, q.pagina, q.ordem))
      }
      if (!id && request.method === 'POST') {
        const input = metadataSchema.extend({ exemplo: z.boolean().default(true), modelo: z.enum(['html', 'react']).default('html') }).strict().parse(body)
        const { exemplo, modelo, ...data } = input
        return json({ app: await service.create(db, s, data, exemplo, undefined, modelo) }, 201)
      }
      if (id && !action) {
        if (request.method === 'GET') return json(await service.bundle(db, s, id))
        if (request.method === 'PATCH') { const { expectedVersion, ...data } = metadataSchema.extend(expectedSchema.shape).strict().parse(body); return json({ app: await service.metadata(db, s, id, expectedVersion, data) }) }
      }
      if (id && action === 'conteudo' && request.method === 'GET') {
        await getApp(db, s, id)
        const versionId = new URL(request.url).searchParams.get('versao')
        if (versionId) uuid.parse(versionId)
        const v = (await versions(db, s, id)).find(v => !versionId || v.id === versionId)
        if (!v) throw new AppsError('NOT_FOUND', 'Versão não encontrada.', 404)
        return json({ pacote: await service.loadPackage(db, s, id, v.id), versaoId: v.id })
      }
      if (id && action === 'rascunho' && request.method === 'PUT') {
        const { expectedVersion, ...p } = draftSchema.parse(body)
        await checkSources(s, p.manifesto)
        return json(await service.saveDraft(db, s, id, expectedVersion, p))
      }
      if (id && action === 'runtime' && request.method === 'GET') {
        const q = z.object({ modo: z.enum(['previa', 'publicado']), versao: uuid.optional() }).strict().parse(Object.fromEntries(new URL(request.url).searchParams))
        return json(await openRuntime(db, s, id, q.modo === 'previa', q.versao))
      }
      if (id && action === 'dados' && request.method === 'POST') return json(await dataOperation(db, s, id, runtimeDataSchema.parse(body)))
      if (id && action === 'publicar' && request.method === 'POST') {
        const p = expectedSchema.extend({ versaoId: uuid, chaveOperacao: uuid }).strict().parse(body)
        const target = (await versions(db, s, id)).find(v => v.id === p.versaoId)
        if (target) await checkSources(s, manifestSchema.parse(target.manifesto))
        return json(await publish(db, s, id, p.expectedVersion, p.versaoId, p.chaveOperacao))
      }
      if (id && action === 'despublicar' && request.method === 'POST') return json(await unpublish(db, s, id, expectedSchema.parse(body).expectedVersion))
      if (id && action && ['arquivar', 'excluir', 'restaurar'].includes(action) && request.method === 'POST') return json(await service.lifecycle(db, s, id, expectedSchema.parse(body).expectedVersion, action))
      if (id && action === 'duplicar' && request.method === 'POST') { z.object({}).strict().parse(body); return json({ app: await service.duplicate(db, s, id) }, 201) }
      if (id && action === 'favorito' && request.method === 'PUT') {
        const { favorito } = z.object({ favorito: z.boolean() }).strict().parse(body); await getApp(db, s, id)
        if (favorito) await db.query('INSERT INTO apps.favoritos(empresa_id,app_id,usuario_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [s.tenantId, id, s.sharedUserId])
        else await db.query('DELETE FROM apps.favoritos WHERE empresa_id=$1 AND app_id=$2 AND usuario_id=$3', [s.tenantId, id, s.sharedUserId])
        return json({ ok: true })
      }
      throw new AppsError('NOT_FOUND', 'Recurso não encontrado.', 404)
    })
  } catch (error) {
    if (error instanceof AppsError || error instanceof TablesError) return json({ error: { code: error.code, message: error.message } }, error.status)
    if (error instanceof ZodError) return json({ error: { code: 'INVALID_INPUT', message: 'Confira os campos, o manifesto e os arquivos enviados.', issues: error.issues.map(i => ({ path: i.path, message: i.message })) } }, 400)
    const code = (error as { code?: string })?.code
    if (['23514', '23503', '23505', '22007', '22008', '22P02'].includes(code ?? '')) return json({ error: { code: 'INVALID_VALUE', message: 'Um dos valores não é compatível com o campo ou não está disponível.' } }, 422)
    if (code === '42501') return json({ error: { code: 'FORBIDDEN', message: 'Seu acesso não permite esta operação.' } }, 403)
    if (['40001', '40P01', '55P03'].includes(code ?? '')) return json({ error: { code: 'VERSION_CONFLICT', message: 'Outra edição está em andamento. Tente novamente.' } }, 409)
    console.error('apps_request_failed', { correlationId, code: code ?? 'INTERNAL' })
    return json({ error: { code: 'UNAVAILABLE', message: 'Não foi possível concluir. Tente novamente.' } }, 503)
  }
}

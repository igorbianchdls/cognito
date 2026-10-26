import { randomUUID } from 'node:crypto'
import { z, ZodError } from 'zod'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import type { AuthTenantContext } from '@/products/auth/shared/authContracts'
import { baseInputSchema, colorSchema, fieldInputSchema, listQuerySchema, nameSchema, recordInputSchema, TablesError, viewInputSchema } from '../shared/contracts'
import { withTablesTransaction } from '../server/database'
import { getBundle, lockRecord, readRecord, requireRole, requireTable } from '../server/repository'
import { listRecords } from '../server/queries'
import * as service from '../server/service'

async function readBody(request: Request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) throw new TablesError('INVALID_BODY', 'Envie os dados como JSON.', 415)
  const reader = request.body?.getReader()
  if (!reader) throw new TablesError('INVALID_BODY', 'Informe os dados da operação.')
  let size = 0
  const chunks: Uint8Array[] = []
  try {
    for (;;) {
      const part = await reader.read()
      if (part.done) break
      size += part.value.byteLength
      if (size > 1024 * 1024) { await reader.cancel(); throw new TablesError('INVALID_BODY', 'Os dados desta operação são muito grandes.', 413) }
      chunks.push(part.value)
    }
  } finally { reader.releaseLock() }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown } catch { throw new TablesError('INVALID_BODY', 'Informe dados válidos.') }
}

const id = (value: string) => z.string().uuid().parse(value)
/** Query string of record lists and exports, with filters and sorting as JSON. */
function readQuery(request: Request) {
  const search = new URL(request.url).searchParams
  for (const key of search.keys()) if (search.getAll(key).length > 1) throw new TablesError('INVALID_QUERY', 'Parâmetro repetido.')
  const raw: Record<string, unknown> = Object.fromEntries(search)
  for (const key of ['filtros', 'ordenacao']) if (typeof raw[key] === 'string') {
    try { raw[key] = JSON.parse(raw[key] as string) } catch { throw new TablesError('INVALID_QUERY', 'Confira os filtros da consulta.') }
  }
  return raw
}
const versionSchema = z.object({ expectedVersion: z.number().int().positive() }).strict()

/** Authentication with an API key (/api/v1/tables) instead of the browser session. */
export type KeyAuth = (request: Request) => Promise<{ session: AuthTenantContext; escopo: 'leitura' | 'escrita' }>
export async function tablesHandler(request: Request, context: { params: Promise<{ path?: string[] }> }, viaKey?: KeyAuth) {
  const correlationId = randomUUID()
  const headers = { 'Cache-Control': 'private, no-store', 'x-correlation-id': correlationId, 'X-Content-Type-Options': 'nosniff' }
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers })
  try {
    const write = !['GET', 'HEAD'].includes(request.method)
    const origin = request.headers.get('origin'), path = (await context.params).path ?? []
    let session: AuthTenantContext | null
    if (viaKey) {
      // API clients are servers: no browser origin check, but the key scope limits writes, and keys never manage keys or upload forms.
      const auth = await viaKey(request)
      if (write && auth.escopo !== 'escrita') throw new TablesError('FORBIDDEN', 'Esta chave de API só permite leitura.', 403)
      if (['chaves', 'mcp-envios', 'sessao'].includes(path[0] ?? '')) throw new TablesError('NOT_FOUND', 'Recurso não encontrado.', 404)
      session = auth.session
    } else {
      if (write && (request.headers.get('sec-fetch-site') === 'cross-site' || origin && origin !== new URL(request.url).origin)) throw new TablesError('INVALID_ORIGIN', 'Atualize a página antes de continuar.', 403)
      session = await resolveAuthTenant({ access: 'read' })
    }
    if (!session) throw new TablesError('UNAUTHENTICATED', 'Entre na sua conta e selecione uma empresa para continuar.', 401)
    const [resource, entityId, action, childId] = path
    const method = request.method
    const body = write ? await readBody(request) : undefined
    if (path.length > 4) throw new TablesError('NOT_FOUND', 'Recurso não encontrado.', 404)
    if (resource === 'mcp-envios' && entityId && !action && !childId && ['GET','POST'].includes(method)) {
      const { mcpUpload } = await import('../server/mcpUploads')
      return json(await mcpUpload(session, id(entityId), method === 'POST' ? body : undefined))
    }
    // Webhooks of what this request changes go out right after the response.
    { const { deliverSoon, deliverDueSoon } = await import('../server/automations'); if (write) deliverSoon(); else deliverDueSoon() }
    return await withTablesTransaction(session, write, async db => {
      if (method === 'GET' && (!resource || resource === 'sessao') && path.length <= 1) return json({ empresa: session.tenantName, usuario: session.fullName || session.email, podeEditar: session.role !== 'viewer', bases: await service.listBases(db, session) })
      if (resource === 'bases') {
        if (!entityId && method === 'GET') return json({ bases: await service.listBases(db, session) })
        if (!entityId && method === 'POST') return json(await service.createBase(db, session, baseInputSchema.parse(body)), 201)
        if (entityId && !action) {
          id(entityId)
          if (method === 'GET') return json(await service.getBase(db, session, entityId))
          if (method === 'PATCH') return json({ base: await service.changeBase(db, session, entityId, z.object({ nome: nameSchema, descricao: z.string().trim().max(2000), cor: colorSchema, expectedVersion: z.number().int().positive() }).strict().parse(body)) })
          if (method === 'DELETE') { await service.trash(db, session, 'bases', entityId, versionSchema.parse(body).expectedVersion); return json({ ok: true }) }
        }
        if (entityId && action === 'compartilhamento' && !childId) {
          if (method === 'GET') return json(await service.getSharing(db, session, id(entityId)))
          if (method === 'PUT') return json(await service.saveSharing(db, session, id(entityId), body))
        }
        if (entityId && action === 'tabelas' && !childId && method === 'POST') return json({ tabela: await service.createTable(db, session, id(entityId), z.object({ nome: nameSchema }).strict().parse(body).nome) }, 201)
      }
      if (resource === 'tabelas' && entityId) {
        id(entityId)
        if (!action) {
          if (method === 'GET') return json(await getBundle(db, session, entityId))
          if (method === 'PATCH') return json({ tabela: await service.changeTable(db, session, entityId, z.object({ nome: nameSchema, expectedStructureVersion: z.number().int().positive() }).strict().parse(body)) })
          if (method === 'DELETE') { await service.trash(db, session, 'tabelas', entityId, versionSchema.parse(body).expectedVersion); return json({ ok: true }) }
        }
        if (action === 'campos') {
          if (!childId && method === 'POST') return json(await service.saveField(db, session, entityId, fieldInputSchema.parse(body)), 201)
          if (childId && method === 'PATCH') return json(await service.saveField(db, session, entityId, fieldInputSchema.parse(body), id(childId)))
          if (childId && method === 'DELETE') { await service.deleteField(db, session, entityId, id(childId), versionSchema.parse(body).expectedVersion); return json({ ok: true }) }
        }
        if (action === 'visualizacoes') {
          if (method === 'POST' && !childId || method === 'PATCH' && childId) return json({ visualizacao: await service.saveView(db, session, entityId, viewInputSchema.parse(body), childId ? id(childId) : undefined) }, method === 'POST' ? 201 : 200)
          if (method === 'DELETE' && childId) {
            await requireRole(db, session, (await requireTable(db, session, entityId, 'structure')).base_id, 'editor')
            const count = (await db.query('SELECT count(*)::int n FROM tables.visualizacoes WHERE empresa_id=$1 AND tabela_id=$2', [session.tenantId, entityId])).rows[0].n
            if (count <= 1) throw new TablesError('LAST_VIEW', 'Mantenha pelo menos uma visualização.')
            const result = await db.query('DELETE FROM tables.visualizacoes WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3 AND versao=$4 RETURNING id', [session.tenantId, entityId, id(childId), versionSchema.parse(body).expectedVersion])
            if (!result.rows[0]) throw new TablesError('VERSION_CONFLICT', 'A visualização mudou. Atualize a tabela.', 409)
            return json({ ok: true })
          }
        }
        // What changed in the table, for screens that refresh when someone else edits.
        if (action === 'estado' && !childId && method === 'GET') {
          const table = await requireTable(db, session, entityId)
          const row = (await db.query('SELECT max(atualizado_em) alterado_em,count(*) FILTER (WHERE excluido_em IS NULL)::int total FROM tables.registros WHERE empresa_id=$1 AND tabela_id=$2', [session.tenantId, entityId])).rows[0]
          return json({ versao_estrutura: table.versao_estrutura, alterado_em: row.alterado_em, total: row.total })
        }
        if (action === 'exportar' && !childId && method === 'GET') {
          const { exportCsv } = await import('../server/csv')
          const file = await exportCsv(db, session, entityId, listQuerySchema.parse(readQuery(request)))
          const name = encodeURIComponent(file.nome.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'tabela')
          return new Response(file.csv, { headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="tabela.csv"; filename*=UTF-8''${name}.csv`, 'X-Registros': String(file.registros) } })
        }
        if (action === 'automacoes' && !childId) {
          const auto = await import('../server/automations')
          if (method === 'GET') return json(await auto.listAutomations(db, session, entityId))
          if (method === 'POST') return json(await auto.createAutomation(db, session, entityId, body), 201)
        }
        if (action === 'importar' && !childId && method === 'POST') { const { importRows } = await import('../server/csv'); return json(await importRows(db, session, entityId, body)) }
        if (action === 'registros' && !childId) {
          if (method === 'POST') return json({ registro: await service.saveRecord(db, session, entityId, recordInputSchema.parse(body)) }, 201)
          if (method === 'GET') return json(await listRecords(db, session, entityId, listQuerySchema.parse(readQuery(request))))
        }
        if (action === 'remover-registros' && !childId && method === 'POST') {
          const input = z.object({ registros: z.array(z.object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() }).strict()).min(1).max(100), expectedStructureVersion: z.number().int().positive() }).strict().parse(body)
          const table = await requireTable(db, session, entityId, 'record')
          if (table.versao_estrutura !== input.expectedStructureVersion) throw new TablesError('VERSION_CONFLICT', 'A estrutura mudou. Atualize a tabela.', 409)
          for (const item of [...input.registros].sort((a, b) => a.id.localeCompare(b.id))) {
            const record = await readRecord(db, session, item.id)
            if (record.tabela_id !== entityId) throw new TablesError('INVALID_VALUE', 'Um dos registros não pertence à tabela.')
            await service.trash(db, session, 'registros', item.id, item.expectedVersion)
          }
          return json({ ok: true })
        }
      }
      if (resource === 'registros' && entityId) {
        id(entityId)
        if (method === 'GET' && !action) return json(await service.recordDetail(db, session, entityId))
        if (method === 'PATCH' && !action) {
          const record = await readRecord(db, session, entityId)
          return json({ registro: await service.saveRecord(db, session, record.tabela_id, recordInputSchema.parse(body), entityId) })
        }
        if (method === 'DELETE' && !action) { await service.trash(db, session, 'registros', entityId, versionSchema.parse(body).expectedVersion); return json({ ok: true }) }
        if (method === 'POST' && action === 'comentarios') return json(await service.addComment(db, session, entityId, z.object({ texto: z.string().trim().min(1).max(10000) }).strict().parse(body).texto), 201)
        if (method === 'POST' && action === 'anexos') {
          const { prepareAttachment, attachmentInputSchema } = await import('../server/storage')
          const input = attachmentInputSchema.parse(body)
          await lockRecord(db, session, entityId, input.expectedVersion)
          return json(await prepareAttachment(db, session, entityId, input), 201)
        }
      }
      if (resource === 'anexos' && entityId) {
        const { attachmentAction } = await import('../server/storage')
        if (method === 'GET' && action === 'download') return json(await attachmentAction(db, session, id(entityId), 'download'))
        if (method === 'POST' && action === 'confirmar') return json(await attachmentAction(db, session, id(entityId), 'confirmar'))
        if (method === 'DELETE' && !action) return json(await attachmentAction(db, session, id(entityId), 'excluir'))
      }
      if (resource === 'automacoes' && entityId) {
        const auto = await import('../server/automations')
        if (method === 'PATCH' && !action) return json(await auto.updateAutomation(db, session, id(entityId), body))
        if (method === 'DELETE' && !action) return json(await auto.deleteAutomation(db, session, id(entityId)))
        if (method === 'POST' && action === 'testar') { const { registro_id } = await auto.testAutomation(db, session, id(entityId)); return json({ entrega: await auto.sendTest(entityId, String(registro_id)) }) }
      }
      if (resource === 'chaves') {
        const keys = await import('../server/apiKeys')
        if (method === 'GET' && !entityId) return json(await keys.listKeys(db, session))
        if (method === 'POST' && !entityId) return json(await keys.createKey(db, session, body), 201)
        if (method === 'DELETE' && entityId && !action) return json(await keys.revokeKey(db, session, id(entityId)))
      }
      if (resource === 'lixeira') {
        if (method === 'GET' && !entityId) return json({ itens: await service.listTrash(db, session) })
        if (method === 'POST' && entityId && action) {
          const kind = z.enum(['bases', 'tabelas', 'registros', 'campos']).parse(entityId)
          await service.restore(db, session, kind, id(action))
          return json({ ok: true })
        }
      }
      throw new TablesError('NOT_FOUND', 'Recurso não encontrado.', 404)
    })
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    if (error instanceof TablesError) return json({ error: { code: error.code, message: error.message } }, error.status)
    if (error instanceof ZodError) return json({ error: { code: 'VALIDATION_ERROR', message: 'Confira os campos e valores informados.' } }, 422)
    if (['23514', '23503', '23505', '22007', '22008', '22P02', 'P0002'].includes(code)) return json({ error: { code: 'INVALID_VALUE', message: 'Um dos valores não é compatível com o campo ou não está disponível.' } }, 422)
    if (code === '42501') return json({ error: { code: 'FORBIDDEN', message: 'Seu acesso não permite esta operação.' } }, 403)
    if (['40001', '40P01', '55P03'].includes(code)) return json({ error: { code: 'VERSION_CONFLICT', message: 'Outra edição está em andamento. Atualize a tela e tente novamente.' } }, 409)
    console.error(JSON.stringify({ scope: 'tables', correlationId, code: code || 'INTERNAL_ERROR' }))
    return json({ error: { code: 'UNAVAILABLE', message: 'Não foi possível concluir a operação. Tente novamente.' } }, 503)
  }
}

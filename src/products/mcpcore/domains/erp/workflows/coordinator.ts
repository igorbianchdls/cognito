import { createHash, randomUUID } from 'node:crypto'
import { withTransaction, runWithErpTransactionClient, type SQLClient } from '@/lib/postgres'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { PluginError, type PluginPrincipal } from '../../../shared/contracts'
import type { PluginConfig } from '../../../shared/config'
import { pluginQuery } from '../../../shared/database'
import type { assertCurrentAccess } from '../actions/approvalRepository'
import { captureWorkflowItem, applyWorkflowItem, listWorkflowCandidates, refreshWorkflowRow } from './repository'
import { workflowInputs, workflowCapabilities, writeNames, type WorkflowItem, type WorkflowRow, type WorkflowKind, type Fields } from './contracts'

export function digest(value: unknown): string {
  const stable = (input: unknown): unknown => input instanceof Date ? input.toISOString() : Array.isArray(input) ? input.map(stable) : input && typeof input === 'object' ? Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, stable(entry)])) : input
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')
}
export const workflowDependencies = { transaction: withTransaction, query: pluginQuery, capture: captureWorkflowItem, apply: applyWorkflowItem, list: listWorkflowCandidates, refresh: refreshWorkflowRow, assertAccess: async (...args: Parameters<typeof assertCurrentAccess>) => (await import('../actions/approvalRepository')).assertCurrentAccess(...args) }
export type WorkflowDependencies = typeof workflowDependencies
const scopeSql = 'integration=$1 AND empresa_id=$2 AND user_id=$3 AND oauth_client_id=$4'
const scope = (principal: PluginPrincipal, company: number, config: PluginConfig) => [config.integration, company, principal.userId, principal.clientId]
const nowExpired = (row: WorkflowRow) => new Date(row.expires_at).getTime() <= Date.now()
export function workflowView(row: WorkflowRow) {
  const counts = Object.fromEntries(['pending', 'saved', 'failed', 'awaiting', 'unknown'].map(status => [status, row.items.filter(item => item.status === status).length]))
  const status = row.status === 'pending' ? nowExpired(row) ? 'expired' : 'pending' : counts.saved === row.items.length ? 'saved' : counts.unknown ? 'uncertain' : counts.pending || counts.awaiting ? 'processing' : counts.saved ? 'partial' : 'failed'
  const sum = (items: WorkflowItem[]) => Math.round(items.reduce((total, item) => total + Number(item.preview.valor || 0), 0) * 100) / 100
  return {
    workflow: row.kind, tela: row.status === 'pending' ? 'revisao' : 'resultado', operacao_id: row.id, rascunho_id: row.id,
    status, registro_id: status === 'saved' ? row.id : null, expira_em: row.expires_at, total: row.items.length, counts,
    valor_concluido: sum(row.items.filter(item => item.status === 'saved')), valor_pendente: sum(row.items.filter(item => item.status !== 'saved')),
    items: row.items.map(item => ({ ...item.preview, status: item.status, ...(item.result ? { resultado: item.result } : {}), ...(item.message ? { mensagem: item.message } : {}), ...(item.code ? { codigo: item.code } : {}) })),
    ...(row.status === 'pending' && !nowExpired(row) ? { confirmar: { tool: writeNames[row.kind], argumentos: { empresa_id: Number(row.empresa_id), rascunho_id: row.id } } } : {}),
    ...(row.status === 'approved' && counts.pending && !nowExpired(row) ? { continuar: { tool: writeNames[row.kind], argumentos: { empresa_id: Number(row.empresa_id), rascunho_id: row.id } } } : {}),
    ...(row.kind === 'notas' ? { aviso: 'SIMULAÇÃO - SEM VALIDADE FISCAL' } : {}),
  }
}
async function access(client: SQLClient, principal: PluginPrincipal, company: number, kind: WorkflowKind, deps: WorkflowDependencies) {
  for (const capability of workflowCapabilities[kind]) await deps.assertAccess(client, { tenantId: company, sharedUserId: principal.userId, clerkUserId: principal.clerkUserId }, capability)
}
async function load(client: Pick<SQLClient, 'query'>, principal: PluginPrincipal, company: number, config: PluginConfig, id: string, lock = false) {
  const row = (await client.query(`SELECT * FROM plugin.erp_workflows WHERE ${scopeSql} AND id=$5${lock ? ' FOR UPDATE' : ''}`, [...scope(principal, company, config), id])).rows[0] as WorkflowRow | undefined
  if (!row) throw new PluginError('NOT_FOUND', 'Operação não disponível nesta conexão e empresa.', 404)
  return row
}
export async function executeWorkflow(principal: PluginPrincipal, company: number, name: string, input: Fields, config: PluginConfig, deps: WorkflowDependencies = workflowDependencies): Promise<Fields> {
  if (name === 'consultar_operacao_fluxo' && (input.operacao_id || input.chave_operacao)) {
    if (Boolean(input.operacao_id) === Boolean(input.chave_operacao)) throw new PluginError('INVALID_INPUT', 'Informe operacao_id ou chave_operacao.')
    const rows = await deps.query<WorkflowRow>(`SELECT * FROM plugin.erp_workflows WHERE ${scopeSql} AND ${input.operacao_id ? 'id' : 'operation_key'}=$5`, [...scope(principal, company, config), input.operacao_id || input.chave_operacao])
    if (!rows[0]) throw new PluginError('NOT_FOUND', 'Operação não disponível nesta conexão.', 404)
    const allowed = principal.companies.find(item => item.id === company)?.capabilities || []
    if (!workflowCapabilities[rows[0].kind].filter(cap => cap.endsWith('.visualizar')).every(cap => allowed.includes(cap))) throw new PluginError('ACCESS_DENIED', 'Seu perfil não permite consultar esta operação.', 403)
    return workflowView(await deps.refresh(company, rows[0]))
  }
  const kind: WorkflowKind = name === 'consultar_conciliacoes' ? 'conciliacao' : name === 'consultar_classificacao_despesas' ? 'classificacao' : name === 'consultar_operacao_fluxo' ? 'notas' : (Object.entries(writeNames).find(([, tool]) => tool === name)?.[0] as WorkflowKind)
  if (!kind) throw new PluginError('UNKNOWN_TOOL', 'Fluxo indisponível.')
  if (name.startsWith('consultar_')) return deps.list(company, kind, input)
  const allowed = principal.companies.find(item => item.id === company)?.capabilities || []
  if (!workflowCapabilities[kind].every(cap => allowed.includes(cap))) throw new PluginError('ACCESS_DENIED', 'Seu perfil não permite esta operação.', 403)
  if (input.rascunho_id) {
    if (input.dados !== undefined || input.chave_operacao !== undefined) throw new PluginError('INVALID_INPUT', 'Para confirmar, envie somente empresa_id e rascunho_id.')
    const id = String(input.rascunho_id)
    await deps.transaction(async client => {
      const row = await load(client, principal, company, config, id, true)
      if (row.kind !== kind) throw new PluginError('INVALID_INPUT', 'Confirme na mesma tool que preparou a prévia.')
      await access(client, principal, company, kind, deps)
      if (row.status !== 'pending') return
      if (nowExpired(row)) throw new PluginError('DRAFT_EXPIRED', 'A prévia expirou. Prepare uma nova.', 409)
      await client.query("UPDATE plugin.erp_workflows SET status='approved',approved_at=now() WHERE id=$1", [id])
    })
    for (let processed = 0; processed < 5; processed++) {
      let currentIndex = -1
      try {
        const done = await deps.transaction(async client => {
          const row = await load(client, principal, company, config, id, true)
          await access(client, principal, company, kind, deps)
          currentIndex = row.items.findIndex(item => item.status === 'pending')
          if (row.status === 'completed' || currentIndex < 0) return true
          if (nowExpired(row)) throw new PluginError('DRAFT_EXPIRED', 'A autorização expirou. Revise os itens ainda pendentes.', 409)
          const item = row.items[currentIndex]
          const captured = await deps.capture(client, company, kind, item.input, true)
          if (digest(captured.snapshot) !== item.hash) throw new PluginError('STALE_PROPOSAL', 'O registro ou suas referências mudaram. Prepare uma nova prévia.', 409)
          const result = await runWithErpTransactionClient(client, () => deps.apply(client, company, principal.userId, kind, item.input, `${config.integration}:workflow:${row.id}:${currentIndex}`, captured))
          row.items[currentIndex] = { ...item, ...result }
          await client.query("UPDATE plugin.erp_workflows SET items=$2::jsonb,status=$3 WHERE id=$1", [id, JSON.stringify(row.items), row.items.some(entry => entry.status === 'pending') ? 'approved' : 'completed'])
          return false
        })
        if (done) break
      } catch (error) {
        if (currentIndex < 0 || error instanceof PluginError && ['ACCESS_DENIED', 'DRAFT_EXPIRED', 'NOT_FOUND'].includes(error.code)) throw error
        const known = error instanceof PluginError || error instanceof ErpDomainError
        await deps.transaction(async client => {
          const row = await load(client, principal, company, config, id, true), item = row.items[currentIndex]
          if (item?.status !== 'pending') return
          row.items[currentIndex] = { ...item, status: known ? 'failed' : 'unknown', code: known ? error.code : 'OUTCOME_UNKNOWN', message: known ? error.message.slice(0, 500) : 'Não foi possível confirmar o resultado. Consulte a operação antes de qualquer nova tentativa.' }
          await client.query('UPDATE plugin.erp_workflows SET items=$2::jsonb,status=$3 WHERE id=$1', [id, JSON.stringify(row.items), row.items.some(entry => entry.status === 'pending') ? 'approved' : 'completed'])
        })
        if (!known) break
      }
    }
    return deps.transaction(async client => workflowView(await load(client, principal, company, config, id)))
  }
  if (!input.chave_operacao || !input.dados) throw new PluginError('INVALID_INPUT', 'Informe chave_operacao e dados para preparar a prévia.')
  const parsed = workflowInputs[kind].safeParse(input.dados)
  if (!parsed.success) throw new PluginError('INVALID_INPUT', parsed.error.issues.map(issue => issue.message).join(' '), 422)
  const data = parsed.data, hash = digest({ kind, data }), params = scope(principal, company, config)
  const existing = await deps.query<WorkflowRow>(`SELECT * FROM plugin.erp_workflows WHERE ${scopeSql} AND operation_key=$5`, [...params, input.chave_operacao])
  if (existing[0]) {
    if (existing[0].input_hash !== hash || existing[0].kind !== kind) throw new PluginError('IDEMPOTENCY_CONFLICT', 'A chave já foi usada com outros dados.', 409)
    return workflowView(existing[0])
  }
  const inputs: Fields[] = kind === 'classificacao' ? (data as { itens: Fields[] }).itens : kind === 'notas' ? (data as { venda_ids: number[] }).venda_ids.map(venda_id => ({ venda_id })) : [data as Fields]
  const items = await runWithErpDatabaseContext({ tenantId: company, userId: principal.userId, readOnly: true, statementTimeoutMs: 10000, timeZone: principal.companies.find(item => item.id === company)?.timeZone }, () => deps.transaction(async client => {
    await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const captured: WorkflowItem[] = []
    for (const entry of inputs) { const item = await deps.capture(client, company, kind, entry, false); captured.push({ input: entry, hash: digest(item.snapshot), preview: item.preview, status: 'pending' }) }
    return captured
  }))
  const rows = await deps.query<WorkflowRow>(`INSERT INTO plugin.erp_workflows(id,integration,empresa_id,user_id,oauth_client_id,operation_key,kind,input_hash,items)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) ON CONFLICT(integration,empresa_id,user_id,oauth_client_id,operation_key) DO UPDATE SET operation_key=EXCLUDED.operation_key RETURNING *`, [randomUUID(), ...params, input.chave_operacao, kind, hash, JSON.stringify(items)])
  if (rows[0].input_hash !== hash) throw new PluginError('IDEMPOTENCY_CONFLICT', 'A chave já foi usada com outros dados.', 409)
  return workflowView(rows[0])
}

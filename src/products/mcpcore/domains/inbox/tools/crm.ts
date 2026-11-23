// Inbox CRM tools (stages 3–8): report, deals, tasks, segments, broadcasts, automations, knowledge base and the AI's
// suggested reply. Read and changed as the person (row level security), like the /inbox screens.
import { z } from 'zod'
import { PluginError } from '../../../shared/contracts'
import type { Member } from '../../editor/server/database'
import { InboxError } from '@/products/inbox/server/db'
import { period, report } from '@/products/inbox/server/reports'
import { segmentContacts } from '@/products/inbox/server/segments'
import { suggestReply, searchKb } from '@/products/inbox/server/ai'
import { appDb } from '@/products/inbox/server/db'
import { describeCondition, parseRules } from '@/products/inbox/shared/segments'
import { company, tool, uuid, type ToolContext, type WorkspaceTool } from '../../workspace/context'

const base = () => ({ empresa_id: company() })
const limit = (max: number, def: number) => z.number().int().min(1).max(max).default(def).describe('Quantos itens trazer.')
const date = (what: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe(what + ' (AAAA-MM-DD, horário de Brasília).')
const q = (m: Member) => <T,>(sql: string, params: unknown[] = []) => m.db.query<T>(sql, params) as Promise<T[]>
const plugin = (error: unknown): never => {
  if (error instanceof InboxError) throw new PluginError(error.status === 404 ? 'NOT_FOUND' : error.status === 403 ? 'ACCESS_DENIED' : error.status >= 500 ? 'UNAVAILABLE' : 'INVALID_INPUT', error.message, error.status)
  throw error
}
const who = (m: Member, v: string | undefined) => {
  if (v === undefined) return undefined
  if (v === 'ninguem') return null
  const id = v === 'eu' ? m.userId : v
  if (!/^[A-Za-z0-9_]{3,80}$/.test(id)) throw new PluginError('INVALID_INPUT', 'Responsável inválido: use "eu", "ninguem" ou um responsavel_id das consultas.', 422)
  return id
}

const reportTool = tool({
  name: 'inbox_relatorio', title: 'Relatório do Inbox', write: false,
  description: 'Números do período: conversas novas e encerradas, tempo da 1ª resposta, avaliações, desempenho por responsável, receita e vendas por origem do lead, funil de negócios, automações/IA e disparos.',
  schema: z.object({ ...base(), de: date('Início').optional(), ate: date('Fim').optional() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    try { return { ...(await report(q(m), m.ws, period(input.de, input.ate))), link: `${ctx.origin}/relatorios` } } catch (e) { return plugin(e) }
  }),
})

type DealRow = { id: string; title: string; value: string | null; expected_close: string | null; owner: string | null; stage: string; kind: string; pipeline: string; contact_id: string | null; contact: string | null; closed_at: string | null; updated_at: string }
const listDeals = tool({
  name: 'inbox_listar_negocios', title: 'Listar negócios', write: false,
  description: 'Negócios do funil (kanban de vendas) com etapa, valor, previsão, contato e responsável. Filtre por funil, situação, contato ou responsável.',
  schema: z.object({ ...base(), funil: z.string().max(80).optional().describe('Nome do funil; omita para todos.'), situacao: z.enum(['aberto', 'ganho', 'perdido', 'todos']).default('aberto').describe('Tipo da etapa.'),
    contato_id: uuid('Só deste contato.').optional(), responsavel: z.string().max(80).optional().describe('"eu" ou um responsavel_id.'), limite: limit(200, 50) }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const params: unknown[] = [m.ws], where = ['d.workspace_id = $1']
    const add = (sql: string, v: unknown) => { params.push(v); where.push(sql.replace('?', `$${params.length}`)) }
    if (input.funil) add('lower(p.name) = lower(?)', input.funil)
    if (input.situacao !== 'todos') add('s.kind::text = ?', input.situacao)
    if (input.contato_id) add('d.contact_id = ?', input.contato_id)
    if (input.responsavel) add('d.owner = ?', who(m, input.responsavel))
    const rows = await m.db.query<DealRow>(`SELECT d.id, d.title, d.value, d.expected_close, d.owner, s.name AS stage, s.kind, p.name AS pipeline, d.contact_id, k.name AS contact, d.closed_at, d.updated_at
      FROM inbox.deals d JOIN inbox.pipeline_stages s ON s.id = d.stage_id JOIN inbox.pipelines p ON p.id = d.pipeline_id LEFT JOIN inbox.contacts k ON k.id = d.contact_id
      WHERE ${where.join(' AND ')} ORDER BY d.updated_at DESC LIMIT ${input.limite}`, params)
    const total = rows.reduce((t, r) => t + Number(r.value ?? 0), 0)
    return { negocios: rows.map(r => ({ id: r.id, titulo: r.title, funil: r.pipeline, etapa: r.stage, situacao: r.kind, valor: r.value == null ? undefined : Number(r.value),
      previsao: r.expected_close ?? undefined, contato: r.contact ?? undefined, contato_id: r.contact_id ?? undefined, responsavel_id: r.owner ?? undefined, fechado_em: r.closed_at ?? undefined })),
    quantidade: rows.length, valor_total: total, link: `${ctx.origin}/negocios` }
  }),
})

const saveDeal = tool({
  name: 'inbox_salvar_negocio', title: 'Criar ou mover negócio', write: true,
  description: 'Cria um negócio (sem negocio_id) ou altera um existente: título, valor, etapa (pelo nome, ex.: "Proposta", "Ganho"), contato, previsão, responsável, anotações. Mudar para etapa de ganho/perdido fecha o negócio.',
  schema: z.object({ ...base(), negocio_id: uuid('Negócio a alterar; omita para criar.').optional(), funil: z.string().max(80).optional().describe('Nome do funil (padrão: o primeiro).'),
    etapa: z.string().max(60).optional().describe('Nome da etapa (padrão ao criar: a primeira do funil).'), titulo: z.string().trim().min(1).max(160).optional().describe('Título.'),
    valor: z.number().min(0).max(1e12).nullable().optional().describe('Valor em reais.'), contato_id: uuid('Contato.').nullable().optional(), previsao: date('Previsão de fechamento').nullable().optional(),
    responsavel: z.string().max(80).optional().describe('"eu", "ninguem" ou um responsavel_id.'), anotacoes: z.string().max(4000).nullable().optional().describe('Anotações.'),
    motivo_perda: z.string().max(300).optional().describe('Por que foi perdido (ao mover para perdido).') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    let pipelineId: string | undefined
    if (input.negocio_id) {
      const [d] = await m.db.query<{ pipeline_id: string }>('SELECT pipeline_id FROM inbox.deals WHERE id = $1 AND workspace_id = $2', [input.negocio_id, m.ws])
      if (!d) throw new PluginError('NOT_FOUND', 'Negócio não encontrado nesta empresa. Use inbox_listar_negocios.', 404)
      pipelineId = d.pipeline_id
    }
    if (input.funil || !pipelineId) {
      const [p] = await m.db.query<{ id: string }>(`SELECT id FROM inbox.pipelines WHERE workspace_id = $1 ${input.funil ? 'AND lower(name) = lower($2)' : ''} ORDER BY position, created_at LIMIT 1`, input.funil ? [m.ws, input.funil] : [m.ws])
      if (!p) throw new PluginError('NOT_FOUND', input.funil ? `Funil "${input.funil}" não existe.` : 'Nenhum funil criado. Crie em /negocios.', 404)
      pipelineId = p.id
    }
    let stageId: string | undefined
    if (input.etapa || !input.negocio_id) {
      const [s] = await m.db.query<{ id: string }>(`SELECT id FROM inbox.pipeline_stages WHERE pipeline_id = $1 ${input.etapa ? 'AND lower(name) = lower($2)' : ''} ORDER BY position LIMIT 1`, input.etapa ? [pipelineId, input.etapa] : [pipelineId])
      if (!s) throw new PluginError('NOT_FOUND', `Etapa "${input.etapa ?? ''}" não existe neste funil.`, 404)
      stageId = s.id
    }
    const owner = who(m, input.responsavel)
    if (!input.negocio_id) {
      if (!input.titulo) throw new PluginError('INVALID_INPUT', 'Informe o título do negócio.', 422)
      const [d] = await m.db.query<{ id: string }>(`INSERT INTO inbox.deals (workspace_id, pipeline_id, stage_id, title, value, contact_id, expected_close, owner, notes, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, extract(epoch FROM now())) RETURNING id`,
      [m.ws, pipelineId, stageId, input.titulo, input.valor ?? null, input.contato_id ?? null, input.previsao ?? null, owner ?? null, input.anotacoes ?? null])
      return { negocio_id: d.id, criado: true, link: `${ctx.origin}/negocios` }
    }
    const sets: string[] = [], params: unknown[] = [input.negocio_id]
    const set = (col: string, v: unknown) => { params.push(v); sets.push(`${col} = $${params.length}`) }
    if (input.funil) set('pipeline_id', pipelineId)
    if (stageId) set('stage_id', stageId)
    if (input.titulo) set('title', input.titulo)
    if (input.valor !== undefined) set('value', input.valor)
    if (input.contato_id !== undefined) set('contact_id', input.contato_id)
    if (input.previsao !== undefined) set('expected_close', input.previsao)
    if (owner !== undefined) set('owner', owner)
    if (input.anotacoes !== undefined) set('notes', input.anotacoes)
    if (input.motivo_perda) set('lost_reason', input.motivo_perda)
    if (!sets.length) throw new PluginError('INVALID_INPUT', 'Nada para alterar.', 422)
    const done = await m.db.query(`UPDATE inbox.deals SET ${sets.join(', ')} WHERE id = $1 RETURNING id`, params).catch((e: Error) => {
      if (/row-level security/.test(e.message)) throw new PluginError('INVALID_INPUT', 'Contato ou etapa não pertencem a esta empresa/funil.', 422)
      throw e
    })
    if (!done.length) throw new PluginError('ACCESS_DENIED', 'Seu perfil só pode visualizar.', 403)
    return { negocio_id: input.negocio_id, alterado: true, link: `${ctx.origin}/negocios` }
  }),
})

const listTasks = tool({
  name: 'inbox_listar_tarefas', title: 'Listar tarefas', write: false,
  description: 'Tarefas da equipe (ligar, mandar proposta…), com vencimento, contato e negócio. Por padrão só as pendentes.',
  schema: z.object({ ...base(), situacao: z.enum(['pendentes', 'atrasadas', 'concluidas', 'todas']).default('pendentes').describe('Quais trazer.'),
    minhas: z.boolean().default(false).describe('Só as atribuídas a você.'), limite: limit(200, 50) }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const cond = { pendentes: 't.done_at IS NULL', atrasadas: 't.done_at IS NULL AND t.due_at < now()', concluidas: 't.done_at IS NOT NULL', todas: 'true' }[input.situacao]
    const rows = await m.db.query<{ id: string; title: string; due_at: string | null; done_at: string | null; assignee: string | null; contact: string | null; contact_id: string | null; deal: string | null; deal_id: string | null }>(
      `SELECT t.id, t.title, t.due_at, t.done_at, t.assignee, k.name AS contact, t.contact_id, d.title AS deal, t.deal_id FROM inbox.tasks t
       LEFT JOIN inbox.contacts k ON k.id = t.contact_id LEFT JOIN inbox.deals d ON d.id = t.deal_id
       WHERE t.workspace_id = $1 AND ${cond} ${input.minhas ? 'AND t.assignee = $2' : ''} ORDER BY t.done_at NULLS FIRST, t.due_at NULLS LAST LIMIT ${input.limite}`, input.minhas ? [m.ws, m.userId] : [m.ws])
    return { tarefas: rows.map(t => ({ id: t.id, titulo: t.title, vence_em: t.due_at ?? undefined, atrasada: !t.done_at && !!t.due_at && new Date(t.due_at) < new Date() ? true : undefined,
      concluida_em: t.done_at ?? undefined, responsavel_id: t.assignee ?? undefined, contato: t.contact ?? undefined, contato_id: t.contact_id ?? undefined, negocio: t.deal ?? undefined, negocio_id: t.deal_id ?? undefined })),
    link: `${ctx.origin}/negocios?aba=tarefas` }
  }),
})

const saveTask = tool({
  name: 'inbox_salvar_tarefa', title: 'Criar ou concluir tarefa', write: true,
  description: 'Cria uma tarefa (sem tarefa_id), ligada a um contato e/ou negócio, ou marca uma existente como concluída/reaberta.',
  schema: z.object({ ...base(), tarefa_id: uuid('Tarefa a alterar; omita para criar.').optional(), titulo: z.string().trim().min(1).max(200).optional().describe('O que fazer.'),
    vence_em: z.string().datetime({ offset: true }).optional().describe('Quando, ISO 8601 com fuso, ex.: 2026-11-25T14:00:00-03:00.'), contato_id: uuid('Contato.').optional(), negocio_id: uuid('Negócio.').optional(),
    responsavel: z.string().max(80).default('eu').describe('"eu", "ninguem" ou um responsavel_id.'), concluida: z.boolean().optional().describe('true conclui; false reabre.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (input.tarefa_id) {
      if (input.concluida === undefined) throw new PluginError('INVALID_INPUT', 'Para uma tarefa existente, informe concluida.', 422)
      const r = await m.db.query(`UPDATE inbox.tasks SET done_at = ${input.concluida ? 'now()' : 'NULL'} WHERE id = $1 AND workspace_id = $2 RETURNING id`, [input.tarefa_id, m.ws])
      if (!r.length) throw new PluginError('NOT_FOUND', 'Tarefa não encontrada (ou seu perfil só pode visualizar).', 404)
      return { tarefa_id: input.tarefa_id, concluida: input.concluida }
    }
    if (!input.titulo) throw new PluginError('INVALID_INPUT', 'Informe o título da tarefa.', 422)
    const [t] = await m.db.query<{ id: string }>(`INSERT INTO inbox.tasks (workspace_id, title, due_at, contact_id, deal_id, assignee) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [m.ws, input.titulo, input.vence_em ?? null, input.contato_id ?? null, input.negocio_id ?? null, who(m, input.responsavel) ?? null]).catch((e: Error) => {
      if (/row-level security/.test(e.message)) throw new PluginError('INVALID_INPUT', 'Contato ou negócio não são desta empresa (ou seu perfil só pode visualizar).', 422)
      throw e
    })
    return { tarefa_id: t.id, criada: true, link: `${ctx.origin}/negocios?aba=tarefas` }
  }),
})

const listSegments = tool({
  name: 'inbox_listar_segmentos', title: 'Listar segmentos', write: false,
  description: 'Segmentos de contatos (listas por regras: etiqueta, compra, origem, negócio…) com as regras em texto e quantos contatos cada um tem hoje.',
  schema: z.object({ ...base() }).strict(),
  run: (_i, ctx) => ctx.as(async m => {
    const segs = await m.db.query<{ id: string; name: string; rules: unknown }>('SELECT id, name, rules FROM inbox.segments WHERE workspace_id = $1 ORDER BY name', [m.ws])
    const tags = new Map((await m.db.query<{ id: string; name: string }>('SELECT id, name FROM inbox.tags WHERE workspace_id = $1', [m.ws])).map(t => [t.id, t.name]))
    const out = []
    for (const s of segs) {
      let rules; try { rules = parseRules(s.rules) } catch { continue }
      out.push({ id: s.id, nome: s.name, regras: rules.condicoes.map(c => describeCondition(c, { tags })), combina: rules.modo === 'qualquer' ? 'qualquer regra' : 'todas as regras',
        contatos: (await segmentContacts(q(m), m.ws, rules, { limit: 0 })).total })
    }
    return { segmentos: out, link: `${ctx.origin}/inbox/contatos` }
  }),
})

const listBroadcasts = tool({
  name: 'inbox_listar_disparos', title: 'Listar disparos', write: false,
  description: 'Disparos em massa (WhatsApp com modelo aprovado ou e-mail): situação, segmento, enviados, falhas e ignorados.',
  schema: z.object({ ...base(), limite: limit(100, 20) }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const rows = await m.db.query<{ id: string; name: string; kind: string; status: string; segment: string | null; scheduled_at: string | null; started_at: string | null; total: number; sent: number; failed: number; skipped: number; error: string | null }>(
      `SELECT b.id, b.name, b.kind, b.status, s.name AS segment, b.scheduled_at, b.started_at, b.total, b.sent, b.failed, b.skipped, b.error
       FROM inbox.broadcasts b LEFT JOIN inbox.segments s ON s.id = b.segment_id WHERE b.workspace_id = $1 ORDER BY b.created_at DESC LIMIT ${input.limite}`, [m.ws])
    return { disparos: rows.map(b => ({ id: b.id, nome: b.name, tipo: b.kind === 'email' ? 'e-mail' : 'WhatsApp', situacao: b.status, segmento: b.segment ?? undefined, agendado_para: b.scheduled_at ?? undefined,
      iniciado_em: b.started_at ?? undefined, no_segmento: b.total, enviados: b.sent, falhas: b.failed, ignorados: b.skipped, erro: b.error ?? undefined })), link: `${ctx.origin}/disparos` }
  }),
})

const listFlows = tool({
  name: 'inbox_listar_automacoes', title: 'Listar automações', write: false,
  description: 'Automações (fluxos estilo ManyChat): situação, gatilhos e quantas vezes rodaram nos últimos 30 dias.',
  schema: z.object({ ...base() }).strict(),
  run: (_i, ctx) => ctx.as(async m => {
    const rows = await m.db.query<{ id: string; name: string; status: string; published_at: string | null; triggers: string[] | null; runs: string; done: string }>(
      `SELECT f.id, f.name, f.status, f.published_at, (SELECT array_agg(t.kind::text ORDER BY t.kind) FROM inbox.triggers t WHERE t.flow_id = f.id AND t.active) AS triggers,
         (SELECT count(*) FROM inbox.flow_events e WHERE e.flow_id = f.id AND e.kind = 'iniciou' AND e.created_at > now() - interval '30 days')::text AS runs,
         (SELECT count(*) FROM inbox.flow_events e WHERE e.flow_id = f.id AND e.kind = 'concluiu' AND e.created_at > now() - interval '30 days')::text AS done
       FROM inbox.flows f WHERE f.workspace_id = $1 ORDER BY f.updated_at DESC`, [m.ws])
    return { automacoes: rows.map(f => ({ id: f.id, nome: f.name, situacao: f.status, publicada_em: f.published_at ?? undefined, gatilhos: f.triggers ?? [], execucoes_30d: Number(f.runs), concluidas_30d: Number(f.done),
      link: `${ctx.origin}/automacoes/${f.id}` })) }
  }),
})

const searchKnowledge = tool({
  name: 'inbox_buscar_conhecimento', title: 'Buscar na base de conhecimento', write: false,
  description: 'Procura artigos da base de conhecimento que a IA usa para responder (preços, prazos, políticas…). Sem busca, lista os títulos.',
  schema: z.object({ ...base(), busca: z.string().max(300).optional().describe('Palavras ou pergunta.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (input.busca?.trim()) return { artigos: await searchKb(q(m), m.ws, input.busca, 8), link: `${ctx.origin}/inbox/configuracoes` }
    const rows = await m.db.query<{ id: string; title: string }>('SELECT id, title FROM inbox.kb_articles WHERE workspace_id = $1 ORDER BY title LIMIT 200', [m.ws])
    return { artigos: rows.map(a => ({ id: a.id, titulo: a.title })), link: `${ctx.origin}/inbox/configuracoes` }
  }),
})

const saveArticle = tool({
  name: 'inbox_salvar_artigo', title: 'Salvar artigo da base de conhecimento', write: true,
  description: 'Cria um artigo (sem artigo_id) ou atualiza um existente na base de conhecimento que a IA usa para responder clientes.',
  schema: z.object({ ...base(), artigo_id: uuid('Artigo a alterar; omita para criar.').optional(), titulo: z.string().trim().min(1).max(200).describe('Título, ex.: Prazo de entrega.'),
    texto: z.string().trim().min(1).max(20000).describe('Conteúdo, como explicaria a um atendente novo.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const r = input.artigo_id
      ? await m.db.query<{ id: string }>('UPDATE inbox.kb_articles SET title = $3, body = $4 WHERE id = $1 AND workspace_id = $2 RETURNING id', [input.artigo_id, m.ws, input.titulo, input.texto])
      : await m.db.query<{ id: string }>('INSERT INTO inbox.kb_articles (workspace_id, title, body) VALUES ($1, $2, $3) RETURNING id', [m.ws, input.titulo, input.texto])
    if (!r.length) throw new PluginError('NOT_FOUND', 'Artigo não encontrado nesta empresa.', 404)
    return { artigo_id: r[0].id, salvo: true, link: `${ctx.origin}/inbox/configuracoes` }
  }),
})

const suggest = tool({
  name: 'inbox_sugerir_resposta', title: 'Sugerir resposta com IA', write: false, openWorld: true,
  description: 'A IA do Inbox escreve uma sugestão de resposta para a conversa, usando a base de conhecimento e as regras da empresa. Não envia nada: mostre o texto e, se a pessoa aprovar, envie com inbox_responder.',
  schema: z.object({ ...base(), conversa_id: uuid('Conversa, de inbox_listar_conversas.') }).strict(),
  run: async (input, ctx: ToolContext) => {
    const person = await ctx.as(async m => ({ userId: m.userId, orgId: m.ws }))
    try { return { ...(await suggestReply(person, input.conversa_id, ctx.inbox?.db ?? appDb)), enviado: false } } catch (e) { return plugin(e) }
  },
})

export const crmTools: WorkspaceTool[] = [reportTool, listDeals, saveDeal, listTasks, saveTask, listSegments, listBroadcasts, listFlows, searchKnowledge, saveArticle, suggest]

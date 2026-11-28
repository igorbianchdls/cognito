// Analytics tools: ask about visits and events and set up sites, goals and event names (schema analytics, Postgres).
// Tudo roda como a pessoa (só a empresa dela); o site é conferido antes de cada consulta.
import { z } from 'zod'
import { PluginError } from '../../../shared/contracts'
import type { Member } from '../../editor/server/database'
import { executar, funil as rodarFunil } from '@/products/analytics/server/motor'
import { consulta as consultaSchema } from '@/products/analytics/shared/consulta'
import { company, confirmed, tool, uuid, type ToolContext, type WorkspaceTool } from '../../workspace/context'
import {
  BUCKETS, DIMENSION_NAMES, SCOPE, TZ, change, dimensionSql, filtersSql, iso, label, measureSql, period, run, scopeParams, type Filter, type Param,
} from '../server/queries'

type Property = { id: string; name: string; kind: string; domains: string[]; public_key: string; require_consent: boolean; created_at: string }
type Row = Record<string, unknown>

const base = () => ({ empresa_id: company() })
const siteId = () => uuid('Site ou app, de analytics_listar_sites.')
const dates = () => ({
  de: z.string().date().optional().describe('Início (AAAA-MM-DD). Padrão: 30 dias atrás.'),
  ate: z.string().date().optional().describe('Fim, inclusive (AAAA-MM-DD). Padrão: hoje.'),
})
const filters = () => z.array(z.object({
  campo: z.string().max(80).describe(`Campo: ${DIMENSION_NAMES.join(', ')} ou propriedade:<nome> (propriedade enviada pelo site).`),
  operador: z.enum(['igual', 'diferente', 'contem', 'nao_contem', 'existe']).describe('Como comparar.'),
  valor: z.string().max(200).optional().describe('Valor a comparar (não usado em existe).'),
}).strict()).max(10).describe('Filtros, todos precisam valer.')
const EVENT = z.string().min(1).max(120).regex(/^[$A-Za-z0-9_.:\- ]+$/, 'Nome de evento inválido.')
const event = (what: string) => EVENT.describe(what)

async function needProperty(m: Member, id: string): Promise<Property> {
  const [p] = await m.db.query<Property>('SELECT id, name, kind, domains, public_key, require_consent, created_at FROM analytics.properties WHERE id = $1 AND workspace_id = $2', [id, m.ws])
  if (!p) throw new PluginError('NOT_FOUND', 'Site ou app não encontrado nesta empresa. Use analytics_listar_sites.', 404)
  return p
}
type Q = { query: <R extends Row>(sql: string, params: Param[]) => Promise<R[]> }
/** Lê o site como a pessoa e roda `fn` na mesma transação (as regras de acesso valem para os eventos também). */
async function withProperty<T>(ctx: ToolContext, id: string, fn: (p: Property, q: Q, db: Member["db"]) => Promise<T>) {
  return ctx.as(async m => {
    const p = await needProperty(m, id)
    await m.db.query("SET LOCAL statement_timeout = '20s'")
    return fn(p, { query: <R extends Row>(sql: string, params: Param[]) => run<R>(m.db, sql, params) }, m.db)
  })
}
const snippet = (ctx: ToolContext, p: Property) => `<script async src="${ctx.origin}/otto.js" data-key="${p.public_key}"${p.require_consent ? ' data-consent="required"' : ''}></script>`
const n = (v: unknown) => Number(v ?? 0)
const cleanDomains = (list: string[]) => [...new Set(list.map(d => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(d => /^[a-z0-9.-]+\.[a-z]{2,}$|^localhost(:\d+)?$/.test(d)))]

// ====================== A. Consultas ======================

const listSites = tool({
  name: 'analytics_listar_sites', title: 'Sites e apps medidos', write: false,
  description: 'Sites e apps que a empresa mede, com domínios, quando chegou o último evento e quantos nos últimos 7 dias.',
  schema: z.object(base()).strict(),
  run: async (_i, ctx) => {
    const list = await ctx.as(m => m.db.query<Property>('SELECT id, name, kind, domains, public_key, require_consent, created_at FROM analytics.properties WHERE workspace_id = $1 ORDER BY created_at', [m.ws]))
    const per = period(undefined, undefined, 7)
    const stats: Record<string, { ultimo: string | null; eventos: number }> = {}
    for (const s of list) {
      const [r] = await ctx.as(m => run<{ ultimo: string | null; eventos: number }>(m.db, `SELECT ${iso('MAX("timestamp")')} AS ultimo, COUNT(*)::int AS eventos FROM analytics.events WHERE ${SCOPE}`, scopeParams(s.id, per)))
      stats[s.id] = { ultimo: r?.ultimo ?? null, eventos: n(r?.eventos) }
    }
    return { sites: list.map(s => ({ id: s.id, nome: s.name, tipo: s.kind, dominios: s.domains, pede_consentimento: s.require_consent || undefined,
      ultimo_evento: stats[s.id]?.ultimo ?? undefined, eventos_7_dias: stats[s.id]?.eventos, link: `${ctx.origin}/analytics` })) }
  },
})

const summary = tool({
  name: 'analytics_resumo', title: 'Resumo de visitas', write: false,
  description: 'Visitantes, sessões, páginas vistas e eventos no período, com a série por dia. Bom ponto de partida para "como foi o site esta semana?".',
  schema: z.object({ ...base(), site_id: siteId(), ...dates() }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const per = period(input.de, input.ate), params = scopeParams(p.id, per)
    const [[tot], days] = await Promise.all([
      q.query<Row>(`SELECT COUNT(DISTINCT person)::int AS visitantes, COUNT(DISTINCT session_id)::int AS sessoes, (COUNT(*) FILTER (WHERE event = '$pageview'))::int AS paginas_vistas, COUNT(*)::int AS eventos, COUNT(DISTINCT user_id)::int AS usuarios_identificados FROM analytics.events_people WHERE ${SCOPE}`, params),
      q.query<Row>(`SELECT ${BUCKETS.dia} AS dia, COUNT(DISTINCT person)::int AS visitantes, COUNT(DISTINCT session_id)::int AS sessoes, (COUNT(*) FILTER (WHERE event = '$pageview'))::int AS paginas_vistas FROM analytics.events_people WHERE ${SCOPE} GROUP BY dia ORDER BY dia`, params),
    ])
    return { site: p.name, periodo: label(per), totais: tot ?? {}, por_dia: days, link: `${ctx.origin}/analytics` }
  }),
})

const trend = tool({
  name: 'analytics_tendencia', title: 'Tendência de um evento', write: false,
  description: 'A consulta mais flexível: um evento ao longo do tempo (total, visitantes, sessões, usuários, ou soma/média de uma propriedade numérica como valor), por hora, dia, semana ou mês, opcionalmente dividido por um campo (origem, campanha, página, aparelho, país, propriedade:<nome>…) e com filtros. Divisões mostram os 8 maiores valores e "Outros".',
  schema: z.object({ ...base(), site_id: siteId(), ...dates(),
    evento: event('Evento, ex.: $pageview (página vista), assinou, criou_conta.').default('$pageview'),
    medida: z.enum(['total', 'visitantes', 'sessoes', 'usuarios', 'soma', 'media']).default('visitantes').describe('O que contar.'),
    propriedade: z.string().max(64).optional().describe('Para soma e média: a propriedade numérica do evento, ex.: valor.'),
    intervalo: z.enum(['hora', 'dia', 'semana', 'mes']).default('dia').describe('Agrupamento no tempo.'),
    dividir_por: z.string().max(80).optional().describe(`Campo para dividir: ${DIMENSION_NAMES.join(', ')} ou propriedade:<nome>.`),
    filtros: filters().optional() }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const per = period(input.de, input.ate)
    if (input.intervalo === 'hora' && per.ate.getTime() - per.de.getTime() > 14 * 86400000) throw new PluginError('INVALID_INPUT', 'Por hora, use até 14 dias.', 422)
    const f = filtersSql(input.filtros as Filter[] | undefined), measure = measureSql(input.medida, input.propriedade)
    const params = [...scopeParams(p.id, per), { name: 'ev', type: 'STRING' as const, value: input.evento }, ...f.params]
    const where = `${SCOPE} AND event = @ev${f.sql}`
    if (!input.dividir_por) {
      const rows = await q.query<Row>(`SELECT ${BUCKETS[input.intervalo]} AS periodo, ${measure} AS valor FROM analytics.events_people WHERE ${where} GROUP BY periodo ORDER BY periodo`, params)
      return { site: p.name, periodo: label(per), evento: input.evento, medida: input.medida, serie: rows, total_do_periodo: input.medida === 'media' ? undefined : rows.reduce((v, r) => v + n(r.valor), 0) }
    }
    const dim = dimensionSql(input.dividir_por)
    const rows = await q.query<Row>(`
      WITH base AS (SELECT *, ${dim} AS chave FROM analytics.events_people WHERE ${where}),
        topo AS (SELECT chave FROM base GROUP BY chave ORDER BY COUNT(*) DESC LIMIT 8)
      SELECT ${BUCKETS[input.intervalo]} AS periodo, CASE WHEN chave IN (SELECT chave FROM topo) THEN chave ELSE 'Outros' END AS grupo, ${measure} AS valor
      FROM base GROUP BY 1, 2 ORDER BY periodo, valor DESC`, params)
    return { site: p.name, periodo: label(per), evento: input.evento, medida: input.medida, dividido_por: input.dividir_por, serie: rows }
  }),
})

const compare = tool({
  name: 'analytics_comparar', title: 'Comparar períodos', write: false,
  description: 'Compara um período com o anterior de mesmo tamanho ou com o mesmo período do ano passado: visitantes, sessões, páginas vistas, eventos e, se informado, um evento específico, com a variação em %.',
  schema: z.object({ ...base(), site_id: siteId(), ...dates(), comparar_com: z.enum(['anterior', 'ano_passado']).default('anterior').describe('Contra o quê comparar.'),
    evento: event('Evento extra a comparar, ex.: assinou.').optional(), filtros: filters().optional() }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const now = period(input.de, input.ate), len = now.ate.getTime() - now.de.getTime()
    const before = input.comparar_com === 'anterior' ? { de: new Date(now.de.getTime() - len), ate: now.de }
      : { de: new Date(now.de.getTime() - 365 * 86400000), ate: new Date(now.ate.getTime() - 365 * 86400000) }
    const f = filtersSql(input.filtros as Filter[] | undefined)
    const sql = `SELECT COUNT(DISTINCT person)::int AS visitantes, COUNT(DISTINCT session_id)::int AS sessoes, (COUNT(*) FILTER (WHERE event = '$pageview'))::int AS paginas_vistas, COUNT(*)::int AS eventos,
      (COUNT(*) FILTER (WHERE event = @ev))::int AS evento_escolhido FROM analytics.events_people WHERE ${SCOPE}${f.sql}`
    const run = (per: typeof now): Promise<Row> => q.query<Row>(sql, [...scopeParams(p.id, per), { name: 'ev', type: 'STRING', value: input.evento ?? '' }, ...f.params]).then(r => r[0] ?? {})
    const a = await run(now), b = await run(before)
    const keys = ['visitantes', 'sessoes', 'paginas_vistas', 'eventos', ...(input.evento ? ['evento_escolhido'] : [])]
    return { site: p.name, periodo: label(now), comparado_com: label(before), evento: input.evento,
      metricas: keys.map(k => ({ metrica: k === 'evento_escolhido' ? input.evento : k, atual: n(a[k]), antes: n(b[k]), variacao_pct: change(n(a[k]), n(b[k])) })) }
  }),
})

const ranking = tool({
  name: 'analytics_ranking', title: 'Ranking', write: false,
  description: 'Os maiores valores de um campo no período (páginas, origens, campanhas, aparelhos, países, eventos, propriedade:<nome>…), com visitantes, total e a variação contra o período anterior.',
  schema: z.object({ ...base(), site_id: siteId(), ...dates(), campo: z.string().max(80).describe(`Campo: ${DIMENSION_NAMES.join(', ')} ou propriedade:<nome>.`),
    evento: event('Só este evento. Padrão: páginas vistas, exceto quando o campo é evento.').optional(), filtros: filters().optional(),
    limite: z.number().int().min(1).max(50).default(15).describe('Quantos itens.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const now = period(input.de, input.ate), len = now.ate.getTime() - now.de.getTime(), before = { de: new Date(now.de.getTime() - len), ate: now.de }
    const dim = dimensionSql(input.campo), f = filtersSql(input.filtros as Filter[] | undefined)
    const ev = input.evento ?? (input.campo === 'evento' ? '' : '$pageview')
    const sql = (scope: string) => `SELECT ${dim} AS valor, COUNT(*)::int AS total, COUNT(DISTINCT person)::int AS visitantes FROM analytics.events_people
      WHERE ${scope} AND (@ev = '' OR event = @ev)${f.sql} GROUP BY valor ORDER BY visitantes DESC, total DESC LIMIT ${input.limite}`
    const prevScope = 'property_id = @p::uuid AND "timestamp" >= @de0::timestamptz AND "timestamp" < @de::timestamptz'
    const [rows, prev] = await Promise.all([
      q.query<Row>(sql(SCOPE), [...scopeParams(p.id, now), { name: 'ev', type: 'STRING', value: ev }, ...f.params]),
      q.query<Row>(sql(prevScope), [...scopeParams(p.id, now), { name: 'de0', type: 'TIMESTAMP', value: before.de.toISOString() }, { name: 'ev', type: 'STRING', value: ev }, ...f.params]),
    ])
    const defs = input.campo === 'evento' ? await q.query<{ event: string; label: string }>('SELECT event, label FROM analytics.event_definitions WHERE property_id = @p::uuid', [{ name: 'p', type: 'STRING', value: p.id }]) : []
    return { site: p.name, periodo: label(now), campo: input.campo, evento: ev || undefined,
      itens: rows.map(r => { const old = prev.find(x => x.valor === r.valor); const nome = defs.find(d => d.event === r.valor)?.label
        return { valor: r.valor, nome: nome || undefined, visitantes: n(r.visitantes), total: n(r.total), visitantes_antes: n(old?.visitantes), variacao_pct: change(n(r.visitantes), n(old?.visitantes)) } }) }
  }),
})

async function goalCondition(q: Q, propertyId: string, metaId?: string, evento?: string) {
  if (metaId) {
    const [g] = await q.query<{ name: string; event: string; path: string | null }>('SELECT name, event, path FROM analytics.goals WHERE id = @gid::uuid AND property_id = @p::uuid', [{ name: 'gid', type: 'STRING', value: metaId }, { name: 'p', type: 'STRING', value: propertyId }])
    if (!g) throw new PluginError('NOT_FOUND', 'Meta não encontrada neste site.', 404)
    return { name: g.name, sql: "event = @ge AND (@gp = '' OR path = @gp)", params: [{ name: 'ge', type: 'STRING' as const, value: g.event }, { name: 'gp', type: 'STRING' as const, value: g.path ?? '' }] }
  }
  if (evento) return { name: evento, sql: 'event = @ge', params: [{ name: 'ge', type: 'STRING' as const, value: evento }] }
  return null
}

const campaigns = tool({
  name: 'analytics_campanhas', title: 'Campanhas', write: false,
  description: 'Desempenho por campanha (fonte, meio e campanha do link UTM): visitantes, sessões e, com uma meta ou evento, quantas sessões vindas da campanha converteram e a taxa. A campanha é a da primeira página da sessão.',
  schema: z.object({ ...base(), site_id: siteId(), ...dates(), meta_id: uuid('Meta de conversão (analytics_criar_meta).').optional(),
    evento_conversao: event('Ou um evento como conversão, ex.: assinou.').optional(), limite: z.number().int().min(1).max(50).default(20).describe('Quantas campanhas.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const per = period(input.de, input.ate), goal = await goalCondition(q, p.id, input.meta_id, input.evento_conversao)
    const rows = await q.query<Row>(`
      WITH s AS (
        SELECT session_id, max(person) AS visitante,
          (array_agg(utm_source ORDER BY "timestamp"))[1] AS utm_source, (array_agg(utm_medium ORDER BY "timestamp"))[1] AS utm_medium,
          (array_agg(utm_campaign ORDER BY "timestamp"))[1] AS utm_campaign, (array_agg(referrer_host ORDER BY "timestamp"))[1] AS referrer_host,
          ${goal ? `bool_or(${goal.sql})` : 'FALSE'} AS converteu
        FROM analytics.events_people WHERE ${SCOPE} AND session_id IS NOT NULL GROUP BY session_id)
      SELECT COALESCE(utm_source, referrer_host, '(direto)') AS fonte, COALESCE(utm_medium, '(nenhum)') AS meio,
        COALESCE(utm_campaign, '(sem campanha)') AS campanha, COUNT(DISTINCT visitante)::int AS visitantes, COUNT(*)::int AS sessoes, (COUNT(*) FILTER (WHERE converteu))::int AS conversoes
      FROM s GROUP BY 1, 2, 3 ORDER BY sessoes DESC LIMIT ${input.limite}`, [...scopeParams(p.id, per), ...(goal?.params ?? [])])
    return { site: p.name, periodo: label(per), conversao: goal?.name,
      campanhas: rows.map(r => ({ ...r, visitantes: n(r.visitantes), sessoes: n(r.sessoes), conversoes: goal ? n(r.conversoes) : undefined,
        taxa_conversao_pct: goal && n(r.sessoes) ? Math.round(n(r.conversoes) / n(r.sessoes) * 1000) / 10 : undefined })) }
  }),
})

const pages = tool({
  name: 'analytics_paginas', title: 'Páginas', write: false,
  description: 'Sem página: cada página com visualizações, visitantes, entradas (primeira da sessão), saídas e taxa de saída. Com página: os números dela e de onde as pessoas vêm e para onde vão depois.',
  schema: z.object({ ...base(), site_id: siteId(), ...dates(), pagina: z.string().max(500).optional().describe('Caminho, ex.: /precos.'), limite: z.number().int().min(1).max(50).default(20).describe('Quantas páginas.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const per = period(input.de, input.ate), params = scopeParams(p.id, per)
    const pv = `pv AS (SELECT path, person, session_id, LAG(path) OVER w AS anterior, LEAD(path) OVER w AS seguinte,
      ROW_NUMBER() OVER w AS ordem, COUNT(*) OVER (PARTITION BY session_id) AS total_sessao
      FROM analytics.events_people WHERE ${SCOPE} AND event = '$pageview' AND path IS NOT NULL WINDOW w AS (PARTITION BY session_id ORDER BY "timestamp"))`
    if (!input.pagina) {
      const rows = await q.query<Row>(`WITH ${pv} SELECT path AS pagina, COUNT(*)::int AS visualizacoes, COUNT(DISTINCT person)::int AS visitantes,
        (COUNT(*) FILTER (WHERE ordem = 1))::int AS entradas, (COUNT(*) FILTER (WHERE seguinte IS NULL))::int AS saidas FROM pv GROUP BY 1 ORDER BY visualizacoes DESC LIMIT ${input.limite}`, params)
      return { site: p.name, periodo: label(per), paginas: rows.map(r => ({ ...r, taxa_saida_pct: n(r.visualizacoes) ? Math.round(n(r.saidas) / n(r.visualizacoes) * 1000) / 10 : 0 })) }
    }
    const pg = [...params, { name: 'pg', type: 'STRING' as const, value: input.pagina }]
    const [tot] = await q.query<Row>(`WITH ${pv} SELECT COUNT(*)::int AS visualizacoes, COUNT(DISTINCT person)::int AS visitantes, (COUNT(*) FILTER (WHERE ordem = 1))::int AS entradas, (COUNT(*) FILTER (WHERE seguinte IS NULL))::int AS saidas FROM pv WHERE path = @pg`, pg)
    const from = await q.query<Row>(`WITH ${pv} SELECT COALESCE(anterior, '(entrou nesta página)') AS pagina, COUNT(*)::int AS vezes FROM pv WHERE path = @pg GROUP BY 1 ORDER BY vezes DESC LIMIT 10`, pg)
    const to = await q.query<Row>(`WITH ${pv} SELECT COALESCE(seguinte, '(saiu do site)') AS pagina, COUNT(*)::int AS vezes FROM pv WHERE path = @pg GROUP BY 1 ORDER BY vezes DESC LIMIT 10`, pg)
    return { site: p.name, periodo: label(per), pagina: input.pagina, totais: tot ?? {}, vem_de: from, vai_para: to }
  }),
})

const paths = tool({
  name: 'analytics_caminhos', title: 'Caminhos', write: false,
  description: 'O que as pessoas fazem antes ou depois de uma página (comece com /) ou evento, em sequências de 1 a 3 passos dentro da mesma sessão. Páginas aparecem como /caminho, eventos pelo nome.',
  schema: z.object({ ...base(), site_id: siteId(), ...dates(), ponto: z.string().min(1).max(500).describe('Página (ex.: /precos) ou evento (ex.: assinou).'),
    direcao: z.enum(['antes', 'depois']).default('depois').describe('Antes ou depois do ponto.'), passos: z.number().int().min(1).max(3).default(2).describe('Quantos passos.'),
    limite: z.number().int().min(1).max(30).default(15).describe('Quantas sequências.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const per = period(input.de, input.ate), fn = input.direcao === 'depois' ? 'LEAD' : 'LAG'
    const steps = Array.from({ length: input.passos }, (_, i) => `${fn}(passo, ${i + 1}) OVER w AS p${i + 1}`).join(', ')
    const cols = Array.from({ length: input.passos }, (_, i) => `p${i + 1}`)
    const rows = await q.query<Row>(`
      WITH e AS (SELECT session_id, "timestamp", CASE WHEN event = '$pageview' THEN path ELSE event END AS passo FROM analytics.events_people WHERE ${SCOPE} AND session_id IS NOT NULL AND event <> '$pageleave'),
        s AS (SELECT passo, ${steps} FROM e WINDOW w AS (PARTITION BY session_id ORDER BY "timestamp"))
      SELECT ${cols.map(c => `COALESCE(${c}, '(fim)') AS ${c}`).join(', ')}, COUNT(*)::int AS vezes FROM s WHERE passo = @ponto
      GROUP BY ${cols.map((_, i) => i + 1).join(', ')} ORDER BY vezes DESC LIMIT ${input.limite}`, [...scopeParams(p.id, per), { name: 'ponto', type: 'STRING', value: input.ponto }])
    return { site: p.name, periodo: label(per), ponto: input.ponto, direcao: input.direcao,
      caminhos: rows.map(r => ({ sequencia: cols.map(c => String(r[c])), vezes: n(r.vezes) })) }
  }),
})

const retention = tool({
  name: 'analytics_retencao', title: 'Retenção', write: false,
  description: 'Das pessoas que fizeram o evento inicial pela primeira vez em cada semana, quantas voltaram a fazer o evento de retorno nas semanas seguintes (em %).',
  schema: z.object({ ...base(), site_id: siteId(), evento_inicial: event('Evento que coloca a pessoa na coorte. Padrão: página vista.').default('$pageview'),
    evento_retorno: event('Evento que conta como volta. Padrão: página vista.').default('$pageview'), semanas: z.number().int().min(2).max(12).default(8).describe('Quantas semanas olhar.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const per = period(undefined, undefined, input.semanas * 7)
    const wk = `date_trunc('week', "timestamp" AT TIME ZONE '${TZ}')::date`
    const rows = await q.query<Row>(`
      WITH f AS (SELECT person, MIN(${wk}) AS w0 FROM analytics.events_people WHERE ${SCOPE} AND event = @e1 GROUP BY person),
        a AS (SELECT DISTINCT person, ${wk} AS w FROM analytics.events_people WHERE ${SCOPE} AND event = @e2),
        sz AS (SELECT w0, COUNT(*)::int AS tamanho FROM f GROUP BY w0)
      SELECT to_char(f.w0, 'YYYY-MM-DD') AS coorte, ((a.w - f.w0) / 7)::int AS semana, COUNT(DISTINCT a.person)::int AS pessoas, max(sz.tamanho) AS tamanho
      FROM f JOIN a ON a.person = f.person AND a.w >= f.w0 JOIN sz ON sz.w0 = f.w0 GROUP BY 1, 2 ORDER BY 1, 2`,
    [...scopeParams(p.id, per), { name: 'e1', type: 'STRING', value: input.evento_inicial }, { name: 'e2', type: 'STRING', value: input.evento_retorno }])
    const cohorts = new Map<string, { coorte: string; pessoas: number; semanas: number[] }>()
    for (const r of rows) {
      const c = cohorts.get(String(r.coorte)) ?? { coorte: String(r.coorte), pessoas: n(r.tamanho), semanas: [] }
      c.semanas[n(r.semana)] = c.pessoas ? Math.round(n(r.pessoas) / c.pessoas * 1000) / 10 : 0
      cohorts.set(c.coorte, c)
    }
    return { site: p.name, evento_inicial: input.evento_inicial, evento_retorno: input.evento_retorno,
      coortes: [...cohorts.values()].map(c => ({ ...c, semanas: Array.from({ length: c.semanas.length }, (_, i) => c.semanas[i] ?? 0) })),
      leitura: 'semanas[0] é a semana de entrada (100%); semanas[1] é o % que voltou na semana seguinte, e assim por diante.' }
  }),
})

const visitor = tool({
  name: 'analytics_visitante', title: 'Linha do tempo de um visitante', write: false,
  description: 'Tudo o que um visitante (id anônimo) ou usuário identificado fez: primeira e última visita, sessões, origem e os eventos mais recentes.',
  schema: z.object({ ...base(), site_id: siteId(), visitante_id: z.string().max(100).optional().describe('Id do visitante (de analytics_eventos_recentes).'),
    usuario_id: z.string().max(200).optional().describe('Id do usuário passado em otto.identify.'), dias: z.number().int().min(1).max(365).default(90).describe('Quantos dias para trás.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    if (!input.visitante_id && !input.usuario_id) throw new PluginError('INVALID_INPUT', 'Informe visitante_id ou usuario_id.', 422)
    const per = period(undefined, undefined, input.dias)
    const who = input.usuario_id ? '(user_id = @who OR person = @who)' : '(distinct_id = @who OR person = @who)'
    const params = [...scopeParams(p.id, per), { name: 'who', type: 'STRING' as const, value: input.usuario_id ?? input.visitante_id! }]
    const [sum] = await q.query<Row>(`SELECT ${iso('MIN("timestamp")')} AS primeira_visita, ${iso('MAX("timestamp")')} AS ultima_visita,
        COUNT(DISTINCT session_id)::int AS sessoes, COUNT(*)::int AS eventos, max(country) AS pais, max(device) AS aparelho,
        (array_agg(COALESCE(utm_source, referrer_host, '(direto)') ORDER BY "timestamp"))[1] AS primeira_origem FROM analytics.events_people WHERE ${SCOPE} AND ${who}`, params)
    const events = await q.query<Row>(`SELECT ${iso('"timestamp"')} AS quando, event AS evento, path AS pagina, session_id AS sessao, properties::text AS propriedades
        FROM analytics.events_people WHERE ${SCOPE} AND ${who} ORDER BY "timestamp" DESC LIMIT 200`, params)
    if (!n(sum?.eventos)) return { site: p.name, encontrado: false }
    return { site: p.name, encontrado: true, resumo: sum, eventos: events.map(e => ({ ...e, propriedades: e.propriedades && e.propriedades !== 'null' ? JSON.parse(String(e.propriedades)) : undefined })) }
  }),
})

const recent = tool({
  name: 'analytics_eventos_recentes', title: 'Eventos recentes', write: false,
  description: 'Os últimos eventos que chegaram, com filtro por evento ou página. Útil para conferir se o rastreio está funcionando.',
  schema: z.object({ ...base(), site_id: siteId(), evento: event('Só este evento.').optional(), pagina: z.string().max(500).optional().describe('Só nesta página (caminho).'),
    horas: z.number().int().min(1).max(72).default(24).describe('Últimas quantas horas.'), limite: z.number().int().min(1).max(200).default(50).describe('Quantos eventos.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const per = { de: new Date(Date.now() - input.horas * 3600000), ate: new Date(Date.now() + 60000) }
    const rows = await q.query<Row>(`SELECT ${iso('"timestamp"')} AS quando, event AS evento, path AS pagina, distinct_id AS visitante, user_id AS usuario,
      country AS pais, device AS aparelho, browser AS navegador, COALESCE(utm_source, referrer_host) AS origem, properties::text AS propriedades
      FROM analytics.events_people WHERE ${SCOPE} AND (@ev = '' OR event = @ev) AND (@pg = '' OR path = @pg) ORDER BY "timestamp" DESC LIMIT ${input.limite}`,
    [...scopeParams(p.id, per), { name: 'ev', type: 'STRING', value: input.evento ?? '' }, { name: 'pg', type: 'STRING', value: input.pagina ?? '' }])
    return { site: p.name, eventos: rows.map(e => ({ ...e, propriedades: e.propriedades && e.propriedades !== 'null' ? JSON.parse(String(e.propriedades)) : undefined })) }
  }),
})

const eventProps = tool({
  name: 'analytics_propriedades_evento', title: 'Propriedades de um evento', write: false,
  description: 'Quais propriedades um evento traz (ex.: plano, valor) e os valores mais comuns, a partir de até 1000 ocorrências recentes. Use antes de dividir ou filtrar por propriedade:<nome>.',
  schema: z.object({ ...base(), site_id: siteId(), evento: event('Evento.'), dias: z.number().int().min(1).max(90).default(7).describe('Quantos dias para trás.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, q) => {
    const per = period(undefined, undefined, input.dias)
    const rows = await q.query<Row>(`SELECT properties::text AS p FROM analytics.events WHERE ${SCOPE} AND event = @ev AND properties IS NOT NULL ORDER BY "timestamp" DESC LIMIT 1000`,
      [...scopeParams(p.id, per), { name: 'ev', type: 'STRING', value: input.evento }])
    const keys = new Map<string, { vezes: number; tipos: Set<string>; valores: Map<string, number> }>()
    for (const r of rows) {
      let obj: Record<string, unknown>
      try { obj = JSON.parse(String(r.p)) } catch { continue }
      if (!obj || typeof obj !== 'object') continue
      for (const [k, v] of Object.entries(obj)) {
        const e = keys.get(k) ?? { vezes: 0, tipos: new Set(), valores: new Map() }
        e.vezes++; e.tipos.add(typeof v)
        const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
        if (s.length <= 100) e.valores.set(s, (e.valores.get(s) ?? 0) + 1)
        keys.set(k, e)
      }
    }
    const [def] = await q.query<{ label: string; description: string }>('SELECT label, description FROM analytics.event_definitions WHERE property_id = @p::uuid AND event = @ev', [{ name: 'p', type: 'STRING', value: p.id }, { name: 'ev', type: 'STRING', value: input.evento }])
    return { site: p.name, evento: input.evento, nome: def?.label || undefined, descricao: def?.description || undefined, amostra: rows.length,
      propriedades: [...keys.entries()].sort((a, b) => b[1].vezes - a[1].vezes).map(([k, e]) => ({ nome: k, presente_em: e.vezes, tipos: [...e.tipos],
        valores_comuns: [...e.valores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([valor, vezes]) => ({ valor, vezes })) })) }
  }),
})

// ====================== B. Configuração e criação ======================

const siteFields = () => ({
  nome: z.string().trim().min(1).max(80).describe('Nome, ex.: Site da loja.'),
  tipo: z.enum(['site', 'app']).default('site').describe('Site ou app.'),
  dominios: z.array(z.string().max(200)).max(20).default([]).describe('Domínios que podem enviar eventos, ex.: ["minhaloja.com.br"]. Subdomínios entram junto. Recomendado informar.'),
  pedir_consentimento: z.boolean().default(false).describe('true: o visitante só é lembrado entre visitas depois de aceitar cookies (otto.consent(true)).'),
})
const createSite = tool({
  name: 'analytics_criar_site', title: 'Cadastrar site ou app', write: true,
  description: 'Cadastra um site ou app para medir e devolve o código para colar antes de </head> em todas as páginas.',
  schema: z.object({ ...base(), ...siteFields() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const [p] = await m.db.query<Property>(`INSERT INTO analytics.properties (workspace_id, name, kind, domains, require_consent) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, kind, domains, public_key, require_consent, created_at`, [m.ws, input.nome, input.tipo, cleanDomains(input.dominios), input.pedir_consentimento])
    return { site: { id: p.id, nome: p.name, dominios: p.domains }, codigo: snippet(ctx, p), onde_colar: 'Antes de </head>, em todas as páginas.', link: `${ctx.origin}/analytics/sites` }
  }),
})

const editSite = tool({
  name: 'analytics_editar_site', title: 'Editar site ou app', write: true,
  description: 'Muda nome, tipo, domínios aceitos ou o pedido de consentimento de um site ou app. Devolve o código atualizado.',
  schema: z.object({ ...base(), site_id: siteId(), nome: z.string().trim().min(1).max(80).optional().describe('Novo nome.'), tipo: z.enum(['site', 'app']).optional().describe('Site ou app.'),
    dominios: z.array(z.string().max(200)).max(20).optional().describe('Lista completa de domínios (substitui a atual).'), pedir_consentimento: z.boolean().optional().describe('Pedir consentimento.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    await needProperty(m, input.site_id)
    const [p] = await m.db.query<Property>(`UPDATE analytics.properties SET name = coalesce($2, name), kind = coalesce($3, kind), domains = coalesce($4, domains),
      require_consent = coalesce($5, require_consent) WHERE id = $1 RETURNING id, name, kind, domains, public_key, require_consent, created_at`,
    [input.site_id, input.nome ?? null, input.tipo ?? null, input.dominios ? cleanDomains(input.dominios) : null, input.pedir_consentimento ?? null])
    return { site: { id: p.id, nome: p.name, tipo: p.kind, dominios: p.domains, pede_consentimento: p.require_consent }, codigo: snippet(ctx, p) }
  }),
})

const verify = tool({
  name: 'analytics_verificar_instalacao', title: 'Verificar instalação', write: false,
  description: 'Confere se o site está mandando eventos: quando chegou o último, quantos nas últimas 24 horas e de quais endereços, e aponta o que fazer se nada chegou.',
  schema: z.object({ ...base(), site_id: siteId() }).strict(),
  run: async (input, ctx) => {
    const per = { de: new Date(Date.now() - 86400000), ate: new Date(Date.now() + 60000) }
    const { p, r } = await withProperty(ctx, input.site_id, async (p, q) => ({ p, r: (await q.query<Row>(`SELECT COUNT(*)::int AS eventos, (COUNT(*) FILTER (WHERE event = '$pageview'))::int AS paginas_vistas, ${iso('MAX("timestamp")')} AS ultimo,
      array_to_string((array_agg(DISTINCT host) FILTER (WHERE host IS NOT NULL))[1:10], ', ') AS enderecos FROM analytics.events WHERE ${SCOPE}`, scopeParams(p.id, per)))[0] }))
    const ok = n(r?.eventos) > 0
    return { site: p.name, funcionando: ok, eventos_24h: n(r?.eventos), paginas_vistas_24h: n(r?.paginas_vistas), ultimo_evento: r?.ultimo ?? undefined, enderecos: r?.enderecos || undefined,
      codigo: snippet(ctx, p), proximos_passos: ok ? undefined : [
        'Confira se o código está antes de </head> em todas as páginas e se o site foi publicado depois de colar.',
        p.domains.length ? `Os eventos só são aceitos de ${p.domains.join(', ')} (e subdomínios). Se o site usa outro endereço, inclua com analytics_editar_site.` : 'Sem domínios cadastrados, qualquer site com a chave é aceito.',
        'Bloqueadores de anúncio e a opção "não rastrear" do navegador impedem o envio: teste numa janela anônima sem extensões.',
        'Depois de abrir o site, rode esta verificação de novo: os eventos chegam em poucos segundos.'] }
  },
})

const codeFor = tool({
  name: 'analytics_gerar_codigo_eventos', title: 'Gerar código de eventos', write: false,
  description: 'Gera o JavaScript para rastrear ações do site (clique num botão, envio de formulário, abertura de uma página ou chamada manual) com otto.track, pronto para colar depois do código de instalação.',
  schema: z.object({ ...base(), acoes: z.array(z.object({
    evento: event('Nome do evento, em minúsculas e sem espaços, ex.: clicou_comprar.'),
    quando: z.enum(['clique', 'envio_formulario', 'abrir_pagina', 'manual']).describe('O que dispara o evento.'),
    seletor: z.string().max(200).optional().describe('Clique e formulário: seletor CSS do elemento, ex.: #comprar, .btn-assinar, form#contato.'),
    pagina: z.string().max(500).optional().describe('Abrir página: o caminho, ex.: /obrigado.'),
    propriedades: z.record(z.union([z.string().max(200), z.number(), z.boolean()])).optional().describe('Propriedades fixas enviadas junto, ex.: { "plano": "pro" }.'),
  }).strict()).min(1).max(20).describe('As ações a rastrear.') }).strict(),
  run: async input => {
    const lines = input.acoes.map(a => {
      const props = a.propriedades ? `, ${JSON.stringify(a.propriedades)}` : ''
      const call = `otto.track(${JSON.stringify(a.evento)}${props})`
      if (a.quando === 'manual') return `// ${a.evento}: chame no ponto certo do seu código\n${call}`
      if (a.quando === 'abrir_pagina') {
        if (!a.pagina) throw new PluginError('INVALID_INPUT', `Informe a página de ${a.evento}.`, 422)
        return `// ${a.evento}: ao abrir ${a.pagina}\nif (location.pathname === ${JSON.stringify(a.pagina)}) ${call}`
      }
      if (!a.seletor) throw new PluginError('INVALID_INPUT', `Informe o seletor de ${a.evento}.`, 422)
      const type = a.quando === 'clique' ? 'click' : 'submit'
      return `// ${a.evento}: ${a.quando === 'clique' ? 'clique em' : 'envio de'} ${a.seletor}\ndocument.addEventListener(${JSON.stringify(type)}, function (e) {\n  if (e.target instanceof Element && e.target.closest(${JSON.stringify(a.seletor)})) ${call}\n}, true)`
    })
    return { codigo: `<script>\nwindow.otto = window.otto || [];\nwindow.addEventListener('load', function () {\n${lines.join('\n\n').split('\n').map(l => '  ' + l).join('\n')}\n})\n</script>`,
      onde_colar: 'Depois do código de instalação do otto.js, antes de </body>.', dica: 'Use analytics_definir_evento para dar um nome amigável a cada evento novo.' }
  },
})

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const campaignLink = tool({
  name: 'analytics_criar_link_campanha', title: 'Criar link de campanha', write: false,
  description: 'Monta o link com UTM para anúncios, posts e e-mails, no padrão que os painéis entendem (minúsculas, sem acentos, com hífens).',
  schema: z.object({ ...base(), url: z.string().url().max(2000).describe('Página de destino.'), fonte: z.string().min(1).max(60).describe('De onde vem: instagram, google, newsletter…'),
    meio: z.string().min(1).max(60).describe('Tipo: social, cpc (anúncio pago), email, organico…'), campanha: z.string().min(1).max(100).describe('Nome da campanha, ex.: Natal 2026.'),
    conteudo: z.string().max(100).optional().describe('Variação do anúncio ou post, ex.: video-a.'), termo: z.string().max(100).optional().describe('Palavra-chave (anúncios de busca).') }).strict(),
  run: async input => {
    const url = new URL(input.url)
    const set = (k: string, v?: string) => { if (v && slug(v)) url.searchParams.set(k, slug(v)) }
    set('utm_source', input.fonte); set('utm_medium', input.meio); set('utm_campaign', input.campanha); set('utm_content', input.conteudo); set('utm_term', input.termo)
    return { link: url.toString(), campanha: slug(input.campanha), como_aparece: `Nos painéis: origem ${slug(input.fonte)}, campanha ${slug(input.campanha)}.` }
  },
})

const defineEvent = tool({
  name: 'analytics_definir_evento', title: 'Definir evento', write: true,
  description: 'Dá um nome amigável e uma descrição a um evento (ex.: assinou = "Cliente pagou o plano"), usados nos rankings e para o assistente entender o que cada evento significa.',
  schema: z.object({ ...base(), site_id: siteId(), evento: event('Nome técnico do evento.'), nome: z.string().trim().max(120).default('').describe('Nome amigável.'),
    descricao: z.string().max(1000).default('').describe('O que significa e quando acontece.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    await needProperty(m, input.site_id)
    await m.db.query(`INSERT INTO analytics.event_definitions (workspace_id, property_id, event, label, description) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (property_id, event) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description`, [m.ws, input.site_id, input.evento, input.nome, input.descricao])
    return { definido: true, evento: input.evento, nome: input.nome || undefined }
  }),
})

const goalFields = () => ({
  nome: z.string().trim().min(1).max(120).describe('Nome da meta, ex.: Assinatura.'),
  evento: event('Evento que conta como conversão. Para uma página de obrigado, use $pageview e informe pagina.'),
  pagina: z.string().max(500).optional().describe('Com $pageview: a página, ex.: /obrigado.'),
})
const createGoal = tool({
  name: 'analytics_criar_meta', title: 'Criar meta', write: true,
  description: 'Cria uma meta (conversão acompanhada), como "Assinatura" = evento assinou ou "Contato" = página /obrigado. Use o id em analytics_campanhas para ver a conversão por campanha.',
  schema: z.object({ ...base(), site_id: siteId(), ...goalFields() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    await needProperty(m, input.site_id)
    if (input.evento === '$pageview' && !input.pagina) throw new PluginError('INVALID_INPUT', 'Com $pageview, informe a página da meta.', 422)
    const [g] = await m.db.query<{ id: string }>('INSERT INTO analytics.goals (workspace_id, property_id, name, event, path) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [m.ws, input.site_id, input.nome, input.evento, input.pagina ?? null])
    return { meta: { id: g.id, nome: input.nome, evento: input.evento, pagina: input.pagina } }
  }),
})

const editGoal = tool({
  name: 'analytics_editar_meta', title: 'Editar ou excluir meta', write: true,
  description: 'Lista as metas de um site (sem meta_id), muda uma meta, ou a exclui (excluir: true, com confirmado: true depois de a pessoa confirmar).',
  schema: z.object({ ...base(), site_id: siteId(), meta_id: uuid('Meta a mudar ou excluir.').optional(), nome: z.string().trim().min(1).max(120).optional().describe('Novo nome.'),
    evento: event('Novo evento.').optional(), pagina: z.string().max(500).nullable().optional().describe('Nova página; null tira.'),
    excluir: z.boolean().optional().describe('true para excluir a meta.'), confirmado: confirmed().optional() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    await needProperty(m, input.site_id)
    if (!input.meta_id) return { metas: (await m.db.query<{ id: string; name: string; event: string; path: string | null }>('SELECT id, name, event, path FROM analytics.goals WHERE property_id = $1 ORDER BY created_at', [input.site_id]))
      .map(g => ({ id: g.id, nome: g.name, evento: g.event, pagina: g.path ?? undefined })) }
    if (input.excluir) {
      if (!input.confirmado) throw new PluginError('CONFIRMATION_REQUIRED', 'Confirme com a pessoa e chame de novo com confirmado: true.', 409)
      const r = await m.db.query('DELETE FROM analytics.goals WHERE id = $1 AND property_id = $2 RETURNING id', [input.meta_id, input.site_id])
      if (!r.length) throw new PluginError('NOT_FOUND', 'Meta não encontrada.', 404)
      return { excluida: true }
    }
    const [g] = await m.db.query<{ id: string; name: string; event: string; path: string | null }>(`UPDATE analytics.goals SET name = coalesce($3, name), event = coalesce($4, event),
      path = CASE WHEN $6 THEN $5 ELSE path END WHERE id = $1 AND property_id = $2 RETURNING id, name, event, path`,
    [input.meta_id, input.site_id, input.nome ?? null, input.evento ?? null, input.pagina ?? null, input.pagina !== undefined])
    if (!g) throw new PluginError('NOT_FOUND', 'Meta não encontrada.', 404)
    return { meta: { id: g.id, nome: g.name, evento: g.event, pagina: g.path ?? undefined } }
  }),
})

const funnel = tool({
  name: 'analytics_funil', title: 'Funil de conversão', write: false,
  description: 'Quantas pessoas passam por cada passo, em ordem e dentro da janela (ex.: viu /precos → clicou em assinar → assinou), com a conversão de cada passo, o tempo mediano entre passos e, opcionalmente, quebrado por um campo.',
  schema: z.object({ ...base(), site_id: siteId(), ...dates(),
    passos: z.array(z.object({ evento: event('Evento do passo, ex.: $pageview, assinou.'), pagina: z.string().max(500).optional().describe('Só nesta página (caminho), ex.: /precos.') }).strict()).min(2).max(10).describe('Os passos, em ordem.'),
    janela_dias: z.number().int().min(1).max(90).default(7).describe('Prazo para completar o funil, em dias.'),
    dividir_por: z.enum(['origem', 'aparelho', 'navegador', 'pais', 'utm_campaign', 'utm_source', 'pagina']).optional().describe('Campo para quebrar o resultado.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, _q, db) => {
    const per = period(input.de, input.ate)
    const r = await rodarFunil(db, { tipo: 'funil', de: per.de.toISOString(), ate: per.ate.toISOString(), janela_dias: input.janela_dias, quebra: input.dividir_por, filtros: [],
      passos: input.passos.map(x => ({ evento: x.evento, filtros: x.pagina ? [{ campo: 'pagina', op: 'igual' as const, valor: x.pagina }] : [] })) }, p.id)
    return { site: p.name, periodo: label(per), passos: r.passos, quebras: r.quebras.length ? r.quebras : undefined, link: `${ctx.origin}/analytics/insights/novo` }
  }),
})

const insights = tool({
  name: 'analytics_insights', title: 'Insights e painéis salvos', write: false,
  description: 'Sem insight_id: os insights (gráficos, funis, retenção, caminhos) e painéis salvos no site. Com insight_id: roda o insight nos últimos `dias` dias e devolve o resultado.',
  schema: z.object({ ...base(), site_id: siteId(), insight_id: uuid('Insight a rodar (da lista).').optional(), dias: z.number().int().min(1).max(400).optional().describe('Período, em dias até hoje. Padrão: o do insight.') }).strict(),
  run: (input, ctx) => withProperty(ctx, input.site_id, async (p, _q, db) => {
    const m = { db }
    if (!input.insight_id) {
      const lista = await m.db.query<{ id: string; name: string; query: { tipo: string } }>('SELECT id, name, query FROM analytics.insights WHERE property_id = $1 ORDER BY updated_at DESC LIMIT 100', [p.id])
      const paineis = await m.db.query<{ id: string; name: string; items: { insight_id: string }[] }>('SELECT id, name, items FROM analytics.dashboards WHERE property_id = $1 ORDER BY created_at', [p.id])
      return { site: p.name, insights: lista.map(i => ({ id: i.id, nome: i.name, tipo: i.query.tipo, link: `${ctx.origin}/analytics/insights/${i.id}` })),
        paineis: paineis.map(d => ({ id: d.id, nome: d.name, insights: d.items.map(x => x.insight_id), link: `${ctx.origin}/analytics/paineis/${d.id}` })) }
    }
    const [i] = await m.db.query<{ name: string; query: unknown }>('SELECT name, query FROM analytics.insights WHERE id = $1 AND property_id = $2', [input.insight_id, p.id])
    if (!i) throw new PluginError('NOT_FOUND', 'Insight não encontrado neste site.', 404)
    const c = consultaSchema.parse(i.query)
    const dias = input.dias ?? Math.max(1, Math.round((new Date(c.ate).getTime() - new Date(c.de).getTime()) / 86400000))
    const per = period(undefined, undefined, dias)
    return { site: p.name, insight: i.name, periodo: label(per), resultado: await executar(m.db, { ...c, de: per.de.toISOString(), ate: per.ate.toISOString() }, p.id), link: `${ctx.origin}/analytics/insights/${input.insight_id}` }
  }),
})

export const analyticsTools: WorkspaceTool[] = [
  listSites, summary, trend, compare, ranking, campaigns, pages, paths, retention, visitor, recent, eventProps, funnel, insights,
  createSite, editSite, verify, codeFor, campaignLink, defineEvent, createGoal, editGoal,
]

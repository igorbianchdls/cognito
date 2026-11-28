// Salvar o que se monta no Analytics: sites e apps, insights, painéis, coortes, flags e experimentos. Uma tabela por
// recurso, campos permitidos e validação de cada um; roda como a pessoa (quem só visualiza não altera, outra empresa
// não vê). A empresa vem do contexto e o site precisa ser dela.
import { z } from 'zod'
import { consulta, definicaoCoorte } from '../shared/consulta'
import { AnalyticsError, type Contexto, type Db } from './pg'

const regraFlag = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('campo'), campo: z.enum(['pais', 'aparelho', 'navegador', 'sistema', 'idioma', 'pagina']), op: z.enum(['igual', 'diferente', 'contem']), valor: z.string().max(200) }).strict(),
  z.object({ tipo: z.literal('coorte'), coorte_id: z.string().uuid() }).strict(),
  z.object({ tipo: z.literal('identificado'), valor: z.boolean() }).strict(),
])
const variantes = z.array(z.object({ key: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,31}$/), peso: z.number().int().min(0).max(100) }).strict()).min(2).max(6)
  .refine(v => v.reduce((a, b) => a + b.peso, 0) === 100, 'Os pesos das variantes precisam somar 100.')

type Recurso = { tabela: string; colunas: string; doSite: boolean; criar: z.AnyZodObject; ordem: string }
const RECURSOS: Record<string, Recurso> = {
  sites: {
    tabela: 'properties', doSite: false, ordem: 'created_at',
    colunas: 'id, name, kind, domains, public_key, require_consent, autocapture, replay_sample, replay_mask_text, created_at',
    criar: z.object({ name: z.string().trim().min(1).max(80), kind: z.enum(['site', 'app']).default('site'), domains: z.array(z.string().max(253)).max(20).default([]),
      require_consent: z.boolean().default(false), autocapture: z.boolean().default(true), replay_sample: z.number().int().min(0).max(100).default(0), replay_mask_text: z.boolean().default(true) }).strict(),
  },
  insights: {
    tabela: 'insights', doSite: true, ordem: 'updated_at DESC',
    colunas: 'id, property_id, name, description, query, view, created_by, created_at, updated_at',
    criar: z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(1000).default(''), query: consulta, view: z.enum(['linha', 'barras', 'numero', 'tabela', 'area']).default('linha') }).strict(),
  },
  paineis: {
    tabela: 'dashboards', doSite: true, ordem: 'created_at',
    colunas: 'id, property_id, name, items, created_at, updated_at',
    criar: z.object({ name: z.string().trim().min(1).max(120), items: z.array(z.object({ insight_id: z.string().uuid(), largura: z.union([z.literal(1), z.literal(2)]).default(1) }).strict()).max(40).default([]) }).strict(),
  },
  coortes: {
    tabela: 'cohorts', doSite: true, ordem: 'created_at',
    colunas: 'id, property_id, name, description, rules, created_at, updated_at',
    criar: z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(1000).default(''), rules: definicaoCoorte }).strict(),
  },
  flags: {
    tabela: 'flags', doSite: true, ordem: 'created_at',
    colunas: 'id, property_id, key, name, description, enabled, rollout, rules, variants, created_at, updated_at',
    criar: z.object({ key: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/, 'Chave: letras minúsculas, números, - e _.'), name: z.string().max(120).default(''), description: z.string().max(2000).default(''),
      enabled: z.boolean().default(false), rollout: z.number().int().min(0).max(100).default(100), rules: z.array(regraFlag).max(10).default([]), variants: variantes.nullable().default(null) }).strict(),
  },
  experimentos: {
    tabela: 'experiments', doSite: true, ordem: 'created_at DESC',
    colunas: 'id, property_id, flag_id, name, hypothesis, goal_event, status, started_at, ended_at, winner, created_at, updated_at',
    criar: z.object({ name: z.string().trim().min(1).max(120), hypothesis: z.string().max(2000).default(''), goal_event: z.string().min(1).max(120), flag_id: z.string().uuid(),
      status: z.enum(['rascunho', 'rodando', 'encerrado']).default('rascunho'), started_at: z.string().datetime({ offset: true }).nullable().optional(),
      ended_at: z.string().datetime({ offset: true }).nullable().optional(), winner: z.string().max(32).nullable().optional() }).strict(),
  },
}

export function recurso(nome: string) {
  const r = RECURSOS[nome]
  if (!r) throw new AnalyticsError('Recurso desconhecido.', 404)
  return r
}

const jsonb = new Set(['query', 'items', 'rules', 'variants'])
const valor = (k: string, v: unknown) => jsonb.has(k) && v !== null ? JSON.stringify(v) : v

export async function listar(db: Db, nome: string, propriedade?: string | null) {
  const r = recurso(nome)
  if (r.doSite && !/^[0-9a-f-]{36}$/i.test(propriedade ?? '')) throw new AnalyticsError('Escolha o site.')
  return db.query(`SELECT ${r.colunas} FROM analytics.${r.tabela} ${r.doSite ? 'WHERE property_id = $1' : ''} ORDER BY ${r.ordem} LIMIT 500`, r.doSite ? [propriedade] : [])
}

export async function ler(db: Db, nome: string, id: string) {
  const r = recurso(nome)
  const [linha] = await db.query(`SELECT ${r.colunas} FROM analytics.${r.tabela} WHERE id = $1`, [id])
  if (!linha) throw new AnalyticsError('Não encontrado.', 404)
  return linha
}

export async function criar(db: Db, ctx: Contexto, nome: string, corpo: Record<string, unknown>) {
  const r = recurso(nome)
  const dados = r.criar.parse(Object.fromEntries(Object.entries(corpo).filter(([k]) => k !== 'property_id')))
  const campos: Record<string, unknown> = { ...dados, workspace_id: ctx.orgId }
  if (r.doSite) {
    const site = String(corpo.property_id ?? '')
    if (!/^[0-9a-f-]{36}$/i.test(site)) throw new AnalyticsError('Escolha o site.')
    const [p] = await db.query('SELECT id FROM analytics.properties WHERE id = $1 AND workspace_id = $2', [site, ctx.orgId])
    if (!p) throw new AnalyticsError('Site não encontrado nesta empresa.', 404)
    campos.property_id = site
  }
  const chaves = Object.keys(campos)
  const [linha] = await db.query(`INSERT INTO analytics.${r.tabela} (${chaves.join(', ')}) VALUES (${chaves.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING ${r.colunas}`,
    chaves.map(k => valor(k, campos[k])))
  return linha
}

export async function alterar(db: Db, nome: string, id: string, corpo: Record<string, unknown>) {
  const r = recurso(nome)
  const dados = r.criar.partial().parse(corpo) as Record<string, unknown>
  const chaves = Object.keys(dados).filter(k => dados[k] !== undefined)
  if (!chaves.length) return ler(db, nome, id)
  const [linha] = await db.query(`UPDATE analytics.${r.tabela} SET ${chaves.map((k, i) => `${k} = $${i + 2}`).join(', ')} WHERE id = $1 RETURNING ${r.colunas}`,
    [id, ...chaves.map(k => valor(k, dados[k]))])
  if (!linha) throw new AnalyticsError('Não encontrado (ou seu perfil só pode visualizar).', 404)
  return linha
}

export async function apagar(db: Db, nome: string, id: string) {
  const r = recurso(nome)
  const linhas = await db.query(`DELETE FROM analytics.${r.tabela} WHERE id = $1 RETURNING id`, [id])
  if (!linhas.length) throw new AnalyticsError('Não encontrado (ou seu perfil só pode visualizar).', 404)
  return { ok: true }
}

import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono'

// "Classificação de despesas com agentes": the accounts payable screen of the ERP, where six AI agents classify the
// month's 48 unclassified expenses live. Each row starts as "sem categoria"; an agent's cursor goes to it, the row
// shows who is analysing it, and the category chip and the DRE group fill in. On the right, the expense in focus is
// analysed step by step (signals found, candidate categories with confidence, the one applied), the DRE of the month
// builds up group by group and the agents' log scrolls. The reviewer flags one possible duplicate for a human.
// 1920×1080, 30 fps. All suppliers, descriptions and values are made up.

export const EXPENSE_SWARM_DURATION = 480
export const EXPENSE_SWARM_WIDTH = 1920
export const EXPENSE_SWARM_HEIGHT = 1080

const opts = { subsets: ['latin'] as ['latin'] }
const MONO = loadMono('normal', { ...opts, weights: ['400', '700'] }).fontFamily
const UI = loadInter('normal', { ...opts, weights: ['400', '500', '600', '700', '800'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })

const BG = '#07090f', PANEL = '#0d1119', LINE = '#1c2230', TXT = '#c9d1e3', DIM = '#6b7486'
const LIME = '#c6f432', GREEN = '#3ddc84', ORANGE = '#ff8a3d', YELLOW = '#f5c542', PURPLE = '#a78bfa', BLUE = '#4f8cff', PINK = '#ff5fa2', CYAN = '#38d6f5', AMBER = '#ffb020'

const mono = (size: number, color = DIM, extra?: CSSProperties): CSSProperties => ({ fontFamily: MONO, fontSize: size, color, letterSpacing: 0.3, whiteSpace: 'nowrap', ...extra })
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const agents = [
  { id: 'leitor', name: 'leitor-01', color: BLUE },
  { id: 'fornecedores', name: 'fornecedores-01', color: CYAN },
  { id: 'recorrentes', name: 'recorrentes-01', color: GREEN },
  { id: 'impostos', name: 'impostos-01', color: ORANGE },
  { id: 'folha', name: 'folha-01', color: PURPLE },
  { id: 'revisor', name: 'revisor', color: '#f4f4f5' },
] as const
type AgentId = (typeof agents)[number]['id']
const agentIndex = (id: AgentId) => agents.findIndex(a => a.id === id)
const agentOf = (id: AgentId) => agents[agentIndex(id)]

// ---------- DRE groups and the month's expenses (made up) ----------

const GROUPS = {
  cst: { label: 'Custos dos serviços', color: CYAN },
  adm: { label: 'Despesas administrativas', color: BLUE },
  pes: { label: 'Despesas com pessoal', color: PURPLE },
  com: { label: 'Despesas comerciais', color: PINK },
  imp: { label: 'Impostos sobre vendas', color: ORANGE },
  fin: { label: 'Despesas financeiras', color: YELLOW },
} as const
type GroupId = keyof typeof GROUPS
const GROUP_ORDER: GroupId[] = ['cst', 'adm', 'pes', 'com', 'imp', 'fin']

type Template = { supplier: string; raw: string; cat: string; group: GroupId; agent: AgentId; base: number; hint: string; alts: [string, string] }
const TEMPLATES: Template[] = [
  { supplier: 'Enel Distribuição SP', raw: 'ENEL DISTRIB SP*FAT1026', cat: 'Energia elétrica', group: 'adm', agent: 'recorrentes', base: 1480, hint: '“FAT” = fatura mensal de energia', alts: ['Água e esgoto', 'Manutenção predial'] },
  { supplier: 'Folha de pagamento', raw: 'FOLHA PGTO OUT/26', cat: 'Salários', group: 'pes', agent: 'folha', base: 38400, hint: 'lote de 14 transferências para a equipe', alts: ['Pró-labore', 'Serviços de terceiros'] },
  { supplier: 'Google Cloud Brasil', raw: 'GOOGLE *WORKSPACE 12LIC', cat: 'Software e assinaturas', group: 'adm', agent: 'fornecedores', base: 1032, hint: '12 licenças × mesmo valor de outubro', alts: ['Infraestrutura cloud', 'Marketing e anúncios'] },
  { supplier: 'Receita Federal', raw: 'DAS SIMPLES NAC 10/2026', cat: 'DAS · Simples Nacional', group: 'imp', agent: 'impostos', base: 9860, hint: 'guia DAS sobre o faturamento de outubro', alts: ['IRPJ', 'Multas e juros'] },
  { supplier: 'Meta Platforms', raw: 'FACEBK *ADS 8HJ2KQ', cat: 'Marketing e anúncios', group: 'com', agent: 'fornecedores', base: 6200, hint: 'cobrança da conta de anúncios da empresa', alts: ['Software e assinaturas', 'Serviços de terceiros'] },
  { supplier: 'Imobiliária Lar', raw: 'BOLETO IMOB LAR ALUG 304', cat: 'Aluguel', group: 'adm', agent: 'recorrentes', base: 7800, hint: 'contrato de aluguel · sala 304', alts: ['Condomínio', 'IPTU'] },
  { supplier: 'Caixa · FGTS', raw: 'GRF FGTS COMPET 10/26', cat: 'Encargos · FGTS', group: 'pes', agent: 'folha', base: 3072, hint: '8% sobre a folha de outubro', alts: ['Salários', 'DAS · Simples Nacional'] },
  { supplier: 'Kalunga', raw: 'KALUNGA LJ 112 SP', cat: 'Material de escritório', group: 'adm', agent: 'leitor', base: 486, hint: 'nota fiscal: papel A4, toner, pastas', alts: ['Material de limpeza', 'Equipamentos'] },
  { supplier: 'Amazon Web Services', raw: 'AWS EMEA *HOSTING', cat: 'Infraestrutura cloud', group: 'cst', agent: 'fornecedores', base: 4380, hint: 'servidores do produto · uso de outubro', alts: ['Software e assinaturas', 'Internet e telefone'] },
  { supplier: 'Vivo Empresas', raw: 'VIVO EMPRESAS FIBRA 500', cat: 'Internet e telefone', group: 'adm', agent: 'recorrentes', base: 389, hint: 'plano fibra 500 MB · mensal', alts: ['Software e assinaturas', 'Energia elétrica'] },
  { supplier: 'Prefeitura de São Paulo', raw: 'ISS RETIDO PMSP 10/26', cat: 'ISS', group: 'imp', agent: 'impostos', base: 2140, hint: 'ISS retido nas notas de outubro', alts: ['IPTU', 'Taxas e licenças'] },
  { supplier: 'Unimed', raw: 'UNIMED PJ CONTR 7781', cat: 'Benefícios · plano de saúde', group: 'pes', agent: 'folha', base: 5460, hint: 'plano coletivo · 14 vidas', alts: ['Seguros', 'Serviços de terceiros'] },
  { supplier: 'Banco Inter', raw: 'TAR TED 0001 CC 88412', cat: 'Tarifas bancárias', group: 'fin', agent: 'leitor', base: 18, hint: 'tarifa cobrada pelo próprio banco', alts: ['Juros', 'Software e assinaturas'] },
  { supplier: 'Alfa Contabilidade', raw: 'PIX ALFA CONTAB HONOR', cat: 'Serviços contábeis', group: 'adm', agent: 'fornecedores', base: 1890, hint: 'contrato mensal de honorários', alts: ['Serviços de terceiros', 'Consultoria'] },
  { supplier: 'Uber do Brasil', raw: 'UBER *TRIP EMPRESA', cat: 'Viagens e deslocamento', group: 'com', agent: 'leitor', base: 64, hint: 'corrida: escritório → cliente Atlas', alts: ['Combustível', 'Alimentação'] },
  { supplier: 'Ana Lima Design', raw: 'PIX ANA LIMA DESIGN LP', cat: 'Serviços de terceiros', group: 'cst', agent: 'fornecedores', base: 2400, hint: 'nota de serviço: design de landing page', alts: ['Marketing e anúncios', 'Salários'] },
  { supplier: 'iFood Benefícios', raw: 'IFOOD BENEF VR 11/26', cat: 'Benefícios · vale-refeição', group: 'pes', agent: 'folha', base: 4620, hint: 'crédito de VR · 14 colaboradores', alts: ['Alimentação', 'Marketing e anúncios'] },
  { supplier: 'Itaú Unibanco', raw: 'JUROS LIM CHEQUE ESP', cat: 'Juros', group: 'fin', agent: 'leitor', base: 212, hint: 'juros do limite usado em 3 dias', alts: ['Tarifas bancárias', 'Multas e juros'] },
  { supplier: 'RD Station', raw: 'RDSTATION *CRM PRO', cat: 'Software e assinaturas', group: 'com', agent: 'fornecedores', base: 990, hint: 'CRM do time comercial', alts: ['Marketing e anúncios', 'Serviços de terceiros'] },
  { supplier: 'Sabesp', raw: 'SABESP CONTA 10/26 RGI', cat: 'Água e esgoto', group: 'adm', agent: 'recorrentes', base: 236, hint: 'conta de água do escritório', alts: ['Energia elétrica', 'Condomínio'] },
  { supplier: 'Correios', raw: 'CORREIOS SEDEX AG 0412', cat: 'Correios e fretes', group: 'com', agent: 'leitor', base: 92, hint: 'envio de contrato assinado', alts: ['Material de escritório', 'Viagens e deslocamento'] },
  { supplier: 'Posto Shell', raw: 'POSTO SHELL 0412 COMB', cat: 'Combustível', group: 'com', agent: 'leitor', base: 280, hint: 'abastecimento · visita a cliente', alts: ['Viagens e deslocamento', 'Manutenção de veículos'] },
]
const TOTAL = 48
const DUP = 31 // a second Kalunga charge with the same value: the reviewer flags it for a human
const expenses = Array.from({ length: TOTAL }, (_, i) => {
  const t = i === DUP ? TEMPLATES[7] : TEMPLATES[(i * 7 + 3) % TEMPLATES.length]
  const value = i === DUP ? 486 : Math.round(t.base * (0.85 + random('v' + i) * 0.3) * 100) / 100
  const day = 1 + Math.floor(random('d' + i) * 28)
  const conf = 0.86 + random('c' + i) * 0.13
  return { ...t, value, due: `${String(day).padStart(2, '0')}/11`, conf, hist: 3 + Math.floor(random('h' + i) * 14) }
})

const START = 40, END = 400
const doneF = (f: number) => interpolate(f, [START, END], [0, TOTAL], { ...clamp, easing: Easing.inOut(Easing.quad) })
/** How many expenses are classified at frame f (rows are classified in order). */
const classifiedAt = (f: number) => Math.floor(doneF(f))
const frameOf = (k: number) => { // first frame when k expenses are classified
  for (let f = START; f <= END; f++) if (classifiedAt(f) >= k) return f
  return END
}
const DUP_AT = frameOf(DUP + 1) + 26
const IN_FLIGHT = 5 // rows being analysed at the same time ahead of the classified ones

// ---------- layout ----------

const TOP = 40
type Box = { x: number; y: number; w: number; h: number }
const KPI: Box = { x: 10, y: TOP + 8, w: 1900, h: 92 }
const TABLE: Box = { x: 10, y: 148, w: 1160, h: 896 }
const FOCUS: Box = { x: 1180, y: 148, w: 730, h: 330 }
const DRE: Box = { x: 1180, y: 486, w: 730, h: 286 }
const LOG: Box = { x: 1180, y: 780, w: 730, h: 264 }
const ROW = 38, VISIBLE = 19
const ROWS_TOP = TABLE.y + 26 + 44 + 30 // panel title + toolbar + header
const COLS = { check: 26, due: 66, supplier: 176, value: 112, cat: 214, group: 196, status: 128 }
const DESC_W = TABLE.w - 28 - Object.values(COLS).reduce((s, w) => s + w, 0)
const COL_X = (() => { // x of each column inside the table (absolute)
  let x = TABLE.x + 14
  const out: Record<string, number> = {}
  for (const [k, w] of [['check', COLS.check], ['due', COLS.due], ['supplier', COLS.supplier], ['desc', DESC_W], ['value', COLS.value], ['cat', COLS.cat], ['group', COLS.group], ['status', COLS.status]] as const) { out[k] = x; x += w }
  return out
})()
/** Rows scrolled out at the top (continuous, so the list glides). */
const scrollAt = (f: number) => Math.max(0, Math.min(TOTAL - VISIBLE, doneF(f) - 6))
const rowCenterY = (i: number, f: number) => ROWS_TOP + (i - scrollAt(f)) * ROW + ROW / 2

// ---------- cursors ----------

type Stop = { f: number; x: number; y: number; row?: number }
function routeFor(a: number): Stop[] {
  const id = agents[a].id
  const stops: Stop[] = []
  if (id === 'revisor') {
    for (let f = START + 30, i = 0; f < EXPENSE_SWARM_DURATION; i++) {
      const n = classifiedAt(f)
      if (f >= DUP_AT - 14 && f < DUP_AT + 30 && !stops.some(s => s.row === DUP)) { stops.push({ f: DUP_AT - 6, x: COL_X.status + 40, y: 0, row: DUP }); f = DUP_AT + 30; continue }
      const r = Math.max(0, n - 2 - Math.floor(random('rv' + i) * 5))
      stops.push(i % 3 === 2 ? { f, x: DRE.x + 80 + random('rx' + i) * 560, y: DRE.y + 60 + random('ry' + i) * 180 } : { f, x: COL_X.status + 20 + random('rx' + i) * 80, y: 0, row: r })
      f += 30 + Math.round(random('rd' + i) * 20)
    }
    return stops
  }
  // Each worker lands on the category cell of its rows just before they are classified.
  expenses.forEach((e, i) => { if (e.agent === id) stops.push({ f: frameOf(i + 1) - 10, x: COL_X.cat + 30 + random('cx' + i) * 140, y: 0, row: i }) })
  // Fill long gaps by reading the focus card or the raw description of an upcoming row.
  const filled: Stop[] = []
  let prev = 6 + a * 5
  filled.push({ f: prev, x: COL_X.desc + 40 + random('s' + id) * 160, y: ROWS_TOP + 40 + a * 70 })
  for (const s of [...stops, { f: EXPENSE_SWARM_DURATION + 40, x: 0, y: 0 }]) {
    for (let g = prev + 44, k = 0; g < s.f - 24; g += 40, k++) {
      const n = classifiedAt(g)
      filled.push(k % 2 ? { f: g, x: FOCUS.x + 60 + random(`${id}fx${g}`) * 600, y: FOCUS.y + 80 + random(`${id}fy${g}`) * 220 }
        : { f: g, x: COL_X.desc + 20 + random(`${id}dx${g}`) * 180, y: 0, row: Math.min(TOTAL - 1, n + 2 + Math.floor(random(`${id}dr${g}`) * 6)) })
    }
    if (s.f <= EXPENSE_SWARM_DURATION) filled.push(s)
    prev = s.f
  }
  return filled
}
const routes = agents.map((_, a) => routeFor(a))
const posOf = (s: Stop, f: number) => ({ x: s.x, y: s.row === undefined ? s.y : rowCenterY(s.row, f) + 6 })

function Cursor({ a, f }: { a: number; f: number }) {
  const r = routes[a]
  if (f < r[0].f - 6) return null
  let k = 0
  while (k + 1 < r.length && r[k + 1].f <= f) k++
  const cur = posOf(r[k], f), next = r[k + 1]
  let { x, y } = cur
  if (next) {
    const n = posOf(next, f), p = ease(f, next.f - Math.min(16, next.f - r[k].f), next.f)
    x += (n.x - x) * p; y += (n.y - y) * p
  }
  x += Math.sin((f + a * 17) / 9) * 3; y += Math.cos((f + a * 11) / 11) * 3
  y = Math.max(TOP + 10, Math.min(1060, y))
  const click = f >= r[k].f && f < r[k].f + 8 ? 1 - (f - r[k].f) / 8 : 0
  const { color, name } = agents[a]
  return <div style={{ position: 'absolute', left: x, top: y, opacity: interpolate(f, [r[0].f - 6, r[0].f + 2], [0, 1], clamp), zIndex: 40 }}>
    {click > 0 && <div style={{ position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%', border: `2px solid ${color}`, opacity: click, transform: `scale(${1.6 - click * 0.6})` }} />}
    <svg width={20} height={22} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / .6))' }}>
      <path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill={color} stroke="#0b0d12" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
    <span style={{ position: 'absolute', ...(x > 1760 ? { right: 10 } : { left: 16 }), top: 18, padding: '2px 7px', borderRadius: 5, background: color, ...mono(11, '#0b0d12', { fontWeight: 700, letterSpacing: 0 }) }}>{name}</span>
  </div>
}

// ---------- panels ----------

function Panel({ b, title, right, children }: { b: Box; title: string; right?: ReactNode; children?: ReactNode }) {
  return <div style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 8, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 26, padding: '0 12px', borderBottom: `1px solid ${LINE}` }}>
      <span style={mono(11, TXT, { fontWeight: 700, letterSpacing: 1.2 })}>{title}</span>{right}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 26, bottom: 0 }}>{children}</div>
  </div>
}

function TopBar({ f }: { f: number }) {
  const live = Math.min(agents.length, Math.floor(interpolate(f, [6, 40], [0, agents.length], clamp)))
  return <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: TOP, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 22, background: '#090c13' }}>
    <span style={{ display: 'flex', gap: 6 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <i key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}</span>
    {['Início', 'Vendas', 'Compras', 'Financeiro', 'Contas a pagar', 'DRE', 'Agentes'].map(m => <span key={m} style={{ fontFamily: UI, fontSize: 13, color: m === 'Contas a pagar' ? '#fff' : m === 'Agentes' ? LIME : TXT, fontWeight: m === 'Contas a pagar' ? 700 : 400, ...(m === 'Contas a pagar' ? { padding: '3px 10px', borderRadius: 6, background: '#1a2131' } : {}) }}>{m}</span>)}
    <span style={{ position: 'absolute', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15, pointerEvents: 'none' }}>
      <b style={{ fontFamily: UI, fontSize: 13, color: '#fff', fontWeight: 600 }}>Contas a pagar · novembro/2026</b>
      <span style={mono(10)}>classificação de despesas · ao vivo</span>
    </span>
    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ display: 'flex' }}>{agents.map((ag, i) => <i key={ag.id} style={{ width: 16, height: 16, borderRadius: '50%', background: ag.color, marginLeft: i ? -5 : 0, border: '2px solid #090c13', opacity: i < live ? 1 : 0.15 }} />)}</span>
      <span style={{ ...mono(12, LIME, { fontWeight: 700 }), padding: '4px 10px', borderRadius: 999, background: 'rgb(198 244 50 / .1)', border: '1px solid rgb(198 244 50 / .35)' }}>● {live} agentes ao vivo</span>
      <span style={{ fontFamily: UI, fontSize: 12, color: '#0b0d12', background: '#e9edf5', borderRadius: 6, padding: '5px 12px', fontWeight: 600 }}>Exportar DRE</span>
    </span>
  </div>
}

const sumUntil = (k: number) => expenses.slice(0, k).reduce((s, x) => s + x.value, 0)

function Kpis({ f }: { f: number }) {
  const n = classifiedAt(f), done = f >= END + 6, flagged = f >= DUP_AT
  const items: { label: string; value: ReactNode; note: string; color?: string; glow?: boolean; w: number }[] = [
    { label: 'CLASSIFICADAS', value: <><b style={{ fontSize: 38 }}>{n}</b><span style={{ fontSize: 24, color: DIM }}> / {TOTAL}</span></>, note: done ? `${TOTAL} despesas em 12 s` : 'categoria + grupo do DRE', color: LIME, glow: done, w: 1.2 },
    { label: 'SEM CATEGORIA', value: <b style={{ fontSize: 36, color: done ? GREEN : '#fff' }}>{TOTAL - n}{done ? ' ✓' : ''}</b>, note: `eram ${TOTAL} no começo do dia`, w: 1 },
    { label: 'VALOR CLASSIFICADO', value: <b style={{ fontSize: 36 }}>{brl(sumUntil(n))}</b>, note: `de ${brl(sumUntil(TOTAL))} a pagar em novembro`, w: 1.4 },
    { label: 'CONFIANÇA MÉDIA', value: <b style={{ fontSize: 36 }}>{n ? `${(93 + Math.min(4.6, n * 0.12)).toFixed(1).replace('.', ',')}%` : '—'}</b>, note: 'com base no histórico da empresa', w: 1 },
    { label: 'PARA REVISÃO', value: <b style={{ fontSize: 36, color: flagged ? AMBER : TXT }}>{flagged ? 1 : 0}</b>, note: flagged ? 'possível duplicidade · Kalunga' : 'nenhuma até agora', w: 1 },
  ]
  const unit = (KPI.w - 8 * (items.length - 1)) / items.reduce((s, i) => s + i.w, 0)
  let x = KPI.x
  return <>{items.map(it => {
    const w = it.w * unit, left = x
    x += w + 8
    return <div key={it.label} style={{ position: 'absolute', left, top: KPI.y, width: w, height: KPI.h, background: PANEL, border: `1px solid ${it.glow ? LIME : LINE}`, borderRadius: 8, padding: '10px 16px', boxShadow: it.glow ? '0 0 24px rgb(198 244 50 / .25)' : 'none' }}>
      <div style={mono(10.5, TXT, { fontWeight: 700, letterSpacing: 1.4 })}>{it.label}</div>
      <div style={{ fontFamily: UI, color: it.color ?? '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, marginTop: 2, letterSpacing: -0.5 }}>{it.value}</div>
      <div style={mono(10.5)}>{it.note}</div>
    </div>
  })}</>
}

type RowState = 'pendente' | 'analisando' | 'classificada' | 'revisar'
function stateOf(i: number, f: number): RowState {
  const n = classifiedAt(f)
  if (i === DUP && f >= DUP_AT) return 'revisar'
  if (i < n) return 'classificada'
  if (i < n + IN_FLIGHT && f >= START - 10) return 'analisando'
  return 'pendente'
}

function Chip({ text, color, pop = 1 }: { text: string; color: string; pop?: number }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%', padding: '3px 9px', borderRadius: 999, background: `${color}1c`, border: `1px solid ${color}66`, fontFamily: UI, fontSize: 12, fontWeight: 600, color: '#fff', opacity: pop, transform: `scale(${0.7 + pop * 0.3})`, transformOrigin: 'left center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
    <i style={{ width: 7, height: 7, borderRadius: 2, background: color, flexShrink: 0 }} />{text}
  </span>
}

function Table({ f }: { f: number }) {
  const n = classifiedAt(f)
  const scroll = scrollAt(f)
  return <Panel b={TABLE} title="CONTAS A PAGAR" right={<span style={mono(10)}>{TOTAL} lançamentos · vencimento em novembro</span>}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 14px', borderBottom: `1px solid ${LINE}` }}>
      {[['Novembro/2026', false], ['Todas', false], [`Sem categoria (${TOTAL - n})`, true], ['Vencidas (0)', false]].map(([l, on]) => <span key={l as string} style={{ fontFamily: UI, fontSize: 12.5, fontWeight: 600, color: on ? '#0b0d12' : TXT, background: on ? (n === TOTAL ? GREEN : LIME) : '#151b28', border: `1px solid ${on ? 'transparent' : LINE}`, borderRadius: 6, padding: '5px 11px' }}>{l as string}</span>)}
      <span style={{ marginLeft: 'auto', width: 260, height: 28, borderRadius: 6, background: '#0a0d14', border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', padding: '0 10px', ...mono(11) }}>⌕ buscar fornecedor, valor…</span>
      <span style={{ fontFamily: UI, fontSize: 12.5, fontWeight: 700, color: '#0b0d12', background: '#e9edf5', borderRadius: 6, padding: '5px 12px' }}>+ Nova conta</span>
    </div>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 30, ...mono(9.5, DIM, { letterSpacing: 1 }), borderBottom: `1px solid ${LINE}` }}>
      {[['', 'check'], ['VENC.', 'due'], ['FORNECEDOR', 'supplier'], ['DESCRIÇÃO DO EXTRATO / BOLETO', 'desc'], ['VALOR', 'value'], ['CATEGORIA', 'cat'], ['GRUPO DO DRE', 'group'], ['STATUS', 'status']].map(([l, k]) => <span key={k} style={{ position: 'absolute', left: COL_X[k] - TABLE.x, width: k === 'desc' ? DESC_W : COLS[k as keyof typeof COLS], textAlign: k === 'value' ? 'right' : 'left', paddingRight: k === 'value' ? 16 : 0 }}>{l}</span>)}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 44 + 30, height: VISIBLE * ROW, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: -scroll * ROW }}>
        {expenses.map((e, i) => {
          const st = stateOf(i, f), g = GROUPS[e.group]
          const pop = interpolate(f - frameOf(i + 1), [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })
          const ag = agentOf(e.agent)
          const flash = st === 'classificada' ? interpolate(f - frameOf(i + 1), [0, 18], [1, 0], clamp) : 0
          const bg = st === 'revisar' ? 'rgb(255 176 32 / .1)' : st === 'analisando' ? 'rgb(255 255 255 / .035)' : flash > 0 ? `rgb(198 244 50 / ${0.12 * flash})` : 'transparent'
          const cell = (k: string, w: number, child: ReactNode, extra?: CSSProperties) => <span style={{ position: 'absolute', left: COL_X[k] - TABLE.x, width: w, top: 0, height: ROW, display: 'flex', alignItems: 'center', overflow: 'hidden', ...extra }}>{child}</span>
          const shimmer = (f * 9 + i * 40) % 260
          return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * ROW, height: ROW, background: bg, borderBottom: `1px solid ${LINE}` }}>
            {cell('check', COLS.check, <i style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${st === 'classificada' ? GREEN : '#3a4256'}`, background: st === 'classificada' ? 'rgb(61 220 132 / .25)' : 'transparent' }} />)}
            {cell('due', COLS.due, <span style={mono(11.5, TXT)}>{e.due}</span>)}
            {cell('supplier', COLS.supplier, <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 10 }}>{e.supplier}</span>)}
            {cell('desc', DESC_W, <span style={mono(11, st === 'analisando' ? '#e7ecf6' : DIM)}>{e.raw}</span>)}
            {cell('value', COLS.value, <span style={{ ...mono(12, '#fff', { fontWeight: 700 }), width: '100%', textAlign: 'right', paddingRight: 16 }}>{brl(e.value).replace('R$', '').trim()}</span>)}
            {cell('cat', COLS.cat, st === 'classificada' || st === 'revisar' ? <Chip text={e.cat} color={g.color} pop={pop} />
              : st === 'analisando' ? <span style={{ position: 'relative', width: 168, height: 20, borderRadius: 999, background: '#151b28', overflow: 'hidden', border: `1px dashed ${ag.color}88` }}><i style={{ position: 'absolute', left: shimmer - 80, width: 70, top: 0, bottom: 0, background: `linear-gradient(90deg, transparent, ${ag.color}55, transparent)` }} /></span>
              : <span style={{ ...mono(11, '#565e70'), padding: '2px 8px', borderRadius: 999, border: '1px dashed #2c3445' }}>sem categoria</span>)}
            {cell('group', COLS.group, st === 'classificada' || st === 'revisar' ? <span style={{ fontFamily: UI, fontSize: 12, color: TXT, opacity: interpolate(f - frameOf(i + 1), [4, 12], [0, 1], clamp), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>{g.label}</span> : <span style={mono(11, '#3d4558')}>—</span>)}
            {cell('status', COLS.status, st === 'revisar' ? <span style={{ ...mono(10, AMBER, { fontWeight: 700 }), padding: '2px 7px', borderRadius: 999, background: 'rgb(255 176 32 / .14)', border: `1px solid ${AMBER}66` }}>⚠ revisar</span>
              : st === 'classificada' ? <span style={{ ...mono(10, GREEN, { fontWeight: 700 }), padding: '2px 7px', borderRadius: 999, background: 'rgb(61 220 132 / .12)', border: `1px solid ${GREEN}55` }}>✓ classificada</span>
              : st === 'analisando' ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...mono(10, ag.color, { fontWeight: 700 }) }}><i style={{ width: 7, height: 7, borderRadius: '50%', background: ag.color, boxShadow: `0 0 8px ${ag.color}`, opacity: 0.5 + 0.5 * Math.abs(Math.sin((f + i * 5) / 5)) }} />{ag.name}</span>
              : <span style={mono(10, '#4b5366')}>aguardando</span>)}
          </div>
        })}
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 30, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 14px' }}>
      <span style={mono(10.5, LIME)}>● {agents.length} agentes</span>
      <span style={mono(10.5, TXT)}>{n} de {TOTAL} classificadas · {Math.round((n / TOTAL) * 100)}%</span>
      <span style={mono(10.5)}>regras aprendidas: 214</span>
      <span style={{ marginLeft: 'auto', ...mono(10.5) }}>salvo automaticamente</span>
    </div>
  </Panel>
}

const CYCLE = 45
function Focus({ f }: { f: number }) {
  const LAST = Math.floor((END - START) / CYCLE) - 1
  const k = Math.min(LAST, Math.max(0, Math.floor((f - START) / CYCLE)))
  const t = f < START ? -1 : k === LAST ? Math.min(44, f - START - LAST * CYCLE) : (f - START) % CYCLE
  const i = Math.min(TOTAL - 1, Math.max(0, classifiedAt(START + (k + 1) * CYCLE - 6) - 1))
  const e = expenses[i], ag = agentOf(e.agent), g = GROUPS[e.group]
  const at = (s: number) => interpolate(t, [s, s + 6], [0, 1], clamp)
  const enter = f < START ? 0 : ease(t, 0, 5)
  const cands = [{ label: e.cat, p: e.conf }, { label: e.alts[0], p: 0.18 + random('a1' + i) * 0.22 }, { label: e.alts[1], p: 0.04 + random('a2' + i) * 0.1 }]
  const picked = t >= 32
  const signals = [`fornecedor reconhecido: ${e.supplier}`, `histórico: ${e.hist} lançamentos em “${e.cat}”`, e.hint]
  return <Panel b={FOCUS} title="EM ANÁLISE" right={f >= START ? <span style={{ ...mono(10.5, '#0b0d12', { fontWeight: 700, letterSpacing: 0 }), padding: '2px 8px', borderRadius: 5, background: ag.color }}>{ag.name}</span> : <span style={mono(10)}>aguardando</span>}>
    <div style={{ position: 'absolute', inset: '14px 16px', opacity: enter, transform: `translateY(${(1 - enter) * 10}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 6, background: '#0a0d14', border: `1px solid ${LINE}` }}>
        <span style={mono(16, '#fff', { fontWeight: 700 })}>{e.raw}</span>
        <span style={{ marginLeft: 'auto', ...mono(12, TXT) }}>venc. {e.due}</span>
        <span style={mono(15, '#fff', { fontWeight: 700 })}>{brl(e.value)}</span>
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
        <div style={{ width: 330 }}>
          <div style={mono(9.5, DIM, { letterSpacing: 1.2 })}>SINAIS ENCONTRADOS</div>
          {signals.map((s, k2) => <div key={k2} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 9, opacity: at(4 + k2 * 6), transform: `translateX(${(1 - at(4 + k2 * 6)) * -8}px)` }}>
            <span style={{ ...mono(11, GREEN, { fontWeight: 700 }), marginTop: 1 }}>✓</span>
            <span style={{ fontFamily: UI, fontSize: 12.5, color: TXT, lineHeight: 1.35, whiteSpace: 'normal' }}>{s}</span>
          </div>)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={mono(9.5, DIM, { letterSpacing: 1.2 })}>CATEGORIAS CANDIDATAS</div>
          {cands.map((c, k2) => {
            const p = c.p * ease(t, 18 + k2 * 2, 30 + k2 * 2), win = k2 === 0 && picked
            return <div key={k2} style={{ marginTop: 9, padding: '6px 9px', borderRadius: 6, border: `1px solid ${win ? LIME : 'transparent'}`, background: win ? 'rgb(198 244 50 / .07)' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: k2 === 0 ? '#fff' : TXT }}>{c.label}</span>
                <span style={mono(11.5, win ? LIME : TXT, { fontWeight: 700 })}>{Math.round(p * 100)}%</span>
              </div>
              <div style={{ marginTop: 5, height: 5, borderRadius: 3, background: '#161c29' }}><div style={{ width: `${p * 100}%`, height: '100%', borderRadius: 3, background: k2 === 0 ? g.color : '#3a4256' }} /></div>
            </div>
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 6, background: picked ? 'rgb(198 244 50 / .08)' : '#101521', border: `1px solid ${picked ? 'rgb(198 244 50 / .4)' : LINE}` }}>
        <span style={mono(11, picked ? LIME : DIM, { fontWeight: 700 })}>{picked ? '✓ APLICADA' : 'decidindo…'}</span>
        {picked && <><Chip text={e.cat} color={g.color} pop={at(32)} /><span style={mono(12, DIM)}>→</span><span style={{ fontFamily: UI, fontSize: 13, color: '#fff', fontWeight: 600, opacity: at(35) }}>{g.label}</span></>}
      </div>
    </div>
  </Panel>
}

function Dre({ f }: { f: number }) {
  const n = classifiedAt(f)
  const totals = (k: number) => Object.fromEntries(GROUP_ORDER.map(gid => [gid, expenses.slice(0, k).filter(e => e.group === gid).reduce((s, e) => s + e.value, 0)])) as Record<GroupId, number>
  const now = totals(n), max = Math.max(...Object.values(totals(TOTAL)))
  const sum = Object.values(now).reduce((s, v) => s + v, 0)
  return <Panel b={DRE} title="DRE · DESPESAS DE NOVEMBRO" right={<span style={mono(10)}>montando ao vivo</span>}>
    <div style={{ position: 'absolute', inset: '12px 16px' }}>
      {GROUP_ORDER.map(gid => {
        const g = GROUPS[gid], v = now[gid]
        return <div key={gid} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 32 }}>
          <span style={{ width: 200, fontFamily: UI, fontSize: 12.5, color: TXT, whiteSpace: 'nowrap' }}>{g.label}</span>
          <div style={{ flex: 1, height: 12, borderRadius: 6, background: '#161c29', overflow: 'hidden' }}><div style={{ width: `${(v / max) * 100}%`, height: '100%', borderRadius: 6, background: g.color }} /></div>
          <span style={{ width: 120, textAlign: 'right', ...mono(12, v ? '#fff' : '#3d4558', { fontWeight: 700 }) }}>{brl(v)}</span>
        </div>
      })}
      <div style={{ height: 1, background: LINE, margin: '8px 0 10px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={mono(11.5, TXT)}>Total de despesas classificadas</span>
        <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 24, color: n === TOTAL ? LIME : '#fff', fontVariantNumeric: 'tabular-nums' }}>{brl(sum)}</span>
      </div>
    </div>
  </Panel>
}

function logLines(f: number): [AgentId, string][] {
  const out: [AgentId, string][] = []
  const n = classifiedAt(f)
  for (let i = 0; i < n; i++) {
    const e = expenses[i]
    if (e.agent === 'leitor' || i % 4 === 0) out.push(['leitor', `leu ${e.raw.split(' ')[0].toLowerCase()} · ${brl(e.value)}`])
    out.push([e.agent, `${e.supplier} → ${e.cat} · ${GROUPS[e.group].label}`])
    if (i === DUP && f >= DUP_AT) out.push(['revisor', `⚠ Kalunga ${brl(e.value)} repetida em 2 dias · enviar para revisão`])
    if (i % 8 === 7) out.push(['revisor', `check · ${i + 1} classificações sem divergência`])
  }
  return out
}

function Log({ f }: { f: number }) {
  const lines = logLines(f).slice(-12)
  return <Panel b={LOG} title="ATIVIDADE DOS AGENTES" right={<span style={mono(10, LIME)}>{Math.round(24 + 12 * Math.abs(Math.sin(f / 19)))} ops/s</span>}>
    <div style={{ position: 'absolute', inset: '8px 14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {lines.map(([id, msg], k) => <div key={k} style={{ display: 'flex', gap: 12, height: 19, alignItems: 'center' }}>
        <span style={{ ...mono(11, agentOf(id).color, { fontWeight: 700 }), width: 128 }}>{agentOf(id).name}</span>
        <span style={{ ...mono(11, k === lines.length - 1 ? '#fff' : msg.startsWith('⚠') ? AMBER : TXT), overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg}</span>
      </div>)}
    </div>
  </Panel>
}

export function ClaudeExpenseSwarm() {
  const f = useCurrentFrame()
  return <AbsoluteFill style={{ background: BG, fontFamily: UI, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, opacity: interpolate(f, [0, 10], [0, 1], clamp) }}>
      <TopBar f={f} />
      <Kpis f={f} />
      <Table f={f} />
      <Focus f={f} />
      <Dre f={f} />
      <Log f={f} />
      {agents.map((ag, a) => <Cursor key={ag.id} a={a} f={f} />)}
    </div>
  </AbsoluteFill>
}

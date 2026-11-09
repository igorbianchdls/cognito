import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono'

// "Emissão de notas com agentes": a dark invoicing control room where seven AI agents issue a batch of 50 service
// invoices (NFS-e) live. The sales queue changes status row by row, the invoice in focus fills field by field and
// gets the AUTORIZADA stamp, taxes add up, the city hall's status and response times move, the agents' log scrolls
// and the issued invoices pile up on a conveyor at the bottom. One invoice is rejected (invalid CNPJ), fixed and
// sent again. 1920×1080, 30 fps. All companies, numbers and values are made up.

export const INVOICE_SWARM_DURATION = 450
export const INVOICE_SWARM_WIDTH = 1920
export const INVOICE_SWARM_HEIGHT = 1080

const opts = { subsets: ['latin'] as ['latin'] }
const MONO = loadMono('normal', { ...opts, weights: ['400', '700'] }).fontFamily
const UI = loadInter('normal', { ...opts, weights: ['400', '500', '600', '700', '800'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })

const BG = '#07090f', PANEL = '#0d1119', LINE = '#1c2230', TXT = '#c9d1e3', DIM = '#6b7486'
const LIME = '#c6f432', GREEN = '#3ddc84', ORANGE = '#ff8a3d', YELLOW = '#f5c542', PURPLE = '#a78bfa', BLUE = '#4f8cff', RED = '#ff5f5f', CYAN = '#38d6f5'

const mono = (size: number, color = DIM, extra?: CSSProperties): CSSProperties => ({ fontFamily: MONO, fontSize: size, color, letterSpacing: 0.3, whiteSpace: 'nowrap', ...extra })
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const agents = [
  { id: 'cadastro', name: 'cadastro-01', color: BLUE },
  { id: 'fiscal', name: 'fiscal-01', color: YELLOW },
  { id: 'impostos', name: 'impostos-01', color: ORANGE },
  { id: 'assinatura', name: 'assinatura-01', color: PURPLE },
  { id: 'envio', name: 'envio-01', color: GREEN },
  { id: 'entrega', name: 'entrega-01', color: CYAN },
  { id: 'revisor', name: 'revisor', color: '#f4f4f5' },
] as const
type AgentId = (typeof agents)[number]['id']
const agentOf = (id: AgentId) => agents.find(a => a.id === id)!

// ---------- the batch (made up) ----------

const CLIENTS = ['Aurora Tecnologia', 'Padaria Central', 'Studio Lume', 'Clínica Vita', 'Grupo Norte', 'Café Brasa', 'Orbe Digital', 'Mercado Sol',
  'Atlas Engenharia', 'Bela Pet', 'Rota Logística', 'Ateliê Flor', 'Prisma Educação', 'Vértice Consultoria', 'Horta Viva', 'Nexo Saúde']
const SERVICES = ['Consultoria em gestão', 'Desenvolvimento de software', 'Suporte técnico mensal', 'Design de marca', 'Treinamento in company', 'Gestão de tráfego']
const CODES = ['17.01', '01.07', '01.06', '23.01', '08.02', '17.06']
const TOTAL = 50
const notes = Array.from({ length: TOTAL }, (_, i) => {
  const client = CLIENTS[Math.floor(random('c' + i) * CLIENTS.length)]
  const s = Math.floor(random('s' + i) * SERVICES.length)
  const value = Math.round((1200 + random('v' + i) * 7800) / 10) * 10
  const cnpj = `${String(10 + Math.floor(random('a' + i) * 89))}.${String(100 + Math.floor(random('b' + i) * 899))}.${String(100 + Math.floor(random('d' + i) * 899))}/0001-${String(10 + Math.floor(random('e' + i) * 89))}`
  return { n: 2841 + i, client, service: SERVICES[s], code: CODES[s], value, cnpj }
})
const REJECTED = 11 // this one comes back with an invalid CNPJ, is fixed and sent again
const START = 30, END = 410
/** How many invoices are authorized at frame f. */
const issuedAt = (f: number) => Math.floor(interpolate(f, [START, END], [0, TOTAL], { ...clamp, easing: Easing.inOut(Easing.quad) }))
const frameOf = (k: number) => { // first frame when k invoices are authorized
  for (let f = START; f <= END; f++) if (issuedAt(f) >= k) return f
  return END
}
const REJ_AT = frameOf(REJECTED) - 4, FIX_AT = REJ_AT + 34
const rejectedNow = (f: number) => f >= REJ_AT && f < FIX_AT

const RATES = [{ label: 'ISS', rate: 0.05, color: ORANGE }, { label: 'PIS', rate: 0.0065, color: YELLOW }, { label: 'COFINS', rate: 0.03, color: PURPLE }, { label: 'IRRF', rate: 0.015, color: BLUE }, { label: 'CSLL', rate: 0.01, color: CYAN }]
const sumUntil = (k: number) => notes.slice(0, k).reduce((s, x) => s + x.value, 0)

// ---------- layout ----------

const TOP = 40
type Box = { x: number; y: number; w: number; h: number }
const KPI: Box = { x: 10, y: TOP + 8, w: 1900, h: 92 }
const QUEUE: Box = { x: 10, y: 148, w: 480, h: 552 }
const DOC: Box = { x: 500, y: 148, w: 560, h: 552 }
const TAX: Box = { x: 1070, y: 148, w: 410, h: 552 }
const CITY: Box = { x: 1490, y: 148, w: 420, h: 220 }
const LOG: Box = { x: 1490, y: 376, w: 420, h: 324 }
const BELT: Box = { x: 10, y: 708, w: 1900, h: 336 }
const LANE_X = 150

// ---------- cursors ----------

type Stop = { f: number; x: number; y: number }
const CYCLE = 60 // the invoice in focus changes every 2 s
function routeFor(a: number): Stop[] {
  const id = agents[a].id
  const area = (f: number): Box => {
    const n = issuedAt(f), t = (f - START) % CYCLE
    switch (id) {
      case 'cadastro': return rejectedNow(f) ? { x: QUEUE.x + 60, y: QUEUE.y + 70 + 4 * 30, w: 300, h: 26 } : t < 20 ? { x: DOC.x + 60, y: DOC.y + 150, w: 400, h: 60 } : { x: QUEUE.x + 40, y: QUEUE.y + 70 + 4 * 30, w: 380, h: 120 }
      case 'fiscal': return { x: DOC.x + 50, y: DOC.y + 240, w: 440, h: 110 }
      case 'impostos': return { x: TAX.x + 30, y: TAX.y + 50, w: 350, h: 260 }
      case 'assinatura': return t > 20 && t < 40 ? { x: TAX.x + 60, y: TAX.y + 420, w: 280, h: 60 } : { x: DOC.x + 60, y: DOC.y + 430, w: 400, h: 50 }
      case 'envio': return f % 90 < 45 ? { x: CITY.x + 30, y: CITY.y + 50, w: 360, h: 140 } : { x: BELT.x + LANE_X + n * 34 - 80, y: BELT.y + 60, w: 100, h: 60 }
      case 'entrega': return { x: BELT.x + LANE_X + Math.max(0, n - 4) * 34 - 120, y: BELT.y + 150, w: 140, h: 100 }
      default: return { x: DOC.x + 300, y: DOC.y + 380, w: 220, h: 120 }
    }
  }
  const stops: Stop[] = []
  for (let f = 8 + a * 4, i = 0; f < INVOICE_SWARM_DURATION; i++) {
    const b = area(f)
    stops.push({ f, x: Math.max(20, b.x + random(`${id}x${i}`) * b.w), y: b.y + random(`${id}y${i}`) * b.h })
    f += 22 + Math.round(random(`${id}d${i}`) * 24)
  }
  return stops
}
const routes = agents.map((_, a) => routeFor(a))

function Cursor({ a, f }: { a: number; f: number }) {
  const r = routes[a]
  if (f < r[0].f - 6) return null
  let k = 0
  while (k + 1 < r.length && r[k + 1].f <= f) k++
  const cur = r[k], next = r[k + 1]
  let x = cur.x, y = cur.y
  if (next) { const p = ease(f, next.f - Math.min(14, next.f - cur.f), next.f); x += (next.x - cur.x) * p; y += (next.y - cur.y) * p }
  x += Math.sin((f + a * 17) / 9) * 3; y += Math.cos((f + a * 11) / 11) * 3
  const click = f >= cur.f && f < cur.f + 8 ? 1 - (f - cur.f) / 8 : 0
  const { color, name } = agents[a]
  return <div style={{ position: 'absolute', left: x, top: y, opacity: interpolate(f, [r[0].f - 6, r[0].f + 2], [0, 1], clamp), zIndex: 40 }}>
    {click > 0 && <div style={{ position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%', border: `2px solid ${color}`, opacity: click, transform: `scale(${1.6 - click * 0.6})` }} />}
    <svg width={20} height={22} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / .6))' }}>
      <path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill={color} stroke="#0b0d12" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
    <span style={{ position: 'absolute', ...(x > 1780 ? { right: 10 } : { left: 16 }), top: 18, padding: '2px 7px', borderRadius: 5, background: color, ...mono(11, '#0b0d12', { fontWeight: 700, letterSpacing: 0 }) }}>{name}</span>
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
    {['Arquivo', 'Notas', 'Clientes', 'Impostos', 'Prefeitura', 'Agentes'].map(m => <span key={m} style={{ fontFamily: UI, fontSize: 13, color: m === 'Agentes' ? LIME : TXT }}>{m}</span>)}
    <span style={{ position: 'absolute', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15, pointerEvents: 'none' }}>
      <b style={{ fontFamily: UI, fontSize: 13, color: '#fff', fontWeight: 600 }}>lote_novembro_2026 · NFS-e</b>
      <span style={mono(10)}>emissão em lote · ao vivo</span>
    </span>
    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ display: 'flex' }}>{agents.map((ag, i) => <i key={ag.id} style={{ width: 16, height: 16, borderRadius: '50%', background: ag.color, marginLeft: i ? -5 : 0, border: '2px solid #090c13', opacity: i < live ? 1 : 0.15 }} />)}</span>
      <span style={{ ...mono(12, LIME, { fontWeight: 700 }), padding: '4px 10px', borderRadius: 999, background: 'rgb(198 244 50 / .1)', border: '1px solid rgb(198 244 50 / .35)' }}>● {live} agentes ao vivo</span>
      <span style={{ fontFamily: UI, fontSize: 12, color: '#0b0d12', background: '#e9edf5', borderRadius: 6, padding: '5px 12px', fontWeight: 600 }}>Exportar XML</span>
    </span>
  </div>
}

function Kpis({ f }: { f: number }) {
  const n = issuedAt(f), total = sumUntil(n)
  const tax = total * RATES.slice(1).reduce((s, r) => s + r.rate, 0)
  const done = f >= END + 6
  const items: { label: string; value: ReactNode; note: string; color?: string; w: number }[] = [
    { label: 'NOTAS EMITIDAS', value: <><b style={{ fontSize: 38 }}>{n}</b><span style={{ fontSize: 24, color: DIM }}> / {TOTAL}</span></>, note: done ? '50 notas em 12,7 s' : 'autorizadas pela prefeitura', color: LIME, w: 1.3 },
    { label: 'FATURADO', value: <b style={{ fontSize: 36 }}>{brl(total)}</b>, note: 'serviços prestados em novembro', w: 1.3 },
    { label: 'RETENÇÕES', value: <b style={{ fontSize: 36 }}>{brl(tax)}</b>, note: 'PIS, COFINS, IRRF e CSLL', w: 1.1 },
    { label: 'TEMPO MÉDIO', value: <b style={{ fontSize: 36 }}>{n ? '0,25 s' : '—'}</b>, note: 'por nota, da venda ao PDF', w: 0.9 },
    { label: 'REJEITADAS', value: <b style={{ fontSize: 36, color: rejectedNow(f) ? RED : f >= FIX_AT ? GREEN : TXT }}>{f >= REJ_AT ? 1 : 0}</b>, note: f >= FIX_AT ? 'corrigida e reenviada ✓' : rejectedNow(f) ? 'CNPJ inválido · corrigindo…' : 'nenhuma até agora', w: 0.9 },
  ]
  const unit = (KPI.w - 8 * (items.length - 1)) / items.reduce((s, i) => s + i.w, 0)
  let x = KPI.x
  return <>{items.map(it => {
    const w = it.w * unit, left = x
    x += w + 8
    return <div key={it.label} style={{ position: 'absolute', left, top: KPI.y, width: w, height: KPI.h, background: PANEL, border: `1px solid ${it.color && done ? LIME : LINE}`, borderRadius: 8, padding: '10px 16px', boxShadow: it.color && done ? '0 0 24px rgb(198 244 50 / .25)' : 'none' }}>
      <div style={mono(10.5, TXT, { fontWeight: 700, letterSpacing: 1.4 })}>{it.label}</div>
      <div style={{ fontFamily: UI, color: it.color ?? '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, marginTop: 2, letterSpacing: -0.5 }}>{it.value}</div>
      <div style={mono(10.5)}>{it.note}</div>
    </div>
  })}</>
}

const STATUS = {
  pendente: { label: 'pendente', color: DIM },
  validando: { label: 'validando', color: BLUE },
  assinando: { label: 'assinando', color: PURPLE },
  enviando: { label: 'enviando', color: YELLOW },
  autorizada: { label: 'autorizada ✓', color: GREEN },
  rejeitada: { label: 'rejeitada', color: RED },
} as const
function statusOf(i: number, f: number): keyof typeof STATUS {
  const n = issuedAt(f)
  if (i === REJECTED && rejectedNow(f)) return f < REJ_AT + 20 ? 'rejeitada' : 'validando'
  if (i < n) return 'autorizada'
  if (i === n) return 'enviando'
  if (i === n + 1) return 'assinando'
  if (i === n + 2 || i === n + 3) return 'validando'
  return 'pendente'
}

function Queue({ f }: { f: number }) {
  const ROW = 30, VISIBLE = 15
  const n = issuedAt(f)
  const first = Math.max(0, Math.min(TOTAL - VISIBLE, (rejectedNow(f) ? REJECTED : n) - 4))
  return <Panel b={QUEUE} title="VENDAS A FATURAR" right={<span style={mono(10)}>{TOTAL} vendas · nov/2026</span>}>
    <div style={{ display: 'flex', padding: '8px 12px 6px', ...mono(9.5, DIM, { letterSpacing: 1 }), borderBottom: `1px solid ${LINE}` }}>
      <span style={{ width: 56 }}>Nº</span><span style={{ flex: 1 }}>CLIENTE</span><span style={{ width: 96, textAlign: 'right' }}>VALOR</span><span style={{ width: 112, textAlign: 'right' }}>STATUS</span>
    </div>
    {Array.from({ length: VISIBLE }, (_, k) => {
      const i = first + k, note = notes[i], st = STATUS[statusOf(i, f)]
      const active = st.label !== 'pendente' && st.label !== 'autorizada ✓'
      return <div key={i} style={{ display: 'flex', alignItems: 'center', height: ROW, padding: '0 12px', background: statusOf(i, f) === 'rejeitada' ? 'rgb(255 95 95 / .12)' : active ? 'rgb(255 255 255 / .03)' : 'transparent', borderBottom: `1px solid ${LINE}` }}>
        <span style={{ ...mono(11, TXT), width: 56 }}>{note.n}</span>
        <span style={{ flex: 1, fontFamily: UI, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.client}</span>
        <span style={{ ...mono(11.5, TXT), width: 96, textAlign: 'right' }}>{brl(note.value).replace('R$', '').trim()}</span>
        <span style={{ width: 112, display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ ...mono(10, st.color, { fontWeight: 700 }), padding: '2px 7px', borderRadius: 999, background: `${st.color}1f`, border: `1px solid ${st.color}55` }}>{active && '● '}{st.label}</span>
        </span>
      </div>
    })}
  </Panel>
}

function Field({ label, value, on, w, mark }: { label: string; value: ReactNode; on: number; w?: number; mark?: boolean }) {
  return <div style={{ width: w, flex: w ? undefined : 1 }}>
    <div style={{ fontFamily: MONO, fontSize: 9, color: '#7a8190', letterSpacing: 1 }}>{label}</div>
    <div style={{ position: 'relative', marginTop: 3, height: 22, borderRadius: 4, background: on > 0 ? '#f3f5f9' : '#eceff4', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 8px', fontFamily: UI, fontSize: 13, color: '#151a24', fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ clipPath: `inset(0 ${(1 - on) * 100}% 0 0)` }}>{value}</span>
      {mark && on >= 1 && <span style={{ marginLeft: 'auto', color: '#16a34a', fontWeight: 800 }}>✓</span>}
    </div>
  </div>
}

function Invoice({ f }: { f: number }) {
  // The last invoice in focus stays on screen, stamped, once the batch is done.
  const LAST = Math.floor((END - START) / CYCLE)
  const k = Math.min(LAST, Math.max(0, Math.floor((f - START) / CYCLE)))
  const t = f < START ? -1 : k === LAST ? Math.min(50, f - START - LAST * CYCLE) : (f - START) % CYCLE
  const note = notes[Math.min(TOTAL - 1, issuedAt(START + k * CYCLE))]
  const at = (s: number) => interpolate(t, [s, s + 6], [0, 1], clamp)
  const iss = note.value * 0.05, ret = note.value * RATES.slice(1).reduce((s, r) => s + r.rate, 0)
  const stamp = interpolate(t, [38, 44], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.4)) })
  const fly = ease(t, 52, 60)
  const enter = f < START ? 0 : ease(t, 0, 6)
  const W = DOC.w - 40
  return <Panel b={DOC} title="NOTA EM EMISSÃO" right={<span style={mono(10, LIME)}>NFS-e nº {f < START ? '—' : note.n}</span>}>
    <div style={{ position: 'absolute', left: 20, top: 18, width: W, height: 490, borderRadius: 6, background: '#fff', boxShadow: '0 20px 40px rgb(0 0 0 / .45)', padding: '18px 22px', opacity: enter * (1 - fly * 0.9),
      transform: `translate(${fly * 120}px, ${(1 - enter) * 30 + fly * 260}px) rotate(${fly * 8}deg) scale(${1 - fly * 0.5})`, transformOrigin: '50% 100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 18, color: '#111' }}>NOTA FISCAL DE SERVIÇO</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#7a8190', marginTop: 2 }}>Prefeitura de São Paulo · NFS-e</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#7a8190' }}>Nº / SÉRIE</div>
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: '#111' }}>{String(note.n).padStart(8, '0')} / 1</div>
        </div>
      </div>
      <div style={{ height: 1, background: '#e3e6ec', margin: '12px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'flex', gap: 10 }}><Field label="PRESTADOR" value="Otto Serviços Digitais Ltda" on={at(2)} /><Field label="CNPJ" value="41.208.556/0001-30" on={at(4)} w={160} /></div>
        <div style={{ display: 'flex', gap: 10 }}><Field label="TOMADOR" value={note.client} on={at(8)} /><Field label="CNPJ" value={note.cnpj} on={at(11)} w={160} mark /></div>
        <Field label="ENDEREÇO DO TOMADOR" value="Av. Paulista, 1000 · São Paulo/SP" on={at(13)} />
        <div style={{ display: 'flex', gap: 10 }}><Field label="DISCRIMINAÇÃO DO SERVIÇO" value={note.service} on={at(16)} /><Field label="CÓDIGO" value={note.code} on={at(18)} w={80} mark /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="VALOR DO SERVIÇO" value={brl(note.value)} on={at(21)} />
          <Field label="ALÍQUOTA ISS" value="5,00%" on={at(23)} w={100} />
          <Field label="ISS" value={brl(iss)} on={at(25)} w={120} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="RETENÇÕES FEDERAIS" value={brl(ret)} on={at(27)} />
          <Field label="VALOR LÍQUIDO" value={brl(note.value - ret)} on={at(30)} mark />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 22, right: 22, bottom: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, background: '#f6f3ff', opacity: at(31) }}>
        <svg width={14} height={16} viewBox="0 0 34 38"><rect x={4} y={16} width={26} height={20} rx={4} fill="#6d4fd8" /><path d="M10 16 V11 a7 7 0 0 1 14 0 V16" stroke="#6d4fd8" strokeWidth={4} fill="none" /></svg>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#4b3a8f' }}>Assinada com certificado A1 · {t >= 36 ? `verificação ${(note.n * 7919).toString(36).toUpperCase().slice(0, 4)}-${(note.n * 104729).toString(36).toUpperCase().slice(0, 4)}` : 'assinando…'}</span>
      </div>
      {stamp > 0 && <div style={{ position: 'absolute', right: 40, top: 372, transform: `rotate(-8deg) scale(${2 - stamp})`, opacity: stamp, border: '4px solid #16a34a', color: '#16a34a', borderRadius: 8, padding: '4px 14px', fontFamily: UI, fontWeight: 800, fontSize: 26, letterSpacing: 2, background: 'rgb(255 255 255 / .85)' }}>AUTORIZADA</div>}
    </div>
  </Panel>
}

function Taxes({ f }: { f: number }) {
  const n = issuedAt(f), total = sumUntil(n), max = sumUntil(TOTAL)
  const t = (f - START) % CYCLE
  const signing = f >= START && t > 26 && t < 40
  return <Panel b={TAX} title="IMPOSTOS DO LOTE" right={<span style={mono(10)}>Simples · ISS SP 5%</span>}>
    <div style={{ position: 'absolute', inset: '16px 18px' }}>
      {RATES.map(r => {
        const v = total * r.rate
        return <div key={r.label} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={mono(11, TXT, { fontWeight: 700 })}>{r.label} <span style={{ color: DIM, fontWeight: 400 }}>{(r.rate * 100).toFixed(2).replace('.', ',')}%</span></span><span style={mono(12, '#fff', { fontWeight: 700 })}>{brl(v)}</span></div>
          <div style={{ marginTop: 6, height: 8, borderRadius: 4, background: '#161c29' }}><div style={{ width: `${(v / (max * 0.05)) * 100}%`, height: '100%', borderRadius: 4, background: r.color }} /></div>
        </div>
      })}
      <div style={{ height: 1, background: LINE, margin: '4px 0 14px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={mono(11, TXT)}>Total bruto</span><span style={{ fontFamily: UI, fontWeight: 700, fontSize: 20, color: '#fff' }}>{brl(total)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}><span style={mono(11, TXT)}>Líquido a receber</span><span style={{ fontFamily: UI, fontWeight: 800, fontSize: 24, color: LIME }}>{brl(total * (1 - RATES.slice(1).reduce((s, r) => s + r.rate, 0)))}</span></div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 8, border: `1px solid ${signing ? PURPLE : LINE}`, background: signing ? 'rgb(167 139 250 / .1)' : '#101521', boxShadow: signing ? '0 0 20px rgb(167 139 250 / .3)' : 'none' }}>
        <svg width={34} height={38} viewBox="0 0 34 38"><rect x={4} y={16} width={26} height={20} rx={4} fill={PURPLE} /><path d={signing ? 'M10 16 V11 a7 7 0 0 1 14 0' : 'M10 16 V11 a7 7 0 0 1 14 0 V16'} stroke={PURPLE} strokeWidth={3.5} fill="none" /><circle cx={17} cy={26} r={3} fill="#0b0d12" /></svg>
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <b style={{ fontFamily: UI, fontSize: 14, color: '#fff' }}>Certificado digital A1</b>
          <span style={mono(10.5, signing ? PURPLE : DIM)}>{signing ? 'assinando a nota…' : 'válido até 03/2027 · pronto'}</span>
        </span>
      </div>
    </div>
  </Panel>
}

function City({ f }: { f: number }) {
  const n = issuedAt(f)
  const pts = Array.from({ length: 40 }, (_, i) => {
    const k = Math.floor(f / 3) - 40 + i
    const spike = k * 3 >= REJ_AT && k * 3 < REJ_AT + 12
    return 120 + random('ms' + k) * 160 + (spike ? 420 : 0)
  })
  const W = CITY.w - 28, H = 90
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / 39) * W},${H - (v / 700) * H}`).join(' ')
  const queued = Math.max(0, Math.min(4, TOTAL - n))
  return <Panel b={CITY} title="PREFEITURA · SÃO PAULO" right={<span style={mono(10, GREEN, { fontWeight: 700 })}>● online</span>}>
    <div style={{ position: 'absolute', left: 14, top: 12, ...mono(10) }}>tempo de resposta (ms)</div>
    <svg style={{ position: 'absolute', left: 14, top: 30 }} width={W} height={H}>
      {[0.25, 0.5, 0.75].map(g => <line key={g} x1={0} x2={W} y1={g * H} y2={g * H} stroke={LINE} />)}
      <path d={`${path} L${W},${H} L0,${H} Z`} fill="rgb(61 220 132 / .12)" />
      <path d={path} stroke={GREEN} strokeWidth={2} fill="none" />
    </svg>
    <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', justifyContent: 'space-between' }}>
      {[['autorizadas', n, GREEN], ['rejeitadas', f >= REJ_AT ? 1 : 0, f >= REJ_AT ? RED : TXT], ['em fila', queued, YELLOW]].map(([l, v, c]) => <span key={l as string} style={{ display: 'flex', flexDirection: 'column' }}>
        <b style={{ fontFamily: UI, fontSize: 22, color: c as string }}>{v as number}</b><span style={mono(10)}>{l as string}</span>
      </span>)}
    </div>
  </Panel>
}

function logLines(f: number): [AgentId, string][] {
  const out: [AgentId, string][] = []
  const n = issuedAt(f)
  for (let i = 0; i < n; i++) {
    const x = notes[i]
    out.push(['cadastro', `validou CNPJ ${x.cnpj}`], ['fiscal', `${x.code} · ISS 5% · ${x.client}`], ['assinatura', `assinou NFS-e ${x.n}`], ['envio', `prefeitura autorizou ${x.n}`])
    if (i % 2 === 0) out.push(['entrega', `PDF + XML → ${x.client.split(' ')[0].toLowerCase()}@email`])
    if (i === REJECTED - 1 && f >= REJ_AT) out.push(['envio', `prefeitura rejeitou ${notes[REJECTED].n} · E160 CNPJ`], ['cadastro', 'corrigiu CNPJ na Receita · reenviando'])
    if (i % 9 === 8) out.push(['revisor', `check · ${i + 1} notas sem divergência`])
  }
  return out
}

function Log({ f }: { f: number }) {
  const lines = logLines(f).slice(-16)
  return <Panel b={LOG} title="ATIVIDADE DOS AGENTES" right={<span style={mono(10, LIME)}>{Math.round(30 + 14 * Math.abs(Math.sin(f / 19)))} ops/s</span>}>
    <div style={{ position: 'absolute', inset: '8px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {lines.map(([id, msg], k) => <div key={k} style={{ display: 'flex', gap: 10, height: 18, alignItems: 'center' }}>
        <span style={{ ...mono(10.5, agentOf(id).color, { fontWeight: 700 }), width: 98 }}>{agentOf(id).name}</span>
        <span style={{ ...mono(10.5, k === lines.length - 1 ? '#fff' : msg.includes('rejeitou') ? RED : TXT), overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg}</span>
      </div>)}
    </div>
  </Panel>
}

function Belt({ f }: { f: number }) {
  const n = issuedAt(f)
  const CARD = 34
  const front = LANE_X + n * CARD
  const lanes = [{ label: 'AUTORIZADAS', y: 44, h: 78 }, { label: 'ENVIADAS AO CLIENTE', y: 134, h: 56 }, { label: 'ARQUIVOS', y: 202, h: 40 }, { label: 'CONTAS A RECEBER', y: 254, h: 40 }]
  return <div style={{ position: 'absolute', left: BELT.x, top: BELT.y, width: BELT.w, height: BELT.h, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 8, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 12, top: 8, display: 'flex', gap: 18, alignItems: 'center' }}>
      <span style={mono(13, LIME, { fontWeight: 700 })}>ESTEIRA DO LOTE</span>
      <span style={mono(11, TXT)}>{n} de {TOTAL} notas · {Math.round((n / TOTAL) * 100)}%</span>
    </div>
    <div style={{ position: 'absolute', right: 12, top: 8, ...mono(11) }}>nota → PDF/XML → e-mail e WhatsApp → contas a receber</div>
    {lanes.map(l => <div key={l.label} style={{ position: 'absolute', left: 0, top: l.y, width: LANE_X - 10, height: l.h, display: 'flex', alignItems: 'center', paddingLeft: 12, ...mono(9.5, TXT, { fontWeight: 700 }), borderRight: `1px solid ${LINE}` }}>{l.label}</div>)}
    <div style={{ position: 'absolute', left: LANE_X, top: 36, width: Math.max(0, front - LANE_X), height: BELT.h - 70, background: 'rgb(198 244 50 / .03)' }} />
    <div style={{ position: 'absolute', left: front, top: 36, width: 2, height: BELT.h - 70, background: GREEN, boxShadow: `0 0 14px ${GREEN}`, opacity: 0.8 }} />
    {notes.map((x, i) => {
      if (i >= n) return null
      const age = n - i, pop = interpolate(f - frameOf(i + 1), [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })
      const delivered = i < n - 3, fixed = i === REJECTED
      return <div key={i}>
        <div style={{ position: 'absolute', left: LANE_X + i * CARD + 3, top: 48 + (1 - pop) * -16, width: CARD - 6, height: 70, borderRadius: 4, background: '#f3f5f9', opacity: pop, boxShadow: age === 1 ? `0 0 14px ${GREEN}` : 'none', padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[1, 0.7, 0.85, 0.5].map((w, k) => <i key={k} style={{ height: 3, width: `${w * 100}%`, background: '#c9ced8', borderRadius: 2 }} />)}
          <span style={{ marginTop: 'auto', ...mono(7.5, fixed ? ORANGE : '#16a34a', { fontWeight: 700, letterSpacing: 0 }) }}>{fixed ? '↻' : '✓'}{String(x.n).slice(-2)}</span>
        </div>
        {delivered && <span style={{ position: 'absolute', left: LANE_X + i * CARD + 4, top: 144, width: CARD - 8, height: 36, borderRadius: 6, background: i % 2 ? 'rgb(37 211 102 / .18)' : 'rgb(56 214 245 / .15)', border: `1px solid ${i % 2 ? '#25d366' : CYAN}`, display: 'grid', placeItems: 'center', ...mono(8.5, i % 2 ? '#25d366' : CYAN, { fontWeight: 700, letterSpacing: 0 }) }}>{i % 2 ? 'WA' : '@'}</span>}
        <span style={{ position: 'absolute', left: LANE_X + i * CARD + 3, top: 210, width: CARD - 6, height: 24, borderRadius: 3, background: 'rgb(167 139 250 / .15)', border: `1px solid ${PURPLE}66`, ...mono(7.5, PURPLE, { fontWeight: 700, letterSpacing: 0 }), display: 'grid', placeItems: 'center', opacity: pop }}>XML</span>
        {delivered && <span style={{ position: 'absolute', left: LANE_X + i * CARD + 3, top: 262, width: CARD - 6, height: 24, borderRadius: 3, background: 'rgb(198 244 50 / .12)', border: `1px solid ${LIME}66`, ...mono(7.5, LIME, { fontWeight: 700, letterSpacing: 0 }), display: 'grid', placeItems: 'center' }}>R$</span>}
      </div>
    })}
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 12px' }}>
      <span style={mono(10, LIME)}>● {agents.length} agentes</span>
      <span style={mono(10, TXT)}>{logLines(f).length} ações</span>
      <span style={mono(10)}>certificado A1 · válido</span>
      <span style={mono(10)}>ambiente: produção (simulado)</span>
      <span style={{ marginLeft: 'auto', ...mono(10) }}>salvo automaticamente</span>
    </div>
  </div>
}

export function ClaudeInvoiceSwarm() {
  const f = useCurrentFrame()
  return <AbsoluteFill style={{ background: BG, fontFamily: UI, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, opacity: interpolate(f, [0, 10], [0, 1], clamp) }}>
      <TopBar f={f} />
      <Kpis f={f} />
      <Queue f={f} />
      <Invoice f={f} />
      <Taxes f={f} />
      <City f={f} />
      <Log f={f} />
      <Belt f={f} />
      {agents.map((ag, a) => <Cursor key={ag.id} a={a} f={f} />)}
    </div>
  </AbsoluteFill>
}

import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from 'remotion'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono'
import { Danfse, danfseTotals, DANFSE_H, DANFSE_W, makeChave, money, SAMPLE, SECTION_Y, type DanfseData, type DanfseSection } from './danfse/Danfse'

// "Otto · Emissor de NFS-e": one dark invoicing system on screen for the whole video, operated by seven AI agents.
// Sidebar, top bar, month summary cards, the invoices table with live statuses, the PDF preview of the selected
// invoice (a realistic DANFSe the agents fill in, field by field), the agents panel and the system toasts.
// Two modes: one invoice (Aurora Tecnologia) and the month's batch (50). 1920×1080, 30 fps, 15 s. Data made up.

export const EMISSOR_DURATION = 450
const opts = { subsets: ['latin'] as ['latin'] }
const UI = loadInter('normal', { ...opts, weights: ['400', '500', '600', '700', '800'] }).fontFamily
const MONO = loadMono('normal', { ...opts, weights: ['400', '700'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const out = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })

const BG = '#0a0d13', SIDE = '#0d1118', PANEL = '#111620', LINE = '#1f2633', TXT = '#d6dce8', DIM = '#7c8597', WHITE = '#f4f6fb'
const GREEN = '#34d399', AMBER = '#fbbf24', BLUE = '#60a5fa', VIOLET = '#a78bfa', RED = '#f87171', CYAN = '#22d3ee', ORANGE = '#fb923c', LIME = '#c6f432'
const mono = (size: number, color = DIM, extra?: CSSProperties): CSSProperties => ({ fontFamily: MONO, fontSize: size, color, whiteSpace: 'nowrap', ...extra })

const agents = [
  { id: 'cadastro', name: 'cadastro', color: BLUE },
  { id: 'fiscal', name: 'fiscal', color: AMBER },
  { id: 'impostos', name: 'impostos', color: ORANGE },
  { id: 'assinatura', name: 'assinatura', color: VIOLET },
  { id: 'envio', name: 'envio', color: GREEN },
  { id: 'entrega', name: 'entrega', color: CYAN },
  { id: 'revisor', name: 'revisor', color: '#e5e7eb' },
] as const
type AgentId = (typeof agents)[number]['id']

// ---------- layout ----------
const SB_W = 232, TOP_H = 64
const CARDS = { x: SB_W + 20, y: TOP_H + 18, w: 1920 - SB_W - 40, h: 104 }
const LIST = { x: SB_W + 20, y: 206, w: 812, h: 690 }
const PREV = { x: SB_W + 844, y: 206, w: 1920 - SB_W - 864, h: 690 }
const AGENTS = { x: SB_W + 20, y: 908, w: 1920 - SB_W - 40, h: 156 }
const DOC_S = 1.0 // preview scale of the DANFSe
const DOC_X = PREV.x + (PREV.w - DANFSE_W * DOC_S) / 2, DOC_TOP = PREV.y + 52, DOC_VIEW = PREV.h - 52

// ---------- data ----------
type Mode = 'single' | 'batch'
const CLIENTS = ['Aurora Tecnologia', 'Padaria Central', 'Studio Lume', 'Clínica Vita', 'Grupo Norte', 'Café Brasa', 'Orbe Digital', 'Mercado Sol', 'Atlas Engenharia', 'Bela Pet',
  'Rota Logística', 'Ateliê Flor', 'Prisma Educação', 'Vértice Consultoria', 'Horta Viva', 'Nexo Saúde', 'Lumen Hotel', 'Casa Moura', 'Farol Imóveis', 'Ponto Fit']
const SERVICES = ['Consultoria em gestão', 'Gestão financeira mensal', 'Implantação de BPO', 'Treinamento de equipe', 'Assessoria contábil']
const cnpjOf = (i: number) => i === 0 ? SAMPLE.tomador.cnpj : `${String(10 + Math.floor(random('a' + i) * 89))}.${String(100 + Math.floor(random('b' + i) * 899))}.${String(100 + Math.floor(random('d' + i) * 899))}/0001-${String(10 + Math.floor(random('e' + i) * 89))}`
const SALES = Array.from({ length: 50 }, (_, i) => ({
  n: 127 + i,
  client: i === 0 ? 'Aurora Tecnologia' : CLIENTS[(i * 7 + Math.floor(random('c' + i) * 3)) % CLIENTS.length],
  value: i === 0 ? 4000 : Math.round((1500 + random('v' + i) * 5600) / 50) * 50,
  service: i === 0 ? 'Consultoria em gestão' : SERVICES[Math.floor(random('s' + i) * SERVICES.length)],
  cnpj: cnpjOf(i),
}))
/** Single mode: invoices already issued this month, listed under the new one. */
const HISTORY = Array.from({ length: 14 }, (_, k) => ({ ...SALES[k + 1], n: 126 - k }))
function noteData(i: number): DanfseData {
  if (i === 0) return SAMPLE
  const s = SALES[i]
  const slug = s.client.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')
  return { ...SAMPLE, numero: s.n, valor: s.value, chave: makeChave(SAMPLE.emitente.cnpj, s.n, '2611', 'k' + i),
    tomador: { ...SAMPLE.tomador, nome: `${s.client.toUpperCase()} LTDA`, cnpj: s.cnpj, email: `financeiro@${slug}.com.br` },
    servico: { ...SAMPLE.servico, descricao: `${s.service} referente ao mês de outubro/2026, conforme contrato vigente.` } }
}
const totals = (k: number) => SALES.slice(0, k).reduce((acc, s) => { const t = danfseTotals(noteData(SALES.indexOf(s))); return { valor: acc.valor + s.value, iss: acc.iss + t.iss, ret: acc.ret + t.federais } }, { valor: 0, iss: 0, ret: 0 })

// ---------- timing ----------
// single: one invoice, filled section by section.
const FILL: Record<DanfseSection, [number, number]> = {
  emitente: [24, 40], tomador: [44, 92], intermediario: [92, 96], servico: [92, 134], municipal: [134, 168], federal: [166, 196], ibscbs: [192, 206],
  total: [204, 226], aproximados: [222, 232], info: [228, 238], header: [240, 250],
}
const CHAVE: [number, number] = [244, 270]
const QR: [number, number] = [246, 272]
const OWNER: Record<DanfseSection, AgentId> = { emitente: 'cadastro', tomador: 'cadastro', intermediario: 'cadastro', servico: 'fiscal', municipal: 'impostos', federal: 'impostos', ibscbs: 'impostos', total: 'impostos', aproximados: 'impostos', info: 'fiscal', header: 'assinatura' }
const SEND = 276, AUTH_SINGLE = 300
// batch: slow on the first invoice, then the rest fly.
const doneBatch = (f: number) => f < 120 ? 0 : f < 150 ? 1 : Math.min(50, 1 + Math.floor(interpolate(f, [150, 400], [0, 49], { ...clamp, easing: Easing.inOut(Easing.quad) })))
const REJ = 17, REJ_AT = 232, FIX_AT = 268

const statusSingle = (f: number) => f < 24 ? 'rascunho' : f < 240 ? 'validando' : f < SEND ? 'assinando' : f < AUTH_SINGLE ? 'transmitindo' : 'autorizada'
function statusBatch(i: number, f: number) {
  const n = doneBatch(f)
  if (i === REJ && f >= REJ_AT && f < FIX_AT) return f < REJ_AT + 18 ? 'rejeitada' : 'transmitindo'
  if (i < n) return 'autorizada'
  if (f < 20) return 'rascunho'
  if (i === n) return f < 100 && n === 0 ? 'validando' : 'transmitindo'
  if (i === n + 1) return 'assinando'
  if (i < n + 4) return 'validando'
  return 'rascunho'
}
type St = 'rascunho' | 'validando' | 'assinando' | 'transmitindo' | 'autorizada' | 'rejeitada'
const ST: Record<St, [string, string]> = { rascunho: ['Rascunho', DIM], validando: ['Validando', BLUE], assinando: ['Assinando', VIOLET], transmitindo: ['Transmitindo', AMBER], autorizada: ['Autorizada', GREEN], rejeitada: ['Rejeitada · E160', RED] }

// ---------- pieces ----------

function Panel({ b, children, style }: { b: { x: number; y: number; w: number; h: number }; children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden', ...style }}>{children}</div>
}

function Sidebar() {
  const nav: [string, boolean][] = [['Painel', false], ['Vendas', false], ['Notas fiscais', true], ['Clientes', false], ['Impostos', false], ['Contas a receber', false], ['Agentes', false], ['Configurações', false]]
  return <div style={{ position: 'absolute', left: 0, top: 0, width: SB_W, height: 1080, background: SIDE, borderRight: `1px solid ${LINE}`, fontFamily: UI }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 22px' }}>
      <Img src={staticFile('logoOttoIcon.svg')} style={{ width: 30, height: 30, filter: 'invert(1)' }} />
      <b style={{ fontSize: 20, color: WHITE }}>Otto</b><span style={{ ...mono(11), marginLeft: 'auto' }}>ERP</span>
    </div>
    <div style={{ padding: '8px 12px' }}>
      {nav.map(([l, on]) => <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40, padding: '0 12px', borderRadius: 8, background: on ? '#1a2130' : 'transparent', color: on ? WHITE : DIM, fontSize: 15, fontWeight: on ? 600 : 500 }}>
        <i style={{ width: 16, height: 16, borderRadius: 4, border: `1.6px solid ${on ? LIME : '#3b4456'}` }} />{l}
        {l === 'Agentes' && <span style={{ marginLeft: 'auto', ...mono(11, LIME) }}>7</span>}
      </div>)}
    </div>
    <div style={{ position: 'absolute', left: 14, right: 14, bottom: 16, padding: 14, borderRadius: 10, background: '#121823', border: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 13, color: WHITE, fontWeight: 600 }}>Otto Consultoria em Gestão</div>
      <div style={{ ...mono(11), marginTop: 4 }}>41.208.556/0001-30</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12, color: GREEN }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />Certificado A1 · até 03/2027</div>
    </div>
  </div>
}

function TopBar({ f, mode }: { f: number; mode: Mode }) {
  const live = Math.min(7, Math.floor(interpolate(f, [4, 30], [0, 7], clamp)))
  return <div style={{ position: 'absolute', left: SB_W, right: 0, top: 0, height: TOP_H, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 18, padding: '0 22px', fontFamily: UI }}>
    <span style={{ fontSize: 15, color: DIM }}>Notas fiscais</span><span style={{ color: '#3b4456' }}>›</span><span style={{ fontSize: 15, color: WHITE, fontWeight: 600 }}>{mode === 'single' ? 'Emissão' : 'Emissão em lote'}</span>
    <span style={{ marginLeft: 22, padding: '7px 14px', borderRadius: 8, border: `1px solid ${LINE}`, fontSize: 14, color: TXT }}>Competência: Outubro/2026 ▾</span>
    <span style={{ width: 300, padding: '7px 14px', borderRadius: 8, border: `1px solid ${LINE}`, fontSize: 14, color: DIM }}>Buscar nota, cliente ou CNPJ…</span>
    <span style={{ marginLeft: 'auto', display: 'flex' }}>{agents.map((a, i) => <i key={a.id} style={{ width: 22, height: 22, borderRadius: '50%', background: a.color, marginLeft: i ? -6 : 0, border: `2px solid ${BG}`, opacity: i < live ? 1 : 0.15 }} />)}</span>
    <span style={{ ...mono(13, LIME, { fontWeight: 700 }), padding: '6px 12px', borderRadius: 999, background: 'rgb(198 244 50 / .08)', border: '1px solid rgb(198 244 50 / .3)' }}>● {live} agentes trabalhando</span>
    <span style={{ padding: '8px 16px', borderRadius: 8, background: WHITE, color: '#0b0d12', fontSize: 14, fontWeight: 700 }}>+ Nova nota</span>
  </div>
}

function Cards({ f, mode }: { f: number; mode: Mode }) {
  const k = mode === 'single' ? (f >= AUTH_SINGLE ? 1 : 0) : doneBatch(f)
  const t = totals(k)
  const base = mode === 'single' ? { n: 46, valor: 168250, iss: 8412.5, ret: 6920 } : { n: 0, valor: 0, iss: 0, ret: 0 }
  const rej = mode === 'batch' && f >= REJ_AT ? 1 : 0
  const items: [string, string, string, string?][] = [
    ['Emitidas em outubro', String(base.n + k), mode === 'batch' ? 'de 50 vendas' : '+1 hoje', LIME],
    ['Valor faturado', money(base.valor + t.valor), 'serviços'],
    ['ISS a recolher', money(base.iss + t.iss), 'vence 10/12'],
    ['Retenções federais', money(base.ret + t.ret), 'IRRF e CSRF'],
    ['Rejeitadas', String(rej), rej ? (f >= FIX_AT ? 'corrigida e reenviada' : 'CNPJ inválido · corrigindo') : 'nenhuma', rej && f < FIX_AT ? RED : undefined],
  ]
  const w = (CARDS.w - 4 * 12) / 5
  return <>{items.map(([l, v, sub, color], i) => <div key={l} style={{ position: 'absolute', left: CARDS.x + i * (w + 12), top: CARDS.y, width: w, height: CARDS.h, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: '14px 18px', fontFamily: UI }}>
    <div style={{ fontSize: 13, color: DIM, fontWeight: 500 }}>{l}</div>
    <div style={{ fontSize: 30, fontWeight: 700, color: color ?? WHITE, marginTop: 4, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
    <div style={{ fontSize: 12.5, color: DIM, marginTop: 2 }}>{sub}</div>
  </div>)}</>
}

const ROW_H = 46
function List({ f, mode }: { f: number; mode: Mode }) {
  const rows = mode === 'single' ? [SALES[0], ...HISTORY] : SALES
  const n = mode === 'batch' ? doneBatch(f) : 0
  const scroll = mode === 'batch' ? Math.max(0, Math.min(rows.length - 12, (f >= REJ_AT && f < FIX_AT ? REJ : n) - 5)) * ROW_H : 0
  const selected = mode === 'single' ? 0 : Math.min(49, n)
  return <Panel b={LIST}>
    <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 18px', borderBottom: `1px solid ${LINE}`, fontFamily: UI }}>
      <b style={{ fontSize: 16, color: WHITE }}>{mode === 'single' ? 'Notas de outubro' : 'Vendas de outubro'}</b>
      <span style={{ marginLeft: 10, ...mono(12) }}>{mode === 'single' ? `${f >= AUTH_SINGLE ? 47 : 46} autorizadas no mês` : `${rows.length} notas`}</span>
      {mode === 'batch' && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 160, height: 6, borderRadius: 3, background: '#1f2633' }}><i style={{ display: 'block', width: `${(n / 50) * 100}%`, height: '100%', borderRadius: 3, background: GREEN }} /></span>
        <span style={mono(12, TXT)}>{n}/50</span>
      </span>}
    </div>
    <div style={{ display: 'flex', height: 34, alignItems: 'center', padding: '0 18px', borderBottom: `1px solid ${LINE}`, ...mono(11, DIM, { letterSpacing: 0.6 }) }}>
      <span style={{ width: 60 }}>Nº</span><span style={{ flex: 1 }}>TOMADOR</span><span style={{ width: 170 }}>CNPJ</span><span style={{ width: 120, textAlign: 'right' }}>VALOR</span><span style={{ width: 150, textAlign: 'right' }}>SITUAÇÃO</span>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 87, bottom: 0, overflow: 'hidden' }}>
      <div style={{ transform: `translateY(${-scroll}px)` }}>
        {rows.map((s, i) => {
          const st: St = mode === 'single' ? (i === 0 ? statusSingle(f) : 'autorizada') : statusBatch(i, f) as St
          const [label, color] = ST[st]
          const active = st !== 'rascunho' && st !== 'autorizada'
          return <div key={i} style={{ display: 'flex', alignItems: 'center', height: ROW_H, padding: '0 18px', borderBottom: `1px solid ${LINE}`, fontFamily: UI, background: i === selected ? 'rgb(96 165 250 / .08)' : st === 'rejeitada' ? 'rgb(248 113 113 / .1)' : 'transparent', boxShadow: i === selected ? `inset 3px 0 0 ${BLUE}` : 'none' }}>
            <span style={{ width: 60, ...mono(13, TXT) }}>{st === 'autorizada' || active ? s.n : '—'}</span>
            <span style={{ flex: 1, fontSize: 15, color: mode === 'single' && i > 0 ? TXT : WHITE, fontWeight: 500 }}>{s.client}</span>
            <span style={{ width: 170, ...mono(12.5, DIM) }}>{s.cnpj}</span>
            <span style={{ width: 120, textAlign: 'right', fontSize: 15, color: TXT, fontVariantNumeric: 'tabular-nums' }}>{money(s.value).replace('R$ ', '')}</span>
            <span style={{ width: 150, display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color, padding: '3px 10px', borderRadius: 999, background: `${color}1a`, border: `1px solid ${color}44` }}>{active ? '● ' : st === 'autorizada' ? '✓ ' : ''}{label}</span>
            </span>
          </div>
        })}
      </div>
    </div>
  </Panel>
}

// ---------- preview ----------

const mid = (s: DanfseSection) => SECTION_Y[s][0] + SECTION_Y[s][1] / 2
/** Doc y at the center of the preview over time (single mode). */
const SCROLL_KEYS = [0, 40, 50, 92, 104, 134, 146, 168, 180, 200, 214, 236, 248, 300, 330]
const SCROLL_Y = [300, 300, mid('tomador'), mid('tomador'), mid('servico'), mid('servico'), mid('municipal'), mid('municipal'), mid('federal'), mid('federal'), mid('total'), mid('total'), 300, 300, 520]
const sectionAt = (f: number): DanfseSection | null => {
  for (const s of Object.keys(FILL) as DanfseSection[]) if (f >= FILL[s][0] && f < FILL[s][1] + 6 && s !== 'intermediario' && s !== 'aproximados' && s !== 'info') return s
  return null
}

function docScroll(f: number, mode: Mode) {
  const y = mode === 'single' ? interpolate(f, SCROLL_KEYS, SCROLL_Y, { ...clamp, easing: Easing.inOut(Easing.cubic) }) : f < 150 ? interpolate(f, [20, 40, 60, 80, 100, 120], [300, mid('tomador'), mid('servico'), mid('municipal'), mid('total'), 300], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 300
  return Math.max(0, Math.min(DANFSE_H * DOC_S - DOC_VIEW, y * DOC_S - DOC_VIEW / 2))
}

function Preview({ f, mode }: { f: number; mode: Mode }) {
  let data = SAMPLE, reveal = (s: DanfseSection) => interpolate(f, FILL[s], [0, 1], clamp), count = reveal, chave = interpolate(f, CHAVE, [0, 1], clamp), qr = interpolate(f, QR, [0, 1], clamp)
  let focus: DanfseSection | null = sectionAt(f), status: St = statusSingle(f), num = 127, swap = 1
  if (mode === 'batch') {
    const n = doneBatch(f)
    if (f < 150) { // the first invoice, filled quickly in front of us
      const g = interpolate(f, [20, 116], [0, 1], clamp)
      const order: DanfseSection[] = ['emitente', 'tomador', 'intermediario', 'servico', 'municipal', 'federal', 'ibscbs', 'total', 'aproximados', 'info', 'header']
      reveal = (s) => interpolate(g, [order.indexOf(s) / 11, (order.indexOf(s) + 1) / 11], [0, 1], clamp); count = reveal
      chave = interpolate(f, [104, 122], [0, 1], clamp); qr = interpolate(f, [106, 124], [0, 1], clamp)
      focus = order[Math.min(10, Math.floor(g * 11))]
      status = f < 104 ? 'validando' : f < 120 ? 'assinando' : 'autorizada'
    } else { // then each authorized invoice replaces the previous one
      const last = Math.max(0, n - 1)
      data = noteData(last); num = SALES[last].n
      reveal = () => 1; count = () => 1; chave = 1; qr = 1; focus = null; status = 'autorizada'
      const since = f - (() => { let g = f; while (g > 150 && doneBatch(g - 1) === n) g--; return g })()
      swap = out(since, 0, 4)
    }
  }
  const sc = docScroll(f, mode)
  const [label, color] = ST[status]
  const authorized = status === 'autorizada'
  return <Panel b={PREV}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 52, padding: '0 16px', borderBottom: `1px solid ${LINE}`, fontFamily: UI, position: 'relative', zIndex: 2, background: PANEL }}>
      <b style={{ fontSize: 15, color: WHITE }}>Pré-visualização</b>
      <span style={mono(12)}>NFSe_{String(num).padStart(9, '0')}.pdf</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color, padding: '3px 10px', borderRadius: 999, background: `${color}1a`, border: `1px solid ${color}44` }}>{authorized ? '✓ ' : '● '}{label}</span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {['PDF', 'XML', 'Enviar'].map(b => <span key={b} style={{ fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 7, border: `1px solid ${authorized ? '#2f3a4d' : LINE}`, color: authorized ? TXT : '#475063', background: b === 'Enviar' && authorized ? 'rgb(52 211 153 / .12)' : 'transparent' }}>{b}</span>)}
      </span>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 52, bottom: 0, background: '#1a1f29', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: DOC_X - PREV.x, top: 14 - sc, width: DANFSE_W, height: DANFSE_H, transform: `scale(${DOC_S}) translateY(${(1 - swap) * 18}px)`, transformOrigin: '0 0', opacity: 0.55 + 0.45 * swap, boxShadow: authorized ? `0 0 0 3px ${GREEN}, 0 20px 50px rgb(0 0 0 / .5)` : '0 20px 50px rgb(0 0 0 / .5)' }}>
        <Danfse data={data} reveal={reveal} count={count} chave={chave} qr={qr} focus={focus} frame={f} />
      </div>
      {/* page scrollbar */}
      <div style={{ position: 'absolute', right: 6, top: 8 + (sc / (DANFSE_H - DOC_VIEW)) * (DOC_VIEW - 140), width: 6, height: 120, borderRadius: 3, background: '#3b4456' }} />
    </div>
  </Panel>
}

// ---------- agents panel ----------

function taskOf(id: AgentId, f: number, mode: Mode): [string, boolean] {
  if (mode === 'batch') {
    const n = doneBatch(f)
    const lines: Record<AgentId, string> = {
      cadastro: f >= REJ_AT && f < FIX_AT ? 'corrigindo CNPJ da nota 144' : `${n} CNPJs validados`, fiscal: `${n} serviços classificados`, impostos: `${n} notas calculadas`, assinatura: `${n} assinaturas A1`,
      envio: `${n} autorizadas pela prefeitura`, entrega: `${Math.max(0, n - 2)} PDFs enviados`, revisor: `${Math.floor(n / 5) * 5} conferidas · 0 divergências`,
    }
    return [lines[id], n < 50]
  }
  const map: Record<AgentId, [number, number, string, string]> = {
    cadastro: [24, 96, 'preenchendo tomador e validando CNPJ', 'CNPJ ativo na Receita ✓'],
    fiscal: [92, 140, 'código 17.01.01 · descrição do serviço', 'serviço classificado ✓'],
    impostos: [134, 232, 'ISS 5% · IRRF, CSRF · IBS/CBS', 'impostos calculados ✓'],
    assinatura: [240, 274, 'gerando chave e assinando com A1', 'nota assinada ✓'],
    envio: [SEND, AUTH_SINGLE, 'transmitindo à Prefeitura de SP', 'NFS-e 127 autorizada ✓'],
    entrega: [AUTH_SINGLE + 6, AUTH_SINGLE + 50, 'PDF + XML → WhatsApp e e-mail', 'enviada ao cliente ✓'],
    revisor: [60, 300, 'conferindo seção por seção', '0 divergências ✓'],
  }
  const [a, b, doing, done] = map[id]
  return f < a ? ['aguardando', false] : f < b ? [doing, true] : [done, false]
}

function AgentsPanel({ f, mode }: { f: number; mode: Mode }) {
  const w = (AGENTS.w - 36) / 7
  return <Panel b={AGENTS}>
    <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 18px', borderBottom: `1px solid ${LINE}`, fontFamily: UI }}>
      <b style={{ fontSize: 14, color: WHITE }}>Agentes</b><span style={{ marginLeft: 10, ...mono(12) }}>emissão automática · revisão obrigatória desligada</span>
      <span style={{ marginLeft: 'auto', ...mono(12, LIME) }}>{Math.round(20 + 12 * Math.abs(Math.sin(f / 17)))} ações/s</span>
    </div>
    <div style={{ display: 'flex', gap: 6, padding: '12px 18px' }}>
      {agents.map(a => {
        const [task, busy] = taskOf(a.id, f, mode)
        return <div key={a.id} style={{ width: w, height: 88, borderRadius: 10, background: busy ? `${a.color}12` : '#0f141d', border: `1px solid ${busy ? `${a.color}55` : LINE}`, padding: '10px 12px', fontFamily: UI }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i style={{ width: 10, height: 10, borderRadius: '50%', background: a.color, boxShadow: busy ? `0 0 0 ${2 + 2 * Math.abs(Math.sin(f / 6))}px ${a.color}33` : 'none' }} />
            <b style={{ fontSize: 14, color: WHITE }}>{a.name}</b><span style={{ marginLeft: 'auto', ...mono(10.5, busy ? a.color : DIM) }}>{busy ? 'ativo' : 'ok'}</span>
          </div>
          <div style={{ fontSize: 12.5, color: busy ? TXT : DIM, marginTop: 8, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task}</div>
        </div>
      })}
    </div>
  </Panel>
}

// ---------- toasts ----------

function Toasts({ f, mode }: { f: number; mode: Mode }) {
  const list: [number, string, string, string][] = mode === 'single' ? [
    [96, BLUE, 'CNPJ 28.417.903/0001-62', 'Ativo na Receita Federal · Aurora Tecnologia Ltda'],
    [AUTH_SINGLE, GREEN, 'NFS-e nº 127 autorizada', 'Prefeitura de São Paulo · protocolo 2611-48291'],
    [AUTH_SINGLE + 26, CYAN, 'Enviada para Aurora Tecnologia', 'PDF e XML por WhatsApp e e-mail'],
    [AUTH_SINGLE + 52, LIME, 'Conta a receber criada', 'R$ 3.754,00 · vence 20/11/2026'],
  ] : [
    [122, GREEN, 'NFS-e nº 127 autorizada', 'Aurora Tecnologia · R$ 4.000,00'],
    [REJ_AT, RED, 'Nota 144 rejeitada · E160', 'CNPJ do tomador inválido · cadastro corrigindo'],
    [FIX_AT, GREEN, 'Nota 144 reenviada e autorizada', 'CNPJ corrigido na Receita'],
    [404, LIME, '50 notas autorizadas', `${money(totals(50).valor)} faturados · PDFs enviados`],
  ]
  const shown = list.filter(([at]) => f >= at && f < at + 90).slice(-3)
  return <div style={{ position: 'absolute', right: 34, top: PREV.y + 64, width: 420, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 30 }}>
    {shown.map(([at, color, title, sub]) => {
      const p = out(f, at, at + 10) * (1 - ease(f, at + 78, at + 90))
      return <div key={title} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 12, background: '#161c27', border: `1px solid ${LINE}`, boxShadow: '0 16px 40px rgb(0 0 0 / .5)', fontFamily: UI, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
        <i style={{ width: 4, borderRadius: 2, background: color }} />
        <div><div style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>{title}</div><div style={{ fontSize: 13, color: DIM, marginTop: 3 }}>{sub}</div></div>
      </div>
    })}
  </div>
}

// ---------- cursors ----------

type Pt = { x: number; y: number }
/** Where each agent works at frame f (screen px); null = resting at its card in the agents panel. */
function targetOf(a: number, f: number, mode: Mode): Pt | null {
  const id = agents[a].id
  const sc = docScroll(f, mode)
  const doc = (x: number, y: number): Pt => ({ x: DOC_X + x * DOC_S, y: DOC_TOP + 14 + y * DOC_S - sc })
  const wob = (k: number) => random(`${id}${Math.floor(f / 14) + k}`)
  if (mode === 'single') {
    if (id === 'revisor' && f >= 60 && f < 300) { const s = sectionAt(f - 20) ?? 'tomador'; return doc(600 + wob(1) * 120, SECTION_Y[s][0] + 20 + wob(2) * SECTION_Y[s][1] * 0.6) }
    if (id === 'envio' && f >= SEND - 10 && f < AUTH_SINGLE + 6) return { x: PREV.x + PREV.w - 70, y: PREV.y + 26 }
    if (id === 'entrega' && f >= AUTH_SINGLE + 6 && f < AUTH_SINGLE + 50) return { x: PREV.x + PREV.w - 150 + wob(1) * 90, y: PREV.y + 26 }
    for (const s of Object.keys(FILL) as DanfseSection[]) {
      if (OWNER[s] !== id || f < FILL[s][0] - 6 || f >= FILL[s][1]) continue
      const p = interpolate(f, FILL[s], [0, 1], clamp)
      return doc(40 + p * 520, SECTION_Y[s][0] + 22 + (Math.floor(p * 3) % 3) * Math.min(28, SECTION_Y[s][1] / 3))
    }
    return null
  }
  // batch: everyone hops between the list rows in progress and the preview
  if (f < 20) return null
  const n = doneBatch(f)
  if (id === 'cadastro' && f >= REJ_AT && f < FIX_AT) return { x: LIST.x + 360 + wob(1) * 120, y: LIST.y + 87 + (REJ * ROW_H - Math.max(0, Math.min(38, REJ - 5)) * ROW_H) + ROW_H / 2 }
  const zone = (a + Math.floor(f / 30)) % 3
  if (zone === 0) { const row = Math.min(11, Math.max(0, Math.min(n, 44) - Math.max(0, Math.min(38, n - 5)) + Math.floor(wob(3) * 4))); return { x: LIST.x + 120 + wob(1) * 600, y: LIST.y + 87 + row * ROW_H + ROW_H / 2 } }
  return doc(60 + wob(1) * 660, 220 + wob(2) * 700)
}
function Cursor({ a, f, mode }: { a: number; f: number; mode: Mode }) {
  const rest = (i: number): Pt => ({ x: AGENTS.x + 18 + i * ((AGENTS.w - 36) / 7) + 150, y: AGENTS.y + 100 })
  const at = (g: number) => targetOf(a, g, mode) ?? rest(a)
  // Smooth the path: average a few past frames so jumps become glides.
  let x = 0, y = 0, wsum = 0
  for (let k = 0; k < 8; k++) { const p = at(f - k), w = 8 - k; x += p.x * w; y += p.y * w; wsum += w }
  x /= wsum; y /= wsum
  x += Math.sin((f + a * 17) / 9) * 2.5; y += Math.cos((f + a * 11) / 11) * 2.5
  const { color, name } = agents[a]
  let busy = 0
  for (let k = 0; k < 8; k++) busy += targetOf(a, f - k, mode) ? 1 : 0
  return <div style={{ position: 'absolute', left: x, top: y, zIndex: 40, opacity: out(f, 4 + a * 3, 14 + a * 3) * (busy / 8) }}>
    <svg width={20} height={22} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / .6))' }}><path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill={color} stroke="#0b0d12" strokeWidth={1.4} strokeLinejoin="round" /></svg>
    <span style={{ position: 'absolute', left: 16, top: 18, padding: '2px 8px', borderRadius: 5, background: color, ...mono(11.5, '#0b0d12', { fontWeight: 700 }) }}>{name}</span>
  </div>
}

function EmissorSystem({ mode }: { mode: Mode }) {
  const f = useCurrentFrame()
  return <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, opacity: out(f, 0, 10) }}>
      <Sidebar />
      <TopBar f={f} mode={mode} />
      <Cards f={f} mode={mode} />
      <List f={f} mode={mode} />
      <Preview f={f} mode={mode} />
      <AgentsPanel f={f} mode={mode} />
      <Toasts f={f} mode={mode} />
      {agents.map((ag, a) => <Cursor key={ag.id} a={a} f={f} mode={mode} />)}
    </div>
  </AbsoluteFill>
}

export const OttoEmissorNfseUma = () => <EmissorSystem mode="single" />
export const OttoEmissorNfseLote = () => <EmissorSystem mode="batch" />

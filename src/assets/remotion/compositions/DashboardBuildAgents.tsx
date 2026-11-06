import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'

// "Criando um Dashboard": a sales dashboard put together live by five AI agents, each with its own job
// (layout, metrics, charts, table, review). Each agent is a colored cursor with its name; each piece of the screen
// is a layer that goes outline (with its size) → gray skeleton → real content. The reviewer closes by checking
// every block. A floating bar shows the agents and counts layers. 1920×1080, 30 fps. All data is made up.

export const DASHBOARD_BUILD_WIDTH = 1920
export const DASHBOARD_BUILD_HEIGHT = 1080
export const DASHBOARD_BUILD_DURATION = 600

type Role = 'layout' | 'metricas' | 'graficos' | 'tabela' | 'revisor'
const agents: { role: Role; name: string; color: string; first: number; step: number }[] = [
  { role: 'layout', name: 'Agente de Layout', color: '#3b82f6', first: 24, step: 10 },
  { role: 'metricas', name: 'Agente de Métricas', color: '#22c55e', first: 70, step: 14 },
  { role: 'graficos', name: 'Agente de Gráficos', color: '#8b5cf6', first: 100, step: 15 },
  { role: 'tabela', name: 'Agente de Tabela', color: '#f59e0b', first: 120, step: 22 },
  { role: 'revisor', name: 'Agente Revisor', color: '#ec4899', first: 336, step: 12 },
]
// The dashboard is laid out from (80, 104), 1760 wide, and scaled to fill the 1920-wide frame.
const ORIGIN = { x: 80, y: 104 }
const SCALE = DASHBOARD_BUILD_WIDTH / 1760
/** Sidebar runs to the bottom edge of the frame. */
const SIDEBAR_H = Math.ceil(DASHBOARD_BUILD_HEIGHT / SCALE)
const OUTLINE = '#3b82f6'
const CHECK = '#16a34a'

const ease = Easing.bezier(0.22, 1, 0.36, 1)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const prog = (f: number, start: number, len: number) => interpolate(f, [start, start + len], [0, 1], { ...clamp, easing: ease })

// ---------- the dashboard (made-up numbers) ----------

const ink = '#0f172a', muted = '#64748b', line = '#e2e8f0', accent = '#4f46e5'
const kpis = [
  { label: 'Receita', value: 184320, money: true, delta: '+12,4%', up: true, spark: [12, 14, 13, 17, 16, 19, 22, 21, 25] },
  { label: 'Pedidos', value: 1248, delta: '+8,1%', up: true, spark: [8, 9, 11, 10, 12, 12, 14, 13, 15] },
  { label: 'Ticket médio', value: 147.7, money: true, cents: true, delta: '+3,9%', up: true, spark: [10, 11, 10, 12, 12, 13, 12, 14, 14] },
  { label: 'Clientes novos', value: 312, delta: '−2,3%', up: false, spark: [16, 15, 17, 14, 15, 13, 14, 12, 13] },
]
const revenue = Array.from({ length: 30 }, (_, i) => 4200 + i * 95 + Math.sin(i / 2.2) * 620 + (random(`rev-${i}`) - 0.5) * 700)
const payments = [{ label: 'Pix', value: 46, color: accent }, { label: 'Cartão', value: 38, color: '#06b6d4' }, { label: 'Boleto', value: 16, color: '#f59e0b' }]
/** Where each slice of the donut starts, as a share of the circle. */
const paymentStarts = payments.map((_, i) => payments.slice(0, i).reduce((n, pm) => n + pm.value / 100, 0))
const channels = [{ label: 'Loja online', value: 42 }, { label: 'Instagram', value: 26 }, { label: 'WhatsApp', value: 18 }, { label: 'Marketplace', value: 9 }, { label: 'Loja física', value: 5 }]
const orders = [
  ['#10482', 'Ana Souza', 'Pix', 'R$ 389,90', 'Pago'], ['#10481', 'Bruno Lima', 'Cartão', 'R$ 1.249,00', 'Pago'], ['#10480', 'Carla Mendes', 'Boleto', 'R$ 219,50', 'Pendente'],
  ['#10479', 'Diego Rocha', 'Pix', 'R$ 74,90', 'Pago'], ['#10478', 'Elisa Prado', 'Cartão', 'R$ 512,30', 'Enviado'],
]
const nav = ['Visão geral', 'Vendas', 'Pedidos', 'Clientes', 'Produtos', 'Financeiro', 'Relatórios']

const brl = (v: number, cents = false) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`

// ---------- layers ----------

type Box = { x: number; y: number; w: number; h: number }
type Layer = Box & { id: string; kind: 'panel' | 'text' | 'block'; radius?: number; render: (p: number) => ReactNode }

const card: CSSProperties = { position: 'absolute', inset: 0, background: '#fff', borderRadius: 14, boxShadow: '0 1px 2px rgb(15 23 42 / .06), 0 0 0 1px #e8edf3' }
const text = (style: CSSProperties, children: ReactNode) => <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', ...style }}>{children}</div>

function buildLayers(): Layer[] {
  const L: Layer[] = []
  const add = (id: string, b: Box, kind: Layer['kind'], render: Layer['render'], radius?: number) => L.push({ id, ...b, kind, render, radius })

  // Frame: sidebar, header.
  add('sidebar', { x: 80, y: 104, w: 240, h: SIDEBAR_H }, 'panel', () => <div style={{ position: 'absolute', inset: 0, background: '#0f172a' }} />, 0)
  add('logo', { x: 104, y: 128, w: 170, h: 36 }, 'text', () => text({ gap: 10, color: '#fff', fontSize: 19, fontWeight: 700 }, <><span style={{ width: 30, height: 30, borderRadius: 8, background: accent, display: 'grid', placeItems: 'center', fontSize: 15 }}>◆</span>Pulso</>))
  add('title', { x: 352, y: 130, w: 300, h: 36 }, 'text', () => text({ color: ink, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }, 'Visão geral'))
  add('subtitle', { x: 352, y: 168, w: 420, h: 22 }, 'text', () => text({ color: muted, fontSize: 15 }, 'Vendas dos últimos 30 dias · atualizado agora'))
  add('date', { x: 1520, y: 134, w: 176, h: 42 }, 'block', () => text({ justifyContent: 'center', gap: 8, background: '#fff', borderRadius: 10, boxShadow: '0 0 0 1px #e2e8f0', color: ink, fontSize: 14, fontWeight: 500 }, '📅  Últimos 30 dias'), 10)
  add('export', { x: 1708, y: 134, w: 116, h: 42 }, 'block', () => text({ justifyContent: 'center', background: ink, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600 }, 'Exportar'), 10)
  nav.forEach((n, i) => add(`nav-${i}`, { x: 100, y: 196 + i * 48, w: 200, h: 38 }, 'text', () => text({ gap: 12, paddingLeft: 14, borderRadius: 9, background: i === 0 ? 'rgb(255 255 255 / .1)' : 'transparent', color: i === 0 ? '#fff' : '#94a3b8', fontSize: 15, fontWeight: i === 0 ? 600 : 500 }, <><span style={{ width: 8, height: 8, borderRadius: 2, background: i === 0 ? accent : '#475569' }} />{n}</>), 9))

  // KPI cards.
  kpis.forEach((k, i) => {
    const x = 352 + i * 374, y = 212
    add(`kpi-${i}`, { x, y, w: 350, h: 136 }, 'panel', () => <div style={card} />, 14)
    add(`kpi-${i}-label`, { x: x + 22, y: y + 20, w: 160, h: 20 }, 'text', () => text({ color: muted, fontSize: 14, fontWeight: 500 }, k.label))
    add(`kpi-${i}-value`, { x: x + 22, y: y + 50, w: 210, h: 42 }, 'text', p => text({ color: ink, fontSize: 34, fontWeight: 700, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' },
      k.money ? brl(k.value * p, k.cents) : Math.round(k.value * p).toLocaleString('pt-BR')))
    add(`kpi-${i}-delta`, { x: x + 22, y: y + 100, w: 74, h: 22 }, 'block', () => text({ justifyContent: 'center', borderRadius: 6, fontSize: 12.5, fontWeight: 700, background: k.up ? '#dcfce7' : '#fee2e2', color: k.up ? '#15803d' : '#b91c1c' }, k.delta), 6)
    add(`kpi-${i}-spark`, { x: x + 226, y: y + 60, w: 100, h: 48 }, 'block', p => <Spark values={k.spark} p={p} color={k.up ? accent : '#ef4444'} />, 6)
  })

  // Revenue line chart.
  add('rev', { x: 352, y: 372, w: 940, h: 360 }, 'panel', () => <div style={card} />, 14)
  add('rev-title', { x: 376, y: 392, w: 260, h: 26 }, 'text', () => text({ color: ink, fontSize: 18, fontWeight: 650 }, 'Receita por dia'))
  add('rev-total', { x: 1060, y: 392, w: 210, h: 26 }, 'text', () => text({ justifyContent: 'flex-end', color: muted, fontSize: 14 }, <>total <b style={{ color: ink, marginLeft: 6 }}>R$ 184.320</b></>))
  add('rev-chart', { x: 376, y: 436, w: 892, h: 264 }, 'block', p => <LineChart values={revenue} p={p} />, 8)

  // Payment donut.
  add('pay', { x: 1316, y: 372, w: 508, h: 360 }, 'panel', () => <div style={card} />, 14)
  add('pay-title', { x: 1340, y: 392, w: 260, h: 26 }, 'text', () => text({ color: ink, fontSize: 18, fontWeight: 650 }, 'Formas de pagamento'))
  add('pay-donut', { x: 1348, y: 452, w: 220, h: 220 }, 'block', p => <Donut p={p} />, 110)
  payments.forEach((pm, i) => add(`pay-leg-${i}`, { x: 1600, y: 488 + i * 52, w: 200, h: 34 }, 'text', () => text({ gap: 10, color: ink, fontSize: 15 }, <>
    <span style={{ width: 12, height: 12, borderRadius: 4, background: pm.color }} />{pm.label}<b style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{pm.value}%</b></>)))

  // Orders table.
  add('orders', { x: 352, y: 756, w: 940, h: 240 }, 'panel', () => <div style={card} />, 14)
  add('orders-title', { x: 376, y: 772, w: 260, h: 26 }, 'text', () => text({ color: ink, fontSize: 18, fontWeight: 650 }, 'Últimos pedidos'))
  const cols = [0, 110, 330, 470, 650]
  add('orders-head', { x: 376, y: 808, w: 892, h: 26 }, 'text', () => <Row cells={['Pedido', 'Cliente', 'Pagamento', 'Valor', 'Status']} cols={cols} head />)
  orders.forEach((o, i) => add(`orders-${i}`, { x: 376, y: 838 + i * 31, w: 892, h: 28 }, 'text', () => <Row cells={o} cols={cols} />))

  // Channel bars.
  add('channels', { x: 1316, y: 756, w: 508, h: 240 }, 'panel', () => <div style={card} />, 14)
  add('channels-title', { x: 1340, y: 772, w: 260, h: 26 }, 'text', () => text({ color: ink, fontSize: 18, fontWeight: 650 }, 'Vendas por canal'))
  channels.forEach((c, i) => add(`channel-${i}`, { x: 1340, y: 812 + i * 34, w: 460, h: 24 }, 'block', p => <Bar label={c.label} value={c.value} p={p} />, 6))
  return L
}

function Spark({ values, p, color }: { values: number[]; p: number; color: string }) {
  const max = Math.max(...values), min = Math.min(...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${44 - ((v - min) / (max - min || 1)) * 38}`).join(' ')
  return <svg viewBox="0 0 100 48" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
    <polyline points={pts} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
}

function LineChart({ values, p }: { values: number[]; p: number }) {
  const W = 892, H = 264, top = 10, bottom = 30
  const max = Math.max(...values) * 1.08, min = Math.min(...values) * 0.85
  const xy = values.map((v, i) => [(i / (values.length - 1)) * W, top + (1 - (v - min) / (max - min)) * (H - top - bottom)] as const)
  const path = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const visible = Math.max(0.001, p)
  return <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
    <defs>
      <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={accent} stopOpacity={0.22} /><stop offset="1" stopColor={accent} stopOpacity={0} /></linearGradient>
      <clipPath id="rev-clip"><rect x={0} y={0} width={W * visible} height={H} /></clipPath>
    </defs>
    {[0, 1, 2, 3].map(i => <line key={i} x1={0} x2={W} y1={top + i * (H - top - bottom) / 3} y2={top + i * (H - top - bottom) / 3} stroke={line} strokeDasharray="4 6" />)}
    <g clipPath="url(#rev-clip)">
      <path d={`${path} L${W},${H - bottom} L0,${H - bottom} Z`} fill="url(#rev-fill)" />
      <path d={path} fill="none" stroke={accent} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
    </g>
    {['01/10', '08/10', '15/10', '22/10', '30/10'].map((d, i) => <text key={d} x={(i / 4) * W} y={H - 6} fontSize={13} fill={muted} textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>{d}</text>)}
    {p > 0.98 && <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r={6} fill="#fff" stroke={accent} strokeWidth={3} />}
  </svg>
}

function Donut({ p }: { p: number }) {
  const r = 84, c = 2 * Math.PI * r
  return <svg viewBox="0 0 220 220" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <circle cx={110} cy={110} r={r} fill="none" stroke="#eef2f7" strokeWidth={30} />
    {payments.map((pm, i) => {
      const len = (pm.value / 100) * c * p
      return <circle key={pm.label} cx={110} cy={110} r={r} fill="none" stroke={pm.color} strokeWidth={30} strokeDasharray={`${Math.max(0, len - 3)} ${c}`} strokeDashoffset={-paymentStarts[i] * c * p} transform="rotate(-90 110 110)" />
    })}
    <text x={110} y={106} textAnchor="middle" fontSize={30} fontWeight={700} fill={ink}>{Math.round(1248 * p).toLocaleString('pt-BR')}</text>
    <text x={110} y={130} textAnchor="middle" fontSize={13} fill={muted}>pedidos</text>
  </svg>
}

function Bar({ label, value, p }: { label: string; value: number; p: number }) {
  return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: ink }}>
    <span style={{ width: 104, flexShrink: 0 }}>{label}</span>
    <span style={{ flex: 1, height: 12, borderRadius: 6, background: '#eef2f7', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: `${(value / 42) * 100 * p}%`, borderRadius: 6, background: accent }} /></span>
    <b style={{ width: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(value * p)}%</b>
  </div>
}

function Row({ cells, cols, head }: { cells: string[]; cols: number[]; head?: boolean }) {
  return <div style={{ position: 'absolute', inset: 0, borderBottom: head ? '1px solid #e2e8f0' : '1px solid #f1f5f9', fontSize: head ? 12.5 : 14.5, color: head ? muted : ink, fontWeight: head ? 600 : 400, textTransform: head ? 'uppercase' : undefined, letterSpacing: head ? 0.5 : 0 }}>
    {cells.map((c, i) => <span key={i} style={{ position: 'absolute', left: cols[i], top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums' }}>
      {!head && i === 4 ? <em style={{ fontStyle: 'normal', fontSize: 12.5, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: c === 'Pago' ? '#dcfce7' : c === 'Pendente' ? '#fef3c7' : '#e0e7ff', color: c === 'Pago' ? '#15803d' : c === 'Pendente' ? '#b45309' : '#4338ca' }}>{c}</em> : c}
    </span>)}
  </div>
}

// ---------- schedule: which agent builds each layer, and when ----------

const layers = buildLayers()
const N = layers.length
const PANELS = ['kpi-0', 'kpi-1', 'kpi-2', 'kpi-3', 'rev', 'pay', 'orders', 'channels']
const roleOf = (id: string): Role =>
  /^kpi-\d-/.test(id) ? 'metricas'
    : /^(rev|pay|channel)s?-/.test(id) ? 'graficos'
      : id.startsWith('orders-') ? 'tabela'
        : 'layout'
// The layout agent lays down the frame and the empty cards first, so the others can start filling them early.
const layoutOrder = ['sidebar', ...PANELS, 'title', 'subtitle', 'date', 'export', 'logo']
const orderKey = (id: string) => { const i = layoutOrder.indexOf(id); return i < 0 ? layoutOrder.length : i }

type Stop = { x: number; y: number; w: number; h: number; start: number }
type Planned = Layer & { start: number; agent: number }
const plan: Planned[] = []
agents.forEach((ag, a) => {
  if (ag.role === 'revisor') return
  const mine = layers.filter(l => roleOf(l.id) === ag.role)
  if (ag.role === 'layout') mine.sort((p, q) => orderKey(p.id) - orderKey(q.id))
  mine.forEach((l, i) => plan.push({ ...l, start: ag.first + i * ag.step, agent: a }))
})

// The reviewer's pass: header, sidebar and each card, one after the other.
const REVIEWER = agents.findIndex(ag => ag.role === 'revisor')
const reviewTargets: Box[] = [
  { x: 340, y: 122, w: 470, h: 76 },
  { x: 80, y: 104, w: 240, h: SIDEBAR_H },
  ...PANELS.map(id => layers.find(l => l.id === id)!),
]
const reviews: Stop[] = reviewTargets.map((b, i) => ({ x: b.x, y: b.y, w: b.w, h: b.h, start: agents[REVIEWER].first + i * agents[REVIEWER].step }))
const DONE = reviews[reviews.length - 1].start + 26

// Where each cursor goes: to a layer's top-left and then drags it to size; the reviewer goes to each card's corner.
const stopsOf = (a: number) => a === REVIEWER
  ? reviews.map(r => ({ ax: r.x + r.w - 30, ay: r.y + 22, bx: r.x + r.w - 30, by: r.y + 22, start: r.start }))
  : plan.filter(l => l.agent === a).map(l => ({ ax: l.x, ay: l.y, bx: l.x + l.w, by: l.y + l.h, start: l.start }))
const routes = agents.map((_, a) => stopsOf(a))
const busy = routes.map(r => ({ from: r[0].start - 14, to: r[r.length - 1].start + 34 }))

// ---------- drawing ----------

function LayerView({ l, f }: { l: (typeof plan)[number]; f: number }) {
  const t = f - l.start
  if (t < 0) return null
  const grow = prog(f, l.start, 10)
  const skeleton = interpolate(t, [8, 14, 22, 32], [0, 1, 1, 0], clamp)
  const content = prog(f, l.start + 20, 14)
  const outline = interpolate(t, [0, 2, 30, 44], [0, 1, 1, 0], clamp)
  const badge = interpolate(t, [6, 10, 30, 38], [0, 1, 1, 0], clamp)
  const panel = l.kind === 'panel'
  return <>
    <div style={{ position: 'absolute', left: l.x, top: l.y, width: l.w, height: l.h, opacity: content }}>{l.render(content)}</div>
    {skeleton > 0 && <div style={{ position: 'absolute', left: l.x, top: l.y, width: l.w * grow, height: l.h * grow, opacity: skeleton, borderRadius: l.radius ?? 6,
      background: panel ? 'rgb(226 232 240 / .55)' : 'linear-gradient(90deg, #e2e8f0, #f1f5f9, #e2e8f0)', backgroundSize: '200% 100%', backgroundPosition: `${(t * 6) % 200}% 0` }} />}
    {outline > 0 && <div style={{ position: 'absolute', left: l.x, top: l.y, width: l.w * grow, height: l.h * grow, opacity: outline, boxShadow: `inset 0 0 0 1.5px ${OUTLINE}`, borderRadius: 2 }}>
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([cx, cy]) => <i key={`${cx}${cy}`} style={{ position: 'absolute', left: `calc(${cx * 100}% - 4px)`, top: `calc(${cy * 100}% - 4px)`, width: 8, height: 8, background: '#fff', border: `1.5px solid ${OUTLINE}` }} />)}
    </div>}
    {badge > 0 && <div style={{ position: 'absolute', left: l.x + l.w / 2, top: l.y + l.h + 8, transform: 'translateX(-50%)', opacity: badge, padding: '2px 7px', borderRadius: 5, background: OUTLINE, color: '#fff', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', zIndex: 5 }}>
      {Math.round(l.w)} × {Math.round(l.h)}
    </div>}
  </>
}

/** The reviewer's mark on a block: a green outline that flashes, and a ✓ that stays. */
function ReviewMark({ r, f }: { r: Stop; f: number }) {
  const t = f - r.start
  if (t < 0) return null
  const ring = interpolate(t, [0, 4, 12, 22], [0, 1, 1, 0], clamp)
  const pop = interpolate(t, [3, 9], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) })
  const fade = interpolate(f, [DONE + 10, DONE + 28], [1, 0], clamp)
  return <>
    {ring > 0 && <div style={{ position: 'absolute', left: r.x - 4, top: r.y - 4, width: r.w + 8, height: r.h + 8, borderRadius: 16, boxShadow: `0 0 0 2.5px ${CHECK}, 0 0 24px rgb(22 163 74 / .35)`, opacity: ring, zIndex: 6 }} />}
    <div style={{ position: 'absolute', left: r.x + r.w - 44, top: r.y + 8, width: 28, height: 28, borderRadius: '50%', background: CHECK, color: '#fff', display: 'grid', placeItems: 'center',
      fontSize: 16, fontWeight: 800, transform: `scale(${pop})`, opacity: fade, boxShadow: '0 4px 12px rgb(22 163 74 / .4)', zIndex: 7 }}>✓</div>
  </>
}

function Cursor({ a, f }: { a: number; f: number }) {
  const mine = routes[a]
  const { color, name } = agents[a]
  const spawn = { x: 360 + a * 300, y: 1060 }
  // The stop it is heading to or working on: the last one whose travel already began. Travel takes up to 14 frames,
  // less when the stops come quickly.
  const travel = (i: number) => i === 0 ? 14 : Math.max(6, Math.min(14, mine[i].start - mine[i - 1].start - 4))
  let k = -1
  for (let i = 0; i < mine.length; i++) if (f >= mine[i].start - travel(i)) k = i
  if (k < 0) return null
  const cur = mine[k]
  const prev = k > 0 ? { x: mine[k - 1].bx, y: mine[k - 1].by } : spawn
  let x: number, y: number
  // Once its work is done, the cursor rests in the empty lower part of the sidebar, out of the way.
  const park = { x: 112, y: 640 + a * 64 }
  const end = busy[a].to - 14
  if (f < cur.start) {
    const p = interpolate(f, [cur.start - travel(k), cur.start], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
    x = prev.x + (cur.ax - prev.x) * p; y = prev.y + (cur.ay - prev.y) * p
  } else if (k === mine.length - 1 && f >= end && a !== REVIEWER) {
    const p = interpolate(f, [end, end + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
    x = cur.bx + (park.x - cur.bx) * p; y = cur.by + (park.y - cur.by) * p
    x += Math.sin((f + a * 13) / 14) * 4; y += Math.cos((f + a * 7) / 16) * 3
  } else {
    const g = prog(f, cur.start, 10)
    x = cur.ax + (cur.bx - cur.ax) * g; y = cur.ay + (cur.by - cur.ay) * g
    // Small wander while it finishes.
    x += Math.sin((f + a * 13) / 9) * 6; y += Math.cos((f + a * 7) / 11) * 5
  }
  const appear = interpolate(f, [mine[0].start - 14, mine[0].start - 8], [0, 1], clamp)
  const leave = interpolate(f, [DONE, DONE + 18], [1, 0], clamp)
  return <div style={{ position: 'absolute', left: x, top: y, opacity: appear * leave, zIndex: 20, pointerEvents: 'none' }}>
    <svg width={24} height={26} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / .35))' }}>
      <path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill={color} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
    <span style={{ position: 'absolute', ...(x > 1640 ? { right: 8 } : { left: 18 }), top: 22, padding: '3px 9px', borderRadius: 7, background: color, color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgb(0 0 0 / .25)' }}>{name}</span>
  </div>
}

function AgentBar({ f }: { f: number }) {
  const built = plan.filter(l => f >= l.start + 34).length
  const done = f >= DONE
  const show = interpolate(f, [4, 16], [0, 1], clamp)
  return <div style={{ position: 'absolute', left: '50%', bottom: 26, transform: `translateX(-50%) translateY(${(1 - show) * 30}px)`, opacity: show, zIndex: 30,
    display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px', borderRadius: 14, background: 'rgb(17 19 24 / .92)', boxShadow: '0 12px 40px rgb(0 0 0 / .45)', color: '#e5e7eb', fontSize: 16, fontWeight: 500, whiteSpace: 'nowrap' }}>
    <span style={{ display: 'flex', gap: 14 }}>{agents.map((ag, a) => {
      const on = f >= busy[a].from && f < busy[a].to
      return <span key={ag.role} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: on ? '#fff' : '#6b7280' }}>
        <i style={{ width: 10, height: 10, borderRadius: '50%', background: ag.color, opacity: on ? 1 : done ? 0.7 : 0.3, boxShadow: on ? `0 0 0 3px ${ag.color}44` : 'none' }} />{ag.name}
      </span>
    })}</span>
    <span style={{ width: 1, height: 18, background: '#374151' }} />
    {done ? <span><b style={{ color: '#4ade80' }}>✓ Dashboard pronto</b> · {N} camadas · {agents.length} agentes</span>
      : <span style={{ fontVariantNumeric: 'tabular-nums' }}><b style={{ color: '#fff' }}>{agents.length}</b> agentes · <b style={{ color: '#fff' }}>{built}</b> / {N} camadas</span>}
    <span style={{ width: 1, height: 18, background: '#374151' }} />
    <span style={{ color: done ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: done ? '#4ade80' : '#f87171', opacity: done ? 1 : 0.5 + 0.5 * Math.abs(Math.sin(f / 8)) }} />{done ? 'Concluído' : 'Ao vivo'}</span>
    <span style={{ color: '#9ca3af' }}>1×</span>
  </div>
}

export function DashboardBuildAgents() {
  const f = useCurrentFrame()
  const fadeIn = prog(f, 0, 18)
  return <AbsoluteFill style={{ background: '#f6f7f9', overflow: 'hidden' }}>
    {/* The dashboard fills the frame: its layout area (from x 80, y 104, 1760 wide) is scaled to the full width. */}
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: fadeIn, transformOrigin: '0 0', transform: `scale(${SCALE}) translate(${-ORIGIN.x}px, ${-ORIGIN.y}px)` }}>
      {plan.map(l => <LayerView key={l.id} l={l} f={f} />)}
      {reviews.map((r, i) => <ReviewMark key={i} r={r} f={f} />)}
      {agents.map((ag, a) => <Cursor key={ag.role} a={a} f={f} />)}
    </div>
    <AgentBar f={f} />
  </AbsoluteFill>
}

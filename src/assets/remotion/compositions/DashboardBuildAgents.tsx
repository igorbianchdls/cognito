import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

// "Criando um Dashboard": an ads dashboard put together live by five AI agents, each with its own job
// (layout, metrics, charts, table, review). Each agent is a colored cursor with its name; each piece of the screen
// is a layer that goes outline (with its size) → gray skeleton → real content. The reviewer closes by checking
// every block. A floating bar shows the agents and counts layers. 1920×1080, 30 fps. All data is made up.

export const DASHBOARD_BUILD_WIDTH = 1920
export const DASHBOARD_BUILD_HEIGHT = 1080
/** Playback speed: the whole build runs 30% faster than the timings below, which are written at 1×. */
const SPEED = 1.3
export const DASHBOARD_BUILD_DURATION = Math.round(600 / SPEED)

type Role = 'layout' | 'metricas' | 'graficos' | 'tabela' | 'revisor'
const agents: { role: Role; name: string; color: string; first: number; step: number }[] = [
  { role: 'layout', name: 'Agente de Layout', color: '#3b82f6', first: 24, step: 9 },
  { role: 'metricas', name: 'Agente de Métricas', color: '#22c55e', first: 70, step: 13 },
  { role: 'graficos', name: 'Agente de Gráficos', color: '#8b5cf6', first: 100, step: 15 },
  { role: 'tabela', name: 'Agente de Tabela', color: '#f59e0b', first: 120, step: 20 },
  { role: 'revisor', name: 'Agente Revisor', color: '#ec4899', first: 336, step: 12 },
]
const OUTLINE = '#3b82f6'
const CHECK = '#16a34a'

const ease = Easing.bezier(0.22, 1, 0.36, 1)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const prog = (f: number, start: number, len: number) => interpolate(f, [start, start + len], [0, 1], { ...clamp, easing: ease })

// ---------- the dashboard (made-up numbers) ----------

const ink = '#0b1534', muted = '#5b6478', grid = '#e7ebf3', blue = '#1d6ff2', magenta = '#d63fd6', green = '#16a34a'
const BG = '#f3f5fa'

type IconName = 'home' | 'megaphone' | 'layers' | 'image' | 'users' | 'grid' | 'bars' | 'eye' | 'cursor' | 'target' | 'coins' | 'calendar' | 'chevron' | 'arrow' | 'info' | 'dots' | 'down'
const iconPaths: Record<IconName, string> = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  megaphone: 'M3 10v4a1 1 0 0 0 1 1h3l7 4V5L7 9H4a1 1 0 0 0-1 1zM7 15l1.5 5M18 8.5a5 5 0 0 1 0 7',
  layers: 'M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5',
  image: 'M4 4h16v16H4zM9 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 17l5-5 4 4 3-3 4 4',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  bars: 'M5 20v-6M12 20V8M19 20V4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  cursor: 'M5 3l14 7-6 2-2 6z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12.5v-1',
  coins: 'M12 9c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  chevron: 'M6 9l6 6 6-6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.5',
  dots: 'M12 5v.5M12 12v.5M12 19v.5',
  down: 'M12 5v14M6 13l6 6 6-6',
}
function Icon({ name, size = 24, color = 'currentColor', width = 2 }: { name: IconName; size?: number; color?: string; width?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    <path d={iconPaths[name]} />
  </svg>
}

const kpis: { label: string; icon: IconName; tint: string; fg: string; value: number; cents?: boolean; money?: boolean; suffix?: string; delta: string; up: boolean; note?: string; weight: number }[] = [
  { label: 'Investimento', icon: 'megaphone', tint: '#e3edff', fg: blue, value: 2625.44, money: true, cents: true, delta: '+12,8%', up: true, note: 'vs. período anterior', weight: 1.35 },
  { label: 'Alcance', icon: 'users', tint: '#dcf5e5', fg: green, value: 82614, delta: '+18,4%', up: true, weight: 1 },
  { label: 'Impressões', icon: 'eye', tint: '#ede7ff', fg: '#7c3aed', value: 160328, delta: '+16,9%', up: true, weight: 1.1 },
  { label: 'Cliques (CTR)', icon: 'cursor', tint: '#e3edff', fg: blue, value: 5614, suffix: '(3,50%)', delta: '+22,1%', up: true, weight: 1.2 },
  { label: 'Leads', icon: 'target', tint: '#fbe3f7', fg: magenta, value: 412, delta: '+26,8%', up: true, weight: 0.85 },
  // A lower cost per lead is good news, so the arrow points down and stays green.
  { label: 'Custo por Lead', icon: 'coins', tint: '#fff1d6', fg: '#d97706', value: 6.37, money: true, cents: true, delta: '−11,4%', up: false, weight: 1 },
]
const leads = [7, 10, 12, 12, 11, 14, 18, 17, 15, 16, 19, 22, 21, 22, 21, 20, 24, 26, 25, 23, 26, 30, 29, 30, 32, 31, 34, 35, 37, 40]
const TIP = 21 // 22 jan
const platforms = [{ label: 'Feed', value: 68, count: 280, color: blue }, { label: 'Stories', value: 32, count: 132, color: magenta }]
const funnel: { label: string; value: string; icon: IconName; tint: string; fg: string }[] = [
  { label: 'Impressões', value: '160.328', icon: 'eye', tint: '#e6efff', fg: blue },
  { label: 'Cliques', value: '5.614 (3,50%)', icon: 'cursor', tint: '#efe8ff', fg: '#7c3aed' },
  { label: 'Leads', value: '412 (7,33%)', icon: 'users', tint: '#e1f6e8', fg: green },
]
type Scene = 'chair' | 'kitchen' | 'sofa'
const campaigns: { name: string; active: boolean; results: number; cost: string; spend: string; roas: string; scene: Scene }[] = [
  { name: 'Geração de Leads – Site', active: true, results: 298, cost: 'R$ 6,28', spend: 'R$ 1.870,06', roas: '5,37', scene: 'chair' },
  { name: 'Remarketing – Leads', active: true, results: 114, cost: 'R$ 6,62', spend: 'R$ 755,38', roas: '4,92', scene: 'kitchen' },
  { name: 'Conversão – WhatsApp', active: false, results: 0, cost: '—', spend: '—', roas: '—', scene: 'sofa' },
]
const creatives: { scene: Scene; leads: number; delta: string; video?: boolean }[] = [
  { scene: 'chair', leads: 124, delta: '+34%', video: true }, { scene: 'kitchen', leads: 98, delta: '+22%' }, { scene: 'sofa', leads: 76, delta: '+18%' },
]
const nav: { label: string; icon: IconName }[] = [
  { label: 'Dashboard', icon: 'home' }, { label: 'Campanhas', icon: 'megaphone' }, { label: 'Conjuntos', icon: 'layers' }, { label: 'Anúncios', icon: 'image' },
  { label: 'Públicos', icon: 'users' }, { label: 'Criativos', icon: 'grid' }, { label: 'Relatórios', icon: 'bars' },
]

const num = (v: number, cents = false) => v.toLocaleString('pt-BR', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })

// ---------- layers ----------

type Box = { x: number; y: number; w: number; h: number }
type Layer = Box & { id: string; kind: 'panel' | 'text' | 'block'; radius?: number; render: (p: number) => ReactNode }

const card: CSSProperties = { position: 'absolute', inset: 0, background: '#fff', borderRadius: 20, boxShadow: '0 1px 2px rgb(16 24 40 / .04), 0 10px 30px rgb(16 24 40 / .06), 0 0 0 1px #e9edf5' }
const text = (style: CSSProperties, children: ReactNode) => <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', ...style }}>{children}</div>
const cardTitle = (t: string, extra?: ReactNode) => text({ gap: 10, color: ink, fontSize: 23, fontWeight: 700, letterSpacing: -0.3 }, <>{t}{extra}</>)

// Layout grid.
const MAIN = 316, RIGHT = 1896, GAP = 18
const KPI_Y = 128, KPI_H = 168
const R2_Y = 316, R2_H = 320
const R3_Y = 656, R3_H = 334

function buildLayers(): Layer[] {
  const L: Layer[] = []
  const add = (id: string, b: Box, kind: Layer['kind'], render: Layer['render'], radius?: number) => L.push({ id, ...b, kind, render, radius })

  // Sidebar.
  add('sidebar', { x: 0, y: 0, w: 292, h: 1080 }, 'panel', () => <div style={{ position: 'absolute', inset: 0, background: '#fbfcfe', boxShadow: 'inset -1px 0 0 #e6eaf2' }} />, 0)
  add('logo', { x: 36, y: 30, w: 230, h: 52 }, 'text', () => text({ gap: 12, color: ink, fontSize: 31, fontWeight: 800, letterSpacing: -0.6 }, <>
    <span style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg, #3b8bff, ${blue})`, display: 'grid', placeItems: 'center', boxShadow: '0 6px 14px rgb(29 111 242 / .35)' }}><Icon name="megaphone" size={26} color="#fff" width={2.2} /></span>Otto Ads</>))
  nav.forEach((n, i) => add(`nav-${i}`, { x: 18, y: 128 + i * 62, w: 256, h: 54 }, 'text', () => text({ gap: 18, paddingLeft: 20, borderRadius: 14, background: i === 0 ? '#e6efff' : 'transparent', color: i === 0 ? blue : '#2a3350', fontSize: 21, fontWeight: i === 0 ? 700 : 500 }, <>
    <Icon name={n.icon} size={26} color={i === 0 ? blue : '#3a4360'} />{n.label}</>), 14))
  add('accounts', { x: 18, y: 900, w: 256, h: 150 }, 'block', () => <div style={{ ...card, borderRadius: 18, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <span style={{ display: 'flex', gap: 10 }}>
      <i style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, #4c9bff, ${blue})` }} />
      <i style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(45deg, #f9a825, #e91e63 55%, #8e24aa)' }} />
    </span>
    <span style={{ color: ink, fontSize: 19, fontWeight: 500 }}>Contas conectadas</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: ink, fontSize: 17 }}><i style={{ width: 10, height: 10, borderRadius: '50%', background: green }} />2 contas ativas</span>
  </div>, 18)

  // Header.
  add('title', { x: MAIN, y: 18, w: 360, h: 62 }, 'text', () => text({ color: ink, fontSize: 48, fontWeight: 800, letterSpacing: -1.2 }, 'Anúncios'))
  add('subtitle', { x: MAIN, y: 80, w: 640, h: 30 }, 'text', () => text({ color: '#3a4360', fontSize: 21 }, 'Desempenho dos seus anúncios no Feed e nos Stories'))
  add('date', { x: 1150, y: 22, w: 350, h: 74 }, 'block', () => <div style={{ ...card, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px' }}>
    <Icon name="calendar" size={28} color="#3a4360" />
    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}><b style={{ color: ink, fontSize: 20 }}>Últimos 30 dias</b><span style={{ color: muted, fontSize: 16 }}>1 jan – 30 jan 2025</span></span>
    <span style={{ marginLeft: 'auto' }}><Icon name="chevron" size={24} color="#3a4360" /></span>
  </div>, 16)
  add('account', { x: 1520, y: 22, w: 376, h: 74 }, 'block', () => <div style={{ ...card, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px' }}>
    <span style={{ position: 'relative', width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #c9a27e, #6b4f3a)' }}><i style={{ position: 'absolute', right: -1, bottom: -1, width: 13, height: 13, borderRadius: '50%', background: green, boxShadow: '0 0 0 2.5px #fff' }} /></span>
    <span style={{ color: ink, fontSize: 20, fontWeight: 500 }}>Minha Empresa</span>
    <span style={{ marginLeft: 'auto' }}><Icon name="chevron" size={24} color="#3a4360" /></span>
  </div>, 16)

  // KPI cards: widths follow each card's weight.
  const unit = (RIGHT - MAIN - GAP * (kpis.length - 1)) / kpis.reduce((n, k) => n + k.weight, 0)
  let kx = MAIN
  kpis.forEach((k, i) => {
    const w = Math.round(k.weight * unit), x = kx, y = KPI_Y
    kx += w + GAP
    add(`kpi-${i}`, { x, y, w, h: KPI_H }, 'panel', () => <div style={{ ...card, background: i === 0 ? 'linear-gradient(180deg, #f5f8ff, #fff)' : '#fff' }} />, 20)
    add(`kpi-${i}-label`, { x: x + 22, y: y + 22, w: w - 44, h: 40 }, 'text', () => text({ gap: 12, color: ink, fontSize: 19, fontWeight: 500 }, <>
      <span style={{ width: 40, height: 40, borderRadius: 11, background: k.tint, display: 'grid', placeItems: 'center' }}><Icon name={k.icon} size={22} color={k.fg} width={2.2} /></span>{k.label}</>))
    add(`kpi-${i}-value`, { x: x + 22, y: y + 72, w: w - 44, h: 48 }, 'text', p => text({ gap: 8, color: ink, fontSize: 38, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }, <>
      {k.money ? `R$ ${num(k.value * p, k.cents)}` : num(Math.round(k.value * p))}{k.suffix && <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: 0 }}>{k.suffix}</span>}</>))
    add(`kpi-${i}-delta`, { x: x + 22, y: y + 126, w: w - 44, h: 26 }, 'text', () => text({ gap: 8 }, <>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: green, fontSize: 19, fontWeight: 700 }}><span style={{ transform: `rotate(${k.up ? -90 : 90}deg)`, display: 'inline-flex' }}><Icon name="arrow" size={20} color={green} width={2.6} /></span>{k.delta}</span>
      {k.note && <span style={{ color: muted, fontSize: 15 }}>{k.note}</span>}</>))
  })

  // Row 2: leads over time, leads by placement, funnel.
  const leadsW = 948, platX = MAIN + leadsW + GAP, platW = 290, funX = platX + platW + GAP, funW = RIGHT - funX
  add('leads', { x: MAIN, y: R2_Y, w: leadsW, h: R2_H }, 'panel', () => <div style={card} />, 20)
  add('leads-title', { x: MAIN + 26, y: R2_Y + 22, w: 300, h: 34 }, 'text', () => cardTitle('Evolução de Leads', <Icon name="info" size={22} color={muted} />))
  add('leads-total', { x: MAIN + leadsW - 300, y: R2_Y + 20, w: 274, h: 38 }, 'text', p => text({ justifyContent: 'flex-end', gap: 14, color: ink, fontSize: 21 }, <>
    <span><b style={{ fontSize: 28, fontWeight: 800 }}>{Math.round(412 * p)}</b> leads</span><span style={{ width: 1, height: 22, background: grid }} />
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: green, fontWeight: 700, fontSize: 19 }}><span style={{ transform: 'rotate(-90deg)', display: 'inline-flex' }}><Icon name="arrow" size={18} color={green} width={2.6} /></span>+26,8%</span></>))
  add('leads-chart', { x: MAIN + 22, y: R2_Y + 72, w: leadsW - 48, h: R2_H - 92 }, 'block', p => <LeadsChart p={p} w={leadsW - 48} h={R2_H - 92} />, 8)

  add('plat', { x: platX, y: R2_Y, w: platW, h: R2_H }, 'panel', () => <div style={card} />, 20)
  add('plat-title', { x: platX + 22, y: R2_Y + 22, w: platW - 44, h: 34 }, 'text', () => cardTitle('Leads por plataforma'))
  add('plat-donut', { x: platX + (platW - 168) / 2, y: R2_Y + 66, w: 168, h: 168 }, 'block', p => <Donut p={p} />, 84)
  platforms.forEach((pl, i) => add(`plat-leg-${i}`, { x: platX + 26, y: R2_Y + 246 + i * 34, w: platW - 52, h: 28 }, 'text', () => text({ gap: 10, color: ink, fontSize: 17 }, <>
    <span style={{ width: 16, height: 16, borderRadius: 4, background: pl.color }} />{pl.label}
    <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}><b>{pl.value}%</b> ({pl.count})</span></>)))

  add('funnel', { x: funX, y: R2_Y, w: funW, h: R2_H }, 'panel', () => <div style={card} />, 20)
  add('funnel-title', { x: funX + 22, y: R2_Y + 22, w: funW - 44, h: 34 }, 'text', () => cardTitle('Funil do anúncio'))
  funnel.forEach((s, i) => add(`funnel-${i}`, { x: funX + 18, y: R2_Y + 72 + i * 82, w: funW - 36, h: 56 }, 'block', () => <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: s.tint, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', color: ink, fontSize: 18, whiteSpace: 'nowrap' }}>
    {i > 0 && <span style={{ position: 'absolute', left: '50%', top: -26, transform: 'translateX(-50%)' }}><Icon name="down" size={20} color="#3a4360" /></span>}
    <Icon name={s.icon} size={24} color={s.fg} width={2.2} />{s.label}<b style={{ marginLeft: 'auto', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.value}</b>
  </div>, 14))

  // Row 3: campaigns table, best creatives.
  const campW = 1000, crtX = MAIN + campW + GAP, crtW = RIGHT - crtX
  add('camp', { x: MAIN, y: R3_Y, w: campW, h: R3_H }, 'panel', () => <div style={card} />, 20)
  add('camp-title', { x: MAIN + 26, y: R3_Y + 22, w: 400, h: 34 }, 'text', () => cardTitle('Desempenho por campanha'))
  add('camp-link', { x: MAIN + campW - 180, y: R3_Y + 24, w: 154, h: 30 }, 'text', () => text({ justifyContent: 'flex-end', gap: 8, color: blue, fontSize: 18, fontWeight: 500 }, <>Ver todas<Icon name="arrow" size={20} color={blue} /></>))
  add('camp-head', { x: MAIN + 26, y: R3_Y + 70, w: campW - 52, h: 36 }, 'text', () => <CampRow head />)
  campaigns.forEach((c, i) => add(`camp-${i}`, { x: MAIN + 26, y: R3_Y + 112 + i * 72, w: campW - 52, h: 66 }, 'text', () => <CampRow c={c} last={i === campaigns.length - 1} />))

  add('crt', { x: crtX, y: R3_Y, w: crtW, h: R3_H }, 'panel', () => <div style={card} />, 20)
  add('crt-title', { x: crtX + 24, y: R3_Y + 22, w: crtW - 48, h: 34 }, 'text', () => text({ justifyContent: 'space-between', color: ink, fontSize: 23, fontWeight: 700, letterSpacing: -0.3 }, <>Melhores criativos (Leads)<Icon name="arrow" size={26} color={ink} /></>))
  const cw = Math.floor((crtW - 48 - 2 * 14) / 3)
  creatives.forEach((c, i) => add(`crt-${i}`, { x: crtX + 24 + i * (cw + 14), y: R3_Y + 72, w: cw, h: R3_H - 92 }, 'block', () => <div style={{ ...card, borderRadius: 14, overflow: 'hidden', boxShadow: '0 0 0 1px #e9edf5' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 160 }}><SceneArt scene={c.scene} />
      <span style={{ position: 'absolute', left: 12, top: 12, opacity: 0.95 }}>{c.video ? <svg width={22} height={22} viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="#fff" /></svg> : <Icon name="image" size={22} color="#fff" />}</span>
    </div>
    <div style={{ position: 'absolute', left: 14, top: 172, color: ink, fontSize: 20, fontWeight: 600 }}>{c.leads} leads</div>
    <div style={{ position: 'absolute', left: 14, top: 202, display: 'flex', alignItems: 'center', gap: 4, color: green, fontSize: 17, fontWeight: 700 }}><span style={{ transform: 'rotate(-90deg)', display: 'inline-flex' }}><Icon name="arrow" size={17} color={green} width={2.6} /></span>{c.delta}</div>
  </div>, 14))
  return L
}

// Table columns: campaign, results, cost per result, spend, ROAS, menu.
const cols: { left: number; width: number; align: 'left' | 'right' | 'center' }[] = [
  { left: 0, width: 380, align: 'left' }, { left: 380, width: 110, align: 'right' }, { left: 520, width: 200, align: 'center' },
  { left: 720, width: 150, align: 'center' }, { left: 860, width: 60, align: 'center' }, { left: 920, width: 28, align: 'center' },
]
function CampRow({ c, head, last }: { c?: (typeof campaigns)[number]; head?: boolean; last?: boolean }) {
  const cell = (i: number, children: ReactNode) => <span key={i} style={{ position: 'absolute', left: cols[i].left, width: cols[i].width, top: 0, bottom: 0, display: 'flex', alignItems: 'center',
    justifyContent: cols[i].align === 'left' ? 'flex-start' : cols[i].align === 'right' ? 'flex-end' : 'center', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{children}</span>
  if (head || !c) return <div style={{ position: 'absolute', inset: 0, borderBottom: `1px solid ${grid}`, color: ink, fontSize: 17, fontWeight: 600 }}>
    {['Campanha', 'Resultados', 'Custo por resultado', 'Investimento', 'ROAS'].map((t, i) => cell(i, t))}
  </div>
  return <div style={{ position: 'absolute', inset: 0, borderBottom: last ? 'none' : `1px solid ${grid}`, color: ink, fontSize: 19 }}>
    {cell(0, <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ position: 'relative', width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}><SceneArt scene={c.scene} /></span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b style={{ color: '#1b2a6b', fontWeight: 600 }}>{c.name}</b>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: muted, fontSize: 16 }}><i style={{ width: 9, height: 9, borderRadius: '50%', background: c.active ? green : '#8a93a6' }} />{c.active ? 'Ativa' : 'Pausada'}</span></span>
    </span>)}
    {cell(1, <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}><b style={{ fontWeight: 700 }}>{c.results}</b><span style={{ color: muted, fontSize: 15 }}>Leads</span></span>)}
    {cell(2, c.cost)}{cell(3, c.spend)}{cell(4, c.roas)}{cell(5, <Icon name="dots" size={24} color="#3a4360" width={3} />)}
  </div>
}

/** Simple made-up product photos: warm interiors drawn with shapes. */
function SceneArt({ scene }: { scene: Scene }) {
  return <svg viewBox="0 0 160 140" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
    <defs><linearGradient id={`wall-${scene}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f1e4d3" /><stop offset="1" stopColor="#dcc3a3" /></linearGradient></defs>
    <rect width={160} height={140} fill={`url(#wall-${scene})`} />
    <rect y={108} width={160} height={32} fill="#c9a47c" />
    {scene === 'chair' && <g>
      <rect x={20} y={20} width={2} height={88} fill="#d8c2a6" />
      <rect x={52} y={44} width={58} height={44} rx={14} fill="#ead9c3" />
      <rect x={44} y={70} width={74} height={22} rx={10} fill="#f3e6d4" />
      <rect x={40} y={60} width={12} height={32} rx={6} fill="#e4d0b6" /><rect x={110} y={60} width={12} height={32} rx={6} fill="#e4d0b6" />
      <path d="M50 92l-4 18M112 92l4 18" stroke="#8a6a48" strokeWidth={3} strokeLinecap="round" />
      <rect x={124} y={84} width={20} height={24} rx={3} fill="#a37b52" />
    </g>}
    {scene === 'kitchen' && <g>
      <rect x={0} y={78} width={160} height={30} fill="#b88a5c" />
      <rect x={0} y={74} width={160} height={6} fill="#efe6da" />
      {[8, 48, 88, 128].map(x => <rect key={x} x={x} y={84} width={32} height={20} rx={2} fill="#c79a6b" />)}
      <rect x={10} y={22} width={140} height={22} rx={2} fill="#c49468" />
      <rect x={14} y={46} width={132} height={3} fill="#ffe7b0" opacity={0.9} />
      <circle cx={40} cy={64} r={6} fill="#e9dccb" /><rect x={100} y={58} width={10} height={16} rx={2} fill="#8fa77e" />
    </g>}
    {scene === 'sofa' && <g>
      <rect x={24} y={58} width={90} height={30} rx={10} fill="#e2d2bd" />
      <rect x={18} y={78} width={104} height={24} rx={10} fill="#ecdfcd" />
      <path d="M28 102l-2 8M112 102l2 8" stroke="#8a6a48" strokeWidth={3} strokeLinecap="round" />
      <rect x={128} y={88} width={18} height={20} rx={3} fill="#efe6da" />
      {[[-30, 0], [0, -6], [28, 2], [-14, -14], [16, -16]].map(([r, dy], i) => <ellipse key={i} cx={137} cy={70 + dy} rx={6} ry={18} fill={i % 2 ? '#5f8a4b' : '#77a35d'} transform={`rotate(${r} 137 ${88})`} />)}
    </g>}
  </svg>
}

/** Smooth line through the points (Catmull-Rom as cubic Béziers). */
function smooth(pts: (readonly [number, number])[]) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

function LeadsChart({ p, w, h }: { p: number; w: number; h: number }) {
  const left = 40, right = 14, top = 10, bottom = 30, max = 50
  const pw = w - left - right, ph = h - top - bottom
  const xy = leads.map((v, i) => [left + (i / (leads.length - 1)) * pw, top + (1 - v / max) * ph] as const)
  const path = smooth(xy)
  const tip = xy[TIP]
  return <svg viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
    <defs>
      <linearGradient id="leads-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={blue} stopOpacity={0.32} /><stop offset="1" stopColor={blue} stopOpacity={0.04} /></linearGradient>
      <clipPath id="leads-clip"><rect x={0} y={0} width={left + pw * Math.max(0.001, p)} height={h} /></clipPath>
    </defs>
    {[0, 10, 20, 30, 40, 50].map(v => { const y = top + (1 - v / max) * ph; return <g key={v}>
      <line x1={left} x2={left + pw} y1={y} y2={y} stroke={grid} />
      <text x={left - 12} y={y + 5} fontSize={15} fill="#3a4360" textAnchor="end">{v}</text></g> })}
    {[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 29].map(i => <text key={i} x={xy[i][0]} y={h - 6} fontSize={15} fill="#3a4360" textAnchor="middle">{i + 1} jan</text>)}
    <g clipPath="url(#leads-clip)">
      <path d={`${path} L${left + pw},${top + ph} L${left},${top + ph} Z`} fill="url(#leads-fill)" />
      <path d={path} fill="none" stroke={blue} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
    </g>
    {p > 0.92 && <g opacity={interpolate(p, [0.92, 1], [0, 1], clamp)}>
      <line x1={tip[0]} x2={tip[0]} y1={tip[1]} y2={top + ph} stroke="#94a3b8" strokeDasharray="4 5" />
      <circle cx={tip[0]} cy={tip[1]} r={8} fill="#fff" stroke={blue} strokeWidth={3.5} />
      <g transform={`translate(${tip[0] - 52}, ${tip[1] - 84})`}>
        <rect width={104} height={60} rx={8} fill="#fff" stroke="#e5e9f2" />
        <text x={12} y={24} fontSize={15} fill="#3a4360">22 jan</text>
        <circle cx={17} cy={43} r={5} fill={blue} />
        <text x={28} y={48} fontSize={15} fontWeight={700} fill={ink}>{leads[TIP]} leads</text>
      </g>
    </g>}
  </svg>
}

function Donut({ p }: { p: number }) {
  const r = 66, c = 2 * Math.PI * r
  return <svg viewBox="0 0 168 168" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <circle cx={84} cy={84} r={r} fill="none" stroke="#eef2f7" strokeWidth={24} />
    <circle cx={84} cy={84} r={r} fill="none" stroke={blue} strokeWidth={24} strokeDasharray={`${0.68 * c * p} ${c}`} transform="rotate(-90 84 84)" />
    <circle cx={84} cy={84} r={r} fill="none" stroke={magenta} strokeWidth={24} strokeDasharray={`${0.32 * c * p} ${c}`} strokeDashoffset={-0.68 * c * p} transform="rotate(-90 84 84)" />
    <text x={84} y={88} textAnchor="middle" fontSize={34} fontWeight={800} fill={ink}>{Math.round(412 * p)}</text>
    <text x={84} y={112} textAnchor="middle" fontSize={16} fill={muted}>Leads</text>
  </svg>
}

// ---------- schedule: which agent builds each layer, and when ----------

const layers = buildLayers()
const N = layers.length
const PANELS = ['kpi-0', 'kpi-1', 'kpi-2', 'kpi-3', 'kpi-4', 'kpi-5', 'leads', 'camp', 'plat', 'funnel', 'crt']
const roleOf = (id: string): Role =>
  /^kpi-\d-/.test(id) ? 'metricas'
    : /^(leads|plat|funnel)-/.test(id) ? 'graficos'
      : /^(camp|crt)-/.test(id) ? 'tabela'
        : 'layout'
// The layout agent lays down the frame and the empty cards first, so the others can start filling them early.
const layoutOrder = ['sidebar', ...PANELS, 'title', 'subtitle', 'date', 'account', 'logo']
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
  { x: MAIN - 12, y: 12, w: 680, h: 104 },
  { x: 0, y: 0, w: 292, h: 1080 },
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
      background: panel ? 'rgb(222 228 240 / .6)' : 'linear-gradient(90deg, #e2e8f0, #f1f5f9, #e2e8f0)', backgroundSize: '200% 100%', backgroundPosition: `${(t * 6) % 200}% 0` }} />}
    {outline > 0 && <div style={{ position: 'absolute', left: l.x, top: l.y, width: l.w * grow, height: l.h * grow, opacity: outline, boxShadow: `inset 0 0 0 1.5px ${OUTLINE}`, borderRadius: 2 }}>
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([cx, cy]) => <i key={`${cx}${cy}`} style={{ position: 'absolute', left: `calc(${cx * 100}% - 4px)`, top: `calc(${cy * 100}% - 4px)`, width: 8, height: 8, background: '#fff', border: `1.5px solid ${OUTLINE}` }} />)}
    </div>}
    {badge > 0 && <div style={{ position: 'absolute', left: l.x + l.w / 2, top: Math.min(l.y + l.h + 8, 1046), transform: 'translateX(-50%)', opacity: badge, padding: '2px 7px', borderRadius: 5, background: OUTLINE, color: '#fff', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', zIndex: 5 }}>
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
    {ring > 0 && <div style={{ position: 'absolute', left: r.x - 4, top: r.y - 4, width: r.w + 8, height: r.h + 8, borderRadius: 22, boxShadow: `0 0 0 2.5px ${CHECK}, 0 0 24px rgb(22 163 74 / .35)`, opacity: ring, zIndex: 6 }} />}
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
  // Once its work is done, the cursor rests in the empty part of the sidebar, under the menu, out of the way.
  const park = { x: 40, y: 598 + a * 62 }
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
    <span style={{ position: 'absolute', ...(x > 1700 ? { right: 8 } : { left: 18 }), top: 22, padding: '3px 9px', borderRadius: 7, background: color, color: '#fff', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgb(0 0 0 / .25)' }}>{name}</span>
  </div>
}

function AgentBar({ f }: { f: number }) {
  const built = plan.filter(l => f >= l.start + 34).length
  const done = f >= DONE
  const show = interpolate(f, [4, 16], [0, 1], clamp)
  return <div style={{ position: 'absolute', left: (MAIN + RIGHT) / 2, bottom: 22, transform: `translateX(-50%) translateY(${(1 - show) * 30}px)`, opacity: show, zIndex: 30,
    display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px', borderRadius: 14, background: 'rgb(17 19 24 / .92)', boxShadow: '0 12px 40px rgb(0 0 0 / .3)', color: '#e5e7eb', fontSize: 16, fontWeight: 500, whiteSpace: 'nowrap' }}>
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
  const f = useCurrentFrame() * SPEED
  const fadeIn = prog(f, 0, 18)
  return <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, opacity: fadeIn }}>
      {plan.map(l => <LayerView key={l.id} l={l} f={f} />)}
      {reviews.map((r, i) => <ReviewMark key={i} r={r} f={f} />)}
      {agents.map((ag, a) => <Cursor key={ag.role} a={a} f={f} />)}
    </div>
    <AgentBar f={f} />
  </AbsoluteFill>
}

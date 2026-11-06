import type { CSSProperties, ReactNode } from 'react'
import { interpolate } from 'remotion'
import { clamp, createDashboardBuild, type Box, type Layer, type Role } from './dashboardBuild/engine'
import { blue, card, cardTitle, Change, green, grid, Icon, type IconName, ink, muted, num, red, smooth, text } from './dashboardBuild/kit'

// "Criando um Dashboard de Busca": a search-ads performance dashboard (clicks, conversions by campaign, devices,
// keywords) put together live by the same five AI agents (see dashboardBuild/engine). 1920×1080, 30 fps.
// Brand and data are made up.

export { DASHBOARD_BUILD_DURATION as DASHBOARD_SEARCH_DURATION } from './dashboardBuild/engine'

const BG = '#f3f5fa'
const yellow = '#f5b400', purple = '#8b5cf6', search = '#2563eb', auto = '#f5b400', video = '#16a34a'
const MAIN = 316, RIGHT = 1896, GAP = 18
const KPI_Y = 132, KPI_H = 168
const R2_Y = 320, R2_H = 330
const R3_Y = 670, R3_H = 320

const nav: { label: string; icon: IconName }[] = [
  { label: 'Visão geral', icon: 'home' }, { label: 'Campanhas', icon: 'megaphone' }, { label: 'Grupos de anúncios', icon: 'layers' }, { label: 'Anúncios', icon: 'screen' },
  { label: 'Palavras-chave', icon: 'key' }, { label: 'Públicos', icon: 'users' }, { label: 'Conversões', icon: 'target' }, { label: 'Relatórios', icon: 'bars' },
]
const kpis: { label: string; icon: IconName; color: string; tint: string; value: number; format: (v: number) => string; delta: string; up: boolean; good: boolean; spark: number[] }[] = [
  { label: 'Cliques', icon: 'cursor', color: blue, tint: '#e6efff', value: 5614, format: v => num(Math.round(v)), delta: '+22,1%', up: true, good: true, spark: [3, 4, 3, 5, 6, 5, 7, 6, 9, 12] },
  { label: 'Impressões', icon: 'eye', color: purple, tint: '#efe8ff', value: 160328, format: v => num(Math.round(v)), delta: '+16,9%', up: true, good: true, spark: [3, 4, 5, 4, 6, 7, 6, 8, 9, 11] },
  { label: 'CTR', icon: 'percent', color: '#e8a100', tint: '#fff3d6', value: 3.5, format: v => `${num(v, true)}%`, delta: '+4,5 p.p.', up: true, good: true, spark: [3, 4, 4, 5, 5, 6, 7, 6, 8, 10] },
  { label: 'Custo', icon: 'card', color: green, tint: '#e1f6e8', value: 2625.44, format: v => `R$ ${num(v, true)}`, delta: '−11,4%', up: false, good: false, spark: [3, 4, 4, 5, 6, 5, 7, 7, 9, 11] },
]
const series = [
  { label: 'Pesquisa', color: search, values: [9, 11, 14, 13, 12, 15, 17, 16, 18, 20, 19, 21, 22, 21, 23, 25, 24, 27, 26, 28, 30, 29, 31, 33, 32, 34, 36, 35, 38, 42] },
  { label: 'Automáticas', color: auto, values: [4, 6, 7, 6, 7, 8, 9, 8, 10, 11, 10, 12, 12, 13, 13, 14, 14, 15, 16, 15, 17, 18, 17, 19, 20, 19, 21, 22, 22, 25] },
  { label: 'Display / Vídeo', color: video, values: [2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 5, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 12] },
]
const share = [{ label: 'Pesquisa', value: 58, count: 239, color: search }, { label: 'Automáticas', value: 27, count: 111, color: auto }, { label: 'Display / Vídeo', value: 15, count: 62, color: video }]
const shareStarts = share.map((_, i) => share.slice(0, i).reduce((n, s) => n + s.value / 100, 0))
const devices: { label: string; icon: IconName; value: number }[] = [{ label: 'Computador', icon: 'monitor', value: 52 }, { label: 'Celular', icon: 'phone', value: 41 }, { label: 'Tablet', icon: 'tablet', value: 7 }]
type Kind = 'search' | 'auto' | 'video'
const campaigns: { name: string; kind: Kind; conv: number; cost: string; per: string; roas: string }[] = [
  { name: 'Pesquisa – Serviços', kind: 'search', conv: 239, cost: 'R$ 1.522,60', per: 'R$ 6,37', roas: '5,24' },
  { name: 'Automática – Vendas', kind: 'auto', conv: 111, cost: 'R$ 724,38', per: 'R$ 6,53', roas: '4,91' },
  { name: 'Vídeo – Marca', kind: 'video', conv: 62, cost: 'R$ 378,46', per: 'R$ 6,10', roas: '3,87' },
]
const kindLabel: Record<Kind, { label: string; icon: ReactNode; tint: string }> = {
  search: { label: 'Pesquisa', icon: <Icon name="search" size={16} color={search} width={2.6} />, tint: '#e8f0fe' },
  auto: { label: 'Automática', icon: <Icon name="sparkle" size={16} color={purple} width={2} />, tint: '#f1ebff' },
  video: { label: 'Vídeo', icon: <span style={{ width: 18, height: 13, borderRadius: 3, background: red, display: 'grid', placeItems: 'center' }}><svg width={7} height={8} viewBox="0 0 7 8"><path d="M0 0l7 4-7 4z" fill="#fff" /></svg></span>, tint: '#fdecec' },
}
const keywords = [
  { term: 'ar condicionado instalação', conv: 42, per: 'R$ 5,20' },
  { term: 'manutenção de ar condicionado', conv: 28, per: 'R$ 6,10' },
  { term: 'limpeza de ar condicionado', conv: 21, per: 'R$ 6,45' },
]

const linkText = (t: string) => text({ gap: 10, color: blue, fontSize: 19, fontWeight: 500 }, <>{t}<Icon name="arrow" size={22} color={blue} /></>)
const pill = (t: string): ReactNode => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, height: 42, padding: '0 16px', borderRadius: 10, boxShadow: '0 0 0 1px #dfe4ee', background: '#fff', color: ink, fontSize: 17 }}>{t}<Icon name="chevron" size={20} color="#3a4360" /></span>

function buildLayers(): Layer[] {
  const L: Layer[] = []
  const add = (id: string, b: Box, kind: Layer['kind'], render: Layer['render'], radius?: number) => L.push({ id, ...b, kind, render, radius })

  // Sidebar and the colored strip on top.
  add('sidebar', { x: 0, y: 0, w: 292, h: 1080 }, 'panel', () => <div style={{ position: 'absolute', inset: 0, background: '#fbfcfe', boxShadow: 'inset -1px 0 0 #e6eaf2' }} />, 0)
  add('strip', { x: 0, y: 0, w: 1920, h: 8 }, 'block', () => <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>{[search, '#ea4335', yellow, video].map(c => <i key={c} style={{ flex: 1, background: c }} />)}</div>, 0)
  add('logo', { x: 36, y: 38, w: 230, h: 52 }, 'text', () => text({ gap: 12, color: ink, fontSize: 31, fontWeight: 800, letterSpacing: -0.6 }, <>
    <span style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg, #3b8bff, ${blue})`, display: 'grid', placeItems: 'center', boxShadow: '0 6px 14px rgb(29 111 242 / .35)' }}><Icon name="search" size={26} color="#fff" width={2.6} /></span>Otto Ads</>))
  nav.forEach((n, i) => add(`nav-${i}`, { x: 18, y: 130 + i * 60, w: 256, h: 52 }, 'text', () => text({ gap: 18, paddingLeft: 20, borderRadius: 14, background: i === 0 ? '#e6efff' : 'transparent', color: i === 0 ? blue : '#2a3350', fontSize: 20, fontWeight: i === 0 ? 700 : 500 }, <>
    <Icon name={n.icon} size={25} color={i === 0 ? blue : '#3a4360'} />{n.label}</>), 14))
  add('insights', { x: 18, y: 900, w: 256, h: 140 }, 'block', () => <div style={{ ...card, borderRadius: 18, padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: ink, fontSize: 21, fontWeight: 700 }}><Icon name="sparkle" size={28} color={purple} width={1.8} />Insights da IA<span style={{ marginLeft: 'auto' }}><Icon name="chevronRight" size={22} color="#3a4360" /></span></span>
    <span style={{ color: muted, fontSize: 16, lineHeight: 1.35, whiteSpace: 'normal' }}>Oportunidades para melhorar suas campanhas</span>
  </div>, 18)

  // Header.
  add('title', { x: MAIN, y: 28, w: 620, h: 56 }, 'text', () => text({ color: ink, fontSize: 44, fontWeight: 800, letterSpacing: -1 }, 'Desempenho – Campanhas'))
  add('subtitle', { x: MAIN, y: 86, w: 760, h: 30 }, 'text', () => text({ color: '#3a4360', fontSize: 21 }, 'Resultados das campanhas de pesquisa, display, vídeo e automáticas'))
  add('date', { x: 1150, y: 30, w: 350, h: 74 }, 'block', () => <div style={{ ...card, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px' }}>
    <Icon name="calendar" size={28} color="#3a4360" />
    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}><b style={{ color: ink, fontSize: 20 }}>Últimos 30 dias</b><span style={{ color: muted, fontSize: 16 }}>1 jan – 30 jan 2025</span></span>
    <span style={{ marginLeft: 'auto' }}><Icon name="chevron" size={24} color="#3a4360" /></span>
  </div>, 16)
  add('account', { x: 1520, y: 30, w: 376, h: 74 }, 'block', () => <div style={{ ...card, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px' }}>
    <span style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, #3b8bff, ${blue})`, display: 'grid', placeItems: 'center' }}><Icon name="search" size={22} color="#fff" width={2.6} /></span>
    <span style={{ color: ink, fontSize: 20, fontWeight: 500 }}>Minha Empresa</span>
    <span style={{ marginLeft: 'auto' }}><Icon name="chevron" size={24} color="#3a4360" /></span>
  </div>, 16)

  // KPI cards.
  const kw = (RIGHT - MAIN - GAP * 3) / 4
  kpis.forEach((k, i) => {
    const x = Math.round(MAIN + i * (kw + GAP)), y = KPI_Y, w = Math.round(kw)
    add(`kpi-${i}`, { x, y, w, h: KPI_H }, 'panel', () => <div style={{ ...card, background: `linear-gradient(160deg, ${k.tint}aa, #fff 60%)` }} />, 20)
    add(`kpi-${i}-label`, { x: x + 22, y: y + 22, w: 200, h: 56 }, 'text', () => text({ gap: 16, color: ink, fontSize: 20, fontWeight: 500 }, <>
      <span style={{ width: 56, height: 56, borderRadius: '50%', background: k.tint, display: 'grid', placeItems: 'center' }}><Icon name={k.icon} size={28} color={k.color} width={2.4} /></span>{k.label}</>))
    add(`kpi-${i}-value`, { x: x + 94, y: y + 66, w: w - 116, h: 50 }, 'text', p => text({ color: ink, fontSize: 40, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }, k.format(k.value * p)))
    add(`kpi-${i}-delta`, { x: x + 94, y: y + 122, w: 130, h: 28 }, 'text', () => text({}, <Change v={k.delta} up={k.up} color={k.good ? green : red} />))
    add(`kpi-${i}-spark`, { x: x + w - 170, y: y + 104, w: 148, h: 48 }, 'block', p => <Spark values={k.spark} color={k.color} p={p} id={`s${i}`} />, 6)
  })

  // Row 2: conversions over time, conversions by campaign, devices.
  const convW = 900, shareX = MAIN + convW + GAP, shareW = 300, devX = shareX + shareW + GAP, devW = RIGHT - devX
  add('conv', { x: MAIN, y: R2_Y, w: convW, h: R2_H }, 'panel', () => <div style={card} />, 20)
  add('conv-title', { x: MAIN + 24, y: R2_Y + 24, w: 420, h: 40 }, 'text', () => cardTitle(<><Icon name="bars" size={26} color={blue} width={3} />Conversões ao longo do tempo</>))
  add('conv-filters', { x: MAIN + convW - 290, y: R2_Y + 22, w: 266, h: 44 }, 'text', () => text({ justifyContent: 'flex-end', gap: 12 }, <>{pill('Conversões')}{pill('Diário')}</>))
  add('conv-chart', { x: MAIN + 20, y: R2_Y + 80, w: convW - 44, h: 196 }, 'block', p => <ConvChart p={p} w={convW - 44} h={196} />, 8)
  add('conv-legend', { x: MAIN + 60, y: R2_Y + 288, w: 520, h: 28 }, 'text', () => text({ gap: 28, color: ink, fontSize: 16 }, series.map(s => <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><i style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }} />{s.label}</span>)))

  add('share', { x: shareX, y: R2_Y, w: shareW, h: R2_H }, 'panel', () => <div style={card} />, 20)
  add('share-title', { x: shareX + 22, y: R2_Y + 24, w: shareW - 44, h: 40 }, 'text', () => text({ color: ink, fontSize: 21, fontWeight: 700, letterSpacing: -0.4 }, 'Conversões por campanha'))
  add('share-donut', { x: shareX + (shareW - 160) / 2, y: R2_Y + 72, w: 160, h: 160 }, 'block', p => <Donut p={p} />, 80)
  share.forEach((s, i) => add(`share-leg-${i}`, { x: shareX + 24, y: R2_Y + 244 + i * 26, w: shareW - 48, h: 24 }, 'text', () => text({ gap: 8, color: ink, fontSize: 15 }, <>
    <span style={{ width: 13, height: 13, borderRadius: 3, background: s.color }} />{s.label}<span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}><b>{s.value}%</b> ({s.count})</span></>)))

  add('dev', { x: devX, y: R2_Y, w: devW, h: R2_H }, 'panel', () => <div style={card} />, 20)
  add('dev-title', { x: devX + 24, y: R2_Y + 24, w: devW - 48, h: 40 }, 'text', () => cardTitle('Dispositivos'))
  devices.forEach((d, i) => add(`dev-${i}`, { x: devX + 24, y: R2_Y + 86 + i * 78, w: devW - 48, h: 60 }, 'block', p => <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 16, alignItems: 'center' }}>
    <Icon name={d.icon} size={34} color="#3a4360" width={1.8} />
    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ display: 'flex', color: ink, fontSize: 18 }}>{d.label}<b style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{Math.round(d.value * p)}%</b></span>
      <span style={{ height: 14, borderRadius: 4, background: '#eef2f7', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: `${d.value * p}%`, background: blue, borderRadius: 4 }} /></span>
    </span>
  </div>, 8))

  // Row 3: campaigns, keywords.
  const campW = 960, kwX = MAIN + campW + GAP, kwW = RIGHT - kwX
  add('camp', { x: MAIN, y: R3_Y, w: campW, h: R3_H }, 'panel', () => <div style={card} />, 20)
  add('camp-title', { x: MAIN + 24, y: R3_Y + 22, w: 300, h: 40 }, 'text', () => cardTitle(<><Icon name="megaphone" size={26} color={blue} />Campanhas</>))
  add('camp-head', { x: MAIN + 20, y: R3_Y + 74, w: campW - 40, h: 34 }, 'text', () => <CampRow head />)
  campaigns.forEach((c, i) => add(`camp-${i}`, { x: MAIN + 20, y: R3_Y + 110 + i * 50, w: campW - 40, h: 48 }, 'text', () => <CampRow c={c} />))
  add('camp-link', { x: MAIN + 34, y: R3_Y + 270, w: 300, h: 32 }, 'text', () => linkText('Ver todas as campanhas'))

  add('kw', { x: kwX, y: R3_Y, w: kwW, h: R3_H }, 'panel', () => <div style={card} />, 20)
  add('kw-title', { x: kwX + 24, y: R3_Y + 22, w: kwW - 48, h: 40 }, 'text', () => cardTitle(<><Icon name="key" size={26} color={ink} />Palavras-chave que mais convertem</>))
  add('kw-head', { x: kwX + 24, y: R3_Y + 74, w: kwW - 48, h: 34 }, 'text', () => <KwRow head />)
  keywords.forEach((k, i) => add(`kw-${i}`, { x: kwX + 24, y: R3_Y + 110 + i * 50, w: kwW - 48, h: 48 }, 'block', p => <KwRow k={k} p={p} />, 4))
  add('kw-link', { x: kwX + 34, y: R3_Y + 270, w: 400, h: 32 }, 'text', () => linkText('Ver relatório de palavras-chave'))
  return L
}

function Spark({ values, color, p, id }: { values: number[]; color: string; p: number; id: string }) {
  const W = 148, H = 48, max = Math.max(...values), min = Math.min(...values)
  const xy = values.map((v, i) => [(i / (values.length - 1)) * W, 4 + (1 - (v - min) / (max - min)) * (H - 8)] as const)
  const d = smooth(xy)
  return <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
    <defs>
      <linearGradient id={`${id}-f`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity={0.25} /><stop offset="1" stopColor={color} stopOpacity={0} /></linearGradient>
      <clipPath id={`${id}-c`}><rect width={W * Math.max(0.001, p)} height={H + 4} /></clipPath>
    </defs>
    <g clipPath={`url(#${id}-c)`}><path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#${id}-f)`} /><path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" /></g>
  </svg>
}

function ConvChart({ p, w, h }: { p: number; w: number; h: number }) {
  const left = 40, right = 14, top = 8, bottom = 28, max = 50
  const pw = w - left - right, ph = h - top - bottom
  const pts = series.map(s => s.values.map((v, i) => [left + (i / (s.values.length - 1)) * pw, top + (1 - v / max) * ph] as const))
  const last = pts[0][pts[0].length - 1]
  return <svg viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
    <defs>
      {series.map((s, i) => <linearGradient key={i} id={`conv-f${i}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={s.color} stopOpacity={0.22} /><stop offset="1" stopColor={s.color} stopOpacity={0.02} /></linearGradient>)}
      <clipPath id="conv-clip"><rect x={0} y={0} width={left + pw * Math.max(0.001, p)} height={h} /></clipPath>
    </defs>
    {[0, 10, 20, 30, 40, 50].map(v => { const y = top + (1 - v / max) * ph; return <g key={v}>
      <line x1={left} x2={left + pw} y1={y} y2={y} stroke={grid} />
      <text x={left - 12} y={y + 5} fontSize={15} fill="#3a4360" textAnchor="end">{v}</text></g> })}
    {[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 29].map(i => <text key={i} x={pts[0][i][0]} y={h - 4} fontSize={15} fill="#3a4360" textAnchor="middle">{i + 1} jan</text>)}
    <g clipPath="url(#conv-clip)">
      {pts.map((xy, i) => { const d = smooth(xy); return <g key={i}>
        <path d={`${d} L${left + pw},${top + ph} L${left},${top + ph} Z`} fill={`url(#conv-f${i})`} />
        <path d={d} fill="none" stroke={series[i].color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" /></g> })}
    </g>
    {p > 0.92 && <g opacity={interpolate(p, [0.92, 1], [0, 1], clamp)}>
      <circle cx={last[0]} cy={last[1]} r={8} fill="#fff" stroke={blue} strokeWidth={3.5} />
      <g transform={`translate(${last[0] - 248}, ${last[1] - 30})`}>
        <rect width={222} height={64} rx={10} fill="#fff" stroke="#e5e9f2" />
        <text x={16} y={25} fontSize={15} fill="#3a4360">30 jan</text>
        <text x={16} y={50} fontSize={17} fontWeight={700} fill={ink}>42 conversões</text>
        <text x={150} y={50} fontSize={15} fontWeight={700} fill={green}>↑ +34%</text>
      </g>
    </g>}
  </svg>
}

function Donut({ p }: { p: number }) {
  const r = 62, c = 2 * Math.PI * r
  return <svg viewBox="0 0 160 160" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <circle cx={80} cy={80} r={r} fill="none" stroke="#eef2f7" strokeWidth={22} />
    {share.map((s, i) => <circle key={s.label} cx={80} cy={80} r={r} fill="none" stroke={s.color} strokeWidth={22}
      strokeDasharray={`${(s.value / 100) * c * p} ${c}`} strokeDashoffset={-shareStarts[i] * c * p} transform="rotate(-90 80 80)" />)}
    <text x={80} y={84} textAnchor="middle" fontSize={32} fontWeight={800} fill={ink}>{Math.round(412 * p)}</text>
    <text x={80} y={106} textAnchor="middle" fontSize={14} fill={muted}>Conversões</text>
  </svg>
}

// Campaign table columns: checkbox, name, type, conversions, cost, cost per conversion, ROAS.
const campCols: { left: number; width: number; align: 'left' | 'right' | 'center' }[] = [
  { left: 0, width: 30, align: 'left' }, { left: 44, width: 250, align: 'left' }, { left: 300, width: 160, align: 'left' }, { left: 460, width: 140, align: 'right' },
  { left: 610, width: 120, align: 'right' }, { left: 740, width: 110, align: 'right' }, { left: 850, width: 70, align: 'right' },
]
const cellStyle = (c: { left: number; width: number; align: string }): CSSProperties => ({ position: 'absolute', left: c.left, width: c.width, top: 0, bottom: 0, display: 'flex', alignItems: 'center',
  justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'right' ? 'flex-end' : 'center', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' })
function CampRow({ c, head }: { c?: (typeof campaigns)[number]; head?: boolean }) {
  if (head || !c) return <div style={{ position: 'absolute', inset: 0, borderBottom: `1px solid ${grid}`, color: ink, fontSize: 16, fontWeight: 600 }}>
    {['', 'Campanha', 'Tipo', 'Conversões ↓', 'Custo', 'Custo / conv.', 'ROAS'].map((t, i) => <span key={i} style={cellStyle(campCols[i])}>{t}</span>)}
  </div>
  const k = kindLabel[c.kind]
  return <div style={{ position: 'absolute', inset: 0, borderBottom: `1px solid ${grid}`, color: ink, fontSize: 18 }}>
    <span style={cellStyle(campCols[0])}><i style={{ width: 18, height: 18, borderRadius: 4, boxShadow: 'inset 0 0 0 1.5px #9aa3b5' }} /></span>
    <span style={{ ...cellStyle(campCols[1]), gap: 10 }}><i style={{ width: 11, height: 11, borderRadius: '50%', background: green }} /><b style={{ color: '#1b2a8b', fontWeight: 600 }}>{c.name}</b></span>
    <span style={cellStyle(campCols[2])}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 7, background: k.tint, fontSize: 15 }}>{k.icon}{k.label}</span></span>
    <span style={cellStyle(campCols[3])}><b>{c.conv}</b></span>
    <span style={cellStyle(campCols[4])}>{c.cost}</span><span style={cellStyle(campCols[5])}>{c.per}</span><span style={cellStyle(campCols[6])}>{c.roas}</span>
  </div>
}

// Keyword table: term, conversions (with a bar behind it), cost per conversion.
const KW_TERM = 330, KW_CONV = 130
function KwRow({ k, p = 1, head }: { k?: (typeof keywords)[number]; p?: number; head?: boolean }) {
  const row: CSSProperties = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${grid}`, color: ink, whiteSpace: 'nowrap' }
  const cell = (w: number | undefined, align: 'left' | 'center' | 'right', children: ReactNode, extra?: CSSProperties) =>
    <span style={{ position: 'relative', width: w, flex: w ? undefined : 1, display: 'flex', alignItems: 'center', justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center', ...extra }}>{children}</span>
  if (head || !k) return <div style={{ ...row, fontSize: 16, fontWeight: 600 }}>{cell(KW_TERM, 'left', 'Palavra-chave')}{cell(KW_CONV, 'center', 'Conversões')}{cell(undefined, 'right', 'Custo / conv.')}</div>
  return <div style={{ ...row, fontSize: 18 }}>
    {cell(KW_TERM, 'left', k.term)}
    {cell(KW_CONV, 'center', <>
      <i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(k.conv / 42) * 100 * p}%`, background: '#dbe7fd' }} />
      <b style={{ position: 'relative', fontVariantNumeric: 'tabular-nums' }}>{Math.round(k.conv * p)}</b></>)}
    {cell(undefined, 'right', k.per)}
  </div>
}

// ---------- who builds what ----------

const PANELS = ['kpi-0', 'kpi-1', 'kpi-2', 'kpi-3', 'conv', 'camp', 'share', 'dev', 'kw']
const roleOf = (id: string): Role =>
  /^kpi-\d-/.test(id) ? 'metricas'
    : /^(conv|share|dev)-/.test(id) ? 'graficos'
      : /^(camp|kw)-/.test(id) ? 'tabela'
        : 'layout'

export const DashboardBuildSearch = createDashboardBuild({
  layers: buildLayers(),
  panels: PANELS,
  roleOf,
  layoutAfterPanels: ['strip', 'title', 'subtitle', 'date', 'account', 'logo'],
  timing: { tabela: { step: 16 } },
  // The reviewer starts with the header and the sidebar.
  reviewFirst: [{ x: MAIN - 12, y: 18, w: 800, h: 104 }, { x: 0, y: 0, w: 292, h: 1080 }],
  park: { x: 40, y: 640, gap: 58 },
  barCenterX: (MAIN + RIGHT) / 2,
  background: BG,
})

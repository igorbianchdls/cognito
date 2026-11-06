import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import { continueRender, delayRender, interpolate, staticFile } from 'remotion'
import { clamp, createDashboardBuild, type Box, type Layer, type Role } from './dashboardBuild/engine'
import { Icon, type IconName, num, type Scene, SceneArt, smooth } from './dashboardBuild/kit'

// "Criando um Dashboard do Instagram": a profile performance dashboard (followers, engagement, reach, content type,
// top posts, audience) in soft pinks with serif headings, put together live by the same five AI agents
// (see dashboardBuild/engine). 1920×1080, 30 fps. Data are made up.

export { DASHBOARD_BUILD_DURATION as DASHBOARD_INSTAGRAM_DURATION } from './dashboardBuild/engine'

const ink = '#2a1620', muted = '#7a5d68', grid = '#f1dfe5'
const deep = '#d6336c', mid = '#ec6a9a', soft = '#f6a8c4', pale = '#fde4ec'
const SERIF = '"Newsreader", Georgia, "Times New Roman", serif'
const serif = (size: number, weight = 500): CSSProperties => ({ fontFamily: SERIF, fontSize: size, fontWeight: weight, letterSpacing: -0.4 })

const MAIN = 346, RIGHT = 1896, GAP = 20
const KPI_Y = 182, KPI_H = 170
const R2_Y = 372, R2_H = 334
const R3_Y = 726, R3_H = 326

const card: CSSProperties = { position: 'absolute', inset: 0, background: 'rgb(255 255 255 / .82)', borderRadius: 24, boxShadow: '0 1px 2px rgb(120 40 70 / .05), 0 12px 32px rgb(160 60 100 / .08), 0 0 0 1px rgb(240 210 220 / .9)' }
const text = (style: CSSProperties, children: ReactNode) => <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', ...style }}>{children}</div>
const title = (t: string) => text({ ...serif(30), color: ink }, <span data-serif>{t}</span>)

const nav: { label: string; icon: IconName }[] = [
  { label: 'Visão geral', icon: 'home' }, { label: 'Conteúdo', icon: 'image' }, { label: 'Reels', icon: 'reels' }, { label: 'Stories', icon: 'story' },
  { label: 'Audiência', icon: 'users' }, { label: 'Engajamento', icon: 'heart' }, { label: 'Crescimento', icon: 'bars' },
]
const kpis: { label: string; icon: IconName; value: number; format: (v: number) => string; delta: string; spark: number[] }[] = [
  { label: 'Seguidores', icon: 'users', value: 48320, format: v => num(Math.round(v)), delta: '+3,8%', spark: [3, 4, 4, 5, 5, 7, 6, 8, 10, 12] },
  { label: 'Engajamento', icon: 'heart', value: 5.24, format: v => `${num(v, true)}%`, delta: '+1,9 p.p.', spark: [3, 3, 4, 4, 6, 5, 7, 8, 9, 11] },
  { label: 'Alcance', icon: 'play', value: 312480, format: v => num(Math.round(v)), delta: '+12,6%', spark: [3, 4, 3, 5, 6, 6, 7, 9, 10, 12] },
  { label: 'Impressões', icon: 'eye', value: 856920, format: v => num(Math.round(v)), delta: '+18,9%', spark: [3, 4, 5, 5, 6, 7, 7, 9, 11, 13] },
]
// In thousands, per day.
const impressions = [140, 200, 260, 290, 300, 320, 380, 420, 410, 370, 350, 380, 440, 470, 460, 430, 420, 460, 500, 480, 450, 500, 560, 600, 590, 580, 640, 700, 760, 840]
const reach = [60, 90, 120, 140, 150, 160, 170, 190, 200, 180, 170, 180, 200, 220, 230, 220, 210, 220, 240, 250, 240, 230, 250, 270, 260, 260, 280, 290, 300, 310]
const types: { label: string; icon: IconName; value: number; color: string }[] = [
  { label: 'Reels', icon: 'reels', value: 62, color: deep }, { label: 'Posts', icon: 'image', value: 26, color: mid }, { label: 'Stories', icon: 'story', value: 12, color: soft },
]
const typeStarts = types.map((_, i) => types.slice(0, i).reduce((n, t) => n + t.value / 100, 0))
const posts: { scene: Scene; views: string; likes: string; comments: string }[] = [
  { scene: 'sofa', views: '215,4 mil', likes: '9.420', comments: '312' },
  { scene: 'kitchen', views: '142,8 mil', likes: '6.131', comments: '184' },
  { scene: 'chair', views: '98,7 mil', likes: '4.021', comments: '97' },
]
const ages = [{ label: '18 – 24', value: 8 }, { label: '25 – 34', value: 42 }, { label: '35 – 44', value: 32 }, { label: '45 – 54', value: 12 }, { label: '55+', value: 6 }]

function InstagramGlyph({ size = 52 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0, display: 'block' }}>
    <defs><linearGradient id="ig-glyph" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#feda75" /><stop offset="0.3" stopColor="#fa7e1e" /><stop offset="0.6" stopColor="#d62976" /><stop offset="1" stopColor="#4f5bd5" /></linearGradient></defs>
    <rect x={5} y={5} width={38} height={38} rx={11} fill="none" stroke="url(#ig-glyph)" strokeWidth={4.5} />
    <circle cx={24} cy={24} r={8.5} fill="none" stroke="url(#ig-glyph)" strokeWidth={4.5} />
    <circle cx={34.5} cy={13.5} r={2.6} fill="url(#ig-glyph)" />
  </svg>
}

function buildLayers(): Layer[] {
  const L: Layer[] = []
  const add = (id: string, b: Box, kind: Layer['kind'], render: Layer['render'], radius?: number) => L.push({ id, ...b, kind, render, radius })

  // Sidebar.
  add('sidebar', { x: 0, y: 0, w: 300, h: 1080 }, 'panel', () => <div style={{ position: 'absolute', inset: 0, background: 'rgb(255 255 255 / .5)', boxShadow: 'inset -1px 0 0 #f0dbe2' }} />, 0)
  add('deco', { x: 1650, y: 0, w: 270, h: 180 }, 'block', () => <svg viewBox="0 0 270 180" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <path d="M60 180 V90 A90 90 0 0 1 240 90 V180" fill="none" stroke="#e8d5c4" strokeWidth={26} />
    {[[205, 70, -30], [228, 52, 10], [248, 82, 35], [216, 100, -10], [252, 120, 50], [232, 128, 15]].map(([cx, cy, r], i) =>
      <ellipse key={i} cx={cx} cy={cy} rx={11} ry={30} fill={i % 2 ? '#5f7d4b' : '#7a9a5c'} transform={`rotate(${r} ${cx} ${cy})`} />)}
  </svg>, 8)
  add('logo', { x: 40, y: 34, w: 240, h: 60 }, 'text', () => text({ gap: 14, color: ink }, <><InstagramGlyph /><span data-serif style={{ ...serif(36, 600), fontStyle: 'italic', letterSpacing: -0.8 }}>Instagram</span></>))
  nav.forEach((n, i) => add(`nav-${i}`, { x: 24, y: 140 + i * 68, w: 256, h: 58 }, 'text', () => text({ gap: 18, paddingLeft: 22, borderRadius: 16, background: i === 0 ? '#fbd5e2' : 'transparent', color: i === 0 ? deep : '#3d2731', fontSize: 21, fontWeight: i === 0 ? 600 : 500 }, <>
    <Icon name={n.icon} size={26} color={i === 0 ? deep : '#4a3540'} width={1.8} />{n.label}</>), 16))
  add('profile', { x: 24, y: 924, w: 256, h: 116 }, 'block', () => <div style={{ ...card, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px' }}>
    <span data-serif style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #b9786a, #7e4a3f)', color: '#fff', display: 'grid', placeItems: 'center', ...serif(26, 500) }}>B</span>
    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}><b style={{ color: ink, fontSize: 19, fontWeight: 600 }}>Brenda Lima</b><span style={{ color: muted, fontSize: 17 }}>Arquitetura</span></span>
    <span style={{ marginLeft: 'auto' }}><Icon name="chevron" size={22} color="#4a3540" /></span>
  </div>, 20)

  // Header.
  add('overline', { x: MAIN, y: 28, w: 260, h: 28 }, 'text', () => text({ color: '#5a4550', fontSize: 19, fontWeight: 600, letterSpacing: 4 }, 'INSTAGRAM'))
  add('title', { x: MAIN, y: 58, w: 640, h: 72 }, 'text', () => text({ ...serif(64, 500), color: ink, letterSpacing: -1.2 }, <span data-serif>Performance do Perfil</span>))
  add('subtitle', { x: MAIN, y: 134, w: 640, h: 30 }, 'text', () => text({ color: '#5a4550', fontSize: 22 }, 'Resultados, engajamento e crescimento do seu Instagram'))
  add('date', { x: 1210, y: 60, w: 320, h: 76 }, 'block', () => <div style={{ ...card, borderRadius: 18, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px' }}>
    <Icon name="calendar" size={28} color="#4a3540" />
    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}><b style={{ color: ink, fontSize: 20, fontWeight: 600 }}>Últimos 30 dias</b><span style={{ color: muted, fontSize: 16 }}>1 jan – 30 jan 2025</span></span>
    <span style={{ marginLeft: 'auto' }}><Icon name="chevron" size={24} color="#4a3540" /></span>
  </div>, 18)

  // KPI cards.
  const kw = (RIGHT - MAIN - GAP * 3) / 4
  kpis.forEach((k, i) => {
    const x = Math.round(MAIN + i * (kw + GAP)), y = KPI_Y, w = Math.round(kw)
    add(`kpi-${i}`, { x, y, w, h: KPI_H }, 'panel', () => <div style={{ ...card, background: 'linear-gradient(160deg, rgb(253 228 236 / .85), rgb(255 255 255 / .85) 60%)' }} />, 24)
    add(`kpi-${i}-label`, { x: x + 22, y: y + 26, w: 220, h: 64 }, 'text', () => text({ gap: 18, color: ink, fontSize: 21, alignItems: 'flex-start' }, <>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: pale, display: 'grid', placeItems: 'center' }}><Icon name={k.icon} size={30} color={deep} width={2} /></span><span style={{ paddingTop: 4 }}>{k.label}</span></>))
    add(`kpi-${i}-value`, { x: x + 104, y: y + 62, w: w - 126, h: 56 }, 'text', p => text({ ...serif(46, 500), color: ink, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }, <span data-serif>{k.format(k.value * p)}</span>))
    add(`kpi-${i}-delta`, { x: x + 104, y: y + 124, w: 124, h: 34 }, 'block', () => text({ justifyContent: 'center', gap: 5, borderRadius: 17, background: '#e3f4e6', color: '#1d7a35', fontSize: 18, fontWeight: 700 }, <>
      <span style={{ transform: 'rotate(-90deg)', display: 'inline-flex' }}><Icon name="arrow" size={18} color="#1d7a35" width={2.6} /></span>{k.delta}</>), 17)
    add(`kpi-${i}-spark`, { x: x + w - 128, y: y + 108, w: 108, h: 46 }, 'block', p => <Spark values={k.spark} p={p} id={`ig${i}`} />, 6)
  })

  // Row 2: reach and impressions, content type.
  const chartW = 930, typeX = MAIN + chartW + GAP, typeW = RIGHT - typeX
  add('reach', { x: MAIN, y: R2_Y, w: chartW, h: R2_H }, 'panel', () => <div style={card} />, 24)
  add('reach-title', { x: MAIN + 26, y: R2_Y + 22, w: 360, h: 44 }, 'text', () => title('Alcance e impressões'))
  add('reach-legend', { x: MAIN + chartW - 290, y: R2_Y + 28, w: 264, h: 32 }, 'text', () => text({ justifyContent: 'flex-end', gap: 26, color: ink, fontSize: 18 }, <>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}><i style={{ width: 14, height: 14, borderRadius: '50%', background: deep }} />Impressões</span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}><i style={{ width: 14, height: 14, borderRadius: '50%', background: soft }} />Alcance</span></>))
  add('reach-chart', { x: MAIN + 20, y: R2_Y + 82, w: chartW - 44, h: 236 }, 'block', p => <ReachChart p={p} w={chartW - 44} h={236} />, 8)

  add('type', { x: typeX, y: R2_Y, w: typeW, h: R2_H }, 'panel', () => <div style={card} />, 24)
  add('type-title', { x: typeX + 26, y: R2_Y + 22, w: 300, h: 44 }, 'text', () => title('Tipo de conteúdo'))
  add('type-donut', { x: typeX + 30, y: R2_Y + 84, w: 230, h: 230 }, 'block', p => <TypeDonut p={p} />, 115)
  types.forEach((t, i) => add(`type-leg-${i}`, { x: typeX + 300, y: R2_Y + 116 + i * 64, w: typeW - 330, h: 40 }, 'text', () => text({ gap: 14, color: ink, fontSize: 21 }, <>
    <Icon name={t.icon} size={28} color={deep} width={1.8} />{t.label}<b style={{ marginLeft: 'auto', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{t.value}%</b></>)))

  // Row 3: top posts, audience.
  const featW = 760, audX = MAIN + featW + GAP, audW = RIGHT - audX
  add('feat', { x: MAIN, y: R3_Y, w: featW, h: R3_H }, 'panel', () => <div style={card} />, 24)
  add('feat-title', { x: MAIN + 26, y: R3_Y + 22, w: 400, h: 44 }, 'text', () => title('Conteúdos em destaque'))
  const tw = Math.floor((featW - 52 - 2 * 18) / 3)
  posts.forEach((c, i) => add(`feat-${i}`, { x: MAIN + 26 + i * (tw + 18), y: R3_Y + 82, w: tw, h: 222 }, 'block', () => <div style={{ position: 'absolute', inset: 0 }}>
    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 170, borderRadius: 16, overflow: 'hidden' }}>
      <SceneArt scene={c.scene} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgb(40 20 25 / .75))' }} />
      <span style={{ position: 'absolute', left: 16, bottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 20, fontWeight: 600 }}>
        <svg width={18} height={18} viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="#fff" /></svg>{c.views}</span>
    </div>
    <div style={{ position: 'absolute', left: 6, top: 186, display: 'flex', gap: 28, color: '#3d2731', fontSize: 18 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="heart" size={22} color="#3d2731" width={1.8} />{c.likes}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="comment" size={22} color="#3d2731" width={1.8} />{c.comments}</span>
    </div>
  </div>, 16))

  add('aud', { x: audX, y: R3_Y, w: audW, h: R3_H }, 'panel', () => <div style={card} />, 24)
  add('aud-title', { x: audX + 26, y: R3_Y + 22, w: 360, h: 44 }, 'text', () => title('Perfil da audiência'))
  add('aud-donut', { x: audX + 30, y: R3_Y + 98, w: 180, h: 180 }, 'block', p => <GenderDonut p={p} />, 90)
  add('aud-gender', { x: audX + 228, y: R3_Y + 110, w: 150, h: 160 }, 'block', p => <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 26 }}>
    {[{ v: 72, l: 'Mulheres', icon: 'female' as const, c: deep }, { v: 28, l: 'Homens', icon: 'male' as const, c: '#7a5d68' }].map(g => <span key={g.l} style={{ display: 'flex', gap: 10 }}>
      <Icon name={g.icon} size={30} color={g.c} width={1.8} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}><b data-serif style={{ ...serif(32, 600), color: g.c }}>{Math.round(g.v * p)}%</b><span style={{ color: g.c, fontSize: 17 }}>{g.l}</span></span>
    </span>)}
  </div>, 8)
  ages.forEach((a, i) => add(`aud-age-${i}`, { x: audX + 400, y: R3_Y + 84 + i * 46, w: audW - 426, h: 34 }, 'block', p => <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 14, color: ink, fontSize: 18 }}>
    <span style={{ width: 76, flexShrink: 0 }}>{a.label}</span>
    <span style={{ flex: 1, height: 16, borderRadius: 8, background: '#fbe3eb', overflow: 'hidden' }}><i style={{ display: 'block', height: '100%', width: `${(a.value / 50) * 100 * p}%`, borderRadius: 8, background: `linear-gradient(90deg, ${soft}, ${mid})` }} /></span>
    <b style={{ width: 46, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(a.value * p)}%</b>
  </div>, 6))
  return L
}

function Spark({ values, p, id }: { values: number[]; p: number; id: string }) {
  const W = 108, H = 46, max = Math.max(...values), min = Math.min(...values)
  const xy = values.map((v, i) => [(i / (values.length - 1)) * W, 4 + (1 - (v - min) / (max - min)) * (H - 8)] as const)
  const d = smooth(xy)
  return <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
    <defs>
      <linearGradient id={`${id}-f`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={mid} stopOpacity={0.3} /><stop offset="1" stopColor={mid} stopOpacity={0} /></linearGradient>
      <clipPath id={`${id}-c`}><rect width={W * Math.max(0.001, p)} height={H + 4} /></clipPath>
    </defs>
    <g clipPath={`url(#${id}-c)`}><path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#${id}-f)`} /><path d={d} fill="none" stroke={mid} strokeWidth={3} strokeLinecap="round" /></g>
  </svg>
}

function ReachChart({ p, w, h }: { p: number; w: number; h: number }) {
  const left = 58, right = 18, top = 10, bottom = 30, max = 1000
  const pw = w - left - right, ph = h - top - bottom
  const toXY = (vals: number[]) => vals.map((v, i) => [left + (i / (vals.length - 1)) * pw, top + (1 - v / max) * ph] as const)
  const imp = toXY(impressions), rch = toXY(reach)
  const last = imp[imp.length - 1], lastR = rch[rch.length - 1]
  return <svg viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
    <defs>
      <linearGradient id="imp-f" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={deep} stopOpacity={0.32} /><stop offset="1" stopColor={deep} stopOpacity={0.03} /></linearGradient>
      <linearGradient id="rch-f" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={soft} stopOpacity={0.35} /><stop offset="1" stopColor={soft} stopOpacity={0.05} /></linearGradient>
      <clipPath id="reach-clip"><rect x={0} y={0} width={left + pw * Math.max(0.001, p)} height={h} /></clipPath>
    </defs>
    {[0, 200, 400, 600, 800, 1000].map(v => { const y = top + (1 - v / max) * ph; return <g key={v}>
      <line x1={left} x2={left + pw} y1={y} y2={y} stroke={grid} />
      <text x={left - 14} y={y + 5} fontSize={16} fill="#5a4550" textAnchor="end">{v === 0 ? '0' : v === 1000 ? '1M' : `${v}k`}</text></g> })}
    {[0, 4, 8, 12, 16, 20, 24, 29].map(i => <text key={i} x={imp[i][0]} y={h - 4} fontSize={16} fill="#5a4550" textAnchor="middle">{i + 1} jan</text>)}
    <g clipPath="url(#reach-clip)">
      <path d={`${smooth(imp)} L${left + pw},${top + ph} L${left},${top + ph} Z`} fill="url(#imp-f)" />
      <path d={`${smooth(rch)} L${left + pw},${top + ph} L${left},${top + ph} Z`} fill="url(#rch-f)" />
      <path d={smooth(imp)} fill="none" stroke={deep} strokeWidth={3.5} strokeLinecap="round" />
      <path d={smooth(rch)} fill="none" stroke={soft} strokeWidth={3.5} strokeLinecap="round" />
    </g>
    {p > 0.92 && <g opacity={interpolate(p, [0.92, 1], [0, 1], clamp)}>
      <circle cx={last[0]} cy={last[1]} r={8} fill="#fff" stroke={deep} strokeWidth={3.5} />
      <circle cx={lastR[0]} cy={lastR[1]} r={8} fill="#fff" stroke={soft} strokeWidth={3.5} />
      <g transform={`translate(${last[0] - 266}, ${last[1] - 36})`}>
        <rect width={238} height={84} rx={12} fill="#fff" stroke="#f0dbe2" />
        <text x={16} y={26} fontSize={16} fill="#5a4550">30 jan</text>
        <circle cx={22} cy={46} r={6} fill={deep} /><text x={36} y={52} fontSize={17} fill={ink}><tspan fontWeight={700}>856.920</tspan> impressões</text>
        <circle cx={22} cy={68} r={6} fill={soft} /><text x={36} y={74} fontSize={17} fill={ink}><tspan fontWeight={700}>312.480</tspan> alcance</text>
      </g>
    </g>}
  </svg>
}

function TypeDonut({ p }: { p: number }) {
  const r = 96, c = 2 * Math.PI * r
  return <svg viewBox="0 0 230 230" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <circle cx={115} cy={115} r={r} fill="none" stroke="#fbe3eb" strokeWidth={30} />
    {types.map((t, i) => <circle key={t.label} cx={115} cy={115} r={r} fill="none" stroke={t.color} strokeWidth={30}
      strokeDasharray={`${(t.value / 100) * c * p} ${c}`} strokeDashoffset={-typeStarts[i] * c * p} transform="rotate(-90 115 115)" />)}
    <text data-serif x={115} y={118} textAnchor="middle" fontSize={34} fontWeight={600} fill={ink} style={{ fontFamily: SERIF }}>{num(Math.round(856.9 * p * 10) / 10, true).replace(/,(\d)0$/, ',$1')} mil</text>
    <text x={115} y={146} textAnchor="middle" fontSize={18} fill={muted}>Impressões</text>
  </svg>
}

function GenderDonut({ p }: { p: number }) {
  const r = 72, c = 2 * Math.PI * r
  return <svg viewBox="0 0 180 180" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <circle cx={90} cy={90} r={r} fill="none" stroke={soft} strokeWidth={22} strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 90 90)" />
    <circle cx={90} cy={90} r={r} fill="none" stroke={deep} strokeWidth={22} strokeDasharray={`${0.72 * c * p} ${c}`} strokeDashoffset={-0.28 * c * p} transform="rotate(-90 90 90)" />
  </svg>
}

// ---------- who builds what ----------

const PANELS = ['kpi-0', 'kpi-1', 'kpi-2', 'kpi-3', 'reach', 'feat', 'type', 'aud']
const roleOf = (id: string): Role =>
  /^kpi-\d-/.test(id) ? 'metricas'
    : /^(reach|type)-/.test(id) ? 'graficos'
      : /^(feat|aud)-/.test(id) ? 'tabela'
        : 'layout'

// The app's global styles force the UI font on everything; serif headings opt back in with data-serif.
const CSS = `.ig-dash [data-serif], .ig-dash [data-serif] * { font-family: ${SERIF} !important; }`

const Build = createDashboardBuild({
  layers: buildLayers(),
  panels: PANELS,
  roleOf,
  layoutAfterPanels: ['overline', 'title', 'subtitle', 'date', 'deco', 'logo'],
  timing: { tabela: { step: 16 } },
  // The reviewer starts with the header and the sidebar.
  reviewFirst: [{ x: MAIN - 12, y: 20, w: 680, h: 152 }, { x: 0, y: 0, w: 300, h: 1080 }],
  park: { x: 44, y: 650, gap: 62 },
  background: 'linear-gradient(135deg, #fdf4f6, #f9e5eb)',
  className: 'ig-dash',
  css: CSS,
})

/** Loads the serif before the first frame is captured, then plays the build. */
export function DashboardBuildInstagram() {
  const [handle] = useState(() => delayRender('Newsreader'))
  useEffect(() => {
    const font = new FontFace('Newsreader', `url("${staticFile('remotion/fonts/newsreader/Newsreader-Variable.ttf')}") format("truetype")`, { style: 'normal', weight: '200 800' })
    document.fonts.add(font)
    font.load().catch(() => undefined).finally(() => continueRender(handle))
  }, [handle])
  return <Build />
}

import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto'

// "Agentes montando anúncios": an ads manager in the browser, built live by AI agents. First the editor (icon rail,
// campaign tree, breadcrumb with Editar/Revisar, form in the middle, summary or ad preview on the right): the
// campaign (budget strategy cards, daily budget, bid strategy, A/B test), the ad set (conversion, budget & schedule,
// audience) and the ad (format, media, primary text, headline, description, CTA, destination with URL parameters,
// feed and reels previews); then a burst through the other ads of the tree; then the campaigns, ad sets and ads
// tables with tags and drafts while "Revisar e publicar (n)" climbs. 1920×1080, 30 fps, 22 s.
// Account, product and numbers are made up; no third-party logos.

export const ADS_AGENTS_BUILD_DURATION = 1050
const FONT = loadRoboto('normal', { subsets: ['latin'], weights: ['400', '500', '700'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const out = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })

const INK = '#1c2b33', MUTED = '#606770', LINE = '#cbd2d9', HAIR = '#e4e6eb', BG = '#f0f2f5', BLUE = '#0a78be', BRIGHT = '#1877f2', GREEN = '#20a33a', SEL = '#e7f3ff'
const T = (size: number, color = INK, weight = 400, extra?: CSSProperties): CSSProperties => ({ fontFamily: FONT, fontSize: size, color, fontWeight: weight, whiteSpace: 'nowrap', ...extra })

// ---------- timing ----------
const PH = { campaign: 0, adset: 150, ad: 250, burst: 400, table: 480 } as const
// Real-time sequence: the "create campaign" dialog, then the editor and the tables (sped up), the review of the
// draft items and, at the end, the published campaigns with their results.
const INTRO_END = 70, EDIT_SPEED = 0.9, TBL_START = INTRO_END + Math.round(480 / EDIT_SPEED), TBL_SPEED = 0.6
const REVIEW = { open: 880, publish: 935, results: 962 }
/** Frame of the build timeline (editor and tables) at real frame f. */
const buildFrame = (f: number) => f < INTRO_END ? 0 : f < TBL_START ? (f - INTRO_END) * EDIT_SPEED : 480 + (f - TBL_START) * TBL_SPEED
/** Real frame of a build-timeline frame. */
const realFrame = (b: number) => b < 480 ? INTRO_END + b / EDIT_SPEED : TBL_START + (b - 480) / TBL_SPEED

// ---------- tree (made up) ----------
type Kind = 'campaign' | 'adset' | 'ad'
type Node = { label: string; kind: Kind; at: number; tmp?: string; renameAt?: number }
const CONCEPTS = ['C01 · TESTE DE SABOR', 'C02 · 4 BENEFÍCIOS', 'C03 · HISTÓRIA REAL', 'C04 · NA CORRERIA', 'C05 · AMIGOS · DOCE']
const TREE: Node[] = (() => {
  // Right after "Continuar": the campaign with a new ad set and a new ad; the agents rename them, duplicate the
  // structure for every concept and rename each copy while others fill the campaign.
  const n: Node[] = [{ label: 'TESTE · CBO · CONCEITOS · S45', tmp: 'Nova campanha de vendas', renameAt: 6, kind: 'campaign', at: 0 }]
  let k = 0
  CONCEPTS.forEach((c, i) => {
    const at = i === 0 ? 0 : 18 + k * 3
    n.push({ label: `${c} · AMPLO`, tmp: i === 0 ? 'Novo conjunto de anúncios de vendas' : `${n[1]?.label ?? 'C01'} – Cópia`, renameAt: i === 0 ? 14 : at + 10, kind: 'adset', at })
    k++
    ;['V1', 'V2', 'V3'].forEach((v, j) => {
      const at2 = i === 0 && j === 0 ? 0 : 18 + k * 3
      n.push({ label: `${c} · ${v}`, tmp: i === 0 && j === 0 ? 'Novo anúncio de vendas' : 'Anúncio – Cópia', renameAt: i === 0 && j === 0 ? 22 : at2 + 12, kind: 'ad', at: at2 })
      k++
    })
  })
  return n
})()
/** The node selected in the editor at frame f (index in TREE). */
function selectedAt(f: number) {
  if (f < PH.adset) return 0
  if (f < PH.ad) return 1
  if (f < PH.burst) return 2
  const ads = TREE.map((x, i) => ({ x, i })).filter(({ x, i }) => x.kind === 'ad' && i > 2)
  return ads[Math.min(ads.length - 1, Math.floor((f - PH.burst) / 8))].i
}

// ---------- small pieces ----------
function typed(v: string, f: number, at: number, cps = 1.6) { return f < at ? '' : v.slice(0, Math.floor((f - at) * cps)) }
const Icon = ({ d, size = 14, color = MUTED, w = 1.5 }: { d: string; size?: number; color?: string; w?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" style={{ flex: 'none' }}><path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></svg>
const I = { folder: 'M2 4h4l2 2h6v7H2z', grid: 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z', ad: 'M2 3h12v10H2zM5 10l2-2 2 2 3-3', search: 'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5', pencil: 'M3 13l1-3 7-7 2 2-7 7z', eye: 'M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', x: 'M4 4l8 8M12 4l-8 8', chev: 'M6 4l4 4-4 4', down: 'M4 6l4 4 4-4', info: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 7v4M8 5v.1', refresh: 'M13 8a5 5 0 1 1-1.5-3.5M13 2v3h-3', plus: 'M8 3v10M3 8h10', copy: 'M5 5h8v8H5zM3 11V3h8', chart: 'M2 14h12M4 12V8M8 12V4M12 12V6', flask: 'M6 2h4M7 2v4l-4 7h10l-4-7V2', bell: 'M4 11V7a4 4 0 0 1 8 0v4l1 2H3zM7 14h2', gear: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', gauge: 'M2.5 11a5.5 5.5 0 1 1 11 0M8 11l3-3', table: 'M2 3h12v10H2zM2 6.5h12M2 10h12M6 3v10', doc: 'M4 2h6l3 3v9H4zM6 7h5M6 10h5', mega: 'M2 7v3h3l5 3V4L5 7zM12 6v4', card: 'M2 4h12v8H2zM2 7h12', net: 'M8 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM13 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 5v3M8 8l-4 3M8 8l4 3', menu: 'M2 4h12M2 8h12M2 12h12', help: 'M6 6a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.3M8 12v.1', bug: 'M5 6h6v6a3 3 0 0 1-6 0zM8 6v9M3 8h2M11 8h2M3 12h2M11 12h2M6 4l-1-2M10 4l1-2', clock: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 5v3l2 2', split: 'M2 3h12v10H2zM7 3v10M3.5 6h2M3.5 8h2', check: 'M3 8.5l3 3 7-7', up: 'M4 10l4-4 4 4', sliders: 'M3 4h10M3 8h10M3 12h10M6 2.5v3M10 6.5v3M5 10.5v3', spark: 'M3 13l3-4 3 2 4-7M10 4h3v3', expand: 'M9 3h4v4M7 13H3V9M13 3L9 7M3 13l4-4', trash: 'M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10', mail: 'M2 4h12v8H2zM2 4l6 5 6-5', send: 'M14 2L2 7l5 2 2 5z', cal: 'M2 4h12v10H2zM2 7h12M5 2v3M11 2v3', cols: 'M2 3h12v10H2zM6 3v10M10 3v10', layers: 'M8 2l6 3-6 3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3', down2: 'M8 2v8M5 7l3 3 3-3M3 13h10', cursor: 'M4 2l8 6-4 1 2 4-1.5.8-2-4L4 12z', chat: 'M2 3h12v8H7l-3 3v-3H2z', funnel: 'M2 3h12L9.5 8.5V13l-3 1V8.5z', bag: 'M3 5h10l-1 9H4zM6 5a2 2 0 0 1 4 0', people: 'M6 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M11 7a2 2 0 1 0 0-4M12 10c1.6.4 2.8 1.8 2.8 4' }
function Toggle({ on, size = 1 }: { on: boolean; size?: number }) {
  const w = 40 * size, h = 22 * size
  return <span style={{ width: w, height: h, borderRadius: h / 2, background: on ? '#c3d7f7' : '#e4e6eb', position: 'relative', display: 'inline-block', flex: 'none' }}><i style={{ position: 'absolute', top: 2, left: on ? w - h + 2 : 2, width: h - 4, height: h - 4, borderRadius: '50%', background: on ? BRIGHT : '#1c2b33' }} /></span>
}
const Radio = ({ on }: { on: boolean }) => <i style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${on ? BRIGHT : '#bcc0c4'}`, display: 'grid', placeItems: 'center', flex: 'none', background: '#fff' }}>{on && <i style={{ width: 10, height: 10, borderRadius: '50%', background: BRIGHT }} />}</i>

function Input({ value, f, at, select, h = 38, multiline, active: forced, placeholder }: { value: string; f: number; at: number; select?: boolean; h?: number; multiline?: boolean; active?: boolean; placeholder?: string }) {
  const v = typed(value, f, at), typing = f >= at && v.length < value.length
  const active = forced ?? typing
  return <div style={{ minHeight: h, borderRadius: 6, border: `1px solid ${active ? BRIGHT : LINE}`, boxShadow: active ? '0 0 0 2px rgb(24 119 242 / .18)' : 'none', background: '#fff', display: 'flex', alignItems: multiline ? 'flex-start' : 'center', padding: multiline ? '8px 12px' : '0 12px', ...T(14, v ? INK : '#8a8d91', 400, { whiteSpace: multiline ? 'normal' : 'nowrap', lineHeight: 1.4 }) }}>
    <span style={{ flex: 1, overflow: 'hidden' }}>{v || placeholder || ''}{typing && <span style={{ color: BRIGHT }}>|</span>}</span>
    {select && <Icon d={I.down} size={12} />}
  </div>
}
function Label({ children, info }: { children: ReactNode; info?: boolean }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, ...T(15, INK, 500) }}>{children}{info && <Icon d={I.info} size={13} color={INK} />}</div>
}
function Section({ title, children, link }: { title: string; children: ReactNode; link?: string }) {
  return <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 0 0 1px rgb(0 0 0 / .05), 0 1px 3px rgb(0 0 0 / .06)', padding: '18px 18px', marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}><span style={{ width: 20, height: 20, borderRadius: '50%', border: '1.6px solid #1a7a45', display: 'grid', placeItems: 'center' }}><svg width={12} height={12} viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" fill="none" stroke="#1a7a45" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /></svg></span><b style={T(18, INK, 500)}>{title}</b>{link && <span style={{ marginLeft: 'auto', ...T(12.5, '#1a6b3c', 500), padding: '3px 8px', borderRadius: 5, background: '#e3f4e8' }}>{link}</span>}</div>
    {children}
  </div>
}

/** The made-up product creative. */
function Creative({ w, h, variant = 0 }: { w: number; h: number; variant?: number }) {
  const bgs = ['linear-gradient(160deg, #ffe7c2, #ffd0a8)', 'linear-gradient(160deg, #d9f2e6, #b6e4cf)', 'linear-gradient(160deg, #e6e1ff, #cfc5ff)']
  const pw = w * 0.52, ph = Math.min(h * 0.58, w * 0.8)
  return <div style={{ position: 'relative', width: w, height: h, borderRadius: Math.max(2, w * 0.03), overflow: 'hidden', background: bgs[variant % 3], flex: 'none' }}>
    <div style={{ position: 'absolute', left: (w - pw) / 2, top: (h - ph) * 0.42, width: pw, height: ph, borderRadius: `${pw * 0.12}px ${pw * 0.12}px ${pw * 0.08}px ${pw * 0.08}px`, background: 'linear-gradient(180deg, #7ac943, #4e9a2a)', boxShadow: '0 4px 10px rgb(0 0 0 / .18)', transform: `rotate(${variant % 2 ? -6 : 5}deg)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ph * 0.16, textAlign: 'center', ...T(pw * 0.2, '#fff', 700) }}>nutri</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: ph * 0.42, textAlign: 'center', ...T(pw * 0.13, '#eaffd8', 500) }}>gomas</div>
      {[0, 1, 2].map(k => <i key={k} style={{ position: 'absolute', left: pw * (0.22 + k * 0.2), top: ph * 0.7, width: pw * 0.15, height: pw * 0.15, borderRadius: '45%', background: ['#ff6b6b', '#ffd93d', '#ff9f43'][k] }} />)}
    </div>
    {h > w * 1.2 && w > 100 && <div style={{ position: 'absolute', left: 8, right: 8, bottom: h * 0.16, padding: '4px 6px', borderRadius: 4, background: 'rgb(255 255 255 / .92)', ...T(Math.max(8, w * 0.045), INK, 500, { whiteSpace: 'normal', lineHeight: 1.25 }) }}>Esse pacote salvou minha rotina de vitaminas</div>}
  </div>
}

// ---------- browser chrome (shared) ----------

function Browser({ f }: { f: number }) {
  const live = Math.min(24, Math.floor(interpolate(f, [2, 30], [0, 24], clamp)))
  return <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 40, background: '#dfe1e5', display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 10px' }}>
      <span style={{ display: 'flex', gap: 7, alignSelf: 'center', marginRight: 10 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <i key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}</span>
      <div style={{ height: 32, width: 250, borderRadius: '8px 8px 0 0', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', ...T(12, INK) }}><i style={{ width: 14, height: 14, borderRadius: 3, background: '#bcc0c4' }} />Gerenciador de Anúncios · Campanhas<span style={{ marginLeft: 'auto', color: MUTED }}>×</span></div>
      <div style={{ height: 32, width: 190, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', ...T(12, MUTED) }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />Agentes · {live} em execução</div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 40, height: 36, background: '#fff', borderBottom: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px' }}>
      <span style={T(15, MUTED)}>←</span><span style={T(15, '#bcc0c4')}>→</span><Icon d={I.refresh} size={13} />
      <div style={{ flex: 1, height: 26, borderRadius: 13, background: '#f1f3f4', display: 'flex', alignItems: 'center', padding: '0 12px', ...T(12, MUTED) }}>gerenciador-de-anuncios/campanhas?act=8124003179&amp;edit=1</div>
      <span style={{ ...T(11.5, '#fff', 700), padding: '3px 10px', borderRadius: 999, background: '#1c1e21' }}>● {live} agentes</span>
    </div>
  </>
}

// ---------- editor ----------

const NAV_W = 60, DARK_W = 46
const TOP = 76, RAIL_W = NAV_W + DARK_W, TREE_W = 340
const MAIN_X = RAIL_W + TREE_W, FORM_X = MAIN_X + 22, FORM_W = 600, SIDE_X = FORM_X + FORM_W + 18, SIDE_W = 1920 - SIDE_X - 22
const CONTENT_TOP = TOP + 100, FOOT_H = 62
const EDIT_BG = 'linear-gradient(170deg, #f4f2fb 0%, #eef3f8 55%, #edf5f6 100%)'
const DARK = '#1c2b33', DRAFT = '#e8f5ee'

/** The white navigation rail on the far left (shared by the tables and the editor). */
function NavRail() {
  const icons = [I.gauge, I.table, I.doc, I.people, I.mega, I.card, I.net, I.menu]
  return <div style={{ position: 'absolute', left: 0, top: TOP, width: NAV_W, bottom: 0, background: '#fff', borderRight: `1px solid ${HAIR}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14 }}>
    <span style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #7ac943, #4e9a2a)' }} />
    <span style={{ position: 'relative', marginTop: 26 }}><Icon d={I.bell} size={22} color={INK} w={1.6} /><span style={{ position: 'absolute', right: -9, top: -7, minWidth: 18, height: 18, borderRadius: 9, background: '#e41e3f', ...T(10.5, '#fff', 700), display: 'grid', placeItems: 'center', padding: '0 4px' }}>3</span></span>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 30 }}>
      {icons.map((d, i) => <span key={i} style={{ width: 40, height: 40, borderRadius: 8, background: i === 1 ? '#e7f0fd' : 'transparent', display: 'grid', placeItems: 'center' }}><Icon d={d} size={21} color={i === 1 ? BRIGHT : INK} w={1.6} /></span>)}
    </div>
    <div style={{ marginTop: 'auto', marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, borderTop: `1px solid ${HAIR}`, paddingTop: 16, width: 36 }}>
      {[I.help, I.gear, I.search, I.bug].map((d, i) => <Icon key={i} d={d} size={20} color={INK} w={1.6} />)}
    </div>
  </div>
}

/** The dark rail of the editor: close, insights, edit (selected), history. */
function DarkRail() {
  return <div style={{ position: 'absolute', left: NAV_W, top: TOP, width: DARK_W, bottom: 0, background: DARK, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 10 }}>
    {[I.x, I.chart, I.pencil, I.clock].map((d, i) => <span key={i} style={{ width: 34, height: 34, borderRadius: 6, background: i === 2 ? '#3a4a54' : 'transparent', display: 'grid', placeItems: 'center' }}><Icon d={d} size={17} color="#fff" w={1.8} /></span>)}
    <span style={{ position: 'absolute', top: '46%', width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center' }}><Icon d={I.chev} size={11} color={DARK} w={2.2} /></span>
  </div>
}

/** A node's name: the default one, then typed over by the agent that renames it. */
function nodeLabel(n: Node, f: number) {
  if (n.renameAt === undefined || !n.tmp) return n.label
  if (f < n.renameAt) return n.tmp
  const t = typed(n.label, f, n.renameAt, 2.4)
  return t.length < n.label.length ? t + '|' : n.label
}
const TREE_ROW = 44
function Tree({ f, sel }: { f: number; sel: number }) {
  const shown = TREE.map((n, i) => ({ n, i })).filter(({ n }) => f >= n.at)
  const fit = Math.floor((1080 - TOP - 20) / TREE_ROW)
  const selPos = shown.findIndex(({ i }) => i === sel)
  const scroll = Math.max(0, Math.min(shown.length - fit, selPos - fit + 4)) * TREE_ROW
  return <div style={{ position: 'absolute', left: RAIL_W, top: TOP, width: TREE_W, bottom: 0, background: '#fff', borderRight: `1px solid ${HAIR}`, overflow: 'hidden' }}>
    <div style={{ transform: `translateY(${-scroll}px)` }}>
      {shown.map(({ n, i }) => {
        const p = out(f, n.at, n.at + 8), on = i === sel
        const depth = n.kind === 'campaign' ? 0 : n.kind === 'adset' ? 1 : 2
        return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, height: TREE_ROW, paddingLeft: 16 + depth * 18, paddingRight: 12, background: on ? '#e7f0fd' : DRAFT, borderBottom: '1px solid #fff', opacity: p, transform: `translateX(${(1 - p) * -12}px)` }}>
          <Icon d={n.kind === 'campaign' ? I.folder : n.kind === 'adset' ? I.grid : I.ad} size={16} color={on ? BRIGHT : INK} w={1.6} />
          <span style={{ ...T(14.5, on ? BRIGHT : INK, 400), overflow: 'hidden', textOverflow: 'ellipsis' }}>{nodeLabel(n, f)}</span>
        </div>
      })}
    </div>
  </div>
}

function Header({ f, sel }: { f: number; sel: number }) {
  const node = TREE[sel]
  const adset = node.kind === 'ad' ? [...TREE.slice(0, sel)].reverse().find(n => n.kind === 'adset') : node.kind === 'adset' ? node : undefined
  const nSets = TREE.filter(x => x.kind === 'adset' && f >= x.at).length, nAds = TREE.filter(x => x.kind === 'ad' && f >= x.at).length
  const crumbs: [string, string, boolean][] = [
    [I.folder, nodeLabel(TREE[0], f), node.kind === 'campaign'],
    [I.grid, adset && node.kind !== 'campaign' ? adset.label : `${nSets} ${nSets === 1 ? 'Conjunto' : 'Conjuntos'} de anúncios`, node.kind === 'adset'],
    [I.ad, node.kind === 'ad' ? node.label : `${nAds} ${nAds === 1 ? 'anúncio' : 'anúncios'}`, node.kind === 'ad'],
  ]
  return <div style={{ position: 'absolute', left: MAIN_X, right: 0, top: TOP, height: 100, background: '#fff' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 54, padding: '0 14px' }}>
      <span style={{ width: 34, height: 32, borderRadius: 6, border: `1px solid ${LINE}`, display: 'grid', placeItems: 'center' }}><Icon d={I.split} size={15} color={INK} w={1.7} /></span>
      {crumbs.map(([d, l, on], i) => <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: on ? 300 : 230 }}>
        {i > 0 && <Icon d={I.chev} size={12} color={MUTED} />}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 4, background: on ? '#e7f0fd' : 'transparent', overflow: 'hidden', ...T(15, on ? BRIGHT : MUTED, 400) }}><Icon d={d} size={15} color={on ? BRIGHT : MUTED} w={1.6} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</span></span>
      </span>)}
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, ...T(14, INK) }}><i style={{ width: 11, height: 11, borderRadius: '50%', border: `1.6px solid ${INK}` }} />Em rascunho</span>
      <span style={{ width: 1, height: 26, background: HAIR, margin: '0 6px' }} />
      <Toggle on />
      <span style={{ width: 36, height: 32, borderRadius: 6, border: `1px solid ${LINE}`, display: 'grid', placeItems: 'center', ...T(16, INK, 700) }}>···</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, height: 46, alignItems: 'center' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 6, background: '#e7f0fd', ...T(15, BRIGHT, 500) }}><Icon d={I.pencil} size={15} color={BRIGHT} w={1.8} />Editar</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', ...T(15, INK, 400) }}><Icon d={I.eye} size={16} color={INK} />Analisar</span>
    </div>
  </div>
}

function Footer({ f, kind }: { f: number; kind: Kind }) {
  const saving = f % 50 < 22
  return <div style={{ position: 'absolute', left: MAIN_X, right: 0, bottom: 0, height: FOOT_H, background: '#fff', borderTop: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px' }}>
    {kind === 'ad'
      ? <span style={{ ...T(13.5, INK, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), maxWidth: 760 }}>Ao clicar em <b>Publicar</b>, você aceita que seu uso das ferramentas de anúncios está sujeito aos nossos <span style={{ color: BRIGHT }}>Termos e Condições</span>.</span>
      : <>
        <span style={{ ...T(15, INK, 500), padding: '8px 16px', borderRadius: 6, border: `1px solid ${LINE}` }}>Fechar</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, ...T(14.5, INK) }}>{saving ? <><i style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #cfe0fb', borderTopColor: BRIGHT, transform: `rotate(${f * 14}deg)` }} />Salvando...</> : <><Icon d={I.check} size={16} color="#1a8a3a" w={2.2} />Todas as edições salvas</>}</span>
      </>}
    <span style={{ marginLeft: 'auto' }} />
    {kind !== 'campaign' && <span style={{ ...T(15, INK, 500), padding: '8px 16px', borderRadius: 6, border: `1px solid ${LINE}` }}>Voltar</span>}
    {kind === 'ad'
      ? <span style={{ ...T(15, '#fff', 700), padding: '9px 18px', borderRadius: 6, background: '#1a7a45' }}>Publicar</span>
      : <span style={{ ...T(15, '#fff', 700), padding: '9px 18px', borderRadius: 6, background: BRIGHT }}>Avançar</span>}
  </div>
}

function SideCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 0 0 1px rgb(0 0 0 / .05), 0 1px 3px rgb(0 0 0 / .06)', padding: '16px 18px', marginBottom: 12, ...style }}>{children}</div>
}
function ScoreRing({ score, size = 58 }: { score: number; size?: number }) {
  const r = size / 2 - 4, c = 2 * Math.PI * r, color = score >= 95 ? '#1a8a3a' : '#f7b928'
  return <svg width={size} height={size} style={{ flex: 'none' }}>
    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={HAIR} strokeWidth={4} />
    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${c * score / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" />
    <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: FONT, fontSize: size * 0.3, fontWeight: 700, fill: INK }}>{score}</text>
  </svg>
}
/** Right column: the campaign score and the account controls. */
function Summary({ score = 100, compact }: { title?: string; score?: number; compact?: boolean }) {
  return <>
    <SideCard style={compact ? { padding: '10px 14px' } : undefined}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <ScoreRing score={score} size={compact ? 44 : 60} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...T(compact ? 16 : 17, INK, 500) }}>Pontuação da campanha<Icon d={I.info} size={13} color={INK} /></div>
          <div style={{ ...T(14, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), marginTop: 3 }}>{score >= 95 ? 'Você está usando nossa configuração recomendada.' : '3 recomendações valendo 17 pontos'}</div>
        </div>
      </div>
      {!compact && <div style={{ borderTop: `1px solid ${HAIR}`, marginTop: 16, paddingTop: 14, ...T(14, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.45 }) }}>Nenhuma recomendação adicional disponível.</div>}
    </SideCard>
    <SideCard style={compact ? { padding: '10px 14px' } : undefined}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon d={I.sliders} size={16} color={INK} /><b style={T(16, INK, 500)}>Controles da conta</b><span style={{ marginLeft: 'auto' }}><Icon d={I.down} size={14} color={INK} /></span></div>
      <div style={{ ...T(14, MUTED), marginTop: 4, marginLeft: 24 }}>Nenhum definido</div>
    </SideCard>
  </>
}

const scrollWrap = (scroll: number, children: ReactNode) => <div style={{ position: 'absolute', left: MAIN_X, right: 0, top: CONTENT_TOP, bottom: FOOT_H, overflow: 'hidden' }}><div style={{ position: 'absolute', left: FORM_X - MAIN_X, top: 14 - scroll, width: FORM_W }}>{children}</div></div>
const NameRow = ({ value, f, at }: { value: string; f: number; at: number }) => <div style={{ display: 'flex', gap: 10 }}>
  <div style={{ flex: 1 }}><Input value={value} f={f} at={at} /></div>
  <span style={{ ...T(14.5, INK, 500), padding: '0 16px', height: 38, display: 'grid', placeItems: 'center', borderRadius: 6, border: `1px solid ${LINE}` }}>Criar modelo</span>
</div>
const Static = ({ label, value, info }: { label: string; value: string; info?: boolean }) => <div style={{ marginBottom: 12 }}><Label info={info}>{label}</Label><div style={T(13.5, MUTED)}>{value}</div></div>
const ToggleRow = ({ title, text, on }: { title: string; text: string; on: boolean }) => <SideCardLike>
  <div style={{ display: 'flex', alignItems: 'center' }}><b style={T(17, INK, 500)}>{title}</b><span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, ...T(14, INK) }}>{on ? 'Ativado' : 'Desativado'}<Toggle on={on} /></span></div>
  <div style={{ ...T(14, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.5 }), marginTop: 10 }}>{text}</div>
</SideCardLike>
function SideCardLike({ children }: { children: ReactNode }) {
  return <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 0 0 1px rgb(0 0 0 / .05), 0 1px 3px rgb(0 0 0 / .06)', padding: '18px 18px', marginBottom: 12 }}>{children}</div>
}
const Tip = ({ title, children }: { title: string; children: ReactNode }) => <div style={{ borderLeft: '3px solid #2fa36b', background: '#fff', boxShadow: '0 0 0 1px rgb(0 0 0 / .06)', borderRadius: 4, padding: '12px 14px', marginTop: 12 }}>
  <div style={{ display: 'flex', gap: 8 }}><Icon d={I.spark} size={16} color={INK} /><b style={T(14.5, INK, 500, { whiteSpace: 'normal', lineHeight: 1.35 })}>{title}</b></div>
  <div style={{ ...T(13.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.5 }), marginTop: 8 }}>{children}</div>
</div>

function CampaignEditor({ f }: { f: number }) {
  const t = f - PH.campaign
  const cbo = t >= 34
  const scroll = interpolate(t, [44, 70, 92, 120], [0, 230, 230, 560], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  return <>
    {scrollWrap(scroll, <>
      <Section title="Nome da campanha"><NameRow value="TESTE · CBO · CONCEITOS · S45" f={f} at={2} /></Section>
      <Section title="Detalhes da campanha">
        <Static label="Tipo de compra" value="Leilão" />
        <Static label="Objetivo da campanha" value="Vendas" info />
        <div style={{ ...T(14, BRIGHT, 400), marginTop: -4 }}>Mostrar mais opções ▾</div>
      </Section>
      <Section title="Orçamento" link="✦ Advantage+ ativado">
        <div style={{ borderRadius: 6, background: '#e7effa', padding: '10px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...T(15, INK, 500) }}>Estratégia de orçamento<Icon d={I.info} size={13} color={INK} /><span style={{ marginLeft: 'auto' }}><Icon d={I.up} size={14} color={INK} /></span></div>
          <div style={{ background: '#fff', borderRadius: 6, padding: '12px 14px', marginTop: 10 }}>
            {[['Orçamento da campanha', 'Distribua seu orçamento automaticamente para as melhores oportunidades na sua campanha. Também chamado de orçamento de campanha Advantage+. ', 'Sobre o orçamento da campanha', cbo], ['Orçamento do conjunto de anúncios', 'Defina estratégias de lance ou programações de orçamento diferentes para cada conjunto de anúncios.', '', !cbo]].map(([a, b, link, on], i) => <div key={a as string} style={{ display: 'flex', gap: 12, marginTop: i ? 14 : 0 }}>
              <span style={{ marginTop: 2 }}><Radio on={Boolean(on)} /></span>
              <div><div style={T(15, INK, 400)}>{a as string}</div><div style={{ ...T(13, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.45 }), marginTop: 2 }}>{b as string}{link && <span style={{ color: BRIGHT }}>{link as string}</span>}</div></div>
            </div>)}
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 14 }}>
          <div style={{ width: 270 }}><Input value="Orçamento diário" f={f} at={44} select /></div>
          <div style={{ flex: 1, marginLeft: -1 }}><div style={{ height: 38, borderRadius: 6, border: `1px solid ${t >= 50 && t < 64 ? BRIGHT : LINE}`, display: 'flex', alignItems: 'center', padding: '0 12px', ...T(14, INK) }}>R$&nbsp;<span style={{ background: t >= 50 && t < 64 ? '#cfe0fb' : 'transparent' }}>{typed('300', f, 52, 0.4)}</span><span style={{ marginLeft: 'auto', color: MUTED }}>BRL</span></div></div>
        </div>
        <div style={{ ...T(13, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.5 }), marginTop: 8 }}>Gastaremos cerca de R$ 300,00 por dia. Seu gasto diário máximo é de <b style={{ color: INK }}>R$ 525,00</b>, e o seu gasto semanal máximo é de <b style={{ color: INK }}>R$ 2.100,00</b>. <span style={{ color: BRIGHT }}>Sobre o orçamento diário</span></div>
        <div style={{ ...T(13, MUTED), marginTop: 10 }}>Os gastos podem ser maiores em alguns dias e menores em outros.</div>
        <div style={{ marginTop: 12 }}><Static label="Estratégia de lance da campanha" value="Volume mais alto" info /></div>
        <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 12, ...T(14, BRIGHT) }}>Mostrar mais configurações ▾</div>
      </Section>
      <ToggleRow title="Controle da frequência da campanha" on={false} text="Defina uma frequência se houver um número específico de vezes que você deseja que as pessoas vejam seus anúncios durante a campanha. Saiba mais" />
      <ToggleRow title="Teste A/B" on={t >= 100} text="Para ajudar a melhorar o desempenho do anúncio, compare versões e veja qual funciona melhor. Para maior precisão, cada uma será mostrada a grupos separados do seu público. Sobre os testes A/B" />
      <Section title="Categorias de anúncio especiais">
        <div style={{ ...T(14, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.5 }) }}>Declare se seus anúncios são relacionados a produtos e serviços financeiros, emprego, moradia, temas sociais, eleições ou política para ajudar a evitar rejeições.</div>
        <div style={{ marginTop: 12 }}><Label>Categorias</Label><Input value="" placeholder="Declarar categoria se aplicável" f={f} at={9999} select /></div>
      </Section>
    </>)}
    <div style={{ position: 'absolute', left: SIDE_X, top: CONTENT_TOP + 14, width: SIDE_W }}>
      <Summary score={100} />
    </div>
  </>
}

function Forecast({ g }: { g: number }) {
  const W = SIDE_W - 60, H = 150
  const pts = Array.from({ length: 9 }, (_, i) => [i / 8 * W, H - 10 - Math.pow(i / 8, 1.6) * (H - 30) * (0.6 + 0.4 * g)])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const band = `${pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y - 12 - i * 2}`).join(' ')} ${[...pts].reverse().map(([x, y], i) => `L${x},${y + 12 + (8 - i) * 2}`).join(' ')} Z`
  return <SideCard>
    <div style={{ display: 'flex' }}><b style={T(18, INK, 500, { whiteSpace: 'normal', lineHeight: 1.3 })}>Previsão de resultados diários da campanha</b><span style={{ marginLeft: 'auto' }}><Icon d={I.info} size={14} color={INK} /></span></div>
    {[['Custo estimado por resultado', 'R$ 31,40', 'Provável variação: R$ 18,20 a R$ 46,90'], ['Previsão de resultados da campanha', `${Math.round(9 + g * 12)}`, 'Provável variação: 6 a 34 compras']].map(([a, b, c]) => <div key={a} style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', ...T(15, INK, 500) }}>{a}<span style={{ marginLeft: 'auto' }}>{b}</span></div>
      <div style={{ ...T(13, MUTED), marginTop: 2 }}>{c}</div>
    </div>)}
    <svg width={W} height={H} style={{ marginTop: 14 }}>
      {[0.25, 0.5, 0.75].map(k => <line key={k} x1={0} x2={W} y1={H * k} y2={H * k} stroke={HAIR} />)}
      <path d={band} fill="rgb(24 119 242 / .12)" />
      <path d={line} fill="none" stroke={BRIGHT} strokeWidth={2} strokeDasharray="6 5" />
      <circle cx={pts[5][0]} cy={pts[5][1]} r={4} fill={BRIGHT} />
    </svg>
  </SideCard>
}

function AdSetEditor({ f }: { f: number }) {
  const t0 = PH.adset
  const g = Math.min(1, Math.max(0, (f - t0 - 50) / 50))
  const scroll = interpolate(f - t0, [30, 54, 70, 96], [0, 330, 330, 760], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  const advPlacements = f >= t0 + 88
  return <>
    {scrollWrap(scroll, <>
      <Section title="Nome do conjunto de anúncios"><NameRow value="C01 · TESTE DE SABOR · AMPLO" f={f} at={t0 + 1} /></Section>
      <Section title="Conversão">
        <Label>Local da conversão</Label><Input value="Site" f={f} at={t0 + 4} select />
        <div style={{ marginTop: 14 }}><Label>Meta de desempenho</Label><div style={{ ...T(13, MUTED), marginTop: -2, marginBottom: 6 }}>Como você mensura o sucesso dos seus anúncios. <span style={{ color: BRIGHT }}>Sobre metas de desempenho</span></div><Input value="Maximizar o número de conversões" f={f} at={t0 + 10} select /></div>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <div style={{ flex: 1 }}><Label info>Pixel</Label><Input value="nutrigomas · Pixel" f={f} at={t0 + 18} select /></div>
          <div style={{ flex: 1 }}><Label>Evento de conversão</Label><Input value="Compra" f={f} at={t0 + 24} select /></div>
        </div>
        <div style={{ marginTop: 14 }}><Label info>Meta de custo por resultado</Label><div style={{ height: 38, borderRadius: 6, background: '#f0f2f5', border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', padding: '0 12px', ...T(14, '#a8adb3') }}>X,XX</div>
          <div style={{ ...T(13, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.45 }), marginTop: 6 }}>Usaremos todo o seu orçamento para obter o máximo de resultados usando a estratégia de lance de volume mais alto.</div></div>
        <Tip title="Com os públicos preferidos, você pode aumentar as conversões em 18%">As regras de valor permitem que você aumente ou diminua lances para priorizar os públicos mais relevantes para a sua empresa.</Tip>
      </Section>
      <Section title="Orçamento e programação">
        <div style={{ ...T(13.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.5 }) }}>O orçamento da campanha distribui automaticamente o valor diário de R$ 300,00 entre os conjuntos. <span style={{ color: BRIGHT }}>Sobre os gastos</span></div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}><Label>Data de início</Label><Input value="11 de nov. de 2026" f={f} at={t0 + 32} /></div>
          <div style={{ width: 150 }}><Label>&nbsp;</Label><Input value="00:00" f={f} at={t0 + 40} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}><span style={{ marginTop: 2 }}><Radio on={false} /></span><div><div style={T(15, INK)}>Definir uma data de término</div><div style={T(13, MUTED)}>Termina na data que você escolher.</div></div></div>
      </Section>
      <Section title="Público" link="✦ Advantage+ ativado">
        <div style={{ ...T(14, MUTED), marginBottom: 12 }}>Configure seu público usando controles e sugestões. <span style={{ color: BRIGHT }}>Sobre públicos</span></div>
        <div style={{ ...T(14.5, INK), marginBottom: 12 }}>Usar um público salvo ▾</div>
        <Label>Localizações</Label><Input value="Brasil" f={f} at={t0 + 50} />
        <div style={{ marginTop: 12 }}><Static label="Idade mínima" value="• 18" info /></div>
        <Label info>Excluir estes públicos personalizados</Label><Input value="Compradores · 180 dias" f={f} at={t0 + 64} placeholder="Pesquisar públicos existentes" />
        <div style={{ marginTop: 12 }}><Static label="Idiomas" value="Todos os idiomas" info /></div>
        <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 12 }}><b style={{ ...T(15, INK, 500), display: 'flex', gap: 6, alignItems: 'center' }}>Sugira um público<Icon d={I.info} size={13} color={INK} /></b>
          <div style={{ ...T(13.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.5 }), marginTop: 4 }}>Também vamos alcançar pessoas fora das configurações de <b style={{ color: INK }}>público personalizado, idade, gênero</b> e <b style={{ color: INK }}>direcionamento detalhado</b> quando houver probabilidade de melhorar o desempenho.</div></div>
      </Section>
      <Section title="Posicionamentos" link="✦ Advantage+ ativado">
        {[['Posicionamentos Advantage+ (recomendado)', 'Use os posicionamentos Advantage+ para aumentar o orçamento e mostrar os anúncios a mais pessoas.', true], ['Posicionamentos manuais', 'Escolha manualmente onde mostrar o anúncio.', false]].map(([a, b, on]) => <div key={a as string} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 6, border: `1px solid ${on && advPlacements ? BRIGHT : LINE}`, marginBottom: 8 }}>
          <span style={{ marginTop: 2 }}><Radio on={Boolean(on) && advPlacements} /></span><div><div style={T(15, INK)}>{a as string}</div><div style={{ ...T(13, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), marginTop: 2 }}>{b as string}</div></div>
        </div>)}
      </Section>
    </>)}
    <div style={{ position: 'absolute', left: SIDE_X, top: CONTENT_TOP + 14, width: SIDE_W }}>
      <Summary score={f >= t0 + 70 ? 85 : 100} />
      <Forecast g={g} />
    </div>
  </>
}

const AD_COPY = [
  ['Gomas de vitaminas que dá vontade de tomar todo dia. Mais de 20 vitaminas e minerais, sem açúcar e com sabor de fruta de verdade.', 'Saúde nunca foi tão gostosa', 'Até 35% OFF + frete grátis'],
  ['4 benefícios em 1 goma por dia: imunidade, energia, pele e foco. Experimente por 30 dias.', '4 benefícios, 1 goma', 'Garantia de 30 dias'],
  ['“Eu nunca lembrava de tomar vitamina. Agora é a parte favorita da minha manhã.”', 'A rotina mais fácil do dia', 'Frete grátis no 1º pedido'],
] as const

/** The media picker: step tabs, sources, the account's images; three get selected. */
function MediaPicker({ f, t0 }: { f: number; t0: number }) {
  const a = out(f, t0, t0 + 8) * (1 - ease(f, t0 + 42, t0 + 50))
  if (a <= 0) return null
  const picked = (i: number) => (i === 1 && f >= t0 + 16) || (i === 4 && f >= t0 + 22) || (i === 7 && f >= t0 + 28)
  const n = [1, 4, 7].filter(picked).length
  return <div style={{ position: 'absolute', left: NAV_W + 16, right: 16, top: TOP + 10, bottom: 14, background: '#fff', borderRadius: 8, boxShadow: '0 20px 60px rgb(0 0 0 / .3)', zIndex: 30, opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, height: 54, padding: '0 18px', borderBottom: `1px solid ${HAIR}` }}>
      {['Mídia', 'Corte', 'Texto', 'Geração de imagem', 'Geração de vídeo', 'Aprimoramentos', 'Tradução'].map((s, i) => <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: i === 0 ? '6px 10px' : 0, borderRadius: 6, background: i === 0 ? '#e7f0fd' : 'transparent', ...T(16, i === 0 ? BRIGHT : i === 2 ? INK : '#8a8d91', i === 0 ? 500 : 400) }}><i style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${i === 0 ? BRIGHT : i === 2 ? INK : '#bcc0c4'}`, background: i === 0 ? `linear-gradient(90deg, ${BRIGHT} 50%, #fff 50%)` : '#fff' }} />{s}</span>)}
      <span style={{ marginLeft: 'auto' }}><Icon d={I.x} size={16} color={INK} w={2} /></span>
    </div>
    <div style={{ padding: '16px 20px' }}>
      <b style={T(18, INK, 500)}>Mídia</b>
      <div style={{ ...T(14.5, INK, 400, { whiteSpace: 'normal', lineHeight: 1.45 }), marginTop: 4 }}>Selecione ou carregue a mídia que você quer usar para seu anúncio. Você pode selecionar uma imagem ou um vídeo.</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>{['Tudo', 'Conta', 'Imagens salvas', 'Empresa', 'Instagram', 'Página'].map((s, i) => <span key={s} style={{ padding: '8px 14px', borderRadius: 6, background: i === 0 ? '#e7f0fd' : 'transparent', ...T(15, i === 0 ? BRIGHT : INK) }}>{s}</span>)}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1, height: 40, borderRadius: 6, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', padding: '0 12px', ...T(14.5, MUTED) }}>Pesquisar mídia</div>
        <span style={{ height: 40, padding: '0 16px', borderRadius: 6, border: `1px solid ${LINE}`, display: 'grid', placeItems: 'center', ...T(15, INK, 500) }}>+ Carregar</span>
      </div>
      {['Imagens da conta', 'Imagens do Instagram'].map((g, row) => <div key={g} style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', ...T(15, INK) }}>{g}<span style={{ marginLeft: 'auto', color: MUTED }}>Mostrando as primeiras 10 imagens <span style={{ color: BRIGHT }}>Ver tudo</span></span></div>
        <div style={{ display: 'flex', gap: 22, marginTop: 10 }}>{Array.from({ length: 10 }, (_, i) => {
          const idx = row * 10 + i, on = row === 0 && picked(i)
          return <div key={i} style={{ width: 104 }}>
            <div style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', outline: on ? `3px solid ${BRIGHT}` : 'none' }}>
              <Creative w={104} h={row ? 138 : 104} variant={idx % 3} />
              {on && <span style={{ position: 'absolute', right: 6, top: 6, width: 20, height: 20, borderRadius: 4, background: BRIGHT, display: 'grid', placeItems: 'center' }}><Icon d={I.check} size={12} color="#fff" w={2.4} /></span>}
            </div>
            <div style={{ ...T(12.5, INK), marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row ? '' : `nutri_${['sabor', 'kit', 'manha', 'frutas', 'ugc', 'promo', 'familia', 'rotina', 'beneficios', 'oferta'][i]}.jpg`}</div>
            <div style={T(12, MUTED)}>{row ? '1080 × 1440' : i % 2 ? '1080 × 1080' : '1080 × 1920'}</div>
          </div>
        })}</div>
      </div>)}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, borderTop: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px' }}>
      <span style={T(14, INK)}>{n} selecionada(s)</span>
      <span style={{ marginLeft: 'auto', ...T(15, INK, 500), padding: '8px 16px', borderRadius: 6, border: `1px solid ${LINE}` }}>Cancelar</span>
      <span style={{ ...T(15, '#fff', 700), padding: '9px 18px', borderRadius: 6, background: n ? BRIGHT : '#a4c8f7' }}>Avançar</span>
    </div>
  </div>
}

function AdEditor({ f, sel }: { f: number; sel: number }) {
  const burst = f >= PH.burst
  const k = burst ? sel % 3 : 0
  // In the burst each ad is shown already filled in (as it was saved), right after the selection jumps to it.
  const t0 = burst ? PH.burst + Math.floor((f - PH.burst) / 8) * 8 - 200 : PH.ad
  const [text, headline, desc] = AD_COPY[k]
  const media = [t0 + 46, t0 + 48, t0 + 50]
  const shown = f >= t0 + 50
  const scroll = interpolate(f - t0, [10, 22, 54, 120], [0, 420, 420, 980], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  return <>
    {scrollWrap(scroll, <>
      <Section title="Nome do anúncio"><NameRow value={TREE[sel].label} f={f} at={t0 - 1} /></Section>
      <ToggleRow title="Anúncio em parceria" on={false} text="Veicule anúncios com criadores de conteúdo, marcas e outras empresas. Esses anúncios utilizam sinais de ambos os perfis para melhorar o desempenho da campanha. Sobre os anúncios em parceria" />
      <Section title="Identidade">
        <div style={{ ...T(14, INK), marginBottom: 12 }}>Os perfis que serão usados no seu anúncio.</div>
        <Label info>* Página</Label>
        <div style={{ height: 38, borderRadius: 6, border: `1px solid ${LINE}`, background: '#f5f6f7', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', ...T(14, INK) }}><i style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg, #7ac943, #4e9a2a)' }} />nutri gomas<span style={{ marginLeft: 'auto' }}><Icon d={I.down} size={12} /></span></div>
        <div style={{ marginTop: 12 }}><Label info>Perfil do Instagram</Label><Input value="@nutrigomas" f={f} at={t0 + 6} select /></div>
      </Section>
      <Section title="Configuração do anúncio">
        <Input value="Criar anúncio" f={f} at={t0 + 10} select />
        <div style={{ marginTop: 12 }}><Label info>Formato</Label><div style={{ ...T(13, MUTED), marginTop: -2, marginBottom: 8 }}>Escolha um layout para o criativo do anúncio.</div></div>
        {[['Imagem ou vídeo único', true], ['Carrossel', false]].map(([l, on]) => <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, ...T(15, INK) }}><Radio on={Boolean(on) && f >= t0 + 14} />{l as string}</div>)}
        <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${HAIR}`, paddingTop: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: 3, border: `1.5px solid ${BRIGHT}`, display: 'grid', placeItems: 'center', flex: 'none' }}><Icon d={I.check} size={12} color={BRIGHT} w={2.4} /></span>
          <div><div style={T(15, INK)}>Anúncios com vários anunciantes</div><div style={{ ...T(13, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.45 }), marginTop: 2 }}>Seu anúncio pode aparecer com outros na mesma unidade de anúncios para ajudar a promover a descoberta.</div></div>
        </div>
      </Section>
      <Section title="Criativo do anúncio">
        <Label>Mídia</Label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {media.map((at, i) => <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 74, height: 74, borderRadius: 6, border: f >= at ? '1px solid transparent' : `1px dashed ${LINE}`, display: 'grid', placeItems: 'center', ...T(20, '#bcc0c4') }}>{f >= at ? <div style={{ transform: `scale(${out(f, at, at + 6)})` }}><Creative w={74} h={74} variant={(i + k) % 3} /></div> : '+'}</div>
            <span style={T(12, MUTED)}>{['9:16', '4:5', '1:1'][i]}</span>
          </div>)}
          <span style={{ marginLeft: 8, ...T(14, BRIGHT) }}>Editar mídia ▾</span>
        </div>
        <div style={{ marginTop: 14 }}><Label info>Texto principal</Label><Input value={text} f={f} at={t0 + 56} multiline h={58} /></div>
        <div style={{ marginTop: 12 }}><Label info>Título</Label><Input value={headline} f={f} at={t0 + 80} /></div>
        <div style={{ marginTop: 12 }}><Label info>Descrição</Label><Input value={desc} f={f} at={t0 + 90} /></div>
        <div style={{ marginTop: 12, width: 300 }}><Label>Chamada para ação</Label><Input value="Comprar agora" f={f} at={t0 + 100} select /></div>
      </Section>
      <Section title="Destino">
        <Label>URL do site</Label><Input value="https://nutrigomas.com.br/oferta-primeiro-pedido" f={f} at={t0 + 106} />
        <div style={{ marginTop: 12 }}><Label info>Parâmetros de URL</Label><Input value={`utm_source=ads&utm_medium=pago&utm_campaign=c0${(sel % 5) + 1}`} f={f} at={t0 + 114} /></div>
      </Section>
    </>)}
    <div style={{ position: 'absolute', left: SIDE_X, top: CONTENT_TOP + 14, width: SIDE_W }}>
      <Summary score={83} compact />
      <SideCard style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Toggle on={shown} /><span style={T(15, INK)}>Prévia do anúncio</span>
          <span style={{ marginLeft: 'auto', ...T(14, INK), padding: '7px 12px', borderRadius: 6, border: `1px solid ${LINE}` }}>Analisar configurações padrão</span>
          <span style={{ width: 34, height: 32, borderRadius: 6, border: `1px solid ${LINE}`, display: 'grid', placeItems: 'center' }}><Icon d={I.expand} size={14} color={INK} /></span>
        </div>
        {shown && <div style={{ display: 'flex', gap: 14, marginTop: 14, justifyContent: 'center', opacity: out(f, t0 + 50, t0 + 58) }}>
          <div style={{ width: 290, borderRadius: 8, boxShadow: '0 0 0 1px rgb(0 0 0 / .1)', overflow: 'hidden', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10 }}><i style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7ac943, #4e9a2a)' }} /><div><b style={T(12.5, INK, 700)}>nutri gomas</b><div style={T(11, MUTED)}>Patrocinado</div></div></div>
            <div style={{ ...T(12, INK, 400, { whiteSpace: 'normal', lineHeight: 1.35 }), padding: '0 10px 8px', height: 50, overflow: 'hidden' }}>{typed(text, f, t0 + 56)}</div>
            <Creative w={290} h={290} variant={k} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f0f2f5' }}>
              <div style={{ minWidth: 0 }}><div style={T(10.5, MUTED)}>NUTRIGOMAS.COM.BR</div><b style={{ ...T(12.5, INK, 700), display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{typed(headline, f, t0 + 80)}</b></div>
              <span style={{ marginLeft: 'auto', ...T(11.5, INK, 700), padding: '6px 10px', borderRadius: 6, background: '#e4e6eb' }}>{f >= t0 + 100 ? 'Comprar agora' : 'Saiba mais'}</span>
            </div>
            <div style={{ display: 'flex', gap: 18, padding: '8px 12px', ...T(11.5, MUTED) }}><span>Curtir</span><span>Comentar</span><span>Compartilhar</span></div>
          </div>
          <div style={{ width: 240, height: 426, borderRadius: 10, overflow: 'hidden', background: '#000', position: 'relative' }}>
            <Creative w={240} h={426} variant={(k + 1) % 3} />
            <div style={{ position: 'absolute', left: 10, bottom: 46, display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #7ac943, #4e9a2a)', border: '1.5px solid #fff' }} /><b style={T(11, '#fff', 700)}>nutrigomas</b><span style={T(10, '#fff')}>· Patrocinado</span></div>
            <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, padding: '6px 0', borderRadius: 6, background: 'rgb(255 255 255 / .9)', textAlign: 'center', ...T(11, INK, 700) }}>{f >= t0 + 100 ? 'Comprar agora' : 'Saiba mais'} ›</div>
          </div>
        </div>}
      </SideCard>
    </div>
    {!burst && <MediaPicker f={f} t0={t0 + 18} />}
  </>
}

function Editor({ f }: { f: number }) {
  const sel = selectedAt(f)
  const kind = TREE[sel].kind
  return <>
    <NavRail />
    <DarkRail />
    <Tree f={f} sel={sel} />
    <Header f={f} sel={sel} />
    <div style={{ position: 'absolute', left: MAIN_X, right: 0, top: CONTENT_TOP, bottom: FOOT_H, background: EDIT_BG }} />
    {kind === 'campaign' && <CampaignEditor f={f} />}
    {kind === 'adset' && <AdSetEditor f={f} />}
    {kind === 'ad' && <AdEditor f={f} sel={sel} />}
    <Footer f={f} kind={kind} />
  </>
}

// ---------- tables ----------

type Tag = [string, string]
const TAGS: Record<string, Tag> = { test: ['Testando', '#f7b928'], scale: ['Escala', '#31a24c'], rt: ['Retargeting', '#5b72f2'], ret: ['Retenção', '#0ea5a4'] }
const CAMPAIGN_ROWS: { name: string; tag: Tag; bid: string; budget: string }[] = [
  { name: 'TESTE · CBO · CONCEITOS · S45', tag: TAGS.test, bid: 'Maior volume', budget: 'R$ 300,00' },
  { name: 'ESCALA · ADV+ · VENDAS · VENCEDORES', tag: TAGS.scale, bid: 'Maior volume', budget: 'R$ 3.000,00' },
  { name: 'ESCALA · CBO · AMPLO · BR', tag: TAGS.scale, bid: 'Meta de custo por resultado', budget: 'R$ 1.500,00' },
  { name: 'RT · CBO · PÚBLICOS QUENTES', tag: TAGS.rt, bid: 'Maior volume', budget: 'R$ 600,00' },
  { name: 'RETENÇÃO · COMPRADORES', tag: TAGS.ret, bid: 'Maior volume', budget: 'R$ 400,00' },
]
const ADSET_ROWS: { name: string; tag: Tag }[] = [
  ['C05 · AMIGOS · DOCE · AMPLO', TAGS.test], ['C06 · DIAS CORRIDOS · 60 FIBRAS', TAGS.test], ['ADV+ · VENCEDORES · POST ID', TAGS.scale], ['AMPLO · BR · 25–54', TAGS.scale], ['AMPLO · MULHERES · 25–44', TAGS.scale],
  ['VISITANTES DO SITE · 30D', TAGS.rt], ['ADICIONOU AO CARRINHO · 14D', TAGS.rt], ['ENVOLVIMENTO IG + FB · 60D', TAGS.rt], ['COMPRADORES · 180D', TAGS.ret],
].map(([n, t]) => ({ name: n as string, tag: t as Tag }))
const AD_ROWS = ['C05 · AMIGOS · DOCE · V3', 'C06 · DIAS CORRIDOS · V1', 'C06 · DIAS CORRIDOS · V2', 'C06 · DIAS CORRIDOS · V3', 'VENCEDOR · 4 BENEFÍCIOS · POST', 'VENCEDOR · TESTE DE SABOR · POST', 'AMPLO · 4 BENEFÍCIOS · V1', 'AMPLO · HISTÓRIA REAL · V2', 'RT · DEPOIMENTO · V1']
const RESULTS: [string, string, string, string][] = [
  ['R$ 1.512,40', '38', 'R$ 39,80', '2,31'], ['R$ 14.870,10', '412', 'R$ 36,09', '2,78'], ['R$ 7.210,55', '186', 'R$ 38,77', '2,54'], ['R$ 2.940,30', '121', 'R$ 24,30', '3,92'], ['R$ 1.988,00', '97', 'R$ 20,49', '4,47'],
]
const countUp = (v: string, p: number) => {
  const n = Number(v.replace('R$ ', '').replace(/\./g, '').replace(',', '.'))
  const x = n * p, money = v.startsWith('R$'), dec = v.includes(',') && !money
  return money ? `R$ ${x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : dec ? x.toFixed(2).replace('.', ',') : String(Math.round(x))
}
const reviewCount = (f: number) => f < PH.table ? Math.min(39, TREE.filter(n => f >= n.at).length + 18) : Math.min(41, 39 + Math.floor(interpolate(f, [600, 640], [0, 2.99], clamp)))

/** When row i of a table tab starts being created (build timeline). */
const ROW_WORK = 13
// The agents go back and forth between the levels: each visit adds a few rows to that level.
// [tab, from, to, first row, rows] on the build timeline.
const VISITS: [number, number, number, number, number][] = [
  [0, 480, 506, 1, 2], [1, 506, 530, 0, 4], [2, 530, 552, 0, 4], [1, 552, 572, 4, 5], [2, 572, 596, 4, 5], [0, 596, 642, 3, 2],
]
const visitAt = (f: number) => VISITS.find(([, a, b]) => f >= a && f < b) ?? VISITS[VISITS.length - 1]
/** When row i of a level starts being created (build timeline). */
function rowAt(tab: number, i: number) {
  if (tab === 0 && i === 0) return 400 // made in the editor
  for (const [t, a, b, first, n] of VISITS) {
    if (t !== tab || i < first || i >= first + n) continue
    return a + 2 + (i - first) * Math.floor((b - a - 4) / n)
  }
  return 9999
}
const EDITS = [
  ['Advantage+ vendas · ativado', 'Meta de custo · R$ 35', 'Orçamento · R$ 600/dia', 'Público quente · 30D', 'Compradores · 180D'],
  ['Público amplo · 25–54', 'Mulheres · 25–44', 'Visitantes · 30 dias', 'Carrinho · 14 dias', 'Envolvimento · 60 dias', 'Posicionamentos Advantage+'],
  ['Mídia 9:16 · enviada', 'Título · ok', 'Texto principal · ok', 'UTM · c06', 'ID da publicação · vinculado'],
]
/** Where the table rows start, from the top of the screen. */
const ROWS_TOP = TOP + 352
function TableCursors({ f, tab, count }: { f: number; tab: number; count: number }) {
  let active = -1
  for (let i = 0; i < count; i++) if (f >= rowAt(tab, i)) active = i
  const y = ROWS_TOP + Math.max(0, active) * 50 + 25
  const spots: [number, number][] = [[230, 0], [520, 6], [880, 2], [1060, -4], [360, 70], [700, 120], [1000, 90], [1400, 140], [540, 180]]
  return <>{ROLES.map(([name, color], a) => {
    const [x0, dy] = spots[a % spots.length]
    const onRow = a < 4
    const x = x0 + Math.sin((f + a * 11) / 16) * (onRow ? 12 : 24), yy = (onRow ? y + dy : y + 60 + dy) + Math.cos((f + a * 7) / 18) * 4
    return <div key={a} style={{ position: 'absolute', left: x, top: yy - TOP, zIndex: 30 }}>
      <svg width={16} height={18} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / .35))' }}><path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill="#1c1e21" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" /></svg>
      <span style={{ position: 'absolute', left: 12, top: 14, padding: '1px 7px', borderRadius: 999, background: color, ...T(10.5, '#fff', 700) }}>{name}</span>
    </div>
  })}</>
}

const COLS: [string, number, 'l' | 'r'][] = [['Desativ./Ativ.', 130, 'l'], ['Campanha', 470, 'l'], ['Veiculação', 170, 'l'], ['Estratégia de lance', 200, 'l'], ['Orçamento', 160, 'r'], ['Valor usado', 150, 'r'], ['Compras', 120, 'r'], ['Custo por compra', 160, 'r'], ['ROAS de compras', 150, 'r']]
function Tables({ f, mode = 'build', raw = 0 }: { f: number; mode?: 'empty' | 'build' | 'published'; raw?: number }) {
  const tab = mode !== 'build' ? 0 : visitAt(f)[0]
  const title = ['Campanhas', 'Conjuntos de anúncios', 'Anúncios'][tab]
  const nameCol = ['Campanha', 'Conjunto de anúncios', 'Anúncio'][tab]
  const rows = mode === 'empty' ? [] : tab === 0 ? CAMPAIGN_ROWS.map(r => ({ ...r, thumb: -1 })) : tab === 1 ? ADSET_ROWS.map(r => ({ ...r, bid: 'Usando o lance da campanha', budget: 'Usando orç. da campanha', thumb: -1 })) : AD_ROWS.map((n, i) => ({ name: n, tag: undefined as Tag | undefined, bid: 'Usando lance do conjunto', budget: 'Usando orç. da campanha', thumb: i }))
  const n = reviewCount(f)
  const res = mode === 'published' ? out(raw, REVIEW.results + 6, REVIEW.results + 50) : 0
  const box = (extra?: CSSProperties): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 6, border: `1px solid ${LINE}`, background: '#fff', ...T(15, INK), ...extra })
  return <div style={{ position: 'absolute', left: NAV_W, right: 0, top: TOP, bottom: 0, background: '#f4f5f7', opacity: mode === 'build' ? out(f, PH.table, PH.table + 10) : 1 }}>
    <div style={{ height: 64, background: '#fff', display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px' }}>
      <b style={T(22, INK, 700)}>{title}</b>
      <span style={box({ width: 320 })}><span style={{ width: 24, height: 24, borderRadius: 4, background: '#c7cbd1', ...T(12, '#fff', 700), display: 'grid', placeItems: 'center' }}>N</span><Icon d={I.card} size={15} color={INK} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>NUTRI GOMAS · BR (8124003179)</span><span style={{ marginLeft: 'auto' }}><Icon d={I.down} size={13} color={INK} /></span></span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, ...T(15, INK) }}><span style={{ width: 30, height: 30, borderRadius: '50%', border: `2.5px solid ${BRIGHT}`, display: 'grid', placeItems: 'center', ...T(11, INK, 700) }}>100</span>Pontuação de oportunidade<Icon d={I.down} size={13} color={INK} /></span>
      <span style={{ marginLeft: 'auto', ...T(15, INK) }}>Atualizado agora mesmo</span>
      <span style={box({ width: 40, padding: 0, justifyContent: 'center' })}><Icon d={I.refresh} size={16} color={INK} /></span>
      <span style={box()}><Icon d={I.trash} size={15} color={INK} />Descartar rascunhos</span>
      <span style={{ ...T(15, '#fff', 700), height: 40, display: 'grid', placeItems: 'center', padding: '0 16px', borderRadius: 6, background: BRIGHT, transform: `scale(${mode === 'build' && f % 30 < 4 ? 1.04 : 1})`, opacity: mode === 'build' ? 1 : 0.55 }}>Conferir e publicar{mode === 'build' ? ` (${n})` : ''}</span>
      <span style={box({ width: 40, padding: 0, justifyContent: 'center', fontWeight: 700 })}>···</span>
      <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f7b928, #e4405f)' }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 0' }}>
      <span style={box({ borderColor: BRIGHT, color: BRIGHT })}><Icon d={I.folder} size={15} color={BRIGHT} />Todos os anúncios</span>
      <span style={box({ background: '#e7f0fd', borderColor: '#e7f0fd' })}><Icon d={I.mail} size={15} color={INK} />Tiveram veiculação</span>
      <span style={box()}><Icon d={I.gauge} size={15} color={INK} />Ações</span>
      <span style={box()}><Icon d={I.send} size={15} color={INK} />Anúncios ativos</span>
      <span style={{ ...T(15, INK), padding: '0 8px' }}>+ Ver mais</span>
      <span style={{ marginLeft: 'auto', ...box() }}>Criar uma visualização</span>
      <span style={box({ width: 40, padding: 0, justifyContent: 'center' })}><Icon d={I.sliders} size={15} color={INK} /></span>
    </div>
    <div style={{ margin: '10px 16px 0', height: 40, borderRadius: 6, background: '#fff', border: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', ...T(15, MUTED) }}><Icon d={I.refresh} size={15} color={INK} />Descreva o que você está procurando</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, margin: '10px 16px 0' }}>
      {[[I.folder, 'Campanhas'], [I.grid, 'Conjuntos de anúncios'], [I.ad, 'Anúncios']].map(([d, l], i) => <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 20px', minWidth: 190, borderRadius: '8px 8px 0 0', background: i === tab ? '#fff' : '#eceef1', ...T(17, i === tab ? BRIGHT : INK, 500) }}>
        <span style={{ width: 22, height: 22, borderRadius: 4, background: i === tab ? BRIGHT : 'transparent', display: 'grid', placeItems: 'center' }}><Icon d={d} size={15} color={i === tab ? '#fff' : INK} w={1.7} /></span>{l}
      </div>)}
      <span style={{ marginLeft: 'auto', marginBottom: 4, ...box() }}><Icon d={I.cal} size={15} color={INK} />{mode === 'published' ? '11 de nov de 2026 a 17 de nov de 2026' : '10 de nov de 2026 a 10 de nov de 2026'}<Icon d={I.down} size={13} color={INK} /></span>
    </div>
    <div style={{ margin: '0 16px', background: '#fff', borderRadius: '0 8px 8px 8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 10px', borderBottom: `1px solid ${HAIR}` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 6, background: '#1a7a45', ...T(15, '#fff', 700) }}><Icon d={I.plus} size={14} color="#fff" w={2.2} />Criar</span>
        {[[I.copy, 'Duplicar'], [I.pencil, 'Editar'], [I.flask, 'Teste A/B']].map(([d, l]) => <span key={l} style={box({ color: l === 'Teste A/B' ? INK : MUTED })}><Icon d={d} size={15} color={MUTED} />{l}</span>)}
        <span style={{ ...T(15, INK), padding: '0 10px' }}>Mais ▾</span>
        <span style={{ marginLeft: 'auto', ...box() }}><Icon d={I.cols} size={15} color={INK} />Colunas ▾</span>
        <span style={box()}><Icon d={I.menu} size={15} color={INK} />Detalhamento ▾</span>
        <span style={box()}><Icon d={I.layers} size={15} color={INK} />Grupos ▾</span>
        <span style={box({ width: 40, padding: 0, justifyContent: 'center' })}><Icon d={I.down2} size={15} color={INK} /></span>
      </div>
      <div style={{ display: 'flex', height: 50, alignItems: 'center', borderBottom: `1px solid ${HAIR}` }}>
        {COLS.map(([c, w, al], i) => <div key={c} style={{ width: w, flex: 'none', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: al === 'r' ? 'flex-end' : 'flex-start', gap: 6, borderRight: i === 1 ? `1px solid ${HAIR}` : 'none', ...T(15, i === 2 ? BRIGHT : INK, 500, { whiteSpace: 'normal', lineHeight: 1.2 }) }}>
          {i === 0 ? <><i style={{ width: 22, height: 22, borderRadius: 4, border: `1.5px solid ${LINE}` }} /><span style={{ marginLeft: 10 }}>De...</span><span style={{ color: INK }}>⇅</span></> : <>{i === 1 ? nameCol : c}<span style={{ color: i === 2 ? BRIGHT : INK }}>{i === 2 ? '↓' : '⇅'}</span></>}
        </div>)}
      </div>
      {rows.map((r, i) => {
        const at = mode === 'build' ? rowAt(tab, i) : -1
        if (mode === 'build' && f < at) return null
        const p = mode === 'build' ? out(f, at, at + 5) : 1
        const live = mode === 'published'
        // The row being created: it is born at the bottom inside a selection frame, the agents type its name, add
        // its tag, bid and budget, and an edit bubble shows the setting they are changing.
        const act = mode === 'build' && f - at < ROW_WORK
        const name = act ? typed(r.name, f, at + 1, 3.2) : r.name
        const tagOn = !act || f >= at + 7, bidOn = !act || f >= at + 9, budOn = !act || f >= at + 11
        const bubble = act && f >= at + 8 ? EDITS[tab][i % EDITS[tab].length] : null
        return <div key={r.name} style={{ position: 'relative', display: 'flex', height: 50, alignItems: 'center', borderBottom: `1px solid ${HAIR}`, background: act ? '#fdf3f6' : live ? '#fff' : DRAFT, boxShadow: act ? 'inset 0 0 0 1.5px #e4405f' : live ? 'none' : 'inset 3px 0 0 #2fa36b', opacity: p }}>
          <div style={{ width: 130, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 22 }}><i style={{ width: 22, height: 22, borderRadius: 4, border: `1.5px solid ${LINE}`, background: '#fff' }} /><Toggle on /></div>
          <div style={{ width: 470, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', borderRight: `1px solid ${HAIR}`, alignSelf: 'stretch' }}>
            {r.thumb >= 0 && <Creative w={34} h={34} variant={r.thumb} />}
            <span style={{ ...T(15, act ? INK : BRIGHT, 400), overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}{act && name.length < r.name.length && <span style={{ color: BRIGHT }}>|</span>}</span>
            {r.tag && tagOn && <span style={{ ...T(11, '#fff', 700), padding: '2px 9px', borderRadius: 999, background: r.tag[1], flex: 'none', marginLeft: 'auto', transform: `scale(${act ? out(f, at + 7, at + 10) : 1})` }}>{r.tag[0]}</span>}
          </div>
          <div style={{ width: 170, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8, ...T(14.5, live ? INK : MUTED) }}>{live ? <><i style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />Ativa</> : <><i style={{ width: 13, height: 13, borderRadius: '50%', border: `1.6px solid #2fa36b` }} /><span style={{ color: INK }}>Em rascunho</span></>}</div>
          <div style={{ width: 200, padding: '0 12px', ...T(14, INK) }}>{bidOn ? r.bid : ''}</div>
          <div style={{ width: 160, padding: '0 12px', textAlign: 'right', ...T(14, INK) }}>{budOn ? r.budget : ''}{tab === 0 && budOn && <div style={T(11, MUTED)}>Diário</div>}</div>
          {bubble && <span style={{ position: 'absolute', left: 130 + 470 + 170 - 40, top: -14, padding: '3px 10px', borderRadius: 999, background: '#fff', boxShadow: '0 0 0 1px #cbd2d9, 0 4px 10px rgb(0 0 0 / .12)', ...T(11, INK, 500), opacity: out(f, at + 8, at + 10) * (1 - ease(f, at + ROW_WORK - 3, at + ROW_WORK)) }}>{bubble}</span>}
          {(live ? RESULTS[i].map(v => countUp(v, res)) : ['R$ 0,00', '—', '—', '—']).map((v, k) => <div key={k} style={{ width: [150, 120, 160, 150][k], padding: '0 12px', textAlign: 'right', ...T(14, live ? INK : MUTED, live ? 500 : 400) }}>{v}{live && k === 2 && <div style={T(11, MUTED)}>Por compra</div>}</div>)}
        </div>
      })}
      <div style={{ display: 'flex', alignItems: 'center', height: 52 }}>
        <div style={{ width: 130 + 470 + 170 + 200 + 160, display: 'flex', alignItems: 'center', gap: 6, padding: '0 108px', ...T(12.5, INK, 700) }}>Resultados de {rows.length} {['campanhas', 'conjuntos de anúncios', 'anúncios'][tab]}<Icon d={I.info} size={12} /></div>
        {mode === 'published' && [['R$ 28.521,35', 'Total usado'], ['854', 'Total'], ['R$ 33,40', 'Por compra'], ['2,89', 'Média']].map(([v, l], k) => <div key={l} style={{ width: [150, 120, 160, 150][k], padding: '0 12px', textAlign: 'right' }}><div style={T(13, INK, 700)}>{countUp(v, res)}</div><div style={T(11, MUTED)}>{l}</div></div>)}
      </div>
    </div>
    {mode === 'build' && f < 640 && <TableCursors f={f} tab={tab} count={rows.length} />}
  </div>
}

// ---------- dialogs ----------

const OBJECTIVES = ['Reconhecimento', 'Tráfego', 'Engajamento', 'Cadastros', 'Promoção do app', 'Vendas']
const OBJ_ICONS = [I.mega, I.cursor, I.chat, I.funnel, I.people, I.bag]
const OBJ_INFO: [string, string, string[]][] = [
  ['Reconhecimento', 'Mostre seus anúncios às pessoas com maior probabilidade de se lembrar deles.', ['Alcance', 'Reconhecimento da marca', 'Visualizações do vídeo']],
  ['Tráfego', 'Envie pessoas para um destino, como seu site ou app.', ['Cliques no link', 'Visualizações da página de destino']],
  ['Engajamento', 'Receba mais mensagens, visualizações de vídeo e engajamento com a publicação.', ['Mensagens', 'Engajamento com a publicação']],
  ['Leads', 'Colete leads para sua empresa ou marca.', ['Formulários instantâneos', 'Conversões']],
  ['Promoção do app', 'Encontre novas pessoas para instalar seu app e continuar usando-o.', ['Instalações do app', 'Eventos do app']],
  ['Vendas', 'Encontre pessoas com probabilidade de comprar seu produto ou serviço.', ['Conversões', 'Vendas do catálogo', 'Mensagens']],
]
function CreateCampaignModal({ f }: { f: number }) {
  if (f < 6 || f >= INTRO_END + 4) return null
  const a = out(f, 6, 16) * (1 - ease(f, INTRO_END - 6, INTRO_END + 4))
  const chosen = f >= 40
  const hover = chosen ? 5 : f < 22 ? -1 : Math.min(5, Math.floor((f - 22) / 4))
  const info = hover >= 0 ? OBJ_INFO[hover] : null
  return <div style={{ position: 'absolute', inset: 0, top: TOP, background: `rgb(0 0 0 / ${0.4 * a})`, zIndex: 40, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: 640, background: '#fff', borderRadius: 8, boxShadow: '0 20px 60px rgb(0 0 0 / .3)', opacity: a, transform: `scale(${0.96 + a * 0.04})` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px 0' }}>
        <span style={{ ...T(15, BRIGHT, 500), padding: '9px 12px', borderRadius: 4, background: '#e7f0fd' }}>Criar nova campanha</span><span style={{ ...T(15, INK), padding: '9px 12px' }}>Novo conjunto de anúncios ou anúncio</span>
        <span style={{ marginLeft: 'auto', marginRight: 6 }}><Icon d={I.x} size={16} color={INK} w={2} /></span>
      </div>
      <div style={{ padding: '18px 16px 10px' }}>
        <Label info>Escolha um tipo de compra</Label>
        <Input value="Leilão" f={f} at={12} select />
        <b style={{ ...T(18, INK, 500), display: 'block', margin: '22px 0 12px' }}>Escolha um objetivo da campanha</b>
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ width: 290 }}>{OBJ_INFO.map(([o], i) => {
            const on = chosen && i === 5, hov = i === hover
            return <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 58, padding: '0 8px', background: hov ? '#f0f2f5' : 'transparent' }}><Radio on={on} /><span style={{ width: 46, height: 46, borderRadius: 6, background: '#f0f2f5', display: 'grid', placeItems: 'center' }}><Icon d={OBJ_ICONS[i]} size={20} color={INK} w={1.7} /></span><span style={T(15.5, INK)}>{o}</span></div>
          })}</div>
          <div style={{ flex: 1, paddingTop: 4 }}>
            {info ? <>
              <div style={{ height: 140, borderRadius: 8, background: 'linear-gradient(135deg, #e9e3ff, #d9ecff)', position: 'relative', overflow: 'hidden' }}>
                <i style={{ position: 'absolute', left: 24, top: 26, width: 70, height: 90, borderRadius: 10, background: 'linear-gradient(160deg, #9b8cff, #6f8dff)', transform: 'skewY(-8deg)' }} />
                <i style={{ position: 'absolute', left: 110, top: 14, width: 120, height: 104, borderRadius: 10, background: 'linear-gradient(160deg, #c5b8ff, #a5c8ff)' }} />
                <i style={{ position: 'absolute', left: 130, top: 34, width: 80, height: 10, borderRadius: 5, background: '#fff', opacity: 0.8 }} />
                <i style={{ position: 'absolute', left: 130, top: 54, width: 36, height: 36, borderRadius: 6, background: '#fff', opacity: 0.7 }} />
                <i style={{ position: 'absolute', left: 174, top: 54, width: 36, height: 36, borderRadius: 6, background: '#fff', opacity: 0.5 }} />
              </div>
              <b style={{ ...T(17, INK, 500), display: 'block', marginTop: 14 }}>{info[0]}</b>
              <div style={{ ...T(14, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.45 }), marginTop: 4 }}>{info[1]}</div>
              <b style={{ ...T(14.5, INK, 500), display: 'block', marginTop: 12 }}>Bom para:</b>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{info[2].map(x => <span key={x} style={{ ...T(13.5, INK), padding: '5px 9px', borderRadius: 4, background: '#f0f2f5' }}>{x}</span>)}</div>
            </> : <div style={T(14, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.45 })}>O objetivo da campanha é o resultado que você quer gerar com os anúncios.</div>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderTop: `1px solid ${HAIR}` }}>
        <span style={T(14, BRIGHT)}>Sobre os objetivos da campanha</span>
        <span style={{ marginLeft: 'auto', ...T(15, INK, 500), padding: '8px 16px', borderRadius: 6, border: `1px solid ${LINE}` }}>Cancelar</span>
        <span style={{ ...T(15, '#fff', 700), padding: '9px 18px', borderRadius: 6, background: chosen ? BRIGHT : '#a4c8f7', transform: `scale(${f >= 56 && f < 62 ? 0.95 : 1})` }}>Continuar</span>
      </div>
    </div>
  </div>
}

function ReviewDraftsModal({ f }: { f: number }) {
  if (f < REVIEW.open || f >= REVIEW.results + 6) return null
  const a = out(f, REVIEW.open, REVIEW.open + 10) * (1 - ease(f, REVIEW.results - 4, REVIEW.results + 6))
  const publishing = f >= REVIEW.publish
  return <div style={{ position: 'absolute', inset: 0, top: TOP, background: `rgb(0 0 0 / ${0.35 * a})`, zIndex: 40, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: 860, background: '#fff', borderRadius: 10, boxShadow: '0 20px 60px rgb(0 0 0 / .3)', opacity: a, transform: `scale(${0.96 + a * 0.04})` }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${HAIR}` }}><b style={T(16, INK, 700)}>Revisar itens de rascunho</b><span style={{ marginLeft: 'auto' }}><Icon d={I.x} size={14} /></span></div>
      <div style={{ display: 'flex', gap: 6, padding: '12px 20px 0' }}>
        {[[I.folder, 'Campanhas', 5], [I.grid, 'Conjuntos de anúncios', 14], [I.ad, 'Anúncios', 22]].map(([d, l, n], i) => <span key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: i === 0 ? SEL : 'transparent', ...T(12.5, i === 0 ? BRIGHT : INK, 500) }}><Icon d={d as string} size={12} color={i === 0 ? BRIGHT : MUTED} />{l as string} · {n as number}</span>)}
      </div>
      <div style={{ margin: '12px 20px', border: `1px solid ${HAIR}`, borderRadius: 6 }}>
        <div style={{ display: 'flex', padding: '8px 12px', background: '#fafbfc', borderBottom: `1px solid ${HAIR}`, ...T(12, INK, 700) }}><span style={{ width: 30 }} /><span style={{ flex: 1 }}>Nome da campanha</span><span style={{ width: 120 }}>Alteração</span><span style={{ width: 80 }}>Erros</span></div>
        {CAMPAIGN_ROWS.map((r, i) => <div key={r.name} style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', borderBottom: i < 4 ? `1px solid ${HAIR}` : 'none', ...T(12.5, INK) }}>
          <span style={{ width: 30 }}><i style={{ display: 'grid', placeItems: 'center', width: 14, height: 14, borderRadius: 3, background: BRIGHT, color: '#fff', fontSize: 10 }}>✓</i></span>
          <span style={{ flex: 1 }}>{r.name}</span><span style={{ width: 120, color: MUTED }}>Novo</span><span style={{ width: 80, color: MUTED }}>—</span>
        </div>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderTop: `1px solid ${HAIR}` }}>
        <span style={{ ...T(11.5, MUTED, 400, { whiteSpace: 'normal', lineHeight: 1.4 }), maxWidth: 520 }}>Ao clicar em Publicar, você confirma que o uso das ferramentas de anúncios segue os Termos e Condições.</span>
        <span style={{ marginLeft: 'auto', ...T(13, INK, 500), padding: '6px 14px', borderRadius: 6, border: `1px solid ${LINE}` }}>Cancelar</span>
        <span style={{ ...T(13, '#fff', 700), padding: '7px 18px', borderRadius: 6, background: GREEN, transform: `scale(${f >= REVIEW.publish && f < REVIEW.publish + 6 ? 0.95 : 1})` }}>{publishing ? 'Publicando…' : 'Publicar'}</span>
      </div>
    </div>
  </div>
}

// ---------- agents' cursors ----------

const ROLES: [string, string][] = [['Estrutura', '#5b72f2'], ['Nomes', '#e4405f'], ['Orçamento', '#0ea5a4'], ['Lances', '#f7b928'], ['Público', '#ff7a00'], ['Criativo', '#31a24c'], ['Texto', '#a259ff'], ['Rastreamento', '#3b82f6'], ['Revisor', '#6b7280']]
const FX = FORM_X, SX = SIDE_X, CY = CONTENT_TOP + 18
const treeY = (i: number) => TOP + TREE_ROW / 2 + i * TREE_ROW
const TREE_TARGETS: [number, number, number][] = TREE.map((n, i) => [RAIL_W + 90 + (i % 3) * 40, treeY(i), (n.renameAt ?? n.at) - 2] as [number, number, number]).filter(([, , fr]) => fr < 120)
const TARGETS: [number, number, number][] = [
  ...TREE_TARGETS,
  // campaign
  [FX + 150, CY + 60, 6], [FX + 470, CY + 60, 12], [FX + 100, CY + 210, 34], [FX + 90, CY + 330, 46], [FX + 380, CY + 330, 52], [FX + 300, CY + 405, 70], [FX + 590, CY + 520, 88], [SX + 200, CY + 160, 96], [150, TOP + 74, 10], [180, TOP + 104, 110], [FX + 200, CY + 220, 120], [SX + 120, CY + 60, 130],
  // ad set
  [210, TOP + 104, 150], [FX + 100, CY + 60, 154], [FX + 320, CY + 60, 160], [FX + 540, CY + 60, 172], [FX + 150, CY + 180, 182], [FX + 560, CY + 180, 192], [FX + 200, CY + 270, 200], [FX + 120, CY + 330, 210], [FX + 420, CY + 330, 216], [FX + 280, CY + 390, 226], [SX + 260, CY + 160, 220], [240, TOP + 134, 236],
  // ad
  [230, TOP + 134, 250], [FX + 150, CY + 60, 252], [FX + 460, CY + 60, 258], [FX + 40, CY + 185, 270], [FX + 120, CY + 185, 276], [FX + 200, CY + 185, 282], [FX + 300, CY + 255, 290], [SX + 150, CY + 200, 296], [FX + 250, CY + 330, 320], [SX + 560, CY + 260, 324], [FX + 300, CY + 385, 334], [FX + 130, CY + 445, 346], [FX + 300, CY + 520, 354], [FX + 360, CY + 580, 366], [FX + 600, CY + 610, 378], [SX + 700, CY + 18, 386], [250, TOP + 164, 280], [250, TOP + 194, 310],
  // burst
  [220, TOP + 220, 404], [FX + 200, CY + 255, 410], [SX + 300, CY + 300, 416], [220, TOP + 280, 424], [FX + 300, CY + 330, 430], [FX + 200, CY + 520, 438], [220, TOP + 370, 444], [SX + 600, CY + 260, 450], [FX + 120, CY + 185, 456], [220, TOP + 460, 462], [MAIN_X + 60, 1052, 472],
  // tables
  [1700, TOP + 28, 486], [420, TOP + 290, 494], [700, TOP + 340, 506], [560, TOP + 196, 540], [380, TOP + 290, 552], [800, TOP + 390, 566], [900, TOP + 196, 596], [420, TOP + 290, 606], [700, TOP + 430, 620], [1720, TOP + 28, 640], [600, TOP + 520, 650],
]
const EXTRA: [number, number, number][] = [
  // the create dialog
  [900, 300, 10], [800, 330, 14], [760, 520, 26], [760, 640, 34], [760, 760, 40], [1000, 600, 46], [1190, 950, 56],
  // review drafts and results
  [1700, TOP + 28, 868], [600, 520, 892], [900, 560, 906], [700, 600, 918], [1260, 760, 935], [1100, 560, 975], [800, 620, 998], [1300, 520, 1020], [500, 700, 1040],
]
const routes: { f: number; x: number; y: number }[][] = ROLES.map(() => [])
;[...TARGETS.map(([x, y, fr]) => [x, y, Math.round(realFrame(fr))] as [number, number, number]), ...EXTRA].forEach(([x, y, fr], i) => routes[i % ROLES.length].push({ f: fr, x: x + (random('jx' + i) - 0.5) * 20, y: y + (random('jy' + i) - 0.5) * 6 }))
routes.forEach(r => r.sort((a, b) => a.f - b.f))

function Cursor({ a, f }: { a: number; f: number }) {
  const b = buildFrame(f)
  if (b >= 480 && f < REVIEW.open - 14) return null
  const r = routes[a]
  if (!r.length || f < r[0].f - 12) return null
  let k = 0
  while (k + 1 < r.length && r[k + 1].f - 18 <= f) k++
  const cur = r[k], next = r[k + 1]
  let x = cur.x, y = cur.y
  if (next) { const p = ease(f, next.f - 18, next.f); x += (next.x - cur.x) * p; y += (next.y - cur.y) * p }
  x += Math.sin((f + a * 13) / 10) * 2.5; y += Math.cos((f + a * 7) / 12) * 2
  const click = f >= cur.f && f < cur.f + 8 ? 1 - (f - cur.f) / 8 : 0
  const [name, color] = ROLES[a]
  return <div style={{ position: 'absolute', left: x, top: y, zIndex: 80, opacity: out(f, r[0].f - 12, r[0].f - 4) }}>
    {click > 0 && <div style={{ position: 'absolute', left: -10, top: -10, width: 20, height: 20, borderRadius: '50%', border: `2px solid ${color}`, opacity: click, transform: `scale(${1.6 - click * 0.6})` }} />}
    <svg width={16} height={18} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / .35))' }}><path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill="#1c1e21" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" /></svg>
    <span style={{ position: 'absolute', left: 12, top: 14, padding: '1px 7px', borderRadius: 999, background: color, ...T(10.5, '#fff', 700) }}>{name}</span>
  </div>
}

export function AdsAgentsCampaignBuild() {
  const f = useCurrentFrame()
  const b = buildFrame(f)
  const toEditor = ease(f, INTRO_END - 6, INTRO_END + 4)
  const toTable = ease(b, PH.table - 6, PH.table + 6)
  const published = f >= REVIEW.results
  return <AbsoluteFill style={{ background: BG, overflow: 'hidden', fontFamily: FONT }}>
    <div style={{ position: 'absolute', inset: 0, opacity: out(f, 0, 8) }}>
      <Browser f={f} />
      {(f < INTRO_END + 4 || b >= PH.table - 6) && <NavRail />}
      {f < INTRO_END + 4 && <div style={{ position: 'absolute', inset: 0, opacity: 1 - toEditor }}><Tables f={0} mode="empty" /></div>}
      {f >= INTRO_END - 6 && b < PH.table + 6 && <div style={{ position: 'absolute', inset: 0, opacity: toEditor * (1 - toTable) }}><Editor f={b} /></div>}
      {b >= PH.table - 6 && !published && <Tables f={Math.min(b, 640)} />}
      {published && <Tables f={640} mode="published" raw={f} />}
      <CreateCampaignModal f={f} />
      <ReviewDraftsModal f={f} />
      {ROLES.map((_, a) => <Cursor key={a} a={a} f={f} />)}
    </div>
  </AbsoluteFill>
}

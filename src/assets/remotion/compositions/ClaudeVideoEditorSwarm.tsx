import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, random, staticFile, useCurrentFrame } from 'remotion'
import { loadFont as loadBebas } from '@remotion/google-fonts/BebasNeue'
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono'
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope'
import { loadFont as loadMarker } from '@remotion/google-fonts/PermanentMarker'
import { loadFont as loadRubikMono } from '@remotion/google-fonts/RubikMonoOne'

// "Editor de vídeo com agentes": a dark, pro video editor (bin, source and program monitors, scopes, color wheels,
// captions and a timeline) operated live by ten AI agents at once. Each agent is a named, colored cursor; the
// timeline grows from left to right, the caption on the program monitor changes style as the captions agent picks
// fonts, the grade agent drags the color wheels, the swarm log scrolls and the counters climb.
// 1920×1080, 30 fps. The footage is the presenter recording already in the project; everything else is made up.

export const VIDEO_EDITOR_SWARM_DURATION = 450
export const VIDEO_EDITOR_SWARM_WIDTH = 1920
export const VIDEO_EDITOR_SWARM_HEIGHT = 1080

const opts = { subsets: ['latin'] as ['latin'] }
const MONO = loadMono('normal', { ...opts, weights: ['400', '700'] }).fontFamily
const UI = loadInter('normal', { ...opts, weights: ['400', '500', '600', '700'] }).fontFamily
const BEBAS = loadBebas('normal', { ...opts, weights: ['400'] }).fontFamily
const MARKER = loadMarker('normal', { ...opts, weights: ['400'] }).fontFamily
const MANROPE = loadManrope('normal', { ...opts, weights: ['800'] }).fontFamily
const RUBIK = loadRubikMono('normal', { ...opts, weights: ['400'] }).fontFamily
const FRAUNCES = loadFraunces('normal', { ...opts, weights: ['900'] }).fontFamily

const VIDEO = 'remotion/otto-reels/financas-chatgpt.mp4'
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })

// ---------- palette ----------

const BG = '#07090f', PANEL = '#0d1119', LINE = '#1c2230', TXT = '#c9d1e3', DIM = '#6b7486'
const LIME = '#c6f432', GREEN = '#3ddc84', ORANGE = '#ff8a3d', YELLOW = '#f5c542', PURPLE = '#a78bfa', BLUE = '#4f8cff', PINK = '#ff5fa2', CYAN = '#38d6f5'

const agents = [
  { id: 'cortes', name: 'cortes-01', color: '#ff5f5f' },
  { id: 'legendas', name: 'legendas-01', color: PINK },
  { id: 'cor', name: 'grade-01', color: ORANGE },
  { id: 'broll', name: 'b-roll-01', color: CYAN },
  { id: 'audio', name: 'áudio-01', color: GREEN },
  { id: 'musica', name: 'música-01', color: PURPLE },
  { id: 'titulos', name: 'títulos-01', color: YELLOW },
  { id: 'sfx', name: 'sfx-01', color: BLUE },
  { id: 'ritmo', name: 'ritmo-01', color: LIME },
  { id: 'revisor', name: 'revisor', color: '#f4f4f5' },
] as const
type AgentId = (typeof agents)[number]['id']
const colorOf = (id: AgentId) => agents.find(a => a.id === id)!.color

const mono = (size: number, color = DIM, extra?: CSSProperties): CSSProperties => ({ fontFamily: MONO, fontSize: size, color, letterSpacing: 0.4, whiteSpace: 'nowrap', ...extra })

// ---------- layout (px in the 1920×1080 frame) ----------

const TOP = 40
const BIN = { x: 10, y: TOP + 8, w: 300, h: 648 }
const SRC = { x: 320, y: TOP + 8, w: 460, h: 318 }
const LOG = { x: 320, y: TOP + 334, w: 460, h: 322 }
const PGM = { x: 790, y: TOP + 8, w: 420, h: 648 }
const SCOPE = { x: 1220, y: TOP + 8, w: 330, h: 648 }
const SIDE = { x: 1560, y: TOP + 8, w: 350, h: 648 }
const TL = { x: 10, y: 708, w: 1900, h: 336 }
const TRACK_X = 150 // where the tracks start inside the timeline
const PX_PER_SEC = 52

// ---------- the edit (made up) ----------

/** How far the build has gone, as an x in the timeline (absolute px). */
const buildX = (f: number) => TL.x + TRACK_X + interpolate(f, [20, VIDEO_EDITOR_SWARM_DURATION - 30], [0, 1280], { ...clamp, easing: Easing.out(Easing.quad) })
const playheadX = (f: number) => {
  const keys = [0, 70, 120, 190, 240, 300, 350, 410, 450]
  const xs = [0.05, 0.25, 0.15, 0.45, 0.35, 0.62, 0.55, 0.8, 0.78]
  const t = interpolate(f, keys, xs, { ...clamp, easing: Easing.inOut(Easing.quad) })
  return TL.x + TRACK_X + (buildX(f) - TL.x - TRACK_X) * t
}
const tc = (sec: number) => {
  const s = Math.max(0, sec), m = Math.floor(s / 60), r = Math.floor(s % 60), fr = Math.floor((s % 1) * 30)
  return `00:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}:${String(fr).padStart(2, '0')}`
}

type Clip = { track: number; x: number; w: number; label: string; color: string; thumb?: number }
// x and w in px from the start of the tracks.
const chapters = ['ABERTURA', '3 REGRAS', 'REGRA 1', 'SE PAGUE', '20% DO DIA', 'REGRA 2', 'CAIXA', 'REGRA 3', 'CTA']
const titles = ['3 regras do caixa', 'regra 1', 'pague-se primeiro', '20% fica', 'regra 2', 'nunca no vermelho', 'regra 3', 'automatize']
function buildClips(): Clip[] {
  const out: Clip[] = []
  let x = 0
  chapters.forEach((label, i) => { const w = 120 + Math.round(random('ch' + i) * 60); out.push({ track: 0, x, w: w - 6, label, color: YELLOW }); x += w })
  x = 30
  titles.forEach((label, i) => { const w = 110 + Math.round(random('ti' + i) * 70); out.push({ track: 1, x, w, label, color: PURPLE }); x += w + 30 + Math.round(random('tg' + i) * 60) })
  x = 80
  for (let i = 0; i < 9; i++) { const w = 70 + Math.round(random('br' + i) * 70); out.push({ track: 2, x, w, label: `broll_${String(i + 1).padStart(2, '0')}`, color: CYAN }); x += w + 50 + Math.round(random('bg' + i) * 80) }
  x = 0
  for (let i = 0; i < 16; i++) { const w = 70 + Math.round(random('v' + i) * 60); out.push({ track: 3, x, w: w - 2, label: `C002_C0${11 + i}.mov`, color: BLUE, thumb: (i % 10) + 1 }); x += w }
  return out
}
const clips = buildClips()
const TRACKS = [
  { label: 'CAPÍTULOS', y: 30, h: 22 },
  { label: 'TÍTULOS', y: 56, h: 22 },
  { label: 'V2 · B-ROLL', y: 82, h: 30 },
  { label: 'V1 · CÂMERA', y: 116, h: 46 },
  { label: 'LUT', y: 166, h: 18 },
  { label: 'A1 · VOZ', y: 188, h: 44 },
  { label: 'A2 · MÚSICA', y: 236, h: 30 },
  { label: 'A3 · SFX', y: 270, h: 22 },
]

// The swarm log: one line about every 6 frames, attributed to an agent.
const LOG_LINES: [AgentId, string][] = [
  ['cortes', 'trimmed 3 frames C002_C011.mov'], ['legendas', 'caption "3 regras do caixa"'], ['cor', 'grade node 01 · lift +0.02'],
  ['audio', 'normalized −14 LUFS'], ['broll', 'placed broll_01 @ 00:01:12'], ['ritmo', 'punch-in 110% @ 00:02:04'],
  ['titulos', 'chapter "ABERTURA"'], ['cortes', 'removed breath @ 00:03:18'], ['sfx', 'whoosh @ cut 04'],
  ['musica', 'ducked music −8 dB under voice'], ['legendas', 'font: Bebas Neue → test'], ['cor', 'applied LUT "Daylight Clean 01"'],
  ['revisor', 'check · safe-zone ok'], ['cortes', 'placed C002_C014.mov @ 00:05:02'], ['broll', 'grabbed broll_03 · 1.4 s'],
  ['legendas', 'caption "pague-se primeiro"'], ['audio', 'de-ess voice · −3 dB'], ['ritmo', 'cut on beat · 00:06:20'],
  ['titulos', 'stat card "20% fica"'], ['cor', 'skin tone · hue −2°'], ['legendas', 'font: Permanent Marker'],
  ['sfx', 'pop @ title in'], ['revisor', 'check · captions in sync'], ['cortes', 'A/B testing hook · v2'],
  ['musica', 'swell @ chapter "REGRA 2"'], ['broll', 'placed broll_05 @ 00:09:10'], ['legendas', 'word-by-word highlight on'],
  ['cor', 'match shot C002_C018 → C002_C011'], ['ritmo', 'speed ramp 1.2× · 00:10:02'], ['titulos', 'lower third "Otto"'],
  ['audio', 'room tone fill 00:11:20'], ['legendas', 'font: Manrope ExtraBold + marker'], ['revisor', 'check · loudness −14.1 LUFS'],
  ['cortes', 'placed C002_C021.mov @ 00:12:14'], ['sfx', 'riser @ CTA'], ['broll', 'grabbed broll_08 · 2.0 s'],
  ['cor', 'vignette −0.15'], ['musica', 'outro sting'], ['legendas', 'caption "automatize"'], ['revisor', 'check · 0 issues'],
]
const LOG_EVERY = 6

// Caption styles the captions agent tries on the program monitor.
const FONT_LIST = [
  { label: 'Arial Bold', family: 'Arial, sans-serif' },
  { label: 'Bebas Neue', family: BEBAS },
  { label: 'Permanent Marker', family: MARKER },
  { label: 'Rubik Mono One', family: RUBIK },
  { label: 'Fraunces Black', family: FRAUNCES },
  { label: 'Manrope + marca-texto', family: MANROPE },
]
const CAPTION_PHASES = [
  { from: 50, font: 1 }, { from: 150, font: 2 }, { from: 205, font: 3 }, { from: 250, font: 4 }, { from: 300, font: 5 },
]
const fontAt = (f: number) => [...CAPTION_PHASES].reverse().find(p => f >= p.from)?.font ?? -1

// ---------- cursors ----------

type Box = { x: number; y: number; w: number; h: number }
type Stop = { f: number; x: number; y: number }
const FONT_ROW_Y = (i: number) => SIDE.y + 476 + i * 24
/** Each agent hops between points of its area; some hops are choreographed to what happens on screen. */
function routeFor(a: number): Stop[] {
  const id = agents[a].id
  const stops: Stop[] = []
  const area = (f: number): Box => {
    const front = buildX(f)
    switch (id) {
      case 'cortes': return { x: front - 220, y: TL.y + 116, w: 200, h: 46 }
      case 'broll': return { x: front - 260, y: TL.y + 82, w: 220, h: 30 }
      case 'audio': return { x: front - 300, y: TL.y + 188, w: 260, h: 44 }
      case 'musica': return { x: front - 340, y: TL.y + 236, w: 300, h: 30 }
      case 'titulos': return { x: front - 240, y: TL.y + 30, w: 220, h: 48 }
      case 'sfx': return { x: front - 200, y: TL.y + 270, w: 180, h: 22 }
      case 'ritmo': return f % 120 < 60 ? { x: front - 160, y: TL.y + 116, w: 150, h: 46 } : { x: LOG.x + 20, y: LOG.y + 40, w: 380, h: 260 }
      case 'cor': return { x: SIDE.x + 10, y: SIDE.y + 30, w: 330, h: 230 }
      case 'legendas': return { x: PGM.x + 40, y: PGM.y + 380, w: 340, h: 160 }
      default: return { x: SRC.x, y: SRC.y + 20, w: 1180, h: 600 }
    }
  }
  const start = 10 + a * 5
  for (let f = start, i = 0; f < VIDEO_EDITOR_SWARM_DURATION; i++) {
    const raw = area(f), minX = TL.x + TRACK_X + 12
    // Early on the build front is near the start of the tracks: keep the areas inside them.
    const b = raw.x < minX ? { ...raw, x: minX, w: Math.max(40, raw.w - (minX - raw.x)) } : raw
    stops.push({ f, x: b.x + random(`${id}x${i}`) * b.w, y: b.y + random(`${id}y${i}`) * b.h })
    f += 26 + Math.round(random(`${id}d${i}`) * 26)
  }
  // The captions agent clicks the font it picks, just before the caption changes.
  if (id === 'legendas') {
    for (const p of CAPTION_PHASES) {
      const at = p.from - 14
      for (let k = stops.length - 1; k >= 0; k--) if (Math.abs(stops[k].f - at) < 22) stops.splice(k, 1)
      stops.push({ f: at, x: SIDE.x + 90, y: FONT_ROW_Y(p.font) + 10 })
    }
    stops.sort((p, q) => p.f - q.f)
  }
  return stops
}
const routes = agents.map((_, a) => routeFor(a))

function cursorAt(a: number, f: number) {
  const r = routes[a]
  let k = 0
  while (k + 1 < r.length && r[k + 1].f <= f) k++
  const cur = r[k], next = r[k + 1]
  let x = cur.x, y = cur.y
  if (next) {
    const travel = Math.min(14, next.f - cur.f)
    const p = ease(f, next.f - travel, next.f)
    x = cur.x + (next.x - cur.x) * p; y = cur.y + (next.y - cur.y) * p
  }
  x += Math.sin((f + a * 17) / 9) * 3; y += Math.cos((f + a * 11) / 11) * 3
  const click = f >= cur.f && f < cur.f + 8 ? 1 - (f - cur.f) / 8 : 0
  return { x, y, click, visible: f >= r[0].f - 6 }
}

function Cursor({ a, f }: { a: number; f: number }) {
  const { x, y, click, visible } = cursorAt(a, f)
  if (!visible) return null
  const { color, name } = agents[a]
  const fade = interpolate(f, [routes[a][0].f - 6, routes[a][0].f + 2], [0, 1], clamp)
  return <div style={{ position: 'absolute', left: x, top: y, opacity: fade, zIndex: 40, pointerEvents: 'none' }}>
    {click > 0 && <div style={{ position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%', border: `2px solid ${color}`, opacity: click, transform: `scale(${1.6 - click * 0.6})` }} />}
    <svg width={20} height={22} viewBox="0 0 22 24" style={{ display: 'block', filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / .6))', transform: `scale(${1 - click * 0.12})` }}>
      <path d="M2 2 L2 20 L7 15 L10.5 22.5 L13.5 21 L10 14 L17 14 Z" fill={color} stroke="#0b0d12" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
    <span style={{ position: 'absolute', left: 16, top: 18, padding: '2px 7px', borderRadius: 5, background: color, color: '#0b0d12', ...mono(11, '#0b0d12', { fontWeight: 700, letterSpacing: 0 }) }}>{name}</span>
  </div>
}

// ---------- panels ----------

function Panel({ b, title, right, children }: { b: Box; title: string; right?: ReactNode; children?: ReactNode }) {
  return <div style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 8, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 24, padding: '0 10px', borderBottom: `1px solid ${LINE}` }}>
      <span style={mono(10.5, TXT, { fontWeight: 700, letterSpacing: 1.2 })}>{title}</span>{right}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 24, bottom: 0 }}>{children}</div>
  </div>
}

function TopBar({ f }: { f: number }) {
  const live = Math.min(10, Math.floor(interpolate(f, [8, 60], [0, 10], clamp)))
  return <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: TOP, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 22, background: '#090c13' }}>
    <span style={{ display: 'flex', gap: 6 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <i key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}</span>
    {['Arquivo', 'Editar', 'Clipe', 'Cor', 'Legendas', 'Áudio', 'Agentes'].map(m => <span key={m} style={{ fontFamily: UI, fontSize: 13, color: m === 'Agentes' ? LIME : TXT }}>{m}</span>)}
    <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15 }}>
      <b style={{ fontFamily: UI, fontSize: 13, color: '#fff', fontWeight: 600 }}>otto_financas_reel_v1</b>
      <span style={mono(10)}>editando ao vivo · salvo automaticamente</span>
    </span>
    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ display: 'flex' }}>{agents.map((ag, i) => <i key={ag.id} style={{ width: 16, height: 16, borderRadius: '50%', background: ag.color, marginLeft: i ? -5 : 0, border: '2px solid #090c13', opacity: i < live ? 1 : 0.15 }} />)}</span>
      <span style={{ ...mono(12, LIME, { fontWeight: 700 }), padding: '4px 10px', borderRadius: 999, background: 'rgb(198 244 50 / .1)', border: '1px solid rgb(198 244 50 / .35)' }}>● {live} agentes ao vivo</span>
      <span style={{ fontFamily: UI, fontSize: 12, color: '#0b0d12', background: '#e9edf5', borderRadius: 6, padding: '5px 12px', fontWeight: 600 }}>Compartilhar</span>
    </span>
  </div>
}

function Bin({ f }: { f: number }) {
  const shown = Math.min(10, 4 + Math.floor(f / 30))
  return <Panel b={BIN} title="MÍDIA" right={<span style={mono(10)}>{shown} itens</span>}>
    <div style={{ position: 'absolute', inset: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignContent: 'start' }}>
      {Array.from({ length: 10 }, (_, i) => {
        const on = i < shown
        const hot = Math.floor(f / 18) % 10 === i
        return <div key={i} style={{ opacity: on ? 1 : 0.15, transition: 'none' }}>
          <div style={{ position: 'relative', height: 68, borderRadius: 4, overflow: 'hidden', outline: hot ? `2px solid ${colorOf(i % 2 ? 'broll' : 'cortes')}` : `1px solid ${LINE}` }}>
            <Img src={staticFile(`remotion/video-editor/clip${(i % 10) + 1}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: i % 3 === 2 ? 'saturate(.6) brightness(.85)' : 'none' }} />
            <span style={{ position: 'absolute', right: 3, bottom: 3, ...mono(9, '#fff'), background: 'rgb(0 0 0 / .6)', padding: '0 3px', borderRadius: 2 }}>0{(i * 7) % 9 + 1}:{String((i * 13) % 60).padStart(2, '0')}</span>
          </div>
          <div style={{ ...mono(9.5), marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis' }}>C002_C0{11 + i}.mov</div>
        </div>
      })}
    </div>
    <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[['Stat Card', YELLOW], ['Balão de comentário', BLUE], ['LUT Daylight', ORANGE]].map(([l, c], i) => <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26, padding: '0 10px', borderRadius: 5, background: '#121826', border: `1px solid ${LINE}`, opacity: f > 40 + i * 30 ? 1 : 0.2 }}>
        <i style={{ width: 8, height: 8, borderRadius: 2, background: c }} /><span style={{ fontFamily: UI, fontSize: 12, color: TXT }}>{l}</span>
      </div>)}
    </div>
  </Panel>
}

/** Shows the presenter recording cropped to a region (in the 720×1280 source) and fitted into a box. */
function Footage({ w, h, region, startFrom }: { w: number; h: number; region: { y: number; h: number }; startFrom: number }) {
  const s = Math.max(h / region.h, w / 720)
  const vw = 720 * s, vh = 1280 * s
  return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
    <OffthreadVideo muted src={staticFile(VIDEO)} startFrom={startFrom} style={{ position: 'absolute', width: vw, height: vh, left: (w - vw) / 2, top: -region.y * s + (h - region.h * s) / 2, maxWidth: 'none' }} />
  </div>
}

function Source({ f }: { f: number }) {
  const W = SRC.w - 20, H = Math.round(W * 9 / 16)
  const inX = 0.18, outX = interpolate(f, [0, 450], [0.55, 0.8])
  return <Panel b={SRC} title="ORIGEM" right={<span style={mono(10)}>C002_C0{11 + (Math.floor(f / 45) % 10)}.mov · S-LOG3 · 16:9</span>}>
    <div style={{ position: 'absolute', left: 10, top: 8, width: W, height: H, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, filter: 'saturate(.55) contrast(.85) brightness(1.05)' }}><Footage w={W} h={H} region={{ y: 408, h: 405 }} startFrom={240} /></div>
      <div style={{ position: 'absolute', left: W * 0.3, top: 8, width: W * 0.4, height: H - 16, border: `1.5px dashed ${GREEN}`, borderRadius: 3 }} />
      <span style={{ position: 'absolute', left: W * 0.3, top: 8, ...mono(9.5, '#0b0d12', { fontWeight: 700 }), background: GREEN, padding: '1px 5px' }}>ENQUADRAR 9:16</span>
    </div>
    <div style={{ position: 'absolute', left: 10, right: 10, top: H + 16, height: 8, background: '#161c29', borderRadius: 4 }}>
      <div style={{ position: 'absolute', left: `${inX * 100}%`, width: `${(outX - inX) * 100}%`, top: 0, bottom: 0, background: LIME, borderRadius: 4, opacity: 0.8 }} />
    </div>
    <div style={{ position: 'absolute', left: 10, right: 10, top: H + 28, display: 'flex', justifyContent: 'space-between' }}>
      <span style={mono(10, TXT)}>IN 00:01:12</span><span style={mono(10, TXT)}>OUT {tc(4 + outX * 10).slice(3)}</span>
    </div>
  </Panel>
}

function Log({ f }: { f: number }) {
  const n = Math.min(LOG_LINES.length * 3, Math.floor(f / LOG_EVERY) + 1)
  const ROW = 17, VISIBLE = 17
  const lines = Array.from({ length: n }, (_, i) => ({ i, line: LOG_LINES[i % LOG_LINES.length] })).slice(-VISIBLE)
  const ops = Math.round(18 + 10 * Math.abs(Math.sin(f / 23)))
  return <Panel b={LOG} title="ATIVIDADE DO ENXAME" right={<span style={mono(10, LIME)}>{ops} ops/s</span>}>
    <div style={{ position: 'absolute', inset: '8px 10px', overflow: 'hidden' }}>
      <div>
        {lines.map(({ i, line: [id, msg] }) => {
          const age = n - 1 - i
          return <div key={i} style={{ display: 'flex', gap: 10, height: ROW, alignItems: 'center', opacity: age === 0 ? ease(f % LOG_EVERY, 0, 3) : 1 }}>
            <span style={mono(10.5)}>{tc(12 + i * 0.7).slice(3, 8)}</span>
            <span style={{ ...mono(10.5, colorOf(id), { fontWeight: 700 }), width: 92 }}>{agents.find(a => a.id === id)!.name}</span>
            <span style={mono(10.5, age === 0 ? '#fff' : TXT)}>{msg}</span>
          </div>
        })}
      </div>
    </div>
  </Panel>
}

function Program({ f }: { f: number }) {
  const W = PGM.w - 24, H = 560
  const font = fontAt(f)
  const fam = font >= 0 ? FONT_LIST[font].family : UI
  const pop = font >= 0 ? interpolate(f - CAPTION_PHASES.find(p => p.font === font)!.from, [0, 6], [0.85, 1], { ...clamp, easing: Easing.out(Easing.back(2)) }) : 0
  const caption = font === 5
    ? <span style={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 30, color: '#fff' }}><span style={{ background: LIME, color: '#0b0d12', padding: '0 6px', borderRadius: 4 }}>3</span> regras do <span style={{ background: '#ffe14d', color: '#0b0d12', padding: '0 6px', borderRadius: 4 }}>caixa</span></span>
    : <span style={{ fontFamily: fam, fontSize: font === 3 ? 22 : font === 1 ? 44 : 32, color: '#fff', fontWeight: font === 0 ? 700 : 400, letterSpacing: font === 1 ? 1 : 0, textShadow: '0 2px 10px rgb(0 0 0 / .6)', textTransform: font === 2 || font === 4 ? 'none' : 'uppercase' }}>{font === 2 || font === 4 ? '3 regras do caixa' : '3 REGRAS DO CAIXA'}</span>
  const chip = ease(f, 220, 236)
  const layers = Math.round(interpolate(f, [0, 450], [12, 214], clamp))
  return <Panel b={PGM} title="PROGRAMA" right={<span style={mono(10, LIME)}>{tc(1.4 + f / 30)}</span>}>
    <div style={{ position: 'absolute', left: 12, top: 10, width: W, height: H, borderRadius: 6, overflow: 'hidden', boxShadow: `0 0 0 1px ${LINE}` }}>
      <div style={{ position: 'absolute', inset: 0, filter: `saturate(${interpolate(f, [60, 200], [0.6, 1.08], clamp)}) contrast(${interpolate(f, [60, 200], [0.88, 1.06], clamp)})` }}>
        <Footage w={W} h={H} region={{ y: 406, h: 630 }} startFrom={30} />
      </div>
      {chip > 0 && <div style={{ position: 'absolute', left: '50%', top: 24, transform: `translateX(-50%) translateY(${(1 - chip) * -10}px)`, opacity: chip, padding: '6px 14px', borderRadius: 10, background: 'rgb(255 255 255 / .9)', textAlign: 'center' }}>
        <div style={mono(9, '#555', { letterSpacing: 2 })}>A LISTA</div><div style={{ fontFamily: UI, fontWeight: 700, fontSize: 15, color: '#111' }}>3 regras do caixa</div>
      </div>}
      {font >= 0 && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 92, display: 'flex', justifyContent: 'center', transform: `scale(${pop})` }}>
        <div style={{ position: 'relative', padding: '4px 10px', outline: f % 40 < 30 ? `1.5px solid ${BLUE}` : 'none', outlineOffset: 2 }}>
          {caption}
          <span style={{ position: 'absolute', left: '50%', bottom: -22, transform: 'translateX(-50%)', ...mono(9, '#fff'), background: BLUE, padding: '1px 5px', borderRadius: 3 }}>{FONT_LIST[font].label}</span>
        </div>
      </div>}
      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, display: 'flex', justifyContent: 'space-between', ...mono(10, '#fff'), background: 'rgb(0 0 0 / .45)', padding: '3px 8px', borderRadius: 4 }}>
        <span>● 10 agentes · {layers} camadas</span><span style={{ color: LIME }}>9:16 · 1080×1920</span>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 12, right: 12, top: H + 20, display: 'flex', justifyContent: 'center', gap: 18, alignItems: 'center' }}>
      {['⏮', '◀', '❚❚', '▶', '⏭'].map(s => <span key={s} style={{ fontSize: 14, color: s === '❚❚' ? LIME : TXT }}>{s}</span>)}
    </div>
    <div style={{ position: 'absolute', left: 12, right: 12, top: H + 46, height: 4, borderRadius: 2, background: '#161c29' }}>
      <div style={{ width: `${interpolate(f, [0, 450], [6, 64])}%`, height: '100%', background: LIME, borderRadius: 2 }} />
    </div>
  </Panel>
}

function Scopes({ f }: { f: number }) {
  const step = Math.floor(f / 2)
  const cols = 64, W = SCOPE.w - 20
  const dots: ReactNode[] = []
  for (let c = 0; c < cols; c++) {
    for (let k = 0; k < 7; k++) {
      const base = 0.25 + 0.45 * Math.sin(c / 9 + 0.6) * 0.5 + 0.25 * random(`w${c}${k}`)
      const y = Math.min(0.95, Math.max(0.05, base + 0.08 * Math.sin((step + c * 3 + k * 11) / 5)))
      dots.push(<rect key={`${c}-${k}`} x={(c / cols) * W} y={y * 170} width={3} height={2} fill={GREEN} opacity={0.35 + 0.6 * random(`o${c}${k}${step % 7}`)} />)
    }
  }
  const vec: ReactNode[] = []
  for (let i = 0; i < 140; i++) {
    const ang = (-123 + (random(`va${i}`) - 0.5) * 26 + Math.sin((f + i) / 13) * 4) * Math.PI / 180
    const r = 18 + random(`vr${i}`) * interpolate(f, [0, 200], [55, 92], clamp)
    vec.push(<circle key={i} cx={110 + Math.cos(ang) * r} cy={110 + Math.sin(ang) * r} r={1.3} fill="#f5d6a0" opacity={0.5 + random(`vo${i}`) * 0.5} />)
  }
  const lufs = interpolate(f, [0, 120, 450], [-22.4, -14.1, -14.1], clamp)
  return <Panel b={SCOPE} title="FORMA DE ONDA · LUMA" right={<span style={mono(10)}>Rec.709</span>}>
    <svg style={{ position: 'absolute', left: 10, top: 10 }} width={W} height={180}>
      {[0, 0.25, 0.5, 0.75, 1].map(g => <line key={g} x1={0} x2={W} y1={g * 170 + 1} y2={g * 170 + 1} stroke={LINE} />)}
      {dots}
    </svg>
    <div style={{ position: 'absolute', left: 10, top: 200, ...mono(10.5, TXT, { fontWeight: 700, letterSpacing: 1.2 }) }}>VECTORSCOPE</div>
    <svg style={{ position: 'absolute', left: (SCOPE.w - 220) / 2, top: 218 }} width={220} height={220}>
      <circle cx={110} cy={110} r={104} fill="none" stroke={LINE} strokeWidth={1.5} />
      <circle cx={110} cy={110} r={60} fill="none" stroke={LINE} />
      <line x1={110} y1={6} x2={110} y2={214} stroke={LINE} /><line x1={6} y1={110} x2={214} y2={110} stroke={LINE} />
      <line x1={110} y1={110} x2={110 + Math.cos(-123 * Math.PI / 180) * 104} y2={110 + Math.sin(-123 * Math.PI / 180) * 104} stroke="#7a6a50" strokeDasharray="3 3" />
      {['R', 'MG', 'B', 'CY', 'G', 'YL'].map((l, i) => { const a = (-76 + i * 60) * Math.PI / 180; return <text key={l} x={110 + Math.cos(a) * 82 - 6} y={110 + Math.sin(a) * 82 + 4} fill={DIM} fontSize={9} fontFamily={MONO}>{l}</text> })}
      {vec}
    </svg>
    <div style={{ position: 'absolute', left: 10, right: 10, top: 452 }}>
      <div style={mono(10.5, TXT, { fontWeight: 700, letterSpacing: 1.2 })}>LOUDNESS</div>
      {[['VOZ', 0.72, GREEN], ['MÚSICA', 0.38, PURPLE], ['SFX', 0.22, BLUE]].map(([l, v, c], i) => {
        const level = (v as number) * (0.85 + 0.15 * Math.abs(Math.sin((f + i * 9) / 4)))
        return <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
          <span style={{ ...mono(10), width: 50 }}>{l}</span>
          <div style={{ flex: 1, height: 7, background: '#161c29', borderRadius: 4 }}><div style={{ width: `${level * 100}%`, height: '100%', background: c as string, borderRadius: 4 }} /></div>
          <span style={{ ...mono(10, TXT), width: 54, textAlign: 'right' }}>{(-40 + level * 30).toFixed(1)} dB</span>
        </div>
      })}
      <div style={{ marginTop: 14, ...mono(12, TXT) }}>INTEGRADO <b style={{ color: Math.abs(lufs + 14.1) < 0.2 ? LIME : ORANGE }}>{lufs.toFixed(1)} LUFS</b> {Math.abs(lufs + 14.1) < 0.2 ? '✓' : ''}</div>
    </div>
  </Panel>
}

function Wheel({ x, label, dot, value }: { x: number; label: string; dot: { x: number; y: number }; value: string }) {
  return <div style={{ position: 'absolute', left: x, top: 8, width: 100, textAlign: 'center' }}>
    <div style={{ position: 'relative', width: 92, height: 92, margin: '0 auto', borderRadius: '50%', background: 'conic-gradient(from 90deg, #ff3b3b, #ff00d4, #4f5bff, #00d4ff, #3dff7a, #fff23b, #ff3b3b)', boxShadow: '0 0 0 3px #1a2030' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgb(255 255 255 / .9), rgb(255 255 255 / 0) 70%)' }} />
      <i style={{ position: 'absolute', left: 46 + dot.x - 6, top: 46 + dot.y - 6, width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 2px #0b0d12, 0 0 8px rgb(0 0 0 / .5)' }} />
    </div>
    <div style={{ ...mono(10, TXT, { fontWeight: 700, letterSpacing: 1.2 }), marginTop: 6 }}>{label}</div>
    <div style={mono(9.5)}>{value}</div>
  </div>
}

function Side({ f }: { f: number }) {
  const g = (a: number, b: number) => ease(f, a, b)
  const lift = { x: -14 * g(40, 90), y: 8 * g(40, 90) }
  const gamma = { x: 10 * g(100, 150), y: -6 * g(100, 150) + 4 * g(300, 340) }
  const gain = { x: 6 * g(170, 220), y: -12 * g(170, 220) }
  const sliders: [string, number][] = [['Temp', 0.5 + 0.12 * g(60, 110)], ['Tint', 0.5 - 0.06 * g(120, 160)], ['Contraste', 0.5 + 0.18 * g(180, 230)], ['Saturação', 0.5 + 0.14 * g(240, 280)], ['Exposição', 0.5 + 0.05 * g(320, 360)]]
  const font = fontAt(f)
  const open = f > 30
  const style = Math.floor(f / 90) % 4
  return <Panel b={SIDE} title="COR" right={<span style={mono(10)}>nó 01 · day</span>}>
    <Wheel x={14} label="LIFT" dot={lift} value={(lift.x / 100).toFixed(2)} />
    <Wheel x={124} label="GAMMA" dot={gamma} value={(gamma.x / 100).toFixed(2)} />
    <Wheel x={234} label="GAIN" dot={gain} value={(gain.x / 100).toFixed(2)} />
    <div style={{ position: 'absolute', left: 14, right: 14, top: 150 }}>
      {sliders.map(([l, v]) => <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 19 }}>
        <span style={{ ...mono(10), width: 72 }}>{l}</span>
        <div style={{ position: 'relative', flex: 1, height: 3, background: '#1e2534', borderRadius: 2 }}>
          <i style={{ position: 'absolute', left: `${v * 100}%`, top: -4, width: 11, height: 11, marginLeft: -5, borderRadius: '50%', background: '#e9edf5' }} />
        </div>
        <span style={{ ...mono(10, TXT), width: 38, textAlign: 'right' }}>{((v - 0.5) * 2).toFixed(2)}</span>
      </div>)}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, height: 24, padding: '0 8px', borderRadius: 5, border: `1px solid ${f > 120 ? ORANGE : LINE}`, background: f > 120 ? 'rgb(255 138 61 / .08)' : 'transparent' }}>
        <span style={mono(10, ORANGE, { fontWeight: 700 })}>LUT</span><span style={{ fontFamily: UI, fontSize: 12, color: TXT }}>{f > 120 ? 'Daylight Clean 01 · 85%' : '—'}</span>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 296, height: 1, background: LINE }} />
    <div style={{ position: 'absolute', left: 14, right: 14, top: 306 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={mono(10.5, TXT, { fontWeight: 700, letterSpacing: 1.2 })}>LEGENDAS</span><span style={mono(10)}>palavra por palavra</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        {['Destaque', 'Sans limpa', 'Karaokê', 'Mínima'].map((l, i) => <span key={l} style={{ fontFamily: UI, fontSize: 12, color: i === style ? '#0b0d12' : TXT, background: i === style ? LIME : '#121826', border: `1px solid ${i === style ? LIME : LINE}`, borderRadius: 5, padding: '4px 8px' }}>{l}</span>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <span style={{ ...mono(10), width: 44 }}>Fonte</span>
        <span style={{ flex: 1, fontFamily: UI, fontSize: 12, color: '#fff', background: '#121826', border: `1px solid ${BLUE}`, borderRadius: 5, padding: '4px 8px' }}>{font >= 0 ? FONT_LIST[font].label : 'Arial Bold'} ▾</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ ...mono(10), width: 44 }}>Cores</span>
        {['#fff', '#ffe14d', LIME, PINK, '#111'].map((c, i) => <i key={c} style={{ width: 14, height: 14, borderRadius: '50%', background: c, boxShadow: i === (font === 5 ? 2 : 0) ? `0 0 0 2px ${PANEL}, 0 0 0 3.5px #fff` : `0 0 0 1px ${LINE}` }} />)}
      </div>
    </div>
    {open && <div style={{ position: 'absolute', left: 70, right: 14, top: FONT_ROW_Y(0) - SIDE.y - 24 - 4, padding: 4, borderRadius: 6, background: '#141b2a', border: `1px solid ${LINE}`, boxShadow: '0 10px 30px rgb(0 0 0 / .5)', opacity: ease(f, 30, 40) }}>
      {FONT_LIST.map((ft, i) => <div key={ft.label} style={{ height: 24, display: 'flex', alignItems: 'center', padding: '0 8px', borderRadius: 4, background: i === font ? 'rgb(79 140 255 / .25)' : 'transparent', fontFamily: ft.family, fontSize: i === 3 ? 11 : 14, color: i === font ? '#fff' : TXT, fontWeight: i === 0 || i === 5 ? 800 : 400 }}>{ft.label}</div>)}
    </div>}
  </Panel>
}

function Timeline({ f }: { f: number }) {
  const front = buildX(f)
  const ph = playheadX(f)
  const rel = (x: number) => TL.x + TRACK_X + x
  return <div style={{ position: 'absolute', left: TL.x, top: TL.y, width: TL.w, height: TL.h, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 8, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 12, top: 4, display: 'flex', gap: 16, alignItems: 'center', height: 20 }}>
      <span style={mono(13, LIME, { fontWeight: 700 })}>{tc((ph - TL.x - TRACK_X) / PX_PER_SEC)}</span>
      <span style={mono(11)}>/ {tc((front - TL.x - TRACK_X) / PX_PER_SEC)}</span>
      <span style={mono(11, TXT)}>❚❚ PAUSADO · NAVEGANDO</span>
    </div>
    <div style={{ position: 'absolute', right: 12, top: 4, display: 'flex', gap: 14 }}>
      <span style={mono(11, TXT)}>SNAP</span><span style={mono(11, LIME)}>RIPPLE</span><span style={mono(11)}>1080×1920 · 30 fps</span>
    </div>
    {/* ruler */}
    {Array.from({ length: 36 }, (_, i) => <span key={i} style={{ position: 'absolute', left: TRACK_X + i * PX_PER_SEC, top: 22, height: 6, borderLeft: `1px solid ${i % 5 ? LINE : '#3a4357'}` }}>
      {i % 5 === 0 && <span style={{ position: 'absolute', left: 3, top: -3, ...mono(9) }}>00:{String(i).padStart(2, '0')}</span>}
    </span>)}
    {TRACKS.map(t => <div key={t.label} style={{ position: 'absolute', left: 0, top: t.y, width: TRACK_X - 8, height: t.h, display: 'flex', alignItems: 'center', paddingLeft: 12, ...mono(9.5, TXT, { fontWeight: 700 }), borderRight: `1px solid ${LINE}` }}>{t.label}</div>)}
    {/* rendered region */}
    <div style={{ position: 'absolute', left: TRACK_X, top: 26, width: front - TL.x - TRACK_X, height: TL.h - 54, background: 'rgb(198 244 50 / .03)' }} />
    <div style={{ position: 'absolute', left: front - TL.x, top: 26, width: 2, height: TL.h - 54, background: GREEN, boxShadow: `0 0 14px ${GREEN}`, opacity: 0.8 }} />
    <span style={{ position: 'absolute', left: front - TL.x + 6, top: 28, ...mono(9, '#0b0d12', { fontWeight: 700 }), background: GREEN, padding: '1px 5px', borderRadius: 3 }}>BUILD</span>
    {clips.map((c, i) => {
      const t = TRACKS[c.track === 3 ? 3 : c.track]
      const x0 = rel(c.x)
      if (x0 >= front) return null
      const w = Math.min(c.w, front - x0)
      const fresh = front - x0 < 60
      return <div key={i} style={{ position: 'absolute', left: x0 - TL.x, top: t.y + 2, width: w, height: t.h - 4, borderRadius: 4, overflow: 'hidden', background: c.track === 3 ? '#1c2a48' : `${c.color}26`, border: `1px solid ${fresh ? '#fff' : c.color}`, boxShadow: fresh ? `0 0 12px ${c.color}` : 'none' }}>
        {c.thumb && <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>{Array.from({ length: Math.ceil(w / 60) }, (_, k) => <Img key={k} src={staticFile(`remotion/video-editor/clip${c.thumb}.jpg`)} style={{ width: 60, height: '100%', objectFit: 'cover', opacity: 0.85 }} />)}</div>}
        <span style={{ position: 'relative', ...mono(9.5, c.track === 0 ? '#0b0d12' : '#fff', { fontWeight: 700 }), padding: '0 5px', lineHeight: `${t.h - 4}px`, background: c.track === 0 ? c.color : c.track === 3 ? 'rgb(0 0 0 / .45)' : 'transparent', display: 'inline-block' }}>{c.label}</span>
      </div>
    })}
    {/* LUT, voice, music and sfx lanes */}
    <div style={{ position: 'absolute', left: TRACK_X, top: TRACKS[4].y + 2, width: Math.max(0, front - TL.x - TRACK_X), height: TRACKS[4].h - 4, borderRadius: 3, border: `1px solid ${ORANGE}`, background: `repeating-linear-gradient(135deg, rgb(255 138 61 / .35) 0 6px, rgb(255 138 61 / .1) 6px 12px)`, overflow: 'hidden' }}>
      <span style={{ ...mono(9, '#fff', { fontWeight: 700 }), marginLeft: 4, padding: '0 5px', background: '#2a1708', borderRadius: 2 }}>Daylight Clean 01 · LUT · ajustes</span>
    </div>
    <Wave y={TRACKS[5].y} h={TRACKS[5].h} width={front - TL.x - TRACK_X} color={GREEN} seed="v" />
    <Wave y={TRACKS[6].y} h={TRACKS[6].h} width={front - TL.x - TRACK_X - 40} color={PURPLE} seed="m" x={40} />
    {Array.from({ length: 10 }, (_, i) => { const x = 60 + i * 92 + Math.round(random(`s${i}`) * 30); return x < front - TL.x - TRACK_X ? <span key={i} style={{ position: 'absolute', left: TRACK_X + x, top: TRACKS[7].y + 3, ...mono(8.5, '#fff', { fontWeight: 700 }), background: BLUE, borderRadius: 3, padding: '1px 4px' }}>{['whoosh', 'pop', 'click', 'riser'][i % 4]}</span> : null })}
    {/* playhead */}
    <div style={{ position: 'absolute', left: ph - TL.x, top: 20, width: 2, height: TL.h - 48, background: YELLOW }}>
      <i style={{ position: 'absolute', left: -6, top: -2, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: `9px solid ${YELLOW}` }} />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 12px' }}>
      <span style={mono(10, LIME)}>● 10 agentes</span>
      <span style={mono(10, TXT)}>{Math.round(interpolate(f, [0, 450], [4, 312], clamp))} edições</span>
      <span style={mono(10)}>GPU {58 + Math.round(10 * Math.abs(Math.sin(f / 17)))}%</span>
      <span style={mono(10)}>RAM 9.1 GB</span>
      <span style={mono(10)}>preview 1/2 res</span>
      <span style={{ marginLeft: 'auto', ...mono(10) }}>salvo automaticamente · v3.12</span>
    </div>
  </div>
}

function Wave({ y, h, width, color, seed, x = 0 }: { y: number; h: number; width: number; color: string; seed: string; x?: number }) {
  if (width <= 0) return null
  const bars = Math.floor(width / 4)
  return <div style={{ position: 'absolute', left: TRACK_X + x, top: y + 2, width, height: h - 4, borderRadius: 3, background: `${color}1f`, border: `1px solid ${color}`, overflow: 'hidden' }}>
    <svg width={width} height={h - 4} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: bars }, (_, i) => {
        const silence = seed === 'v' && Math.sin(i / 11) > 0.85
        const a = silence ? 0.05 : 0.2 + 0.8 * random(`${seed}${i}`) * (0.6 + 0.4 * Math.abs(Math.sin(i / 7)))
        const bh = a * (h - 8)
        return <rect key={i} x={i * 4} y={(h - 4 - bh) / 2} width={2.4} height={bh} fill={color} opacity={0.85} />
      })}
    </svg>
  </div>
}

export function ClaudeVideoEditorSwarm() {
  const f = useCurrentFrame()
  const fadeIn = interpolate(f, [0, 10], [0, 1], clamp)
  return <AbsoluteFill style={{ background: BG, fontFamily: UI, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, opacity: fadeIn }}>
      <TopBar f={f} />
      <Bin f={f} />
      <Source f={f} />
      <Log f={f} />
      <Program f={f} />
      <Scopes f={f} />
      <Side f={f} />
      <Timeline f={f} />
      {agents.map((ag, a) => <Cursor key={ag.id} a={a} f={f} />)}
    </div>
  </AbsoluteFill>
}

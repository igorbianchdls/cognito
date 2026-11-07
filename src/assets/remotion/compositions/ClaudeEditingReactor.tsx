import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'

// "Claude editing agent": a dark "reactor" screen where an AI agent edits 100 vertical reels in parallel.
// An orange core inside a wireframe sphere, dozens of reels floating around it (each one lights up when it is
// finished, with a line from the core), a counter going to 100 / 100, the reel being worked on (left), the one in
// focus (right) and an editing timeline filling up (bottom). 1920×1080, 30 fps. All reels are made up.

export const CLAUDE_REACTOR_DURATION = 360
const CX = 960, CY = 468
const BG = '#060a16'
const ORANGE = '#ef7d4f', BLUE = '#4f8cff', PURPLE = '#8b7cf6', CYAN = '#38bdf8', GREEN = '#4ade80'
const MONO = 'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace'
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

const COUNT_START = 24, COUNT_END = 330
const countAt = (f: number) => Math.floor(interpolate(f, [COUNT_START, COUNT_END], [0, 100], { ...clamp, easing: Easing.inOut(Easing.quad) }))
const pad = (n: number) => String(n).padStart(3, '0')
/** A new reel comes into the editor every 75 frames. */
const CYCLE = 75

const mono = (size: number, color = 'rgb(200 210 240 / .55)', extra?: CSSProperties): CSSProperties => ({ fontFamily: MONO, fontSize: size, color, letterSpacing: 2, textTransform: 'uppercase', ...extra })

// ---------- made-up reels ----------

const walls = ['#d9c7b8', '#c9d6e3', '#e8d9c0', '#bfcad9', '#d8b9a8', '#cfd8c4']
const shirts = ['#3b5b8c', '#c2584a', '#2f2f35', '#7a8f5a', '#e0a24a', '#6b4fa0']
const skins = ['#e8b896', '#c98e6b', '#f1c9a5', '#a8714f']
const captions = ['FAÇA ACONTECER', 'CADA FRAME CONTA', 'SEU PRÓXIMO APP', 'COMECE HOJE', '3 DICAS RÁPIDAS', 'ANTES E DEPOIS']
const pick = <T,>(list: T[], seed: string) => list[Math.floor(random(seed) * list.length)]

/** A vertical reel thumbnail: a person talking, an app screen, or a text card. Big ones also get a readable caption. */
function ReelArt({ seed, w, h, caption }: { seed: string; w: number; h: number; caption?: string }) {
  const kind = pick(['person', 'person', 'person', 'app', 'text'] as const, `${seed}-k`)
  const big = w >= 140
  const base: CSSProperties = { position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: Math.max(4, w * 0.06) }
  let body: ReactNode
  if (kind === 'person') {
    const head = w * 0.36
    body = <div style={{ ...base, background: `linear-gradient(180deg, ${pick(walls, `${seed}-w`)}, ${pick(walls, `${seed}-w2`)})` }}>
      <i style={{ position: 'absolute', left: (w - w * 0.92) / 2, bottom: -h * 0.04, width: w * 0.92, height: h * 0.36, borderRadius: `${w * 0.4}px ${w * 0.4}px 0 0`, background: pick(shirts, `${seed}-s`) }} />
      <i style={{ position: 'absolute', left: (w - head) / 2, top: h * 0.3, width: head, height: head * 1.15, borderRadius: '50%', background: pick(skins, `${seed}-sk`) }} />
      <i style={{ position: 'absolute', left: (w - head * 1.05) / 2, top: h * 0.28, width: head * 1.05, height: head * 0.45, borderRadius: `${head}px ${head}px ${head * 0.2}px ${head * 0.2}px`, background: '#2b2320' }} />
    </div>
  } else if (kind === 'app') {
    body = <div style={{ ...base, background: '#eef2f8' }}>
      <i style={{ position: 'absolute', left: '8%', right: '8%', top: '8%', height: '6%', borderRadius: 3, background: '#cfd8e6' }} />
      <i style={{ position: 'absolute', left: '8%', right: '8%', top: '40%', height: '30%', borderRadius: w * 0.05, background: BLUE }} />
      {[18, 24, 30].map(t => <i key={t} style={{ position: 'absolute', left: '8%', width: `${50 + (t % 3) * 12}%`, top: `${t}%`, height: '3%', borderRadius: 2, background: '#c3cbd8' }} />)}
    </div>
  } else {
    body = <div style={{ ...base, background: 'linear-gradient(160deg, #1f2433, #0e111a)' }}>
      {[30, 40, 50].map((t, i) => <i key={t} style={{ position: 'absolute', left: '12%', width: `${76 - i * 14}%`, top: `${t}%`, height: '6%', borderRadius: 3, background: i === 0 ? ORANGE : '#e5e7eb' }} />)}
    </div>
  }
  return <>
    {body}
    {big && caption && <div style={{ position: 'absolute', left: '8%', right: '8%', top: '12%', padding: '6px 8px', borderRadius: 6, background: '#fff', color: '#111', fontSize: w * 0.085, fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>{caption}</div>}
    {big && <div style={{ position: 'absolute', left: '18%', right: '18%', bottom: '6%', height: w * 0.12, borderRadius: w * 0.06, background: '#e2364b', color: '#fff', fontSize: w * 0.06, fontWeight: 700, display: 'grid', placeItems: 'center' }}>SAIBA MAIS</div>}
    {!big && <i style={{ position: 'absolute', left: '15%', right: '15%', top: '70%', height: '6%', borderRadius: 2, background: 'rgb(255 255 255 / .9)' }} />}
  </>
}

// ---------- the reactor ----------

const N = 64
const cards = Array.from({ length: N }, (_, i) => {
  const row = i % 2
  const z = random(`z${i}`)
  return {
    seed: `card${i}`, row, z,
    x: 520 + random(`u${i}`) * 880,
    y: (row ? 702 : 262) + (random(`y${i}`) - 0.5) * 56,
    phase: random(`p${i}`) * Math.PI * 2,
    done: COUNT_START + 10 + (i / N) * (COUNT_END - COUNT_START - 20) + random(`t${i}`) * 14,
  }
}).sort((a, b) => a.z - b.z)

function Card({ c, f, i }: { c: (typeof cards)[number]; f: number; i: number }) {
  const h = 50 + c.z * 62, w = h * 0.5625
  const x = c.x + Math.sin(f / 80 + c.phase) * 24 * (0.4 + c.z), y = c.y + Math.cos(f / 100 + c.phase) * 8
  const appear = interpolate(f, [4 + i * 0.6, 22 + i * 0.6], [0, 1], clamp)
  const t = f - c.done
  const glow = interpolate(t, [0, 4, 20], [0, 1, 0], clamp)
  const check = interpolate(t, [2, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })
  return <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: appear * (0.35 + 0.65 * c.z), filter: `blur(${(1 - c.z) * 2.6}px)`,
    transform: `scale(${1 + glow * 0.12})`, boxShadow: `0 0 0 ${1 + glow * 2}px rgb(255 255 255 / ${0.18 + glow * 0.8}), 0 0 ${glow * 30}px rgb(239 125 79 / ${glow * 0.8})`, borderRadius: w * 0.06, zIndex: Math.round(c.z * 10) }}>
    <ReelArt seed={c.seed} w={w} h={h} />
    {check > 0 && <span style={{ position: 'absolute', right: -6, top: -6, width: 16, height: 16, borderRadius: '50%', background: GREEN, color: '#062', fontSize: 11, fontWeight: 900, display: 'grid', placeItems: 'center', transform: `scale(${check})` }}>✓</span>}
  </div>
}

/** Curved lines from the core to the reels finished in the last moments. */
function Links({ f }: { f: number }) {
  return <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
    {cards.map((c, i) => {
      const t = f - c.done + 10
      if (t < 0 || t > 30) return null
      const x = c.x + Math.sin(f / 80 + c.phase) * 24 * (0.4 + c.z), y = c.y + Math.cos(f / 100 + c.phase) * 8
      const draw = interpolate(t, [0, 10], [0, 1], clamp), fade = interpolate(t, [18, 30], [1, 0], clamp)
      const mx = (CX + x) / 2 + (c.row ? -60 : 60), my = (CY + y) / 2
      return <path key={i} d={`M${CX},${CY} Q${mx},${my} ${x},${y}`} fill="none" stroke={i % 3 ? 'rgb(150 180 255 / .8)' : ORANGE} strokeWidth={1.6}
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} opacity={fade} />
    })}
  </svg>
}

function Burst({ size, f, glow = 1 }: { size: number; f: number; glow?: number }) {
  return <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ display: 'block', overflow: 'visible', filter: `drop-shadow(0 0 ${8 * glow}px rgb(239 125 79 / .9))` }}>
    <g transform={`rotate(${f * 0.6})`}>
      {Array.from({ length: 12 }, (_, i) => <path key={i} d="M0,-6 L3,-44 L0,-48 L-3,-44 Z" fill={ORANGE} transform={`rotate(${i * 30}) scale(${i % 2 ? 0.78 : 1})`} />)}
      <circle r={9} fill={ORANGE} />
    </g>
  </svg>
}

/** Wireframe sphere with drifting particles around the core. */
function Sphere({ f }: { f: number }) {
  const R = 160, rot = f / 70
  const dots = Array.from({ length: 90 }, (_, i) => {
    const lat = (random(`lat${i}`) - 0.5) * Math.PI, lon = random(`lon${i}`) * Math.PI * 2 + rot
    return { x: R * Math.cos(lat) * Math.sin(lon), y: R * Math.sin(lat) * 0.92, z: Math.cos(lat) * Math.cos(lon) }
  })
  return <svg width={520} height={420} viewBox="-260 -210 520 420" style={{ position: 'absolute', left: CX - 260, top: CY - 210, zIndex: 4, overflow: 'visible' }}>
    <defs><radialGradient id="core-glow"><stop offset="0" stopColor={ORANGE} stopOpacity={0.35} /><stop offset="0.5" stopColor="#3b5bdb" stopOpacity={0.12} /><stop offset="1" stopColor="#3b5bdb" stopOpacity={0} /></radialGradient></defs>
    <circle r={250} fill="url(#core-glow)" />
    {Array.from({ length: 9 }, (_, k) => <ellipse key={`lo${k}`} rx={Math.abs(R * Math.cos(rot + (k * Math.PI) / 9))} ry={R * 0.92} fill="none" stroke="rgb(130 160 255 / .2)" strokeWidth={1} />)}
    {[-0.6, -0.3, 0, 0.3, 0.6].map(p => <ellipse key={`la${p}`} cy={R * Math.sin(p) * 0.92} rx={R * Math.cos(p)} ry={R * Math.cos(p) * 0.18} fill="none" stroke="rgb(130 160 255 / .16)" strokeWidth={1} />)}
    {/* Flowing wave lines under the core. */}
    {Array.from({ length: 6 }, (_, k) => {
      const yb = 40 + k * 18
      const d = Array.from({ length: 41 }, (_, j) => { const x = -220 + j * 11; return `${j ? 'L' : 'M'}${x},${yb + Math.sin(j / 4 + f / 18 + k) * (6 + k * 2) * Math.cos((x / 220) * (Math.PI / 2))}` }).join(' ')
      return <path key={`w${k}`} d={d} fill="none" stroke="rgb(120 150 255 / .22)" strokeWidth={1} />
    })}
    {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1.2 + (d.z + 1) * 0.6} fill="#c7d4ff" opacity={0.15 + (d.z + 1) * 0.35} />)}
  </svg>
}

function Waveform({ f, x, flip }: { f: number; x: number; flip?: boolean }) {
  return <div style={{ position: 'absolute', left: x, top: 54, width: 200, height: 34, display: 'flex', alignItems: 'center', gap: 4, flexDirection: flip ? 'row-reverse' : 'row' }}>
    {Array.from({ length: 26 }, (_, i) => {
      const hgt = 4 + Math.abs(Math.sin(f / 6 + i * 0.7) * Math.cos(f / 17 + i * 0.3)) * 28 * (1 - Math.abs(i - 13) / 16)
      return <i key={i} style={{ width: 3, height: hgt, borderRadius: 2, background: 'rgb(170 190 255 / .55)' }} />
    })}
  </div>
}

// ---------- side panels and timeline ----------

const panel: CSSProperties = { position: 'absolute', borderRadius: 16, background: 'rgb(255 255 255 / .025)', boxShadow: 'inset 0 0 0 1px rgb(140 160 220 / .14)' }
const steps = ['Referência', 'Gancho', 'Corte', 'Legenda', 'Final']

function WorkPanel({ f: frame, n }: { f: number; n: number }) {
  const f = Math.min(frame, COUNT_END + CYCLE - 1 - (COUNT_END % CYCLE))
  const cycle = Math.floor(f / CYCLE), local = (f % CYCLE) / CYCLE
  const swap = interpolate(f % CYCLE, [0, 10], [0, 1], clamp)
  const metrics = ['Retenção', 'Ritmo', 'Legenda', 'Áudio', 'Cores']
  return <div style={{ ...panel, left: 60, top: 196, width: 410, height: 566 }}>
    <div style={{ position: 'absolute', left: 22, top: 18, right: 22, display: 'flex', justifyContent: 'space-between' }}>
      <span data-mono style={mono(13)}>Reel {pad(Math.min(100, n + 1))} · {steps[Math.min(4, Math.floor(local * 5))]}</span>
      <span data-mono style={{ ...mono(13, GREEN), display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, opacity: f >= COUNT_END ? 1 : 0.5 + 0.5 * Math.abs(Math.sin(f / 7)) }} />{f >= COUNT_END ? 'Concluído' : 'Editando'}</span>
    </div>
    <div style={{ position: 'absolute', left: 22, top: 54, width: 178, height: 316, opacity: swap, transform: `translateY(${(1 - swap) * 10}px)`, boxShadow: '0 10px 30px rgb(0 0 0 / .5)', borderRadius: 11 }}>
      <ReelArt seed={`work${cycle}`} w={178} h={316} caption={captions[cycle % captions.length]} />
    </div>
    {metrics.map((m, i) => {
      const v = 0.45 + random(`m${cycle}-${i}`) * 0.5
      return <div key={m} style={{ position: 'absolute', left: 222, top: 62 + i * 46, width: 166 }}>
        <span data-mono style={mono(11)}>{m}</span>
        <div style={{ marginTop: 7, height: 4, borderRadius: 2, background: 'rgb(255 255 255 / .08)' }}><i style={{ display: 'block', height: '100%', width: `${v * interpolate(local, [0, 0.5], [0.1, 1], clamp) * 100}%`, borderRadius: 2, background: i % 2 ? PURPLE : BLUE }} /></div>
      </div>
    })}
    <svg width={166} height={70} style={{ position: 'absolute', left: 222, top: 300 }}>
      <path d={Array.from({ length: 30 }, (_, j) => `${j ? 'L' : 'M'}${j * 5.7},${38 + Math.sin(j / 3 + cycle) * 14 - j * 0.5}`).join(' ')} fill="none" stroke="rgb(220 228 255 / .8)" strokeWidth={1.6}
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - interpolate(local, [0.1, 0.6], [0, 1], clamp)} />
    </svg>
    {/* Transcript: words of the cut, the current one lit. */}
    <div style={{ position: 'absolute', left: 22, top: 392, right: 22 }}>
      <span data-mono style={mono(11)}>Transcrição</span>
      {Array.from({ length: 6 }, (_, r) => <div key={r} style={{ display: 'flex', gap: 6, marginTop: 9 }}>
        {Array.from({ length: 6 }, (_, k) => {
          const idx = r * 6 + k, lit = idx === Math.floor(local * 36), past = idx < local * 36
          return <i key={k} style={{ height: 8, flex: `0 0 ${18 + random(`wd${cycle}-${idx}`) * 40}px`, borderRadius: 2, background: lit ? ORANGE : past ? 'rgb(200 210 240 / .55)' : 'rgb(200 210 240 / .14)' }} />
        })}
      </div>)}
    </div>
  </div>
}

function FocusPanel({ f }: { f: number }) {
  const done = f >= COUNT_END
  const cycle = Math.floor((Math.min(f, COUNT_END) + 38) / CYCLE)
  const swap = done ? 1 : interpolate((f + 38) % CYCLE, [0, 12], [0, 1], clamp)
  const render = done ? 100 : Math.min(100, Math.round(((f + 38) % CYCLE) / CYCLE * 130))
  return <div style={{ ...panel, left: 1450, top: 196, width: 410, height: 566 }}>
    <div style={{ position: 'absolute', left: 22, top: 18, right: 22, display: 'flex', justifyContent: 'space-between' }}>
      <span data-mono style={mono(13)}>Em foco · Final</span><span data-mono style={mono(13)}>1080×1920</span>
    </div>
    <div style={{ position: 'absolute', left: (410 - 236) / 2, top: 56, width: 236, height: 420, opacity: swap, transform: `scale(${0.96 + swap * 0.04})`, boxShadow: '0 16px 40px rgb(0 0 0 / .55), 0 0 0 1px rgb(255 255 255 / .2)', borderRadius: 14 }}>
      <ReelArt seed={`focus${cycle}`} w={236} h={420} caption={captions[(cycle + 3) % captions.length]} />
    </div>
    <div style={{ position: 'absolute', left: 22, right: 22, top: 498 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span data-mono style={mono(11)}>Render</span><span data-mono style={mono(11, '#dbe3ff')}>{render}%</span></div>
      <div style={{ marginTop: 8, height: 5, borderRadius: 3, background: 'rgb(255 255 255 / .08)' }}><i style={{ display: 'block', height: '100%', width: `${render}%`, borderRadius: 3, background: render === 100 ? GREEN : ORANGE }} /></div>
    </div>
  </div>
}

const trackColors = [BLUE, PURPLE, '#5d6b8a', CYAN]
function Timeline({ f, n }: { f: number; n: number }) {
  // After the last reel, the sequence stays complete with the playhead at the end.
  const cycle = Math.floor(Math.min(f, COUNT_END) / CYCLE), local = f >= COUNT_END ? 0.999 : (f % CYCLE) / CYCLE
  const reveal = interpolate(local, [0, 0.7], [0, 1], clamp)
  const left = 200, width = 1576
  return <div style={{ ...panel, left: 60, top: 786, width: 1800, height: 262 }}>
    <div style={{ position: 'absolute', left: 22, top: 16, right: 22, display: 'flex', justifyContent: 'space-between' }}>
      <span data-mono style={mono(13)}>Sequência / Reel {pad(Math.min(100, n + 1))}</span>
      <span data-mono style={mono(13, 'rgb(220 228 255 / .8)')}>00:00:{String(Math.floor(local * 28)).padStart(2, '0')}:{String(f % 30).padStart(2, '0')}</span>
    </div>
    <div style={{ position: 'absolute', left: 22, top: 50, width: 96, height: 170, borderRadius: 8, overflow: 'hidden' }}><ReelArt seed={`work${cycle}`} w={96} h={170} /></div>
    {trackColors.map((color, k) => {
      const clips: { x: number; w: number }[] = []
      for (let x = random(`o${cycle}-${k}`) * 40, j = 0; x < width - 40; j++) {
        const w = 50 + random(`cw${cycle}-${k}-${j}`) * 170
        clips.push({ x, w: Math.min(w, width - x) })
        x += w + 6 + random(`cg${cycle}-${k}-${j}`) * 26
      }
      return <div key={k} style={{ position: 'absolute', left: left - 60, top: 54 + k * 40, width: width + 60, height: 28 }}>
        <span data-mono style={{ ...mono(10), position: 'absolute', left: 0, top: 7 }}>{['V1', 'V2', 'A1', 'TX'][k]}</span>
        {clips.map((c, j) => {
          const grow = interpolate(reveal * width, [c.x, c.x + c.w], [0, 1], clamp)
          if (grow <= 0) return null
          return <i key={j} style={{ position: 'absolute', left: 60 + c.x, top: 0, width: c.w * grow, height: 28, borderRadius: 5, background: `${color}${j % 3 === 1 ? '99' : 'cc'}`, boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .15)' }} />
        })}
      </div>
    })}
    <i style={{ position: 'absolute', left: left + local * width, top: 46, width: 2, height: 172, background: ORANGE, boxShadow: `0 0 10px ${ORANGE}` }} />
    <div data-mono style={{ ...mono(12), position: 'absolute', left: 0, right: 0, bottom: 14, display: 'flex', justifyContent: 'center', gap: 14 }}>
      {steps.map((s, i) => <span key={s} style={{ display: 'flex', gap: 14, color: i === Math.min(4, Math.floor(local * 5)) ? ORANGE : 'rgb(200 210 240 / .45)' }}>{s}{i < steps.length - 1 && <span style={{ color: 'rgb(200 210 240 / .3)' }}>→</span>}</span>)}
    </div>
  </div>
}

// The app's global styles force the UI font on everything; monospace labels opt back in with data-mono.
const CSS = `.claude-reactor [data-mono], .claude-reactor [data-mono] * { font-family: ${MONO} !important; }`

export function ClaudeEditingReactor() {
  const f = useCurrentFrame()
  const n = countAt(f)
  const finished = f >= COUNT_END
  const fadeIn = interpolate(f, [0, 14], [0, 1], clamp)
  const pulse = 1 + Math.sin(f / 8) * 0.06 + interpolate(f - COUNT_END, [0, 6, 30], [0, 0.5, 0], clamp)
  return <AbsoluteFill className="claude-reactor" style={{ background: `radial-gradient(circle at 50% 44%, #101a3a, ${BG} 62%)`, overflow: 'hidden' }}>
    <style>{CSS}</style>
    <div style={{ position: 'absolute', inset: 0, opacity: fadeIn }}>
      {/* Faint grid. */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgb(120 150 255 / .05) 1px, transparent 1px), linear-gradient(90deg, rgb(120 150 255 / .05) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Header. */}
      <Waveform f={f} x={560} flip />
      <Waveform f={f} x={1160} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 44, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <Burst size={44} f={f} />
        <span style={{ color: '#f1f4ff', fontSize: 38, fontWeight: 600, letterSpacing: -0.6 }}>Claude editing agent</span>
      </div>
      <div data-mono style={{ ...mono(13), position: 'absolute', left: 0, right: 0, top: 104, textAlign: 'center', letterSpacing: 4 }}>Motor criativo / 100 reels em paralelo</div>

      <WorkPanel f={f} n={n} />
      <FocusPanel f={f} />

      {/* Reactor. */}
      <Sphere f={f} />
      {cards.map((c, i) => <Card key={c.seed} c={c} f={f} i={i} />)}
      <Links f={f} />
      <div style={{ position: 'absolute', left: CX - 45, top: CY - 45, zIndex: 6, transform: `scale(${pulse})` }}><Burst size={90} f={f} glow={2} /></div>
      <div data-mono style={{ ...mono(20, finished ? GREEN : 'rgb(225 232 255 / .85)', { letterSpacing: 4 }), position: 'absolute', left: CX - 110, width: 220, top: CY + 150, padding: '6px 0', borderRadius: 8, background: 'rgb(6 10 22 / .7)', textAlign: 'center', zIndex: 20 }}>
        {pad(n)} / 100{finished && ' ✓'}
      </div>

      <Timeline f={f} n={n} />
    </div>
  </AbsoluteFill>
}

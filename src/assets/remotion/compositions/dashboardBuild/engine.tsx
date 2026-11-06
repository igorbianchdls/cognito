import type { ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

// The engine behind the "Criando um Dashboard" videos: five AI agents (layout, metrics, charts, table, review) build a
// dashboard live. Each agent is a colored cursor with its name; each piece of the screen is a layer that goes
// outline (with its size) → gray skeleton → real content. The reviewer closes by checking every block. A video only
// supplies its layers and which agent builds what.

/** The build (until the last check mark fades and the cursors leave) takes 8 s; the finished dashboard then holds for 3 s. */
const FPS = 30
const BUILD_FRAMES = 8 * FPS
const HOLD_FRAMES = 3 * FPS
export const DASHBOARD_BUILD_DURATION = BUILD_FRAMES + HOLD_FRAMES

export type Role = 'layout' | 'metricas' | 'graficos' | 'tabela' | 'revisor'
export type Box = { x: number; y: number; w: number; h: number }
export type Layer = Box & { id: string; kind: 'panel' | 'text' | 'block'; radius?: number; render: (p: number) => ReactNode }

const baseAgents: { role: Role; name: string; color: string; first: number; step: number }[] = [
  { role: 'layout', name: 'Agente de Layout', color: '#3b82f6', first: 24, step: 9 },
  { role: 'metricas', name: 'Agente de Métricas', color: '#22c55e', first: 70, step: 13 },
  { role: 'graficos', name: 'Agente de Gráficos', color: '#8b5cf6', first: 100, step: 15 },
  { role: 'tabela', name: 'Agente de Tabela', color: '#f59e0b', first: 120, step: 20 },
  { role: 'revisor', name: 'Agente Revisor', color: '#ec4899', first: 336, step: 12 },
]
const OUTLINE = '#3b82f6'
const CHECK = '#16a34a'

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = Easing.bezier(0.22, 1, 0.36, 1)
const prog = (f: number, start: number, len: number) => interpolate(f, [start, start + len], [0, 1], { ...clamp, easing: ease })

export type BuildConfig = {
  layers: Layer[]
  /** The cards, in the order the layout agent lays them down (right after the first layer) and the reviewer checks them. */
  panels: string[]
  roleOf: (id: string) => Role
  /** Extra areas the reviewer checks before the cards (e.g. header and sidebar). */
  reviewFirst: Box[]
  /** Layers the layout agent builds after the cards, in this order; the rest follow in their own order. */
  layoutAfterPanels?: string[]
  timing?: Partial<Record<Role, { first?: number; step?: number }>>
  /** Where finished agents rest, one below the other. */
  park: { x: number; y: number; gap: number }
  background: string
}

export function createDashboardBuild(cfg: BuildConfig) {
  const agents = baseAgents.map(ag => ({ ...ag, ...cfg.timing?.[ag.role] }))
  const { layers } = cfg
  // The layout agent lays down the frame and the empty cards first, so the others can start filling them early.
  const layoutOrder = [layers[0].id, ...cfg.panels, ...(cfg.layoutAfterPanels ?? [])]
  const orderKey = (id: string) => { const i = layoutOrder.indexOf(id); return i < 0 ? layoutOrder.length : i }

  type Stop = Box & { start: number }
  const plan: (Layer & { start: number; agent: number })[] = []
  agents.forEach((ag, a) => {
    if (ag.role === 'revisor') return
    const mine = layers.filter(l => cfg.roleOf(l.id) === ag.role)
    if (ag.role === 'layout') mine.sort((p, q) => orderKey(p.id) - orderKey(q.id))
    mine.forEach((l, i) => plan.push({ ...l, start: ag.first + i * ag.step, agent: a }))
  })

  const REVIEWER = agents.findIndex(ag => ag.role === 'revisor')
  const reviewTargets: Box[] = [...cfg.reviewFirst, ...cfg.panels.map(id => layers.find(l => l.id === id)!)]
  const reviews: Stop[] = reviewTargets.map((b, i) => ({ x: b.x, y: b.y, w: b.w, h: b.h, start: agents[REVIEWER].first + i * agents[REVIEWER].step }))
  const DONE = reviews[reviews.length - 1].start + 26
  // Timings above are written at 1×; play them fast enough that the build is over (marks faded) at BUILD_FRAMES.
  const SPEED = (DONE + 28) / BUILD_FRAMES

  // Where each cursor goes: to a layer's top-left and then drags it to size; the reviewer goes to each card's corner.
  const routes = agents.map((_, a) => a === REVIEWER
    ? reviews.map(r => ({ ax: r.x + r.w - 30, ay: r.y + 22, bx: r.x + r.w - 30, by: r.y + 22, start: r.start }))
    : plan.filter(l => l.agent === a).map(l => ({ ax: l.x, ay: l.y, bx: l.x + l.w, by: l.y + l.h, start: l.start })))
  const busy = routes.map(r => ({ from: r[0].start - 14, to: r[r.length - 1].start + 34 }))

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
    // Once its work is done, the cursor rests out of the way.
    const park = { x: cfg.park.x, y: cfg.park.y + a * cfg.park.gap }
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

  return function DashboardBuild() {
    const f = useCurrentFrame() * SPEED
    const fadeIn = prog(f, 0, 18)
    return <AbsoluteFill style={{ background: cfg.background, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: fadeIn }}>
        {plan.map(l => <LayerView key={l.id} l={l} f={f} />)}
        {reviews.map((r, i) => <ReviewMark key={i} r={r} f={f} />)}
        {agents.map((ag, a) => <Cursor key={ag.role} a={a} f={f} />)}
      </div>
    </AbsoluteFill>
  }
}

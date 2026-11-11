import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, random, staticFile, useCurrentFrame } from 'remotion'
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'

// "A IA assistiu 800 reels": a dark research workstation where an AI watches short videos one after another. The
// phone on the left plays the reel being watched (swiping up to the next), the vision panel shows the model and
// the counter, a strip of extracted frames gets checked, the terminal logs every step, the JSON of the current
// reel is written and the study's totals (hooks, formats, retention) grow. The reels are the presenter recordings
// already in the project; everything else is made up. 1920×1080, 30 fps, 20 s.

export const AI_WATCH_DURATION = 600
const MONO = loadMono('normal', { subsets: ['latin'], weights: ['400', '700'] }).fontFamily
const UI = loadInter('normal', { subsets: ['latin'], weights: ['400', '500', '600', '700', '800'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const out = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })

const BG = '#06080c', PANEL = '#0c1017', LINE = '#1b2230', TXT = '#c8d0de', DIM = '#667085', GREEN = '#4ade80', LIME = '#b6f33a', AMBER = '#fbbf24', CYAN = '#5eead4', BLUE = '#7aa2ff', PINK = '#f472b6'
const M = (size: number, color = TXT, extra?: CSSProperties): CSSProperties => ({ fontFamily: MONO, fontSize: size, color, whiteSpace: 'nowrap', ...extra })

// ---------- the reels (our own recordings) ----------
const REELS = [
  { src: 'financas-chatgpt', start: 2, id: 'C8xQm2LrT4a', hook: 'Agora o ChatGPT opera seu financeiro', format: 'talking head', theme: 'IA no financeiro', cta: 'comenta OTTO', ret: 0.71 },
  { src: 'nfe-contadores', start: 8, id: 'DdW7k1PnZ0e', hook: 'Contadores estão preocupados com isso', format: 'talking head', theme: 'contabilidade', cta: 'segue para parte 2', ret: 0.78 },
  { src: 'financas-contadores', start: 14, id: 'B3vRt9YyQ2s', hook: 'Essa IA faz o trabalho de 3 pessoas', format: 'talking head + tela', theme: 'automação', cta: 'link na bio', ret: 0.66 },
  { src: 'nfe-chat-ia', start: 20, id: 'Ex5Lq8HcW1m', hook: 'Emitir nota pelo chat? Sim.', format: 'tutorial', theme: 'nota fiscal', cta: 'comenta NOTA', ret: 0.74 },
  { src: 'financas-chatgpt', start: 30, id: 'Fk2Nd6ZaR9u', hook: '3 tarefas que você não precisa mais fazer', format: 'lista', theme: 'produtividade', cta: 'salva o post', ret: 0.69 },
  { src: 'nfe-contadores', start: 34, id: 'Gm9Ts4VbE7c', hook: 'O erro que trava seu caixa todo mês', format: 'talking head', theme: 'fluxo de caixa', cta: 'comenta CAIXA', ret: 0.81 },
  { src: 'financas-contadores', start: 36, id: 'Hy1Pw7JkL3d', hook: 'Pare de conciliar extrato na mão', format: 'antes e depois', theme: 'conciliação', cta: 'link na bio', ret: 0.72 },
  { src: 'nfe-chat-ia', start: 44, id: 'Jq6Rv2XmN8b', hook: 'Seu ERP agora conversa com você', format: 'demo', theme: 'ERP com IA', cta: 'comenta ERP', ret: 0.76 },
]
const PER = 75 // a reel every 2,5 s
const reelAt = (f: number) => Math.min(REELS.length - 1, Math.floor(f / PER))
/** How many reels the study has gone through at frame f (it accelerates in the background). */
const analyzedAt = (f: number) => Math.round(interpolate(f, [0, 560], [11, 800], { ...clamp, easing: Easing.in(Easing.quad) }))

// ---------- pieces ----------
function Panel({ x, y, w, h, title, right, children }: { x: number; y: number; w: number; h: number; title: ReactNode; right?: ReactNode; children?: ReactNode }) {
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 14px', borderBottom: `1px solid ${LINE}` }}>
      <span style={{ display: 'flex', gap: 6 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <i key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}</span>
      <span style={M(14, TXT, { fontWeight: 700 })}>{title}</span>
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 36, bottom: 0 }}>{children}</div>
  </div>
}

const SVG = ({ d, size = 26, fill = 'none', w = 2 }: { d: string; size?: number; fill?: string; w?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / .45))' }}><path d={d} fill={fill} stroke="#fff" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></svg>
const IC = {
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  bubble: 'M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z',
  repost: 'M17 3l3 3-3 3M20 6H8a4 4 0 0 0-4 4v1M7 21l-3-3 3-3M4 18h12a4 4 0 0 0 4-4v-1',
  send: 'M21 3L10 14M21 3l-7 18-4-7-7-4z',
  more: 'M12 6v.01M12 12v.01M12 18v.01',
  camera: 'M4 8h3l2-2h6l2 2h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  home: 'M4 11l8-7 8 7v9H4z',
  reels: 'M4 4h16v16H4zM4 9h16M9 4l3 5M14 4l3 5M10 12v5l4-2.5z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  music: 'M9 18V6l10-2v12M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  chev: 'M8 10l4 4 4-4',
}

/** A realistic iPhone: titanium frame, black bezel, Dynamic Island, status bar, side buttons, home indicator. */
function IPhone({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const frame = 12, bezel = 8, R = w * 0.17
  const btn = (side: 'l' | 'r', top: number, len: number) => <i style={{ position: 'absolute', [side === 'l' ? 'left' : 'right']: -4, top, width: 5, height: len, borderRadius: side === 'l' ? '3px 0 0 3px' : '0 3px 3px 0', background: 'linear-gradient(90deg, #4a4c52, #8b8e95, #4a4c52)' }} />
  return <div style={{ position: 'relative', width: w + 2 * (frame + bezel), height: h + 2 * (frame + bezel) }}>
    {btn('l', 118, 34)}{btn('l', 172, 56)}{btn('l', 240, 56)}{btn('r', 190, 86)}
    <div style={{ position: 'absolute', inset: 0, borderRadius: R + frame + bezel, background: 'linear-gradient(135deg, #9a9ca2 0%, #5c5f66 18%, #3b3d42 50%, #6e7178 82%, #b4b6bb 100%)', boxShadow: '0 30px 60px rgb(0 0 0 / .6), inset 0 0 0 1px rgb(255 255 255 / .25)' }} />
    <div style={{ position: 'absolute', inset: frame - 2, borderRadius: R + bezel + 2, background: '#050505', boxShadow: 'inset 0 0 0 1px #222' }} />
    <div style={{ position: 'absolute', left: frame + bezel, top: frame + bezel, width: w, height: h, borderRadius: R, overflow: 'hidden', background: '#000' }}>
      {children}
      {/* status bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 46, display: 'flex', alignItems: 'center', padding: '6px 26px 0 34px', zIndex: 5 }}>
        <span style={{ fontFamily: UI, fontSize: 15, fontWeight: 600, color: '#fff' }}>9:41</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={18} height={12} viewBox="0 0 18 12">{[0, 1, 2, 3].map(i => <rect key={i} x={i * 4.6} y={9 - i * 3} width={3.2} height={3 + i * 3} rx={1} fill="#fff" />)}</svg>
          <svg width={16} height={12} viewBox="0 0 16 12"><path d="M8 11.5l2.2-2.6a3 3 0 0 0-4.4 0zM3.6 6.6a6.5 6.5 0 0 1 8.8 0M1.2 4a10 10 0 0 1 13.6 0" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" /></svg>
          <span style={{ display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ width: 24, height: 12, borderRadius: 4, border: '1.2px solid rgb(255 255 255 / .5)', padding: 1.5 }}><i style={{ display: 'block', width: '78%', height: '100%', borderRadius: 2, background: '#fff' }} /></span><i style={{ width: 2, height: 4, borderRadius: 1, background: 'rgb(255 255 255 / .5)' }} /></span>
        </span>
      </div>
      {/* Dynamic Island */}
      <div style={{ position: 'absolute', left: (w - 104) / 2, top: 11, width: 104, height: 30, borderRadius: 16, background: '#000', zIndex: 6 }}><i style={{ position: 'absolute', right: 12, top: 10, width: 10, height: 10, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #2b3550, #05070c)' }} /></div>
      {/* home indicator */}
      <i style={{ position: 'absolute', left: (w - 120) / 2, bottom: 7, width: 120, height: 5, borderRadius: 3, background: '#fff', zIndex: 6 }} />
    </div>
  </div>
}

function Phone({ f }: { f: number }) {
  const k = reelAt(f), local = f - k * PER
  const swipe = k > 0 ? ease(local, 0, 12) : 1
  const W = 300, H = 650
  const counts = ['48,2 mil', '1.204', '3.118', '9.870']
  const screen = (i: number, y: number) => {
    const r = REELS[i]
    return <div key={i} style={{ position: 'absolute', left: 0, top: y, width: W, height: H, overflow: 'hidden', background: '#000' }}>
      <OffthreadVideo muted src={staticFile(`remotion/otto-reels/${r.src}.mp4`)} startFrom={Math.round(r.start * 30) + (i === k ? 0 : PER)} style={{ width: W, height: H - 64, objectFit: 'cover' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 130, background: 'linear-gradient(180deg, rgb(0 0 0 / .55), transparent)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, height: 200, background: 'linear-gradient(0deg, rgb(0 0 0 / .6), transparent)' }} />
      <div style={{ position: 'absolute', left: 16, right: 16, top: 52, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: UI, fontSize: 21, fontWeight: 700, color: '#fff' }}>Reels</span><SVG d={IC.chev} size={18} />
        <span style={{ marginLeft: 'auto' }}><SVG d={IC.camera} size={24} w={1.8} /></span>
      </div>
      <div style={{ position: 'absolute', right: 10, bottom: 92, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        {[IC.heart, IC.bubble, IC.repost, IC.send].map((d, j) => <div key={j} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}><SVG d={d} size={27} w={1.9} /><span style={{ fontFamily: UI, fontSize: 11.5, fontWeight: 600, color: '#fff', textShadow: '0 1px 2px rgb(0 0 0 / .6)' }}>{counts[j]}</span></div>)}
        <SVG d={IC.more} size={24} w={3} />
        <i style={{ width: 26, height: 26, borderRadius: 6, border: '2px solid #fff', background: 'linear-gradient(135deg, #fbbf24, #f472b6)' }} />
      </div>
      <div style={{ position: 'absolute', left: 14, right: 60, bottom: 84 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #fff', background: 'linear-gradient(135deg, #fbbf24, #f472b6)' }} />
          <span style={{ fontFamily: UI, fontSize: 13.5, fontWeight: 700, color: '#fff' }}>criador_{i + 1}</span>
          <span style={{ fontFamily: UI, fontSize: 12, fontWeight: 600, color: '#fff', padding: '3px 10px', borderRadius: 8, border: '1px solid rgb(255 255 255 / .75)' }}>Seguir</span>
        </div>
        <div style={{ fontFamily: UI, fontSize: 12.5, color: '#fff', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hook} ... mais</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><SVG d={IC.music} size={13} w={2} /><span style={{ fontFamily: UI, fontSize: 11.5, color: '#fff' }}>criador_{i + 1} · Áudio original</span></div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, background: '#000', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 10 }}>
        {[IC.home, IC.reels, IC.send, IC.search].map((d, j) => <SVG key={j} d={d} size={25} w={j === 1 ? 2.4 : 1.8} />)}
        <i style={{ width: 25, height: 25, borderRadius: '50%', border: '1.5px solid #fff', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }} />
      </div>
      {i === k && <div style={{ position: 'absolute', left: 0, right: 0, top: ((local * 9) % (H + 40)) - 20, height: 3, background: LIME, boxShadow: `0 0 18px ${LIME}`, opacity: 0.5 }} />}
    </div>
  }
  return <Panel x={24} y={70} w={380} h={760} title="dispositivo · iPhone · Reels" right={<span style={M(13, DIM)}>conta de pesquisa</span>}>
    <div style={{ padding: '10px 16px', ...M(14, DIM) }}>agora <b style={{ color: AMBER }}>{REELS[k].id}</b> · Inspiração</div>
    <div style={{ position: 'absolute', left: (380 - (W + 40)) / 2, top: 42, transform: 'scale(0.96)', transformOrigin: '50% 0' }}>
      <IPhone w={W} h={H}>
        {k > 0 && screen(k - 1, -H * swipe)}
        {screen(k, H * (1 - swipe))}
      </IPhone>
    </div>
  </Panel>
}

function Vision({ f }: { f: number }) {
  const n = analyzedAt(f), gpu = 92 + Math.round(5 * Math.abs(Math.sin(f / 9)))
  return <Panel x={424} y={70} w={1472} h={120} title={<><span style={{ ...M(12, '#06080c', { fontWeight: 700 }), background: GREEN, padding: '2px 8px', borderRadius: 4, marginRight: 10 }}>● RODANDO</span>visão · modelo multimodal local</>} right={<span style={M(13, DIM)}>estudo: ganchos que viralizam · nicho finanças</span>}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 40, padding: '16px 18px' }}>
      <span style={M(15, TXT)}>local · GPU 64 GB · <b style={{ color: CYAN }}>7 frames/reel</b></span>
      <span style={M(15, TXT)}>GPU ocupada <b style={{ color: gpu > 95 ? AMBER : GREEN }}>{gpu}%</b></span>
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={M(15, DIM)}>analisados</span>
        <span style={{ width: 360, height: 10, borderRadius: 5, background: '#151b26' }}><i style={{ display: 'block', height: '100%', width: `${(n / 800) * 100}%`, borderRadius: 5, background: `linear-gradient(90deg, ${GREEN}, ${LIME})` }} /></span>
        <b style={M(28, '#fff', { fontWeight: 700 })}>{n}<span style={{ color: DIM, fontSize: 18 }}> / 800</span></b>
      </span>
    </div>
  </Panel>
}

function Frames({ f }: { f: number }) {
  const k = reelAt(f), local = f - k * PER
  return <Panel x={424} y={206} w={920} h={300} title={<>frames <span style={{ color: AMBER }}>{REELS[k].id}</span> · 21,{2 + k}s · 720×1280 · {3 + (k % 3)} cortes/10s</>}>
    <div style={{ display: 'flex', gap: 14, padding: '18px 18px' }}>
      {Array.from({ length: 7 }, (_, j) => {
        const at = 6 + j * 8, p = out(local, at, at + 6), ok = local >= at + 8
        return <div key={j} style={{ width: 110, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
          <div style={{ position: 'relative', width: 108, height: 192, borderRadius: 6, overflow: 'hidden', border: `2px solid ${ok ? GREEN : local >= at ? AMBER : LINE}` }}>
            <Img src={staticFile(`remotion/ai-watch/r${k}f${j}.jpg`)} style={{ width: 108, height: 192, objectFit: 'cover' }} />
            {ok && <span style={{ position: 'absolute', right: 4, top: 4, ...M(11, '#06080c', { fontWeight: 700 }), background: GREEN, padding: '1px 5px', borderRadius: 3 }}>ok</span>}
            {!ok && local >= at && <span style={{ position: 'absolute', left: 0, right: 0, top: ((local - at) * 24) % 192, height: 2, background: AMBER }} />}
          </div>
          <div style={{ ...M(13, DIM), marginTop: 6, textAlign: 'center' }}>{(j * 0.9).toFixed(1).replace('.', ',')}s</div>
        </div>
      })}
    </div>
  </Panel>
}

function Terminal({ f }: { f: number }) {
  const lines: [string, string][] = []
  for (let k = 0; k <= reelAt(f); k++) {
    const base = k * PER, r = REELS[k], i = analyzedAt(base) + 1
    const add = (t: number, color: string, text: string) => { if (f >= base + t) lines.push([color, text]) }
    const ts = (t: number) => { const s = 13 * 3600 + 54 * 60 + Math.floor((base + t) / 30) * 2; return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }
    add(2, BLUE, `${ts(2)} [cdn] baixando ${r.id}.mp4 · 720x1280 · 24fps`)
    add(6, CYAN, `${ts(6)} [ffmpeg] detecção de cena: ${3 + (k % 4)} cortes · extraindo 7 frames`)
    for (let j = 0; j < 7; j++) add(10 + j * 8, TXT, `${ts(10 + j * 8)} [visão] frame ${j + 1}/7  t=${(j * 0.9).toFixed(1)}s  ok`)
    add(66, AMBER, `${ts(66)} [texto] transcrição · ${120 + k * 17} palavras · gancho detectado`)
    add(70, GREEN, `[${i}/800] ${r.id} analisado em ${(2.4 + random('t' + k) * 1.6).toFixed(1)}s → estudo/${r.id}.json`)
  }
  const shown = lines.slice(-15)
  return <Panel x={424} y={522} w={920} h={540} title="zsh · ~/ferramentas/pesquisa-de-reels" right={<span style={M(13, DIM)}>{Math.round(18 + 6 * Math.abs(Math.sin(f / 13)))} tok/s</span>}>
    <div style={{ position: 'absolute', inset: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6 }}>
      {shown.map(([c, t], i) => <div key={i + t} style={M(16, i === shown.length - 1 ? '#fff' : c)}>{t}</div>)}
      <div style={M(16, GREEN)}>{f % 20 < 10 ? '▍' : ' '}</div>
    </div>
  </Panel>
}

function JsonPanel({ f }: { f: number }) {
  const k = reelAt(f), local = f - k * PER, r = REELS[k]
  const fields: [string, string, string][] = [['id', `"${r.id}"`, AMBER], ['gancho', `"${r.hook}"`, LIME], ['formato', `"${r.format}"`, CYAN], ['tema', `"${r.theme}"`, CYAN], ['legenda_na_tela', 'true', PINK], ['cortes_por_10s', String(3 + (k % 3)), PINK], ['retencao_estimada', r.ret.toFixed(2), PINK], ['cta', `"${r.cta}"`, LIME]]
  return <Panel x={1360} y={206} w={536} h={540} title={<>estudo/<span style={{ color: AMBER }}>{r.id}</span>.json</>}>
    <div style={{ padding: '16px 18px', ...M(16, TXT), lineHeight: 1.75 }}>
      <div>{'{'}</div>
      {fields.map(([key, val, color], i) => {
        const at = 26 + i * 5, shown = local >= at
        const v = shown ? val.slice(0, Math.max(1, Math.floor((local - at) * 3))) : ''
        return <div key={key} style={{ paddingLeft: 22, opacity: shown ? 1 : 0.15, whiteSpace: 'normal' }}><span style={{ color: BLUE }}>{`"${key}"`}</span>: <span style={{ color }}>{v}</span>{i < fields.length - 1 && shown ? ',' : ''}</div>
      })}
      <div>{'}'}</div>
    </div>
  </Panel>
}

function Study({ f }: { f: number }) {
  const n = analyzedAt(f), g = n / 800
  const hooks: [string, number, string][] = [['Pergunta direta', 0.31, LIME], ['Promessa de resultado', 0.24, CYAN], ['Erro comum', 0.19, AMBER], ['Antes e depois', 0.14, PINK], ['Lista de dicas', 0.12, BLUE]]
  return <Panel x={1360} y={762} w={536} h={300} title="resumo do estudo" right={<span style={M(13, DIM)}>{n} reels</span>}>
    <div style={{ padding: '14px 18px' }}>
      <div style={M(14, DIM)}>ganchos que mais retêm</div>
      {hooks.map(([l, v, c]) => <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <span style={{ ...M(14, TXT), width: 210 }}>{l}</span>
        <span style={{ flex: 1, height: 10, borderRadius: 5, background: '#151b26' }}><i style={{ display: 'block', height: '100%', width: `${v * 100 * 2.6 * Math.min(1, 0.2 + g)}%`, borderRadius: 5, background: c }} /></span>
        <span style={{ ...M(14, '#fff'), width: 46, textAlign: 'right' }}>{Math.round(v * 100 * Math.min(1, 0.2 + g) / Math.min(1, 0.2 + g))}%</span>
      </div>)}
      <div style={{ ...M(14, DIM), marginTop: 14 }}>retenção média <b style={{ color: GREEN }}>{(0.64 + 0.09 * g).toFixed(2)}</b> · duração ideal <b style={{ color: '#fff' }}>21–34s</b></div>
    </div>
  </Panel>
}

export function AiWatchingReels() {
  const f = useCurrentFrame()
  return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #0d1320, ${BG} 70%)`, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, opacity: out(f, 0, 10) }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 48, display: 'flex', alignItems: 'center', gap: 18, padding: '0 24px', borderBottom: `1px solid ${LINE}`, background: '#080b11' }}>
        <span style={{ display: 'flex', gap: 7 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <i key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}</span>
        <span style={{ ...M(15, TXT, { fontWeight: 700 }) }}>pesquisa-de-reels</span>
        <span style={M(14, DIM)}>a IA assiste os reels por você · 1 a cada {((2.4 + 1.6 * 0.5)).toFixed(1).replace('.', ',')}s</span>
        <span style={{ marginLeft: 'auto', ...M(14, LIME, { fontWeight: 700 }), padding: '4px 12px', borderRadius: 999, border: `1px solid ${LIME}66`, background: `${LIME}14` }}>● assistindo</span>
      </div>
      <Phone f={f} />
      <Vision f={f} />
      <Frames f={f} />
      <Terminal f={f} />
      <JsonPanel f={f} />
      <Study f={f} />
      <div style={{ position: 'absolute', left: 24, top: 846, width: 380, height: 216, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={M(14, DIM)}>fila</div>
        {Array.from({ length: 5 }, (_, i) => { const id = `${String.fromCharCode(65 + ((reelAt(f) + i + 3) % 26))}${Math.floor(random('q' + (reelAt(f) + i)) * 1e9).toString(36).slice(0, 9)}`; return <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, ...M(15, i === 0 ? '#fff' : TXT) }}><span>{i === 0 ? '▶ ' : '  '}{id}</span><span style={{ color: i === 0 ? AMBER : DIM }}>{i === 0 ? 'próximo' : 'na fila'}</span></div> })}
      </div>
    </div>
  </AbsoluteFill>
}

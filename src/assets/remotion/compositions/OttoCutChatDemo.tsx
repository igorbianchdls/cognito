import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat'
import { IconBrandOpenai } from '@tabler/icons-react'

// OttoCut landing page hero: a ChatGPT-style chat where the person attaches a raw recording, asks for a Reel in plain
// Portuguese and the OttoCut app edits it right there: cuts, word-by-word captions, punch-in zooms, color and music,
// then offers the 9:16 and 4:5 downloads. Loops cleanly (starts and ends on the empty chat). 1440×960, 30 fps.

export const OTTOCUT_CHAT_DURATION = 480
export const OTTOCUT_CHAT_WIDTH = 1440
export const OTTOCUT_CHAT_HEIGHT = 960

const opts = { subsets: ['latin'] as ['latin'] }
const UI = loadInter('normal', { ...opts, weights: ['400', '500', '600', '700'] }).fontFamily
const CAPTION = loadMontserrat('normal', { ...opts, weights: ['800', '900'] }).fontFamily
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
const pop = (f: number, a: number) => interpolate(f, [a, a + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) })

const SIDEBAR = '#171717', MAIN = '#212121', BUBBLE = '#303030', TXT = '#ececec', DIM = '#9b9b9b', LINE = '#2f2f2f'
const VIOLET = '#7c4dff', PINK = '#ff4fa3', YELLOW = '#ffd60a', GREEN = '#3ddc84'

const VIDEO = 'remotion/otto-reels/financas-chatgpt.mp4'
const PROMPT = 'Edita esse vídeo pra Reels: corta as pausas, legenda amarela palavra por palavra, zoom nos destaques e música de fundo.'

// ---------- timing ----------
const TYPE_FROM = 34, TYPE_TO = 112, SEND = 122, REPLY = 140, CARD = 158
const STEPS = [
  { label: 'Cortes', done: 'removi 14 pausas e 3 erros · 1:12 → 0:38', at: 196 },
  { label: 'Legendas', done: 'palavra por palavra, em amarelo', at: 232 },
  { label: 'Zoom nos destaques', done: '6 pontos de ênfase', at: 266 },
  { label: 'Cor e luz', done: 'pele corrigida, contraste +12%', at: 296 },
  { label: 'Música e áudio', done: 'trilha leve, voz em primeiro plano', at: 326 },
  { label: 'Exportando', done: '9:16 para Reels · 4:5 para o Feed', at: 360 },
]
const READY = 372, FADE_OUT = OTTOCUT_CHAT_DURATION - 14

// Captions the edited Reel shows (word by word).
const CAPTIONS = [
  { from: 0, words: ['Você', 'ainda', 'edita'] },
  { from: 36, words: ['seus', 'vídeos', 'na', 'mão?'] },
  { from: 78, words: ['Deixa', 'o', 'ChatGPT'] },
  { from: 114, words: ['fazer', 'isso', 'por', 'você.'] },
]

function Sidebar() {
  const item = (icon: ReactNode, label: string) => <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40, padding: '0 12px', borderRadius: 10, color: TXT, fontSize: 16 }}>{icon}{label}</div>
  const circle = <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={TXT} strokeWidth={2}><circle cx={11} cy={11} r={7} /><path d="M20 20l-4-4" /></svg>
  return <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 300, background: SIDEBAR, padding: '22px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 12px 22px' }}>
      <IconBrandOpenai size={34} color={TXT} stroke={1.6} />
      <span style={{ fontSize: 24, fontWeight: 600, color: TXT }}>ChatGPT</span>
    </div>
    {item(<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={TXT} strokeWidth={2}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>, 'Novo chat')}
    {item(circle, 'Buscar chats')}
    {item(<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={TXT} strokeWidth={2}><rect x={3} y={3} width={18} height={18} rx={3} /><circle cx={9} cy={9} r={2} /><path d="M21 15l-5-5L5 21" /></svg>, 'Imagens')}
    <div style={{ margin: '18px 12px 8px', fontSize: 13, color: DIM }}>Apps</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40, padding: '0 12px', borderRadius: 10, background: '#262626', color: TXT, fontSize: 16 }}><Logo size={22} />OttoCut</div>
    <div style={{ margin: '22px 12px 10px', fontSize: 13, color: DIM }}>Chats</div>
    {[150, 190, 130, 170, 110].map((w, i) => <i key={i} style={{ display: 'block', height: 12, width: w, margin: '10px 12px', borderRadius: 6, background: '#2a2a2a' }} />)}
  </div>
}

export function Logo({ size }: { size: number }) {
  return <span style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg, ${VIOLET}, ${PINK})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><circle cx={6} cy={7} r={3} /><circle cx={6} cy={17} r={3} /><path d="M8.6 8.6L20 18M8.6 15.4L20 6" /></svg>
  </span>
}

function Thumb({ w, h, label }: { w: number; h: number; label?: boolean }) {
  return <div style={{ position: 'relative', width: w, height: h, borderRadius: 10, overflow: 'hidden', background: '#000', flexShrink: 0 }}>
    <Img src={staticFile('ottocut/bruto-thumb.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(.35) brightness(.85)' }} />
    {label && <span style={{ position: 'absolute', left: 6, bottom: 5, fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px #000' }}>▶ 1:12</span>}
  </div>
}

function Composer({ f }: { f: number }) {
  const typed = Math.round(interpolate(f, [TYPE_FROM, TYPE_TO], [0, PROMPT.length], clamp))
  const attached = pop(f, 18)
  const sent = f >= SEND
  return <div style={{ position: 'absolute', left: 340, right: 40, bottom: 34, minHeight: 64, borderRadius: 28, background: BUBBLE, padding: '12px 18px 12px 18px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 0 0 1px #3a3a3a' }}>
    {!sent && attached > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 12, transform: `scale(${0.8 + attached * 0.2})`, transformOrigin: 'left center', opacity: attached }}>
      <Thumb w={54} h={54} />
      <span style={{ display: 'flex', flexDirection: 'column' }}><b style={{ fontSize: 14, color: TXT }}>gravacao_bruta.mp4</b><span style={{ fontSize: 13, color: DIM }}>Vídeo · 1:12</span></span>
    </div>}
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: 26, color: TXT, lineHeight: 1 }}>+</span>
      <span style={{ flex: 1, fontSize: 17, color: !sent && typed ? TXT : DIM, lineHeight: 1.4 }}>{!sent && typed ? <>{PROMPT.slice(0, typed)}<span style={{ opacity: f % 16 < 8 ? 1 : 0 }}>|</span></> : 'Pergunte alguma coisa'}</span>
      <span style={{ width: 38, height: 38, borderRadius: '50%', background: !sent && typed ? '#fff' : '#4a4a4a', display: 'grid', placeItems: 'center' }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={!sent && typed ? '#000' : '#2a2a2a'} strokeWidth={2.6} strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </span>
    </div>
  </div>
}

function Phone({ f }: { f: number }) {
  const W = 300, H = 533
  const t = f - CARD
  const cut = f >= STEPS[0].at, caps = f >= STEPS[1].at, zoom = f >= STEPS[2].at, color = f >= STEPS[3].at, music = f >= STEPS[4].at
  const s = H / 583, vw = 720 * s
  // Punch-in zooms once the zoom step is done.
  const z = zoom ? 1 + 0.12 * Math.max(0, Math.sin(((f - STEPS[2].at) / 46) * Math.PI)) : 1
  const ct = Math.max(0, f - STEPS[1].at)
  const line = [...CAPTIONS].reverse().find(c => ct % 150 >= c.from) ?? CAPTIONS[0]
  const wordIdx = Math.min(line.words.length - 1, Math.floor((ct % 150 - line.from) / 8))
  const filter = color ? 'saturate(1.18) contrast(1.08) brightness(1.04)' : cut ? 'saturate(.8) brightness(.95)' : 'grayscale(.55) brightness(.85)'
  return <div style={{ position: 'relative', width: W + 16, height: H + 16, borderRadius: 34, background: '#0b0b0b', padding: 8, boxShadow: '0 30px 60px rgb(0 0 0 / .5), 0 0 0 1px #333' }}>
    <div style={{ position: 'relative', width: W, height: H, borderRadius: 27, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '50% 40%' }}>
        <OffthreadVideo muted src={staticFile(VIDEO)} startFrom={Math.round(cut ? 40 + t * 1.15 : 40 + t)} style={{ position: 'absolute', width: vw, height: 1280 * s, left: (W - vw) / 2, top: -407 * s, filter, maxWidth: 'none' }} />
      </div>
      {!cut && t > 0 && <span style={{ position: 'absolute', left: 12, top: 12, padding: '4px 9px', borderRadius: 6, background: 'rgb(0 0 0 / .55)', color: '#fff', fontSize: 12, fontWeight: 700 }}>BRUTO</span>}
      {cut && !caps && <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: '#fff', opacity: interpolate((f - STEPS[0].at) % 30, [0, 4], [1, 0], clamp) }} />}
      {caps && <div style={{ position: 'absolute', left: 14, right: 14, top: H * 0.62, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px 7px', fontFamily: CAPTION, fontWeight: 900, fontSize: 27, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: -0.5 }}>
        {line.words.map((w, i) => <span key={i} style={{ color: i === wordIdx ? YELLOW : '#fff', transform: i === wordIdx ? 'scale(1.08)' : 'none', textShadow: '0 3px 0 #000, 0 0 10px rgb(0 0 0 / .6)', WebkitTextStroke: '1.5px #000', opacity: i <= wordIdx ? 1 : 0.0 }}>{w}</span>)}
      </div>}
      {music && <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 999, background: 'rgb(0 0 0 / .5)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
        ♪ {Array.from({ length: 5 }, (_, i) => <i key={i} style={{ width: 3, height: 4 + 9 * Math.abs(Math.sin((f + i * 7) / 5)), background: '#fff', borderRadius: 2 }} />)}
      </div>}
    </div>
  </div>
}

function Card({ f }: { f: number }) {
  const enter = ease(f, CARD, CARD + 14)
  const ready = f >= READY
  const progress = interpolate(f, [CARD + 10, STEPS[STEPS.length - 1].at], [0, 1], clamp)
  return <div style={{ marginTop: 18, width: 860, borderRadius: 20, background: '#171717', border: `1px solid ${LINE}`, padding: 24, display: 'flex', gap: 30, opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}>
    <Phone f={f} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Logo size={26} /><b style={{ fontSize: 19, color: TXT }}>OttoCut</b><span style={{ marginLeft: 'auto', fontSize: 13, color: ready ? GREEN : DIM, fontWeight: 600 }}>{ready ? '● pronto' : '● editando'}</span></div>
      <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: '#2a2a2a', overflow: 'hidden' }}><div style={{ width: `${progress * 100}%`, height: '100%', background: `linear-gradient(90deg, ${VIOLET}, ${PINK})` }} /></div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
        {STEPS.map((st, i) => {
          const done = f >= st.at, active = !done && (i === 0 ? f >= CARD + 10 : f >= STEPS[i - 1].at)
          return <div key={st.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', opacity: done || active ? 1 : 0.35 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: done ? GREEN : 'transparent', border: done ? 'none' : `2px solid ${active ? VIOLET : '#444'}`, transform: done ? `scale(${0.6 + pop(f, st.at) * 0.4})` : 'none' }}>
              {done ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0b0b0b" strokeWidth={3.4} strokeLinecap="round"><path d="M5 12l5 5L20 7" /></svg>
                : active ? <i style={{ width: 8, height: 8, borderRadius: '50%', background: VIOLET, opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 5)) }} /> : null}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <b style={{ fontSize: 16, color: TXT, fontWeight: 600 }}>{st.label}</b>
              <span style={{ fontSize: 14, color: DIM, marginTop: 2 }}>{done ? st.done : active ? 'trabalhando…' : 'na fila'}</span>
            </span>
          </div>
        })}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', gap: 10, opacity: ease(f, READY, READY + 10) }}>
        {['Baixar 9:16', 'Baixar 4:5'].map((l, i) => <span key={l} style={{ padding: '10px 18px', borderRadius: 999, background: i ? 'transparent' : '#fff', color: i ? TXT : '#000', border: i ? '1px solid #555' : 'none', fontSize: 15, fontWeight: 600 }}>{l}</span>)}
      </div>
    </div>
  </div>
}

export function OttoCutChatDemo() {
  const f = useCurrentFrame()
  const sent = f >= SEND
  const bubble = pop(f, SEND)
  const reply = ease(f, REPLY, REPLY + 10)
  const scroll = interpolate(f, [CARD, CARD + 30], [0, 290], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  const out = interpolate(f, [FADE_OUT, OTTOCUT_CHAT_DURATION], [1, 0], clamp)
  const style: CSSProperties = { position: 'absolute', left: 300, right: 0, top: 0, bottom: 0, background: MAIN, overflow: 'hidden' }
  return <AbsoluteFill style={{ background: MAIN, fontFamily: UI }}>
    <Sidebar />
    <div style={style}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 64, display: 'flex', alignItems: 'center', padding: '0 28px', fontSize: 19, color: TXT, fontWeight: 600, background: MAIN, zIndex: 2 }}>ChatGPT <span style={{ color: DIM, marginLeft: 6 }}>⌄</span></div>
      {!sent && <div style={{ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontSize: 30, color: TXT, fontWeight: 500, opacity: out * interpolate(f, [0, 10], [0, 1], clamp) }}>Por onde começamos?</div>}
      {sent && <div style={{ position: 'absolute', left: 80, right: 80, top: 100 - scroll, opacity: out, display: 'flex', flexDirection: 'column' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: 620, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, opacity: bubble, transform: `translateY(${(1 - bubble) * 14}px)` }}>
          <Thumb w={150} h={190} label />
          <div style={{ background: BUBBLE, color: TXT, fontSize: 17, lineHeight: 1.45, padding: '12px 18px', borderRadius: 22 }}>{PROMPT}</div>
        </div>
        <div style={{ marginTop: 26, opacity: reply }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#2a2a2a', color: DIM, fontSize: 14 }}><Logo size={18} />Usou o OttoCut</span>
          <div style={{ marginTop: 12, fontSize: 17, color: TXT, lineHeight: 1.5 }}>{f >= READY ? 'Pronto! Seu Reel ficou com 38 segundos. Quer que eu teste outro gancho no começo?' : 'Beleza! Estou editando seu Reel agora:'}</div>
          <Card f={f} />
        </div>
      </div>}
      <div style={{ opacity: f < FADE_OUT ? 1 : out }}><Composer f={f} /></div>
    </div>
  </AbsoluteFill>
}

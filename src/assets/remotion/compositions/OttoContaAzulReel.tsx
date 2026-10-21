import { ArrowLeftRight, MessageCircle, Plus, ReceiptText, Tags, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { continueRender, delayRender, Easing, Img, random, spring, staticFile } from 'remotion'

import {
  Card,
  DISPLAY,
  GRAY,
  Headline,
  INK,
  INK_MUTED,
  p,
  ReelRoot,
  type ReelScene,
  Scene,
  sceneDuration,
  syncToNarration,
  TERRA,
  TERRA_SOFT,
  useFrame,
  useSpring,
  WHITE,
  alpha,
  SURFACE,
} from './OttoContadoresReel'
import { ChatGptLogo, CheckBadge, makeClaudeAlsoScene, makeCta, makeRevealScene } from './OttoNotaFiscalChatGptVideos'

// ─── 1. Hook: a generic legacy ERP screen falls apart, the ChatGPT composer stays ───

type Piece = { h: number; key: string; render: ReactNode; w: number; x: number; y: number }

const WIN = { h: 720, w: 900, x: 90, y: 680 }

function bar(width: number | string, color = `${alpha(GRAY, 0xaa)}`, height = 14) {
  return <div style={{ background: color, borderRadius: 6, height, width }} />
}

const LEGACY_PIECES: Piece[] = [
  {
    h: 70,
    key: 'topbar',
    render: (
      <div style={{ alignItems: 'center', display: 'flex', gap: 14, height: '100%', padding: '0 24px' }}>
        {['#e5675c', '#e9b949', '#5cb85c'].map((c) => <span key={c} style={{ background: c, borderRadius: 99, height: 16, width: 16 }} />)}
        <div style={{ display: 'flex', gap: 10, marginLeft: 24 }}>
          {['Vendas', 'Financeiro', 'Fiscal', 'Relatórios'].map((t, i) => (
            <span key={t} style={{ background: i === 1 ? '#e8eefc' : SURFACE, borderRadius: 8, color: i === 1 ? '#2f6bd8' : INK_MUTED, fontSize: 19, fontWeight: 600, padding: '8px 14px' }}>{t}</span>
          ))}
        </div>
      </div>
    ),
    w: WIN.w,
    x: 0,
    y: 0,
  },
  ...Array.from({ length: 8 }, (_, i): Piece => ({
    h: 56,
    key: `menu${i}`,
    render: <div style={{ alignItems: 'center', display: 'flex', gap: 12, height: '100%', padding: '0 20px' }}><span style={{ background: `${alpha(GRAY, 0x88)}`, borderRadius: 6, height: 22, width: 22 }} />{bar(80 + ((i * 37) % 60))}</div>,
    w: 200,
    x: 0,
    y: 90 + i * 64,
  })),
  {
    h: 64,
    key: 'toolbar',
    render: (
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, height: '100%', padding: '0 20px' }}>
        {['Novo lançamento', 'Filtrar', 'Exportar .xlsx'].map((t) => (
          <span key={t} style={{ border: `2px solid ${alpha(GRAY, 0x88)}`, borderRadius: 10, color: INK_MUTED, fontSize: 18, fontWeight: 600, padding: '8px 14px' }}>{t}</span>
        ))}
      </div>
    ),
    w: 680,
    x: 220,
    y: 90,
  },
  ...Array.from({ length: 7 }, (_, i): Piece => ({
    h: 58,
    key: `row${i}`,
    render: (
      <div style={{ alignItems: 'center', background: i === 0 ? SURFACE : WHITE, borderBottom: `1.5px solid ${alpha(GRAY, 0x55)}`, display: 'flex', gap: 24, height: '100%', padding: '0 18px' }}>
        {bar(110, i === 0 ? `${GRAY}` : `${alpha(GRAY, 0x99)}`)}
        {bar(160, i === 0 ? `${GRAY}` : `${alpha(GRAY, 0x77)}`)}
        {bar(90, i === 0 ? `${GRAY}` : `${alpha(GRAY, 0x77)}`)}
        <span style={{ marginLeft: 'auto' }}>{bar(70, i === 0 ? `${GRAY}` : '#9ec5a8')}</span>
      </div>
    ),
    w: 680,
    x: 220,
    y: 170 + i * 60,
  })),
  {
    h: 110,
    key: 'chart',
    render: (
      <div style={{ alignItems: 'flex-end', display: 'flex', gap: 14, height: '100%', padding: '14px 20px' }}>
        {[40, 70, 55, 85, 60, 95, 75].map((v, i) => <div key={i} style={{ background: `${alpha(GRAY, 0x99)}`, borderRadius: 4, height: `${v}%`, width: 46 }} />)}
      </div>
    ),
    w: 680,
    x: 220,
    y: 600,
  },
]

/** Resolves to true/false once we know whether a /public asset exists, holding the render until then. */
function useAssetExists(path: string) {
  const [exists, setExists] = useState<boolean | null>(null)
  const [handle] = useState(() => delayRender(`Checking ${path}`))

  useEffect(() => {
    let alive = true
    fetch(staticFile(path), { method: 'HEAD' })
      .then((response) => alive && setExists(response.ok && !(response.headers.get('content-type') ?? '').includes('text/html')))
      .catch(() => alive && setExists(false))
      .finally(() => continueRender(handle))
    return () => {
      alive = false
    }
  }, [handle, path])

  return exists
}

function LogoLine({ at, children, top }: { at: number; children: ReactNode; top: number }) {
  const frame = useFrame()
  const o = p(frame, at, at + 14)
  return (
    <div style={{ alignItems: 'center', display: 'flex', filter: `blur(${(1 - o) * 8}px)`, justifyContent: 'center', left: 0, opacity: o, position: 'absolute', right: 0, top, transform: `translateY(${(1 - o) * 28}px)` }}>
      {children}
    </div>
  )
}

/** Hook with brand logos instead of names: [ChatGPT] acabou de matar o [ERP]. Falls back to the ERP name while its logo file is missing. */
function makeHookScene(erpName: string, erpLogo: string) {
  return function HookScene({ duration }: { duration: number }) {
    const frame = useFrame()
    const appear = p(frame, 6, 18)
    const windowFall = p(frame, 66, 84, [0, 1], Easing.in(Easing.quad))
    const composer = useSpring(70, { damping: 13, stiffness: 150 })
    const strike = p(frame, 34, 50, [0, 1], Easing.inOut(Easing.cubic))
    const hasLogo = useAssetExists(erpLogo)

    return (
      <Scene duration={duration}>
        <LogoLine at={0} top={190}>
          <Img src={staticFile('gptLogo.svg')} style={{ filter: 'brightness(0)', height: 104 }} />
        </LogoLine>
        <LogoLine at={8} top={320}>
          <span style={{ fontFamily: DISPLAY, fontSize: 118, letterSpacing: '-0.015em', lineHeight: 1 }}>
            acabou de <span style={{ color: TERRA, fontStyle: 'italic' }}>matar</span> o
          </span>
        </LogoLine>
        <LogoLine at={18} top={480}>
          <span style={{ display: 'inline-block', position: 'relative' }}>
            {hasLogo ? (
              <Img src={staticFile(erpLogo)} style={{ display: 'block', height: 110, maxWidth: 760, objectFit: 'contain' }} />
            ) : (
              <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 118, lineHeight: 1 }}>{erpName}</span>
            )}
            <svg preserveAspectRatio="none" style={{ height: 40, left: '-6%', overflow: 'visible', position: 'absolute', top: 'calc(50% - 20px)', width: '112%' }} viewBox="0 0 100 10">
              <path d="M1 7 C 30 3, 70 8, 99 3" fill="none" pathLength={1} stroke={TERRA} strokeDasharray={1} strokeDashoffset={1 - strike} strokeLinecap="round" strokeWidth={9} vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
        </LogoLine>

      {/* legacy window frame */}
      <div style={{ background: WHITE, border: `2px solid ${alpha(GRAY, 0x88)}`, borderRadius: 24, boxShadow: '0 30px 70px rgba(20,20,19,0.10)', height: WIN.h, left: WIN.x, opacity: appear * (1 - windowFall), position: 'absolute', top: WIN.y + windowFall * 700, transform: `rotate(${windowFall * 8}deg) scale(${0.96 + appear * 0.04})`, width: WIN.w }} />
      {LEGACY_PIECES.map((piece, index) => {
        const delay = 36 + random(`fall${index}`) * 26
        const t = p(frame, delay, delay + 22, [0, 1], Easing.in(Easing.quad))
        const shake = frame > 26 && frame < delay ? Math.sin(frame * 1.7 + index) * 2.5 : 0
        if (t >= 1) return null
        return (
          <div
            key={piece.key}
            style={{
              height: piece.h,
              left: WIN.x + piece.x + shake,
              opacity: appear * (1 - p(t, 0.6, 1)),
              overflow: 'hidden',
              position: 'absolute',
              top: WIN.y + piece.y + t * (700 + random(`dy${index}`) * 400),
              transform: `rotate(${t * (random(`r${index}`) - 0.5) * 70}deg)`,
              width: piece.w,
            }}
          >
            {piece.render}
          </div>
        )
      })}

      {/* what stays: the ChatGPT composer */}
      {frame >= 70 ? (
        <>
          <Card style={{ alignItems: 'center', display: 'flex', height: 140, justifyContent: 'center', left: 330, opacity: composer, top: 760, transform: `scale(${composer})`, width: 420 }}>
            <ChatGptLogo height={58} />
          </Card>
          <div style={{ alignItems: 'center', background: WHITE, border: '2px solid #e3e3e3', borderRadius: 60, boxShadow: '0 20px 50px rgba(0,0,0,0.08)', display: 'flex', gap: 18, height: 116, left: 110, opacity: composer, padding: '0 22px 0 30px', position: 'absolute', right: 110, top: 960, transform: `translateY(${(1 - composer) * 40}px)` }}>
            <Plus color={INK} size={38} strokeWidth={1.9} />
            <span style={{ color: '#9b9b9b', flex: 1, fontSize: 34 }}>Pergunte alguma coisa</span>
            <span style={{ alignItems: 'center', background: INK, borderRadius: 99, display: 'flex', height: 74, justifyContent: 'center', width: 74 }}>
              <svg height={34} viewBox="0 0 24 24" width={34}>
                <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke={WHITE} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} />
              </svg>
            </span>
          </div>
        </>
      ) : null}
    </Scene>
  )
  }
}

// ─── 2. "Agora você pode…" ────────────────────────────────────────────────────

const CAN_DO: { bg: string; color: string; icon: ReactNode; result: string; title: string }[] = [
  { bg: '#eee7fb', color: '#7b4fd6', icon: <ReceiptText size={40} strokeWidth={2} />, result: 'NFS-e 000.482 emitida e enviada', title: 'Emitir suas notas fiscais' },
  { bg: '#ddf2ec', color: '#14946b', icon: <ArrowLeftRight size={40} strokeWidth={2} />, result: '42 lançamentos conciliados', title: 'Fazer a conciliação bancária' },
  { bg: '#fcf0d6', color: '#c98a0c', icon: <Tags size={40} strokeWidth={2} />, result: '18 despesas categorizadas', title: 'Classificar despesas' },
  { bg: TERRA_SOFT, color: TERRA, icon: <MessageCircle size={40} strokeWidth={2} />, result: '6 cobranças enviadas no WhatsApp', title: 'Cobrar seus clientes' },
  { bg: '#e3ecfb', color: '#2f6bd8', icon: <TrendingUp size={40} strokeWidth={2} />, result: 'Lucro de outubro: R$ 35.250', title: 'Ver quanto lucrou no mês' },
]

const ROW_EVERY = 38

function CanDoScene({ duration }: { duration: number }) {
  const frame = useFrame()
  const outro = 14 + CAN_DO.length * ROW_EVERY

  return (
    <Scene duration={duration}>
      <Headline highlight={['pode']} size={100} start={0} text="Agora você pode" style={{ top: 220 }} />
      {CAN_DO.map((item, i) => {
        const at = 14 + i * ROW_EVERY
        const s = spring({ config: { damping: 15, stiffness: 160 }, fps: 30, frame: frame - at })
        const done = frame >= at + 18
        const check = spring({ config: { damping: 11, stiffness: 200 }, fps: 30, frame: frame - at - 18 })
        if (frame < at) return null
        return (
          <Card key={item.title} style={{ alignItems: 'center', border: `2px solid ${done ? `${item.color}66` : `${alpha(GRAY, 0x66)}`}`, borderRadius: 30, display: 'flex', gap: 24, height: 150, left: 80, opacity: s, padding: '0 30px', right: 80, top: 420 + i * 172, transform: `translateX(${(1 - s) * 80}px)` }}>
            <span style={{ alignItems: 'center', background: item.bg, borderRadius: 22, color: item.color, display: 'flex', flex: 'none', height: 88, justifyContent: 'center', width: 88 }}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 36, fontWeight: 650 }}>{item.title}</span>
              <span style={{ color: done ? INK_MUTED : `${GRAY}`, display: 'block', fontSize: 26, fontWeight: 600, marginTop: 6 }}>{done ? item.result : 'Otto trabalhando…'}</span>
            </div>
            <span style={{ transform: `scale(${done ? check : 0})` }}>
              <CheckBadge size={56} />
            </span>
          </Card>
        )
      })}
      <Headline highlight={['chatgpt']} size={70} start={outro} stagger={2} text="Tudo conversando com o ChatGPT." style={{ top: 1310 }} />
    </Scene>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

/** Same reel for every competitor: only the hook changes. */
/**
 * Narration = the brand hook (`hookSecs` long) + the shared body (`concorrente-corpo.mp3`). Body cues come from its
 * word timestamps: "Agora você pode" 0s, "Isso é o Otto" 11.45s, "E funciona no Claude" 20.7s, "Quer ver" 22.45s, end 25.7s.
 */
function competitorScenes(erpName: string, erpLogo: string, hookSecs: number): ReelScene[] {
  const scenes: ReelScene[] = [
    { Component: makeHookScene(erpName, erpLogo), duration: 105 },
    { Component: CanDoScene, duration: 14 + CAN_DO.length * ROW_EVERY + 70 },
    {
      Component: makeRevealScene(['Sem tela', 'Sem menu', 'Sem treinamento', 'Sem pagar nada'], 'Isso é o', 'Um sistema de gestão gratuito que funciona dentro do seu ChatGPT.', ['gratuito', 'chatgpt']),
      duration: 160,
    },
    { Component: makeClaudeAlsoScene(), duration: 75 },
    { Component: makeCta('Quer ver como funciona?', { comment: 'Sistema', highlight: ['funciona'], keyword: 'SISTEMA' }), duration: 120 },
  ]
  const h = hookSecs
  return syncToNarration(scenes, [0, h, h + 11.45, h + 20.7, h + 22.45], h + 26.7)
}

// Drop the logo files at these paths (SVG or transparent PNG renamed accordingly); until then the name is shown as text.
const CONTA_AZUL_SCENES = competitorScenes('Conta Azul', 'brand-logos/erp/conta-azul.svg', 3.24)
const OMIE_SCENES = competitorScenes('Omie', 'brand-logos/erp/omie.png', 3.08)

export const OTTO_CONTA_AZUL_REEL_DURATION = sceneDuration(CONTA_AZUL_SCENES)
export const OTTO_OMIE_REEL_DURATION = sceneDuration(OMIE_SCENES)

export function OttoContaAzulReel() {
  return <ReelRoot audio="remotion/otto-reels/conta-azul-narracao.mp3" scenes={CONTA_AZUL_SCENES} />
}

export function OttoOmieReel() {
  return <ReelRoot audio="remotion/otto-reels/omie-narracao.mp3" scenes={OMIE_SCENES} />
}

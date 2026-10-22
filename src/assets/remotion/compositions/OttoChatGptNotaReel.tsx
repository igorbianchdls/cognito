import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'

import {
  AssistantText,
  BANK,
  BankReconciliationCard,
  Composer,
  EXP_CARD_TOP,
  EXP_TEXT_TOP,
  ExpensesCard,
  FIN,
  FinanceCard,
  FONT,
  FONT_CSS,
  InvoiceBatchCard,
  NF,
  NF_H,
  StatusBar,
  T,
  TEXT,
  TopBar,
  UserMessage,
  p,
  pop,
} from './ChatGptVendasCardReplica'

/**
 * Reel: "Agora o ChatGPT pode emitir suas notas fiscais" — the illustration is the ChatGPT screen itself.
 * Replica flows are replayed through time-warps so every action lands on the narration
 * (part 1: invoices; part 2: "E não faz só isso" → expenses, bank reconciliation, dashboard).
 */

const s = (sec: number) => Math.round(sec * 30)

/** Part 2 narration starts where part 1 is cut (right before its own "Isso é o Otto"). */
const PART2 = 18.0
const g = (sec: number) => PART2 + sec

export const OTTO_CHATGPT_NOTA_REEL_DURATION = s(g(15.76) + 0.9)

const SCALE = 1080 / 828
/** Logical screen: replica width, reel aspect ratio. */
const SCREEN_H = 1920 / SCALE
/** The replica places the composer for a 1792px screen. */
const BOTTOM_SHIFT = 1792 - SCREEN_H
const CTA_AT = s(g(11.4))

type Scene = {
  content: (rf: number) => ReactNode
  /** Scroll stops in replica frames: [from, to, target]. */
  scroll: [number, number, number][]
  scroll0: number
  start: number
  /** [reel second, replica frame] */
  warp: [number, number][]
}

const SCENES: Scene[] = [
  {
    // invoices
    content: (rf) => (
      <>
        <UserMessage at={T.u6.send + 2} frame={rf} lines={['Agora emite as notas fiscais', 'das vendas de hoje']} top={NF.u6} />
        <AssistantText frame={rf} text="Separei as vendas prontas para emissão:" top={NF.a6} window={T.a6} />
        <InvoiceBatchCard ad frame={rf} />
      </>
    ),
    scroll: [
      [1868, 1892, NF.card - 260],
      [1912, 1936, NF.card + NF_H.list - 1130],
      [T.nfConfirm, T.nfConfirm + 20, NF.card - 198],
      [1998, 2018, NF.card + NF_H.confirm - 1130],
      [T.nfDone, T.nfDone + 20, NF.card - 198],
    ],
    scroll0: NF.u6 - 230,
    start: 0,
    warp: [
      [0, 1700],
      [4.7, 1780], // "eu peço…" → typing
      [7.1, 1808],
      [7.3, 1812], // "hoje." → send
      [7.55, 1838], // "E ele já separa" → answer streams
      [8.0, 1866], // card
      [8.6, 1878], // "três vendas" → rows
      [9.9, 1912],
      [11.0, 1936], // "serviço e valor" → total + button
      [11.7, 1950],
      [12.4, 1964], // "reviso" → tap
      [12.65, 1976], // confirm card
      [13.3, 2020], // "confirmo"
      [13.9, 2046], // tap
      [14.1, 2058], // "e pronto" → done
      [15.6, 2104],
      [g(1.3), 2124],
    ],
  },
  {
    // "Ele classifica suas despesas…"
    content: (rf) => (
      <>
        <UserMessage at={0} frame={rf} lines={['Classifica as despesas da semana']} top={EXP_TEXT_TOP - 210} />
        <AssistantText frame={rf} text="Classifiquei as despesas da semana:" top={EXP_TEXT_TOP} window={T.expIntro} />
        <ExpensesCard frame={rf} />
      </>
    ),
    scroll: [[436, 470, EXP_CARD_TOP - 198]],
    scroll0: EXP_CARD_TOP - 560,
    start: s(g(1.3)),
    warp: [
      [g(1.3), 412],
      [g(3.5), 496],
    ],
  },
  {
    // "concilia o extrato do banco…"
    content: (rf) => (
      <>
        <UserMessage at={0} frame={rf} lines={['Concilia o extrato do banco', 'com os lançamentos']} top={BANK.u7} />
        <AssistantText frame={rf} text="Encontrei 3 movimentações com correspondência no OTTO:" top={BANK.a7} window={T.a7} />
        <BankReconciliationCard frame={rf} />
      </>
    ),
    scroll: [[2210, 2246, BANK.card + 480 - 198]],
    scroll0: BANK.card - 560,
    start: s(g(3.5)),
    warp: [
      [g(3.5), 2200],
      [g(5.3), 2290],
    ],
  },
  {
    // "e te mostra o seu financeiro inteiro, com gráfico e alertas. Tudo isso dentro do chat."
    content: (rf) => (
      <>
        <UserMessage at={0} frame={rf} lines={['E como está o financeiro', 'nos últimos 30 dias?']} top={FIN.u5} />
        <AssistantText frame={rf} text="Aqui está a visão financeira dos últimos 30 dias:" top={FIN.a5} window={T.a5} />
        <FinanceCard frame={rf} still />
      </>
    ),
    scroll: [
      [1534, 1560, FIN.card - 140],
      [1640, 1690, FIN.card + 1530 - 198],
    ],
    scroll0: FIN.card - 560,
    start: s(g(5.3)),
    warp: [
      [g(5.3), 1524],
      [g(7.3), 1600], // "financeiro inteiro" → KPIs count up
      [g(8.0), 1690], // "gráfico" → chart
      [g(9.4), 1768],
      [g(11.4), 1780],
    ],
  },
]

function sceneAt(frame: number) {
  let index = 0
  SCENES.forEach((scene, i) => {
    if (frame >= scene.start) index = i
  })
  return SCENES[index]
}

function replicaFrame(scene: Scene, frame: number) {
  return interpolate(
    frame,
    scene.warp.map(([sec]) => s(sec)),
    scene.warp.map(([, r]) => r),
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
}

function scrollAt(scene: Scene, rf: number) {
  let previous = scene.scroll0
  let scroll = previous
  for (const [from, to, target] of scene.scroll) {
    scroll += p(rf, from, to, [0, 1], Easing.inOut(Easing.cubic)) * (target - previous)
    previous = target
  }
  return scroll
}

type Word = { end: number; start: number; text: string }

const w = (text: string, start: number, end: number): Word => ({ end, start, text })
/** Words of part 2, shifted to reel time. */
const w2 = (text: string, start: number, end: number) => w(text, g(start), g(end))

const HOOK: Word[] = [w('Agora', 0, 0.36), w('o', 0.4, 0.48), w('ChatGPT', 0.56, 1.36), w('pode', 1.44, 1.6), w('emitir', 1.72, 1.92), w('suas', 2, 2.24), w('notas', 2.32, 2.56), w('fiscais', 2.64, 3.36)]

/** Narration captions, one phrase at a time, karaoke-style. */
const CAPTIONS: Word[][] = [
  [w('Olha', 3.6, 3.84), w('só…', 3.92, 4.72)],
  [w('eu', 4.8, 4.88), w('peço', 4.92, 5.12), w('pra', 5.16, 5.2), w('emitir', 5.32, 5.52), w('as', 5.6, 5.68), w('notas', 5.76, 6.08), w('das', 6.16, 6.32), w('vendas', 6.4, 6.64), w('de', 6.72, 6.8), w('hoje', 6.88, 7.2)],
  [w('e', 7.6, 7.64), w('ele', 7.68, 7.84), w('já', 7.867, 7.92), w('separa', 8, 8.4), w('as', 8.48, 8.56), w('três', 8.64, 8.8), w('vendas', 8.88, 9.36)],
  [w('com', 9.44, 9.52), w('cliente,', 9.8, 10.16), w('serviço', 10.24, 10.8), w('e', 10.96, 11), w('valor', 11.04, 11.64)],
  [w('eu', 11.84, 11.92), w('reviso…', 12, 12.96)],
  [w('confirmo…', 13.24, 14)],
  [w('e', 14.04, 14.08), w('pronto.', 14.16, 14.56)],
  [w('três', 14.88, 15.12), w('notas', 15.2, 15.44), w('emitidas', 15.6, 16.24)],
  [w('sem', 16.32, 16.48), w('abrir', 16.56, 16.72), w('sistema', 16.8, 17.36), w('nenhum', 17.44, 17.76)],
  [w2('E', 0, 0.08), w2('não', 0.12, 0.24), w2('faz', 0.28, 0.48), w2('só', 0.52, 0.64), w2('isso.', 0.76, 1.2)],
  [w2('Ele', 1.36, 1.52), w2('classifica', 1.64, 2.08), w2('suas', 2.16, 2.32), w2('despesas…', 2.4, 3.44)],
  [w2('concilia', 3.56, 3.92), w2('o', 3.96, 4), w2('extrato', 4.12, 4.4), w2('do', 4.44, 4.48), w2('banco…', 4.56, 5.28)],
  [w2('e', 5.32, 5.36), w2('te', 5.44, 5.52), w2('mostra', 5.6, 5.84), w2('o', 5.88, 5.92), w2('seu', 5.96, 6.08), w2('financeiro', 6.28, 6.56), w2('inteiro,', 6.72, 7.44)],
  [w2('com', 7.48, 7.52), w2('gráfico', 7.68, 8.16), w2('e', 8.32, 8.36), w2('alertas.', 8.4, 8.96)],
  [w2('Tudo', 9.36, 9.6), w2('isso', 9.68, 9.92), w2('dentro', 10.16, 10.4), w2('do', 10.48, 10.56), w2('chat.', 10.64, 11.12)],
]

function Caption({ frame }: { frame: number }) {
  const t = frame / 30
  const index = CAPTIONS.findIndex((words, i) => t >= words[0].start - 0.08 && t < (CAPTIONS[i + 1]?.[0].start ?? CTA_AT / 30) - 0.08)
  if (index < 0 || frame >= CTA_AT) return null
  const words = CAPTIONS[index]
  const enter = pop(frame, s(words[0].start - 0.08))
  return (
    <div style={{ bottom: SCREEN_H - 1256, display: 'flex', justifyContent: 'center', left: 40, position: 'absolute', right: 40 }}>
      <span style={{ background: 'rgba(13,13,13,0.9)', borderRadius: 26, color: '#fff', fontSize: 40, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: '52px', maxWidth: 680, padding: '14px 28px', textAlign: 'center', transform: `translateY(${(1 - enter) * 14}px) scale(${0.94 + enter * 0.06})` }}>
        {words.map((word, i) => (
          <span key={i} style={{ opacity: t >= word.start - 0.04 ? 1 : 0.38 }}>
            {i ? ' ' : ''}
            {word.text}
          </span>
        ))}
      </span>
    </div>
  )
}

/** Empty new chat: the hook is spoken and written where the chat will start. */
function Hook({ frame, rf }: { frame: number; rf: number }) {
  const t = frame / 30
  const out = p(rf, T.u6.send - 4, T.u6.send + 6)
  if (frame >= SCENES[1].start || out >= 1) return null
  return (
    <div style={{ left: 60, opacity: 1 - out, position: 'absolute', right: 60, textAlign: 'center', top: 470, transform: `translateY(${-out * 40}px)` }}>
      <span style={{ color: TEXT, display: 'block', fontSize: 70, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: '80px' }}>
        {HOOK.map((word, i) => {
          const sp = pop(frame, s(word.start))
          return (
            <span key={i} style={{ display: 'inline-block', marginRight: i < HOOK.length - 1 ? 18 : 0, opacity: t >= word.start ? sp : 0.12, transform: `translateY(${t >= word.start ? (1 - sp) * 16 : 0}px)` }}>
              {word.text}
            </span>
          )
        })}
      </span>
      <span style={{ color: '#8e8e8e', display: 'block', fontSize: 31, marginTop: 36, opacity: p(frame, s(3.4), s(3.8)) }}>Em que posso ajudar?</span>
    </div>
  )
}

function Cta({ frame }: { frame: number }) {
  if (frame < CTA_AT) return null
  const bg = p(frame, CTA_AT, CTA_AT + 12)
  const at = (delay: number): CSSProperties => {
    const sp = pop(frame, CTA_AT + delay)
    return { opacity: sp, transform: `translateY(${(1 - sp) * 24}px)` }
  }
  return (
    <AbsoluteFill style={{ alignItems: 'center', background: `rgba(255,255,255,${0.97 * bg})`, justifyContent: 'center', padding: '0 70px', textAlign: 'center' }}>
      <span style={{ color: TEXT, fontSize: 150, fontWeight: 750, letterSpacing: '-0.05em', lineHeight: '150px', ...at(s(0.7)) }}>Otto</span>
      <span style={{ color: TEXT, fontSize: 50, fontWeight: 650, letterSpacing: '-0.02em', lineHeight: '60px', marginTop: 34, ...at(s(1.3)) }}>Seu ERP dentro do ChatGPT</span>
      <span style={{ alignItems: 'center', background: TEXT, borderRadius: 99, color: '#fff', display: 'flex', fontSize: 32, fontWeight: 600, height: 84, marginTop: 56, padding: '0 46px', ...at(s(2.9)) }}>Notas, despesas, banco e financeiro no chat</span>
    </AbsoluteFill>
  )
}

export function OttoChatGptNotaReel() {
  const frame = useCurrentFrame()
  const scene = sceneAt(frame)
  const rf = replicaFrame(scene, frame)
  const scroll = scrollAt(scene, rf)
  /** Each new chat slides in over the previous one. */
  const enter = scene.start === 0 ? 1 : p(frame, scene.start, scene.start + 10)

  return (
    <AbsoluteFill className="chatgpt-replica" style={{ background: '#fff', color: TEXT, fontFamily: FONT }}>
      <style>{FONT_CSS}</style>
      <Audio src={staticFile('remotion/otto-reels/chatgpt-nota-narracao.mp3')} trimAfter={s(PART2)} />
      <Sequence from={s(PART2)}>
        <Audio src={staticFile('remotion/otto-reels/chatgpt-nota-narracao-2.mp3')} />
      </Sequence>

      <div style={{ height: SCREEN_H, left: 0, overflow: 'hidden', position: 'absolute', top: 0, transform: `scale(${SCALE})`, transformOrigin: '0 0', width: 828 }}>
        {/* conversation */}
        <div style={{ inset: 0, opacity: enter, position: 'absolute', transform: `translateY(${-scroll + (1 - enter) * 90}px)` }}>{scene.content(rf)}</div>
        <Hook frame={frame} rf={rf} />

        {/* fixed chrome */}
        <div style={{ background: 'linear-gradient(#fff 88%, rgba(255,255,255,0))', height: 196, left: 0, position: 'absolute', right: 0, top: 0 }} />
        <StatusBar />
        <TopBar />
        <Caption frame={frame} />
        <div style={{ inset: 0, position: 'absolute', transform: `translateY(${-BOTTOM_SHIFT}px)` }}>
          <div style={{ background: 'linear-gradient(rgba(255,255,255,0), #fff 45%)', height: 230, left: 0, position: 'absolute', right: 0, top: 1580 }} />
          <Composer frame={rf} />
          <div style={{ background: TEXT, borderRadius: 99, height: 9, left: 267, position: 'absolute', top: 1764, width: 294 }} />
        </div>
      </div>

      <Cta frame={frame} />
    </AbsoluteFill>
  )
}

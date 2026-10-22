import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'

import {
  AssistantText,
  BANK,
  BANK_H,
  BankReconciliationCard,
  Composer,
  EXP_CARD_TOP,
  EXP_H,
  EXP_TEXT_TOP,
  ExpensesCard,
  FIN,
  FinanceCard,
  FONT,
  FONT_CSS,
  InvoiceBatchCard,
  MESSAGES,
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
import { ReelRoot } from './OttoContadoresReel'
import { makeHookScene } from './OttoNotaFiscalChatGptVideos'

/**
 * Reel: "Agora o ChatGPT pode emitir suas notas fiscais" — the illustration is the ChatGPT screen itself.
 * Replica flows are replayed through time-warps so every action lands on the narration
 * (part 1: invoices; part 2: "E não faz só isso" → expenses, bank reconciliation, dashboard).
 */

const s = (sec: number) => Math.round(sec * 30)

/** Part 2 narration starts where part 1 is cut (right before its own "Isso é o Otto"). */
const PART2 = 18.0
const g = (sec: number) => PART2 + sec

export const OTTO_CHATGPT_NOTA_REEL_DURATION = s(g(33.04) + 0.9)

const SCALE = 1080 / 828
/** Logical screen: replica width, reel aspect ratio. */
const SCREEN_H = 1920 / SCALE
/** The replica places the composer for a 1792px screen. */
const BOTTOM_SHIFT = 1792 - SCREEN_H
const CTA_AT = s(g(29.25))

/** The expenses request is not one of the replica messages, so the reel adds it to its scene's composer. */
const EXP_MSG = { lines: ['Classifica as despesas', 'da semana'], send: 372, typing: [340, 370] }

type Scene = {
  content: (rf: number) => ReactNode
  /** Only this scene's request is typed in the composer (the warp holds can reach the next replica message). */
  messages: typeof MESSAGES
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
    messages: [MESSAGES[5]],
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
      [g(1.2), 2124],
    ],
  },
  {
    // "Pede pra ele classificar as despesas da semana… ele já sugere a categoria… confere, confirma… e pronto"
    content: (rf) => (
      <>
        <UserMessage at={EXP_MSG.send + 2} frame={rf} lines={EXP_MSG.lines} top={EXP_TEXT_TOP - 260} />
        <AssistantText frame={rf} text="Classifiquei as despesas da semana:" top={EXP_TEXT_TOP} window={[384, 404]} />
        <ExpensesCard frame={rf} />
      </>
    ),
    scroll: [
      [418, 450, EXP_CARD_TOP - 198],
      [494, 520, EXP_CARD_TOP + EXP_H.list - 1130],
      [T.review, T.review + 22, EXP_CARD_TOP - 198],
    ],
    messages: [EXP_MSG],
    scroll0: EXP_TEXT_TOP - 260 - 230,
    start: s(g(1.2)),
    warp: [
      [g(1.2), 330],
      [g(1.4), 340], // "Pede pra ele classificar…" → typing
      [g(3.4), 370],
      [g(3.6), 372], // send
      [g(3.9), 396],
      [g(4.3), 416], // card
      [g(4.5), 428], // "ele já sugere a categoria de cada uma" → categories fill in
      [g(6.5), 494],
      [g(6.85), 520], // "Você confere" → total + button
      [g(7.1), 532], // tap review
      [g(7.3), 544],
      [g(8.2), 600], // "confirma…"
      [g(8.4), 622], // tap confirm
      [g(8.76), 634], // "e pronto" → done
      [g(10.7), 700],
    ],
  },
  {
    // "Manda conciliar o extrato do banco… ele encontra o lançamento certo… É só revisar e confirmar."
    content: (rf) => (
      <>
        <UserMessage at={T.u7.send + 2} frame={rf} lines={['Concilia o extrato do banco', 'com os lançamentos']} top={BANK.u7} />
        <AssistantText frame={rf} text="Encontrei 3 movimentações com correspondência no OTTO:" top={BANK.a7} window={T.a7} />
        <BankReconciliationCard frame={rf} />
      </>
    ),
    scroll: [
      [2198, 2226, BANK.card - 198],
      [2240, 2266, BANK.card + 900 - 198],
      [2280, 2306, BANK.card + BANK_H.list - 1130],
      [T.bcConfirm, T.bcConfirm + 20, BANK.card + BANK_H.confirm - 1130],
      [T.bcDone, T.bcDone + 20, BANK.card - 198],
    ],
    messages: [MESSAGES[6]],
    scroll0: BANK.u7 - 230,
    start: s(g(10.75)),
    warp: [
      [g(10.75), 2100],
      [g(10.9), 2110], // "Manda conciliar o extrato do banco" → typing
      [g(12.5), 2138],
      [g(12.7), 2142], // send
      [g(13.0), 2172],
      [g(13.4), 2198], // card
      [g(13.7), 2226], // "ele encontra o lançamento certo" → matches
      [g(15.6), 2280],
      [g(16.0), 2306],
      [g(16.25), 2318], // "É só revisar" → tap
      [g(16.4), 2330],
      [g(17.3), 2396], // "confirmar" → tap
      [g(17.5), 2408], // done
      [g(18.0), 2436],
    ],
  },
  {
    // "E quer saber como tá o financeiro? Ele te mostra tudo: saldo, entradas, saídas, o gráfico… e os alertas"
    content: (rf) => (
      <>
        <UserMessage at={T.u5.send + 2} frame={rf} lines={['E como está o financeiro', 'nos últimos 30 dias?']} top={FIN.u5} />
        <AssistantText frame={rf} text="Aqui está a visão financeira dos últimos 30 dias:" top={FIN.a5} window={T.a5} />
        <FinanceCard frame={rf} still />
      </>
    ),
    scroll: [
      [1524, 1550, FIN.card - 140],
      [1640, 1690, FIN.card + 1530 - 198],
      [1770, 1800, FIN.card + 1000 - 198],
    ],
    messages: [MESSAGES[4]],
    scroll0: FIN.u5 - 230,
    start: s(g(18.0)),
    warp: [
      [g(18.0), 1430],
      [g(18.1), 1440], // "E quer saber como tá o financeiro?" → typing
      [g(19.4), 1466],
      [g(19.55), 1470], // send
      [g(19.7), 1500],
      [g(20.1), 1522],
      [g(21.1), 1536], // "saldo"
      [g(21.9), 1542], // "entradas"
      [g(22.6), 1548], // "saídas"
      [g(23.1), 1640],
      [g(23.6), 1690], // "o gráfico do período" → chart
      [g(24.6), 1762],
      [g(24.8), 1770], // "e os alertas" → back to the alerts
      [g(25.4), 1800],
      [g(29.25), 1812],
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

/** Same opening as the other "Agora o ChatGPT pode…" reels; the ChatGPT screen takes over after it. */
const HOOK_END = s(3.5)
const HookScene = makeHookScene('Agora o ChatGPT pode emitir suas notas fiscais.', ['notas', 'fiscais'], 88, '')

function HookLayer({ frame }: { frame: number }) {
  if (frame >= HOOK_END) return null
  return (
    <AbsoluteFill style={{ opacity: 1 - p(frame, HOOK_END - 7, HOOK_END) }}>
      <ReelRoot scenes={[{ Component: HookScene, duration: HOOK_END }]} />
    </AbsoluteFill>
  )
}

/** Empty new chat, until the request is sent. */
function EmptyChat({ rf }: { rf: number }) {
  const out = p(rf, T.u6.send - 4, T.u6.send + 6)
  if (rf >= T.nfCard) return null
  return <span style={{ color: '#8e8e8e', fontSize: 40, fontWeight: 500, left: 0, opacity: 1 - out, position: 'absolute', right: 0, textAlign: 'center', top: 640 }}>Em que posso ajudar?</span>
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
        {scene.start === 0 ? <EmptyChat rf={rf} /> : null}

        {/* fixed chrome */}
        <div style={{ background: 'linear-gradient(#fff 88%, rgba(255,255,255,0))', height: 196, left: 0, position: 'absolute', right: 0, top: 0 }} />
        <StatusBar />
        <TopBar />
        <div style={{ inset: 0, position: 'absolute', transform: `translateY(${-BOTTOM_SHIFT}px)` }}>
          <div style={{ background: 'linear-gradient(rgba(255,255,255,0), #fff 45%)', height: 230, left: 0, position: 'absolute', right: 0, top: 1580 }} />
          <Composer frame={rf} messages={scene.messages} />
          <div style={{ background: TEXT, borderRadius: 99, height: 9, left: 267, position: 'absolute', top: 1764, width: 294 }} />
        </div>
      </div>

      <HookLayer frame={frame} />
      <Cta frame={frame} />
    </AbsoluteFill>
  )
}

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

/** The expenses request is not one of the replica messages, so the reel adds it to the composer. */
const EXP_MSG = { lines: ['Classifica as despesas', 'da semana'], send: 372, typing: [340, 370] }
const COMPOSER_MESSAGES = [...MESSAGES, EXP_MSG]

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

type Word = { end: number; start: number; text: string }

const w = (text: string, start: number, end: number): Word => ({ end, start, text })
/** Words of part 2, shifted to reel time. */
const w2 = (text: string, start: number, end: number) => w(text, g(start), g(end))


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
  [w2('E', 0, 0.08), w2('não', 0.133, 0.24), w2('faz', 0.293, 0.4), w2('só', 0.44, 0.56), w2('isso.', 0.64, 1.12)],
  [w2('Pede', 1.28, 1.52), w2('pra', 1.56, 1.6), w2('ele', 1.68, 1.76), w2('classificar', 1.88, 2.32), w2('as', 2.4, 2.48), w2('despesas', 2.56, 2.88), w2('da', 2.96, 3.04), w2('semana…', 3.12, 4.16)],
  [w2('ele', 4.24, 4.32), w2('já', 4.36, 4.48), w2('sugere', 4.56, 4.88), w2('a', 4.92, 4.96), w2('categoria', 5.24, 5.52), w2('de', 5.6, 5.68), w2('cada', 5.76, 5.92), w2('uma.', 6, 6.56)],
  [w2('Você', 6.68, 6.8), w2('confere,', 6.92, 7.6), w2('confirma…', 7.76, 8.56)],
  [w2('e', 8.64, 8.72), w2('pronto,', 8.76, 9.36), w2('tudo', 9.4, 9.6), w2('classificado.', 9.72, 10.72)],
  [w2('Manda', 10.76, 10.96), w2('conciliar', 11.08, 11.44), w2('o', 11.48, 11.52), w2('extrato', 11.64, 11.92), w2('do', 11.96, 12), w2('banco…', 12.08, 12.8)],
  [w2('ele', 12.84, 12.88), w2('encontra', 12.96, 13.28), w2('o', 13.32, 13.36), w2('lançamento', 13.44, 13.84), w2('certo', 14, 14.36), w2('pra', 14.4, 14.64), w2('cada', 14.68, 14.88), w2('movimentação.', 14.96, 16)],
  [w2('É', 16.08, 16.16), w2('só', 16.187, 16.24), w2('revisar', 16.32, 16.72), w2('e', 16.76, 16.8), w2('confirmar.', 16.88, 17.68)],
  [w2('E', 17.72, 17.76), w2('quer', 17.84, 17.92), w2('saber', 18, 18.16), w2('como', 18.24, 18.4), w2('tá', 18.48, 18.56), w2('o', 18.6, 18.64), w2('financeiro?', 18.72, 19.6)],
  [w2('Ele', 19.64, 19.68), w2('te', 19.76, 19.84), w2('mostra', 19.92, 20.32), w2('tudo:', 20.4, 21.04)],
  [w2('saldo,', 21.12, 21.68), w2('entradas,', 21.88, 22.48), w2('saídas,', 22.56, 23.28)],
  [w2('o', 23.32, 23.36), w2('gráfico', 23.44, 23.84), w2('do', 23.88, 23.92), w2('período…', 24, 24.747)],
  [w2('e', 24.773, 24.8), w2('os', 24.88, 24.96), w2('alertas', 25.16, 25.44), w2('do', 25.48, 25.52), w2('que', 25.6, 25.68), w2('precisa', 25.8, 26.08), w2('da', 26.12, 26.16), w2('sua', 26.24, 26.32), w2('atenção.', 26.48, 27.2)],
  [w2('Tudo', 27.24, 27.44), w2('isso', 27.52, 27.92), w2('dentro', 28.04, 28.24), w2('do', 28.28, 28.32), w2('chat.', 28.4, 29.2)],
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
        <Caption frame={frame} />
        <div style={{ inset: 0, position: 'absolute', transform: `translateY(${-BOTTOM_SHIFT}px)` }}>
          <div style={{ background: 'linear-gradient(rgba(255,255,255,0), #fff 45%)', height: 230, left: 0, position: 'absolute', right: 0, top: 1580 }} />
          <Composer frame={rf} messages={COMPOSER_MESSAGES} />
          <div style={{ background: TEXT, borderRadius: 99, height: 9, left: 267, position: 'absolute', top: 1764, width: 294 }} />
        </div>
      </div>

      <HookLayer frame={frame} />
      <Cta frame={frame} />
    </AbsoluteFill>
  )
}

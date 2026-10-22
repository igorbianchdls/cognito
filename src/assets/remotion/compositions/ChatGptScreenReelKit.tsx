import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'

import {
  AdCopy,
  AssistantText,
  BANK,
  BANK_H,
  BankReconciliationCard,
  Composer,
  CreateClientCard,
  CRUD,
  DeleteClientCard,
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
  UpdateClientCard,
  UserMessage,
  p,
  pop,
} from './ChatGptVendasCardReplica'
import { ReelRoot } from './OttoContadoresReel'
import type { ReelScene } from './OttoContadoresReel'

/**
 * Reels whose illustration is the ChatGPT screen itself: replica flows replayed through time-warps,
 * so each tap and card lands on the narration.
 */

export const s = (sec: number) => Math.round(sec * 30)

const SCALE = 1080 / 828
/** Logical screen: replica width, reel aspect ratio. */
const SCREEN_H = 1920 / SCALE
/** The replica places the composer for a 1792px screen. */
const BOTTOM_SHIFT = 1792 - SCREEN_H
/** Lowest screen y a card bottom is scrolled to (just above the composer fade). */
const BOTTOM = 1250

type Message = (typeof MESSAGES)[number]

export type Scene = {
  content: (rf: number) => ReactNode
  /** Only this scene's request is typed in the composer (warp holds can reach the next replica message). */
  messages: Message[]
  /** Scroll stops in replica frames: [from, to, target]. */
  scroll: [number, number, number][]
  scroll0: number
  start: number
  /** [reel second, replica frame] */
  warp: [number, number][]
}

type SceneArgs = { start: number; typed?: boolean; warp: [number, number][] }

const scene = (args: SceneArgs, body: Omit<Scene, 'messages' | 'start' | 'warp'>, message: Message): Scene => ({
  ...body,
  messages: args.typed === false ? [] : [message],
  start: s(args.start),
  warp: args.warp,
})

// ─── Scenes (one per replica flow) ───────────────────────────────────────────

const FIN_MSG = MESSAGES[4]

export const financeScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <UserMessage at={T.u5.send + 2} frame={rf} lines={FIN_MSG.lines} top={FIN.u5} />
          <AssistantText frame={rf} text="Aqui está a visão financeira dos últimos 30 dias:" top={FIN.a5} window={T.a5} />
          <FinanceCard frame={rf} still />
        </>
      ),
      // KPIs → chart → back up to the alerts
      scroll: [
        [1524, 1550, FIN.card - 140],
        [1640, 1690, FIN.card + 1530 - 198],
        [1770, 1800, FIN.card + 1000 - 198],
      ],
      scroll0: FIN.u5 - 230,
    },
    FIN_MSG,
  )

const EXP_MSG: Message = { lines: ['Classifica as despesas', 'da semana'], send: 372, typing: [340, 370] }

export const expensesScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <UserMessage at={EXP_MSG.send + 2} frame={rf} lines={EXP_MSG.lines} top={EXP_TEXT_TOP - 260} />
          <AssistantText frame={rf} text="Classifiquei as despesas da semana:" top={EXP_TEXT_TOP} window={[384, 404]} />
          <ExpensesCard frame={rf} />
        </>
      ),
      scroll: [
        [418, 450, EXP_CARD_TOP - 198],
        [494, 520, EXP_CARD_TOP + EXP_H.list - BOTTOM],
        [T.review, T.review + 22, EXP_CARD_TOP - 198],
      ],
      scroll0: EXP_TEXT_TOP - 260 - 230,
    },
    EXP_MSG,
  )

const BANK_MSG = MESSAGES[6]

export const bankScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <UserMessage at={T.u7.send + 2} frame={rf} lines={BANK_MSG.lines} top={BANK.u7} />
          <AssistantText frame={rf} text="Encontrei 3 movimentações com correspondência no OTTO:" top={BANK.a7} window={T.a7} />
          <BankReconciliationCard frame={rf} />
        </>
      ),
      scroll: [
        [2198, 2226, BANK.card - 198],
        [2240, 2266, BANK.card + 900 - 198],
        [2280, 2306, BANK.card + BANK_H.list - BOTTOM],
        [T.bcConfirm, T.bcConfirm + 20, BANK.card + BANK_H.confirm - BOTTOM],
        [T.bcDone, T.bcDone + 20, BANK.card - 198],
      ],
      scroll0: BANK.u7 - 230,
    },
    BANK_MSG,
  )

const NF_MSG = MESSAGES[5]

export const invoiceScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <UserMessage at={T.u6.send + 2} frame={rf} lines={NF_MSG.lines} top={NF.u6} />
          <AssistantText frame={rf} text="Separei as vendas prontas para emissão:" top={NF.a6} window={T.a6} />
          <InvoiceBatchCard ad frame={rf} />
        </>
      ),
      scroll: [
        [1868, 1892, NF.card - 198],
        [1912, 1936, NF.card + NF_H.list - BOTTOM],
        [T.nfConfirm, T.nfConfirm + 20, NF.card + NF_H.confirm - BOTTOM],
        [T.nfDone, T.nfDone + 20, NF.card - 198],
      ],
      scroll0: NF.u6 - 230,
    },
    NF_MSG,
  )

const CREATE_MSG: Message = { lines: ['Cadastra a Nova Empresa', 'Ltda., de Recife'], send: T.u3.send, typing: T.u3.typing }

export const createClientScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <UserMessage at={T.u3.send + 2} frame={rf} lines={CREATE_MSG.lines} top={CRUD.u3} />
          <AssistantText frame={rf} text="Pronto, cadastro preenchido:" top={CRUD.a3} window={T.a3} />
          <CreateClientCard frame={rf} />
        </>
      ),
      scroll: [[1108, 1130, CRUD.create - 198]],
      scroll0: CRUD.u3 - 230,
    },
    CREATE_MSG,
  )

/** The replica updates right after listing the clients; the reel asks for the update on its own. */
const UPDATE_MSG: Message = { lines: ['Atualiza o e-mail do', 'Cliente Exemplo'], send: 840, typing: [812, 838] }

export const updateClientScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <UserMessage at={UPDATE_MSG.send + 2} frame={rf} lines={UPDATE_MSG.lines} top={CRUD.a2b - 260} />
          <AssistantText frame={rf} text="Aqui está a atualização do Cliente Exemplo, pronta para revisar:" top={CRUD.a2b} window={T.a2b} />
          <UpdateClientCard frame={rf} />
        </>
      ),
      scroll: [[880, 904, CRUD.update - 198]],
      scroll0: CRUD.a2b - 260 - 230,
    },
    UPDATE_MSG,
  )

const DELETE_MSG: Message = { lines: ['Exclui o Cliente', 'Exemplo Ltda.'], send: T.u4.send, typing: T.u4.typing }

export const deleteClientScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <UserMessage at={T.u4.send + 2} frame={rf} lines={DELETE_MSG.lines} top={CRUD.u4} />
          <AssistantText frame={rf} text="Antes de excluir, preciso da sua confirmação:" top={CRUD.a4} window={T.a4} />
          <DeleteClientCard frame={rf} />
        </>
      ),
      scroll: [[1344, 1370, CRUD.del - 150]],
      scroll0: CRUD.u4 - 230,
    },
    DELETE_MSG,
  )

// ─── Narration: one take, cut into phrases with pauses where the screen needs time ───

export type Clip = { at: number; from: number; to: number }

/** Lays out [from, to, pause after] phrases of one narration take back to back. */
export function layoutClips(phrases: [number, number, number][]): Clip[] {
  let at = 0
  return phrases.map(([from, to, pause]) => {
    const clip = { at, from, to }
    at += to - from + pause
    return clip
  })
}

export function Narration({ clips, src }: { clips: Clip[]; src: string }) {
  return (
    <>
      {clips.map((clip) => (
        <Sequence from={s(clip.at)} key={clip.from} layout="none">
          <Audio src={staticFile(src)} trimAfter={s(clip.to)} trimBefore={s(clip.from)} />
        </Sequence>
      ))}
    </>
  )
}

// ─── Player ──────────────────────────────────────────────────────────────────

function replicaFrame(sc: Scene, frame: number) {
  return interpolate(
    frame,
    sc.warp.map(([sec]) => s(sec)),
    sc.warp.map(([, r]) => r),
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
}

function scrollAt(sc: Scene, rf: number) {
  let previous = sc.scroll0
  let scroll = previous
  for (const [from, to, target] of sc.scroll) {
    scroll += p(rf, from, to, [0, 1], Easing.inOut(Easing.cubic)) * (target - previous)
    previous = target
  }
  return scroll
}

function Cta({ at, frame, pill }: { at: number; frame: number; pill: string }) {
  if (frame < at) return null
  const bg = p(frame, at, at + 12)
  const enter = (delay: number): CSSProperties => {
    const sp = pop(frame, at + delay)
    return { opacity: sp, transform: `translateY(${(1 - sp) * 24}px)` }
  }
  return (
    <AbsoluteFill style={{ alignItems: 'center', background: `rgba(255,255,255,${0.97 * bg})`, justifyContent: 'center', padding: '0 70px', textAlign: 'center' }}>
      <span style={{ color: TEXT, fontSize: 150, fontWeight: 750, letterSpacing: '-0.05em', lineHeight: '150px', ...enter(s(0.7)) }}>Otto</span>
      <span style={{ color: TEXT, fontSize: 50, fontWeight: 650, letterSpacing: '-0.02em', lineHeight: '60px', marginTop: 34, ...enter(s(1.3)) }}>Seu ERP dentro do ChatGPT</span>
      <span style={{ alignItems: 'center', background: TEXT, borderRadius: 99, color: '#fff', display: 'flex', fontSize: 32, fontWeight: 600, height: 84, marginTop: 56, padding: '0 46px', ...enter(s(2.9)) }}>{pill}</span>
    </AbsoluteFill>
  )
}

export type ChatGptScreenReelProps = {
  audio: ReactNode
  /** Reel second the closing card comes in. */
  ctaAt: number
  ctaPill: string
  /** Opening scene from the editorial reels, shown over the screen for its first `end` seconds. */
  hook: { Component: ReelScene['Component']; end: number }
  scenes: Scene[]
}

export function ChatGptScreenReel({ audio, ctaAt, ctaPill, hook, scenes }: ChatGptScreenReelProps) {
  const frame = useCurrentFrame()
  let index = 0
  scenes.forEach((sc, i) => {
    if (frame >= sc.start) index = i
  })
  const sc = scenes[index]
  const rf = replicaFrame(sc, frame)
  const scroll = scrollAt(sc, rf)
  /** Each new chat slides in over the previous one. */
  const enter = index === 0 ? 1 : p(frame, sc.start, sc.start + 10)
  /** The first chat is empty until its request is sent. */
  const firstSend = scenes[0].messages[0]?.send
  const empty = index === 0 && firstSend !== undefined ? 1 - p(rf, firstSend - 4, firstSend + 6) : 0
  const hookEnd = s(hook.end)

  return (
    <AbsoluteFill className="chatgpt-replica" style={{ background: '#fff', color: TEXT, fontFamily: FONT }}>
      <style>{FONT_CSS}</style>
      {audio}

      <div style={{ height: SCREEN_H, left: 0, overflow: 'hidden', position: 'absolute', top: 0, transform: `scale(${SCALE})`, transformOrigin: '0 0', width: 828 }}>
        {/* conversation */}
        <AdCopy.Provider value>
          <div style={{ inset: 0, opacity: enter, position: 'absolute', transform: `translateY(${-scroll + (1 - enter) * 90}px)` }}>{sc.content(rf)}</div>
        </AdCopy.Provider>
        {empty > 0 ? <span style={{ color: '#8e8e8e', fontSize: 40, fontWeight: 500, left: 0, opacity: empty, position: 'absolute', right: 0, textAlign: 'center', top: 640 }}>Em que posso ajudar?</span> : null}

        {/* fixed chrome */}
        <div style={{ background: 'linear-gradient(#fff 88%, rgba(255,255,255,0))', height: 196, left: 0, position: 'absolute', right: 0, top: 0 }} />
        <StatusBar />
        <TopBar />
        <div style={{ inset: 0, position: 'absolute', transform: `translateY(${-BOTTOM_SHIFT}px)` }}>
          <div style={{ background: 'linear-gradient(rgba(255,255,255,0), #fff 45%)', height: 230, left: 0, position: 'absolute', right: 0, top: 1580 }} />
          <Composer frame={rf} messages={sc.messages} />
          <div style={{ background: TEXT, borderRadius: 99, height: 9, left: 267, position: 'absolute', top: 1764, width: 294 }} />
        </div>
      </div>

      {frame < hookEnd ? (
        <AbsoluteFill style={{ opacity: 1 - p(frame, hookEnd - 7, hookEnd) }}>
          <ReelRoot scenes={[{ Component: hook.Component, duration: hookEnd }]} />
        </AbsoluteFill>
      ) : null}
      <Cta at={s(ctaAt)} frame={frame} pill={ctaPill} />
    </AbsoluteFill>
  )
}

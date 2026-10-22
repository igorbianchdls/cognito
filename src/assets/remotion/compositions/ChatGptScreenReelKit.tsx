import type { ReactNode } from 'react'
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'

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
} from './ChatGptVendasCardReplica'
import { OttoDesktopWindow, DESKTOP_W } from './OttoDesktopMock'
import { CtaScene, Headline, ReelRoot, Scene as EditorialScene, useFrame, useSpring } from './OttoContadoresReel'
import type { ReelScene } from './OttoContadoresReel'
import { ChatGptLogo } from './OttoNotaFiscalChatGptVideos'

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

// ─── Closing: "Isso é o Otto… Comenta OTTO" (shared narration, editorial style like the hook) ───

const OUTRO_AUDIO = 'remotion/otto-reels/chatgpt-tela-outro-narracao.mp3'
/** Outro narration: "Isso é o Otto." 0 · "Um sistema de gestão como o Conta Azul…" 1.48 · "…que funciona direto dentro do seu ChatGPT." 3.72 · "Quer saber mais? Comenta Otto…" 6.76 · end 10.72 */
const OUTRO_CTA = 6.7
export const OUTRO_LENGTH = 11.5

/** The cursor walks the sidebar while the narration says "Um sistema de gestão…"; each item opens its page. */
const DESKTOP_HOVERS = [
  { at: s(2.1), item: 0 }, // Visão geral
  { at: s(2.8), item: 1 }, // Vendas
  { at: s(3.5), item: 3 }, // Financeiro
  { at: s(4.2), item: 4 }, // Estoque
  { at: s(4.9), item: 6 }, // Cadastros
]

function OttoPitchScene({ duration }: { duration: number }) {
  const frame = useFrame()
  const logo = useSpring(s(0.5), { damping: 12, stiffness: 150 })
  const win = useSpring(s(1.1), { damping: 16, stiffness: 120 })
  const gpt = useSpring(s(5.4), { damping: 12, stiffness: 150 })
  return (
    <EditorialScene duration={duration}>
      <div style={{ display: 'flex', justifyContent: 'center', left: 0, opacity: logo, position: 'absolute', right: 0, top: 90, transform: `scale(${logo})` }}>
        <Img src={staticFile('logoOtto.svg')} style={{ height: 90, width: 210 }} />
      </div>
      <Headline size={70} start={s(1.45)} text="Um sistema de gestão como o Conta Azul…" style={{ top: 215 }} />
      <OttoDesktopWindow cursorFrom={s(1.8)} frame={frame} hovers={DESKTOP_HOVERS} style={{ left: (1080 - DESKTOP_W) / 2, opacity: win, top: 440, transform: `translateY(${(1 - win) * 80}px)` }} />
      <Headline highlight={['dentro', 'do', 'seu', 'chatgpt']} size={70} start={s(3.7)} text="que funciona direto dentro do seu ChatGPT." style={{ top: 1350 }} />
      <div style={{ display: 'flex', justifyContent: 'center', left: 0, opacity: gpt, position: 'absolute', right: 0, top: 1570, transform: `scale(${gpt})` }}>
        <ChatGptLogo height={64} />
      </div>
    </EditorialScene>
  )
}

function OttoCtaScene({ duration }: { duration: number }) {
  return <CtaScene comment="Otto" duration={duration} footer="que te mando mais informações." highlight={['mais']} keyword="OTTO" title="Quer saber mais?" titleSize={100} />
}

const OUTRO_SCENES: ReelScene[] = [
  { Component: OttoPitchScene, duration: s(OUTRO_CTA) },
  { Component: OttoCtaScene, duration: s(OUTRO_LENGTH - OUTRO_CTA) },
]

/** Closing narration + scenes, starting at reel second `at`. */
export function ChatGptOutro({ at }: { at: number }) {
  const frame = useCurrentFrame()
  return (
    <Sequence from={s(at)}>
      <Audio src={staticFile(OUTRO_AUDIO)} />
      <AbsoluteFill style={{ opacity: p(frame, s(at), s(at) + 8) }}>
        <ReelRoot scenes={OUTRO_SCENES} />
      </AbsoluteFill>
    </Sequence>
  )
}

export type ChatGptScreenReelProps = {
  audio: ReactNode
  /** Opening scene from the editorial reels, shown over the screen for its first `end` seconds. */
  hook: { Component: ReelScene['Component']; end: number }
  /** Reel second the closing ("Isso é o Otto… Comenta OTTO") starts; lasts OUTRO_LENGTH. */
  outroAt: number
  scenes: Scene[]
}

export function ChatGptScreenReel({ audio, hook, outroAt, scenes }: ChatGptScreenReelProps) {
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
      <ChatGptOutro at={outroAt} />
    </AbsoluteFill>
  )
}

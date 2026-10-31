import type { ReactNode } from 'react'
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'

import {
  AdCopy,
  AssistantText,
  BANK,
  BANK_H,
  BankReconciliationCard,
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
  NF,
  NF_H,
  StatusBar,
  T,
  TEXT,
  TopBar,
  UpdateClientCard,
  p,
} from './ChatGptVendasCardReplica'
import { MentionBubble, MentionComposer } from './ChatGptMention'
import type { MentionMessage } from './ChatGptMention'
import { ChatGptPluginFlow, PLUGIN_FLOW_LENGTH } from './ChatGptPluginFlow'
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

/** Text after the "@Otto ERP" chip, and when it is typed / sent (replica frames). */
type Message = MentionMessage

export type Scene = {
  content: (rf: number) => ReactNode
  /** Only this scene's request is typed in the composer (warp holds can reach the next replica message). */
  messages: Message[]
  /** Scroll stops in replica frames: [from, to, target]. */
  scroll: [number, number, number][]
  scroll0: number
  start: number
  /**
   * [from, until] replica frames: once the warp reaches `from` the flow plays at its own speed up to `until`
   * (taps, confirmation, done screen), and the reel waits for it before the next chat — nothing gets cut.
   */
  free?: [number, number]
  /** [reel second, replica frame] */
  warp: [number, number][]
}

type SceneArgs = { free?: [number, number]; start: number; typed?: boolean; warp: [number, number][] }

const scene = (args: SceneArgs, body: Omit<Scene, 'messages' | 'start' | 'warp'>, message: Message): Scene => ({
  ...body,
  free: args.free,
  messages: args.typed === false ? [] : [message],
  start: s(args.start),
  warp: args.warp,
})

// ─── Scenes (one per replica flow) ───────────────────────────────────────────

const FIN_MSG: Message = { lines: ['como está o financeiro', 'nos últimos 30 dias?'], send: T.u5.send, typing: T.u5.typing }

export const financeScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <MentionBubble at={T.u5.send + 2} frame={rf} lines={FIN_MSG.lines} top={FIN.u5} />
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

const EXP_MSG: Message = { lines: ['classifica as despesas', 'da semana'], send: 372, typing: [340, 370] }

export const expensesScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <MentionBubble at={EXP_MSG.send + 2} frame={rf} lines={EXP_MSG.lines} top={EXP_TEXT_TOP - 260} />
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

const BANK_MSG: Message = { lines: ['concilia o extrato do', 'banco com os lançamentos'], send: T.u7.send, typing: T.u7.typing }

export const bankScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <MentionBubble at={T.u7.send + 2} frame={rf} lines={BANK_MSG.lines} top={BANK.u7} />
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

const NF_MSG: Message = { lines: ['emite as notas fiscais', 'das vendas de hoje'], send: T.u6.send, typing: T.u6.typing }

export const invoiceScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <MentionBubble at={T.u6.send + 2} frame={rf} lines={NF_MSG.lines} top={NF.u6} />
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

const CREATE_MSG: Message = { lines: ['cadastra a Nova Empresa', 'Ltda., de Recife'], send: T.u3.send, typing: T.u3.typing }

export const createClientScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <MentionBubble at={T.u3.send + 2} frame={rf} lines={CREATE_MSG.lines} top={CRUD.u3} />
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
const UPDATE_MSG: Message = { lines: ['atualiza o e-mail do', 'Cliente Exemplo'], send: 840, typing: [812, 838] }

export const updateClientScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <MentionBubble at={UPDATE_MSG.send + 2} frame={rf} lines={UPDATE_MSG.lines} top={CRUD.a2b - 260} />
          <AssistantText frame={rf} text="Aqui está a atualização do Cliente Exemplo, pronta para revisar:" top={CRUD.a2b} window={T.a2b} />
          <UpdateClientCard frame={rf} />
        </>
      ),
      scroll: [[880, 904, CRUD.update - 198]],
      scroll0: CRUD.a2b - 260 - 230,
    },
    UPDATE_MSG,
  )

const DELETE_MSG: Message = { lines: ['exclui o Cliente', 'Exemplo Ltda.'], send: T.u4.send, typing: T.u4.typing }

export const deleteClientScene = (args: SceneArgs) =>
  scene(
    args,
    {
      content: (rf) => (
        <>
          <MentionBubble at={T.u4.send + 2} frame={rf} lines={DELETE_MSG.lines} top={CRUD.u4} />
          <AssistantText frame={rf} text="Antes de excluir, preciso da sua confirmação:" top={CRUD.a4} window={T.a4} />
          <DeleteClientCard frame={rf} />
        </>
      ),
      scroll: [[1344, 1370, CRUD.del - 150]],
      scroll0: CRUD.u4 - 230,
    },
    DELETE_MSG,
  )

/** "Primeiro, instala o plugin do Otto…" — shared take, played over the plugin scene. */
const PLUGIN_AUDIO = 'remotion/otto-reels/chatgpt-tela-plugin-narracao.mp3'
const PLUGIN_SPEECH = 8.4

// ─── Narration: one take, cut into phrases with pauses where the screen needs time ───

export type Clip = { at: number; from: number; src?: string; to: number }

/** Lays out [from, to, pause after, other take?] phrases back to back (default take: the reel's `src`). */
export function layoutClips(phrases: [number, number, number, string?][]): Clip[] {
  let at = 0
  return phrases.map(([from, to, pause, src]) => {
    const clip = { at, from, src, to }
    at += to - from + pause
    return clip
  })
}

// ─── Timeline: scenes are authored on their own clock; the plugin scene and the
// "let the flow finish" holds are inserted into it (narration and outro move with them) ───

type Insert = { at: number; kind: 'hold' | 'plugin'; length: number; scene: number }

/** Reel second (scene clock) at which a scene's warp reaches replica frame `rf`. */
function warpTime(sc: Scene, rf: number) {
  const w = sc.warp
  for (let i = 1; i < w.length; i++) {
    const [t0, r0] = w[i - 1]
    const [t1, r1] = w[i]
    if (rf <= r1 && r1 > r0) return t0 + ((Math.max(rf, r0) - r0) / (r1 - r0)) * (t1 - t0)
  }
  return w[w.length - 1][0]
}

function inserts(scenes: Scene[], outroAt: number, plugin?: { at: number }): Insert[] {
  const list: Insert[] = plugin ? [{ at: plugin.at, kind: 'plugin', length: PLUGIN_FLOW_LENGTH, scene: 0 }] : []
  scenes.forEach((sc, i) => {
    if (!sc.free) return
    const boundary = i + 1 < scenes.length ? scenes[i + 1].start / 30 : outroAt
    const end = warpTime(sc, sc.free[0]) + (sc.free[1] - sc.free[0]) / 30
    if (end - boundary > 0.05) list.push({ at: boundary, kind: 'hold', length: end - boundary, scene: i })
  })
  return list.sort((a, b) => a.at - b.at)
}

/** Reel second for a second of the scene clock (inserts at or before it push it later). */
const later = (list: Insert[], t: number) => t + list.filter((i) => i.at <= t).reduce((sum, i) => sum + i.length, 0)
const startOf = (list: Insert[], ins: Insert) => ins.at + list.filter((i) => i.at < ins.at).reduce((sum, i) => sum + i.length, 0)

export function screenReelDuration(scenes: Scene[], outroAt: number, plugin?: { at: number }) {
  return s(later(inserts(scenes, outroAt, plugin), outroAt) + OUTRO_LENGTH)
}

/** Narration clips split around the inserts, plus the plugin take during the plugin scene. */
function NarrationTrack({ clips, list, src }: { clips: Clip[]; list: Insert[]; src: string }) {
  const pieces: Clip[] = []
  for (const clip of clips) {
    const end = clip.at + clip.to - clip.from
    const cuts = list.map((i) => i.at).filter((t) => t > clip.at + 0.001 && t < end - 0.001)
    const bounds = [clip.at, ...cuts, end]
    for (let k = 0; k < bounds.length - 1; k++) {
      pieces.push({ at: later(list, bounds[k]), from: clip.from + bounds[k] - clip.at, src: clip.src ?? src, to: clip.from + bounds[k + 1] - clip.at })
    }
  }
  for (const ins of list) if (ins.kind === 'plugin') pieces.push({ at: startOf(list, ins), from: 0, src: PLUGIN_AUDIO, to: PLUGIN_SPEECH })
  return (
    <>
      {/* A cut landing within a frame of a clip edge leaves a zero-length piece, which <Audio> rejects. */}
      {pieces.filter((piece) => s(piece.to) > s(piece.from)).map((piece) => (
        <Sequence from={s(piece.at)} key={`${piece.src}-${piece.from}`} layout="none">
          <Audio src={staticFile(piece.src ?? src)} trimAfter={s(piece.to)} trimBefore={s(piece.from)} />
        </Sequence>
      ))}
    </>
  )
}

// ─── Player ──────────────────────────────────────────────────────────────────

function replicaFrame(sc: Scene, frame: number) {
  if (sc.free) {
    const from = s(warpTime(sc, sc.free[0]))
    if (frame >= from) return Math.min(sc.free[1], sc.free[0] + frame - from)
  }
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
export function ChatGptOutro({ at, silent }: { at: number; silent?: boolean }) {
  const frame = useCurrentFrame()
  return (
    <Sequence from={s(at)}>
      {silent ? null : <Audio src={staticFile(OUTRO_AUDIO)} />}
      <AbsoluteFill style={{ opacity: p(frame, s(at), s(at) + 8) }}>
        <ReelRoot scenes={OUTRO_SCENES} />
      </AbsoluteFill>
    </Sequence>
  )
}

export type ChatGptScreenReelProps = {
  /** One narration take laid out with `layoutClips` on the scene clock. */
  /** Omit for a silent cut (no narration, closing without its voice). */
  narration?: { clips: Clip[]; src: string }
  /** Opening scene from the editorial reels, shown over the screen for its first `end` seconds. */
  hook: { Component: ReelScene['Component']; end: number }
  /** Reel second the closing ("Isso é o Otto… Comenta OTTO") starts; lasts OUTRO_LENGTH. */
  outroAt: number
  /** Inserts the plugin scene at this second: everything after it (scenes, outro) plays PLUGIN_FLOW_LENGTH later. */
  plugin?: { at: number }
  scenes: Scene[]
}

export function ChatGptScreenReel({ hook, narration, outroAt, plugin, scenes }: ChatGptScreenReelProps) {
  const raw = useCurrentFrame()
  const list = inserts(scenes, outroAt, plugin)
  // where are we: an insert (plugin scene / hold) or the scenes' own clock
  let shiftBy = 0
  let active: Insert | undefined
  let elapsed = 0
  for (const ins of list) {
    const start = ins.at + shiftBy
    if (raw / 30 < start) break
    if (raw / 30 < start + ins.length) {
      active = ins
      elapsed = raw / 30 - start
      break
    }
    shiftBy += ins.length
  }
  const inPlugin = active?.kind === 'plugin'
  /** Frame on the scenes' clock; during a hold the finishing scene keeps playing past its boundary. */
  const frame = active ? s(active.at) + (active.kind === 'hold' ? elapsed * 30 : 0) : raw - s(shiftBy)
  const outro = later(list, outroAt)
  let index = 0
  scenes.forEach((sc, i) => {
    if (frame >= sc.start) index = i
  })
  if (active?.kind === 'hold') index = active.scene
  const sc = scenes[index]
  const rf = replicaFrame(sc, frame)
  const scroll = scrollAt(sc, rf)
  /** Each new chat slides in over the previous one. */
  const enter = index === 0 || active?.kind === 'hold' ? 1 : p(frame, sc.start, sc.start + 10)
  /** The first chat is empty until its request is sent. */
  const firstSend = scenes[0].messages[0]?.send
  const empty = index === 0 && firstSend !== undefined ? 1 - p(rf, firstSend - 4, firstSend + 6) : 0
  const hookEnd = s(hook.end)

  return (
    <AbsoluteFill className="chatgpt-replica" style={{ background: '#fff', color: TEXT, fontFamily: FONT }}>
      <style>{FONT_CSS}</style>
      {narration ? <NarrationTrack clips={narration.clips} list={list} src={narration.src} /> : null}

      <div style={{ height: SCREEN_H, left: 0, overflow: 'hidden', position: 'absolute', top: 0, transform: `scale(${SCALE})`, transformOrigin: '0 0', width: 828 }}>
        {inPlugin ? (
          <ChatGptPluginFlow screenH={SCREEN_H} t={elapsed} />
        ) : (
          <>
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
              <MentionComposer frame={rf} message={sc.messages[0]} />
              <div style={{ background: TEXT, borderRadius: 99, height: 9, left: 267, position: 'absolute', top: 1764, width: 294 }} />
            </div>
          </>
        )}
      </div>

      {raw < hookEnd ? (
        <AbsoluteFill style={{ opacity: 1 - p(raw, hookEnd - 7, hookEnd) }}>
          <ReelRoot scenes={[{ Component: hook.Component, duration: hookEnd }]} />
        </AbsoluteFill>
      ) : null}
      <ChatGptOutro at={outro} silent={!narration} />
    </AbsoluteFill>
  )
}

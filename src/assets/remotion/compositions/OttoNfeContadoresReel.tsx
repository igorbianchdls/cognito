import {
  ContadoresHookScene,
  ExpensesScene,
  Headline,
  IntegrationScene,
  NoSpreadsheetScene,
  ReconciliationScene,
  ReelRoot,
  type ReelScene,
  Scene,
  sceneDuration,
  type SplitVideo,
  syncToNarration,
  WhatsAppScene,
} from './OttoContadoresReel'
import { InvoiceConfirmScene, makeClaudeAlsoScene, makePromptScene, makeRevealScene, WhatsAppDeliveryScene } from './OttoNotaFiscalChatGptVideos'

// Reel "Essa IA está deixando os contadores preocupados" (1080×1920, ~56 s). The presenter's video (picture, captions
// and audio) is kept as recorded, moved 160 px down. The band above it (770 px) is rebuilt with the editorial UI of the
// "Agora o ChatGPT pode…" reels: paper + grid, serif headlines with coral italics, the "01 / 03" tracker and the same
// cards (ChatGPT window, invoice, WhatsApp, reconciliation…). Each scene starts on the sentence it illustrates (times
// read from the burned-in captions) and is scaled/lifted to fit the band. All data is made up.

const VIDEO = 'remotion/otto-reels/nfe-contadores.mp4'
/** The presenter's part of the original video starts at y=610; it is shown 160 px lower, from y=770. */
const BAND_H = 770
const SOURCE_TOP = 610

const TASKS = ['Conciliação bancária', 'Despesas', 'Contas e cobranças']

function makeStatement(text: string, highlight: string[], marks: { at: number; kind: 'strike' | 'underline'; word: string }[] = []) {
  return function StatementScene({ duration }: { duration: number }) {
    return <Scene duration={duration}><Headline highlight={highlight} marks={marks} size={96} start={0} stagger={2} text={text} style={{ top: 720 }} /></Scene>
  }
}

const scenes: ReelScene[] = [
  { Component: ContadoresHookScene, duration: 54 },
  { Component: makeRevealScene([], 'O nome dela é', 'Um sistema de gestão que funciona dentro do ChatGPT e do Claude.', ['chatgpt', 'claude']), duration: 72 },
  { Component: makeClaudeAlsoScene('Emite notas fiscais direto no ChatGPT ou no Claude.'), duration: 144 },
  { Component: makePromptScene('Basta pedir:', 'Emite uma nota de R$ 4.000 pra Aurora Tecnologia'), duration: 180 },
  { Component: InvoiceConfirmScene, duration: 130 },
  { Component: WhatsAppDeliveryScene, duration: 84 },
  { Component: makeStatement('Mas não faz só isso.', ['isso']), duration: 48 },
  { Component: ({ duration }) => <ReconciliationScene duration={duration} index={0} tasks={TASKS} title="Concilia as movimentações bancárias." />, duration: 60 },
  { Component: ({ duration }) => <ExpensesScene duration={duration} index={1} tasks={TASKS} title="Classifica as despesas." />, duration: 60 },
  { Component: ({ duration }) => <WhatsAppScene duration={duration} index={2} tasks={TASKS} title="Controla as contas e envia cobranças." />, duration: 102 },
  { Component: makeStatement('Acompanha quem tá em atraso e as obrigações fiscais.', ['atraso', 'fiscais']), duration: 84 },
  { Component: makeStatement('Descobre se dá pra pagar menos imposto. Sempre dentro da lei.', ['menos'], [{ at: 40, kind: 'underline', word: 'lei' }]), duration: 120 },
  { Component: IntegrationScene, duration: 120 },
  { Component: NoSpreadsheetScene, duration: 192 },
  { Component: makeRevealScene([], 'Tudo integrado no', 'Administre sua empresa apenas conversando com a IA.', ['conversando']), duration: 246 },
]

const CUES = [0, 1.8, 4.2, 9.0, 15.0, 18.6, 21.4, 23.0, 24.8, 26.8, 30.2, 33.0, 37.0, 41.0, 47.4]
const END = 55.65
const SCENES = syncToNarration(scenes, CUES, END)
export const OTTO_NFE_CONTADORES_DURATION = sceneDuration(SCENES)

/** Per scene: how much it is lifted (px, after scaling) and scaled so its content fits the 770 px band. */
// Measured from each scene's content on the full canvas (top/bottom of what is drawn), fitted into the band with
// 80 px free at the top (Instagram's header sits there) and 30 px above the video.
export const FIT: { offsets: number[]; scales: number[] } = {
  offsets: [508, 422, 434, 33, 31, 2, 368, -4, -5, -12, 494, 500, 103, 83, 400],
  scales: [1.0, 0.976, 1.0, 0.559, 0.571, 0.471, 1.0, 0.509, 0.502, 0.453, 1.0, 1.0, 0.569, 0.532, 1.0],
}

const split: SplitVideo = {
  endAt: 9999,
  height: 1920 - BAND_H,
  // The box shows 1150 px of the 1920 px source starting at y=610: offset 610 of the 770 px of slack.
  objectPosition: `center ${(SOURCE_TOP / (1920 - (1920 - BAND_H))) * 100}%`,
  offsets: FIT.offsets,
  scales: FIT.scales,
  src: VIDEO,
}

export function OttoNfeContadoresReel() {
  return <ReelRoot audio={VIDEO} scenes={SCENES} split={split} />
}

/** Same scenes on the full 1920 px canvas, without the video: used to measure each scene's content. */
export function OttoNfeContadoresScenesOnly() {
  return <ReelRoot scenes={SCENES} />
}

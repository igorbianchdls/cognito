import {
  ContadoresHookScene,
  ExpensesScene,
  Headline,
  IntegrationScene,
  InvoiceScene,
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
import { InvoiceConfirmScene, makeClaudeAlsoScene, makeHookScene, makePromptScene, makeRevealScene, WhatsAppDeliveryScene } from './OttoNotaFiscalChatGptVideos'

// Presenter reels (1080×1920): the presenter's recording stays as it is (picture, burned-in captions and audio),
// moved 160 px down, and the band above it (770 px) is rebuilt with the editorial UI of the "Agora o ChatGPT pode…"
// reels — the same scenes and cards, each starting on the sentence it illustrates (times read from the captions) and
// scaled/lifted so its content fits the band. All data in the scenes is made up.

/** The presenter's part of each recording starts at y≈610 (in 1080×1920); it is shown from y=770. */
const BAND_H = 770
const SOURCE_TOP = 610

export type Fit = { offsets: number[]; scales: number[] }

/** Builds a presenter reel from its video, its scenes with their start times, the end time and each scene's fit. */
export function makePresenterReel({ cues, end, fit, scenes, video }: { cues: number[]; end: number; fit?: Fit; scenes: ReelScene[]; video: string }) {
  const timeline = syncToNarration(scenes, cues, end)
  const split: SplitVideo = {
    endAt: 9999,
    height: 1920 - BAND_H,
    // The box shows 1150 px of the (1080×1920-scaled) source starting at y=610: 610 of the 770 px of slack.
    objectPosition: `center ${(SOURCE_TOP / BAND_H) * 100}%`,
    offsets: fit?.offsets ?? scenes.map(() => 0),
    scales: fit?.scales ?? scenes.map(() => 1),
    src: video,
  }
  return {
    duration: sceneDuration(timeline),
    Reel: function PresenterReel() {
      return <ReelRoot audio={video} scenes={timeline} split={split} />
    },
    /** The scenes alone on the full 1920 px canvas, used to measure their content. */
    ScenesOnly: function PresenterScenesOnly() {
      return <ReelRoot scenes={timeline} />
    },
  }
}

// ─── Shared scenes ───────────────────────────────────────────────────────────

const TASKS = ['Conciliação bancária', 'Despesas', 'Contas e cobranças']

export function makeStatement(text: string, highlight: string[], marks: { at: number; kind: 'strike' | 'underline'; word: string }[] = []) {
  return function StatementScene({ duration }: { duration: number }) {
    return <Scene duration={duration}><Headline highlight={highlight} marks={marks} size={96} start={0} stagger={2} text={text} style={{ top: 720 }} /></Scene>
  }
}

const S = {
  more: (duration: number): ReelScene => ({ Component: makeStatement('Mas não faz só isso.', ['isso']), duration }),
  reconciliation: (duration: number): ReelScene => ({ Component: ({ duration: d }) => <ReconciliationScene duration={d} index={0} tasks={TASKS} title="Concilia as movimentações bancárias." />, duration }),
  expenses: (duration: number): ReelScene => ({ Component: ({ duration: d }) => <ExpensesScene duration={d} index={1} tasks={TASKS} title="Classifica as despesas." />, duration }),
  billing: (duration: number): ReelScene => ({ Component: ({ duration: d }) => <WhatsAppScene duration={d} index={2} tasks={TASKS} title="Controla as contas e envia cobranças." />, duration }),
  late: (duration: number): ReelScene => ({ Component: makeStatement('Acompanha quem tá em atraso e as obrigações fiscais.', ['atraso', 'fiscais']), duration }),
  tax: (duration: number): ReelScene => ({ Component: makeStatement('Descobre se dá pra pagar menos imposto. Sempre dentro da lei.', ['menos'], [{ at: 40, kind: 'underline', word: 'lei' }]), duration }),
  integration: (duration: number): ReelScene => ({ Component: IntegrationScene, duration }),
  automatic: (duration: number): ReelScene => ({ Component: NoSpreadsheetScene, duration }),
  closing: (duration: number): ReelScene => ({ Component: makeRevealScene([], 'Tudo integrado no', 'Administre sua empresa apenas conversando com a IA.', ['conversando']), duration }),
  invoice: (title: string, duration: number): ReelScene => ({ Component: ({ duration: d }) => <InvoiceScene duration={d} tasks={[]} title={title} />, duration }),
  delivery: (duration: number): ReelScene => ({ Component: WhatsAppDeliveryScene, duration }),
  behind: (duration: number): ReelScene => ({ Component: makeRevealScene([], 'O sistema por trás disso se chama', 'Um sistema de gestão brasileiro que roda dentro do ChatGPT e do Claude.', ['chatgpt', 'claude']), duration }),
}

// Scene `duration`s match their on-screen time, so the animations play at their authored speed and then hold.

// ─── 1 · "Agora você pode emitir notas fiscais…" (nota fiscal, 60 s) ─────────

export const NFE_CHATGPT = makePresenterReel({
  video: 'remotion/otto-reels/nfe-chat-ia.mp4',
  // Measured from each scene's content on the full canvas (ScenesOnly), so it fits the band below Instagram's header.
  fit: { offsets: [400, 494, 33, 31, 2, 422, 368, -4, -5, -12, 494, 500, 103, 83, 400], scales: [1, 1, 0.559, 0.571, 0.471, 0.976, 1, 0.509, 0.502, 0.453, 1, 1, 0.569, 0.532, 1] },
  cues: [0, 4.8, 9.2, 15.8, 19.2, 22.2, 26.0, 27.2, 29.2, 31.0, 34.6, 37.2, 41.8, 45.8, 53.2],
  end: 59.85,
  scenes: [
    { Component: makeHookScene('Agora você pode emitir notas fiscais pelo ChatGPT e pelo Claude.', ['notas', 'fiscais'], 84, ''), duration: 144 },
    { Component: makeStatement('Sem complicação. Sem entrar no site da prefeitura.', [], [{ at: 20, kind: 'strike', word: 'complicação' }, { at: 40, kind: 'strike', word: 'prefeitura' }]), duration: 132 },
    { Component: makePromptScene('Basta pedir:', 'Emite uma nota de R$ 4.000 pra Aurora Tecnologia'), duration: 198 },
    { Component: InvoiceConfirmScene, duration: 130 },
    S.delivery(90),
    S.behind(114),
    S.more(36),
    S.reconciliation(60),
    S.expenses(54),
    S.billing(108),
    S.late(78),
    S.tax(138),
    S.integration(120),
    S.automatic(222),
    S.closing(200),
  ],
})

// ─── 2 · "Essa IA está deixando os contadores preocupados" (finanças, 48 s) ──

export const FINANCAS_CONTADORES = makePresenterReel({
  video: 'remotion/otto-reels/financas-contadores.mp4',
  // Measured from each scene's content on the full canvas (ScenesOnly), so it fits the band below Instagram's header.
  fit: { offsets: [506, 400, 84, 2, 372, -4, -5, -12, 494, 500, 103, 83, 434, 400], scales: [1, 1, 0.6, 0.471, 1, 0.509, 0.502, 0.453, 1, 1, 0.569, 0.532, 1, 1] },
  cues: [0, 2.4, 9.0, 12.0, 15.0, 16.0, 17.8, 19.8, 23.0, 26.0, 30.0, 34.0, 40.4, 44.0],
  end: 48.45,
  scenes: [
    { Component: ContadoresHookScene, duration: 72 },
    { Component: makeRevealScene([], 'O nome dela é', 'Automatiza todo o financeiro e a contabilidade da sua empresa.', ['financeiro', 'contabilidade']), duration: 198 },
    S.invoice('Emite notas fiscais e preenche os dados.', 90),
    S.delivery(90),
    S.more(30),
    S.reconciliation(54),
    S.expenses(60),
    S.billing(96),
    S.late(90),
    S.tax(120),
    S.integration(120),
    S.automatic(192),
    { Component: makeClaudeAlsoScene('Tudo integrado ao seu ChatGPT ou Claude.'), duration: 108 },
    S.closing(134),
  ],
})

// ─── 3 · "A partir de agora, o ChatGPT e o Claude podem operar o financeiro" (finanças, 50 s)

export const FINANCAS_CHATGPT = makePresenterReel({
  video: 'remotion/otto-reels/financas-chatgpt.mp4',
  // Measured from each scene's content on the full canvas (ScenesOnly), so it fits the band below Instagram's header.
  fit: { offsets: [342, 84, 2, 422, 368, -4, -5, -12, 494, 500, 103, 83, 400], scales: [0.75, 0.6, 0.471, 0.976, 1, 0.509, 0.502, 0.453, 1, 1, 0.569, 0.532, 1] },
  cues: [0, 5.4, 7.6, 12.0, 15.8, 17.0, 18.8, 20.6, 23.6, 26.8, 31.4, 35.6, 43.0],
  end: 50.15,
  scenes: [
    { Component: makeHookScene('A partir de agora, o ChatGPT e o Claude podem operar o financeiro da sua empresa.', ['financeiro'], 78, 'Com você.'), duration: 162 },
    S.invoice('A IA emite notas fiscais e preenche os dados.', 66),
    S.delivery(132),
    S.behind(114),
    S.more(36),
    S.reconciliation(54),
    S.expenses(54),
    S.billing(90),
    S.late(96),
    S.tax(138),
    S.integration(126),
    S.automatic(222),
    S.closing(216),
  ],
})

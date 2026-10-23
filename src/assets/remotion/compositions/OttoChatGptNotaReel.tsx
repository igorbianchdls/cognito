import { bankScene, ChatGptScreenReel, expensesScene, financeScene, invoiceScene, layoutClips, screenReelDuration } from './ChatGptScreenReelKit'
import type { Scene } from './ChatGptScreenReelKit'
import { makeHookScene } from './OttoNotaFiscalChatGptVideos'

/**
 * Reel: "Agora o ChatGPT pode emitir suas notas fiscais" — the illustration is the ChatGPT screen itself.
 * Replica flows are replayed through time-warps so every action lands on the narration
 * (part 1: invoices; part 2: "E não faz só isso" → expenses, bank reconciliation, dashboard).
 */

/** Part 2 narration starts where part 1 is cut (right before its own "Isso é o Otto"). */
const PART2 = 18.0
const g = (sec: number) => PART2 + sec

/** Part 2 is cut after "Tudo isso dentro do chat."; the shared closing ("Isso é o Otto… Comenta OTTO") follows. */
const OUTRO_AT = g(29.4)

const SCENES: Scene[] = [
  invoiceScene({
    free: [2058, 2110],
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
  }),
  expensesScene({
    free: [634, 690],
    start: g(1.2),
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
  }),
  bankScene({
    free: [2408, 2480],
    start: g(10.75),
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
  }),
  financeScene({
    start: g(18.0),
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
  }),
]

const PLUGIN = { at: 3.5 }
export const OTTO_CHATGPT_NOTA_REEL_DURATION = screenReelDuration(SCENES, OUTRO_AT, PLUGIN)

const VO1 = 'remotion/otto-reels/chatgpt-nota-narracao.mp3'
const VO2 = 'remotion/otto-reels/chatgpt-nota-narracao-2.mp3'
const CLIPS = layoutClips([
  [0, PART2, 0], // part 1: hook … "sem abrir sistema nenhum."
  [0, 29.26, 0, VO2], // part 2 up to "Tudo isso dentro do chat."
])

/** Same opening as the other "Agora o ChatGPT pode…" reels; the ChatGPT screen takes over after it. */
const HookScene = makeHookScene('Agora o ChatGPT pode emitir suas notas fiscais.', ['notas', 'fiscais'], 88, '')

export function OttoChatGptNotaReel() {
  return <ChatGptScreenReel hook={{ Component: HookScene, end: 3.5 }} narration={{ clips: CLIPS, src: VO1 }} outroAt={OUTRO_AT} plugin={PLUGIN} scenes={SCENES} />
}

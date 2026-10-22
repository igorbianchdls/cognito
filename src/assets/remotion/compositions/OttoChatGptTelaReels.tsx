import {
  bankScene,
  ChatGptScreenReel,
  createClientScene,
  deleteClientScene,
  expensesScene,
  financeScene,
  invoiceScene,
  layoutClips,
  Narration,
  OUTRO_LENGTH,
  s,
  updateClientScene,
} from './ChatGptScreenReelKit'
import { ContadoresHookScene } from './OttoContadoresReel'
import { makeHookScene } from './OttoNotaFiscalChatGptVideos'

/**
 * Two more "ChatGPT screen" reels. Each narration is one take, cut into phrases with pauses
 * so every flow has time to play on screen. Warp keys are reel seconds (phrase start + word offset).
 */

// ─── A · "Agora o ChatGPT pode cuidar do financeiro da sua empresa." ──────────────

const A_AUDIO = 'remotion/otto-reels/chatgpt-financeiro-narracao.mp3'
/** [from, to, pause after] in the narration take. */
const A_CLIPS = layoutClips([
  [0, 14.42, 0.4], // hook · "eu pergunto como tá o financeiro… saldo, entradas, saídas, gráfico… alertas"
  [14.42, 17.16, 3.3], // "Tem despesa sem categoria? Ele classifica."
  [17.16, 20.16, 3.0], // "Extrato do banco? Ele concilia com os lançamentos."
  [20.16, 22.1, 2.5], // "Cliente novo? Ele cadastra."
  [22.1, 24.82, 2.0], // "Mudou o e-mail? É só pedir, que ele atualiza."
  [24.82, 26.74, 3.0], // "Vendeu? Ele emite a nota."
  [26.74, 29.02, 0], // "E você só confere e confirma." (then the shared outro)
])

const A_OUTRO = 43.4
export const OTTO_CHATGPT_FINANCEIRO_TELA_DURATION = s(A_OUTRO + OUTRO_LENGTH)

export function OttoChatGptFinanceiroTelaReel() {
  return (
    <ChatGptScreenReel
      audio={<Narration clips={A_CLIPS} src={A_AUDIO} />}
      hook={{ Component: makeHookScene('Agora o ChatGPT pode cuidar do financeiro da sua empresa.', ['financeiro'], 88, ''), end: 3.7 }}
      outroAt={A_OUTRO}
      scenes={[
        financeScene({
          start: 0,
          warp: [
            [0, 1430],
            [4.8, 1440], // "eu pergunto como tá o financeiro" → typing
            [6.6, 1466],
            [6.8, 1470],
            [7.0, 1500],
            [7.5, 1522],
            [7.7, 1526],
            [8.56, 1536], // "saldo"
            [9.12, 1542], // "entradas"
            [9.84, 1548], // "saídas"
            [10.4, 1600],
            [10.6, 1640], // "o gráfico do período"
            [11.1, 1690],
            [12.0, 1762],
            [12.15, 1770], // "e os alertas"
            [12.8, 1800],
            [14.82, 1812],
          ],
        }),
        expensesScene({
          start: 14.82,
          warp: [
            [14.82, 330],
            [14.9, 340], // "Tem despesa sem categoria?" → typing
            [15.9, 370],
            [16.05, 372],
            [16.3, 396],
            [16.6, 416], // "Ele classifica." → categories fill in
            [16.8, 428],
            [18.0, 494],
            [18.3, 520],
            [18.5, 532], // review
            [18.7, 544],
            [19.5, 600],
            [19.7, 622], // confirm
            [19.9, 634], // done
            [20.86, 680],
          ],
        }),
        bankScene({
          start: 20.86,
          warp: [
            [20.86, 2100],
            [20.95, 2110], // "Extrato do banco?" → typing
            [21.9, 2138],
            [22.05, 2142],
            [22.3, 2172],
            [22.6, 2198], // "Ele concilia com os lançamentos."
            [22.9, 2226],
            [24.4, 2280],
            [24.7, 2306],
            [24.9, 2318], // review
            [25.05, 2330],
            [25.9, 2396], // confirm
            [26.1, 2408], // done
            [26.86, 2440],
          ],
        }),
        createClientScene({
          start: 26.86,
          warp: [
            [26.86, 1025],
            [26.95, 1030], // "Cliente novo?" → typing
            [27.7, 1056],
            [27.85, 1060],
            [28.1, 1090],
            [28.3, 1104],
            [28.4, 1108], // "Ele cadastra." → form fills in
            [29.9, 1180],
            [30.05, 1186],
            [30.25, 1198], // done
            [31.3, 1232],
          ],
        }),
        updateClientScene({
          start: 31.3,
          warp: [
            [31.3, 808],
            [31.4, 812], // "Mudou o e-mail?" → typing
            [32.3, 838],
            [32.45, 840],
            [32.6, 846],
            [33.0, 876],
            [33.1, 880], // "É só pedir, que ele atualiza."
            [34.6, 948],
            [34.9, 960],
            [35.1, 972], // done
            [36.02, 1004],
          ],
        }),
        invoiceScene({
          start: 36.02,
          warp: [
            [36.02, 1776],
            [36.1, 1780], // "Vendeu?" → typing
            [37.0, 1808],
            [37.15, 1812],
            [37.4, 1838],
            [37.8, 1866], // "Ele emite a nota."
            [38.1, 1878],
            [39.4, 1912],
            [40.4, 1936],
            [41.0, 1950],
            [41.6, 1964], // "confere" → review
            [41.8, 1976],
            [42.4, 2030],
            [42.6, 2046], // "confirma" → issue
            [42.8, 2058], // done
            [A_OUTRO, 2090],
          ],
        }),
      ]}
    />
  )
}

// ─── B · "Essa IA tá deixando os contadores brasileiros preocupados." ─────────────

const B_AUDIO = 'remotion/otto-reels/chatgpt-contadores-narracao.mp3'
const B_CLIPS = layoutClips([
  [0, 12.08, 2.4], // hook · "Olha o que ela faz… classificar as despesas… categoria de cada uma."
  [12.08, 14.56, 2.6], // "Concilia o extrato do banco sozinha."
  [14.56, 17.04, 2.6], // "Emite as notas fiscais das vendas de hoje."
  [17.04, 18.68, 2.4], // "Cadastra cliente novo…"
  [18.68, 19.94, 2.4], // "atualiza o de outro…"
  [19.94, 23.4, 1.5], // "e se precisar excluir, ela ainda pede sua confirmação antes."
  [23.4, 30.7, 0], // "E no fim, te mostra o financeiro inteiro… agora é uma conversa." (then the shared outro)
])

const B_OUTRO = 44.8
export const OTTO_CHATGPT_CONTADORES_TELA_DURATION = s(B_OUTRO + OUTRO_LENGTH)

export function OttoChatGptContadoresTelaReel() {
  return (
    <ChatGptScreenReel
      audio={<Narration clips={B_CLIPS} src={B_AUDIO} />}
      hook={{ Component: ContadoresHookScene, end: 3.85 }}
      outroAt={B_OUTRO}
      scenes={[
        expensesScene({
          start: 0,
          warp: [
            [0, 320],
            [6.9, 340], // "Eu peço pra classificar as despesas da semana" → typing
            [9.4, 370],
            [9.55, 372],
            [9.75, 396],
            [10.0, 416],
            [10.2, 428], // "e ela já sugere a categoria de cada uma"
            [11.9, 494],
            [12.3, 520],
            [12.6, 532], // review
            [12.8, 544],
            [13.6, 600],
            [13.8, 622], // confirm
            [14.0, 634], // done
            [14.48, 660],
          ],
        }),
        bankScene({
          start: 14.48,
          warp: [
            [14.48, 2105],
            [14.55, 2110], // "Concilia o extrato do banco" → typing
            [15.3, 2138],
            [15.45, 2142],
            [15.7, 2172],
            [16.0, 2198], // "sozinha."
            [16.3, 2226],
            [17.6, 2280],
            [17.9, 2306],
            [18.1, 2318], // review
            [18.25, 2330],
            [19.0, 2396], // confirm
            [19.2, 2408], // done
            [19.56, 2430],
          ],
        }),
        invoiceScene({
          start: 19.56,
          warp: [
            [19.56, 1776],
            [19.65, 1780], // "Emite as notas fiscais das vendas de hoje" → typing
            [20.5, 1808],
            [20.65, 1812],
            [20.85, 1838],
            [21.2, 1866],
            [21.4, 1878],
            [22.3, 1912],
            [22.7, 1936],
            [22.95, 1950],
            [23.15, 1964], // review
            [23.3, 1976],
            [23.95, 2030],
            [24.1, 2046], // issue
            [24.25, 2058], // done
            [24.64, 2080],
          ],
        }),
        createClientScene({
          start: 24.64,
          warp: [
            [24.64, 1025],
            [24.7, 1030], // "Cadastra cliente novo…" → typing
            [25.4, 1056],
            [25.55, 1060],
            [25.75, 1090],
            [25.95, 1104],
            [26.05, 1108],
            [27.5, 1180],
            [27.65, 1186],
            [27.85, 1198], // done
            [28.68, 1230],
          ],
        }),
        updateClientScene({
          start: 28.68,
          warp: [
            [28.68, 808],
            [28.75, 812], // "atualiza o de outro…" → typing
            [29.5, 838],
            [29.65, 840],
            [29.8, 846],
            [30.1, 876],
            [30.2, 880],
            [31.4, 948],
            [31.6, 960],
            [31.8, 972], // done
            [32.34, 1000],
          ],
        }),
        deleteClientScene({
          start: 32.34,
          warp: [
            [32.34, 1252],
            [32.4, 1256], // "e se precisar excluir" → typing
            [33.2, 1282],
            [33.35, 1286],
            [33.6, 1316],
            [34.0, 1340],
            [34.1, 1344], // "ela ainda pede sua confirmação antes."
            [35.4, 1380], // confirmation checked
            [35.9, 1394],
            [36.4, 1408], // EXCLUIR typed → button enabled
            [37.3, 1420],
          ],
        }),
        financeScene({
          start: 37.3,
          typed: false,
          warp: [
            [37.3, 1496], // "E no fim, te mostra o financeiro inteiro"
            [37.6, 1522],
            [37.7, 1526],
            [39.8, 1536], // "saldo"
            [40.2, 1560],
            [40.5, 1640], // "gráfico"
            [41.0, 1690],
            [41.9, 1762],
            [42.0, 1770], // "alertas"
            [42.6, 1800],
            [B_OUTRO, 1812],
          ],
        }),
      ]}
    />
  )
}

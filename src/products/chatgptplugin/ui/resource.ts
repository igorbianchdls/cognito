import { cardStyles } from './styles/cards'
import { commonScript } from './components/common'
import { bridgeScript } from './bridge/mcpApps'
import { viewsScript } from './cards/views'
import { listCardScript } from './cards/lista'
import { detailsCardScript } from './cards/detalhes'
import { analysisCardScript } from './cards/analise'
import { reviewCardScript } from './cards/revisao'
import { resultCardScript } from './cards/resultado'
import { operationLabels } from '../actions/labels'
import { fieldLabels } from '../extensions/fieldLabels'
import { actionTools,toolCallForProposal } from '../actions/catalog'

export const CARDS_URI='ui://chatgptplugin/cards/v2.html'
// Tool e tipo usados para gerar uma nova prévia quando o usuário ajusta itens no card.
function toolsByProposal() {
  return Object.fromEntries(actionTools.flatMap(tool=>tool.kinds).map(kind=>{
    const call=toolCallForProposal({tipo:kind,dados:{}});return [kind,{tool:call.name,...(call.arguments.tipo?{tipo:call.arguments.tipo}:{})}]
  }))
}
const json=(value:unknown)=>JSON.stringify(value).replaceAll('<','\u003c')
export function renderCardsHtml() {
  // Sem dados privados no HTML: rótulos e o mapa de tools são públicos; dados do ERP chegam pela
  // ponte e são inseridos com textContent, nunca innerHTML.
  const constants=`const operationLabels=${json(operationLabels)},fieldLabels=${json(fieldLabels)},toolFor=${json(toolsByProposal())};`
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cardStyles}</style></head><body><main><section id="app" aria-live="polite" aria-label="Resultado do ERP"></section><p id="status" class="muted" role="status">Conectando…</p></main><script>(function(){${constants}\n${commonScript}\n${viewsScript}\n${listCardScript}\n${detailsCardScript}\n${analysisCardScript}\n${reviewCardScript}\n${resultCardScript}\n${bridgeScript}})();</script></body></html>`
}

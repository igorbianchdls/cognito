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
import { fieldLabels } from '../actions/fieldLabels'
import { actionTools,toolCallForProposal } from '../actions/catalog'

// Tool e tipo usados para gerar uma nova prévia quando o usuário ajusta itens no card.
function toolsByProposal() {
  return Object.fromEntries(actionTools.flatMap(tool=>tool.kinds).map(kind=>{
    const call=toolCallForProposal({tipo:kind,dados:{}});return [kind,{tool:call.name,...(call.arguments.tipo?{tipo:call.arguments.tipo}:{})}]
  }))
}
const json=(value:unknown)=>JSON.stringify(value).replaceAll('<','\u003c')
// Cada chat informa o nome e a versão com que o card se apresenta ao host. host='claude' aplica as
// regras de UI do Claude: no card inline até 5 dados, sem listas suspensas nem navegação; o resto em tela cheia.
export type CardsApp = { name: string; version: string; host: 'chatgpt' | 'claude' }
export function renderCardsHtml(app: CardsApp) {
  // Sem dados privados no HTML: rótulos e o mapa de tools são públicos; dados do ERP chegam pela
  // ponte e são inseridos com textContent, nunca innerHTML.
  const constants=`const operationLabels=${json(operationLabels)},fieldLabels=${json(fieldLabels)},toolFor=${json(toolsByProposal())},HOST=${json(app.host)},strict=HOST==='claude';document.documentElement.classList.add('host-'+HOST);`
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cardStyles}</style></head><body><main><section id="app" aria-live="polite" aria-label="Resultado do ERP"></section><p id="status" class="muted" role="status">Conectando…</p></main><script>(function(){${constants}\n${commonScript}\n${viewsScript}\n${listCardScript}\n${detailsCardScript}\n${analysisCardScript}\n${reviewCardScript}\n${resultCardScript}\n${bridgeScript(app)}})();</script></body></html>`
}

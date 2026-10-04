import { cardStyles } from './styles/cards'
import { commonScript } from './components/common'
import { bridgeScript } from './bridge/mcpApps'
import { tableCardScript } from './cards/tabela'
import { detailsCardScript } from './cards/detalhes'
import { analysisCardScript } from './cards/analise'
import { selectionCardScript } from './cards/selecao'
import { reviewCardScript } from './cards/revisao'
import { resultCardScript } from './cards/resultado'

export const CARDS_URI='ui://chatgptplugin/cards/v1.html'
export function renderCardsHtml(resource:string) {
  // Único valor embutido: origem validada da configuração. Dados do ERP chegam
  // pela ponte e são renderizados com textContent, nunca innerHTML.
  const origin=JSON.stringify(new URL(resource).origin).replaceAll('<','\\u003c')
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cardStyles}</style></head><body><main><section id="card" aria-label="Resultado do ERP"></section><p id="status" role="status">Conectando…</p><button id="retry" hidden>Tentar novamente</button></main><script>(function(){const resourceOrigin=${origin};${commonScript}\n${tableCardScript}\n${detailsCardScript}\n${analysisCardScript}\n${selectionCardScript}\n${reviewCardScript}\n${resultCardScript}\n${bridgeScript}})();</script></body></html>`
}

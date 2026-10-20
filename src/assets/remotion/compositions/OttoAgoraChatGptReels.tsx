import type { ComponentType } from 'react'

import { ProfitScene } from './OttoCobrancaFuncionarioVideos'
import {
  BankSyncScene,
  ExpensesScene,
  type FeatureSceneProps,
  Headline,
  IntegrationScene,
  InvoiceScene,
  NoSpreadsheetScene,
  ReconciliationScene,
  ReelRoot,
  type ReelScene,
  Scene,
  sceneDuration,
  WhatsAppScene,
} from './OttoContadoresReel'
import { makeClaudeAlsoScene, makeCta, makeHookScene, makeRevealScene } from './OttoNotaFiscalChatGptVideos'

/**
 * "Agora o ChatGPT pode…" reels. Same skeleton as the contadores reel:
 * hook → Otto intro → what it does (feature scenes) → benefit → integration → CTA.
 */

type Feature = { Scene: ComponentType<FeatureSceneProps>; task: string; title: string }

const F = {
  bank: (title = 'Sincroniza suas contas bancárias.'): Feature => ({ Scene: BankSyncScene, task: 'Contas bancárias', title }),
  expenses: (title = 'Classifica cada despesa.'): Feature => ({ Scene: ExpensesScene, task: 'Despesas', title }),
  invoice: (title = 'Emite suas notas fiscais.'): Feature => ({ Scene: InvoiceScene, task: 'Notas fiscais', title }),
  reconciliation: (title = 'Faz a conciliação bancária.', task = 'Conciliação bancária'): Feature => ({ Scene: ReconciliationScene, task, title }),
  whatsapp: (title = 'Cobra seus clientes no WhatsApp.'): Feature => ({ Scene: WhatsAppScene, task: 'Cobrança no WhatsApp', title }),
}

const FEATURE_DURATION = 95

function featureScenes(features: Feature[]): ReelScene[] {
  const tasks = features.map((feature) => feature.task)
  return features.map(({ Scene: FeatureComponent, title }, index) => ({
    Component: ({ duration }) => <FeatureComponent duration={duration} index={index} tasks={tasks} title={title} />,
    duration: FEATURE_DURATION,
  }))
}

function makeStatementScene(text: string, strikes: string[], highlight: string[] = []) {
  return function StatementScene({ duration }: { duration: number }) {
    return (
      <Scene duration={duration}>
        <Headline highlight={highlight} marks={strikes.map((word, i) => ({ at: 26 + i * 9, kind: 'strike' as const, word }))} size={96} start={0} stagger={2} text={text} style={{ top: 720 }} />
      </Scene>
    )
  }
}

type ReelConfig = {
  benefit: ReelScene
  cta: { comment: string; keyword: string }
  features: Feature[]
  hook: { highlight: string[]; size: number; subline?: string; title: string }
  integration: ReelScene
  intro: { highlight: string[]; prefix: string; text: string }
}

function buildReel(config: ReelConfig): ReelScene[] {
  return [
    { Component: makeHookScene(config.hook.title, config.hook.highlight, config.hook.size, config.hook.subline ?? ''), duration: 100 },
    { Component: makeRevealScene([], config.intro.prefix, config.intro.text, config.intro.highlight), duration: 110 },
    ...featureScenes(config.features),
    config.benefit,
    config.integration,
    { Component: makeCta('Quer ver como funciona?', { comment: config.cta.comment, highlight: ['funciona'], keyword: config.cta.keyword }), duration: 120 },
  ]
}

const FREE_ON_BOTH = { Component: makeClaudeAlsoScene('É gratuito e funciona no ChatGPT ou no Claude.'), duration: 85 }

// 1 · Sistema completo — CTA SISTEMA
const SISTEMA_SCENES = buildReel({
  benefit: { Component: makeStatementScene('Tudo pelo chat. Sem tela, sem menu, sem planilha.', ['tela', 'menu', 'planilha'], ['chat']), duration: 100 },
  cta: { comment: 'Sistema', keyword: 'SISTEMA' },
  features: [
    F.bank('Sincroniza todas as suas contas bancárias.'),
    F.invoice('Registra suas vendas e emite as notas fiscais.'),
    F.reconciliation('Controla as contas a pagar e a receber.', 'Contas a pagar e receber'),
    F.whatsapp('E ainda cobra seus clientes no WhatsApp.'),
  ],
  hook: { highlight: ['gestão'], size: 88, title: 'Agora o ChatGPT pode ser o sistema de gestão da sua empresa.' },
  integration: FREE_ON_BOTH,
  intro: { highlight: ['chat'], prefix: 'Isso acontece através do', text: 'Um sistema de gestão que funciona dentro do próprio chat.' },
})

// 2 · Financeiro inteiro, sozinho — CTA FINANCEIRO
const FINANCEIRO_SCENES = buildReel({
  benefit: { Component: NoSpreadsheetScene, duration: 120 },
  cta: { comment: 'Financeiro', keyword: 'FINANCEIRO' },
  features: [F.bank(), F.expenses(), F.invoice(), F.reconciliation(), F.whatsapp('Cobra quem tá te devendo no WhatsApp.')],
  hook: { highlight: ['financeiro'], size: 88, subline: 'Sozinho.', title: 'Agora o ChatGPT pode cuidar de todo o financeiro da sua empresa.' },
  integration: { Component: IntegrationScene, duration: 90 },
  intro: { highlight: ['chatgpt'], prefix: 'O nome disso é', text: 'Um sistema de gestão que roda dentro do ChatGPT.' },
})

// 4 · Conversa é o sistema — CTA CHAT
const CHAT_SCENES = buildReel({
  benefit: { Component: makeStatementScene('Nada de procurar botão ou aprender tela nova. É só conversar.', ['botão', 'tela'], ['conversar']), duration: 110 },
  cta: { comment: 'Chat', keyword: 'CHAT' },
  features: [F.bank(), F.invoice(), F.expenses('Classifica as despesas.'), F.reconciliation(), F.whatsapp()],
  hook: { highlight: ['tudo'], size: 88, subline: 'Só que conversando.', title: 'Agora o ChatGPT pode fazer tudo o que o seu sistema de gestão faz.' },
  integration: { Component: IntegrationScene, duration: 90 },
  intro: { highlight: ['chat'], prefix: 'Ele se chama', text: 'Um sistema de gestão que vive dentro do chat.' },
})

// 5 · Sem treinamento — CTA FÁCIL
const FACIL_SCENES = buildReel({
  benefit: { Component: makeStatementScene('Sem curso, sem manual, sem treinamento. Você usa o ChatGPT do jeito que já usa.', ['curso', 'manual', 'treinamento'], ['já']), duration: 120 },
  cta: { comment: 'Fácil', keyword: 'FÁCIL' },
  features: [F.bank(), F.invoice(), F.expenses('Classifica as despesas.'), F.reconciliation(), F.whatsapp()],
  hook: { highlight: ['ninguém'], size: 86, title: 'Agora o ChatGPT pode substituir aquele sistema que ninguém na sua empresa sabe usar.' },
  integration: FREE_ON_BOTH,
  intro: { highlight: ['chat'], prefix: 'O nome dele é', text: 'Um sistema de gestão que funciona direto no chat.' },
})

// 6 · Pergunte sobre sua empresa — CTA LUCRO
const LUCRO_SCENES = buildReel({
  benefit: { Component: ProfitScene, duration: 130 },
  cta: { comment: 'Lucro', keyword: 'LUCRO' },
  features: [F.bank(), F.expenses('Classifica as despesas.'), F.invoice(), F.reconciliation(), F.whatsapp()],
  hook: { highlight: ['lucrou'], size: 88, subline: 'Quem tá te devendo. Quanto sobrou no caixa.', title: 'Agora o ChatGPT pode te dizer quanto sua empresa lucrou.' },
  integration: { Component: makeClaudeAlsoScene('Funciona no seu ChatGPT ou no Claude.'), duration: 80 },
  intro: { highlight: ['financeiro'], prefix: 'Isso é o', text: 'Um sistema de gestão que conecta o ChatGPT ao financeiro da sua empresa.' },
})

export const OTTO_AGORA_SISTEMA_DURATION = sceneDuration(SISTEMA_SCENES)
export const OTTO_AGORA_FINANCEIRO_DURATION = sceneDuration(FINANCEIRO_SCENES)
export const OTTO_AGORA_CHAT_DURATION = sceneDuration(CHAT_SCENES)
export const OTTO_AGORA_FACIL_DURATION = sceneDuration(FACIL_SCENES)
export const OTTO_AGORA_LUCRO_DURATION = sceneDuration(LUCRO_SCENES)

export const OttoAgoraSistemaReel = () => <ReelRoot scenes={SISTEMA_SCENES} />
export const OttoAgoraFinanceiroReel = () => <ReelRoot scenes={FINANCEIRO_SCENES} />
export const OttoAgoraChatReel = () => <ReelRoot scenes={CHAT_SCENES} />
export const OttoAgoraFacilReel = () => <ReelRoot scenes={FACIL_SCENES} />
export const OttoAgoraLucroReel = () => <ReelRoot scenes={LUCRO_SCENES} />

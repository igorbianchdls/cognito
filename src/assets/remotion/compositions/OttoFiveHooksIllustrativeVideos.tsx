import {Send, Wallet} from 'lucide-react'
import {AbsoluteFill, Sequence} from 'remotion'

import type {OttoAiEmployeesResultRow} from './ChatGptClaudeOttoAiEmployeesVideo'
import {
  accountsStatusRows,
  collectionStatusRows,
  ConversationScene,
  expenseStatusRows,
  invoiceProgressRows,
  PromptScene,
  reconciliationStatusRows,
} from './JulyBodyIllustrativeVideos'
import {OttoFinancialDashboard} from './OttoFinancialDashboard'
import {invoiceEmissionRows, recentSalesRows, SyncScene} from './OttoFinanceAi50sVideo'
import {TypedStatement} from './OttoInvoiceAi60sNarratedVideo'

type Step =
  | {duration: number; kind: 'statement'; text: string}
  | {duration: number; kind: 'prompt'; text: string}
  | {duration: number; kind: 'dashboard'}
  | {
      assistantText: string
      duration: number
      kind: 'sync'
      rows: OttoAiEmployeesResultRow[]
      subtitle: string
      title: string
      variant?: 'reconciliation'
    }

const statement = (text: string, duration = 65): Step => ({duration, kind: 'statement', text})
const prompt = (text: string, duration = 65): Step => ({duration, kind: 'prompt', text})
const sync = (title: string, subtitle: string, assistantText: string, rows: OttoAiEmployeesResultRow[], duration = 100, variant?: 'reconciliation'): Step => ({assistantText, duration, kind: 'sync', rows, subtitle, title, variant})

function HookTimeline({steps}: {steps: Step[]}) {
  let from = 0

  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      {steps.map((step, index) => {
        const start = from
        from += step.duration

        return (
          <Sequence durationInFrames={step.duration} from={start} key={`${index}-${step.kind}`}>
            {step.kind === 'statement' ? <TypedStatement duration={step.duration} speed={0.85} text={step.text} /> : null}
            {step.kind === 'prompt' ? <PromptScene duration={step.duration} prompt={step.text} /> : null}
            {step.kind === 'dashboard' ? <OttoFinancialDashboard animationSpeed={2} showExtendedKpis /> : null}
            {step.kind === 'sync' ? (
              <ConversationScene>
                <SyncScene assistantText={step.assistantText} duration={step.duration} kind={step.variant ?? 'list'} paceToDuration rows={step.rows} subtitle={step.subtitle} title={step.title} visibleTitleFontSize={32} />
              </ConversationScene>
            ) : null}
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}

const stageStyles = [
  {background: '#dbeafe', color: '#1d4ed8'},
  {background: '#fef3c7', color: '#a16207'},
  {background: '#f3e8ff', color: '#7e22ce'},
  {background: '#dcfce7', color: '#166534'},
]

const singlePreparationRows: OttoAiEmployeesResultRow[] = [
  {background: '#dbeafe', description: 'Cadastro e dados fiscais localizados', initials: 'AT', name: 'Aurora Tecnologia', status: 'Identificado', statusColor: '#1d4ed8', tone: '#2563eb', value: 'Cliente'},
  {background: '#f3e8ff', description: 'Consultoria financeira prestada', initials: 'SV', name: 'Serviço', status: 'Preenchido', statusColor: '#7e22ce', tone: '#7c3aed', value: 'NFS-e'},
  {background: '#fef3c7', description: 'Valor sugerido para conferência', initials: 'R$', name: 'Valor', status: 'Confirmar', statusColor: '#a16207', tone: '#d97757', value: 'R$ 4.000'},
]
const singleInvoiceRows: OttoAiEmployeesResultRow[] = [{
  ...invoiceEmissionRows[0],
  description: 'Aurora Tecnologia · consultoria financeira',
  status: 'Nota emitida',
  statusStages: ['Dados validados', 'RPS enviado', 'Aguardando Prefeitura', 'Nota emitida'],
  statusStageStyles: stageStyles,
  value: 'R$ 4.000',
}]
const singleDeliveryRows: OttoAiEmployeesResultRow[] = [
  {...singleInvoiceRows[0], background: '#dcfce7', description: 'PDF e XML disponíveis', status: 'Emitida', statusColor: '#166534'},
  {background: '#dbeafe', description: 'Nota encaminhada ao cliente certo', icon: Send, initials: 'WA', name: 'Envio ao cliente', status: 'Entregue', statusColor: '#1d4ed8', tone: '#2563eb', value: 'WhatsApp'},
  {background: '#f3e8ff', description: 'Venda vinculada à nota fiscal', icon: Wallet, initials: 'CR', name: 'Contas a receber', status: 'Atualizado', statusColor: '#7e22ce', tone: '#7c3aed', value: 'R$ 4.000'},
]

const batchPreparationRows = recentSalesRows.slice(0, 8).map((row, index) => ({
  ...row,
  background: index % 3 === 0 ? '#fef3c7' : '#dbeafe',
  status: index % 3 === 0 ? 'Conferir valor' : 'Dados completos',
  statusColor: index % 3 === 0 ? '#a16207' : '#1d4ed8',
}))
const batchDeliveryRows = invoiceEmissionRows.slice(0, 8).map((row, index) => ({
  ...row,
  background: index % 2 === 0 ? '#dcfce7' : '#dbeafe',
  status: index % 2 === 0 ? 'Enviada' : 'Atualizado',
  statusColor: index % 2 === 0 ? '#166534' : '#1d4ed8',
}))

const billingRows: OttoAiEmployeesResultRow[] = [
  {description: 'Cliente e valor confirmados', icon: Wallet, initials: 'BL', name: 'Boleto bancário', status: 'Enviado', statusStageStyles: stageStyles, statusStages: ['Preparando', 'Confirmar valor', 'Gerado', 'Enviado'], tone: '#2563eb', value: 'R$ 2.480'},
  {description: 'QR Code e código copia e cola', icon: Wallet, initials: 'PX', name: 'Pix', status: 'Enviado', statusStageStyles: stageStyles, statusStages: ['Preparando', 'Confirmar valor', 'Gerado', 'Enviado'], tone: '#16a34a', value: 'R$ 2.480'},
]
const billingPreparationRows: OttoAiEmployeesResultRow[] = [
  {background: '#dbeafe', description: 'Contato e WhatsApp localizados', initials: 'LC', name: 'Lume Comércio', status: 'Identificado', statusColor: '#1d4ed8', tone: '#2563eb', value: 'Cliente'},
  {background: '#f3e8ff', description: 'Boleto e Pix selecionados', initials: 'CB', name: 'Cobrança', status: 'Preparada', statusColor: '#7e22ce', tone: '#7c3aed', value: '2 formas'},
  {background: '#fef3c7', description: 'Valor aguardando sua conferência', initials: 'R$', name: 'Valor', status: 'Confirmar', statusColor: '#a16207', tone: '#d97757', value: 'R$ 2.480'},
]
const billingDeliveryRows: OttoAiEmployeesResultRow[] = [
  {background: '#dcfce7', description: 'Boleto e Pix enviados ao contato cadastrado', icon: Send, initials: 'WA', name: 'WhatsApp do cliente', status: 'Entregue', statusColor: '#166534', tone: '#16a34a', value: '2 opções'},
  {background: '#dbeafe', description: 'Cobrança vinculada à venda', initials: 'CR', name: 'Contas a receber', status: 'Atualizado', statusColor: '#1d4ed8', tone: '#2563eb', value: 'R$ 2.480'},
  {background: '#fef3c7', description: 'Acompanhamento automático até o pagamento', initials: 'AC', name: 'Acompanhamento', status: 'Monitorando', statusColor: '#a16207', tone: '#d97757', value: 'Em aberto'},
]
const stockRows: OttoAiEmployeesResultRow[] = [
  {background: '#dcfce7', description: 'Vendas e saídas atualizadas', initials: 'EC', name: 'Estoque central', status: 'Atualizado', statusColor: '#166534', tone: '#16a34a', value: '142 un.'},
  {background: '#dbeafe', description: 'Giro médio dos últimos 30 dias', initials: 'PA', name: 'Produto Aurora', status: 'Saudável', statusColor: '#1d4ed8', tone: '#2563eb', value: '38 un.'},
  {background: '#fef3c7', description: 'Abaixo do mínimo de segurança', initials: 'PN', name: 'Produto Norte', status: 'Repor', statusColor: '#a16207', tone: '#d97757', value: '5 un.'},
  {background: '#f3e8ff', description: 'Reposição solicitada ao fornecedor', initials: 'PC', name: 'Pedido de compra', status: 'A caminho', statusColor: '#7e22ce', tone: '#7c3aed', value: '24 un.'},
]

const commonFinanceSteps: Step[] = [
  statement('Mas não faz só isso.', 48),
  sync('Conciliação bancária', 'Movimentações conferidas', 'Vou conciliar os lançamentos com os bancos.', reconciliationStatusRows, 92, 'reconciliation'),
  sync('Classificação de despesas', 'Categorias atualizadas', 'Agora vou classificar as despesas automaticamente.', expenseStatusRows, 92),
  sync('Contas a pagar e a receber', 'Vencimentos e recebimentos organizados', 'Vou controlar as contas e acompanhar os vencimentos.', accountsStatusRows, 92),
  sync('Boletos', 'Documentos de cobrança gerados', 'Vou emitir os boletos para os valores em aberto.', billingRows, 88),
  sync('Clientes em atraso', 'Cobranças acompanhadas', 'Agora vou contatar os clientes em atraso.', collectionStatusRows, 88),
]

const hook1Steps: Step[] = [
  statement('Agora você emite nota fiscal direto pelo ChatGPT.', 90),
  prompt('Emita uma nota fiscal para a Aurora Tecnologia.', 72),
  sync('Dados da nota fiscal', 'Cliente, serviço e valor identificados', 'Encontrei o cliente e o serviço prestado. Confirme o valor de R$ 4.000,00.', singlePreparationRows, 112),
  statement('Você só confirma o valor.', 48),
  sync('Emissão de nota fiscal', 'Acompanhe cada etapa fiscal', 'Valor confirmado. Vou enviar o RPS e acompanhar a autorização da nota.', singleInvoiceRows, 132),
  sync('Nota enviada e financeiro atualizado', 'Operação concluída', 'Nota emitida. Vou enviá-la ao cliente e atualizar o contas a receber.', singleDeliveryRows, 95),
  ...commonFinanceSteps,
]

const hook2Steps: Step[] = [
  statement('Emita várias notas fiscais de uma vez pelo ChatGPT.', 98),
  prompt('Emita as notas fiscais das minhas vendas recentes.', 74),
  sync('Vendas prontas para emissão', 'Clientes, serviços e valores localizados', 'Identifiquei cada cliente e serviço. Confira os valores antes da emissão.', batchPreparationRows, 115),
  statement('Confira e confirme os valores.', 50),
  sync('Emissão de notas em lote', 'Cada nota avança pelo próprio status', 'Valores confirmados. Vou emitir todas as notas e acompanhar as autorizações.', invoiceProgressRows, 160),
  sync('Notas enviadas e financeiro atualizado', 'Documentos vinculados aos clientes certos', 'Todas as notas foram emitidas. Vou enviá-las e atualizar o financeiro.', batchDeliveryRows, 105),
  ...commonFinanceSteps,
]

const hook3Steps: Step[] = [
  statement('Automatize todo o financeiro da sua empresa com o ChatGPT.', 95),
  prompt('Registre minhas vendas e organize o financeiro de hoje.', 65),
  sync('Vendas registradas', 'Clientes e valores identificados', 'Vou registrar as vendas e atualizar seus lançamentos.', recentSalesRows, 98),
  sync('Notas fiscais', 'Documentos emitidos em sequência', 'Também vou emitir as notas fiscais dessas vendas.', invoiceProgressRows, 112),
  sync('Contas a pagar e a receber', 'Tudo sob controle', 'Vou acompanhar pagamentos e recebimentos.', accountsStatusRows, 92),
  sync('Conciliação bancária', 'Movimentações conferidas', 'Agora vou conciliar os lançamentos com o banco.', reconciliationStatusRows, 92, 'reconciliation'),
  sync('Despesas classificadas', 'Categorias organizadas', 'Vou classificar as despesas automaticamente.', expenseStatusRows, 92),
  sync('Boletos', 'Documentos de cobrança gerados', 'Vou emitir os boletos das vendas pendentes.', billingRows, 90),
  sync('Clientes em atraso', 'Cobranças acompanhadas', 'Agora vou cobrar quem está em atraso.', collectionStatusRows, 90),
  statement('Tudo direto pelo Chat. Basta conversar com a IA.', 75),
]

const hook4Steps: Step[] = [
  statement('Administre sua empresa conversando com o ChatGPT.', 95),
  prompt('Como está minha empresa hoje? Registre as vendas e organize as contas.', 75),
  {duration: 100, kind: 'dashboard'},
  sync('Vendas e notas fiscais', 'Operações registradas', 'Vou registrar as vendas e emitir as notas correspondentes.', invoiceProgressRows, 105),
  prompt('Agora concilie o banco e classifique as despesas.', 60),
  sync('Conciliação bancária', 'Movimentações conferidas', 'Vou conferir os pagamentos que entraram na conta.', reconciliationStatusRows, 95, 'reconciliation'),
  sync('Classificação de despesas', 'Categorias atualizadas', 'Também vou classificar cada despesa.', expenseStatusRows, 90),
  prompt('Cuide das contas e cobre os clientes em atraso.', 62),
  sync('Contas a pagar e a receber', 'Prazos organizados', 'Vou acompanhar os vencimentos e recebimentos.', accountsStatusRows, 90),
  sync('Boletos', 'Documentos de cobrança gerados', 'Vou emitir os boletos pendentes.', billingRows, 92),
  sync('Clientes em atraso', 'Cobranças acompanhadas', 'Também vou entrar em contato com os clientes atrasados.', collectionStatusRows, 92),
  statement('Apenas conversando com a IA.', 68),
]

const hook5Steps: Step[] = [
  statement('Gere boleto e Pix pelo ChatGPT. Envie pelo WhatsApp.', 102),
  prompt('Gere um boleto e um Pix para o cliente e envie pelo WhatsApp.', 75),
  sync('Cobrança preparada', 'Cliente e valor identificados', 'Encontrei o cliente e o valor. Confirme R$ 2.480,00 antes de gerar a cobrança.', billingPreparationRows, 100),
  statement('Você só confirma.', 45),
  sync('Boleto e Pix', 'Duas formas de pagamento geradas', 'Valor confirmado. Vou gerar o boleto e o Pix.', billingRows, 125),
  sync('Envio pelo WhatsApp', 'Financeiro atualizado', 'Vou enviar as opções ao cliente e acompanhar o pagamento.', billingDeliveryRows, 95),
  statement('Mas não faz só isso.', 48),
  sync('Notas fiscais', 'Emissão acompanhada', 'Também posso emitir as notas fiscais das suas vendas.', invoiceProgressRows, 105),
  sync('Conciliação bancária', 'Movimentações conferidas', 'Vou conciliar os pagamentos recebidos.', reconciliationStatusRows, 92, 'reconciliation'),
  sync('Despesas classificadas', 'Categorias organizadas', 'Vou classificar automaticamente as despesas.', expenseStatusRows, 90),
  sync('Contas a pagar e a receber', 'Prazos acompanhados', 'Também vou controlar as contas e cobranças.', accountsStatusRows, 90),
  sync('Vendas', 'Lançamentos atualizados', 'Vou acompanhar suas vendas recentes.', recentSalesRows, 90),
  sync('Estoque', 'Produtos e reposições acompanhados', 'Por fim, vou atualizar o estoque conforme as vendas.', stockRows, 90),
]

export const OTTO_HOOK_1_DURATION = hook1Steps.reduce((sum, step) => sum + step.duration, 0)
export const OTTO_HOOK_2_DURATION = hook2Steps.reduce((sum, step) => sum + step.duration, 0)
export const OTTO_HOOK_3_DURATION = hook3Steps.reduce((sum, step) => sum + step.duration, 0)
export const OTTO_HOOK_4_DURATION = hook4Steps.reduce((sum, step) => sum + step.duration, 0)
export const OTTO_HOOK_5_DURATION = hook5Steps.reduce((sum, step) => sum + step.duration, 0)

export const OttoHookSingleInvoiceVideo = () => <HookTimeline steps={hook1Steps} />
export const OttoHookBatchInvoicesVideo = () => <HookTimeline steps={hook2Steps} />
export const OttoHookAutomatedFinanceVideo = () => <HookTimeline steps={hook3Steps} />
export const OttoHookManageByChatVideo = () => <HookTimeline steps={hook4Steps} />
export const OttoHookBoletoPixVideo = () => <HookTimeline steps={hook5Steps} />

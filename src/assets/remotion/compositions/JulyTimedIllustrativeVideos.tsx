import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion'

import type {OttoAiEmployeesResultRow} from './ChatGptClaudeOttoAiEmployeesVideo'
import {
  accountsStatusRows,
  CenteredCtaScene,
  collectionStatusRows,
  ConversationScene,
  expenseStatusRows,
  invoiceProgressRows,
  PromptScene,
  reconciliationStatusRows,
} from './JulyBodyIllustrativeVideos'
import {OttoFinancialDashboard} from './OttoFinancialDashboard'
import {OttoLogoRevealHorizontal} from './OttoLogoRevealHorizontal'
import {recentSalesRows, SyncScene} from './OttoFinanceAi50sVideo'
import {TypedStatement} from './OttoInvoiceAi60sNarratedVideo'

const FPS = 30
const frame = (seconds: number) => Math.round(seconds * FPS)

export const JULY_TIMED_BODY_1_DURATION = frame(29.4)
export const JULY_TIMED_BODY_2_DURATION = frame(44.3)
export const JULY_TIMED_HOOK_1_DURATION = frame(24)
export const JULY_TIMED_HOOK_2_DURATION = frame(25.6)
export const JULY_TIMED_HOOK_3_DURATION = frame(26)
export const JULY_TIMED_HOOK_4_DURATION = frame(23.2)

type SceneStep = {from: number; to: number} & (
  | {kind: 'statement'; text: string}
  | {kind: 'prompt'; text: string}
  | {kind: 'logo' | 'dashboard' | 'cta'}
  | {assistantText: string; kind: 'sync'; rows: OttoAiEmployeesResultRow[]; subtitle: string; title: string; variant?: 'reconciliation'}
)

const statement = (from: number, to: number, text: string): SceneStep => ({from, kind: 'statement', text, to})
const prompt = (from: number, to: number, text: string): SceneStep => ({from, kind: 'prompt', text, to})
const sync = (from: number, to: number, title: string, subtitle: string, assistantText: string, rows: OttoAiEmployeesResultRow[], variant?: 'reconciliation'): SceneStep => ({assistantText, from, kind: 'sync', rows, subtitle, title, to, variant})

const blue = {background: '#dbeafe', statusColor: '#1d4ed8'}
const green = {background: '#dcfce7', statusColor: '#166534'}
const purple = {background: '#f3e8ff', statusColor: '#7e22ce'}
const amber = {background: '#fef3c7', statusColor: '#a16207'}

const singlePreparationRows: OttoAiEmployeesResultRow[] = [
  {...blue, description: 'Cadastro e dados fiscais encontrados', initials: 'AT', name: 'Aurora Tecnologia', status: 'Identificado', tone: '#2563eb', value: 'Cliente'},
  {...purple, description: 'Consultoria financeira prestada', initials: 'SV', name: 'Serviço', status: 'Preenchido', tone: '#7c3aed', value: 'NFS-e'},
  {...amber, description: 'Valor aguardando sua confirmação', initials: 'R$', name: 'Valor da nota', status: 'Confirmar', tone: '#d97757', value: 'R$ 4.000'},
]
const singleInvoiceRows: OttoAiEmployeesResultRow[] = [{
  ...invoiceProgressRows[0],
  description: 'Aurora Tecnologia · consultoria financeira',
  statusStageStyles: [
    {background: '#dbeafe', color: '#1d4ed8'},
    {background: '#f3e8ff', color: '#7e22ce'},
    {background: '#fef3c7', color: '#a16207'},
    {background: '#dcfce7', color: '#166534'},
  ],
  statusStages: ['Dados validados', 'RPS enviado', 'Aguardando Prefeitura', 'Nota emitida'],
  value: 'R$ 4.000',
}]
const singleDeliveryRows: OttoAiEmployeesResultRow[] = [
  {...singleInvoiceRows[0], ...green, description: 'PDF e XML disponíveis', status: 'Emitida', statusStages: undefined},
  {...blue, description: 'Nota enviada ao contato cadastrado', initials: 'WA', name: 'Envio ao cliente', status: 'Entregue', tone: '#2563eb', value: 'WhatsApp'},
  {...purple, description: 'Venda e nota vinculadas', initials: 'CR', name: 'Contas a receber', status: 'Atualizado', tone: '#7c3aed', value: 'R$ 4.000'},
]
const batchDataRows: OttoAiEmployeesResultRow[] = recentSalesRows.slice(0, 6).map((row, index) => ({
  ...row,
  ...(index % 3 === 0 ? amber : blue),
  status: index % 3 === 0 ? 'Conferir valor' : 'Dados completos',
}))
const batchDeliveryRows: OttoAiEmployeesResultRow[] = invoiceProgressRows.slice(0, 6).map((row, index) => ({
  ...row,
  ...(index % 2 === 0 ? green : blue),
  description: 'Documento vinculado ao cliente e à venda',
  status: index % 2 === 0 ? 'Entregue' : 'Atualizado',
  statusStages: undefined,
}))

const billingPreparationRows: OttoAiEmployeesResultRow[] = [
  {...blue, description: 'Contato e WhatsApp localizados', initials: 'LC', name: 'Lume Comércio', status: 'Identificado', tone: '#2563eb', value: 'Cliente'},
  {...purple, description: 'Boleto e Pix selecionados', initials: 'CB', name: 'Cobrança', status: 'Preparada', tone: '#7c3aed', value: '2 formas'},
  {...amber, description: 'Aguardando sua conferência', initials: 'R$', name: 'Valor', status: 'Confirmar', tone: '#d97757', value: 'R$ 2.480'},
]
const billingRows: OttoAiEmployeesResultRow[] = [
  {description: 'Linha digitável e vencimento gerados', initials: 'BL', name: 'Boleto bancário', status: 'Gerado', statusStageStyles: [{background: '#dbeafe', color: '#1d4ed8'}, {background: '#fef3c7', color: '#a16207'}, {background: '#dcfce7', color: '#166534'}], statusStages: ['Preparando', 'Validando', 'Gerado'], tone: '#2563eb', value: 'R$ 2.480'},
  {description: 'QR Code e código copia e cola', initials: 'PX', name: 'Pix', status: 'Gerado', statusStageStyles: [{background: '#dbeafe', color: '#1d4ed8'}, {background: '#f3e8ff', color: '#7e22ce'}, {background: '#dcfce7', color: '#166534'}], statusStages: ['Preparando', 'Registrando', 'Gerado'], tone: '#16a34a', value: 'R$ 2.480'},
]
const billingDeliveryRows: OttoAiEmployeesResultRow[] = [
  {...green, description: 'Boleto e Pix enviados ao cliente', initials: 'WA', name: 'WhatsApp', status: 'Entregue', tone: '#16a34a', value: '2 opções'},
  {...blue, description: 'Cobrança vinculada à venda', initials: 'CR', name: 'Contas a receber', status: 'Atualizado', tone: '#2563eb', value: 'R$ 2.480'},
  {...amber, description: 'Acompanhamento até o pagamento', initials: 'AC', name: 'Cobrança', status: 'Monitorando', tone: '#d97757', value: 'Em aberto'},
]
const stockRows: OttoAiEmployeesResultRow[] = [
  {...green, description: 'Saídas das vendas registradas', initials: 'EC', name: 'Estoque central', status: 'Atualizado', tone: '#16a34a', value: '142 un.'},
  {...blue, description: 'Giro dos últimos 30 dias', initials: 'PA', name: 'Produto Aurora', status: 'Saudável', tone: '#2563eb', value: '38 un.'},
  {...amber, description: 'Abaixo do mínimo de segurança', initials: 'PN', name: 'Produto Norte', status: 'Repor', tone: '#d97757', value: '5 un.'},
]
const financialCoreRows: OttoAiEmployeesResultRow[] = [
  ...invoiceProgressRows.slice(0, 2),
  ...recentSalesRows.slice(0, 2),
  ...accountsStatusRows.slice(0, 2),
]
const expenseCollectionRows: OttoAiEmployeesResultRow[] = [
  ...expenseStatusRows.slice(0, 2),
  ...collectionStatusRows.slice(0, 2),
]
const stockAccountingRows: OttoAiEmployeesResultRow[] = [
  {...green, description: 'Saídas vinculadas às vendas', initials: 'EC', name: 'Estoque central', status: 'Atualizado', tone: '#16a34a', value: '142 un.'},
  {...amber, description: 'Produto abaixo do mínimo', initials: 'PN', name: 'Reposição de estoque', status: 'Repor', tone: '#d97757', value: '5 un.'},
  {...blue, description: 'Lançamentos conciliados', initials: 'CT', name: 'Contabilidade', status: 'Conferido', tone: '#2563eb', value: '184 itens'},
  {...purple, description: 'Categorias e demonstrativos prontos', initials: 'DR', name: 'Demonstrativos', status: 'Atualizado', tone: '#7c3aed', value: 'Setembro'},
]

function NarratedTimeline({audio, steps}: {audio: string; steps: SceneStep[]}) {
  return <AbsoluteFill style={{background: '#ffffff'}}>
    <Audio src={staticFile(`remotion/july-timed-audio/${audio}`)} />
    {steps.map((step, index) => {
      const duration = frame(step.to) - frame(step.from)
      return <Sequence durationInFrames={duration} from={frame(step.from)} key={`${index}-${step.kind}`}>
        {step.kind === 'statement' ? <TypedStatement duration={duration} speed={0.85} text={step.text} /> : null}
        {step.kind === 'prompt' ? <PromptScene duration={duration} prompt={step.text} /> : null}
        {step.kind === 'logo' ? <OttoLogoRevealHorizontal centerX={45} centerY="50%" /> : null}
        {step.kind === 'dashboard' ? <OttoFinancialDashboard animationSpeed={2} /> : null}
        {step.kind === 'cta' ? <CenteredCtaScene /> : null}
        {step.kind === 'sync' ? <ConversationScene><SyncScene assistantText={step.assistantText} duration={duration} expandedFromStart={step.rows.length <= 2 || duration < 100} kind={step.variant ?? 'list'} paceToDuration rows={step.rows} subtitle={step.subtitle} title={step.title} visibleTitleFontSize={32} /></ConversationScene> : null}
      </Sequence>
    })}
  </AbsoluteFill>
}

const body1Steps: SceneStep[] = [
  statement(0, 2.2, 'A ferramenta que permite tudo isso se chama OTTO.'),
  {from: 2.2, kind: 'logo', to: 4.65},
  statement(4.65, 7.65, 'Gestão e contabilidade em um só sistema.'),
  {from: 7.65, kind: 'dashboard', to: 12.65},
  statement(12.65, 14.35, 'Um sistema moderno.'),
  prompt(14.35, 20.55, 'Mostre minhas vendas, notas fiscais e contas de hoje.'),
  sync(20.55, 24.15, 'Financeiro atualizado', 'Tudo dentro do próprio ChatGPT', 'Encontrei os lançamentos e organizei o financeiro da empresa.', accountsStatusRows),
  {from: 24.15, kind: 'cta', to: 29.4},
]

const body2Steps: SceneStep[] = [
  statement(0, 4.7, 'Boleto e Pix direto pelo ChatGPT. Envio pelo WhatsApp.'),
  prompt(4.7, 12.65, 'Gere um boleto e um Pix para a Lume Comércio e envie pelo WhatsApp.'),
  sync(12.65, 19.35, 'Cobrança preparada', 'Cliente e valor identificados', 'Identifiquei o cliente e preparei a cobrança. Confira o valor.', billingPreparationRows),
  statement(19.35, 20.8, 'Você só confirma.'),
  sync(20.8, 24.3, 'Boleto e Pix', 'Duas formas de pagamento geradas', 'Valor confirmado. Vou gerar o boleto e o Pix.', billingRows),
  sync(24.3, 28.1, 'Envio WhatsApp', 'Financeiro atualizado', 'Vou enviar a cobrança ao cliente e registrar o contas a receber.', billingDeliveryRows),
  statement(28.1, 30.2, 'Mas não faz só isso.'),
  sync(30.2, 32.3, 'Notas fiscais', 'Emissão acompanhada', 'Também posso emitir as notas fiscais das vendas.', invoiceProgressRows),
  sync(32.3, 34.4, 'Conciliação bancária', 'Movimentações conferidas', 'Vou conciliar os pagamentos recebidos.', reconciliationStatusRows, 'reconciliation'),
  sync(34.4, 36.8, 'Classificação de despesas', 'Categorias atualizadas', 'Agora vou classificar as despesas.', expenseStatusRows),
  sync(36.8, 39.2, 'Contas a pagar e a receber', 'Prazos acompanhados', 'Vou controlar as contas da empresa.', accountsStatusRows),
  sync(39.2, 41.6, 'Vendas', 'Lançamentos atualizados', 'Também vou acompanhar suas vendas.', recentSalesRows),
  sync(41.6, 44.3, 'Estoque', 'Produtos e reposições', 'Vou atualizar o estoque conforme as vendas.', stockRows),
]

const hook2Steps: SceneStep[] = [
  statement(0, 5.7, 'Emita nota fiscal direto pelo ChatGPT.'),
  prompt(5.7, 8.25, 'Emita uma nota fiscal para a Aurora Tecnologia.'),
  sync(8.25, 15.5, 'Dados da nota fiscal', 'Cliente, serviço e valor encontrados', 'Encontrei o cliente e o serviço prestado. Confira os dados da nota.', singlePreparationRows),
  statement(15.5, 17.6, 'Você só confirma o valor.'),
  sync(17.6, 21.95, 'Emissão de nota fiscal', 'Autorização fiscal em andamento', 'Valor confirmado. Vou enviar o RPS e acompanhar a autorização.', singleInvoiceRows),
  sync(21.95, 25.6, 'Operação concluída', 'Nota, envio e financeiro', 'Nota emitida. Vou enviá-la ao cliente e atualizar o contas a receber.', singleDeliveryRows),
]

const hook1Steps: SceneStep[] = [
  statement(0, 3.7, 'Automatize o financeiro da sua empresa com o ChatGPT.'),
  prompt(3.7, 7.17, 'Organize todo o financeiro da minha empresa.'),
  sync(7.17, 12.17, 'Notas, vendas e contas', 'Operações centralizadas', 'Vou emitir as notas, registrar as vendas e organizar as contas.', financialCoreRows),
  sync(12.17, 14.4, 'Conciliação bancária', 'Movimentações conferidas', 'Agora vou conciliar os lançamentos com o banco.', reconciliationStatusRows, 'reconciliation'),
  sync(14.4, 17.17, 'Despesas e cobranças', 'Categorias e clientes acompanhados', 'Vou classificar despesas e cobrar os clientes em atraso.', expenseCollectionRows),
  sync(17.17, 19.97, 'Estoque e contabilidade', 'Produtos e lançamentos atualizados', 'Também vou atualizar o estoque e os dados contábeis.', stockAccountingRows),
  statement(19.97, 24, 'Tudo direto pelo Chat. Basta conversar com a IA.'),
]

const hook3Steps: SceneStep[] = [
  statement(0, 5.85, 'Emita várias notas fiscais de uma vez pelo ChatGPT.'),
  prompt(5.85, 8.1, 'Emita as notas fiscais das minhas vendas recentes.'),
  sync(8.1, 13.25, 'Emissão de múltiplas notas fiscais', 'Cada nota avança pelo próprio status', 'Vou emitir as notas e acompanhar a autorização de cada documento.', invoiceProgressRows),
  sync(13.25, 16.05, 'Lote concluído', 'Clientes e financeiro atualizados', 'Notas emitidas. Vou enviá-las aos clientes e atualizar o financeiro.', batchDeliveryRows),
  sync(16.05, 23.05, 'Dados identificados', 'Cliente, serviço e valor em cada venda', 'Estes são os dados que identifiquei e preenchi automaticamente.', batchDataRows),
  statement(23.05, 26, 'Confira e confirme os valores.'),
]

const hook4Steps: SceneStep[] = [
  statement(0, 3.4, 'Administre sua empresa conversando com o ChatGPT.'),
  prompt(3.4, 6.6, 'Cuide das minhas vendas, notas fiscais e contas.'),
  sync(6.6, 11.72, 'Notas, vendas e contas', 'Operações centralizadas', 'Vou emitir as notas, registrar as vendas e organizar as contas.', financialCoreRows),
  sync(11.72, 14.1, 'Conciliação bancária', 'Movimentações conferidas', 'Agora vou conciliar os lançamentos com o banco.', reconciliationStatusRows, 'reconciliation'),
  sync(14.1, 16.68, 'Despesas e cobranças', 'Categorias e clientes acompanhados', 'Vou classificar despesas e cobrar os clientes em atraso.', expenseCollectionRows),
  sync(16.68, 19.44, 'Estoque e contabilidade', 'Produtos e lançamentos atualizados', 'Também vou atualizar o estoque e os dados contábeis.', stockAccountingRows),
  statement(19.44, 23.2, 'Tudo direto pelo Chat. Basta conversar com a IA.'),
]

export function JulyTimedBody1Video() { return <NarratedTimeline audio="body-1.m4a" steps={body1Steps} /> }
export function JulyTimedBody2Video() { return <NarratedTimeline audio="body-2.m4a" steps={body2Steps} /> }
export function JulyTimedHook1Video() { return <NarratedTimeline audio="hook-1.m4a" steps={hook1Steps} /> }
export function JulyTimedHook2Video() { return <NarratedTimeline audio="hook-2.m4a" steps={hook2Steps} /> }
export function JulyTimedHook3Video() { return <NarratedTimeline audio="hook-3.m4a" steps={hook3Steps} /> }
export function JulyTimedHook4Video() { return <NarratedTimeline audio="hook-4.m4a" steps={hook4Steps} /> }

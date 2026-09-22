import {Wallet} from 'lucide-react'
import {AbsoluteFill, Sequence} from 'remotion'

import type {OttoAiEmployeesResultRow} from './ChatGptClaudeOttoAiEmployeesVideo'
import {
  accountsStatusRows,
  CenteredCtaScene,
  collectionStatusRows,
  ConversationScene,
  invoiceProgressRows,
  PromptScene,
  reconciliationStatusRows,
} from './JulyBodyIllustrativeVideos'
import {OttoFinancialDashboard} from './OttoFinancialDashboard'
import {OttoLogoRevealHorizontal} from './OttoLogoRevealHorizontal'
import {recentSalesRows, SyncScene} from './OttoFinanceAi50sVideo'
import {TypedStatement} from './OttoInvoiceAi60sNarratedVideo'

type Step =
  | {duration: number; kind: 'logo'}
  | {duration: number; kind: 'statement'; text: string}
  | {duration: number; kind: 'prompt'; text: string}
  | {duration: number; kind: 'dashboard'}
  | {duration: number; kind: 'cta'}
  | {
      assistantText: string
      duration: number
      kind: 'sync'
      rows: OttoAiEmployeesResultRow[]
      subtitle: string
      title: string
      variant?: 'reconciliation'
    }

const statement = (text: string, duration = 70): Step => ({duration, kind: 'statement', text})
const prompt = (text: string, duration = 70): Step => ({duration, kind: 'prompt', text})
const sync = (title: string, subtitle: string, assistantText: string, rows: OttoAiEmployeesResultRow[], duration = 105, variant?: 'reconciliation'): Step => ({assistantText, duration, kind: 'sync', rows, subtitle, title, variant})

const overviewRows: OttoAiEmployeesResultRow[] = [
  {background: '#dbeafe', description: 'Pedidos e clientes em um só lugar', initials: 'VD', name: 'Vendas', status: 'Atualizadas', statusColor: '#1d4ed8', tone: '#2563eb', value: '32 vendas'},
  {background: '#dcfce7', description: 'Documentos vinculados às vendas', initials: 'NF', name: 'Notas fiscais', status: 'Organizadas', statusColor: '#166534', tone: '#16a34a', value: '28 notas'},
  {background: '#fef3c7', description: 'Pagamentos e recebimentos acompanhados', initials: 'FN', name: 'Financeiro', status: 'Em dia', statusColor: '#a16207', tone: '#d97757', value: 'R$ 84.600'},
  {background: '#f3e8ff', description: 'Lançamentos prontos para conferência', initials: 'CT', name: 'Contabilidade', status: 'Conciliada', statusColor: '#7e22ce', tone: '#7c3aed', value: 'Setembro'},
]

const boletoRows: OttoAiEmployeesResultRow[] = [
  {background: '#dbeafe', description: 'Cobrança vinculada à venda', icon: Wallet, initials: 'BL', name: 'Boleto · Lume Comércio', status: 'Emitido', statusColor: '#1d4ed8', tone: '#2563eb', value: 'R$ 2.480'},
  {background: '#fef3c7', description: 'Vencimento em 7 dias', icon: Wallet, initials: 'BL', name: 'Boleto · Aurora Tecnologia', status: 'Enviado', statusColor: '#a16207', tone: '#d97757', value: 'R$ 4.000'},
  {background: '#dcfce7', description: 'Pagamento identificado no banco', icon: Wallet, initials: 'BL', name: 'Boleto · Boa Vista', status: 'Pago', statusColor: '#166534', tone: '#16a34a', value: 'R$ 1.850'},
]

const body1Steps: Step[] = [
  {duration: 72, kind: 'logo'},
  statement('A ferramenta que permite tudo isso se chama OTTO.', 82),
  statement('Vendas, notas fiscais, financeiro e contabilidade. Tudo em um só lugar.', 100),
  prompt('Mostre a visão completa da minha empresa.', 72),
  sync('Operação centralizada', 'Todas as áreas conectadas', 'Vou reunir as vendas, notas, financeiro e contabilidade para você.', overviewRows, 112),
  {duration: 128, kind: 'dashboard'},
  statement('Sem planilhas. Sem precisar entrar no site do sistema.', 88),
  prompt('Organize minhas vendas e contas de hoje.', 68),
  sync('Gestão pelo ChatGPT', 'Vendas e financeiro atualizados', 'Vou registrar as vendas e organizar as contas diretamente por aqui.', recentSalesRows.slice(0, 6), 106),
  statement('Você faz tudo dentro do próprio ChatGPT.', 78),
  {duration: 125, kind: 'cta'},
]

const body2Steps: Step[] = [
  {duration: 72, kind: 'logo'},
  statement('Por trás disso está o OTTO: gestão e contabilidade em um só sistema.', 100),
  prompt('Como está minha empresa hoje?', 68),
  {duration: 125, kind: 'dashboard'},
  statement('Vendas, notas fiscais, financeiro e contabilidade. Tudo conectado.', 92),
  prompt('Emita as notas e organize minhas contas de hoje.', 75),
  sync('Emissão de notas fiscais', 'Documentos acompanhados até a autorização', 'Vou emitir as notas das vendas e acompanhar cada autorização.', invoiceProgressRows.slice(0, 6), 125),
  sync('Contas a pagar e a receber', 'Vencimentos e recebimentos organizados', 'Agora vou atualizar suas contas a pagar e a receber.', accountsStatusRows, 112),
  prompt('Concilie o banco e acompanhe as vendas.', 65),
  sync('Conciliação bancária', 'Movimentações conferidas', 'Vou conferir as movimentações bancárias com os lançamentos.', reconciliationStatusRows, 115, 'reconciliation'),
  sync('Vendas', 'Clientes e valores atualizados', 'Também vou acompanhar as vendas mais recentes.', recentSalesRows.slice(0, 6), 105),
  prompt('Emita os boletos e cobre os clientes em atraso.', 72),
  sync('Boletos', 'Cobranças vinculadas às vendas', 'Vou emitir os boletos para os valores pendentes.', boletoRows, 100),
  sync('Clientes em atraso', 'Cobranças enviadas e acompanhadas', 'Agora vou cobrar os clientes em atraso e acompanhar as respostas.', collectionStatusRows, 110),
  statement('Tudo no ChatGPT. Sem planilhas e sem ficar entrando no sistema.', 95),
  statement('Com o OTTO, você conversa e administra sua empresa.', 100),
]

function BodyTimeline({steps}: {steps: Step[]}) {
  let from = 0

  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      {steps.map((step, index) => {
        const start = from
        from += step.duration

        return (
          <Sequence durationInFrames={step.duration} from={start} key={`${index}-${step.kind}`}>
            {step.kind === 'logo' ? <OttoLogoRevealHorizontal centerX={45} centerY="50%" /> : null}
            {step.kind === 'statement' ? <TypedStatement duration={step.duration} speed={0.85} text={step.text} /> : null}
            {step.kind === 'prompt' ? <PromptScene duration={step.duration} prompt={step.text} /> : null}
            {step.kind === 'dashboard' ? <OttoFinancialDashboard animationSpeed={1.5} showExtendedKpis /> : null}
            {step.kind === 'cta' ? <CenteredCtaScene /> : null}
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

export const OTTO_BODY_1_DURATION = body1Steps.reduce((sum, step) => sum + step.duration, 0)
export const OTTO_BODY_2_DURATION = body2Steps.reduce((sum, step) => sum + step.duration, 0)

export const OttoBodySystemBehindVideo = () => <BodyTimeline steps={body1Steps} />
export const OttoBodyManageByConversationVideo = () => <BodyTimeline steps={body2Steps} />

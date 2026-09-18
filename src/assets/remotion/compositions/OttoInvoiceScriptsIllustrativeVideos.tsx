import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion'

import {IOS_REMOTION_FONT_STACK} from '@/assets/remotion/fonts/sfPro'

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
import {fiscalRows, invoiceEmissionRows, recentSalesRows, SyncScene} from './OttoFinanceAi50sVideo'
import {TypedStatement} from './OttoInvoiceAi60sNarratedVideo'

export const OTTO_SINGLE_INVOICE_SCRIPT_DURATION = 1590
export const OTTO_BATCH_INVOICE_SCRIPT_DURATION = 1670

const fiscalStatusStyles = [
  {background: '#eff6ff', color: '#1d4ed8'},
  {background: '#fef3c7', color: '#a16207'},
  {background: '#f5f3ff', color: '#6d28d9'},
  {background: '#dcfce7', color: '#166534'},
  {background: '#f3e8ff', color: '#7e22ce'},
]

const singleInvoiceRows = invoiceEmissionRows.slice(0, 1).map((item) => ({
  ...item,
  description: 'Aurora Tecnologia · Consultoria financeira',
  status: 'Nota emitida',
  statusStageStyles: fiscalStatusStyles,
  statusStages: ['Cliente identificado', 'Valor confirmado', 'RPS enviado', 'Aguardando Prefeitura', 'Nota emitida'],
  value: 'R$ 4.000',
}))

const singleDeliveryRows = [
  {...invoiceEmissionRows[0], description: 'PDF e XML gerados', name: 'NFS-e #02841', status: 'Nota emitida', statusColor: '#166534', background: '#dcfce7', value: 'R$ 4.000'},
  {...invoiceEmissionRows[0], description: 'Enviada para financeiro@aurora.com.br', initials: 'EM', name: 'Envio ao cliente', status: 'Entregue', statusColor: '#1d4ed8', background: '#dbeafe', value: 'E-mail'},
  {...invoiceEmissionRows[0], description: 'Venda #01942 vinculada à nota', initials: 'CR', name: 'Contas a receber', status: 'Atualizado', statusColor: '#7e22ce', background: '#f3e8ff', value: 'R$ 4.000'},
]

const batchDeliveryColors = [
  {background: '#dcfce7', statusColor: '#166534'},
  {background: '#dbeafe', statusColor: '#1d4ed8'},
  {background: '#f3e8ff', statusColor: '#7e22ce'},
  {background: '#ccfbf1', statusColor: '#0f766e'},
  {background: '#ffedd5', statusColor: '#c2410c'},
  {background: '#fef3c7', statusColor: '#a16207'},
]
const batchDeliveryRows = invoiceEmissionRows.slice(0, 6).map((item, index) => ({
  ...item,
  ...batchDeliveryColors[index],
  description: `${item.description.split(' · ')[1]} · PDF e XML enviados`,
  status: index % 2 === 0 ? 'Entregue' : 'Financeiro atualizado',
}))

function ChatGptClaudeIntegrationScene() {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const second = interpolate(frame, [12, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})

  return (
    <AbsoluteFill style={{alignItems: 'center', background: '#ffffff', color: '#181818', display: 'flex', fontFamily: IOS_REMOTION_FONT_STACK, justifyContent: 'center'}}>
      <div style={{opacity: enter, textAlign: 'center', transform: `translateY(${(1 - enter) * 12}px)`}}>
        <strong style={{display: 'block', fontSize: 48, fontWeight: 760, letterSpacing: 0, lineHeight: 1.08}}>Administre sua empresa conversando.</strong>
        <span style={{color: '#666666', display: 'block', fontSize: 24, marginTop: 14, opacity: second}}>O Otto opera diretamente dentro do seu ChatGPT ou Claude.</span>
        <div style={{alignItems: 'center', display: 'flex', gap: 22, justifyContent: 'center', marginTop: 34, opacity: second}}>
          <div style={{alignItems: 'center', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: 8, display: 'flex', height: 82, justifyContent: 'center', width: 260}}>
            <Img src={staticFile('gptLogo.svg')} style={{height: 42, objectFit: 'contain', width: 180}} />
          </div>
          <span style={{color: '#b2b2b2', fontSize: 30}}>+</span>
          <div style={{alignItems: 'center', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: 8, display: 'flex', height: 82, justifyContent: 'center', width: 260}}>
            <Img src={staticFile('claudeLogo.svg')} style={{height: 44, objectFit: 'contain', width: 190}} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function SharedOttoOperations({start}: {start: number}) {
  return (
    <>
      <Sequence from={start} durationInFrames={50}>
        <TypedStatement duration={50} speed={0.65} text="Mas o Otto não faz só isso." />
      </Sequence>
      <Sequence from={start + 50} durationInFrames={115}>
        <ConversationScene>
          <SyncScene assistantText="Vou conciliar as movimentações bancárias com os lançamentos do financeiro." duration={115} kind="reconciliation" paceToDuration rows={reconciliationStatusRows} subtitle="Bancos e lançamentos conferidos" title="Conciliação bancária" />
        </ConversationScene>
      </Sequence>
      <Sequence from={start + 165} durationInFrames={110}>
        <ConversationScene>
          <SyncScene assistantText="Agora vou classificar automaticamente cada despesa." duration={110} paceToDuration rows={expenseStatusRows} subtitle="Categorias contábeis atualizadas" title="Classificação de despesas" />
        </ConversationScene>
      </Sequence>
      <Sequence from={start + 275} durationInFrames={115}>
        <ConversationScene>
          <SyncScene assistantText="Vou organizar as contas a pagar e a receber e acompanhar os vencimentos." duration={115} paceToDuration rows={accountsStatusRows} subtitle="Pagamentos e recebimentos sob controle" title="Contas a pagar e a receber" />
        </ConversationScene>
      </Sequence>
      <Sequence from={start + 390} durationInFrames={110}>
        <ConversationScene>
          <SyncScene assistantText="Também vou cobrar os clientes em atraso e acompanhar cada retorno." duration={110} paceToDuration rows={collectionStatusRows} subtitle="Lembretes e cobranças automáticas" title="Clientes em atraso" />
        </ConversationScene>
      </Sequence>
      <Sequence from={start + 500} durationInFrames={110}>
        <ConversationScene>
          <SyncScene assistantText="Vou verificar o calendário, o regime tributário e as obrigações fiscais da empresa." duration={110} paceToDuration rows={fiscalRows} subtitle="Calendário e entregas fiscais conferidos" title="Obrigações fiscais" />
        </ConversationScene>
      </Sequence>
      <Sequence from={start + 610} durationInFrames={60}>
        <PromptScene duration={60} prompt="Crie uma visão completa das vendas, notas, financeiro e contabilidade." />
      </Sequence>
      <Sequence from={start + 670} durationInFrames={120}>
        <OttoFinancialDashboard animationSpeed={1.85} showExtendedKpis />
      </Sequence>
      <Sequence from={start + 790} durationInFrames={110}>
        <ChatGptClaudeIntegrationScene />
      </Sequence>
      <Sequence from={start + 900} durationInFrames={180}>
        <CenteredCtaScene />
      </Sequence>
    </>
  )
}

export function OttoSingleInvoiceScriptIllustrativeVideo() {
  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      <Sequence durationInFrames={90}>
        <TypedStatement duration={90} speed={0.58} text="Agora você emite nota fiscal direto pelo ChatGPT." />
      </Sequence>
      <Sequence from={90} durationInFrames={70}>
        <PromptScene duration={70} prompt="Emita a nota fiscal do serviço prestado para a Aurora Tecnologia." />
      </Sequence>
      <Sequence from={160} durationInFrames={150}>
        <ConversationScene>
          <SyncScene assistantText="Identifiquei o cliente e o serviço. O valor é R$ 4.000,00. Após sua confirmação, vou emitir a nota." duration={150} invoicePreview invoicePreviewStart={112} paceToDuration rows={singleInvoiceRows} subtitle="Cliente, serviço e valor preenchidos automaticamente" title="Emissão de uma nota fiscal" />
        </ConversationScene>
      </Sequence>
      <Sequence from={310} durationInFrames={120}>
        <ConversationScene>
          <SyncScene assistantText="Nota emitida. Agora vou enviar os documentos ao cliente e atualizar o contas a receber." duration={120} paceToDuration rows={singleDeliveryRows} subtitle="Documento, envio e financeiro concluídos" title="Operação concluída" />
        </ConversationScene>
      </Sequence>
      <Sequence from={430} durationInFrames={80}>
        <OttoLogoRevealHorizontal centerX={45} centerY="50%" />
      </Sequence>
      <SharedOttoOperations start={510} />
    </AbsoluteFill>
  )
}

export function OttoBatchInvoiceScriptIllustrativeVideo() {
  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      <Sequence durationInFrames={95}>
        <TypedStatement duration={95} speed={0.55} text="Agora você emite várias notas fiscais de uma vez pelo ChatGPT." />
      </Sequence>
      <Sequence from={95} durationInFrames={70}>
        <PromptScene duration={70} prompt="Emita as notas fiscais de todas as vendas recentes." />
      </Sequence>
      <Sequence from={165} durationInFrames={110}>
        <ConversationScene>
          <SyncScene assistantText="Encontrei cada cliente, serviço e valor. Vou conferir os dados antes da emissão em lote." duration={110} paceToDuration rows={recentSalesRows} subtitle="Clientes, serviços e valores identificados" title="Vendas prontas para emissão" />
        </ConversationScene>
      </Sequence>
      <Sequence from={275} durationInFrames={150}>
        <ConversationScene>
          <SyncScene assistantText="Valores confirmados. Vou emitir todas as notas e acompanhar a autorização individual de cada documento." duration={150} paceToDuration rows={invoiceProgressRows} subtitle="Cada nota avança pelo próprio status fiscal" title="Emissão de notas em lote" />
        </ConversationScene>
      </Sequence>
      <Sequence from={425} durationInFrames={95}>
        <ConversationScene>
          <SyncScene assistantText="Todas as notas foram emitidas, enviadas aos clientes corretos e vinculadas ao financeiro." duration={95} paceToDuration rows={batchDeliveryRows} subtitle="Envios e lançamentos atualizados" title="Lote concluído" />
        </ConversationScene>
      </Sequence>
      <Sequence from={520} durationInFrames={70}>
        <OttoLogoRevealHorizontal centerX={45} centerY="50%" />
      </Sequence>
      <SharedOttoOperations start={590} />
    </AbsoluteFill>
  )
}

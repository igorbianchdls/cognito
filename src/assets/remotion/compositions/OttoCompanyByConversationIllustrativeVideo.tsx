import {FileSpreadsheet, Landmark, PackageSearch, ReceiptText, Scale} from 'lucide-react'
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion'

import {IOS_REMOTION_FONT_STACK, loadSfProFonts} from '@/assets/remotion/fonts/sfPro'
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
import {recentSalesRows, SyncScene} from './OttoFinanceAi50sVideo'
import {TypedStatement} from './OttoInvoiceAi60sNarratedVideo'

loadSfProFonts()

export const OTTO_COMPANY_BY_CONVERSATION_DURATION = 1950

const FONT = IOS_REMOTION_FONT_STACK

function progress(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

const stockRows: OttoAiEmployeesResultRow[] = [
  {background: '#dcfce7', description: '142 unidades disponíveis', initials: 'EC', name: 'Estoque central', status: 'Atualizado', statusColor: '#166534', tone: '#16845b', value: 'R$ 84.600'},
  {background: '#dbeafe', description: 'Giro médio de 18 dias', initials: 'PA', name: 'Produto Aurora', status: 'Saudável', statusColor: '#1d4ed8', tone: '#2563eb', value: '38 un.'},
  {background: '#fef3c7', description: 'Abaixo do estoque de segurança', initials: 'PN', name: 'Produto Norte', status: 'Repor', statusColor: '#a16207', tone: '#d97757', value: '5 un.'},
  {background: '#f3e8ff', description: 'Fornecedor Delta · chegada em 3 dias', initials: 'PC', name: 'Pedido de compra #418', status: 'A caminho', statusColor: '#7e22ce', tone: '#7c3aed', value: '24 un.'},
]

const accountingRows: OttoAiEmployeesResultRow[] = [
  {background: '#dcfce7', description: 'Receitas reconhecidas no período', initials: 'VD', name: 'Vendas do dia', status: 'Lançadas', statusColor: '#166534', tone: '#16845b', value: 'R$ 31.800'},
  {background: '#dbeafe', description: 'Centro de custo e categoria aplicados', initials: 'DS', name: 'Despesas', status: 'Classificadas', statusColor: '#1d4ed8', tone: '#2563eb', value: 'R$ 9.240'},
  {background: '#f3e8ff', description: 'Movimentos bancários conferidos', initials: 'BC', name: 'Conciliação', status: 'Atualizada', statusColor: '#7e22ce', tone: '#7c3aed', value: '100%'},
  {background: '#ccfbf1', description: 'Documentos e lançamentos organizados', initials: 'CT', name: 'Movimento contábil', status: 'Pronto', statusColor: '#0f766e', tone: '#0891b2', value: 'Setembro'},
]

function OttoIdentityScene() {
  const frame = useCurrentFrame()
  const logoIn = progress(frame, 0, 20)
  const titleIn = progress(frame, 14, 34)
  const integrationsIn = progress(frame, 32, 54)
  const detailIn = progress(frame, 52, 72)

  return (
    <AbsoluteFill style={{alignItems: 'center', background: '#ffffff', color: '#181818', display: 'flex', fontFamily: FONT, justifyContent: 'center', padding: '0 72px'}}>
      <div style={{alignItems: 'center', display: 'flex', flexDirection: 'column', textAlign: 'center'}}>
        <Img src={staticFile('logoOtto.svg')} style={{height: 132, objectFit: 'contain', opacity: logoIn, transform: `translateY(${(1 - logoIn) * 12}px)`, width: 340}} />
        <strong style={{fontSize: 46, fontWeight: 760, letterSpacing: -1.2, lineHeight: 1.08, marginTop: 4, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 10}px)`}}>O sistema de gestão que funciona dentro do Chat.</strong>
        <div style={{alignItems: 'center', display: 'flex', gap: 16, marginTop: 28, opacity: integrationsIn}}>
          <div style={{alignItems: 'center', background: '#f7f7f7', border: '1px solid #e4e4e4', borderRadius: 12, display: 'flex', gap: 12, height: 76, justifyContent: 'center', width: 246}}>
            <Img src={staticFile('gptLogo.svg')} style={{height: 38, objectFit: 'cover', objectPosition: 'left', width: 38}} />
            <span style={{fontSize: 22, fontWeight: 700}}>ChatGPT</span>
          </div>
          <span style={{color: '#adadad', fontSize: 30}}>+</span>
          <div style={{alignItems: 'center', background: '#f7f7f7', border: '1px solid #e4e4e4', borderRadius: 12, display: 'flex', gap: 12, height: 76, justifyContent: 'center', width: 246}}>
            <Img src={staticFile('claudeLogo.svg')} style={{height: 40, objectFit: 'cover', objectPosition: 'left', width: 40}} />
            <span style={{fontSize: 22, fontWeight: 700}}>Claude</span>
          </div>
        </div>
        <span style={{color: '#666666', fontSize: 22, fontWeight: 520, lineHeight: 1.35, marginTop: 24, maxWidth: 800, opacity: detailIn}}>Financeiro e contabilidade centralizados em um único lugar.</span>
      </div>
    </AbsoluteFill>
  )
}

const disconnectedSystems = [
  {Icon: FileSpreadsheet, color: '#16845b', label: 'Planilhas'},
  {Icon: Landmark, color: '#2563eb', label: 'Financeiro'},
  {Icon: ReceiptText, color: '#7c3aed', label: 'Fiscal'},
  {Icon: PackageSearch, color: '#d97757', label: 'Estoque'},
  {Icon: Scale, color: '#0891b2', label: 'Contabilidade'},
]

function ConversationInsteadOfSystemsScene() {
  const frame = useCurrentFrame()
  const titleIn = progress(frame, 0, 16)
  const cardsOut = progress(frame, 35, 64)
  const chatIn = progress(frame, 46, 72)
  const answerIn = progress(frame, 68, 88)

  return (
    <AbsoluteFill style={{alignItems: 'center', background: '#ffffff', color: '#181818', display: 'flex', fontFamily: FONT, justifyContent: 'center', padding: '0 72px'}}>
      <div style={{position: 'relative', textAlign: 'center', width: '100%'}}>
        <strong style={{display: 'block', fontSize: 43, fontWeight: 750, opacity: titleIn}}>Em vez de planilhas e vários sistemas…</strong>
        <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, opacity: 1 - cardsOut, transform: `translateY(${-cardsOut * 12}px) scale(${1 - cardsOut * 0.06})`}}>
          {disconnectedSystems.map(({Icon, color, label}, index) => (
            <div key={label} style={{alignItems: 'center', background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, opacity: progress(frame, 10 + index * 4, 24 + index * 4), padding: '18px 12px', width: 155}}>
              <Icon color={color} size={27} strokeWidth={1.9} />
              <span style={{fontSize: 16, fontWeight: 650}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{left: '50%', opacity: chatIn, position: 'absolute', top: 88, transform: `translateX(-50%) translateY(${(1 - chatIn) * 16}px)`, width: 760}}>
          <div style={{background: '#f4f4f4', border: '1px solid #e2e2e2', borderRadius: 18, fontSize: 22, fontWeight: 540, marginLeft: 'auto', padding: '18px 22px', textAlign: 'left', width: 520}}>Como está minha empresa hoje?</div>
          <div style={{alignItems: 'center', display: 'flex', gap: 13, marginTop: 20, opacity: answerIn, textAlign: 'left'}}>
            <div style={{alignItems: 'center', background: '#181818', borderRadius: 999, color: '#ffffff', display: 'flex', flex: '0 0 auto', fontSize: 15, fontWeight: 760, height: 42, justifyContent: 'center', width: 42}}>O</div>
            <div style={{fontSize: 22, fontWeight: 620, lineHeight: 1.4}}>Tudo centralizado e atualizado. Vou mostrar a visão completa.</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function CompanyCtaScene() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 0, 20)
  const titleIn = progress(frame, 14, 34)
  const directIn = progress(frame, 30, 48)

  return (
    <AbsoluteFill style={{alignItems: 'center', background: '#ffffff', color: '#181818', display: 'flex', fontFamily: FONT, justifyContent: 'center', padding: '0 80px'}}>
      <div style={{opacity: enter, textAlign: 'center', transform: `translateY(${(1 - enter) * 12}px)`}}>
        <span style={{color: '#666666', display: 'block', fontSize: 25, fontWeight: 600, lineHeight: 1.25, margin: '0 auto 18px', maxWidth: 760}}>Quer administrar sua empresa desse jeito?</span>
        <strong style={{display: 'block', fontSize: 59, fontWeight: 770, letterSpacing: -1, lineHeight: 1.08, opacity: titleIn}}>
          Comente <span style={{background: '#c9f227', borderRadius: 7, display: 'inline-block', padding: '2px 11px'}}>OTTO</span> aqui embaixo.
        </strong>
        <span style={{color: '#555555', display: 'block', fontSize: 27, fontWeight: 540, marginTop: 20, opacity: directIn}}>Eu te chamo no direct.</span>
      </div>
    </AbsoluteFill>
  )
}

export function OttoCompanyByConversationIllustrativeVideo() {
  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      <Sequence durationInFrames={155}>
        <TypedStatement duration={155} speed={0.8} text="A partir de agora, você pode administrar sua empresa simplesmente conversando com o ChatGPT." />
      </Sequence>
      <Sequence from={155} durationInFrames={90}>
        <PromptScene duration={90} prompt="Organize a operação da minha empresa e me mostre o que precisa de atenção hoje." />
      </Sequence>
      <Sequence from={245} durationInFrames={125}>
        <ConversationScene><SyncScene assistantText="Vou começar registrando e organizando as vendas mais recentes." duration={125} paceToDuration rows={recentSalesRows.slice(0, 6)} subtitle="Clientes, serviços e valores registrados" title="Registro de vendas" /></ConversationScene>
      </Sequence>
      <Sequence from={370} durationInFrames={115}>
        <ConversationScene><SyncScene assistantText="Agora vou atualizar as contas a pagar e a receber." duration={115} paceToDuration rows={accountsStatusRows} subtitle="Obrigações e recebimentos acompanhados" title="Contas a pagar e a receber" /></ConversationScene>
      </Sequence>
      <Sequence from={485} durationInFrames={125}>
        <ConversationScene><SyncScene assistantText="Vou emitir as notas fiscais e acompanhar a autorização de cada documento." duration={125} paceToDuration rows={invoiceProgressRows.slice(0, 6)} subtitle="Cada nota avança pelo próprio status fiscal" title="Emissão de notas fiscais" /></ConversationScene>
      </Sequence>
      <Sequence from={610} durationInFrames={110}>
        <ConversationScene><SyncScene assistantText="Vou conciliar as movimentações bancárias com os lançamentos da empresa." duration={110} kind="reconciliation" paceToDuration rows={reconciliationStatusRows} subtitle="Bancos, cartões e lançamentos conferidos" title="Conciliação bancária" /></ConversationScene>
      </Sequence>
      <Sequence from={720} durationInFrames={110}>
        <ConversationScene><SyncScene assistantText="Agora vou classificar automaticamente cada despesa." duration={110} paceToDuration rows={expenseStatusRows} subtitle="Categorias contábeis atualizadas" title="Classificação automática de despesas" /></ConversationScene>
      </Sequence>
      <Sequence from={830} durationInFrames={110}>
        <ConversationScene><SyncScene assistantText="Também vou cobrar os clientes em atraso e acompanhar cada retorno." duration={110} paceToDuration rows={collectionStatusRows} subtitle="Lembretes e cobranças acompanhados" title="Clientes em atraso" /></ConversationScene>
      </Sequence>
      <Sequence from={940} durationInFrames={110}>
        <ConversationScene><SyncScene assistantText="Vou conferir o estoque e destacar o que precisa de reposição." duration={110} paceToDuration rows={stockRows} subtitle="Saldos, giro e reposições monitorados" title="Controle de estoque" /></ConversationScene>
      </Sequence>
      <Sequence from={1050} durationInFrames={110}>
        <ConversationScene><SyncScene assistantText="E vou deixar os movimentos organizados para a contabilidade." duration={110} paceToDuration rows={accountingRows} subtitle="Receitas, despesas e documentos centralizados" title="Contabilidade" /></ConversationScene>
      </Sequence>
      <Sequence from={1160} durationInFrames={110}>
        <TypedStatement duration={110} speed={0.82} text="Tudo isso direto pelo Chat, apenas conversando com a IA." />
      </Sequence>
      <Sequence from={1270} durationInFrames={160}>
        <OttoIdentityScene />
      </Sequence>
      <Sequence from={1430} durationInFrames={100}>
        <ConversationInsteadOfSystemsScene />
      </Sequence>
      <Sequence from={1530} durationInFrames={90}>
        <PromptScene duration={90} prompt="Mostre a visão completa da minha empresa em um único painel." />
      </Sequence>
      <Sequence from={1620} durationInFrames={160}>
        <OttoFinancialDashboard animationSpeed={1.35} showExtendedKpis />
      </Sequence>
      <Sequence from={1780} durationInFrames={170}>
        <CompanyCtaScene />
      </Sequence>
    </AbsoluteFill>
  )
}

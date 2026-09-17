import type {ReactNode} from 'react'
import {Boxes, Clock3, Search, Settings, SquarePen} from 'lucide-react'
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion'

import {IOS_REMOTION_FONT_STACK, loadSfProFonts} from '@/assets/remotion/fonts/sfPro'
import {
  collectionRows,
  CompatibilityScene,
  expenseRows,
  invoiceEmissionRows,
  OutroScene,
  reconciliationRows,
  SyncScene,
} from './OttoFinanceAi50sVideo'
import {accountsRows} from './OttoFinanceAi53sNarratedVideo'
import {OttoFinancialDashboard} from './OttoFinancialDashboard'
import {OttoLogoRevealHorizontal} from './OttoLogoRevealHorizontal'
import {ExactPromptInputScene} from './PromptToChartExactVideo'
import {TypedStatement} from './OttoInvoiceAi60sNarratedVideo'
import {ChatGptConversationChart} from './ChatGptConversationCharts'
import type {ChatGptConversationChartKind} from './ChatGptConversationCharts'

loadSfProFonts()

export const JULY_BODY_ILLUSTRATIVE_1_DURATION = 1091
export const JULY_BODY_ILLUSTRATIVE_2_DURATION = 904

const FONT = IOS_REMOTION_FONT_STACK
const INK = '#181818'
const invoiceStatusStages = [
  'Validando RPS',
  'RPS enviado',
  'Aguardando Prefeitura',
  'NFS-e autorizada',
  'Enviada ao cliente',
  'Financeiro atualizado',
]
const invoiceStatusStageStyles = [
  {background: '#eff6ff', color: '#1d4ed8'},
  {background: '#f5f3ff', color: '#6d28d9'},
  {background: '#fef3c7', color: '#a16207'},
  {background: '#dcfce7', color: '#166534'},
  {background: '#f3e8ff', color: '#7e22ce'},
  {background: '#ccfbf1', color: '#0f766e'},
]
const invoiceProgressRows = invoiceEmissionRows.map((item) => ({
  ...item,
  status: 'Financeiro atualizado',
  statusStageStyles: invoiceStatusStageStyles,
  statusStages: invoiceStatusStages,
}))

function progress(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function ChatGptCollapsedSidebar() {
  const iconStyle = {alignItems: 'center', color: '#171717', display: 'flex', height: 38, justifyContent: 'center', width: 38} as const

  return (
    <aside style={{alignItems: 'center', background: '#f9f9f9', borderRight: '1px solid #e7e7e7', bottom: 0, display: 'flex', flexDirection: 'column', left: 0, padding: '18px 0 15px', position: 'absolute', top: 0, width: 64, zIndex: 30}}>
      <span style={{display: 'block', height: 29, overflow: 'hidden', position: 'relative', width: 29}}>
        <Img src={staticFile('gptLogo.svg')} style={{filter: 'brightness(0)', height: 29, left: 0, maxWidth: 'none', position: 'absolute', top: 0, width: 98}} />
      </span>
      <div style={{display: 'grid', gap: 8, marginTop: 31}}>
        <span style={iconStyle}><SquarePen size={21} strokeWidth={1.8} /></span>
        <span style={iconStyle}><Search size={21} strokeWidth={1.8} /></span>
        <span style={iconStyle}><Clock3 size={21} strokeWidth={1.75} /></span>
        <span style={iconStyle}><Boxes size={21} strokeWidth={1.7} /></span>
      </div>
      <span style={{...iconStyle, marginTop: 'auto'}}><Settings size={21} strokeWidth={1.75} /></span>
      <span style={{alignItems: 'center', background: '#202123', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 11, fontWeight: 700, height: 32, justifyContent: 'center', marginTop: 10, width: 32}}>O</span>
    </aside>
  )
}

function ConversationScene({children}: {children: ReactNode}) {
  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      <ChatGptCollapsedSidebar />
      <div style={{bottom: 0, left: 64, overflow: 'hidden', position: 'absolute', right: 0, top: 0}}>{children}</div>
    </AbsoluteFill>
  )
}

function ChartResponseScene({assistantText, duration, kind}: {assistantText: string; duration: number; kind: ChatGptConversationChartKind}) {
  const frame = useCurrentFrame()
  const opacity = progress(frame, 0, 9) * progress(frame, duration - 9, duration, [1, 0])
  const textIn = progress(frame, 0, 14)

  return (
    <AbsoluteFill style={{alignItems: 'center', background: '#ffffff', display: 'flex', fontFamily: FONT, justifyContent: 'center', opacity}}>
      <div style={{width: 850}}>
        <p style={{color: INK, fontSize: 18, lineHeight: 1.4, margin: '0 0 18px', opacity: textIn, transform: `translateY(${(1 - textIn) * 8}px)`}}>{assistantText}</p>
        <ChatGptConversationChart frame={frame} kind={kind} />
      </div>
    </AbsoluteFill>
  )
}

function PromptScene({duration, prompt}: {duration: number; prompt: string}) {
  return (
    <ConversationScene>
      <ExactPromptInputScene background="#ffffff" duration={duration} label="Por onde começamos?" prompt={prompt} typingDurationScale={0.82} />
    </ConversationScene>
  )
}

function JulyBodyIllustrativeVideo1Content() {
  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      <Audio src={staticFile('remotion/body-july-audio/July1Video.mp4')} />

      <Sequence durationInFrames={97}><TypedStatement duration={97} speed={0.66} text="Essa IA está deixando os contadores preocupados." /></Sequence>
      <Sequence from={97} durationInFrames={53}><OttoLogoRevealHorizontal centerX={45} centerY="50%" /></Sequence>

      <Sequence from={150} durationInFrames={55}><PromptScene duration={55} prompt="Emita as notas fiscais das vendas de hoje pelo ChatGPT." /></Sequence>
      <Sequence from={205} durationInFrames={198}>
        <ConversationScene><SyncScene assistantText="Vou validar os dados, calcular os impostos, emitir as notas, enviá-las aos clientes e atualizar o financeiro." duration={198} rows={invoiceProgressRows} speed={2.3} subtitle="Acompanhe cada etapa da emissão em tempo real" title="Emissão de notas fiscais" /></ConversationScene>
      </Sequence>

      <Sequence from={403} durationInFrames={45}><PromptScene duration={45} prompt="Crie um dashboard com vendas, notas fiscais, financeiro e contabilidade." /></Sequence>
      <Sequence from={448} durationInFrames={89}><OttoFinancialDashboard animationSpeed={1.8} showExtendedKpis /></Sequence>
      <Sequence from={537} durationInFrames={36}><TypedStatement duration={36} speed={0.28} text="Mas não faz só isso." /></Sequence>

      <Sequence from={573} durationInFrames={73}>
        <ConversationScene><SyncScene assistantText="Também vou conciliar as movimentações bancárias." duration={73} kind="reconciliation" rows={reconciliationRows} speed={3} subtitle="Bancos, cartões e lançamentos do Otto" title="Conciliação bancária" /></ConversationScene>
      </Sequence>
      <Sequence from={646} durationInFrames={39}>
        <ConversationScene><SyncScene assistantText="Agora vou classificar as despesas automaticamente." duration={39} rows={expenseRows} speed={3.5} subtitle="Categorias contábeis atualizadas" title="Classificação de despesas" /></ConversationScene>
      </Sequence>
      <Sequence from={685} durationInFrames={55}>
        <ConversationScene><SyncScene assistantText="Vou organizar pagamentos e recebimentos." duration={55} rows={accountsRows} speed={3.4} subtitle="Vencimentos e recebimentos programados" title="Contas a pagar e a receber" /></ConversationScene>
      </Sequence>
      <Sequence from={740} durationInFrames={50}>
        <ConversationScene><SyncScene assistantText="Também vou cobrar os clientes em atraso." duration={50} rows={collectionRows} speed={3.5} subtitle="Lembretes e cobranças automáticas" title="Clientes em atraso" /></ConversationScene>
      </Sequence>

      <Sequence from={790} durationInFrames={58}><PromptScene duration={58} prompt="Mostre todo o meu financeiro em um único relatório." /></Sequence>
      <Sequence from={848} durationInFrames={94}>
        <ConversationScene><ChartResponseScene assistantText="Pronto. Centralizei vendas, notas, financeiro e contabilidade sem planilhas ou trabalho manual." duration={94} kind="cashflow" /></ConversationScene>
      </Sequence>
      <Sequence from={942} durationInFrames={149}><OutroScene duration={149} /></Sequence>
    </AbsoluteFill>
  )
}

function JulyBodyIllustrativeVideo2Content() {
  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      <Audio src={staticFile('remotion/body-july-audio/July2Video.mp4')} />

      <Sequence durationInFrames={75}><TypedStatement duration={75} speed={0.54} text="Se liga nisso aqui." /></Sequence>
      <Sequence from={75} durationInFrames={50}><OttoLogoRevealHorizontal centerX={45} centerY="50%" /></Sequence>
      <Sequence from={125} durationInFrames={45}><TypedStatement duration={45} speed={0.34} text="Um funcionário de IA que cuida do financeiro da sua empresa." /></Sequence>
      <Sequence from={170} durationInFrames={52}><TypedStatement duration={52} speed={0.35} text="E não para por aí." /></Sequence>

      <Sequence from={222} durationInFrames={58}><PromptScene duration={58} prompt="Registre as vendas de hoje, organize as contas e emita as notas fiscais." /></Sequence>
      <Sequence from={280} durationInFrames={47}>
        <ConversationScene><SyncScene assistantText="Vou registrar as vendas e emitir as notas correspondentes." duration={47} rows={invoiceProgressRows} speed={5} subtitle="Acompanhe cada etapa da emissão em tempo real" title="Vendas e notas fiscais" /></ConversationScene>
      </Sequence>
      <Sequence from={327} durationInFrames={44}>
        <ConversationScene><SyncScene assistantText="Agora vou atualizar as contas da empresa." duration={44} rows={accountsRows} speed={3.5} subtitle="Pagamentos e recebimentos organizados" title="Contas a pagar e a receber" /></ConversationScene>
      </Sequence>
      <Sequence from={371} durationInFrames={28}>
        <ConversationScene><SyncScene assistantText="Conciliando os pagamentos bancários." duration={28} kind="reconciliation" rows={reconciliationRows} speed={4} subtitle="Movimentações conferidas" title="Conciliação bancária" /></ConversationScene>
      </Sequence>
      <Sequence from={399} durationInFrames={28}>
        <ConversationScene><SyncScene assistantText="Classificando as despesas." duration={28} rows={expenseRows} speed={4} subtitle="Categorias atualizadas" title="Classificação de despesas" /></ConversationScene>
      </Sequence>
      <Sequence from={427} durationInFrames={27}>
        <ConversationScene><SyncScene assistantText="Enviando as cobranças pendentes." duration={27} rows={collectionRows} speed={4} subtitle="Clientes notificados" title="Cobranças automáticas" /></ConversationScene>
      </Sequence>

      <Sequence from={454} durationInFrames={66}><TypedStatement duration={66} speed={0.45} text="E o melhor: funciona diretamente dentro do seu ChatGPT." /></Sequence>
      <Sequence from={520} durationInFrames={70}><PromptScene duration={70} prompt="Otto, cuide do financeiro da minha empresa sem planilhas e sem trabalho manual." /></Sequence>
      <Sequence from={590} durationInFrames={60}><CompatibilityScene duration={60} /></Sequence>
      <Sequence from={650} durationInFrames={50}><PromptScene duration={50} prompt="Crie um dashboard com a visão completa do meu financeiro." /></Sequence>
      <Sequence from={700} durationInFrames={86}><OttoFinancialDashboard animationSpeed={1.9} showExtendedKpis /></Sequence>
      <Sequence from={786} durationInFrames={118}><OutroScene duration={118} /></Sequence>
    </AbsoluteFill>
  )
}

export function JulyBodyIllustrativeVideo1() {
  return <JulyBodyIllustrativeVideo1Content />
}

export function JulyBodyIllustrativeVideo2() {
  return <JulyBodyIllustrativeVideo2Content />
}

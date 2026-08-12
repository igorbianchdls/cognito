import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion'

import {
  collectionRows,
  CompatibilityScene,
  expenseRows,
  fiscalRows,
  invoiceEmissionRows,
  OutroScene,
  reconciliationRows,
  SyncScene,
} from './OttoFinanceAi50sVideo'
import { OttoFinancialDashboard } from './OttoFinancialDashboard'
import { OttoLogoRevealHorizontal } from './OttoLogoRevealHorizontal'
import { ExactPromptInputScene } from './PromptToChartExactVideo'
import type { OttoAiEmployeesResultRow } from './ChatGptClaudeOttoAiEmployeesVideo'
import { TypingText } from '@/assets/remotion/saas/motionComponents'
import type { SaaSTheme } from '@/assets/remotion/saas/types'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const OTTO_FINANCE_AI_53S_NARRATED_DURATION = 1590

const FONT = IOS_REMOTION_FONT_STACK
const INK = '#181818'

const typingTheme: SaaSTheme = {
  accent: INK,
  accent2: '#747474',
  background: '#ffffff',
  border: '#e5e7eb',
  fontFamily: FONT,
  muted: '#747474',
  panel: '#ffffff',
  positive: '#16845b',
  text: INK,
}

function progress(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function TextBeat({ children, duration }: { children: ReactNode; duration: number }) {
  const frame = useCurrentFrame()
  const opacity = progress(frame, 0, 10) * progress(frame, duration - 10, duration, [1, 0])

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#ffffff', display: 'flex', fontFamily: FONT, justifyContent: 'center', opacity, padding: '0 100px' }}>
      {children}
    </AbsoluteFill>
  )
}

function HookScene() {
  return (
    <TextBeat duration={90}>
      <TypingText
        delay={8}
        speed={0.75}
        style={{ display: 'block', fontSize: 62, fontWeight: 740, lineHeight: 1.14, maxWidth: 1020, textAlign: 'center' }}
        text="Essa IA está deixando os contadores preocupados."
        theme={typingTheme}
      />
    </TextBeat>
  )
}

function MoreThanInvoicesScene() {
  return (
    <TextBeat duration={60}>
      <TypingText
        delay={5}
        speed={0.62}
        style={{ display: 'block', fontSize: 66, fontWeight: 740, lineHeight: 1.12, textAlign: 'center' }}
        text="Mas não faz só isso."
        theme={typingTheme}
      />
    </TextBeat>
  )
}

export const accountsRows: OttoAiEmployeesResultRow[] = [
  { description: 'Vencimento em 14 ago', initials: 'CP', name: 'Contas a pagar', status: 'Programado', tone: '#e97b48', value: 'R$ 18.420' },
  { description: 'Recebimento previsto em 15 ago', initials: 'CR', name: 'Contas a receber', status: 'Acompanhando', tone: '#489de3', value: 'R$ 31.800' },
  { description: 'Fornecedor Delta · 16 ago', initials: 'FD', name: 'Serviços contratados', status: 'Agendado', tone: '#7c3aed', value: 'R$ 6.240' },
  { description: 'Aurora Tecnologia · 16 ago', initials: 'AT', name: 'Venda #01942', status: 'A receber', tone: '#16845b', value: 'R$ 12.400' },
  { description: 'Folha e benefícios · 18 ago', initials: 'RH', name: 'Obrigações trabalhistas', status: 'Programado', tone: '#475569', value: 'R$ 22.760' },
  { description: 'Lume Comércio · 20 ago', initials: 'LC', name: 'Venda #01941', status: 'A receber', tone: '#0891b2', value: 'R$ 8.900' },
]

export function OttoFinanceAi53sNarratedVideo() {
  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Sequence durationInFrames={90}><HookScene /></Sequence>
      <Sequence from={90} durationInFrames={60}><OttoLogoRevealHorizontal /></Sequence>

      <Sequence from={150} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Organize todo o financeiro e a contabilidade da empresa." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={240} durationInFrames={60}><OttoFinancialDashboard /></Sequence>

      <Sequence from={300} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Emita as notas fiscais das minhas vendas recentes." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={390} durationInFrames={120}>
        <SyncScene assistantText="Vou preencher, emitir e enviar as notas, atualizando o financeiro automaticamente." duration={120} invoicePreview invoicePreviewStart={38} rows={invoiceEmissionRows} speed={2.8} subtitle="Notas enviadas e vinculadas ao financeiro" title="Emissão de notas fiscais" />
      </Sequence>

      <Sequence from={510} durationInFrames={60}><MoreThanInvoicesScene /></Sequence>

      <Sequence from={570} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Concilie as movimentações bancárias e classifique as despesas." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={660} durationInFrames={75}>
        <SyncScene assistantText="Vou conciliar cada movimentação com o lançamento correspondente." duration={75} kind="reconciliation" rows={reconciliationRows} speed={2.7} subtitle="Bancos, cartões e lançamentos do Otto" title="Conciliação bancária" />
      </Sequence>
      <Sequence from={735} durationInFrames={75}>
        <SyncScene assistantText="Agora vou atualizar as categorias contábeis de cada despesa." duration={75} rows={expenseRows} speed={2.7} subtitle="Fornecedores, categorias, valores e status" title="Classificação de despesas" />
      </Sequence>
      <Sequence from={810} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Organize as contas a pagar e receber e acompanhe os clientes em atraso." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={900} durationInFrames={75}>
        <SyncScene assistantText="Vou organizar pagamentos e acompanhar tudo o que a empresa tem a receber." duration={75} rows={accountsRows} speed={2.7} subtitle="Vencimentos, recebimentos e pagamentos programados" title="Contas a pagar e a receber" />
      </Sequence>
      <Sequence from={975} durationInFrames={75}>
        <SyncScene assistantText="Também vou enviar as cobranças e acompanhar os clientes em atraso." duration={75} rows={collectionRows} speed={2.7} subtitle="Cobranças e acompanhamentos automáticos" title="Clientes em atraso" />
      </Sequence>
      <Sequence from={1050} durationInFrames={75}>
        <ExactPromptInputScene duration={75} label="Por onde começamos?" prompt="Verifique as obrigações fiscais e encontre formas legais de reduzir impostos." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={1125} durationInFrames={75}>
        <SyncScene assistantText="Vou comparar o regime atual com as oportunidades permitidas pela legislação." duration={75} rows={fiscalRows} speed={2.7} subtitle="Obrigações, regime, créditos e oportunidades legais" title="Análise fiscal e tributária" />
      </Sequence>

      <Sequence from={1200} durationInFrames={120}><CompatibilityScene duration={120} /></Sequence>
      <Sequence from={1320} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Crie um dashboard com vendas, financeiro, contabilidade e notas fiscais." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={1410} durationInFrames={120}><OttoFinancialDashboard /></Sequence>
      <Sequence from={1530} durationInFrames={60}><OutroScene duration={60} /></Sequence>
    </AbsoluteFill>
  )
}

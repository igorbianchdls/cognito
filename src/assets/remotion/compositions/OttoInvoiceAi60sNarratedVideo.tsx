import type { ReactNode } from 'react'
import { Check, MousePointer2 } from 'lucide-react'
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
import { accountsRows } from './OttoFinanceAi53sNarratedVideo'
import { OttoFinancialDashboard } from './OttoFinancialDashboard'
import { OttoLogoRevealHorizontal } from './OttoLogoRevealHorizontal'
import { ExactPromptInputScene } from './PromptToChartExactVideo'
import { TypingText } from '@/assets/remotion/saas/motionComponents'
import type { SaaSTheme } from '@/assets/remotion/saas/types'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const OTTO_INVOICE_AI_60S_NARRATED_DURATION = 1800

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

function TextScene({ children, duration }: { children: ReactNode; duration: number }) {
  const frame = useCurrentFrame()
  const opacity = progress(frame, 0, 10) * progress(frame, duration - 10, duration, [1, 0])

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#ffffff', display: 'flex', fontFamily: FONT, justifyContent: 'center', opacity, padding: '0 100px' }}>
      {children}
    </AbsoluteFill>
  )
}

export function TypedStatement({ duration, speed, text }: { duration: number; speed: number; text: string }) {
  return (
    <TextScene duration={duration}>
      <TypingText
        delay={8}
        speed={speed}
        style={{ display: 'block', fontSize: 62, fontWeight: 740, lineHeight: 1.14, maxWidth: 1060, textAlign: 'center' }}
        text={text}
        theme={typingTheme}
      />
    </TextScene>
  )
}

export function InvoiceConfirmationScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const assistantText = 'Identifiquei o cliente e o serviço prestado. Confirme o valor antes de emitir.'
  const typedCharacters = Math.floor(progress(frame, 2, 30, [0, assistantText.length]))
  const cardIn = progress(frame, 16, 34)
  const cursorMove = progress(frame, 60, 88)
  const click = progress(frame, 88, 98)
  const confirmed = progress(frame, 98, 108)
  const fadeOut = progress(frame, duration - 10, duration, [1, 0])

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: FONT, opacity: fadeOut }}>
      <div style={{ left: '50%', position: 'absolute', top: 94, transform: 'translateX(-50%)', width: 820 }}>
        <div style={{ fontSize: 20, lineHeight: 1.4, minHeight: 56 }}>
          {assistantText.slice(0, typedCharacters)}
          {frame < 34 && Math.floor(frame / 4) % 2 === 0 ? <span style={{ borderRight: '1.5px solid #242424', marginLeft: 2 }}>&nbsp;</span> : null}
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #dedede', borderRadius: 10, boxShadow: '0 24px 58px rgba(15, 23, 42, 0.11)', marginTop: 16, opacity: cardIn, overflow: 'hidden', transform: `translateY(${(1 - cardIn) * 12}px)` }}>
          <header style={{ alignItems: 'center', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', padding: '18px 22px' }}>
            <div><strong style={{ display: 'block', fontSize: 20 }}>Revisar nota fiscal</strong><span style={{ color: '#777777', fontSize: 13 }}>Dados preenchidos automaticamente pela Otto</span></div>
            <span style={{ background: confirmed ? '#ecfdf3' : '#f3f4f6', borderRadius: 999, color: confirmed ? '#166534' : '#555555', fontSize: 13, fontWeight: 700, padding: '8px 11px' }}>{confirmed ? 'Valor confirmado' : 'Aguardando confirmação'}</span>
          </header>

          <div style={{ display: 'grid', gap: 0, gridTemplateColumns: '1fr 1fr 0.8fr', padding: '22px' }}>
            {[
              ['Cliente', 'Aurora Tecnologia'],
              ['Serviço', 'Consultoria em tecnologia'],
              ['Valor', 'R$ 12.400,00'],
            ].map(([label, value], index) => (
              <div key={label} style={{ borderLeft: index ? '1px solid #e8e8e8' : 'none', padding: index ? '0 20px' : '0 20px 0 0' }}>
                <span style={{ color: '#858585', display: 'block', fontSize: 12, marginBottom: 7 }}>{label}</span>
                <strong style={{ display: 'block', fontSize: 16, fontWeight: 650 }}>{value}</strong>
              </div>
            ))}
          </div>

          <footer style={{ alignItems: 'center', background: '#fafafa', borderTop: '1px solid #e8e8e8', display: 'flex', justifyContent: 'flex-end', padding: '14px 20px' }}>
            <button style={{ alignItems: 'center', background: confirmed ? '#16845b' : '#111111', border: 0, borderRadius: 7, color: '#ffffff', display: 'flex', fontFamily: FONT, fontSize: 14, fontWeight: 700, gap: 7, padding: '11px 16px', transform: `scale(${1 - Math.sin(click * Math.PI) * 0.06})` }} type="button">
              {confirmed ? <Check size={17} strokeWidth={2.6} /> : null}{confirmed ? 'Confirmado' : 'Confirmar valor'}
            </button>
          </footer>
        </div>

        <div style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.18))', left: interpolate(cursorMove, [0, 1], [660, 748]), opacity: progress(frame, 52, 60) * progress(frame, 100, 108, [1, 0]), position: 'absolute', top: interpolate(cursorMove, [0, 1], [300, 285]), transform: `scale(${click > 0.45 && click < 0.85 ? 0.82 : 1})`, zIndex: 5 }}>
          <MousePointer2 fill="#ffffff" size={30} strokeWidth={2.2} />
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function OttoInvoiceAi60sNarratedVideo() {
  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Sequence durationInFrames={90}><TypedStatement duration={90} speed={0.75} text="Essa IA está deixando os contadores preocupados." /></Sequence>
      <Sequence from={90} durationInFrames={60}><OttoLogoRevealHorizontal /></Sequence>
      <Sequence from={150} durationInFrames={120}><TypedStatement duration={120} speed={0.55} text="Emita notas fiscais diretamente pelo ChatGPT ou Claude." /></Sequence>

      <Sequence from={270} durationInFrames={105}>
        <ExactPromptInputScene duration={105} label="Por onde começamos?" prompt="Emita a nota fiscal da venda para a Aurora Tecnologia." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={375} durationInFrames={120}><InvoiceConfirmationScene duration={120} /></Sequence>
      <Sequence from={495} durationInFrames={165}>
        <SyncScene assistantText="Valor confirmado. Vou emitir a nota, enviá-la ao cliente e atualizar o financeiro." duration={165} invoicePreview invoicePreviewStart={55} rows={invoiceEmissionRows} speed={2.4} subtitle="Nota autorizada, enviada e vinculada ao financeiro" title="Emissão de nota fiscal" />
      </Sequence>

      <Sequence from={660} durationInFrames={60}><TypedStatement duration={60} speed={0.62} text="Mas não faz só isso." /></Sequence>

      <Sequence from={720} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Concilie as movimentações bancárias e classifique as despesas." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={810} durationInFrames={90}>
        <SyncScene assistantText="Vou cruzar cada movimentação com o lançamento correspondente." duration={90} kind="reconciliation" rows={reconciliationRows} speed={2.5} subtitle="Bancos, cartões e lançamentos do Otto" title="Conciliação bancária" />
      </Sequence>
      <Sequence from={900} durationInFrames={90}>
        <SyncScene assistantText="Agora vou atualizar as categorias contábeis de cada despesa." duration={90} rows={expenseRows} speed={2.5} subtitle="Fornecedores, categorias, valores e status" title="Classificação de despesas" />
      </Sequence>

      <Sequence from={990} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Organize as contas, cobre os atrasados e verifique as obrigações fiscais." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={1080} durationInFrames={60}>
        <SyncScene assistantText="Vou organizar pagamentos e recebimentos." duration={60} rows={accountsRows} speed={3} subtitle="Vencimentos e recebimentos programados" title="Contas a pagar e a receber" />
      </Sequence>
      <Sequence from={1140} durationInFrames={60}>
        <SyncScene assistantText="Agora vou acompanhar os clientes em atraso." duration={60} rows={collectionRows} speed={3} subtitle="Cobranças e acompanhamentos automáticos" title="Clientes em atraso" />
      </Sequence>
      <Sequence from={1200} durationInFrames={60}>
        <SyncScene assistantText="Também vou verificar oportunidades fiscais permitidas pela lei." duration={60} rows={fiscalRows} speed={3} subtitle="Obrigações e economia tributária legal" title="Análise fiscal" />
      </Sequence>

      <Sequence from={1260} durationInFrames={120}><CompatibilityScene duration={120} /></Sequence>
      <Sequence from={1380} durationInFrames={105}>
        <ExactPromptInputScene duration={105} label="Por onde começamos?" prompt="Crie um dashboard com vendas, financeiro, contabilidade e notas fiscais." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={1485} durationInFrames={255}><OttoFinancialDashboard /></Sequence>
      <Sequence from={1740} durationInFrames={60}><OutroScene duration={60} /></Sequence>
    </AbsoluteFill>
  )
}

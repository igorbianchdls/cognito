import type { ComponentType, ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'
import {
  CHATGPT_MOBILE_FONT_STACK,
  ChatGptFlowAssistantText,
  ChatGptFlowUserBubble,
  ChatGptMobileShell,
  ChatGptToolCallCard,
  ChatGptToolResultCard,
  chatGptSequenceStyle,
} from '@/assets/remotion/compositions/ChatGptMobileBase'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const CHATGPT_FINANCIAL_TWO_AGENTS_DURATION = 3080

const FONT = IOS_REMOTION_FONT_STACK

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typed(text: string, amount: number) {
  return text.slice(0, Math.ceil(text.length * amount))
}

function fadeOnlyStyle(frame: number, start: number) {
  return {
    opacity: p(frame, start, start + 18),
    transform: 'translateY(0px)',
  }
}

function stagedScroll(frame: number, points: [number, number, number, number], values: [number, number, number, number]) {
  return interpolate(frame, points, values, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function PromptInputScene({ frame, prompt, start }: { frame: number; prompt: string; start: number }) {
  const local = frame - start
  const sceneIn = p(local, 0, 18)
  const sceneOut = p(local, 78, 106, [1, 0])
  const promptProgress = p(local, 12, 76)
  const inputHeight = interpolate(promptProgress, [0, 0.48, 1], [104, 104, 176], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const text = typed(prompt, promptProgress)

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: CHATGPT_MOBILE_FONT_STACK, opacity: sceneIn * sceneOut, overflow: 'hidden', transform: `translateY(${(1 - sceneIn) * 20 - (1 - sceneOut) * 18}px)` }}>
      <div style={{ alignItems: 'center', display: 'flex', inset: 0, justifyContent: 'center', position: 'absolute' }}>
        <div style={{ alignItems: 'center', background: '#f1f1f1', borderRadius: inputHeight > 124 ? 48 : 999, display: 'flex', height: inputHeight, minHeight: 104, padding: inputHeight > 124 ? '28px 13px 26px 33px' : '0 13px 0 33px', width: 944 }}>
          <span style={{ color: '#333333', fontSize: 54, fontWeight: 300, lineHeight: 1, marginRight: 34 }}>+</span>
          <span style={{ color: '#111111', flex: 1, fontSize: 34, fontWeight: 400, letterSpacing: 0, lineHeight: 1.18, maxHeight: 96, overflow: 'hidden', whiteSpace: 'normal', wordBreak: 'normal' }}>
            {text}
            {promptProgress > 0 && promptProgress < 1 ? <span style={{ background: '#111111', display: local % 18 < 9 ? 'inline-block' : 'none', height: 36, marginLeft: 4, transform: 'translateY(6px)', width: 3 }} /> : null}
          </span>
          <div style={{ alignItems: 'center', display: 'flex', gap: 6, height: 62, justifyContent: 'center', marginLeft: 20, width: 62 }}>
            {[21, 34, 45, 34, 21].map((height, index) => <span key={`${height}-${index}`} style={{ background: '#333333', borderRadius: 999, display: 'block', height, width: 5 }} />)}
          </div>
          <div style={{ alignItems: 'center', background: '#007aff', borderRadius: 999, display: 'flex', gap: 5, height: 78, justifyContent: 'center', marginLeft: 10, width: 78 }}>
            {[20, 35, 48, 35, 20].map((height, index) => <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 6 }} />)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function Spinner({ active }: { active: boolean }) {
  const frame = useCurrentFrame()
  if (!active) {
    return <span style={{ background: '#12b76a', borderRadius: 999, display: 'block', height: 11, width: 11 }} />
  }

  return (
    <span
      style={{
        border: '3px solid #d7d7d7',
        borderRadius: 999,
        borderRightColor: '#111111',
        display: 'block',
        height: 24,
        transform: `rotate(${frame * 20}deg)`,
        width: 24,
      }}
    />
  )
}

const expenses = [
  { amount: 'R$ 1.280', category: 'Software', completeAt: 68, name: 'OpenAI API', tone: '#eef6ff' },
  { amount: 'R$ 420', category: 'Marketing', completeAt: 80, name: 'Meta Ads', tone: '#f0f7ff' },
  { amount: 'R$ 189', category: 'Tarifa bancaria', completeAt: 92, name: 'Banco Inter', tone: '#fff7ed' },
  { amount: 'R$ 2.450', category: 'Logistica', completeAt: 104, name: 'Correios', tone: '#f4f9f2' },
]

const reconciliations = [
  { bank: 'PIX Cliente Norte', completeAt: 76, erp: 'NF-9031', status: 'Conciliado', value: 'R$ 42.100' },
  { bank: 'Cartao Stone', completeAt: 88, erp: 'Lote-552', status: 'Conciliado', value: 'R$ 68.900' },
  { bank: 'Tarifa bancaria', completeAt: 100, erp: 'Sem lancamento', status: 'Revisar', value: 'R$ 189' },
  { bank: 'Boleto Fornecedor', completeAt: 112, erp: 'CP-1182', status: 'Conciliado', value: 'R$ 12.430' },
]

function MiniMark({ color = '#111111' }: { color?: string }) {
  return (
    <span style={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(2, 7px)' }}>
      {[0, 1, 2, 3].map((item) => <span key={item} style={{ background: item % 2 === 0 ? color : '#9ab7aa', borderRadius: 2, display: 'block', height: 7, width: 7 }} />)}
    </span>
  )
}

function ExpenseIcon({ tone }: { tone: string }) {
  return (
    <div style={{ alignItems: 'center', background: tone, border: '1px solid #e7edf0', borderRadius: 10, display: 'grid', height: 38, justifyItems: 'center', width: 38 }}>
      <span style={{ background: '#111111', borderRadius: 3, height: 5, width: 20 }} />
      <span style={{ background: '#111111', borderRadius: 999, height: 7, width: 7 }} />
    </div>
  )
}

function ExpenseRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = expenses[index]
  const rowIn = p(localFrame, 8 + index * 10, 22 + index * 10)
  const complete = localFrame >= item.completeAt

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 18, gridTemplateColumns: '48px 1fr auto 28px', height: 72, opacity: rowIn, padding: '0 28px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <ExpenseIcon tone={item.tone} />
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 23, fontWeight: 560, letterSpacing: -0.1, lineHeight: 1 }}>{item.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 17, fontWeight: 420, lineHeight: 1 }}>{item.amount}</span>
      </div>
      <span style={{ color: complete ? '#166534' : '#111111', fontSize: 21, fontWeight: 500, letterSpacing: -0.1, lineHeight: 1 }}>{complete ? item.category : 'Classificando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function ReconciliationRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = reconciliations[index]
  const rowIn = p(localFrame, 10 + index * 10, 24 + index * 10)
  const complete = localFrame >= item.completeAt
  const review = complete && item.status === 'Revisar'

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 14, gridTemplateColumns: '1fr 44px 1fr auto 28px', height: 72, opacity: rowIn, padding: '0 24px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 20, fontWeight: 610, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.bank}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 16, fontWeight: 420, lineHeight: 1 }}>{item.value}</span>
      </div>
      <span style={{ alignItems: 'center', background: complete ? (review ? '#fff7ed' : '#ecfdf3') : '#f2f4f7', borderRadius: 999, color: complete ? (review ? '#c2410c' : '#166534') : '#667085', display: 'flex', fontSize: 20, fontWeight: 850, height: 38, justifyContent: 'center', width: 38 }}>{complete ? (review ? '!' : '✓') : '·'}</span>
      <div style={{ color: '#111111', fontSize: 20, fontWeight: 520, letterSpacing: -0.1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.erp}</div>
      <span style={{ color: review ? '#c2410c' : complete ? '#166534' : '#111111', fontSize: 19, fontWeight: 540, letterSpacing: -0.1, lineHeight: 1 }}>{complete ? item.status : 'Verificando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function CascadeCard({ children, label, localFrame, progressStart, subtitle, title }: { children: ReactNode; label: string; localFrame: number; progressStart: number; subtitle: string; title: string }) {
  const show = p(localFrame, 0, 18)
  const list = p(localFrame, 34, 62)
  const cardHeight = interpolate(list, [0, 1], [112, 420], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progress = Math.round(interpolate(p(localFrame, progressStart, 124), [0, 1], [18, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <div style={{ opacity: show, transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})` }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, marginBottom: 14, paddingLeft: 10 }}>
        <MiniMark />
        <span style={{ color: '#777777', fontSize: 20, fontWeight: 430, letterSpacing: 0 }}>{label}</span>
      </div>
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)', height: cardHeight, overflow: 'hidden', padding: '16px 0' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#111111', fontSize: 23, fontWeight: 620, letterSpacing: -0.12 }}>{title}</strong>
            <span style={{ color: '#8b8b8b', fontSize: 17, fontWeight: 420 }}>{subtitle}</span>
          </div>
          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#0f8f51', fontSize: 18, fontWeight: 620, padding: '9px 14px' }}>{progress}%</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function AgentOneChat({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - start)
  const opacity = p(frame, start - 12, start + 12) * p(frame, start + 748, start + 790, [1, 0])
  const prompt = 'Classifique as ultimas despesas e concilie bancos, cartoes e movimentacoes.'
  const conversationY = stagedScroll(local, [0, 292, 438, 588], [0, 0, -470, -980])

  return (
    <div style={{ inset: 0, opacity, position: 'absolute' }}>
      <ChatGptMobileShell conversationY={conversationY} promptInputBottom={36}>
        <ChatGptFlowUserBubble style={fadeOnlyStyle(local, 12)}>{prompt}</ChatGptFlowUserBubble>
        <ChatGptFlowAssistantText style={chatGptSequenceStyle(local, 74, 22)}>
          Vou organizar as despesas recentes, classificar cada gasto e depois cruzar bancos, cartoes e ERP.
        </ChatGptFlowAssistantText>
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 150, 16)} toolName="classificar_despesas" />
        <ChatGptToolResultCard style={chatGptSequenceStyle(local, 205, 18)}>
          <CascadeCard label="Classificando despesas sem categoria" localFrame={local - 205} progressStart={12} subtitle="Fornecedor, valor e categoria sugerida" title="Classificacao automatica">
            {expenses.map((_, index) => <ExpenseRow key={index} index={index} localFrame={local - 205} />)}
          </CascadeCard>
        </ChatGptToolResultCard>
        <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(local, 365, 22)}>
          Classifiquei as despesas principais e deixei uma tarifa bancaria como regra recorrente para revisar.
        </ChatGptFlowAssistantText>
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 455, 16)} toolName="conciliar_bancos_cartoes" />
        <ChatGptToolResultCard style={chatGptSequenceStyle(local, 510, 18)}>
          <CascadeCard label="Conciliando banco com ERP" localFrame={local - 510} progressStart={18} subtitle="Movimento bancario x registro no ERP" title="Matching de lancamentos">
            {reconciliations.map((_, index) => <ReconciliationRow key={index} index={index} localFrame={local - 510} />)}
          </CascadeCard>
        </ChatGptToolResultCard>
        <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(local, 665, 22)}>
          Conciliacao concluida: encontrei 3 matches seguros e 1 movimento para revisao.
        </ChatGptFlowAssistantText>
      </ChatGptMobileShell>
    </div>
  )
}

function FinancialReportCard({ progress }: { progress: number }) {
  return (
    <div style={{ alignItems: 'center', background: '#ffffff', border: '1.5px solid #d6cec3', borderRadius: 28, boxShadow: '0 18px 42px rgba(50,45,35,0.10)', display: 'grid', gridTemplateColumns: '174px 1fr', height: 142, opacity: progress, overflow: 'hidden', padding: '0 34px', transform: `translateY(${(1 - progress) * 22}px)`, width: '100%' }}>
      <div style={{ alignItems: 'center', alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative' }}>
        <div style={{ alignItems: 'center', background: '#fbfaf7', border: '1.5px solid #d8d0c4', borderRadius: 18, display: 'flex', height: 126, justifyContent: 'center', transform: 'rotate(-6deg)', width: 126 }}>
          <div style={{ border: '3px solid #252525', borderRadius: 7, display: 'grid', gap: 5, gridTemplateColumns: 'repeat(3, 10px)', padding: 8 }}>
            {[16, 25, 12, 20, 14, 28].map((height, index) => <span key={`${height}-${index}`} style={{ alignSelf: 'end', background: index % 2 === 0 ? '#252525' : '#7b7b7b', borderRadius: 2, display: 'block', height, width: 10 }} />)}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
        <strong style={{ color: '#242424', fontSize: 34, fontWeight: 520, letterSpacing: 0, lineHeight: 1.08, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>relatorio_fluxo_caixa</strong>
        <span style={{ color: '#77736d', fontSize: 27, fontWeight: 440, letterSpacing: 0 }}>Presentation · Dashboard</span>
      </div>
    </div>
  )
}

type CashFlowRow = {
  color: string
  date: string
  description: string
  icon?: ComponentType<{ className?: string }>
  initials: string
  name: string
  status: string
  value: string
}

const payableRows: CashFlowRow[] = [
  { color: '#4285f4', date: 'Hoje', description: 'Midia paga e campanhas', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads', status: 'Prioridade', value: 'R$ 18.400' },
  { color: '#111827', date: '2 dias', description: 'Folha e beneficios', initials: 'FO', name: 'Folha operacional', status: 'Programado', value: 'R$ 64.900' },
  { color: '#95bf47', date: '5 dias', description: 'Plano ecommerce mensal', icon: ShopifyIcon, initials: 'S', name: 'Shopify', status: 'OK', value: 'R$ 12.800' },
  { color: '#f97316', date: '7 dias', description: 'DAS e retencoes federais', initials: 'IR', name: 'Impostos federais', status: 'Revisar', value: 'R$ 31.200' },
]

const receivableRows: CashFlowRow[] = [
  { color: '#0ea5e9', date: 'Hoje', description: 'NF-9031 · servicos recorrentes', initials: 'CN', name: 'Cliente Norte', status: 'Confirmado', value: 'R$ 42.100' },
  { color: '#7c3aed', date: '3 dias', description: 'Contrato enterprise anual', initials: 'GD', name: 'Grupo Delta', status: 'A vencer', value: 'R$ 76.500' },
  { color: '#95bf47', date: '8 dias', description: 'Pedidos integrados Shopify', icon: ShopifyIcon, initials: 'S', name: 'Mercado Sul', status: 'Atraso leve', value: 'R$ 28.900' },
  { color: '#4285f4', date: '12 dias', description: 'Receita de campanhas Google', icon: GoogleAdsIcon, initials: 'G', name: 'Canal B2B', status: 'Confirmado', value: 'R$ 54.700' },
]

function CashFlowSourceIcon({ row }: { row: CashFlowRow }) {
  const Icon = row.icon

  return (
    <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e7edf0', borderRadius: 13, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.06)', color: row.color, display: 'flex', height: 46, justifyContent: 'center', overflow: 'hidden', width: 46 }}>
      {Icon ? <Icon className="h-8 w-8" /> : <span style={{ alignItems: 'center', background: row.color, borderRadius: 10, color: '#ffffff', display: 'flex', fontSize: 15, fontWeight: 780, height: 34, justifyContent: 'center', letterSpacing: -0.2, width: 34 }}>{row.initials}</span>}
    </div>
  )
}

function CashFlowTableCard({
  localFrame,
  rows,
  title,
  tone,
}: {
  localFrame: number
  rows: CashFlowRow[]
  title: string
  tone: 'green' | 'red'
}) {
  const tableIn = p(localFrame, 0, 18)
  const accent = tone === 'green' ? '#16a34a' : '#dc2626'
  const soft = tone === 'green' ? '#ecfdf3' : '#fff1f2'

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 24, boxShadow: '0 16px 42px rgba(15, 23, 42, 0.08)', opacity: tableIn, overflow: 'hidden', transform: `translateY(${(1 - tableIn) * 18}px)` }}>
      <div style={{ alignItems: 'center', borderBottom: '1px solid #eef0f2', display: 'flex', justifyContent: 'space-between', padding: '22px 24px' }}>
        <div>
          <div style={{ color: '#111111', fontSize: 24, fontWeight: 720, letterSpacing: -0.1 }}>{title}</div>
          <div style={{ color: '#7a7a7a', fontSize: 17, fontWeight: 430, marginTop: 5 }}>Vencimentos dos proximos 15 dias</div>
        </div>
        <span style={{ background: soft, borderRadius: 999, color: accent, fontSize: 17, fontWeight: 700, padding: '9px 13px' }}>Atualizado</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.58fr 0.62fr 0.8fr', padding: '12px 24px 0' }}>
        {['Conta', 'Valor', 'Status'].map((item) => (
          <span key={item} style={{ color: '#8a8a8a', fontSize: 15, fontWeight: 700, textTransform: 'uppercase' }}>{item}</span>
        ))}
      </div>
      {rows.map((row, index) => {
        const rowIn = p(localFrame, 20 + index * 10, 36 + index * 10)
        const isAlert = row.status === 'Prioridade' || row.status === 'Revisar' || row.status === 'Atraso leve'
        return (
          <div key={row.name} style={{ alignItems: 'center', borderTop: index === 0 ? '0 solid transparent' : '1px solid #f1f3f5', display: 'grid', gridTemplateColumns: '1.58fr 0.62fr 0.8fr', margin: '0 24px', minHeight: 78, opacity: rowIn, transform: `translateY(${(1 - rowIn) * 10}px)` }}>
            <div style={{ alignItems: 'center', display: 'grid', gap: 13, gridTemplateColumns: '46px 1fr', minWidth: 0 }}>
              <CashFlowSourceIcon row={row} />
              <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
                <strong style={{ color: '#111111', fontSize: 20, fontWeight: 650, letterSpacing: -0.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</strong>
                <span style={{ color: '#8a8a8a', fontSize: 15, fontWeight: 430, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description} · {row.date}</span>
              </div>
            </div>
            <span style={{ color: '#111111', fontSize: 20, fontWeight: 520 }}>{row.value}</span>
            <span style={{ background: isAlert ? '#fff7ed' : soft, borderRadius: 999, color: isAlert ? '#c2410c' : accent, fontSize: 16, fontWeight: 700, justifySelf: 'start', padding: '8px 11px' }}>{row.status}</span>
          </div>
        )
      })}
    </div>
  )
}

function AgentTwoChat({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - start)
  const opacity = p(frame, start - 12, start + 14) * p(frame, start + 785, start + 815, [1, 0])
  const prompt = 'Veja as ultimas contas a pagar e a receber e crie um relatorio com dashboard de fluxo de caixa.'
  const conversationY = stagedScroll(local, [0, 322, 548, 710], [0, 0, -560, -1060])
  const cardIn = p(local, 642, 672)

  return (
    <div style={{ inset: 0, opacity, position: 'absolute' }}>
      <ChatGptMobileShell conversationY={conversationY} promptInputBottom={36}>
        <ChatGptFlowUserBubble style={fadeOnlyStyle(local, 12)}>{prompt}</ChatGptFlowUserBubble>
        <ChatGptFlowAssistantText style={chatGptSequenceStyle(local, 74, 22)}>
          Vou primeiro levantar contas a pagar, depois contas a receber, cruzar os vencimentos e so no final montar o relatorio executivo.
        </ChatGptFlowAssistantText>
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 156, 16)} toolName="buscar_contas_a_pagar" />
        <ChatGptToolResultCard style={chatGptSequenceStyle(local, 210, 18)}>
          <CashFlowTableCard localFrame={local - 210} rows={payableRows} title="Contas a pagar" tone="red" />
        </ChatGptToolResultCard>
        <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(local, 372, 22)}>
          Encontrei R$ 127.300 em compromissos proximos, com impostos e fornecedor cloud exigindo prioridade.
        </ChatGptFlowAssistantText>
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 456, 16)} toolName="buscar_contas_a_receber" />
        <ChatGptToolResultCard style={chatGptSequenceStyle(local, 508, 18)}>
          <CashFlowTableCard localFrame={local - 508} rows={receivableRows} title="Contas a receber" tone="green" />
        </ChatGptToolResultCard>
        <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(local, 650, 22)}>
          A entrada prevista cobre os vencimentos, mas recomendo acompanhar Cliente Norte e Mercado Sul para proteger o caixa.
        </ChatGptFlowAssistantText>
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 704, 16)} toolName="gerar_relatorio_financeiro" />
        <div style={{ ...chatGptSequenceStyle(local, 748, 18), margin: '0 36px' }}>
          <FinancialReportCard progress={cardIn} />
        </div>
      </ChatGptMobileShell>
    </div>
  )
}

function ReportSlideScene({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = frame - start
  const sceneIn = p(local, 0, 26)
  const sceneOut = p(local, 170, 198, [1, 0])
  const bars = [86, 122, 74, 154, 112, 138]

  return (
    <div style={{ background: '#e8edf4', inset: 0, opacity: sceneIn * sceneOut, position: 'absolute' }}>
      <div style={{ color: '#475467', fontSize: 24, fontWeight: 750, left: 66, position: 'absolute', top: 154 }}>Financial report</div>
      <div style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 22, boxShadow: '0 34px 92px rgba(15,23,42,0.18)', height: 790, left: 42, overflow: 'hidden', position: 'absolute', right: 42, top: 500, transform: `scale(${p(local, 0, 26, [0.94, 1])})` }}>
        <div style={{ background: '#f7f7f7', borderBottom: '1px solid #dddddd', height: 86, padding: '22px 28px' }}>
          <span style={{ color: '#344054', fontSize: 22, fontWeight: 780 }}>relatorio_fluxo_caixa.pptx</span>
        </div>
        <div style={{ display: 'grid', gap: 22, padding: 34 }}>
          <div>
            <h1 style={{ color: '#111827', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 42, letterSpacing: 0, lineHeight: 1.05, margin: 0 }}>Fluxo de caixa e compromissos</h1>
            <p style={{ color: '#667085', fontSize: 20, fontWeight: 520, lineHeight: 1.35, margin: '12px 0 0' }}>Resumo de contas a pagar, contas a receber e caixa projetado para os proximos 30 dias.</p>
          </div>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              ['A receber', 'R$ 312k', '#0f8f51'],
              ['A pagar', 'R$ 184k', '#c2410c'],
              ['Caixa proj.', 'R$ 465k', '#2563eb'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: '#f9fafb', border: '1px solid #eaecf0', borderRadius: 18, padding: 18 }}>
                <div style={{ color: '#667085', fontSize: 16, fontWeight: 700 }}>{label}</div>
                <div style={{ color, fontSize: 32, fontWeight: 850, marginTop: 8 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #eaecf0', borderRadius: 20, padding: 22 }}>
            <div style={{ color: '#111827', fontSize: 22, fontWeight: 820, marginBottom: 18 }}>Projecao por semana</div>
            <div style={{ alignItems: 'end', display: 'flex', gap: 18, height: 220 }}>
              {bars.map((height, index) => <span key={height} style={{ background: index < 2 ? '#94a3b8' : '#2563eb', borderRadius: 9, flex: 1, height: height * p(local, 48 + index * 5, 84 + index * 5) }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardScene({ end, start }: { end?: number; start: number }) {
  const frame = useCurrentFrame()
  const local = frame - start
  const sceneIn = p(local, 0, 30)
  const sceneOut = end === undefined ? 1 : p(frame, end, end + 24, [1, 0])
  const lineProgress = p(local, 56, 120)
  const bars = [78, 132, 98, 162, 118, 188]

  return (
    <div style={{ background: '#06111f', inset: 0, opacity: sceneIn * sceneOut, position: 'absolute' }}>
      <div style={{ color: '#dbeafe', fontSize: 26, fontWeight: 800, left: 66, position: 'absolute', top: 152 }}>Dashboard de caixa</div>
      <div style={{ background: '#0b1b2d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 36, boxShadow: '0 34px 92px rgba(0,0,0,0.36)', left: 38, minHeight: 1240, overflow: 'hidden', padding: 30, position: 'absolute', right: 38, top: 330, transform: `translateY(${(1 - p(local, 8, 34)) * 28}px) scale(${0.96 + p(local, 8, 34) * 0.04})` }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ color: '#ffffff', fontSize: 31, fontWeight: 860 }}>Panorama financeiro</div>
            <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 17, fontWeight: 520, marginTop: 7 }}>Pagar, receber e fluxo de caixa</div>
          </div>
          <span style={{ background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: 999, color: '#4ade80', fontSize: 16, fontWeight: 780, padding: '10px 14px' }}>Atualizado</span>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {[
            ['Saldo atual', 'R$ 465k', '#22c55e'],
            ['Receber 30d', 'R$ 312k', '#38bdf8'],
            ['Pagar 30d', 'R$ 184k', '#fb7185'],
            ['Folga caixa', '42 dias', '#a78bfa'],
          ].map(([label, value, color], index) => {
            const tileIn = p(local, 34 + index * 6, 58 + index * 6)
            return (
              <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, opacity: tileIn, padding: 22, transform: `translateY(${(1 - tileIn) * 18}px)` }}>
                <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 16, fontWeight: 680 }}>{label}</div>
                <div style={{ color, fontSize: 38, fontWeight: 860, marginTop: 10 }}>{value}</div>
              </div>
            )
          })}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 26, marginTop: 18, padding: 24 }}>
          <div style={{ color: '#ffffff', fontSize: 23, fontWeight: 820, marginBottom: 18 }}>Fluxo projetado</div>
          <svg height="230" viewBox="0 0 900 230" width="100%">
            <path d="M20 180 C140 150 190 168 270 118 C350 70 430 118 510 84 C610 42 690 94 780 58 C830 38 870 42 890 30" fill="none" stroke="#38bdf8" strokeLinecap="round" strokeWidth="7" strokeDasharray="980" strokeDashoffset={(1 - lineProgress) * 980} />
            <path d="M20 180 C140 150 190 168 270 118 C350 70 430 118 510 84 C610 42 690 94 780 58 C830 38 870 42 890 30 L890 220 L20 220 Z" fill="rgba(56,189,248,0.12)" opacity={lineProgress} />
          </svg>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 26, marginTop: 18, padding: 24 }}>
          <div style={{ color: '#ffffff', fontSize: 23, fontWeight: 820, marginBottom: 18 }}>Receitas vs despesas</div>
          <div style={{ alignItems: 'end', display: 'flex', gap: 18, height: 210 }}>
            {bars.map((height, index) => <span key={`${height}-${index}`} style={{ background: index % 2 === 0 ? '#22c55e' : '#fb7185', borderRadius: 9, flex: 1, height: height * p(local, 88 + index * 5, 124 + index * 5) }} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

const fiscalDocuments = [
  { detail: 'PDF + XML', name: 'Contrato Cliente Norte', status: 'Validado', tone: '#eef6ff' },
  { detail: 'Servico aprovado', name: 'OS-2048', status: 'Conferido', tone: '#f0f7ff' },
  { detail: 'Cadastro municipal', name: 'Tomador', status: 'OK', tone: '#f4f9f2' },
  { detail: 'Retencoes calculadas', name: 'Impostos', status: 'OK', tone: '#fff7ed' },
]

const taxObligations = [
  { due: 'Hoje', name: 'ISS retido', status: 'Calculado', value: 'R$ 248,00' },
  { due: '7 dias', name: 'DAS', status: 'Programado', value: 'R$ 1.184,00' },
  { due: '15 dias', name: 'SPED fiscal', status: 'Em dia', value: 'OK' },
  { due: 'Mensal', name: 'Livro fiscal', status: 'Atualizado', value: 'OK' },
]

function FiscalDocumentRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = fiscalDocuments[index]
  const rowIn = p(localFrame, 8 + index * 10, 22 + index * 10)
  const complete = localFrame >= 64 + index * 12

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 18, gridTemplateColumns: '48px 1fr auto 28px', height: 72, opacity: rowIn, padding: '0 28px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <div style={{ alignItems: 'center', background: item.tone, border: '1px solid #e7edf0', borderRadius: 10, display: 'grid', height: 38, justifyItems: 'center', width: 38 }}>
        <span style={{ border: '2px solid #111111', borderRadius: 4, display: 'block', height: 24, position: 'relative', width: 20 }}>
          <span style={{ background: '#111111', borderRadius: 999, height: 2, left: 4, position: 'absolute', top: 7, width: 11 }} />
          <span style={{ background: '#111111', borderRadius: 999, height: 2, left: 4, position: 'absolute', top: 13, width: 8 }} />
        </span>
      </div>
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 23, fontWeight: 560, letterSpacing: -0.1, lineHeight: 1 }}>{item.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 17, fontWeight: 420, lineHeight: 1 }}>{item.detail}</span>
      </div>
      <span style={{ color: complete ? '#166534' : '#111111', fontSize: 21, fontWeight: 500, letterSpacing: -0.1, lineHeight: 1 }}>{complete ? item.status : 'Verificando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function TaxObligationRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = taxObligations[index]
  const rowIn = p(localFrame, 8 + index * 10, 22 + index * 10)
  const complete = localFrame >= 62 + index * 12
  const alert = item.due === 'Hoje' || item.due === '7 dias'

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 14, gridTemplateColumns: '1fr auto auto 28px', height: 72, opacity: rowIn, padding: '0 24px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 21, fontWeight: 610, letterSpacing: -0.1, lineHeight: 1 }}>{item.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 16, fontWeight: 420, lineHeight: 1 }}>{item.value}</span>
      </div>
      <span style={{ background: alert ? '#fff7ed' : '#ecfdf3', borderRadius: 999, color: alert ? '#c2410c' : '#166534', fontSize: 17, fontWeight: 760, padding: '8px 12px' }}>{item.due}</span>
      <span style={{ color: complete ? '#166534' : '#111111', fontSize: 19, fontWeight: 540, letterSpacing: -0.1, lineHeight: 1 }}>{complete ? item.status : 'Checando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function InvoiceFileCard({ click, progress }: { click: number; progress: number }) {
  return (
    <div style={{ alignItems: 'center', background: click > 0.45 ? '#f7f7f7' : '#ffffff', border: '1.5px solid #d6cec3', borderRadius: 28, boxShadow: '0 18px 42px rgba(50,45,35,0.10)', display: 'grid', gridTemplateColumns: '174px 1fr', height: 142, opacity: progress, overflow: 'hidden', padding: '0 34px', transform: `translateY(${(1 - progress) * 22}px) scale(${1 - Math.sin(click * Math.PI) * 0.018})`, width: '100%' }}>
      <div style={{ alignItems: 'center', alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative' }}>
        <div style={{ alignItems: 'center', background: '#fffaf3', border: '1.5px solid #d8d0c4', borderRadius: 18, display: 'flex', height: 126, justifyContent: 'center', transform: 'rotate(-6deg)', width: 126 }}>
          <div style={{ border: '3px solid #252525', borderRadius: 6, height: 52, position: 'relative', width: 40 }}>
            <span style={{ background: '#252525', borderRadius: 999, height: 4, left: 8, position: 'absolute', top: 13, width: 24 }} />
            <span style={{ background: '#252525', borderRadius: 999, height: 4, left: 8, position: 'absolute', top: 24, width: 18 }} />
            <span style={{ background: '#12b76a', borderRadius: 999, bottom: -10, height: 20, position: 'absolute', right: -10, width: 20 }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
        <strong style={{ color: '#242424', fontSize: 34, fontWeight: 520, letterSpacing: 0, lineHeight: 1.08, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>nota_fiscal_servico_2048</strong>
        <span style={{ color: '#77736d', fontSize: 27, fontWeight: 440, letterSpacing: 0 }}>Nota fiscal · NFS-e</span>
      </div>
    </div>
  )
}

function AgentThreeChat({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - start)
  const opacity = p(frame, start - 12, start + 14) * p(frame, start + 625, start + 655, [1, 0])
  const prompt = 'Organize documentos, notas fiscais e impostos pendentes, e emita a nota fiscal do ultimo servico aprovado.'
  const conversationY = stagedScroll(local, [0, 236, 386, 548], [0, 0, -410, -870])
  const click = p(local, 586, 596)
  const cardIn = p(local, 548, 578)

  return (
    <div style={{ inset: 0, opacity, position: 'absolute' }}>
      <ChatGptMobileShell conversationY={conversationY} promptInputBottom={36}>
        <ChatGptFlowUserBubble style={fadeOnlyStyle(local, 12)}>{prompt}</ChatGptFlowUserBubble>
        <ChatGptFlowAssistantText style={chatGptSequenceStyle(local, 74, 22)}>
          Vou revisar documentos, informacoes contabeis, impostos e emitir a NFS-e do servico aprovado.
        </ChatGptFlowAssistantText>
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 132, 16)} toolName="organizar_documentos_fiscais" />
        <ChatGptToolResultCard style={chatGptSequenceStyle(local, 174, 18)}>
          <CascadeCard label="Validando documentos fiscais" localFrame={local - 174} progressStart={12} subtitle="Documentos, XML e dados do tomador" title="Documentos conferidos">
            {fiscalDocuments.map((_, index) => <FiscalDocumentRow key={index} index={index} localFrame={local - 174} />)}
          </CascadeCard>
        </ChatGptToolResultCard>
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 310, 16)} toolName="verificar_obrigacoes_fiscais" />
        <ChatGptToolResultCard style={chatGptSequenceStyle(local, 350, 18)}>
          <CascadeCard label="Checando impostos e obrigacoes" localFrame={local - 350} progressStart={10} subtitle="Vencimentos, retencoes e registros fiscais" title="Obrigacoes fiscais">
            {taxObligations.map((_, index) => <TaxObligationRow key={index} index={index} localFrame={local - 350} />)}
          </CascadeCard>
        </ChatGptToolResultCard>
        <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(local, 486, 22)}>
          Tudo conferido. Vou emitir a nota fiscal do ultimo servico aprovado e gerar PDF/XML.
        </ChatGptFlowAssistantText>
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 528, 16)} toolName="emitir_nota_fiscal" />
        <div style={{ ...chatGptSequenceStyle(local, 548, 18), margin: '0 36px' }}>
          <InvoiceFileCard click={click} progress={cardIn} />
        </div>
      </ChatGptMobileShell>
      <div style={{ left: 188, opacity: p(local, 562, 582), position: 'absolute', top: 932, transform: `scale(${1.75 - Math.sin(click * Math.PI) * 0.16})`, zIndex: 20 }}>
        <svg fill="none" height="50" viewBox="0 0 84 84" width="50">
          <path d="M18 10L62 48L44 52L35 72L18 10Z" fill="#111111" stroke="#ffffff" strokeLinejoin="round" strokeWidth="4" />
        </svg>
      </div>
    </div>
  )
}

function InvoiceIssuedScene({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = frame - start
  const sceneIn = p(local, 0, 30)
  const panelIn = p(local, 12, 42)

  return (
    <div style={{ background: '#f3f7f5', inset: 0, opacity: sceneIn, position: 'absolute' }}>
      <div style={{ color: '#315246', fontSize: 26, fontWeight: 800, left: 66, position: 'absolute', top: 152 }}>Sistema fiscal</div>
      <div style={{ background: '#ffffff', border: '1px solid #d9e5df', borderRadius: 32, boxShadow: '0 34px 92px rgba(21,72,52,0.16)', left: 40, overflow: 'hidden', position: 'absolute', right: 40, top: 330, transform: `translateY(${(1 - panelIn) * 32}px) scale(${0.96 + panelIn * 0.04})` }}>
        <div style={{ alignItems: 'center', background: '#0f5132', color: '#ffffff', display: 'flex', justifyContent: 'space-between', padding: '32px 36px' }}>
          <div>
            <div style={{ fontSize: 31, fontWeight: 860 }}>Nota Fiscal de Servico Eletronica</div>
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 18, fontWeight: 520, marginTop: 6 }}>Prefeitura Municipal · NFS-e</div>
          </div>
          <span style={{ background: '#dcfce7', borderRadius: 999, color: '#166534', fontSize: 18, fontWeight: 820, padding: '11px 16px' }}>Emitida</span>
        </div>
        <div style={{ display: 'grid', gap: 22, padding: 34 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 22, display: 'grid', gap: 14, padding: 24 }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ color: '#111827', fontSize: 34, fontWeight: 860 }}>NFS-e 2048</strong>
              <span style={{ color: '#64748b', fontSize: 18, fontWeight: 700 }}>Emitida agora</span>
            </div>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
              {[
                ['Tomador', 'Cliente Norte Ltda'],
                ['Servico', 'Consultoria operacional e automacao financeira'],
                ['Valor', 'R$ 12.400,00'],
                ['ISS', 'R$ 248,00'],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 18 }}>
                  <div style={{ color: '#64748b', fontSize: 15, fontWeight: 760, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color: '#111827', fontSize: label === 'Servico' ? 18 : 23, fontWeight: 760, lineHeight: 1.2, marginTop: 8 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
            {['XML gerado', 'PDF gerado', 'Tomador validado', 'Impostos calculados'].map((item, index) => {
              const itemIn = p(local, 50 + index * 6, 72 + index * 6)
              return (
                <div key={item} style={{ alignItems: 'center', background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 18, color: '#166534', display: 'flex', fontSize: 20, fontWeight: 820, gap: 12, opacity: itemIn, padding: 18, transform: `translateY(${(1 - itemIn) * 12}px)` }}>
                  <span style={{ background: '#16a34a', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
                  {item}
                </div>
              )
            })}
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 22, padding: 24 }}>
            <div style={{ color: '#111827', fontSize: 24, fontWeight: 840 }}>Resumo fiscal</div>
            <div style={{ color: '#475569', fontSize: 20, fontWeight: 520, lineHeight: 1.38, marginTop: 12 }}>
              Nota emitida com retencoes calculadas, arquivos fiscais gerados e registro pronto para contabilidade.
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: '#050505', borderRadius: 999, bottom: 18, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
    </div>
  )
}

export function ChatGptFinancialTwoAgentsVideo() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <AgentOneChat start={108} />
      <PromptInputScene frame={frame} prompt="Classifique as ultimas despesas e concilie bancos, cartoes e movimentacoes." start={0} />
      <AgentTwoChat start={988} />
      <PromptInputScene frame={frame} prompt="Veja as ultimas contas a pagar e a receber e crie um relatorio com dashboard de fluxo de caixa." start={880} />
      <ReportSlideScene start={1820} />
      <DashboardScene end={2120} start={1962} />
      <AgentThreeChat start={2270} />
      <PromptInputScene frame={frame} prompt="Organize documentos, notas fiscais e impostos pendentes, e emita a nota fiscal do ultimo servico aprovado." start={2162} />
      <InvoiceIssuedScene start={2880} />
    </AbsoluteFill>
  )
}

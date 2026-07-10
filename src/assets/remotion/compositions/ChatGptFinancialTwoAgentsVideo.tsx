import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

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

export const CHATGPT_FINANCIAL_TWO_AGENTS_DURATION = 1300

const FONT = IOS_REMOTION_FONT_STACK

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typed(text: string, amount: number) {
  return text.slice(0, Math.ceil(text.length * amount))
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
  const opacity = p(frame, start - 12, start + 12) * p(frame, start + 662, start + 690, [1, 0])
  const prompt = 'Classifique as ultimas despesas e concilie bancos, cartoes e movimentacoes.'
  const conversationY = interpolate(local, [0, 330, 520], [0, -520, -1080], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ inset: 0, opacity, position: 'absolute', transform: `translateY(${(1 - p(frame, start - 12, start + 12)) * 18}px)` }}>
      <ChatGptMobileShell conversationY={conversationY} promptInputBottom={36}>
        <ChatGptFlowUserBubble style={chatGptSequenceStyle(local, 12, 18)}>{prompt}</ChatGptFlowUserBubble>
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

function AgentTwoChat({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - start)
  const opacity = p(frame, start - 12, start + 14) * p(frame, start + 250, start + 280, [1, 0])
  const prompt = 'Veja as ultimas contas a pagar e a receber e crie um relatorio com dashboard de fluxo de caixa.'
  const cardIn = p(local, 178, 208)

  return (
    <div style={{ inset: 0, opacity, position: 'absolute', transform: `translateY(${(1 - p(frame, start - 12, start + 14)) * 18}px)` }}>
      <ChatGptMobileShell promptInputBottom={36}>
        <ChatGptFlowUserBubble style={chatGptSequenceStyle(local, 12, 18)}>{prompt}</ChatGptFlowUserBubble>
        <ChatGptFlowAssistantText style={chatGptSequenceStyle(local, 74, 22)}>
          Vou analisar vencimentos, contas a receber e projecao de caixa, depois gerar um relatorio executivo com dashboard.
        </ChatGptFlowAssistantText>
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 148, 16)} toolName="monitorar_fluxo_caixa" />
        <ChatGptToolCallCard style={chatGptSequenceStyle(local, 204, 16)} toolName="gerar_relatorio_financeiro" />
        <div style={{ ...chatGptSequenceStyle(local, 250, 18), margin: '0 36px' }}>
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

function DashboardScene({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = frame - start
  const sceneIn = p(local, 0, 30)
  const lineProgress = p(local, 56, 120)
  const bars = [78, 132, 98, 162, 118, 188]

  return (
    <div style={{ background: '#06111f', inset: 0, opacity: sceneIn, position: 'absolute' }}>
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

export function ChatGptFinancialTwoAgentsVideo() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <AgentOneChat start={108} />
      <PromptInputScene frame={frame} prompt="Classifique as ultimas despesas e concilie bancos, cartoes e movimentacoes." start={0} />
      <AgentTwoChat start={828} />
      <PromptInputScene frame={frame} prompt="Veja as ultimas contas a pagar e a receber e crie um relatorio com dashboard de fluxo de caixa." start={720} />
      <ReportSlideScene start={1080} />
      <DashboardScene start={1198} />
    </AbsoluteFill>
  )
}

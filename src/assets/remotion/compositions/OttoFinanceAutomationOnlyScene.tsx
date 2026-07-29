import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'
import { PromptOnly } from './OttoSyncOnlyScene'

loadSfProFonts()

export const OTTO_FINANCE_AUTOMATION_ONLY_SCENE_DURATION = 520

const FONT = IOS_REMOTION_FONT_STACK

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
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

const payables = [
  { completeAt: 60, description: 'Vence em 3 dias', initials: 'AW', label: 'AWS Brasil', status: 'Prioridade', tone: '#111827', value: 'R$ 12.790' },
  { completeAt: 72, description: 'Midia paga recorrente', initials: 'G', label: 'Google Ads', status: 'A vencer', tone: '#4285f4', value: 'R$ 8.420' },
  { completeAt: 84, description: 'Vencimento do mes', initials: 'TX', label: 'Impostos federais', status: 'Prioridade', tone: '#f97316', value: 'R$ 31.200' },
  { completeAt: 96, description: 'Despesa acima do padrao', initials: 'FS', label: 'Frete Sul', status: 'Revisar', tone: '#dc2626', value: 'R$ 6.830' },
  { completeAt: 108, description: 'Campanha de remarketing', initials: 'M', label: 'Meta Ads', status: 'A vencer', tone: '#1877f2', value: 'R$ 3.460' },
  { completeAt: 120, description: 'Assinatura ERP financeiro', initials: 'CA', label: 'Conta Azul', status: 'A vencer', tone: '#2563eb', value: 'R$ 2.190' },
]

const financeSteps = [
  { completeAt: 56, detail: 'Vencimento, multa, recorrencia e caixa', label: 'Prioridades calculadas', status: 'Pronto', value: '3 criticas' },
  { completeAt: 78, detail: 'Itens acima do limite ou com divergencia', label: 'Aprovacoes separadas', status: 'Revisar', value: '2 itens' },
  { completeAt: 100, detail: 'Boletos seguros e fornecedores recorrentes', label: 'Pagamentos agendados', status: 'Agendado', value: '4 contas' },
  { completeAt: 122, detail: 'Resumo para acompanhamento financeiro', label: 'Rotina monitorada', status: 'Ativa', value: 'Hoje' },
]

function LogoBadge({ initials, tone }: { initials: string; tone: string }) {
  return (
    <div style={{ alignItems: 'center', background: tone, borderRadius: 14, color: '#ffffff', display: 'flex', fontSize: 18, fontWeight: 760, height: 48, justifyContent: 'center', letterSpacing: 0, width: 48 }}>
      {initials}
    </div>
  )
}

function PayableRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = payables[index]
  const rowIn = p(localFrame, 8 + index * 9, 22 + index * 9)
  const complete = localFrame >= item.completeAt
  const needsReview = item.status === 'Revisar' || item.status === 'Prioridade'
  const statusColor = needsReview ? '#c2410c' : '#166534'
  const statusBg = needsReview ? '#fff7ed' : '#ecfdf3'

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 16, gridTemplateColumns: '58px 1fr 142px 128px 28px', height: 72, opacity: rowIn, padding: '0 24px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <LogoBadge initials={item.initials} tone={item.tone} />
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 22, fontWeight: 610, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 16, fontWeight: 420, letterSpacing: 0, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</span>
      </div>
      <span style={{ color: '#111111', fontSize: 20, fontWeight: 620, letterSpacing: -0.1, lineHeight: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>{item.value}</span>
      <span style={{ background: complete ? statusBg : '#f2f4f7', borderRadius: 999, color: complete ? statusColor : '#667085', fontSize: 17, fontWeight: 650, letterSpacing: -0.1, lineHeight: 1, padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>{complete ? item.status : 'Lendo'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function PayablesResult({ frame, start = 104 }: { frame: number; start?: number }) {
  const localFrame = frame - start
  const show = p(frame, start, start + 20)
  const list = p(localFrame, 34, 64)
  const cardHeight = interpolate(list, [0, 1], [112, 552], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progress = Math.round(interpolate(p(localFrame, 14, 132), [0, 1], [12, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <div style={{ marginTop: 22, opacity: show, transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})` }}>
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)', height: cardHeight, overflow: 'hidden', padding: '16px 0' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#111111', fontSize: 23, fontWeight: 620, letterSpacing: -0.12 }}>Contas a pagar</strong>
            <span style={{ color: '#8b8b8b', fontSize: 17, fontWeight: 420 }}>Fornecedores, vencimentos, valores e status</span>
          </div>
          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#0f8f51', fontSize: 18, fontWeight: 620, padding: '9px 14px' }}>{progress}%</span>
        </div>
        {payables.map((_, index) => <PayableRow key={index} index={index} localFrame={localFrame} />)}
      </div>
    </div>
  )
}

function FinanceAutomationRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = financeSteps[index]
  const rowIn = p(localFrame, 8 + index * 10, 22 + index * 10)
  const complete = localFrame >= item.completeAt

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 18, gridTemplateColumns: '1fr 150px 118px 28px', height: 72, opacity: rowIn, padding: '0 28px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 23, fontWeight: 560, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 17, fontWeight: 420, letterSpacing: 0, lineHeight: 1 }}>{item.detail}</span>
      </div>
      <span style={{ color: '#111111', fontSize: 20, fontWeight: 520, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
      <span style={{ color: complete ? '#166534' : '#111111', fontSize: 19, fontWeight: 540, letterSpacing: -0.1, lineHeight: 1 }}>{complete ? item.status : 'Verificando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function FinanceAutomationResult({ frame, start = 104 }: { frame: number; start?: number }) {
  const localFrame = frame - start
  const show = p(frame, start, start + 20)
  const list = p(localFrame, 34, 64)
  const cardHeight = interpolate(list, [0, 1], [112, 420], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progress = Math.round(interpolate(p(localFrame, 14, 142), [0, 1], [10, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <div style={{ marginTop: 22, opacity: show, transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})` }}>
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)', height: cardHeight, overflow: 'hidden', padding: '16px 0' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#111111', fontSize: 23, fontWeight: 620, letterSpacing: -0.12 }}>Automacao financeira</strong>
            <span style={{ color: '#8b8b8b', fontSize: 17, fontWeight: 420 }}>Contas, caixa, prioridades, aprovacoes e agenda</span>
          </div>
          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#0f8f51', fontSize: 18, fontWeight: 620, padding: '9px 14px' }}>{progress}%</span>
        </div>
        {financeSteps.map((_, index) => <FinanceAutomationRow key={index} index={index} localFrame={localFrame} />)}
      </div>
    </div>
  )
}

export function OttoFinanceAutomationOnlyScene() {
  const frame = useCurrentFrame()
  const prompt = 'Automatize meu financeiro: busque contas a pagar, analise o caixa, priorize vencimentos e agende pagamentos seguros.'
  const firstCardIn = p(frame, 104, 126)
  const secondCardIn = p(frame, 300, 324)
  const stackShift = interpolate(secondCardIn, [0, 1], [0, -120], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: 'transparent', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <PromptOnly frame={frame} prompt={prompt} />
      <div style={{ left: 82, opacity: firstCardIn, position: 'absolute', right: 82, top: 400, transform: `translateY(${stackShift + (1 - firstCardIn) * 18}px)` }}>
        <PayablesResult frame={frame} start={104} />
      </div>
      <div style={{ left: 82, opacity: secondCardIn, position: 'absolute', right: 82, top: 1030, transform: `translateY(${stackShift + (1 - secondCardIn) * 18}px)` }}>
        <FinanceAutomationResult frame={frame} start={300} />
      </div>
    </AbsoluteFill>
  )
}

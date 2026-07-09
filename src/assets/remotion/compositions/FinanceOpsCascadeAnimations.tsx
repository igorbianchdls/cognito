import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const EXPENSE_CLASSIFICATION_CASCADE_DURATION = 112
export const BANK_RECONCILIATION_CASCADE_DURATION = 112

const FONT = IOS_REMOTION_FONT_STACK

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function OttoMark() {
  return (
    <div style={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(2, 7px)' }}>
      <span style={{ background: '#225f42', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
      <span style={{ background: '#8aa895', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
      <span style={{ background: '#c9d8ce', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
      <span style={{ background: '#225f42', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
    </div>
  )
}

function Spinner({ complete }: { complete: boolean }) {
  const frame = useCurrentFrame()
  if (complete) {
    return <span style={{ background: '#12b76a', borderRadius: 999, display: 'block', height: 8, width: 8 }} />
  }

  return (
    <span
      style={{
        border: '2px solid #d7d7d7',
        borderRightColor: '#111111',
        borderRadius: 999,
        display: 'block',
        height: 17,
        transform: `rotate(${frame * 22}deg)`,
        width: 17,
      }}
    />
  )
}

function StageHeader({ label, progress }: { label: string; progress: number }) {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 9, marginBottom: 13, opacity: progress, paddingLeft: 30, transform: `translateY(${(1 - progress) * 12}px)` }}>
      <OttoMark />
      <span style={{ color: '#8a8a8a', fontSize: 15, fontWeight: 430, letterSpacing: 0 }}>{label}</span>
    </div>
  )
}

function Shell({ children, height, progress }: { children: React.ReactNode; height: number; progress: number }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 28,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
        height,
        opacity: progress,
        overflow: 'hidden',
        padding: '10px 0',
        transform: `scale(${0.97 + progress * 0.03})`,
      }}
    >
      {children}
    </div>
  )
}

const expenses = [
  { amount: 'R$ 1.280', category: 'Software', completeAt: 66, name: 'OpenAI API', tone: '#eef6ff' },
  { amount: 'R$ 420', category: 'Marketing', completeAt: 74, name: 'Meta Ads', tone: '#f0f7ff' },
  { amount: 'R$ 189', category: 'Tarifa bancaria', completeAt: 82, name: 'Banco Inter', tone: '#fff7ed' },
  { amount: 'R$ 2.450', category: 'Logistica', completeAt: 90, name: 'Correios', tone: '#f4f9f2' },
  { amount: 'R$ 890', category: 'Assinatura', completeAt: 98, name: 'Notion', tone: '#f7f7f7' },
]

function ExpenseIcon({ tone }: { tone: string }) {
  return (
    <div style={{ alignItems: 'center', background: tone, border: '1px solid #e7edf0', borderRadius: 8, display: 'grid', height: 28, justifyItems: 'center', width: 28 }}>
      <span style={{ background: '#111111', borderRadius: 3, height: 4, width: 14 }} />
      <span style={{ background: '#111111', borderRadius: 999, height: 5, width: 5 }} />
    </div>
  )
}

function ExpenseRow({ index }: { index: number }) {
  const frame = useCurrentFrame()
  const item = expenses[index]
  const rowIn = p(frame, 24 + index * 7, 38 + index * 7)
  const complete = frame >= item.completeAt

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 12, gridTemplateColumns: '34px 1fr auto 18px', height: 52, opacity: rowIn, padding: '0 20px', transform: `translateY(${(1 - rowIn) * 16}px)` }}>
      <ExpenseIcon tone={item.tone} />
      <div style={{ display: 'grid', gap: 3, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 15, fontWeight: 620, letterSpacing: 0, lineHeight: 1 }}>{item.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 11, fontWeight: 420, letterSpacing: 0, lineHeight: 1 }}>{item.amount}</span>
      </div>
      <span style={{ color: complete ? '#166534' : '#111111', fontSize: 14, fontWeight: 540, letterSpacing: 0, lineHeight: 1 }}>{complete ? item.category : 'Classifying'}</span>
      <Spinner complete={complete} />
    </div>
  )
}

export function ExpenseClassificationCascadeAnimation() {
  const frame = useCurrentFrame()
  const titleIn = p(frame, 0, 10)
  const titleOut = p(frame, 16, 30, [1, 0])
  const headerIn = p(frame, 24, 40)
  const cardIn = p(frame, 30, 46)
  const expand = p(frame, 52, 70)
  const cardHeight = interpolate(expand, [0, 1], [78, 282], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#eef4f8', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ background: '#ffffff', height: 360, left: 0, position: 'absolute', right: 0, top: 180 }} />
      <h1 style={{ color: '#050505', fontSize: 46, fontWeight: 760, left: 0, letterSpacing: -0.2, lineHeight: 1, margin: 0, opacity: titleIn * titleOut, position: 'absolute', right: 0, textAlign: 'center', top: 316, transform: `translateY(${(1 - titleIn) * 16 - (1 - titleOut) * 18}px)` }}>
        Classify expenses automatically
      </h1>
      <div style={{ left: '50%', position: 'absolute', top: 282, transform: 'translateX(-50%)', width: 500 }}>
        <StageHeader label="Classifying uncategorized expenses" progress={headerIn} />
        <Shell height={cardHeight} progress={cardIn}>
          {expenses.map((_, index) => <ExpenseRow key={index} index={index} />)}
        </Shell>
      </div>
    </AbsoluteFill>
  )
}

const reconciliations = [
  { bank: 'PIX Cliente Norte', completeAt: 66, erp: 'NF-9031', status: 'Matched', value: 'R$ 42.100' },
  { bank: 'Cartao Stone', completeAt: 74, erp: 'Lote-552', status: 'Matched', value: 'R$ 68.900' },
  { bank: 'Tarifa bancaria', completeAt: 82, erp: 'Sem lancamento', status: 'Review', value: 'R$ 189' },
  { bank: 'Boleto Fornecedor', completeAt: 90, erp: 'CP-1182', status: 'Matched', value: 'R$ 12.430' },
  { bank: 'TED Parceiro', completeAt: 98, erp: 'CR-4401', status: 'Matched', value: 'R$ 9.870' },
]

function ReconciliationRow({ index }: { index: number }) {
  const frame = useCurrentFrame()
  const item = reconciliations[index]
  const rowIn = p(frame, 24 + index * 7, 38 + index * 7)
  const complete = frame >= item.completeAt
  const review = complete && item.status === 'Review'

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 12, gridTemplateColumns: '1fr 26px 1fr auto 18px', height: 52, opacity: rowIn, padding: '0 18px', transform: `translateY(${(1 - rowIn) * 16}px)` }}>
      <div style={{ display: 'grid', gap: 3, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 14, fontWeight: 620, letterSpacing: 0, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.bank}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 11, fontWeight: 420 }}>{item.value}</span>
      </div>
      <span style={{ alignItems: 'center', background: complete ? (review ? '#fff7ed' : '#ecfdf3') : '#f2f4f7', borderRadius: 999, color: complete ? (review ? '#c2410c' : '#166534') : '#667085', display: 'flex', fontSize: 13, fontWeight: 850, height: 24, justifyContent: 'center', width: 24 }}>{complete ? (review ? '!' : '✓') : '·'}</span>
      <div style={{ color: '#111111', fontSize: 14, fontWeight: 520, letterSpacing: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.erp}</div>
      <span style={{ color: review ? '#c2410c' : complete ? '#166534' : '#111111', fontSize: 14, fontWeight: 540, letterSpacing: 0 }}>{complete ? item.status : 'Checking'}</span>
      <Spinner complete={complete} />
    </div>
  )
}

export function BankReconciliationCascadeAnimation() {
  const frame = useCurrentFrame()
  const titleIn = p(frame, 0, 10)
  const titleOut = p(frame, 16, 30, [1, 0])
  const headerIn = p(frame, 24, 40)
  const cardIn = p(frame, 30, 46)
  const expand = p(frame, 52, 70)
  const cardHeight = interpolate(expand, [0, 1], [78, 282], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#eef4f8', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ background: '#ffffff', height: 360, left: 0, position: 'absolute', right: 0, top: 180 }} />
      <h1 style={{ color: '#050505', fontSize: 46, fontWeight: 760, left: 0, letterSpacing: -0.2, lineHeight: 1, margin: 0, opacity: titleIn * titleOut, position: 'absolute', right: 0, textAlign: 'center', top: 316, transform: `translateY(${(1 - titleIn) * 16 - (1 - titleOut) * 18}px)` }}>
        Reconcile bank transactions
      </h1>
      <div style={{ left: '50%', position: 'absolute', top: 282, transform: 'translateX(-50%)', width: 610 }}>
        <StageHeader label="Matching bank movements with ERP records" progress={headerIn} />
        <Shell height={cardHeight} progress={cardIn}>
          {reconciliations.map((_, index) => <ReconciliationRow key={index} index={index} />)}
        </Shell>
      </div>
    </AbsoluteFill>
  )
}

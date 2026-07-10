import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const CHATBOT_SYNC_TOOL_DURATION = 636

const FONT = IOS_REMOTION_FONT_STACK
const APP_BACKGROUND = '#fbfbfa'

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typed(text: string, progress: number) {
  return text.slice(0, Math.floor(text.length * progress))
}

function OttoMark({ size = 24 }: { size?: number }) {
  const dot = size * 0.36
  return (
    <div style={{ display: 'grid', gap: size * 0.08, gridTemplateColumns: 'repeat(2, 1fr)', height: size, width: size }}>
      {[0, 1, 2, 3].map((item) => (
        <span key={item} style={{ background: item % 2 === 0 ? '#2f7d67' : '#9ab7aa', borderRadius: size * 0.08, height: dot, width: dot }} />
      ))}
    </div>
  )
}

function PlaidMark() {
  return (
    <div style={{ alignItems: 'center', background: '#111111', borderRadius: 7, display: 'grid', gap: 3, gridTemplateColumns: 'repeat(3, 4px)', height: 30, justifyContent: 'center', width: 30 }}>
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} style={{ background: index === 4 ? '#ffffff' : 'rgba(255,255,255,0.72)', borderRadius: 999, height: 4, width: 4 }} />
      ))}
    </div>
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

const reconciliations = [
  { bank: 'PIX Cliente Norte', completeAt: 76, erp: 'NF-9031', status: 'Conciliado', value: 'R$ 42.100' },
  { bank: 'Cartao Stone', completeAt: 88, erp: 'Lote-552', status: 'Conciliado', value: 'R$ 68.900' },
  { bank: 'Tarifa bancaria', completeAt: 100, erp: 'Sem lancamento', status: 'Revisar', value: 'R$ 189' },
  { bank: 'Boleto Fornecedor', completeAt: 112, erp: 'CP-1182', status: 'Conciliado', value: 'R$ 12.430' },
  { bank: 'TED Parceiro', completeAt: 124, erp: 'CR-4401', status: 'Conciliado', value: 'R$ 9.870' },
]

const expenses = [
  { amount: 'R$ 1.280', category: 'Software', completeAt: 68, name: 'OpenAI API', tone: '#eef6ff' },
  { amount: 'R$ 420', category: 'Marketing', completeAt: 80, name: 'Meta Ads', tone: '#f0f7ff' },
  { amount: 'R$ 189', category: 'Tarifa bancaria', completeAt: 92, name: 'Banco Inter', tone: '#fff7ed' },
  { amount: 'R$ 2.450', category: 'Logistica', completeAt: 104, name: 'Correios', tone: '#f4f9f2' },
  { amount: 'R$ 890', category: 'Assinatura', completeAt: 116, name: 'Notion', tone: '#f7f7f7' },
]

function ExpenseIcon({ tone }: { tone: string }) {
  return (
    <div style={{ alignItems: 'center', background: tone, border: '1px solid #e7edf0', borderRadius: 10, display: 'grid', height: 38, justifyItems: 'center', width: 38 }}>
      <span style={{ background: '#111111', borderRadius: 3, height: 5, width: 20 }} />
      <span style={{ background: '#111111', borderRadius: 999, height: 7, width: 7 }} />
    </div>
  )
}

function SyncResultRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = reconciliations[index]
  const rowIn = p(localFrame, 10 + index * 10, 24 + index * 10)
  const complete = localFrame >= item.completeAt
  const review = complete && item.status === 'Revisar'

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 14, gridTemplateColumns: '1fr 44px 1fr auto 28px', height: 72, opacity: rowIn, padding: '0 24px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 20, fontWeight: 610, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.bank}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 16, fontWeight: 420, letterSpacing: 0, lineHeight: 1 }}>{item.value}</span>
      </div>
      <span style={{ alignItems: 'center', background: complete ? (review ? '#fff7ed' : '#ecfdf3') : '#f2f4f7', borderRadius: 999, color: complete ? (review ? '#c2410c' : '#166534') : '#667085', display: 'flex', fontSize: 20, fontWeight: 850, height: 38, justifyContent: 'center', width: 38 }}>{complete ? (review ? '!' : '✓') : '·'}</span>
      <div style={{ color: '#111111', fontSize: 20, fontWeight: 520, letterSpacing: -0.1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.erp}</div>
      <span style={{ color: review ? '#c2410c' : complete ? '#166534' : '#111111', fontSize: 19, fontWeight: 540, letterSpacing: -0.1, lineHeight: 1 }}>{complete ? item.status : 'Verificando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function ExpenseResultRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = expenses[index]
  const rowIn = p(localFrame, 8 + index * 10, 22 + index * 10)
  const complete = localFrame >= item.completeAt

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 18, gridTemplateColumns: '48px 1fr auto 28px', height: 72, opacity: rowIn, padding: '0 28px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <ExpenseIcon tone={item.tone} />
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 23, fontWeight: 560, letterSpacing: -0.1, lineHeight: 1 }}>{item.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 17, fontWeight: 420, letterSpacing: 0, lineHeight: 1 }}>{item.amount}</span>
      </div>
      <span style={{ color: complete ? '#166534' : '#111111', fontSize: 21, fontWeight: 500, letterSpacing: -0.1, lineHeight: 1 }}>{complete ? item.category : 'Classificando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function ToolCallCard({ frame, icon, name, runningUntil, showFrom, showTo, statusDone, statusRunning }: { frame: number; icon: string; name: string; runningUntil: number; showFrom: number; showTo: number; statusDone: string; statusRunning: string }) {
  const show = p(frame, showFrom, showTo)
  const running = frame < runningUntil

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 20, boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)', display: 'grid', gap: 12, marginTop: 24, opacity: show, padding: '22px 24px', transform: `translateY(${(1 - show) * 16}px)` }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
        <div style={{ alignItems: 'center', background: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: 12, display: 'flex', height: 42, justifyContent: 'center', width: 42 }}>
          <span style={{ color: '#111111', fontSize: 22, fontWeight: 540, lineHeight: 1 }}>{icon}</span>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <strong style={{ color: '#111111', fontSize: 24, fontWeight: 600, letterSpacing: -0.15 }}>{name}</strong>
          <span style={{ color: '#7a7a7a', fontSize: 18, fontWeight: 430 }}>{running ? statusRunning : statusDone}</span>
        </div>
      </div>
    </div>
  )
}

function SyncToolResult({ frame }: { frame: number }) {
  const localFrame = frame - 122
  const show = p(frame, 122, 142)
  const list = p(localFrame, 46, 76)
  const cardHeight = interpolate(list, [0, 1], [112, 492], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progress = Math.round(interpolate(p(localFrame, 18, 132), [0, 1], [14, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <div style={{ marginTop: 22, opacity: show, transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})` }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, marginBottom: 14, paddingLeft: 10 }}>
        <PlaidMark />
        <span style={{ color: '#777777', fontSize: 20, fontWeight: 430, letterSpacing: 0 }}>Conciliando banco com ERP</span>
      </div>
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)', height: cardHeight, overflow: 'hidden', padding: '16px 0' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#111111', fontSize: 23, fontWeight: 620, letterSpacing: -0.12 }}>Matching de lancamentos</strong>
            <span style={{ color: '#8b8b8b', fontSize: 17, fontWeight: 420 }}>Movimento bancario x registro no ERP</span>
          </div>
          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#0f8f51', fontSize: 18, fontWeight: 620, padding: '9px 14px' }}>{progress}%</span>
        </div>
        {reconciliations.map((_, index) => <SyncResultRow key={index} index={index} localFrame={localFrame} />)}
      </div>
    </div>
  )
}

function ExpenseToolResult({ frame }: { frame: number }) {
  const localFrame = frame - 376
  const show = p(frame, 376, 396)
  const list = p(localFrame, 34, 62)
  const cardHeight = interpolate(list, [0, 1], [112, 492], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progress = Math.round(interpolate(p(localFrame, 12, 122), [0, 1], [18, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <div style={{ marginTop: 22, opacity: show, transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})` }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, marginBottom: 14, paddingLeft: 10 }}>
        <OttoMark size={22} />
        <span style={{ color: '#777777', fontSize: 20, fontWeight: 430, letterSpacing: 0 }}>Classificando despesas sem categoria</span>
      </div>
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)', height: cardHeight, overflow: 'hidden', padding: '16px 0' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#111111', fontSize: 23, fontWeight: 620, letterSpacing: -0.12 }}>Classificacao automatica</strong>
            <span style={{ color: '#8b8b8b', fontSize: 17, fontWeight: 420 }}>Fornecedor, valor e categoria sugerida</span>
          </div>
          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#0f8f51', fontSize: 18, fontWeight: 620, padding: '9px 14px' }}>{progress}%</span>
        </div>
        {expenses.map((_, index) => <ExpenseResultRow key={index} index={index} localFrame={localFrame} />)}
      </div>
    </div>
  )
}

function MobileChrome() {
  return (
    <>
      <div style={{ color: '#111111', fontSize: 38, fontWeight: 760, left: 74, letterSpacing: -0.2, lineHeight: 1, position: 'absolute', top: 42 }}>19:04</div>
      <div style={{ alignItems: 'flex-end', display: 'flex', gap: 8, position: 'absolute', right: 72, top: 44 }}>
        {[13, 18, 23, 28].map((height, index) => <span key={index} style={{ background: '#111111', borderRadius: 999, display: 'block', height, width: 6 }} />)}
        <span style={{ border: '4px solid #111111', borderRadius: '0 0 18px 18px', borderTop: 0, height: 18, marginLeft: 10, width: 34 }} />
        <span style={{ border: '3px solid #111111', borderRadius: 6, display: 'block', height: 20, marginLeft: 8, position: 'relative', width: 42 }}>
          <span style={{ background: '#111111', borderRadius: 2, height: 10, position: 'absolute', right: -7, top: 3, width: 4 }} />
        </span>
      </div>
      <div style={{ alignItems: 'center', borderBottom: '1px solid #eeeeee', display: 'flex', height: 112, justifyContent: 'space-between', left: 0, padding: '0 56px', position: 'absolute', right: 0, top: 104 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
          <OttoMark size={34} />
          <span style={{ color: '#111111', fontSize: 30, fontWeight: 650, letterSpacing: -0.2 }}>Otto</span>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
          <span style={{ background: '#f3f4f6', borderRadius: 999, color: '#111111', display: 'grid', fontSize: 30, height: 48, placeItems: 'center', width: 48 }}>+</span>
          <span style={{ color: '#222222', fontSize: 34, lineHeight: 1 }}>...</span>
        </div>
      </div>
    </>
  )
}

function AssistantLabel() {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 10, marginBottom: 12 }}>
      <OttoMark size={20} />
      <span style={{ color: '#777777', fontSize: 20, fontWeight: 640 }}>Otto</span>
    </div>
  )
}

function AssistantText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: '#111111', fontSize: 34, fontWeight: 430, letterSpacing: -0.2, lineHeight: 1.2, maxWidth: 910 }}>
      {children}
    </div>
  )
}

function PromptInputScene({ frame, prompt }: { frame: number; prompt: string }) {
  const inputIn = p(frame, 0, 18)
  const inputOut = p(frame, 78, 104, [1, 0])
  const typedText = typed(prompt, p(frame, 12, 74))
  const sendReady = p(frame, 58, 74)

  return (
    <div
      style={{
        alignItems: 'center',
        background: APP_BACKGROUND,
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        opacity: inputIn * inputOut,
        position: 'absolute',
        transform: `translateY(${(1 - inputIn) * 20 - (1 - inputOut) * 18}px)`,
        zIndex: 4,
      }}
    >
      <div style={{ display: 'grid', gap: 22, justifyItems: 'center', width: 900 }}>
        <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e4e4e2', borderRadius: 54, boxShadow: '0 18px 58px rgba(15,23,42,0.08)', color: typedText ? '#111111' : '#8a8a8a', display: 'flex', fontSize: 34, fontWeight: 430, minHeight: 108, padding: '0 30px 0 40px', width: '100%' }}>
          <span style={{ flex: 1, lineHeight: 1.18, maxWidth: 740, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {typedText || 'Pergunte ao Otto'}
          </span>
          <span style={{ alignItems: 'center', background: sendReady ? '#111111' : '#f1f1f1', borderRadius: 999, color: sendReady ? '#ffffff' : '#9a9a9a', display: 'flex', fontSize: 30, height: 62, justifyContent: 'center', marginLeft: 24, width: 62 }}>↑</span>
        </div>
      </div>
    </div>
  )
}

export function ChatbotSyncToolAnimation() {
  const frame = useCurrentFrame()
  const prompt = 'Classifique as despesas e concilie minhas contas.'
  const chatFrame = Math.max(0, frame - 96)
  const chatIn = p(frame, 90, 112)
  const userBubble = p(chatFrame, 0, 12)
  const assistantIntro = p(chatFrame, 54, 86)
  const syncSummary = p(chatFrame, 260, 292)
  const expenseIntro = p(chatFrame, 312, 342)
  const expenseSummary = p(chatFrame, 502, 532)
  const contentShift = interpolate(p(chatFrame, 292, 336), [0, 1], [0, -740], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: APP_BACKGROUND, color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <PromptInputScene frame={frame} prompt={prompt} />

      <div style={{ inset: 0, opacity: chatIn, position: 'absolute', transform: `translateY(${(1 - chatIn) * 18}px)` }}>
      <MobileChrome />

      <div style={{ bottom: 238, left: 56, overflow: 'hidden', position: 'absolute', right: 56, top: 260 }}>
        <div style={{ transform: `translateY(${contentShift}px)` }}>
          <div style={{ alignItems: 'start', display: 'grid', justifyItems: 'end', opacity: userBubble, transform: `translateY(${(1 - userBubble) * 18}px)` }}>
            <div style={{ background: '#f0eeea', border: '1px solid #e2ded8', borderRadius: 34, color: '#171717', fontSize: 30, fontWeight: 440, letterSpacing: -0.2, lineHeight: 1.25, maxWidth: 760, minHeight: 92, padding: '28px 34px' }}>
              {prompt}
            </div>
          </div>

          <div style={{ marginTop: 42, opacity: assistantIntro, transform: `translateY(${(1 - assistantIntro) * 20}px)` }}>
            <AssistantLabel />
            <AssistantText>Vou sincronizar bancos, cartoes e ERP, comparar com os lancamentos e separar divergencias para revisao.</AssistantText>
            <ToolCallCard frame={chatFrame} icon=">" name="conciliar_movimentacoes" runningUntil={132} showFrom={94} showTo={110} statusDone="Dados conciliados" statusRunning="Comparando banco e ERP..." />
            <SyncToolResult frame={chatFrame} />
          </div>

          <div style={{ marginTop: 28, opacity: syncSummary, transform: `translateY(${(1 - syncSummary) * 14}px)` }}>
            <AssistantLabel />
            <AssistantText>Conciliacao concluida. Encontrei 4 movimentos sem lancamento e 2 cobrancas duplicadas para voce aprovar.</AssistantText>
          </div>

          <div style={{ marginTop: 42, opacity: expenseIntro, transform: `translateY(${(1 - expenseIntro) * 18}px)` }}>
            <AssistantLabel />
            <AssistantText>Agora vou classificar as despesas que ficaram sem categoria, usando fornecedor, historico e recorrencia.</AssistantText>
            <ToolCallCard frame={chatFrame} icon="$" name="classificar_despesas" runningUntil={500} showFrom={344} showTo={360} statusDone="Despesas classificadas" statusRunning="Analisando despesas sem categoria..." />
            <ExpenseToolResult frame={chatFrame} />
          </div>

          <div style={{ marginTop: 28, opacity: expenseSummary, transform: `translateY(${(1 - expenseSummary) * 14}px)` }}>
            <AssistantLabel />
            <AssistantText>Classifiquei 5 despesas. Software, marketing e tarifas bancarias ja ficaram prontas para sua revisao.</AssistantText>
          </div>
        </div>
      </div>

      <div style={{ background: `linear-gradient(180deg, rgba(251,251,250,0), ${APP_BACKGROUND} 22%)`, bottom: 0, height: 260, left: 0, padding: '74px 50px 38px', position: 'absolute', right: 0 }}>
        <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dedede', borderRadius: 52, boxShadow: '0 14px 38px rgba(15,23,42,0.08)', color: '#8a8a8a', display: 'flex', fontSize: 29, fontWeight: 430, height: 96, justifyContent: 'space-between', padding: '0 28px 0 34px' }}>
          <span>Pergunte ao Otto</span>
          <span style={{ alignItems: 'center', background: '#111111', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 28, height: 58, justifyContent: 'center', width: 58 }}>↑</span>
        </div>
      </div>
      </div>
    </AbsoluteFill>
  )
}

import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const CHATBOT_SYNC_TOOL_DURATION = 240

const FONT = IOS_REMOTION_FONT_STACK

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

const institutions = [
  { accounts: 'Conta corrente', color: '#1174c8', initials: 'IT', name: 'Itau Empresas', syncedAt: 76 },
  { accounts: 'Cartoes corporativos', color: '#111111', initials: 'NU', name: 'Nubank PJ', syncedAt: 88 },
  { accounts: 'Conta bancaria', color: '#ffffff', accent: '#d51f2a', initials: 'SA', name: 'Santander', syncedAt: 100 },
  { accounts: 'ERP financeiro', color: '#eaf6ff', accent: '#0ea5e9', initials: 'OM', name: 'Omie', syncedAt: 112 },
  { accounts: 'Recebimentos', color: '#22c55e', initials: 'SH', name: 'Shopify', syncedAt: 124 },
]

function InstitutionLogo({ accent, color, initials, index }: { accent?: string; color: string; initials: string; index: number }) {
  if (index === 2) {
    return (
      <div style={{ height: 36, position: 'relative', width: 36 }}>
        {[0, 1, 2].map((item) => (
          <span key={`b-${item}`} style={{ background: '#1e40af', borderRadius: 3, height: 6, left: 3 + item * 4, position: 'absolute', top: 12 + item * 4, transform: 'rotate(-28deg)', width: 26 }} />
        ))}
        {[0, 1, 2].map((item) => (
          <span key={`r-${item}`} style={{ background: accent, borderRadius: 3, height: 6, left: 10 + item * 4, position: 'absolute', top: 7 + item * 4, transform: 'rotate(-28deg)', width: 26 }} />
        ))}
      </div>
    )
  }

  return (
    <div
      style={{
        alignItems: 'center',
        background: color,
        border: color === '#ffffff' || color === '#eaf6ff' ? '1px solid #d8dee9' : 'none',
        borderRadius: index === 1 ? 999 : 9,
        color: color === '#ffffff' || color === '#eaf6ff' ? accent || '#111111' : '#ffffff',
        display: 'flex',
        fontSize: 11,
        fontWeight: 760,
        height: 36,
        justifyContent: 'center',
        letterSpacing: -0.1,
        width: 36,
      }}
    >
      {initials}
    </div>
  )
}

function SyncResultRow({ index, localFrame }: { index: number; localFrame: number }) {
  const item = institutions[index]
  const rowIn = p(localFrame, 10 + index * 10, 24 + index * 10)
  const synced = localFrame >= item.syncedAt

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'grid',
        gap: 18,
        gridTemplateColumns: '44px 1fr auto 28px',
        height: 72,
        opacity: rowIn,
        padding: '0 28px',
        transform: `translateY(${(1 - rowIn) * 18}px)`,
      }}
    >
      <InstitutionLogo accent={item.accent} color={item.color} index={index} initials={item.initials} />
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 23, fontWeight: 560, letterSpacing: -0.1, lineHeight: 1 }}>{item.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 17, fontWeight: 420, letterSpacing: 0, lineHeight: 1 }}>{item.accounts}</span>
      </div>
      <span style={{ color: synced ? '#0f8f51' : '#111111', fontSize: 21, fontWeight: 500, letterSpacing: -0.1, lineHeight: 1 }}>{synced ? 'Sincronizado' : 'Sincronizando'}</span>
      <Spinner active={!synced} />
    </div>
  )
}

function ToolCallCard({ frame }: { frame: number }) {
  const show = p(frame, 94, 110)
  const running = frame < 132

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 20,
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
        display: 'grid',
        gap: 12,
        marginTop: 24,
        opacity: show,
        padding: '22px 24px',
        transform: `translateY(${(1 - show) * 16}px)`,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
        <div style={{ alignItems: 'center', background: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: 12, display: 'flex', height: 42, justifyContent: 'center', width: 42 }}>
          <span style={{ color: '#111111', fontSize: 25, fontWeight: 440, lineHeight: 1 }}>↯</span>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <strong style={{ color: '#111111', fontSize: 24, fontWeight: 600, letterSpacing: -0.15 }}>conciliar_movimentacoes</strong>
          <span style={{ color: '#7a7a7a', fontSize: 18, fontWeight: 430 }}>{running ? 'Conectando bancos e ERP...' : 'Dados sincronizados'}</span>
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
    <div
      style={{
        marginTop: 22,
        opacity: show,
        transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})`,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, marginBottom: 14, paddingLeft: 10 }}>
        <PlaidMark />
        <span style={{ color: '#777777', fontSize: 20, fontWeight: 430, letterSpacing: 0 }}>Sincronizando contas conectadas</span>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 30,
          boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)',
          height: cardHeight,
          overflow: 'hidden',
          padding: '16px 0',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#111111', fontSize: 23, fontWeight: 620, letterSpacing: -0.12 }}>Conciliação em andamento</strong>
            <span style={{ color: '#8b8b8b', fontSize: 17, fontWeight: 420 }}>Extratos, cartoes e lancamentos</span>
          </div>
          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#0f8f51', fontSize: 18, fontWeight: 620, padding: '9px 14px' }}>{progress}%</span>
        </div>
        {institutions.map((_, index) => <SyncResultRow key={index} index={index} localFrame={localFrame} />)}
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
        <span style={{ border: '4px solid #111111', borderTop: 0, borderRadius: '0 0 18px 18px', height: 18, marginLeft: 10, width: 34 }} />
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
          <span style={{ color: '#222222', fontSize: 34, lineHeight: 1 }}>⋯</span>
        </div>
      </div>
    </>
  )
}

export function ChatbotSyncToolAnimation() {
  const frame = useCurrentFrame()
  const userText = typed('Concilie minhas contas de hoje e veja se tem algo pendente.', p(frame, 8, 48))
  const userBubble = p(frame, 0, 12)
  const assistantIntro = p(frame, 54, 86)
  const finalText = p(frame, 188, 222)

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <MobileChrome />

      <div style={{ bottom: 238, left: 56, overflow: 'hidden', position: 'absolute', right: 56, top: 260 }}>
        <div
          style={{
            alignItems: 'start',
            display: 'grid',
            justifyItems: 'end',
            opacity: userBubble,
            transform: `translateY(${(1 - userBubble) * 18}px)`,
          }}
        >
          <div style={{ background: '#f0eeea', border: '1px solid #e2ded8', borderRadius: 34, color: '#171717', fontSize: 30, fontWeight: 440, letterSpacing: -0.2, lineHeight: 1.25, maxWidth: 740, minHeight: 92, padding: '28px 34px' }}>
            {userText}
          </div>
        </div>

        <div style={{ marginTop: 42, opacity: assistantIntro, transform: `translateY(${(1 - assistantIntro) * 20}px)` }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 10, marginBottom: 12 }}>
            <OttoMark size={20} />
            <span style={{ color: '#777777', fontSize: 20, fontWeight: 640 }}>Otto</span>
          </div>
          <div style={{ color: '#111111', fontSize: 34, fontWeight: 430, letterSpacing: -0.2, lineHeight: 1.2, maxWidth: 910 }}>
            Vou sincronizar bancos, cartões e ERP, comparar com os lançamentos e separar divergências para revisão.
          </div>
          <ToolCallCard frame={frame} />
          <SyncToolResult frame={frame} />
        </div>

        <div style={{ marginTop: 28, opacity: finalText, transform: `translateY(${(1 - finalText) * 14}px)` }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 10, marginBottom: 12 }}>
            <OttoMark size={20} />
            <span style={{ color: '#777777', fontSize: 20, fontWeight: 640 }}>Otto</span>
          </div>
          <div style={{ color: '#111111', fontSize: 34, fontWeight: 430, letterSpacing: -0.2, lineHeight: 1.2, maxWidth: 900 }}>
            Conciliação concluída. Encontrei 4 movimentos sem lançamento e 2 cobranças duplicadas para você aprovar.
          </div>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0), #ffffff 22%)', bottom: 0, height: 260, left: 0, padding: '74px 50px 38px', position: 'absolute', right: 0 }}>
        <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dedede', borderRadius: 52, boxShadow: '0 14px 38px rgba(15,23,42,0.08)', color: '#8a8a8a', display: 'flex', fontSize: 29, fontWeight: 430, height: 96, justifyContent: 'space-between', padding: '0 28px 0 34px' }}>
          <span>Pergunte ao Otto</span>
          <span style={{ alignItems: 'center', background: '#111111', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 28, height: 58, justifyContent: 'center', width: 58 }}>↑</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

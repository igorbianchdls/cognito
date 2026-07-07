import { Icon } from '@iconify/react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

export const OTTO_ASSISTANT_COMPATIBILITY_DURATION = 150
export const OTTO_ASSISTANT_SPLIT_SCREEN_DURATION = 150
export const OTTO_ASSISTANT_MODEL_SWITCHER_DURATION = 150

const INK = '#111827'
const MUTED = '#667085'
const GREEN = '#225f42'
const OPENAI = '#111111'
const CLAUDE = '#d86f4a'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function OttoMark({ frame }: { frame: number }) {
  const pulse = interpolate(Math.sin(frame / 13), [-1, 1], [0.98, 1.04])

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 19, transform: `scale(${pulse})` }}>
      <svg aria-hidden="true" height="78" viewBox="0 0 116 104" width="87">
        <path d="M23 13 C39 33 61 43 92 44" fill="none" stroke={GREEN} strokeLinecap="square" strokeWidth="20" />
        <path d="M23 91 C39 71 61 61 92 60" fill="none" stroke={GREEN} strokeLinecap="square" strokeWidth="20" />
      </svg>
      <strong style={{ color: INK, fontSize: 62, fontWeight: 790, letterSpacing: 2, lineHeight: 1 }}>OTTO</strong>
    </div>
  )
}

function ProviderCard({
  accent,
  icon,
  label,
  side,
  start,
}: {
  accent: string
  icon: string
  label: string
  side: 'left' | 'right'
  start: number
}) {
  const frame = useCurrentFrame()
  const enter = progress(frame, start, start + 24)
  const lift = interpolate(Math.sin((frame - start) / 18), [-1, 1], [-8, 8])
  const x = interpolate(enter, [0, 1], [side === 'left' ? -96 : 96, 0])
  const scale = interpolate(enter, [0, 1], [0.86, 1])

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: `2px solid ${accent}26`,
        borderRadius: 34,
        boxShadow: `0 34px 90px ${accent}1f`,
        display: 'grid',
        gap: 19,
        height: 248,
        justifyItems: 'center',
        opacity: enter,
        padding: 28,
        transform: `translate(${x}px, ${lift}px) scale(${scale})`,
        width: 306,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: `${accent}12`,
          border: `1px solid ${accent}22`,
          borderRadius: 999,
          color: accent,
          display: 'flex',
          height: 116,
          justifyContent: 'center',
          width: 116,
        }}
      >
        <Icon height={58} icon={icon} width={58} />
      </div>
      <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
        <strong style={{ color: INK, fontSize: 32, fontWeight: 840, letterSpacing: 0, lineHeight: 1 }}>{label}</strong>
        <span style={{ color: MUTED, fontSize: 19, fontWeight: 720, letterSpacing: 0 }}>ready</span>
      </div>
    </div>
  )
}

function Connector({ delay, endX, frame }: { delay: number; endX: number; frame: number }) {
  const draw = progress(frame, delay, delay + 30)
  const pulse = progress(frame, delay + 34, delay + 52)
  const dash = 600 - draw * 600

  return (
    <svg height="240" style={{ left: 0, overflow: 'visible', position: 'absolute', top: 724 }} viewBox="0 0 1080 240" width="1080">
      <path
        d={`M540 118 C540 118 ${endX < 540 ? 424 : 656} 118 ${endX} 118`}
        fill="none"
        stroke={GREEN}
        strokeDasharray="600"
        strokeDashoffset={dash}
        strokeLinecap="round"
        strokeWidth="5"
      />
      <circle cx={interpolate(pulse, [0, 1], [540, endX])} cy="118" fill={GREEN} opacity={pulse} r={9} />
    </svg>
  )
}

export function OttoAssistantCompatibility() {
  const frame = useCurrentFrame()
  const otto = progress(frame, 0, 26)
  const badge = progress(frame, 96, 124)
  const title = progress(frame, 16, 42)

  return (
    <AbsoluteFill style={{ background: '#f6f8f5', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 37%, rgba(34,95,66,0.16), rgba(246,248,245,0) 52%)', inset: -180, position: 'absolute' }} />
      <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0))', height: 560, left: 0, position: 'absolute', right: 0, top: 0 }} />

      <header style={{ display: 'grid', gap: 18, justifyItems: 'center', left: 100, opacity: title, position: 'absolute', right: 100, top: 168, transform: `translateY(${(1 - title) * 24}px)` }}>
        <span style={{ color: GREEN, fontSize: 20, fontWeight: 900, letterSpacing: 2.4, textTransform: 'uppercase' }}>Compatibilidade</span>
        <h1 style={{ color: INK, fontSize: 74, fontWeight: 900, letterSpacing: 0, lineHeight: 0.94, margin: 0, textAlign: 'center' }}>
          Funciona onde voce conversa
        </h1>
      </header>

      <div
        style={{
          alignItems: 'center',
          background: '#ffffff',
          border: '1px solid rgba(34,95,66,0.12)',
          borderRadius: 42,
          boxShadow: '0 42px 120px rgba(28,45,35,0.14)',
          display: 'flex',
          height: 190,
          justifyContent: 'center',
          left: 238,
          opacity: otto,
          position: 'absolute',
          right: 238,
          top: 632,
          transform: `translateY(${(1 - otto) * 30}px) scale(${interpolate(otto, [0, 1], [0.92, 1])})`,
          zIndex: 3,
        }}
      >
        <OttoMark frame={frame} />
      </div>

      <Connector delay={52} endX={272} frame={frame} />
      <Connector delay={58} endX={808} frame={frame} />

      <div style={{ display: 'flex', justifyContent: 'space-between', left: 107, position: 'absolute', right: 107, top: 986 }}>
        <ProviderCard accent={OPENAI} icon="simple-icons:openai" label="ChatGPT" side="left" start={42} />
        <ProviderCard accent={CLAUDE} icon="simple-icons:anthropic" label="Claude" side="right" start={52} />
      </div>

      <div
        style={{
          alignItems: 'center',
          background: GREEN,
          borderRadius: 999,
          bottom: 230,
          boxShadow: '0 28px 80px rgba(34,95,66,0.25)',
          color: '#ffffff',
          display: 'flex',
          fontSize: 34,
          fontWeight: 860,
          justifyContent: 'center',
          left: 120,
          letterSpacing: 0,
          opacity: badge,
          padding: '27px 34px',
          position: 'absolute',
          right: 120,
          transform: `translateY(${(1 - badge) * 28}px) scale(${interpolate(badge, [0, 1], [0.96, 1])})`,
        }}
      >
        Funciona com Claude e ChatGPT
      </div>
    </AbsoluteFill>
  )
}

function AppPane({
  accent,
  icon,
  label,
  side,
  start,
}: {
  accent: string
  icon: string
  label: string
  side: 'left' | 'right'
  start: number
}) {
  const frame = useCurrentFrame()
  const enter = progress(frame, start, start + 24)
  const scan = progress(frame, start + 52, start + 92)
  const result = progress(frame, start + 74, start + 112)
  const x = interpolate(enter, [0, 1], [side === 'left' ? -74 : 74, 0])

  return (
    <div
      style={{
        background: label === 'Claude' ? '#fbf7f0' : '#ffffff',
        border: `1px solid ${label === 'Claude' ? '#eadfce' : '#e5e7eb'}`,
        borderRadius: 38,
        boxShadow: '0 34px 86px rgba(17,24,39,0.12)',
        height: 650,
        opacity: enter,
        overflow: 'hidden',
        position: 'relative',
        transform: `translateX(${x}px) scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
        width: 410,
      }}
    >
      <header style={{ alignItems: 'center', borderBottom: `1px solid ${label === 'Claude' ? '#eadfce' : '#eceef1'}`, display: 'flex', gap: 14, height: 94, padding: '0 25px' }}>
        <span style={{ alignItems: 'center', background: `${accent}13`, borderRadius: label === 'Claude' ? 14 : 999, color: accent, display: 'flex', height: 50, justifyContent: 'center', width: 50 }}>
          <Icon height={27} icon={icon} width={27} />
        </span>
        <strong style={{ color: INK, fontSize: 24, fontWeight: 860, letterSpacing: 0 }}>{label}</strong>
      </header>

      <div style={{ display: 'grid', gap: 24, padding: 28 }}>
        <div style={{ background: label === 'Claude' ? '#eee5d8' : '#f3f4f6', borderRadius: 24, color: INK, fontSize: 22, fontWeight: 720, lineHeight: 1.22, padding: 24 }}>
          Analise estes dados e gere proximas acoes.
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {['Conectando ao Otto', 'Consultando ferramentas', 'Gerando resposta'].map((item, index) => {
            const row = progress(frame, start + 26 + index * 12, start + 44 + index * 12)
            return (
              <div key={item} style={{ alignItems: 'center', display: 'grid', gap: 12, gridTemplateColumns: '32px 1fr', opacity: row, transform: `translateY(${(1 - row) * 14}px)` }}>
                <span style={{ background: index < 2 || result > 0.4 ? GREEN : '#d0d5dd', borderRadius: 999, height: 13, width: 13 }} />
                <span style={{ color: MUTED, fontSize: 19, fontWeight: 760 }}>{item}</span>
              </div>
            )
          })}
        </div>
        <div style={{ background: '#ffffff', border: `1px solid ${accent}24`, borderRadius: 26, boxShadow: `0 20px 48px ${accent}14`, display: 'grid', gap: 13, opacity: result, overflow: 'hidden', padding: 22, position: 'relative', transform: `translateY(${(1 - result) * 22}px)` }}>
          <span style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, height: 3, left: interpolate(scan, [0, 1], [-260, 420]), opacity: 0.58, position: 'absolute', top: 0, width: 260 }} />
          <strong style={{ color: accent, fontSize: 23, fontWeight: 900 }}>Resposta pronta</strong>
          <span style={{ color: INK, fontSize: 20, fontWeight: 690, lineHeight: 1.3 }}>Mesmo fluxo. Mesmo Otto. No assistente que voce escolher.</span>
        </div>
      </div>
    </div>
  )
}

export function OttoAssistantSplitScreenCompatibility() {
  const frame = useCurrentFrame()
  const title = progress(frame, 0, 28)
  const badge = progress(frame, 102, 132)

  return (
    <AbsoluteFill style={{ background: '#f6f8f5', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 42%, rgba(34,95,66,0.13), rgba(246,248,245,0) 54%)', inset: -160, position: 'absolute' }} />
      <header style={{ display: 'grid', gap: 14, justifyItems: 'center', left: 90, opacity: title, position: 'absolute', right: 90, top: 126, transform: `translateY(${(1 - title) * 24}px)` }}>
        <span style={{ color: GREEN, fontSize: 20, fontWeight: 920, letterSpacing: 2.4, textTransform: 'uppercase' }}>O mesmo Otto</span>
        <h1 style={{ color: INK, fontSize: 74, fontWeight: 900, letterSpacing: 0, lineHeight: 0.94, margin: 0, textAlign: 'center' }}>rodando nos dois apps</h1>
      </header>

      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', left: 70, position: 'absolute', right: 70, top: 520 }}>
        <AppPane accent={OPENAI} icon="simple-icons:openai" label="ChatGPT" side="left" start={28} />
        <AppPane accent={CLAUDE} icon="simple-icons:anthropic" label="Claude" side="right" start={40} />
      </div>

      <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid rgba(34,95,66,0.14)', borderRadius: 999, bottom: 206, boxShadow: '0 26px 70px rgba(28,45,35,0.13)', display: 'flex', gap: 16, justifyContent: 'center', left: 122, opacity: badge, padding: '25px 30px', position: 'absolute', right: 122, transform: `translateY(${(1 - badge) * 24}px)` }}>
        <OttoMark frame={frame} />
      </div>
    </AbsoluteFill>
  )
}

function ModelChip({
  accent,
  active,
  icon,
  label,
}: {
  accent: string
  active: number
  icon: string
  label: string
}) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: active > 0.5 ? `${accent}13` : '#ffffff',
        border: `2px solid ${active > 0.5 ? `${accent}66` : '#e5e7eb'}`,
        borderRadius: 999,
        boxShadow: active > 0.5 ? `0 22px 58px ${accent}22` : '0 14px 34px rgba(17,24,39,0.07)',
        color: accent,
        display: 'flex',
        gap: 14,
        padding: '18px 24px',
        transform: `scale(${interpolate(active, [0, 1], [1, 1.08])})`,
      }}
    >
      <Icon height={32} icon={icon} width={32} />
      <strong style={{ color: INK, fontSize: 28, fontWeight: 850, letterSpacing: 0 }}>{label}</strong>
    </div>
  )
}

export function OttoAssistantModelSwitcherCompatibility() {
  const frame = useCurrentFrame()
  const title = progress(frame, 0, 30)
  const panel = progress(frame, 22, 54)
  const sweep = progress(frame, 52, 108)
  const final = progress(frame, 104, 136)
  const chatActive = frame < 78 ? 1 : interpolate(frame, [78, 98], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const claudeActive = frame < 78 ? 0 : interpolate(frame, [78, 98], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#fbfcf8', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 39%, rgba(34,95,66,0.16), rgba(251,252,248,0) 56%)', inset: -180, position: 'absolute' }} />
      <header style={{ display: 'grid', gap: 17, justifyItems: 'center', left: 98, opacity: title, position: 'absolute', right: 98, top: 150, transform: `translateY(${(1 - title) * 24}px)` }}>
        <span style={{ color: GREEN, fontSize: 20, fontWeight: 920, letterSpacing: 2.4, textTransform: 'uppercase' }}>Escolha o assistente</span>
        <h1 style={{ color: INK, fontSize: 76, fontWeight: 900, letterSpacing: 0, lineHeight: 0.92, margin: 0, textAlign: 'center' }}>Otto acompanha voce</h1>
      </header>

      <section style={{ background: '#ffffff', border: '1px solid rgba(34,95,66,0.13)', borderRadius: 46, boxShadow: '0 44px 120px rgba(28,45,35,0.13)', display: 'grid', gap: 36, left: 94, opacity: panel, padding: 42, position: 'absolute', right: 94, top: 548, transform: `translateY(${(1 - panel) * 32}px) scale(${interpolate(panel, [0, 1], [0.96, 1])})` }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <OttoMark frame={frame} />
          <span style={{ background: '#eef7f1', borderRadius: 999, color: GREEN, fontSize: 20, fontWeight: 900, padding: '13px 17px' }}>online</span>
        </div>

        <div style={{ background: '#f5f7f4', border: '1px solid #e1e8df', borderRadius: 34, display: 'grid', gap: 22, padding: 30, position: 'relative' }}>
          <span style={{ color: MUTED, fontSize: 22, fontWeight: 780 }}>Enviar tarefa para</span>
          <div style={{ display: 'flex', gap: 22 }}>
            <ModelChip accent={OPENAI} active={chatActive} icon="simple-icons:openai" label="ChatGPT" />
            <ModelChip accent={CLAUDE} active={claudeActive} icon="simple-icons:anthropic" label="Claude" />
          </div>
          <div style={{ background: '#ffffff', borderRadius: 24, color: INK, fontSize: 25, fontWeight: 760, lineHeight: 1.25, overflow: 'hidden', padding: 28, position: 'relative' }}>
            <span style={{ background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`, height: 4, left: interpolate(sweep, [0, 1], [-360, 760]), opacity: 0.58, position: 'absolute', top: 0, width: 360 }} />
            Preparar analise comercial e sugerir proximas acoes.
          </div>
        </div>
      </section>

      <div style={{ background: GREEN, borderRadius: 999, bottom: 210, boxShadow: '0 28px 78px rgba(34,95,66,0.24)', color: '#ffffff', fontSize: 34, fontWeight: 870, left: 130, opacity: final, padding: '27px 34px', position: 'absolute', right: 130, textAlign: 'center', transform: `translateY(${(1 - final) * 28}px)` }}>
        Claude ou ChatGPT. O Otto funciona nos dois.
      </div>
    </AbsoluteFill>
  )
}

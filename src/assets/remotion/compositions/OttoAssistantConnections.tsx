import { Icon } from '@iconify/react'
import type { ReactElement } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

export const OTTO_ASSISTANT_CONNECTIONS_DURATION = 190

const INK = '#17203A'
const MUTED = '#647089'
const LINE = '#E8ECF4'
const GREEN = '#166534'
const VIOLET = '#6A50F0'

const assistants = [
  { accent: '#D97757', description: 'Use Otto dentro do Claude para consultar dados e executar workflows.', icon: 'simple-icons:anthropic', label: 'Claude' },
  { accent: '#111111', description: 'Conecte o ChatGPT ao contexto e as acoes seguras do Otto.', icon: 'simple-icons:openai', label: 'ChatGPT' },
  { accent: '#2F2F2F', description: 'Leve Otto para o Cursor com contexto de produto e operacoes.', icon: 'simple-icons:cursor', label: 'Cursor' },
]

const sequence = [
  { confirm: 66, end: 82, index: 0, modalIn: 42, start: 34 },
  { confirm: 112, end: 128, index: 1, modalIn: 88, start: 80 },
  { confirm: 158, end: 174, index: 2, modalIn: 134, start: 126 },
]

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function OttoGlyph({ color = VIOLET, size = 28 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 116 104" width={size * 1.12}>
      <path d="M23 13 C39 33 61 43 92 44" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
      <path d="M23 91 C39 71 61 61 92 60" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
    </svg>
  )
}

function LineIcon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.9 }
  const paths: Record<string, ReactElement> = {
    check: <path d="M4 10 L8 14 L16 6" {...common} />,
    key: <path d="M8 10 A4 4 0 1 1 11.5 13.9 L9.7 15.7 H7.5 V17.5 H5.7 V19 H2 V15.3 L6.1 11.2 A4 4 0 0 1 8 10" {...common} />,
    shield: <path d="M10 2 L16 4.5 V9.5 C16 13.5 13.3 16.2 10 18 C6.7 16.2 4 13.5 4 9.5 V4.5 Z" {...common} />,
    sync: <path d="M15 7 A5 5 0 0 0 6.3 4.2 L5 5.5 M5 3 V5.5 H7.5 M5 13 A5 5 0 0 0 13.7 15.8 L15 14.5 M15 17 V14.5 H12.5" {...common} />,
  }

  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 20 20" width={size}>
      {paths[name] || paths.check}
    </svg>
  )
}

function connectedCount(frame: number) {
  return sequence.filter((item) => frame > item.end).length
}

function isConnected(index: number, frame: number) {
  const item = sequence.find((step) => step.index === index)
  return Boolean(item && frame > item.end)
}

function activeStep(frame: number) {
  return sequence.find((step) => frame >= step.start && frame < step.end)
}

function Header() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 0, 20)

  return (
    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', opacity: enter, transform: `translateY(${(1 - enter) * -16}px)` }}>
      <div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 13 }}>
          <OttoGlyph />
          <span style={{ color: INK, fontSize: 30, fontWeight: 780, letterSpacing: 1 }}>OTTO</span>
        </div>
        <h1 style={{ color: INK, fontSize: 44, fontWeight: 780, letterSpacing: 0, lineHeight: 1.05, margin: '22px 0 0' }}>Conectar assistentes</h1>
        <p style={{ color: MUTED, fontSize: 18, lineHeight: 1.45, margin: '12px 0 0', width: 600 }}>
          Autorize Claude, ChatGPT e Cursor para usar Otto com contexto, acoes e confirmacao.
        </p>
      </div>
      <div style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 18, boxShadow: '0 18px 44px rgba(23,32,58,0.08)', display: 'flex', gap: 16, height: 86, padding: '0 22px', width: 240 }}>
        <div style={{ alignItems: 'center', background: '#F7F8FC', borderRadius: 14, color: GREEN, display: 'flex', height: 44, justifyContent: 'center', width: 44 }}>
          <LineIcon name="check" size={22} />
        </div>
        <div>
          <div style={{ color: GREEN, fontSize: 27, fontWeight: 780, lineHeight: 1 }}>{connectedCount(frame)}/3</div>
          <div style={{ color: MUTED, fontSize: 13, fontWeight: 650, marginTop: 5 }}>conectados</div>
        </div>
      </div>
    </div>
  )
}

function AssistantCard({ assistant, index }: { assistant: typeof assistants[number]; index: number }) {
  const frame = useCurrentFrame()
  const enter = progress(frame, 14 + index * 6, 34 + index * 6)
  const connected = isConnected(index, frame)
  const active = activeStep(frame)?.index === index
  const lift = active ? -8 : connected ? -4 : 0

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: active || connected ? `2px solid ${connected ? GREEN : assistant.accent}` : `1px solid ${LINE}`,
        borderRadius: 18,
        boxShadow: active || connected ? `0 26px 64px ${connected ? 'rgba(22,101,52,0.16)' : `${assistant.accent}22`}` : '0 16px 40px rgba(23,32,58,0.07)',
        display: 'flex',
        flexDirection: 'column',
        height: 300,
        opacity: enter,
        padding: 24,
        transform: `translateY(${(1 - enter) * 18 + lift}px)`,
      }}
    >
      <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ alignItems: 'center', background: `${assistant.accent}12`, border: `1px solid ${assistant.accent}24`, borderRadius: 18, color: assistant.accent, display: 'flex', height: 66, justifyContent: 'center', width: 66 }}>
          <Icon height={32} icon={assistant.icon} width={32} />
        </div>
        <span style={{ background: connected ? GREEN : '#FFFFFF', border: connected ? 'none' : `1px solid ${LINE}`, borderRadius: 999, color: connected ? '#FFFFFF' : MUTED, fontSize: 12, fontWeight: 760, padding: '8px 11px' }}>
          {connected ? 'Conectado' : 'Nao conectado'}
        </span>
      </div>
      <div style={{ color: INK, fontSize: 26, fontWeight: 780, marginTop: 24 }}>{assistant.label}</div>
      <div style={{ color: MUTED, fontSize: 15, lineHeight: 1.45, marginTop: 10 }}>{assistant.description}</div>
      <div style={{ alignItems: 'center', borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 18 }}>
        <div style={{ color: MUTED, fontSize: 12.5, fontWeight: 650 }}>{connected ? 'Otto ativo neste assistente' : 'Autorizar acesso seguro'}</div>
        <div style={{ alignItems: 'center', background: connected ? '#DCFCE7' : INK, borderRadius: 11, color: connected ? GREEN : '#FFFFFF', display: 'flex', fontSize: 13, fontWeight: 780, height: 38, justifyContent: 'center', width: 108 }}>
          {connected ? 'Conectado' : 'Conectar'}
        </div>
      </div>
    </div>
  )
}

function modalStep(frame: number) {
  return sequence.find((step) => frame >= step.modalIn && frame < step.end + 10)
}

function ConnectionModal() {
  const frame = useCurrentFrame()
  const step = modalStep(frame)
  if (!step) return null

  const assistant = assistants[step.index]
  const enter = progress(frame, step.modalIn, step.modalIn + 12)
  const exit = progress(frame, step.end, step.end + 10)
  const visible = enter * (1 - exit)
  const confirmed = frame > step.confirm

  return (
    <div style={{ alignItems: 'center', background: `rgba(15,23,42,${0.2 * visible})`, display: 'flex', inset: 0, justifyContent: 'center', opacity: visible, position: 'absolute' }}>
      <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 20, boxShadow: '0 34px 90px rgba(15,23,42,0.24)', height: 356, padding: 28, transform: `translateY(${(1 - enter) * 18}px) scale(${0.96 + enter * 0.04})`, width: 500 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 16 }}>
          <div style={{ alignItems: 'center', background: `${assistant.accent}12`, borderRadius: 17, color: assistant.accent, display: 'flex', height: 58, justifyContent: 'center', width: 58 }}>
            <Icon height={30} icon={assistant.icon} width={30} />
          </div>
          <div>
            <div style={{ color: INK, fontSize: 25, fontWeight: 780 }}>Conectar {assistant.label}</div>
            <div style={{ color: MUTED, fontSize: 13, fontWeight: 650, marginTop: 6 }}>Otto - acesso seguro</div>
          </div>
        </div>
        <div style={{ background: '#F8FAFC', border: `1px solid ${LINE}`, borderRadius: 14, display: 'grid', gap: 12, marginTop: 24, padding: 18 }}>
          {[
            'Compartilhar contexto aprovado do workspace',
            'Permitir execucao de acoes com confirmacao',
            'Registrar auditoria das interacoes do assistente',
          ].map((item, index) => (
            <div key={item} style={{ alignItems: 'center', color: '#475569', display: 'flex', fontSize: 14, fontWeight: 650, gap: 10, opacity: progress(frame, step.modalIn + 10 + index * 4, step.modalIn + 22 + index * 4) }}>
              <span style={{ alignItems: 'center', background: '#DCFCE7', borderRadius: 999, color: GREEN, display: 'flex', height: 21, justifyContent: 'center', width: 21 }}>
                <LineIcon name="check" size={14} />
              </span>
              {item}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <div style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 10, color: MUTED, display: 'flex', fontSize: 13, fontWeight: 760, height: 40, justifyContent: 'center', width: 92 }}>Cancelar</div>
          <div style={{ alignItems: 'center', background: confirmed ? GREEN : INK, borderRadius: 10, color: '#FFFFFF', display: 'flex', fontSize: 13, fontWeight: 780, height: 40, justifyContent: 'center', width: 154 }}>
            {confirmed ? 'Conectado' : 'Confirmar'}
          </div>
        </div>
      </div>
    </div>
  )
}

function Cursor() {
  const frame = useCurrentFrame()
  const x = interpolate(frame, [0, 30, 38, 58, 70, 82, 86, 104, 116, 128, 132, 150, 162, 182], [660, 338, 338, 620, 700, 612, 612, 620, 700, 886, 886, 620, 700, 700], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = interpolate(frame, [0, 30, 38, 58, 70, 82, 86, 104, 116, 128, 132, 150, 162, 182], [610, 544, 544, 454, 492, 544, 544, 454, 492, 544, 544, 454, 492, 492], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const click = Math.max(progress(frame, 38, 48) * (1 - progress(frame, 48, 54)), progress(frame, 70, 80) * (1 - progress(frame, 80, 86)), progress(frame, 84, 94) * (1 - progress(frame, 94, 100)), progress(frame, 116, 126) * (1 - progress(frame, 126, 132)), progress(frame, 130, 140) * (1 - progress(frame, 140, 146)), progress(frame, 162, 172) * (1 - progress(frame, 172, 178)))

  return (
    <div style={{ filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.22))', left: x, opacity: progress(frame, 24, 36) * (1 - progress(frame, 176, 188)), position: 'absolute', top: y, transform: `scale(${1 - click * 0.1})` }}>
      <svg height="50" viewBox="0 0 84 84" width="50">
        <path d="M16 9 L73 33 L48 42 L37 70 Z" fill="#1F2937" stroke="#ffffff" strokeLinejoin="round" strokeWidth="4" />
      </svg>
    </div>
  )
}

function FinalDrawer() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 170, 186)

  return (
    <div style={{ background: '#FFFFFF', borderLeft: `1px solid ${LINE}`, bottom: 0, boxShadow: '-24px 0 54px rgba(23,32,58,0.12)', opacity: enter, padding: 26, position: 'absolute', right: 0, top: 0, transform: `translateX(${(1 - enter) * 380}px)`, width: 380 }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
        <div style={{ alignItems: 'center', background: '#F5F3FF', borderRadius: 16, color: VIOLET, display: 'flex', height: 52, justifyContent: 'center', width: 52 }}>
          <OttoGlyph size={26} />
        </div>
        <div>
          <div style={{ color: INK, fontSize: 24, fontWeight: 780 }}>Assistentes conectados</div>
          <div style={{ color: MUTED, fontSize: 13, fontWeight: 650, marginTop: 6 }}>Claude, ChatGPT e Cursor</div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 13, marginTop: 28 }}>
        {[
          { icon: 'shield', label: 'Confirmacao exigida', value: 'Ativa' },
          { icon: 'key', label: 'Contexto aprovado', value: 'Workspace' },
          { icon: 'sync', label: 'Auditoria', value: 'Registrada' },
        ].map((item, index) => (
          <div key={item.label} style={{ alignItems: 'center', background: '#FAFBFD', border: `1px solid ${LINE}`, borderRadius: 15, display: 'flex', gap: 13, opacity: progress(frame, 178 + index * 4, 190 + index * 4), padding: 15 }}>
            <div style={{ alignItems: 'center', background: '#FFFFFF', borderRadius: 12, color: GREEN, display: 'flex', height: 38, justifyContent: 'center', width: 38 }}>
              <LineIcon name={item.icon} size={20} />
            </div>
            <div>
              <div style={{ color: INK, fontSize: 14, fontWeight: 760 }}>{item.label}</div>
              <div style={{ color: MUTED, fontSize: 12.5, marginTop: 4 }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Caption() {
  const frame = useCurrentFrame()
  const text = frame < 78
    ? 'Conecta Claude ao Otto'
    : frame < 124
      ? 'depois conecta ChatGPT'
      : frame < 170
        ? 'depois conecta Cursor'
        : 'Otto pronto nos tres assistentes'

  return (
    <div style={{ background: 'rgba(32,32,32,0.86)', borderRadius: 8, bottom: 30, color: '#FFFFFF', fontSize: 23, fontWeight: 720, left: '50%', padding: '12px 18px 13px', position: 'absolute', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
      {text}
    </div>
  )
}

export function OttoAssistantConnections() {
  const frame = useCurrentFrame()
  const drawerShift = progress(frame, 170, 186)

  return (
    <AbsoluteFill style={{ background: '#F4F6FA', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 24, boxShadow: '0 30px 90px rgba(23,32,58,0.12)', height: 640, left: 52, overflow: 'hidden', padding: '42px 42px', position: 'absolute', top: 40, width: 1176 }}>
        <main style={{ bottom: 0, left: 42, overflow: 'hidden', position: 'absolute', right: 42 + drawerShift * 380, top: 42 }}>
          <Header />
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 40 }}>
            {assistants.map((assistant, index) => (
              <AssistantCard assistant={assistant} index={index} key={assistant.label} />
            ))}
          </div>
        </main>
        <ConnectionModal />
        <FinalDrawer />
      </div>
      <Cursor />
      <Caption />
    </AbsoluteFill>
  )
}

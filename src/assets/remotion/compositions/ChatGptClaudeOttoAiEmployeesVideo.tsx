import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { Wrench } from 'lucide-react'

import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'
import {
  CHATGPT_MOBILE_FONT_STACK,
  ChatGptFlowAssistantText,
  ChatGptMobileShell,
  ChatGptToolCallCard,
  ChatGptToolResultCard,
  chatGptSequenceStyle,
} from '@/assets/remotion/compositions/ChatGptMobileBase'
import {
  ClaudeMobileShell,
  ClaudeToolResultCard,
  CLAUDE_MOBILE_FONT_STACK,
  claudeSequenceStyle,
} from '@/assets/remotion/compositions/ClaudeMobileBase'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const OTTO_AI_EMPLOYEES_CHATGPT_CLAUDE_DURATION = 11300
export const OTTO_AI_EMPLOYEES_CLAUDE_DURATION = OTTO_AI_EMPLOYEES_CHATGPT_CLAUDE_DURATION

const FONT = IOS_REMOTION_FONT_STACK
const CLAUDE_RESPONSE_SERIF = '"Libre Baskerville", Baskerville, Georgia, "Times New Roman", serif'

type ResultRow = {
  background?: string
  description: string
  erp?: string
  icon?: ComponentType<{ className?: string }>
  initials: string
  name: string
  status: string
  tone: string
  value?: string
}

type ActionStep = {
  result: {
    kind?: 'list' | 'table' | 'dashboard' | 'dashboardOutline' | 'employee' | 'invoiceOutline' | 'reconciliation' | 'reportOutline' | 'slides'
    rows?: ResultRow[]
    subtitle: string
    title: string
  }
  summary?: string
  text?: string
  tool: string
}

type AgentScene = {
  actions: ActionStep[]
  intro: string
  prompt: string
}

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typed(text: string, amount: number) {
  return text.slice(0, Math.ceil(text.length * amount))
}

function fadeOnlyStyle(frame: number, start: number): CSSProperties {
  return {
    opacity: p(frame, start, start + 18),
    transform: 'translateY(0px)',
  }
}

function stagedScroll(frame: number, actionCount: number) {
  if (actionCount <= 1) {
    return interpolate(frame, [0, 330, 520, 700], [0, 0, -560, -1040], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  }

  if (actionCount === 2) {
    return interpolate(frame, [0, 340, 580, 820, 1040], [0, 0, -520, -1040, -1540], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  }

  if (actionCount <= 3) {
    return interpolate(frame, [0, 340, 600, 860, 1120, 1320], [0, 0, -520, -1040, -1560, -2060], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  }

  return interpolate(frame, [0, 360, 660, 960, 1260, 1560, 1860, 2160, 2460], [0, 0, -520, -1040, -1560, -2080, -2600, -3120, -3640], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function toolDrivenScroll(frame: number, scheduledActions: Array<{ resultStart: number; summaryStart: number }>) {
  if (scheduledActions.length <= 3) {
    return stagedScroll(frame, scheduledActions.length)
  }

  const inputRange = [0, Math.max(1, scheduledActions[0].resultStart + 20)]
  const outputRange = [0, 0]

  scheduledActions.forEach(({ resultStart, summaryStart }, index) => {
    const resultPosition = -500 - index * 560
    inputRange.push(resultStart + 78, summaryStart + 62)
    outputRange.push(resultPosition, resultPosition - 220)
  })

  return interpolate(frame, inputRange, outputRange, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function sequence(frame: number, start: number, fromY = 20) {
  return chatGptSequenceStyle(frame, start, fromY)
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

function PromptInputScene({ frame, hold = 108, prompt, start }: { frame: number; hold?: number; prompt: string; start: number }) {
  const local = frame - start
  const sceneIn = p(local, 0, 16)
  const sceneOut = p(local, hold - 26, hold, [1, 0])
  const promptProgress = p(local, 12, 76)
  const sendPress = p(local, 78, 88)
  const sentState = p(local, 88, 100)
  const textAfterSend = p(local, 86, 98, [1, 0])
  const text = typed(prompt, promptProgress)
  const estimatedLineCount = Math.max(1, Math.ceil(text.length / 54))
  const inputHeight = Math.min(216, 104 + (estimatedLineCount - 1) * 50)
  const expanded = estimatedLineCount > 1
  const inputCenterY = 1008
  const labelTop = inputCenterY - inputHeight / 2 - 80

  return (
    <div style={{ inset: 0, opacity: sceneIn * sceneOut, position: 'absolute', transform: `translateY(${(1 - sceneIn) * 20 - (1 - sceneOut) * 18}px)` }}>
      <ChatGptMobileShell conversationY={0} promptInputBottom={36}>
        <div />
      </ChatGptMobileShell>
      <div style={{ color: '#111111', fontFamily: CHATGPT_MOBILE_FONT_STACK, fontSize: 46, fontWeight: 450, left: 0, letterSpacing: -0.4, lineHeight: 1, opacity: p(local, 8, 24), position: 'absolute', right: 0, textAlign: 'center', top: labelTop, transform: `translateY(${(1 - p(local, 8, 24)) * 12}px)` }}>
        Tudo pronto para começar?
      </div>
      <div style={{ alignItems: 'center', display: 'flex', inset: 0, justifyContent: 'center', position: 'absolute', top: 96 }}>
        <div style={{ alignItems: expanded ? 'flex-start' : 'center', background: '#f1f1f1', borderRadius: expanded ? 48 : 999, display: 'flex', height: inputHeight, minHeight: 104, padding: expanded ? '30px 13px 30px 33px' : '0 13px 0 33px', transform: `translateY(${-sentState * 10}px)`, width: 944 }}>
          <span style={{ color: '#333333', fontSize: 54, fontWeight: 300, lineHeight: 1, marginRight: 34 }}>+</span>
          <span style={{ color: '#111111', flex: 1, fontSize: 34, fontWeight: 400, letterSpacing: 0, lineHeight: 1.2, maxHeight: 132, opacity: textAfterSend, overflow: 'hidden', whiteSpace: 'normal', wordBreak: 'normal' }}>
            {text}
            {promptProgress > 0 && promptProgress < 1 ? <span style={{ background: '#111111', display: local % 18 < 9 ? 'inline-block' : 'none', height: 36, marginLeft: 4, transform: 'translateY(6px)', width: 3 }} /> : null}
          </span>
          <div style={{ alignItems: 'center', background: sentState > 0 ? '#d7d7d7' : '#007aff', borderRadius: 999, display: 'flex', height: 78, justifyContent: 'center', marginLeft: 10, marginTop: expanded ? -4 : 0, transform: `scale(${1 - Math.sin(sendPress * Math.PI) * 0.1})`, width: 78 }}>
            {sentState > 0 ? <span style={{ background: '#111111', borderRadius: 7, display: 'block', height: 28, width: 28 }} /> : <span style={{ color: '#ffffff', fontSize: 34, fontWeight: 760, transform: 'translateY(-2px)' }}>↑</span>}
          </div>
        </div>
      </div>
      <div style={{ background: '#ffffff', bottom: 0, height: 264, left: 0, pointerEvents: 'none', position: 'absolute', right: 0 }}>
        <div style={{ background: '#050505', borderRadius: 999, bottom: 14, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
      </div>
    </div>
  )
}

function CompatibilityOpening({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = frame - start
  const sceneIn = p(local, 0, 22)
  const sceneOut = p(local, 248, 288, [1, 0])
  const prompt = 'Otto, mostre meus funcionarios de IA trabalhando no sistema.'

  return (
    <div style={{ inset: 0, opacity: sceneIn * sceneOut, position: 'absolute' }}>
      <ChatGptMobileShell conversationY={0} promptInputBottom={36}>
        <div style={{ margin: '26px 36px 0', opacity: p(local, 12, 34), transform: `translateY(${(1 - p(local, 12, 34)) * 16}px)` }}>
          <div style={{ background: '#050505', borderRadius: 34, color: '#ffffff', display: 'grid', gap: 24, padding: 34 }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
              <BrandPill label="ChatGPT" tone="#10a37f" />
              <span style={{ color: '#ffffff', fontSize: 34, fontWeight: 300 }}>+</span>
              <BrandPill label="Claude" tone="#d97757" />
            </div>
            <div style={{ fontSize: 42, fontWeight: 760, letterSpacing: -0.4, lineHeight: 1.08 }}>Otto opera o sistema pelo chat</div>
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 23, fontWeight: 440, lineHeight: 1.34 }}>Funcionarios de IA executam rotinas financeiras, operacionais e fiscais dentro do Otto.</div>
          </div>
        </div>
        <StaticChatGptUserBubble style={fadeOnlyStyle(local, 74)}>{prompt}</StaticChatGptUserBubble>
        <ChatGptFlowAssistantText showHeader={false} style={sequence(local, 134)}>
          Vou acionar os funcionarios de IA para organizar dados, executar rotinas e mostrar o que precisa de atencao.
        </ChatGptFlowAssistantText>
      </ChatGptMobileShell>
    </div>
  )
}

function BrandPill({ label, tone }: { label: string; tone: string }) {
  return (
    <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, display: 'flex', gap: 11, padding: '11px 16px' }}>
      <span style={{ background: tone, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
      <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 680 }}>{label}</span>
    </div>
  )
}

function CascadeResultCard({ localFrame, result }: { localFrame: number; result: ActionStep['result'] }) {
  const show = p(localFrame, 0, 18)
  const rows = result.rows ?? []
  const rowHeight = 72
  const cardHeight = result.kind === 'dashboard' || result.kind === 'dashboardOutline' || result.kind === 'reportOutline' || result.kind === 'slides' ? 552 : result.kind === 'employee' ? 500 : interpolate(p(localFrame, 34, 78), [0, 1], [116, 126 + rows.length * rowHeight], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progress = Math.round(interpolate(p(localFrame, 18, 154), [0, 1], [18, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <div style={{ opacity: show, transform: `translateY(${(1 - show) * 18}px) scale(${0.985 + show * 0.015})` }}>
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)', height: cardHeight, overflow: 'hidden', padding: '16px 0' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 28px 12px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#111111', fontSize: 23, fontWeight: 650, letterSpacing: -0.12 }}>{result.title}</strong>
            <span style={{ color: '#8b8b8b', fontSize: 17, fontWeight: 420 }}>{result.subtitle}</span>
          </div>
          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#0f8f51', fontSize: 18, fontWeight: 650, padding: '9px 14px' }}>{progress}%</span>
        </div>
        {result.kind === 'dashboard' ? <DashboardResult localFrame={localFrame - 20} /> : result.kind === 'dashboardOutline' ? <DashboardOutlineResult localFrame={localFrame - 20} subtitle={result.subtitle} title={result.title} /> : result.kind === 'reportOutline' ? <ReportOutlineResult localFrame={localFrame - 20} /> : result.kind === 'slides' ? <SlidesResult localFrame={localFrame - 20} /> : result.kind === 'invoiceOutline' ? <InvoiceOutlineResult localFrame={localFrame - 20} /> : result.kind === 'employee' ? <EmployeeResult localFrame={localFrame - 20} /> : result.kind === 'reconciliation' ? rows.map((row, index) => <ReconciliationResultRow key={`${row.name}-${index}`} index={index} localFrame={localFrame} row={row} />) : rows.map((row, index) => <ResultRowItem key={`${row.name}-${index}`} index={index} localFrame={localFrame} row={row} />)}
      </div>
    </div>
  )
}

function BrandIconBox({ row }: { row: Pick<ResultRow, 'icon' | 'initials' | 'tone'> }) {
  const Icon = row.icon

  return (
    <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e7edf0', borderRadius: 12, boxShadow: '0 8px 18px rgba(15, 23, 42, 0.06)', color: row.tone, display: 'flex', height: 42, justifyContent: 'center', overflow: 'hidden', width: 42 }}>
      {Icon ? <Icon className="h-7 w-7" /> : <span style={{ alignItems: 'center', background: row.tone, borderRadius: 9, color: '#ffffff', display: 'flex', fontSize: 14, fontWeight: 780, height: 31, justifyContent: 'center', letterSpacing: -0.2, width: 31 }}>{row.initials}</span>}
    </div>
  )
}

function ResultRowItem({ index, localFrame, row }: { index: number; localFrame: number; row: ResultRow }) {
  const rowIn = p(localFrame, 8 + index * 10, 22 + index * 10)
  const complete = localFrame >= 62 + index * 10
  const alert = row.status.includes('Revisar') || row.status.includes('Atraso') || row.status.includes('Risco') || row.status.includes('Pendente') || row.status.includes('Divergencia')
  const statusBackground = row.background ?? (alert ? '#fff7ed' : '#ecfdf3')
  const statusColor = row.background ? row.tone : alert ? '#c2410c' : '#166534'

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 13, gridTemplateColumns: '42px 1fr auto auto 28px', height: 72, opacity: rowIn, padding: '0 22px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <BrandIconBox row={row} />
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 21, fontWeight: 610, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 15, fontWeight: 420, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</span>
      </div>
      <span style={{ color: '#111111', fontSize: 18, fontWeight: 540, whiteSpace: 'nowrap' }}>{row.value}</span>
      <span style={{ background: statusBackground, borderRadius: 999, color: statusColor, fontSize: 16, fontWeight: 760, padding: '8px 11px', whiteSpace: 'nowrap' }}>{complete ? row.status : 'Sincronizando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function ReconciliationResultRow({ index, localFrame, row }: { index: number; localFrame: number; row: ResultRow }) {
  const rowIn = p(localFrame, 10 + index * 10, 24 + index * 10)
  const complete = localFrame >= 76 + index * 10
  const review = complete && (row.status === 'Revisar' || row.status === 'Divergencia')

  return (
    <div style={{ alignItems: 'center', display: 'grid', gap: 12, gridTemplateColumns: '42px 1fr 38px 0.78fr auto 28px', height: 72, opacity: rowIn, padding: '0 22px', transform: `translateY(${(1 - rowIn) * 18}px)` }}>
      <BrandIconBox row={row} />
      <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 20, fontWeight: 610, letterSpacing: -0.1, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 15, fontWeight: 420, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description} · {row.value}</span>
      </div>
      <span style={{ alignItems: 'center', background: complete ? (review ? '#fff7ed' : '#ecfdf3') : '#f2f4f7', borderRadius: 999, color: complete ? (review ? '#c2410c' : '#166534') : '#667085', display: 'flex', fontSize: 20, fontWeight: 850, height: 38, justifyContent: 'center', width: 38 }}>{complete ? (review ? '!' : '✓') : '·'}</span>
      <div style={{ color: '#111111', fontSize: 20, fontWeight: 520, letterSpacing: -0.1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.erp}</div>
      <span style={{ color: review ? '#c2410c' : complete ? '#166534' : '#111111', fontSize: 19, fontWeight: 540, letterSpacing: -0.1, lineHeight: 1 }}>{complete ? row.status : 'Verificando'}</span>
      <Spinner active={!complete} />
    </div>
  )
}

function ChatGptOutlineCard({ click, progress, subtitle, title }: { click: number; progress: number; subtitle: string; title: string }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: click > 0.45 ? '#f7f7f7' : '#ffffff',
        border: '1.5px solid #d6cec3',
        borderRadius: 28,
        boxShadow: '0 18px 42px rgba(50, 45, 35, 0.10)',
        display: 'grid',
        gridTemplateColumns: '174px 1fr',
        height: 142,
        opacity: progress,
        overflow: 'hidden',
        padding: '0 34px',
        transform: `translateY(${(1 - progress) * 22}px) scale(${1 - Math.sin(click * Math.PI) * 0.018})`,
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative' }}>
        <div style={{ alignItems: 'center', background: '#fbfaf7', border: '1.5px solid #d8d0c4', borderRadius: 18, display: 'flex', height: 126, justifyContent: 'center', transform: 'rotate(-6deg)', width: 126 }}>
          <div style={{ alignItems: 'center', border: '3px solid #252525', borderRadius: 5, display: 'flex', height: 42, justifyContent: 'center', position: 'relative', width: 34 }}>
            <span style={{ borderBottom: '10px solid transparent', borderLeft: '10px solid #252525', height: 0, position: 'absolute', right: -3, top: -3, width: 0 }} />
            <span style={{ background: '#252525', borderRadius: 999, height: 4, position: 'absolute', top: 14, width: 16 }} />
            <span style={{ background: '#252525', borderRadius: 999, height: 4, position: 'absolute', top: 23, width: 16 }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
        <strong style={{ color: '#242424', fontSize: 34, fontWeight: 520, letterSpacing: 0, lineHeight: 1.08, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</strong>
        <span style={{ color: '#77736d', fontSize: 27, fontWeight: 440, letterSpacing: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</span>
      </div>
    </div>
  )
}

function ChatGptOutlineWithCursor({ localFrame, subtitle, title }: { localFrame: number; subtitle: string; title: string }) {
  const progress = p(localFrame, 6, 24)
  const click = p(localFrame, 104, 122)
  const cursorX = interpolate(p(localFrame, 74, 112), [0, 1], [520, 598], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(p(localFrame, 74, 112), [0, 1], [72, 102], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ height: 168, position: 'relative', width: '100%' }}>
      <ChatGptOutlineCard click={click} progress={progress} subtitle={subtitle} title={title} />
      <div style={{ filter: 'drop-shadow(0 8px 10px rgba(15, 23, 42, 0.2))', left: cursorX, opacity: progress, position: 'absolute', top: cursorY, transform: `scale(${1 - click * 0.12})`, zIndex: 6 }}>
        <svg height="42" viewBox="0 0 42 42" width="42">
          <path d="M8 5L32 24L21 26L16 37L8 5Z" fill="#111111" />
          <path d="M18 25L23 36" stroke="#ffffff" strokeLinecap="round" strokeWidth="3" />
        </svg>
      </div>
    </div>
  )
}

function InvoiceOutlineWithEmissionStatus({ localFrame, subtitle, title }: { localFrame: number; subtitle: string; title: string }) {
  const steps = [
    ['Validando tomador', 'CNPJ, inscricao municipal e endereco'],
    ['Calculando impostos', 'ISS, retencoes e codigo de servico'],
    ['Transmitindo NFS-e', 'Envio para a prefeitura municipal'],
    ['Autorizando emissao', 'Numero, PDF e XML gerados'],
  ]

  return (
    <div style={{ display: 'grid', gap: 14, width: '100%' }}>
      <ChatGptOutlineWithCursor localFrame={localFrame} subtitle={subtitle} title={title} />
      <div style={{ background: '#ffffff', border: '1px solid #eeeeee', borderRadius: 18, boxShadow: '0 10px 26px rgba(15, 23, 42, 0.045)', display: 'grid', gap: 2, opacity: p(localFrame, 28, 46), overflow: 'hidden', padding: '8px 0', transform: `translateY(${(1 - p(localFrame, 28, 46)) * 12}px)` }}>
        {steps.map(([label, detail], index) => {
          const itemIn = p(localFrame, 42 + index * 18, 58 + index * 18)
          const complete = localFrame >= 74 + index * 18
          const active = itemIn > 0 && !complete
          return (
            <div key={label} style={{ alignItems: 'center', display: 'grid', gap: 13, gridTemplateColumns: '34px 1fr auto', minHeight: 58, opacity: itemIn, padding: '0 16px', transform: `translateY(${(1 - itemIn) * 10}px)` }}>
              <span style={{ alignItems: 'center', background: complete ? '#dcfce7' : active ? '#eef6ff' : '#f4f4f5', borderRadius: 999, color: complete ? '#166534' : active ? '#2563eb' : '#8a8a8a', display: 'flex', fontSize: 16, fontWeight: 780, height: 34, justifyContent: 'center', width: 34 }}>{complete ? '✓' : '·'}</span>
              <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                <strong style={{ color: '#171717', fontSize: 17, fontWeight: 660, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</strong>
                <span style={{ color: '#8a8a8a', fontSize: 13, fontWeight: 430, lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</span>
              </div>
              <span style={{ color: complete ? '#166534' : active ? '#2563eb' : '#8a8a8a', fontSize: 13, fontWeight: 720 }}>{complete ? 'OK' : active ? 'Processando' : 'Aguardando'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DashboardOutlineResult({ localFrame, subtitle, title }: { localFrame: number; subtitle: string; title: string }) {
  const outlineIn = p(localFrame, 6, 24)
  const click = p(localFrame, 104, 122)
  const cursorX = interpolate(p(localFrame, 74, 112), [0, 1], [360, 478], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(p(localFrame, 74, 112), [0, 1], [98, 134], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ height: 420, overflow: 'hidden', padding: '4px 22px 0', position: 'relative' }}>
      <div style={{ opacity: outlineIn, transform: `translateY(${(1 - outlineIn) * 14}px)` }}>
        <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e3e5e8', borderRadius: 20, boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)', display: 'grid', gap: 18, gridTemplateColumns: '74px 1fr', padding: 18 }}>
          <div style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 18, display: 'flex', height: 74, justifyContent: 'center', transform: 'rotate(-4deg)', width: 74 }}>
            <span style={{ color: '#111111', fontSize: 28, fontWeight: 760 }}>▦</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#111111', fontSize: 22, fontWeight: 650, letterSpacing: -0.12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
            <div style={{ color: '#737373', fontSize: 18, fontWeight: 430, marginTop: 6 }}>{subtitle}</div>
          </div>
        </div>
        <div style={{ filter: 'drop-shadow(0 8px 10px rgba(15, 23, 42, 0.2))', left: cursorX, position: 'absolute', top: cursorY, transform: `scale(${1 - click * 0.12})`, zIndex: 6 }}>
          <svg height="42" viewBox="0 0 42 42" width="42">
            <path d="M8 5L32 24L21 26L16 37L8 5Z" fill="#111111" />
            <path d="M18 25L23 36" stroke="#ffffff" strokeLinecap="round" strokeWidth="3" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function ReportOutlineResult({ localFrame }: { localFrame: number }) {
  const outlineIn = p(localFrame, 6, 24)
  const click = p(localFrame, 104, 122)
  const reportIn = p(localFrame, 144, 174)
  const cursorX = interpolate(p(localFrame, 74, 112), [0, 1], [350, 474], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(p(localFrame, 74, 112), [0, 1], [96, 132], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ height: 420, overflow: 'hidden', padding: '4px 22px 0', position: 'relative' }}>
      <div style={{ opacity: outlineIn * p(localFrame, 126, 150, [1, 0]), transform: `translateY(${(1 - outlineIn) * 14}px)` }}>
        <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e3e5e8', borderRadius: 20, boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)', display: 'grid', gap: 18, gridTemplateColumns: '74px 1fr', padding: 18 }}>
          <div style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 18, display: 'flex', height: 74, justifyContent: 'center', transform: 'rotate(-4deg)', width: 74 }}>
            <span style={{ color: '#111111', fontSize: 25, fontWeight: 760 }}>PDF</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#111111', fontSize: 22, fontWeight: 650, letterSpacing: -0.12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>relatorio_resultados_empresa</div>
            <div style={{ color: '#737373', fontSize: 18, fontWeight: 430, marginTop: 6 }}>Relatório · PDF</div>
          </div>
        </div>
        <div style={{ filter: 'drop-shadow(0 8px 10px rgba(15, 23, 42, 0.2))', left: cursorX, position: 'absolute', top: cursorY, transform: `scale(${1 - click * 0.12})`, zIndex: 6 }}>
          <svg height="42" viewBox="0 0 42 42" width="42">
            <path d="M8 5L32 24L21 26L16 37L8 5Z" fill="#111111" />
            <path d="M18 25L23 36" stroke="#ffffff" strokeLinecap="round" strokeWidth="3" />
          </svg>
        </div>
      </div>
      <div style={{ opacity: reportIn, position: 'absolute', transform: `translateY(${(1 - reportIn) * 18}px) scale(${0.985 + reportIn * 0.015})`, width: 'calc(100% - 44px)' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 24, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)', padding: 22 }}>
          <div style={{ color: '#111111', fontSize: 25, fontWeight: 820 }}>Relatório gerencial</div>
          <div style={{ color: '#737373', fontSize: 16, fontWeight: 430, marginTop: 5 }}>Resultados, caixa, margem e riscos</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            {[
              ['Resumo executivo', 'Caixa saudável com atenção em atrasos'],
              ['Vencimentos', 'R$ 63.980 em pagamentos próximos'],
              ['Recebimentos', 'R$ 192.500 previstos e R$ 28.900 em atraso'],
              ['Economia', 'Frete e mídia com potencial de redução'],
            ].map(([label, value], index) => {
              const itemIn = p(localFrame, 172 + index * 8, 190 + index * 8)
              return (
                <div key={label} style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 16, display: 'grid', gap: 12, gridTemplateColumns: '1fr auto', opacity: itemIn, padding: '13px 15px', transform: `translateY(${(1 - itemIn) * 10}px)` }}>
                  <span style={{ color: '#111111', fontSize: 17, fontWeight: 700 }}>{label}</span>
                  <span style={{ color: '#667085', fontSize: 15, fontWeight: 520 }}>{value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function InvoiceOutlineResult({ localFrame }: { localFrame: number }) {
  const outlineIn = p(localFrame, 6, 24)
  const click = p(localFrame, 166, 184)
  const cursorX = interpolate(p(localFrame, 136, 174), [0, 1], [350, 474], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(p(localFrame, 136, 174), [0, 1], [96, 132], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const steps = [
    ['Validando tomador', 'CNPJ e inscrição municipal'],
    ['Calculando ISS', 'Retenções e código de serviço'],
    ['Transmitindo NFS-e', 'Prefeitura municipal'],
    ['Autorizada', 'PDF e XML disponíveis'],
  ]

  return (
    <div style={{ height: 420, overflow: 'hidden', padding: '4px 22px 0', position: 'relative' }}>
      <div style={{ opacity: outlineIn, transform: `translateY(${(1 - outlineIn) * 14}px)` }}>
        <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e3e5e8', borderRadius: 20, boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)', display: 'grid', gap: 18, gridTemplateColumns: '74px 1fr', padding: 18 }}>
          <div style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 18, display: 'flex', height: 74, justifyContent: 'center', transform: 'rotate(-4deg)', width: 74 }}>
            <span style={{ color: '#111111', fontSize: 28, fontWeight: 760 }}>NF</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#111111', fontSize: 22, fontWeight: 650, letterSpacing: -0.12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>nota_fiscal_servico_2048</div>
            <div style={{ color: '#737373', fontSize: 18, fontWeight: 430, marginTop: 6 }}>Nota fiscal · NFS-e</div>
          </div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 18, boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)', display: 'grid', gap: 8, marginTop: 14, padding: 14 }}>
          {steps.map(([label, detail], index) => {
            const itemIn = p(localFrame, 34 + index * 24, 50 + index * 24)
            const complete = localFrame >= 66 + index * 24
            const active = itemIn > 0 && !complete
            return (
              <div key={label} style={{ alignItems: 'center', display: 'grid', gap: 11, gridTemplateColumns: '28px 1fr auto', opacity: itemIn, padding: '5px 2px', transform: `translateY(${(1 - itemIn) * 8}px)` }}>
                <span style={{ alignItems: 'center', background: complete ? '#dcfce7' : active ? '#eef6ff' : '#f2f4f7', borderRadius: 999, color: complete ? '#166534' : '#2563eb', display: 'flex', fontSize: 14, fontWeight: 820, height: 28, justifyContent: 'center', width: 28 }}>{complete ? '✓' : '·'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#111111', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{label}</div>
                  <div style={{ color: '#8a8a8a', fontSize: 13, fontWeight: 430, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</div>
                </div>
                <span style={{ color: complete ? '#166534' : '#667085', fontSize: 13, fontWeight: 720 }}>{complete ? 'OK' : active ? 'Processando' : 'Aguardando'}</span>
              </div>
            )
          })}
        </div>
        <div style={{ filter: 'drop-shadow(0 8px 10px rgba(15, 23, 42, 0.2))', left: cursorX, position: 'absolute', top: cursorY, transform: `scale(${1 - click * 0.12})`, zIndex: 6 }}>
          <svg height="42" viewBox="0 0 42 42" width="42">
            <path d="M8 5L32 24L21 26L16 37L8 5Z" fill="#111111" />
            <path d="M18 25L23 36" stroke="#ffffff" strokeLinecap="round" strokeWidth="3" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function InvoiceIssuedPanel({ localFrame }: { localFrame: number }) {
  const items = ['XML gerado', 'PDF gerado', 'Tomador validado', 'Impostos calculados']

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 24, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
      <div style={{ alignItems: 'center', background: '#111827', color: '#ffffff', display: 'flex', justifyContent: 'space-between', padding: '18px 22px' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 820 }}>Nota Fiscal de Serviço Eletrônica</div>
          <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14, fontWeight: 520, marginTop: 4 }}>Prefeitura Municipal · NFS-e</div>
        </div>
        <span style={{ background: '#dcfce7', borderRadius: 999, color: '#166534', fontSize: 15, fontWeight: 820, padding: '8px 12px' }}>Emitida</span>
      </div>
      <div style={{ display: 'grid', gap: 12, padding: 18 }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 18, display: 'grid', gap: 11, padding: 18 }}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ color: '#111827', fontSize: 28, fontWeight: 860 }}>NFS-e 2048</strong>
            <span style={{ color: '#64748b', fontSize: 15, fontWeight: 700 }}>Emitida agora</span>
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            {[
              ['Tomador', 'Cliente Norte Ltda'],
              ['Serviço', 'Automação financeira'],
              ['Valor', 'R$ 12.400,00'],
              ['ISS', 'R$ 248,00'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 12 }}>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 760, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ color: '#111827', fontSize: label === 'Serviço' ? 15 : 18, fontWeight: 760, lineHeight: 1.15, marginTop: 6 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          {items.map((item, index) => {
            const itemIn = p(localFrame, 34 + index * 6, 52 + index * 6)
            return (
              <div key={item} style={{ alignItems: 'center', background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 14, color: '#166534', display: 'flex', fontSize: 15, fontWeight: 820, gap: 8, opacity: itemIn, padding: 12, transform: `translateY(${(1 - itemIn) * 10}px)` }}>
                <span style={{ background: '#16a34a', borderRadius: 999, display: 'block', height: 9, width: 9 }} />
                {item}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FullscreenInvoiceImageScene({ localFrame }: { localFrame: number }) {
  const sceneIn = p(localFrame, 0, 28)
  const sceneOut = p(localFrame, 360, 410, [1, 0])
  const documentIn = p(localFrame, 12, 44)

  if (localFrame < 0) {
    return null
  }

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#f4f5f7', display: 'flex', justifyContent: 'center', opacity: sceneIn * sceneOut, overflow: 'hidden', zIndex: 42 }}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          boxShadow: '0 34px 90px rgba(15, 23, 42, 0.22)',
          height: 1210,
          opacity: documentIn,
          overflow: 'hidden',
          transform: `translateY(${(1 - documentIn) * 28}px) scale(${0.98 + documentIn * 0.02})`,
          width: 840,
        }}
      >
        <Img
          alt="Nota Fiscal Eletronica de Servicos"
          src={staticFile('nfse.jpg')}
          style={{ display: 'block', height: '100%', objectFit: 'contain', objectPosition: 'top center', width: '100%' }}
        />
      </div>
    </AbsoluteFill>
  )
}

function FullscreenInvoiceScene({ localFrame }: { localFrame: number }) {
  const sceneIn = p(localFrame, 0, 28)
  const sceneOut = p(localFrame, 360, 410, [1, 0])
  const panelIn = p(localFrame, 12, 42)

  if (localFrame < 0) {
    return null
  }

  return (
    <AbsoluteFill style={{ background: '#f6f8fb', color: '#111111', fontFamily: FONT, opacity: sceneIn * sceneOut, overflow: 'hidden', zIndex: 42 }}>
      <div style={{ background: '#111827', color: '#ffffff', padding: '62px 54px 36px' }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 22, fontWeight: 650 }}>Prefeitura Municipal · NFS-e</div>
            <div style={{ fontSize: 52, fontWeight: 860, letterSpacing: -0.6, lineHeight: 1.02, marginTop: 10 }}>Nota Fiscal de Serviço Eletrônica</div>
          </div>
          <span style={{ background: '#dcfce7', borderRadius: 999, color: '#166534', fontSize: 22, fontWeight: 820, padding: '13px 20px' }}>Emitida</span>
        </div>
      </div>
      <div style={{ opacity: panelIn, padding: '38px 48px', transform: `translateY(${(1 - panelIn) * 22}px)` }}>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 34, boxShadow: '0 24px 64px rgba(15, 23, 42, 0.10)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gap: 26, padding: 38 }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#111827', fontSize: 48, fontWeight: 860 }}>NFS-e 2048</strong>
                <div style={{ color: '#64748b', fontSize: 22, fontWeight: 520, marginTop: 8 }}>Emitida agora · PDF e XML gerados</div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 22, color: '#166534', fontSize: 24, fontWeight: 820, padding: '18px 22px' }}>R$ 12.400,00</div>
            </div>
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr' }}>
              {[
                ['Tomador', 'Cliente Norte Ltda'],
                ['Serviço', 'Consultoria operacional e automação financeira'],
                ['ISS calculado', 'R$ 248,00'],
                ['Código municipal', '17.01'],
              ].map(([label, value], index) => {
                const itemIn = p(localFrame, 48 + index * 8, 70 + index * 8)
                return (
                  <div key={label} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 22, opacity: itemIn, padding: 24, transform: `translateY(${(1 - itemIn) * 14}px)` }}>
                    <div style={{ color: '#64748b', fontSize: 16, fontWeight: 760, textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ color: '#111827', fontSize: label === 'Serviço' ? 23 : 29, fontWeight: 780, lineHeight: 1.16, marginTop: 9 }}>{value}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {['XML gerado', 'PDF gerado', 'Tomador validado', 'Impostos calculados'].map((item, index) => {
                const itemIn = p(localFrame, 102 + index * 8, 124 + index * 8)
                return (
                  <div key={item} style={{ alignItems: 'center', background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 20, color: '#166534', display: 'flex', fontSize: 20, fontWeight: 820, gap: 10, opacity: itemIn, padding: 18, transform: `translateY(${(1 - itemIn) * 14}px)` }}>
                    <span style={{ background: '#16a34a', borderRadius: 999, display: 'block', height: 11, width: 11 }} />
                    {item}
                  </div>
                )
              })}
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 24, padding: 26 }}>
              <div style={{ color: '#111827', fontSize: 27, fontWeight: 840 }}>Resumo fiscal</div>
              <div style={{ color: '#475569', fontSize: 22, fontWeight: 520, lineHeight: 1.36, marginTop: 12 }}>
                Nota emitida com retenções calculadas, arquivos fiscais gerados e registro pronto para contabilidade.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function SlidesResult({ localFrame }: { localFrame: number }) {
  const deckIn = p(localFrame, 8, 28)
  const active = Math.min(2, Math.floor(Math.max(0, localFrame - 54) / 42))
  const slideProgress = p(localFrame, 46, 150)

  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '92px 1fr', opacity: deckIn, padding: '4px 22px 0', transform: `translateY(${(1 - deckIn) * 16}px)` }}>
      <div style={{ display: 'grid', gap: 10 }}>
        {[0, 1, 2].map((item) => (
          <div key={item} style={{ background: item === active ? '#eef6ff' : '#f8fafc', border: `1px solid ${item === active ? '#93c5fd' : '#e5e7eb'}`, borderRadius: 12, height: 80, padding: 8 }}>
            <div style={{ background: item === active ? '#2563eb' : '#dbe5ee', borderRadius: 6, height: 10, width: '76%' }} />
            <div style={{ background: '#ffffff', borderRadius: 5, height: 34, marginTop: 9 }} />
          </div>
        ))}
      </div>
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 22, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)', minHeight: 400, overflow: 'hidden', padding: 24 }}>
        <div style={{ color: '#667085', fontSize: 15, fontWeight: 760, textTransform: 'uppercase' }}>Apresentação executiva</div>
        <div style={{ color: '#111827', fontSize: 31, fontWeight: 860, letterSpacing: -0.3, lineHeight: 1.05, marginTop: 10 }}>
          {active === 0 ? 'Resultados financeiros do mês' : active === 1 ? 'Riscos, atrasos e economia' : 'Próximas decisões recomendadas'}
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 22 }}>
          {[
            ['Caixa', 'R$ 418k'],
            ['Receber', 'R$ 192k'],
            ['Atrasos', 'R$ 28.9k'],
            ['Economia', '+R$ 38k'],
          ].map(([label, value], index) => {
            const itemIn = p(localFrame, 36 + index * 7, 54 + index * 7)
            return (
              <div key={label} style={{ background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 16, opacity: itemIn, padding: 15, transform: `translateY(${(1 - itemIn) * 10}px)` }}>
                <div style={{ color: '#667085', fontSize: 13, fontWeight: 700 }}>{label}</div>
                <div style={{ color: index === 2 ? '#dc2626' : '#16a34a', fontSize: 23, fontWeight: 840, marginTop: 6 }}>{value}</div>
              </div>
            )
          })}
        </div>
        <div style={{ alignItems: 'end', background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 18, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(6,1fr)', height: 110, marginTop: 18, padding: '18px 18px' }}>
          {[46, 72, 58, 92, 78, 104].map((height, index) => <span key={height} style={{ background: index > 3 ? '#16a34a' : '#dbe5ee', borderRadius: '8px 8px 4px 4px', display: 'block', height: height * slideProgress, minHeight: 6 }} />)}
        </div>
      </div>
    </div>
  )
}

function DashboardResult({ localFrame }: { localFrame: number }) {
  const kpis = [
    ['Caixa', 'R$ 418k', '#16a34a'],
    ['Margem', '31,2%', '#2563eb'],
    ['Lucro', '+R$ 74k', '#7c3aed'],
  ]
  return (
    <div style={{ display: 'grid', gap: 14, padding: '4px 22px 0' }}>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {kpis.map(([label, value, color], index) => {
          const itemIn = p(localFrame, index * 8, 18 + index * 8)
          return (
            <div key={label} style={{ background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 18, opacity: itemIn, padding: 16, transform: `translateY(${(1 - itemIn) * 12}px)` }}>
              <div style={{ color: '#667085', fontSize: 15, fontWeight: 650 }}>{label}</div>
              <div style={{ color, fontSize: 25, fontWeight: 840, marginTop: 6 }}>{value}</div>
            </div>
          )
        })}
      </div>
      <div style={{ alignItems: 'end', background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 22, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(7,1fr)', height: 170, padding: '26px 24px' }}>
        {[72, 108, 84, 142, 118, 166, 136].map((height, index) => {
          const bar = p(localFrame, 34 + index * 6, 54 + index * 6)
          return <span key={height} style={{ background: index > 4 ? '#16a34a' : '#dbe5ee', borderRadius: '10px 10px 4px 4px', display: 'block', height: height * bar, minHeight: 8 }} />
        })}
      </div>
      <InsightBlock localFrame={localFrame - 84} text="Decisao sugerida: reduzir CAC em Meta Ads e renegociar fornecedor Cloud para proteger margem e caixa." value="+R$ 38k impacto estimado" />
    </div>
  )
}

function FullscreenDashboardImageScene({ localFrame }: { localFrame: number }) {
  const sceneIn = p(localFrame, 0, 28)
  const sceneOut = p(localFrame, 360, 410, [1, 0])
  const imageIn = p(localFrame, 10, 36)

  if (localFrame < 0) {
    return null
  }

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#020817', display: 'flex', justifyContent: 'center', opacity: sceneIn * sceneOut, overflow: 'hidden', zIndex: 40 }}>
      <Img
        alt="Dashboard financeiro"
        src={staticFile('mob1.png')}
        style={{
          display: 'block',
          height: '100%',
          objectFit: 'cover',
          opacity: imageIn,
          transform: `scale(${0.94 + imageIn * 0.06})`,
          transformOrigin: 'center center',
          width: '100%',
        }}
      />
    </AbsoluteFill>
  )
}

function FullscreenDashboardScene({ localFrame }: { localFrame: number }) {
  const sceneIn = p(localFrame, 0, 28)
  const sceneOut = p(localFrame, 360, 410, [1, 0])
  const kpis = [
    ['Caixa atual', 'R$ 418k', '+12,4%', '#16a34a'],
    ['A receber', 'R$ 192k', '6 clientes', '#2563eb'],
    ['Em atraso', 'R$ 28.9k', 'prioridade', '#dc2626'],
    ['Economia', '+R$ 38k', 'estimada', '#7c3aed'],
  ]

  if (localFrame < 0) {
    return null
  }

  return (
    <AbsoluteFill style={{ background: '#f6f8fb', color: '#111111', fontFamily: FONT, opacity: sceneIn * sceneOut, overflow: 'hidden', zIndex: 40 }}>
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', padding: '58px 54px 28px' }}>
        <div>
          <div style={{ color: '#667085', fontSize: 22, fontWeight: 700 }}>Dashboard · Tempo real</div>
          <div style={{ color: '#111827', fontSize: 52, fontWeight: 860, letterSpacing: -0.8, lineHeight: 1.02, marginTop: 10 }}>Resultados da empresa</div>
        </div>
        <div style={{ alignItems: 'center', background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#166534', display: 'flex', fontSize: 21, fontWeight: 780, height: 52, padding: '0 20px' }}>Atualizado agora</div>
      </div>
      <div style={{ display: 'grid', gap: 22, padding: '34px 42px' }}>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {kpis.map(([label, value, delta, color], index) => {
            const itemIn = p(localFrame, 24 + index * 8, 48 + index * 8)
            return (
              <div key={label} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 28, boxShadow: '0 18px 44px rgba(15, 23, 42, 0.07)', opacity: itemIn, padding: 28, transform: `translateY(${(1 - itemIn) * 18}px)` }}>
                <div style={{ color: '#667085', fontSize: 20, fontWeight: 650 }}>{label}</div>
                <div style={{ color, fontSize: 45, fontWeight: 860, letterSpacing: -0.5, marginTop: 10 }}>{value}</div>
                <div style={{ color: '#8a8a8a', fontSize: 18, fontWeight: 520, marginTop: 5 }}>{delta}</div>
              </div>
            )
          })}
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 32, boxShadow: '0 22px 54px rgba(15, 23, 42, 0.08)', padding: 30 }}>
          <div style={{ color: '#111827', fontSize: 28, fontWeight: 800 }}>Fluxo de caixa e operação</div>
          <div style={{ color: '#667085', fontSize: 18, fontWeight: 450, marginTop: 6 }}>Entradas, saídas, atrasos e projeção dos próximos dias</div>
          <div style={{ alignItems: 'end', borderBottom: '1px solid #eef2f7', display: 'grid', gap: 14, gridTemplateColumns: 'repeat(9,1fr)', height: 250, marginTop: 28, paddingBottom: 18 }}>
            {[86, 118, 102, 148, 130, 186, 154, 212, 198].map((height, index) => {
              const bar = p(localFrame, 80 + index * 7, 102 + index * 7)
              return <span key={height} style={{ background: index > 5 ? '#16a34a' : '#dbe5ee', borderRadius: '12px 12px 5px 5px', display: 'block', height: height * bar, minHeight: 10 }} />
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
          {[
            ['Ação recomendada', 'Cobrar Mercado Sul hoje e renegociar Fornecedor Cloud.', '#fff7ed', '#c2410c'],
            ['Oportunidade', 'Redução estimada de R$ 38k em frete e mídia paga.', '#f0fdf4', '#166534'],
          ].map(([label, text, background, color], index) => {
            const itemIn = p(localFrame, 150 + index * 12, 174 + index * 12)
            return (
              <div key={label} style={{ background, border: '1px solid #e5e7eb', borderRadius: 26, opacity: itemIn, padding: 24, transform: `translateY(${(1 - itemIn) * 16}px)` }}>
                <div style={{ color, fontSize: 20, fontWeight: 820 }}>{label}</div>
                <div style={{ color: '#111827', fontSize: 21, fontWeight: 560, lineHeight: 1.28, marginTop: 8 }}>{text}</div>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}

function EmployeeResult({ localFrame }: { localFrame: number }) {
  const items = ['Rotina semanal configurada', 'Permissoes com aprovacao humana', 'Sistemas conectados ao Otto', 'Funcionario de IA ativo']
  return (
    <div style={{ display: 'grid', gap: 12, padding: '4px 24px 0' }}>
      <div style={{ background: '#050505', borderRadius: 26, color: '#ffffff', padding: 26 }}>
        <div style={{ color: '#52d273', fontSize: 18, fontWeight: 760 }}>Novo funcionario</div>
        <div style={{ fontSize: 34, fontWeight: 840, letterSpacing: -0.3, marginTop: 8 }}>Analista de fornecedores</div>
        <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 18, lineHeight: 1.32, marginTop: 8 }}>Revisa contratos, compras e pendencias toda sexta-feira.</div>
      </div>
      {items.map((item, index) => {
        const itemIn = p(localFrame, 38 + index * 8, 56 + index * 8)
        return (
          <div key={item} style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 16, display: 'grid', gap: 12, gridTemplateColumns: '30px 1fr auto', opacity: itemIn, padding: '12px 14px', transform: `translateY(${(1 - itemIn) * 10}px)` }}>
            <span style={{ alignItems: 'center', background: '#16a34a', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 16, fontWeight: 820, height: 30, justifyContent: 'center', width: 30 }}>✓</span>
            <span style={{ color: '#111111', fontSize: 18, fontWeight: 620 }}>{item}</span>
            <span style={{ color: '#166534', fontSize: 15, fontWeight: 720 }}>OK</span>
          </div>
        )
      })}
    </div>
  )
}

function InsightBlock({ localFrame, text, value }: { localFrame: number; text: string; value: string }) {
  const cardIn = p(localFrame, 0, 18)
  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 18, opacity: cardIn, padding: 18, transform: `translateY(${(1 - cardIn) * 12}px)` }}>
      <div style={{ color: '#166534', fontSize: 22, fontWeight: 840 }}>{value}</div>
      <div style={{ color: '#37664a', fontSize: 16, fontWeight: 520, lineHeight: 1.28, marginTop: 7 }}>{text}</div>
    </div>
  )
}

function StaticChatGptUserBubble({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 36 }}>
      <div
        style={{
          alignItems: 'center',
          background: '#f1f1f1',
          borderRadius: 60,
          boxSizing: 'border-box',
          color: '#111111',
          display: 'flex',
          fontFamily: CHATGPT_MOBILE_FONT_STACK,
          fontSize: 42,
          fontWeight: 400,
          justifyContent: 'center',
          letterSpacing: 0,
          lineHeight: 1.18,
          maxWidth: 760,
          minHeight: 91,
          padding: '24px 42px',
          width: 'max-content',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function StaticClaudeUserBubble({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 42 }}>
      <div
        style={{
          alignItems: 'center',
          background: '#f1f0ee',
          border: '1px solid #dfddd8',
          borderRadius: 68,
          boxSizing: 'border-box',
          color: '#111111',
          display: 'flex',
          fontFamily: CLAUDE_MOBILE_FONT_STACK,
          fontSize: 38,
          fontWeight: 400,
          justifyContent: 'center',
          letterSpacing: '-0.76px',
          lineHeight: 1.12,
          maxWidth: 760,
          minHeight: 96,
          padding: '25px 40px',
          width: 'max-content',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ChatGptAssistantTextNoHeader({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return <ChatGptFlowAssistantText showHeader={false} style={style}>{children}</ChatGptFlowAssistantText>
}

function AgentChatScene({ scene, start }: { scene: AgentScene; start: number }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - start)
  const longRows = scene.actions.some((action) => (action.result.rows?.length ?? 0) >= 8)
  const baseDuration = scene.actions.length === 1 ? 790 : scene.actions.length === 2 ? 930 : scene.actions.length === 3 ? (longRows ? 1850 : 1550) : 2700
  let cursor = 150
  const scheduledActions = scene.actions.map((action, index) => {
    const toolStart = cursor
    const resultStart = toolStart + 58
    const rowCount = action.result.rows?.length ?? 0
    const resultHold = action.result.kind === 'invoiceOutline' ? 390 : action.result.kind === 'dashboardOutline' || action.result.kind === 'reportOutline' ? 330 : rowCount >= 10 ? 270 : rowCount >= 6 ? 220 : 166
    const summaryStart = resultStart + resultHold
    cursor = summaryStart + (action.summary ? 118 : 46)
    return { action, index, resultStart, summaryStart, toolStart }
  })
  const hasFullscreenAction = scene.actions.some((action) => action.result.kind === 'dashboardOutline' || action.result.kind === 'invoiceOutline')
  const duration = Math.max(baseDuration, cursor + (hasFullscreenAction ? 430 : 120))
  const opacity = p(frame, start - 10, start + 14) * p(frame, start + duration - 28, start + duration, [1, 0])
  const conversationY = toolDrivenScroll(local, scheduledActions)
  const dashboardAction = scheduledActions.find(({ action }) => action.result.kind === 'dashboardOutline')
  const invoiceAction = scheduledActions.find(({ action }) => action.result.kind === 'invoiceOutline')

  return (
    <div style={{ inset: 0, opacity, position: 'absolute' }}>
      <ChatGptMobileShell conversationY={conversationY} promptInputBottom={36}>
        <StaticChatGptUserBubble style={fadeOnlyStyle(local, 8)}>{scene.prompt}</StaticChatGptUserBubble>
        <ChatGptAssistantTextNoHeader style={sequence(local, 62)}>{scene.intro}</ChatGptAssistantTextNoHeader>
        {scheduledActions.map(({ action, index, resultStart, summaryStart, toolStart }) => {
          const isOutline = action.result.kind === 'dashboardOutline' || action.result.kind === 'invoiceOutline' || action.result.kind === 'reportOutline'
          return (
            <FragmentBlock key={`${action.tool}-${index}`}>
              {action.text ? <ChatGptAssistantTextNoHeader style={sequence(local, toolStart - 36)}>{action.text}</ChatGptAssistantTextNoHeader> : null}
              <ChatGptToolCallCard style={sequence(local, toolStart)} toolName={action.tool} />
              {isOutline ? (
                <div style={{ ...sequence(local, resultStart), margin: '0 36px' }}>
                  {action.result.kind === 'invoiceOutline' ? (
                    <InvoiceOutlineWithEmissionStatus localFrame={local - resultStart} subtitle={action.result.subtitle} title={action.result.title} />
                  ) : (
                    <ChatGptOutlineWithCursor localFrame={local - resultStart} subtitle={action.result.subtitle} title={action.result.title} />
                  )}
                </div>
              ) : (
                <ChatGptToolResultCard style={sequence(local, resultStart)}>
                  <CascadeResultCard localFrame={local - resultStart} result={action.result} />
                </ChatGptToolResultCard>
              )}
              {action.summary ? <ChatGptAssistantTextNoHeader style={sequence(local, summaryStart)}>{action.summary}</ChatGptAssistantTextNoHeader> : null}
            </FragmentBlock>
          )
        })}
      </ChatGptMobileShell>
      {dashboardAction ? <FullscreenDashboardImageScene localFrame={local - (dashboardAction.resultStart + 170)} /> : null}
      {invoiceAction ? <FullscreenInvoiceImageScene localFrame={local - (invoiceAction.resultStart + 170)} /> : null}
    </div>
  )
}

function ClaudeAssistantText({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: CLAUDE_RESPONSE_SERIF,
        fontSize: 38,
        fontWeight: 400,
        letterSpacing: '-0.02em',
        lineHeight: 1.26,
        padding: '0 42px',
      }}
    >
      <span style={{ fontFamily: CLAUDE_RESPONSE_SERIF }}>{typed(String(children), Math.max(0, Math.min(1, Number(style.opacity ?? 1))))}</span>
    </div>
  )
}

function ClaudeToolUseCard({ startFrame, toolName }: { startFrame: number; toolName: string }) {
  const frame = useCurrentFrame()

  return (
    <div
      style={{
        ...claudeSequenceStyle(frame, startFrame, 16),
        alignItems: 'center',
        background: 'transparent',
        border: '1px solid #dfddd8',
        borderRadius: 12,
        boxSizing: 'border-box',
        color: '#171714',
        display: 'flex',
        fontFamily: CLAUDE_MOBILE_FONT_STACK,
        gap: 16,
        margin: '0 42px',
        minHeight: 84,
        padding: '20px 22px',
      }}
    >
      <div style={{ alignItems: 'center', border: '1px solid #d5d0c7', borderRadius: 12, display: 'flex', height: 42, justifyContent: 'center', width: 42 }}>
        <Wrench color="#77746f" size={22} strokeWidth={2.2} />
      </div>
      <span style={{ color: '#171714', fontSize: 32, fontWeight: 600, letterSpacing: 0, lineHeight: 1.05 }}>{toolName}</span>
    </div>
  )
}

function ClaudePromptInputScene({ frame, hold = 108, prompt, start }: { frame: number; hold?: number; prompt: string; start: number }) {
  const local = frame - start
  const sceneIn = p(local, 0, 16)
  const sceneOut = p(local, hold - 26, hold, [1, 0])
  const promptProgress = p(local, 12, 76)
  const sendPress = p(local, 78, 88)
  const sentState = p(local, 88, 100)
  const textAfterSend = p(local, 86, 98, [1, 0])
  const text = typed(prompt, promptProgress)
  const estimatedLineCount = Math.max(1, Math.ceil(text.length / 42))
  const inputHeight = Math.min(330, 254 + Math.max(0, estimatedLineCount - 2) * 44)
  const inputTop = 929 - inputHeight / 2
  const labelTop = inputTop - 74

  return (
    <div style={{ inset: 0, opacity: sceneIn * sceneOut, position: 'absolute', transform: `translateY(${(1 - sceneIn) * 20 - (1 - sceneOut) * 18}px)` }}>
      <ClaudeMobileShell conversationY={0}>
        <div />
      </ClaudeMobileShell>
      <div style={{ color: '#111111', fontFamily: CLAUDE_MOBILE_FONT_STACK, fontSize: 44, fontWeight: 430, left: 0, letterSpacing: '-0.01em', lineHeight: 1, opacity: p(local, 8, 24), position: 'absolute', right: 0, textAlign: 'center', top: labelTop, transform: `translateY(${(1 - p(local, 8, 24)) * 12}px)` }}>
        Tudo pronto para começar?
      </div>
      <div style={{ height: inputHeight, left: 42, position: 'absolute', right: 42, top: inputTop }}>
        <div style={{ background: '#fbfaf8', border: '1.5px solid #bebcb7', borderRadius: 68, boxShadow: '0 20px 48px rgba(20,24,22,0.16)', height: inputHeight, left: 0, position: 'absolute', right: 0, top: 0, transform: `translateY(${-sentState * 10}px)` }}>
          <div style={{ color: text ? '#111111' : '#77746f', fontSize: 42, fontWeight: 450, left: 36, letterSpacing: '-0.01em', lineHeight: 1.18, maxHeight: inputHeight - 162, opacity: textAfterSend, overflow: 'hidden', position: 'absolute', right: 36, top: 42, whiteSpace: 'pre-wrap' }}>
            {text || 'Chat with Claude'}
            {promptProgress > 0 && promptProgress < 1 ? <span style={{ background: '#111111', display: local % 18 < 9 ? 'inline-block' : 'none', height: 38, marginLeft: 4, transform: 'translateY(7px)', width: 3 }} /> : null}
          </div>
          <div style={{ alignItems: 'center', bottom: 19, display: 'flex', gap: 19, left: 22, position: 'absolute', right: 24 }}>
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, color: '#111111', display: 'flex', fontSize: 42, fontWeight: 360, height: 90, justifyContent: 'center', width: 90 }}>+</div>
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, color: '#111111', display: 'flex', fontSize: 35, fontWeight: 520, height: 78, justifyContent: 'center', letterSpacing: 0, padding: '0 42px', whiteSpace: 'nowrap' }}>Sonnet 4.6</div>
            <div style={{ flex: 1 }} />
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, display: 'flex', height: 90, justifyContent: 'center', width: 90 }}>
              <svg fill="none" height="42" viewBox="0 0 62 62" width="42" xmlns="http://www.w3.org/2000/svg">
                <rect height="32" rx="14" stroke="#333330" strokeWidth="5.8" width="24" x="19" y="7" />
                <path d="M12 29v5c0 10.5 8.2 19 19 19s19-8.5 19-19v-5" stroke="#333330" strokeLinecap="round" strokeWidth="5.8" />
                <path d="M31 53v6" stroke="#333330" strokeLinecap="round" strokeWidth="5.8" />
              </svg>
            </div>
            <div style={{ alignItems: 'center', background: sentState > 0 ? '#d7d7d7' : '#050505', borderRadius: 999, display: 'flex', gap: 7, height: 90, justifyContent: 'center', transform: `scale(${1 - Math.sin(sendPress * Math.PI) * 0.1})`, width: 90 }}>
              {sentState > 0 ? <span style={{ background: '#111111', borderRadius: 7, display: 'block', height: 30, width: 30 }} /> : [23, 36, 50, 36, 23].map((height, index) => <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 6 }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClaudeAgentChatScene({ scene, start }: { scene: AgentScene; start: number }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - start)
  const longRows = scene.actions.some((action) => (action.result.rows?.length ?? 0) >= 8)
  const baseDuration = scene.actions.length === 1 ? 790 : scene.actions.length === 2 ? 930 : scene.actions.length === 3 ? (longRows ? 1850 : 1550) : 2700
  let cursor = 150
  const scheduledActions = scene.actions.map((action, index) => {
    const toolStart = cursor
    const resultStart = toolStart + 58
    const rowCount = action.result.rows?.length ?? 0
    const resultHold = action.result.kind === 'invoiceOutline' ? 390 : action.result.kind === 'dashboardOutline' || action.result.kind === 'reportOutline' ? 330 : rowCount >= 10 ? 270 : rowCount >= 6 ? 220 : 166
    const summaryStart = resultStart + resultHold
    cursor = summaryStart + (action.summary ? 118 : 46)
    return { action, index, resultStart, summaryStart, toolStart }
  })
  const hasFullscreenAction = scene.actions.some((action) => action.result.kind === 'dashboardOutline' || action.result.kind === 'invoiceOutline')
  const duration = Math.max(baseDuration, cursor + (hasFullscreenAction ? 430 : 120))
  const opacity = p(frame, start - 10, start + 14) * p(frame, start + duration - 28, start + duration, [1, 0])
  const conversationY = toolDrivenScroll(local, scheduledActions)
  const dashboardAction = scheduledActions.find(({ action }) => action.result.kind === 'dashboardOutline')
  const invoiceAction = scheduledActions.find(({ action }) => action.result.kind === 'invoiceOutline')

  return (
    <div style={{ inset: 0, opacity, position: 'absolute' }}>
      <ClaudeMobileShell conversationY={conversationY}>
        <StaticClaudeUserBubble style={fadeOnlyStyle(local, 8)}>{scene.prompt}</StaticClaudeUserBubble>
        <ClaudeAssistantText style={claudeSequenceStyle(local, 62, 22)}>{scene.intro}</ClaudeAssistantText>
        {scheduledActions.map(({ action, index, resultStart, summaryStart, toolStart }) => {
          const isOutline = action.result.kind === 'dashboardOutline' || action.result.kind === 'invoiceOutline' || action.result.kind === 'reportOutline'
          return (
            <FragmentBlock key={`${action.tool}-${index}`}>
              {action.text ? <ClaudeAssistantText style={claudeSequenceStyle(local, toolStart - 36, 22)}>{action.text}</ClaudeAssistantText> : null}
              <ClaudeToolUseCard startFrame={toolStart} toolName={action.tool} />
              {isOutline ? (
                <div style={{ ...claudeSequenceStyle(local, resultStart, 18), margin: '0 42px' }}>
                  {action.result.kind === 'invoiceOutline' ? (
                    <InvoiceOutlineWithEmissionStatus localFrame={local - resultStart} subtitle={action.result.subtitle} title={action.result.title} />
                  ) : (
                    <ChatGptOutlineWithCursor localFrame={local - resultStart} subtitle={action.result.subtitle} title={action.result.title} />
                  )}
                </div>
              ) : (
                <ClaudeToolResultCard style={claudeSequenceStyle(local, resultStart, 18)}>
                  <CascadeResultCard localFrame={local - resultStart} result={action.result} />
                </ClaudeToolResultCard>
              )}
              {action.summary ? <ClaudeAssistantText style={claudeSequenceStyle(local, summaryStart, 22)}>{action.summary}</ClaudeAssistantText> : null}
            </FragmentBlock>
          )
        })}
      </ClaudeMobileShell>
      {dashboardAction ? <FullscreenDashboardImageScene localFrame={local - (dashboardAction.resultStart + 170)} /> : null}
      {invoiceAction ? <FullscreenInvoiceImageScene localFrame={local - (invoiceAction.resultStart + 170)} /> : null}
    </div>
  )
}

function FragmentBlock({ children }: { children: ReactNode }) {
  return <>{children}</>
}

const scenes: AgentScene[] = [
  {
    actions: [
      {
        result: {
          rows: [
            row('Receita Shopify', 'Pedido importado e reconhecido', 'R$ 18.400', 'Receita', 'SH', '#95bf47', '#f4faee', ShopifyIcon),
            row('Cliente Norte', 'Servico aprovado no mes', 'R$ 42.100', 'Receita', 'CN', '#0ea5e9', '#eff8ff'),
            row('Google Ads', 'Campanha de aquisicao', 'R$ 4.720', 'Marketing', 'G', '#4285f4', '#eef6ff', GoogleAdsIcon),
            row('Meta Ads', 'Midia paga para remarketing', 'R$ 3.460', 'Marketing', 'M', '#1877f2', '#edf5ff', MetaIcon),
            row('AWS Brasil', 'Infraestrutura recorrente', 'R$ 3.980', 'Software', 'AW', '#111827', '#f4f4f5'),
            row('OpenAI API', 'Automacao e atendimento', 'R$ 1.280', 'Software', 'AI', '#10a37f', '#ecfdf3'),
            row('Impostos federais', 'Guia mensal vinculada', 'R$ 12.300', 'Impostos', 'TX', '#f97316', '#fff7ed'),
            row('Frete Sul', 'Envios e operacao logistica', 'R$ 2.450', 'Logistica', 'FS', '#dc2626', '#fff1f2'),
            row('HubSpot', 'CRM e pipeline comercial', 'R$ 1.940', 'Software', 'HS', '#ff7a59', '#fff7ed'),
            row('Boleto Mercado Sul', 'Recebimento parcial identificado', 'R$ 8.400', 'Receita', 'MS', '#0ea5e9', '#eff8ff'),
          ],
          subtitle: 'Receitas, despesas, categorias e centros de custo',
          title: 'Classificacao automatica',
        },
        summary: 'Receitas e despesas foram organizadas por categoria, com itens recorrentes prontos para regra automatica.',
        tool: 'classificar_receitas_despesas',
      },
    ],
    intro: 'Vou organizar receitas e despesas, sugerir categorias e separar o que precisar de revisao.',
    prompt: 'Organize e classifique receitas e despesas.',
  },
  {
    actions: [
      {
        result: {
          kind: 'reconciliation',
          rows: [
            row('PIX Cliente Norte', 'Conta Azul · recebimento', 'R$ 42.100', 'Conciliado', 'CN', '#0ea5e9', '#eff8ff', undefined, 'NF-9031'),
            row('Cartao Stone', 'Adquirente · lote diario', 'R$ 68.900', 'Conciliado', 'ST', '#111827', '#f4f4f5', undefined, 'Lote-552'),
            row('Boleto Rede Alpha', 'Recebimento · retainer', 'R$ 18.600', 'Conciliado', 'RA', '#1877f2', '#edf5ff', undefined, 'CR-7721'),
            row('Shopify Payout', 'Shopify · repasse ecommerce', 'R$ 12.780', 'Conciliado', 'SH', '#95bf47', '#f4faee', ShopifyIcon, 'PV-1182'),
            row('Tarifa bancaria', 'Banco Inter · taxa avulsa', 'R$ 189', 'Revisar', 'BI', '#f97316', '#fff7ed', undefined, 'Sem lancamento'),
            row('Boleto Mercado Sul', 'Recebimento · parcial', 'R$ 8.400', 'Divergencia', 'MS', '#dc2626', '#fff1f2', undefined, 'CR-4419'),
            row('Google Ads', 'Cartao corporativo · marketing', 'R$ 4.720', 'Conciliado', 'G', '#4285f4', '#eef6ff', GoogleAdsIcon, 'MKT-884'),
            row('Fornecedor Cloud', 'Pagamento · pedido nao vinculado', 'R$ 18.400', 'Revisar', 'FC', '#7c3aed', '#f5f3ff', undefined, 'Sem pedido'),
            row('Meta Ads', 'Cartao corporativo · remarketing', 'R$ 3.460', 'Conciliado', 'M', '#1877f2', '#edf5ff', MetaIcon, 'MKT-921'),
            row('OpenAI API', 'Assinatura internacional · software', 'R$ 1.280', 'Conciliado', 'AI', '#10a37f', '#ecfdf3', undefined, 'SFT-104'),
          ],
          subtitle: 'Banco, cartao e lancamentos no Otto',
          title: 'Matching financeiro',
        },
        summary: 'Conciliacao concluida com matches seguros, duas revisoes e uma divergencia para ajustar no Otto.',
        tool: 'conciliar_bancos_cartoes',
      },
    ],
    intro: 'Vou cruzar bancos, cartoes e movimentacoes financeiras com os lancamentos do Otto.',
    prompt: 'Concilie bancos, cartoes e movimentacoes financeiras.',
  },
  {
    actions: [
      {
        result: {
          kind: 'table',
          rows: [
            row('AWS Brasil', 'Vence em 3 dias', 'R$ 12.790', 'Prioridade', 'AW', '#111827'),
            row('Google Ads', 'Midia paga recorrente', 'R$ 8.420', 'A vencer', 'G', '#4285f4', undefined, GoogleAdsIcon),
            row('Impostos federais', 'Vencimento do mes', 'R$ 31.200', 'Prioridade', 'TX', '#f97316'),
            row('Frete Sul', 'Despesa acima do padrao', 'R$ 6.830', 'Revisar', 'FS', '#dc2626'),
            row('Meta Ads', 'Campanha de remarketing', 'R$ 3.460', 'A vencer', 'M', '#1877f2', undefined, MetaIcon),
            row('Shopify', 'Plano ecommerce mensal', 'R$ 1.280', 'Agendado', 'SH', '#95bf47', undefined, ShopifyIcon),
            row('Conta Azul', 'Assinatura ERP financeiro', 'R$ 2.190', 'A vencer', 'CA', '#2563eb'),
            row('Banco Inter', 'Tarifas e servicos bancarios', 'R$ 840', 'Revisar', 'BI', '#f97316'),
          ],
          subtitle: 'Vencimentos, prioridades e risco',
          title: 'Contas a pagar',
        },
        summary: 'Encontrei 8 contas a pagar. Impostos, AWS e frete exigem prioridade nos proximos dias.',
        text: 'Vou levantar as contas a pagar primeiro.',
        tool: 'buscar_contas_a_pagar',
      },
      {
        result: {
          kind: 'table',
          rows: [
            row('Cliente Norte', 'NF-9031 vence em 5 dias', 'R$ 42.100', 'Previsto', 'CN', '#0ea5e9'),
            row('Rede Alpha', 'Retainer de performance', 'R$ 18.600', 'A vencer', 'RA', '#1877f2'),
            row('Mercado Sul', 'Pagamento em atraso', 'R$ 28.900', 'Atraso', 'MS', '#dc2626'),
            row('Norte Foods', 'Projeto fiscal aprovado', 'R$ 31.400', 'Confirmado', 'NF', '#f97316'),
            row('Canal B2B', 'Receita de campanha Google', 'R$ 54.700', 'Confirmado', 'G', '#4285f4', undefined, GoogleAdsIcon),
            row('Loja Prime', 'Pedidos integrados Shopify', 'R$ 16.800', 'Previsto', 'SH', '#95bf47', undefined, ShopifyIcon),
            row('Grupo Delta', 'Contrato mensal recorrente', 'R$ 76.500', 'Previsto', 'GD', '#7c3aed'),
            row('Shopify Store', 'Repasse ecommerce pendente', 'R$ 12.780', 'A vencer', 'SH', '#95bf47', undefined, ShopifyIcon),
          ],
          subtitle: 'Entradas previstas e atrasos',
          title: 'Contas a receber',
        },
        summary: 'As entradas cobrem os vencimentos, mas Mercado Sul pressiona o caixa se atrasar mais 7 dias.',
        text: 'Agora vou puxar recebimentos, vendas faturadas e atrasos no contas a receber.',
        tool: 'buscar_contas_a_receber',
      },
      {
        result: {
          kind: 'table',
          rows: [
            row('Cliente Norte', 'Venda de servico aprovada', 'R$ 12.400', 'Registrada', 'CN', '#0ea5e9'),
            row('Mercado Sul', 'Pedido comercial importado', 'R$ 28.900', 'Faturar', 'MS', '#dc2626'),
            row('Rede Alpha', 'Venda recorrente renovada', 'R$ 18.600', 'Registrada', 'RA', '#1877f2'),
            row('Loja Prime', 'Venda ecommerce Shopify', 'R$ 16.800', 'Faturada', 'SH', '#95bf47', undefined, ShopifyIcon),
            row('Canal B2B', 'Venda de performance', 'R$ 54.700', 'Faturada', 'G', '#4285f4', undefined, GoogleAdsIcon),
            row('Norte Foods', 'Venda de projeto fiscal', 'R$ 31.400', 'Registrada', 'NF', '#f97316'),
            row('Grupo Delta', 'Venda enterprise aprovada', 'R$ 76.500', 'Registrar', 'GD', '#7c3aed'),
            row('Shopify Store', 'Venda integrada da loja', 'R$ 12.780', 'Faturada', 'SH', '#95bf47', undefined, ShopifyIcon),
          ],
          subtitle: 'Vendas, clientes, valores e faturamento',
          title: 'Vendas',
        },
        summary: 'Oito vendas foram encontradas. Mercado Sul precisa faturamento e Grupo Delta deve ser registrado no ERP.',
        text: 'Agora vou buscar apenas vendas e status de faturamento.',
        tool: 'buscar_vendas',
      },
    ],
    intro: 'Vou revisar a operacao financeira: pagamentos, recebimentos, vendas, cobrancas, caixa e economia.',
    prompt: 'Acompanhe contas a pagar e receber, vendas, cobrancas, pagamentos e recebimentos.',
  },
  {
    actions: [
      {
        result: {
          kind: 'dashboardOutline',
          subtitle: 'Dashboard · Tempo real',
          title: 'dashboard_financeiro',
        },
        summary: 'Dashboard financeiro gerado para acompanhar caixa, contas a pagar, contas a receber, atrasos e margem.',
        text: 'Agora vou montar um dashboard financeiro para acompanhar caixa, vencimentos, recebimentos e atrasos.',
        tool: 'gerar_dashboard_financeiro',
      },
      {
        result: {
          kind: 'reportOutline',
          subtitle: 'Relatório · PDF',
          title: 'relatorio_vendas_mes',
        },
        summary: 'Relatorio criado com resumo das vendas do mes, clientes, valores faturados e itens pendentes de cobranca.',
        text: 'Depois vou gerar um relatorio com o resumo das vendas deste mes.',
        tool: 'gerar_relatorio_vendas_mes',
      },
    ],
    intro: 'Com base nesses dados, vou criar um dashboard financeiro e um relatorio de vendas do mes.',
    prompt: 'Agora crie um dashboard para acompanhar meu financeiro e um relatorio com o resumo das minhas vendas deste mes.',
  },
  {
    actions: [
      {
        result: {
          kind: 'invoiceOutline',
          subtitle: 'Nota fiscal · NFS-e',
          title: 'nota_fiscal_servico_2048',
        },
        summary: 'Nota emitida com PDF, XML, tomador validado e impostos calculados. Agora vou acompanhar prazos e obrigacoes.',
        tool: 'emitir_nota_fiscal',
      },
      {
        result: {
          rows: [
            row('ISS retido', 'Nota NFS-e 2048 vinculada', 'R$ 248', 'Calculado', 'IS', '#16a34a'),
            row('DAS', 'Guia mensal separada', 'R$ 8.200', 'Programado', 'DA', '#f97316'),
            row('DCTFWeb', 'Declaracao a revisar', '1 item', 'Pendente', 'DF', '#dc2626'),
            row('SPED fiscal', 'Competencia atual conferida', 'OK', 'Em dia', 'SP', '#2563eb'),
            row('Certidoes', 'Validade monitorada', '30 dias', 'Monitorado', 'CE', '#7c3aed'),
            row('Livro fiscal', 'Notas e XML atualizados', '12 docs', 'Atualizado', 'LF', '#111827'),
          ],
          subtitle: 'Prazos, guias, declaracoes e registros',
          title: 'Prazos e obrigacoes fiscais',
        },
        summary: 'Obrigacoes acompanhadas. DCTFWeb ficou pendente para revisao antes do envio.',
        text: 'Vou acompanhar prazos, guias e obrigacoes fiscais vinculadas a nota e ao mes atual.',
        tool: 'acompanhar_obrigacoes_fiscais',
      },
      {
        result: {
          rows: [
            row('ISS servicos', 'Aliquota aplicada acima da media', '+R$ 420', 'Revisar', 'IS', '#dc2626'),
            row('Credito PIS/COFINS', 'Despesa elegivel nao aproveitada', '+R$ 1.180', 'Economia', 'PC', '#16a34a'),
            row('Retencoes', 'Cliente Norte validado', 'OK', 'Correto', 'RT', '#2563eb'),
            row('DAS projetado', 'Receita do mes recalculada', '-R$ 640', 'Economia', 'DA', '#f97316'),
            row('Nota Mercado Sul', 'Dados fiscais incompletos', '1 item', 'Pendente', 'MS', '#7c3aed'),
            row('Simples Nacional', 'Faixa efetiva monitorada', '11,8%', 'OK', 'SN', '#111827'),
          ],
          subtitle: 'Inconsistencias, pagamentos acima e economia',
          title: 'Analise de impostos',
        },
        summary: 'Encontrei possivel economia de R$ 2.240 e um ponto de revisao no ISS antes do proximo fechamento fiscal.',
        text: 'Agora vou analisar impostos para identificar inconsistencias, pagamentos acima do necessario e oportunidades de economia.',
        tool: 'analisar_impostos_empresa',
      },
    ],
    intro: 'Vou emitir a nota fiscal do servico aprovado, depois acompanhar prazos, obrigacoes e analisar impostos em busca de inconsistencias e economia.',
    prompt: 'Emita a nota fiscal do ultimo servico aprovado e revise impostos, prazos e obrigacoes fiscais.',
  },
  {
    actions: [
      {
        result: {
          rows: [
            row('Mercado Sul', '28 dias em atraso', 'R$ 3.482,70', 'Prioridade', 'MS', '#dc2626'),
            row('Cliente Norte', '12 dias em atraso', 'R$ 5.940,35', 'Prioridade', 'CN', '#0ea5e9'),
            row('Loja Prime', 'Boleto venceu ontem', 'R$ 1.286,90', 'Acompanhar', 'LP', '#f97316'),
            row('Rede Alpha', '18 dias em atraso', 'R$ 2.174,55', 'Prioridade', 'RA', '#1877f2'),
            row('Norte Foods', 'NF vencida ha 7 dias', 'R$ 4.812,20', 'Acompanhar', 'NF', '#16a34a'),
            row('Canal B2B', 'Parcela sem baixa', 'R$ 6.390,80', 'Revisar', 'G', '#4285f4', undefined, GoogleAdsIcon),
            row('Grupo Delta', 'Contrato mensal pendente', 'R$ 7.158,45', 'Prioridade', 'GD', '#7c3aed'),
            row('Shopify Store', 'Repasse parcial recebido', 'R$ 1.934,12', 'Acompanhar', 'SH', '#95bf47', undefined, ShopifyIcon),
          ],
          subtitle: 'Clientes, valores e dias em atraso',
          title: 'Clientes em atraso',
        },
        summary: 'Identifiquei 8 clientes em atraso, com R$ 33.180,07 em aberto. Mercado Sul, Grupo Delta e Cliente Norte exigem prioridade.',
        tool: 'buscar_clientes_em_atraso',
      },
      {
        result: {
          rows: [
            row('Mercado Sul', 'financeiro@mercadosul.com.br', 'R$ 3.482,70', 'Enviado', 'MS', '#dc2626'),
            row('Cliente Norte', 'contas@clientenorte.com.br', 'R$ 5.940,35', 'Enviado', 'CN', '#0ea5e9'),
            row('Loja Prime', 'adm@lojaprime.com.br', 'R$ 1.286,90', 'Enviado', 'LP', '#f97316'),
            row('Rede Alpha', 'financeiro@redealpha.com.br', 'R$ 2.174,55', 'Enviado', 'RA', '#1877f2'),
            row('Norte Foods', 'pagamentos@nortefoods.com.br', 'R$ 4.812,20', 'Enviado', 'NF', '#16a34a'),
            row('Canal B2B', 'cobranca@canalb2b.com.br', 'R$ 6.390,80', 'Enviado', 'G', '#4285f4', undefined, GoogleAdsIcon),
            row('Grupo Delta', 'financeiro@grupodelta.com.br', 'R$ 7.158,45', 'Enviado', 'GD', '#7c3aed'),
            row('Shopify Store', 'owner@shopifystore.com.br', 'R$ 1.934,12', 'Enviado', 'SH', '#95bf47', undefined, ShopifyIcon),
          ],
          subtitle: 'E-mails enviados, segunda via e historico',
          title: 'Cobrancas por e-mail',
        },
        summary: 'E-mails de cobranca enviados com segunda via, valor em aberto e historico registrado no contas a receber.',
        text: 'Vou enviar as cobrancas por e-mail com segunda via, valor atualizado e prazo para pagamento.',
        tool: 'enviar_cobrancas_email',
      },
      {
        result: {
          rows: [
            row('Mercado Sul', '+55 11 94218-7704', 'R$ 3.482,70', 'Enviado', 'MS', '#25d366'),
            row('Cliente Norte', '+55 85 99104-2281', 'R$ 5.940,35', 'Enviado', 'CN', '#0ea5e9'),
            row('Loja Prime', '+55 11 97842-6630', 'R$ 1.286,90', 'Enviado', 'LP', '#f97316'),
            row('Rede Alpha', '+55 21 98216-4409', 'R$ 2.174,55', 'Enviado', 'RA', '#1877f2'),
            row('Norte Foods', '+55 81 99672-1180', 'R$ 4.812,20', 'Enviado', 'NF', '#16a34a'),
            row('Canal B2B', '+55 31 97158-0294', 'R$ 6.390,80', 'Enviado', 'G', '#4285f4', undefined, GoogleAdsIcon),
            row('Grupo Delta', '+55 41 98744-5520', 'R$ 7.158,45', 'Enviado', 'GD', '#7c3aed'),
            row('Shopify Store', '+55 47 99288-6315', 'R$ 1.934,12', 'Enviado', 'SH', '#95bf47', undefined, ShopifyIcon),
          ],
          subtitle: 'Mensagens enviadas, link de pagamento e historico',
          title: 'Cobrancas por WhatsApp',
        },
        summary: 'Mensagens de WhatsApp enviadas com link de pagamento e historico anexado aos clientes em atraso.',
        text: 'Agora vou reforcar a cobranca pelo WhatsApp usando o telefone cadastrado de cada cliente.',
        tool: 'enviar_cobrancas_whatsapp',
      },
      {
        result: {
          rows: [
            row('Cliente Norte', 'PIX recebido parcialmente', 'R$ 2.400,00', 'Pago parcial', 'CN', '#0ea5e9'),
            row('Loja Prime', 'Cliente respondeu no WhatsApp', 'Hoje', 'Respondido', 'LP', '#25d366'),
            row('Mercado Sul', 'Follow-up agendado', 'Amanha', 'Aguardando', 'MS', '#dc2626'),
            row('Rede Alpha', 'Boleto aberto pelo cliente', '2h atras', 'Visualizado', 'RA', '#1877f2'),
            row('Norte Foods', 'Pagamento prometido', 'Sexta', 'Acompanhar', 'NF', '#16a34a'),
            row('Canal B2B', 'Comprovante solicitado', 'Pendente', 'Revisar', 'G', '#4285f4', undefined, GoogleAdsIcon),
            row('Grupo Delta', 'Sem resposta ainda', '24h', 'Escalar', 'GD', '#7c3aed'),
            row('Shopify Store', 'Saldo liquidado', 'R$ 1.934,12', 'Recebido', 'SH', '#95bf47', undefined, ShopifyIcon),
          ],
          subtitle: 'Resposta, recebimento, follow-up e proximo passo',
          title: 'Acompanhamento ate recebimento',
        },
        summary: 'Recebimentos acompanhados: um cliente liquidou, um pagou parcialmente e os casos criticos ficaram com proximo passo definido.',
        text: 'Agora vou acompanhar respostas, recebimentos e proximos passos ate a baixa no contas a receber.',
        tool: 'acompanhar_recebimentos_cobrancas',
      },
    ],
    intro: 'Vou localizar clientes em atraso, enviar cobrancas por e-mail, reforcar no WhatsApp e acompanhar cada caso ate o recebimento.',
    prompt: 'Monitore clientes em atraso, envie cobrancas por e-mail e WhatsApp e acompanhe ate o recebimento.',
  },
  {
    actions: [
      {
        result: {
          kind: 'employee',
          subtitle: 'Rotina, permissoes e aprovacao humana',
          title: 'Funcionario de IA criado',
        },
        summary: 'Funcionario criado e pronto para automatizar o processo com seguranca e aprovacao humana.',
        tool: 'criar_funcionario_ia',
      },
    ],
    intro: 'Vou criar um funcionario de IA com rotina, permissoes e limites de execucao dentro do Otto.',
    prompt: 'Crie um funcionario de IA para automatizar um processo da minha empresa.',
  },
]

function row(name: string, description: string, value: string, status: string, initials: string, tone: string, background?: string, icon?: ComponentType<{ className?: string }>, erp?: string): ResultRow {
  return { background, description, erp, icon, initials, name, status, tone, value }
}

export function ChatGptClaudeOttoAiEmployeesVideo() {
  const frame = useCurrentFrame()
  const starts = [0, 820, 1640, 4600, 6400, 8100, 10100]

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      {scenes.map((scene, index) => {
        const promptHold = index === 3 ? 176 : 108
        const start = starts[index] + (index === 3 ? 190 : 110)
        return (
          <FragmentBlock key={scene.prompt}>
            <AgentChatScene scene={scene} start={start} />
            <PromptInputScene frame={frame} hold={promptHold} prompt={scene.prompt} start={starts[index]} />
          </FragmentBlock>
        )
      })}
    </AbsoluteFill>
  )
}

export function ClaudeOttoAiEmployeesVideo() {
  const frame = useCurrentFrame()
  const starts = [0, 820, 1640, 4600, 6400, 8100, 10100]

  return (
    <AbsoluteFill style={{ background: '#fbfaf8', color: '#111111', fontFamily: CLAUDE_MOBILE_FONT_STACK, overflow: 'hidden' }}>
      {scenes.map((scene, index) => {
        const promptHold = index === 3 ? 176 : 108
        const start = starts[index] + (index === 3 ? 190 : 110)
        return (
          <FragmentBlock key={scene.prompt}>
            <ClaudeAgentChatScene scene={scene} start={start} />
            <ClaudePromptInputScene frame={frame} hold={promptHold} prompt={scene.prompt} start={starts[index]} />
          </FragmentBlock>
        )
      })}
    </AbsoluteFill>
  )
}

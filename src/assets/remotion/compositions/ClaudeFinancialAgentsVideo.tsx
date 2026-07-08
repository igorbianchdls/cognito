import type { CSSProperties, ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

import {
  ClaudeFlowUserBubble,
  ClaudeMobileShell,
  ClaudeToolResultCard,
  claudeSequenceStyle,
} from '@/assets/remotion/compositions/ClaudeMobileBase'
import { OttoAssistantHeader, fastCharacterTyping } from '@/assets/remotion/compositions/ChatGptMobileBase'
import {
  CHATGPT_FINANCIAL_AGENTS_VIDEO_DURATION,
  ImprovedFinancialResultCard,
  financialAgentSteps,
} from '@/assets/remotion/compositions/ChatGptMobileMarketing'

export const CLAUDE_FINANCIAL_AGENTS_VIDEO_DURATION = CHATGPT_FINANCIAL_AGENTS_VIDEO_DURATION
const CLAUDE_RESPONSE_SERIF = 'Georgia, "Times New Roman", Times, serif'

function ClaudeFinancialAssistantText({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: CLAUDE_RESPONSE_SERIF,
        fontSize: 43,
        fontWeight: 500,
        letterSpacing: 0,
        lineHeight: 1.26,
        padding: '0 42px',
      }}
    >
      <OttoAssistantHeader muted="#8b857c" />
      <span style={{ fontFamily: CLAUDE_RESPONSE_SERIF }}>
        {fastCharacterTyping(children, style)}
      </span>
    </div>
  )
}

function ClaudeToolUseCard({ startFrame, toolName }: { startFrame: number; toolName: string }) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - startFrame)
  const progress = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const scan = interpolate(local % 46, [0, 46], [-190, 190])

  return (
    <ClaudeToolResultCard style={claudeSequenceStyle(frame, startFrame, 16)}>
      <div style={{ background: '#fffaf3', display: 'grid', gap: 14, padding: 20 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 13 }}>
          <span style={{ alignItems: 'center', background: '#d86f4a', borderRadius: 13, color: '#ffffff', display: 'flex', fontSize: 22, fontWeight: 850, height: 42, justifyContent: 'center', lineHeight: 1, width: 42 }}>*</span>
          <div style={{ display: 'grid', gap: 3 }}>
            <strong style={{ color: '#171714', fontSize: 24, fontWeight: 780, letterSpacing: 0 }}>Usando ferramenta</strong>
            <span style={{ color: '#8b857c', fontSize: 18, fontWeight: 620 }}>{toolName}</span>
          </div>
        </div>
        <div style={{ background: '#efe7dc', borderRadius: 999, height: 8, overflow: 'hidden', position: 'relative' }}>
          <span style={{ background: '#d86f4a', borderRadius: 999, display: 'block', height: '100%', transform: `scaleX(${progress})`, transformOrigin: 'left center', width: '100%' }} />
          <span style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)', height: '100%', left: scan, position: 'absolute', top: 0, width: 120 }} />
        </div>
      </div>
    </ClaudeToolResultCard>
  )
}

export function ClaudeFinancialAgentsVideo() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(
    frame,
    [0, 210, 380, 550, 720, 890, 1060, 1230, 1400],
    [0, 0, -330, -710, -1090, -1470, -1850, -2230, -2610],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )

  return (
    <ClaudeMobileShell conversationY={conversationY}>
      <ClaudeFlowUserBubble style={claudeSequenceStyle(frame, 12, 18)}>
        Otto, revise o financeiro da empresa e priorize o que eu preciso resolver hoje.
      </ClaudeFlowUserBubble>

      <ClaudeFinancialAssistantText style={claudeSequenceStyle(frame, 74, 22)}>
        Claro. Vou acionar seus agentes financeiros e organizar prioridades, riscos e oportunidades.
      </ClaudeFinancialAssistantText>

      {financialAgentSteps.map((step, index) => {
        const start = 150 + index * 170
        return (
          <div key={step.toolName} style={{ display: 'contents' }}>
            <ClaudeFinancialAssistantText style={claudeSequenceStyle(frame, start, 22)}>
              {step.text}
            </ClaudeFinancialAssistantText>
            <ClaudeToolUseCard startFrame={start + 52} toolName={step.toolName} />
            <ClaudeToolResultCard style={claudeSequenceStyle(frame, start + 100, 18)}>
              <ImprovedFinancialResultCard kind={step.result} startFrame={start + 100} />
            </ClaudeToolResultCard>
            <ClaudeFinancialAssistantText style={claudeSequenceStyle(frame, start + 174, 22)}>
              {step.insight}
            </ClaudeFinancialAssistantText>
          </div>
        )
      })}

      <ClaudeToolResultCard style={claudeSequenceStyle(frame, 1450, 18)}>
        <div style={{ background: '#fffaf3', display: 'grid', gap: 16, padding: 22 }}>
          <div style={{ color: '#171714', fontSize: 30, fontWeight: 780, letterSpacing: 0 }}>7 agentes financeiros ativos</div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            {['Despesas organizadas', 'Bancos conciliados', 'Caixa monitorado', 'Documentos em ordem', 'Cobrancas priorizadas', 'Margem analisada'].map((item) => (
              <div key={item} style={{ background: '#f5eee4', border: '1px solid #e5d8c7', borderRadius: 13, color: '#7c3f2c', fontSize: 17, fontWeight: 760, padding: 12 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </ClaudeToolResultCard>

      <ClaudeFinancialAssistantText style={claudeSequenceStyle(frame, 1520, 18)}>
        Seu financeiro operando direto pelo Claude com Otto.
      </ClaudeFinancialAssistantText>
    </ClaudeMobileShell>
  )
}

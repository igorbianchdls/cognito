import type { CSSProperties, ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { Wrench } from 'lucide-react'

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
const CLAUDE_RESPONSE_SERIF = '"Libre Baskerville", Baskerville, Georgia, "Times New Roman", serif'

function ClaudeFinancialAssistantText({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      className="claude-financial-response"
      style={{
        ...style,
        color: '#111111',
        fontFamily: CLAUDE_RESPONSE_SERIF,
        fontSize: 38,
        fontWeight: 400,
        letterSpacing: '-0.01em',
        lineHeight: 1.26,
        padding: '0 42px',
      }}
    >
      <OttoAssistantHeader muted="#8b857c" />
      <span className="claude-financial-response-copy" style={{ fontFamily: CLAUDE_RESPONSE_SERIF }}>
        {fastCharacterTyping(children, style)}
      </span>
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
        fontFamily: 'Arial, sans-serif',
        gap: 16,
        margin: '0 42px',
        minHeight: 84,
        padding: '20px 22px',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          border: '1px solid #d5d0c7',
          borderRadius: 12,
          display: 'flex',
          height: 42,
          justifyContent: 'center',
          width: 42,
        }}
      >
        <Wrench color="#77746f" size={22} strokeWidth={2.2} />
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, minWidth: 0 }}>
        <span style={{ color: '#171714', fontSize: 32, fontWeight: 600, letterSpacing: 0, lineHeight: 1.05 }}>
          {toolName}
        </span>
      </div>
    </div>
  )
}

export function ClaudeFinancialAgentsVideo() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(
    frame,
    [0, 240, 460, 680, 900, 1120, 1340, 1560, 1740],
    [0, 0, -330, -710, -1090, -1470, -1850, -2230, -2610],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )

  return (
    <>
      <style>
        {`
          .claude-financial-response,
          .claude-financial-response-copy,
          .claude-financial-response-copy span {
            font-family: "Libre Baskerville", Baskerville, Georgia, "Times New Roman", serif !important;
            letter-spacing: -0.01em !important;
          }
        `}
      </style>
      <ClaudeMobileShell conversationY={conversationY}>
      <ClaudeFlowUserBubble style={claudeSequenceStyle(frame, 12, 18)}>
        Otto, revise o financeiro da empresa e priorize o que eu preciso resolver hoje.
      </ClaudeFlowUserBubble>

      <ClaudeFinancialAssistantText style={claudeSequenceStyle(frame, 74, 22)}>
        Claro. Vou acionar seus agentes financeiros e organizar prioridades, riscos e oportunidades.
      </ClaudeFinancialAssistantText>

      {financialAgentSteps.map((step, index) => {
        const start = 150 + index * 210
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

      <ClaudeToolResultCard style={claudeSequenceStyle(frame, 1660, 18)}>
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

      <ClaudeFinancialAssistantText style={claudeSequenceStyle(frame, 1740, 18)}>
        Seu financeiro operando direto pelo Claude com Otto.
      </ClaudeFinancialAssistantText>
      </ClaudeMobileShell>
    </>
  )
}

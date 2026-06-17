import { useCurrentFrame } from 'remotion'

import {
  ClaudeActionRow,
  ClaudeFlowAssistantText,
  ClaudeFlowUserBubble,
  ClaudeMobileShell,
  claudeSequenceStyle,
} from '@/assets/remotion/compositions/ClaudeMobileBase'

export function ClaudeMobileMarketingAnimation() {
  const frame = useCurrentFrame()

  return (
    <ClaudeMobileShell>
      <ClaudeFlowUserBubble style={claudeSequenceStyle(frame, 12, 18)}>
        Resuma este lancamento para diretoria
      </ClaudeFlowUserBubble>
      <ClaudeFlowAssistantText style={claudeSequenceStyle(frame, 54, 22)}>
        Posso transformar em uma mensagem mais objetiva, com contexto, impacto e proximo passo.
      </ClaudeFlowAssistantText>
      <ClaudeFlowAssistantText style={claudeSequenceStyle(frame, 126, 22)}>
        O novo fluxo conecta operacao, financeiro e atendimento em uma unica analise. A prioridade e reduzir tempo de resposta e acelerar decisoes com dados confiaveis.
      </ClaudeFlowAssistantText>
      <ClaudeFlowUserBubble style={claudeSequenceStyle(frame, 256, 18)}>
        Deixe mais curto
      </ClaudeFlowUserBubble>
      <ClaudeFlowAssistantText style={claudeSequenceStyle(frame, 298, 22)}>
        Dados conectados, decisoes mais rapidas e operacao acompanhada em tempo real.
      </ClaudeFlowAssistantText>
      <div style={claudeSequenceStyle(frame, 390, 14)}>
        <div style={{ padding: '10px 0 0 52px' }}>
          <ClaudeActionRow second />
        </div>
      </div>
    </ClaudeMobileShell>
  )
}

export function ClaudeMobileAnimation() {
  return <ClaudeMobileMarketingAnimation />
}

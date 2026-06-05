import { useCurrentFrame } from 'remotion'

import {
  ChatGptActionRow,
  ChatGptFlowAssistantText,
  ChatGptFlowUserBubble,
  ChatGptMobileShell,
  chatGptSequenceStyle,
} from '@/remotion/compositions/ChatGptMobileBase'

export function ChatGptMobileMarketingAnimation() {
  const frame = useCurrentFrame()

  return (
    <ChatGptMobileShell>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 12, 18)}>
        Crie uma legenda para o lancamento
      </ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 54, 22)}>
        Claro. Vou deixar o texto curto, direto e pronto para postar.
      </ChatGptFlowAssistantText>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 112, 22)}>
        Novo recurso no ar: conecte seus dados, acompanhe indicadores e transforme analises em acoes sem sair do chat.
      </ChatGptFlowAssistantText>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 210, 18)}>
        Faca uma versao mais executiva
      </ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 252, 22)}>
        Seus dados operacionais agora viram decisoes em minutos. Financeiro, vendas e marketing no mesmo fluxo de trabalho.
      </ChatGptFlowAssistantText>
      <div style={chatGptSequenceStyle(frame, 340, 14)}>
        <div style={{ padding: '10px 0 0 45px' }}>
          <ChatGptActionRow />
        </div>
      </div>
    </ChatGptMobileShell>
  )
}

export function ChatGptMobileAnimation() {
  return <ChatGptMobileMarketingAnimation />
}

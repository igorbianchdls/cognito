import { interpolate, useCurrentFrame } from 'remotion'

import {
  ChatGptActionRow,
  ChatGptFlowAssistantText,
  ChatGptFlowUserBubble,
  ChatGptMobileShell,
  ChatGptToolCallCard,
  chatGptSequenceStyle,
} from '@/assets/remotion/compositions/ChatGptMobileBase'

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

export function ChatGptToolCallDemoAnimation() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(frame, [0, 240, 420, 620], [0, 0, -220, -430], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <ChatGptMobileShell conversationY={conversationY}>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 12, 18)}>
        Analise minhas campanhas de hoje
      </ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 54, 22)}>
        Vou chamar get_data para buscar as campanhas ativas.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 126, 18)}
        toolName="get_data"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 190, 22)}>
        Agora vou chamar normalize_metrics para padronizar receita, gasto e ROAS.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 272, 18)}
        toolName="normalize_metrics"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 336, 22)}>
        Vou chamar detect_anomalies para encontrar campanhas fora do padrao.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 418, 18)}
        toolName="detect_anomalies"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 482, 22)}>
        Por fim vou chamar summarize_actions para montar as proximas acoes.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 564, 18)}
        toolName="summarize_actions"
      />
      <div style={chatGptSequenceStyle(frame, 642, 14)}>
        <div style={{ padding: '10px 0 0 45px' }}>
          <ChatGptActionRow />
        </div>
      </div>
    </ChatGptMobileShell>
  )
}

export function ChatGptAccountingToolActionsAnimation() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(frame, [0, 360, 560, 740, 900], [0, 0, -90, -180, -260], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <ChatGptMobileShell conversationY={conversationY} promptInputBottom={44}>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 12, 18)}>
        Classifique as despesas, concilie o banco e lance no ERP.
      </ChatGptFlowUserBubble>

      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 62, 22)}>
        Entendi. Vou executar em tres etapas e te devolver o resumo de cada uma.
      </ChatGptFlowAssistantText>

      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 144, 22)}>
        Primeiro vou classificar as despesas sem categoria usando regras do financeiro.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 232, 18)}
        toolName="classificar_despesa"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 306, 22)}>
        Classifiquei 4 despesas: 3 aplicadas com alta confianca e 1 mantida para revisao.
      </ChatGptFlowAssistantText>

      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 406, 22)}>
        Agora vou conciliar o extrato bancario com os lancamentos do ERP.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 486, 18)}
        toolName="conciliar_banco"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 560, 22)}>
        Conciliei 14 movimentos automaticamente e deixei 3 divergencias pendentes.
      </ChatGptFlowAssistantText>

      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 660, 22)}>
        Por fim, vou criar o lancamento no ERP para a despesa validada.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        style={chatGptSequenceStyle(frame, 738, 18)}
        toolName="criar_lancamento"
      />
      <ChatGptFlowAssistantText showHeader={false} style={chatGptSequenceStyle(frame, 812, 22)}>
        Lancamento criado no ERP, vinculado ao extrato e marcado como aberto.
      </ChatGptFlowAssistantText>

      <div style={chatGptSequenceStyle(frame, 902, 14)}>
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

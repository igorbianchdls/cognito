import { useCurrentFrame } from 'remotion'

import type { DataResultStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { AnimatedMcpTableView } from '@/remotion/components/AnimatedMcpTableView'
import {
  ChatGptActionRow,
  ChatGptFlowAssistantText,
  ChatGptFlowUserBubble,
  ChatGptMobileShell,
  ChatGptToolCallCard,
  ChatGptToolResultCard,
  chatGptSequenceStyle,
} from '@/remotion/compositions/ChatGptMobileBase'

const toolCallDemoData = {
  ok: true,
  tool: 'get_data',
  view: 'table',
  title: 'Dados retornados',
  resource: 'marketing/campaigns',
  count: 3,
  columns: ['Campanha', 'Receita', 'ROAS', 'Status'],
  rows: [
    { Campanha: 'Search Brand', Receita: 'R$ 42.100', ROAS: '5.8x', Status: 'Forte' },
    { Campanha: 'Meta Retargeting', Receita: 'R$ 28.900', ROAS: '4.1x', Status: 'Estavel' },
    { Campanha: 'Shopping Gen', Receita: 'R$ 18.400', ROAS: '2.2x', Status: 'Revisar' },
  ],
} satisfies DataResultStructuredContent

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

  return (
    <ChatGptMobileShell>
      <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 12, 18)}>
        Busque os dados das campanhas
      </ChatGptFlowUserBubble>
      <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 54, 22)}>
        Vou consultar as campanhas ativas e trazer o resumo.
      </ChatGptFlowAssistantText>
      <ChatGptToolCallCard
        status={frame >= 178 ? 'completed' : 'running'}
        style={chatGptSequenceStyle(frame, 124, 18)}
        toolName="get_data"
      />
      <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 190, 22)}>
        <AnimatedMcpTableView data={toolCallDemoData} startFrame={190} />
      </ChatGptToolResultCard>
      <div style={chatGptSequenceStyle(frame, 330, 14)}>
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

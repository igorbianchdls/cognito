'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent } from 'react';
import { useStore } from '@nanostores/react';
import ChatContainer from '../../components/nexus/ChatContainer';
import type { UIMessage } from 'ai';
import { currentAgent, setCurrentAgent } from '../../stores/agentStore';

export default function Page() {
  const selectedAgent = useStore(currentAgent);
  
  // Array unificado que guarda TODAS as mensagens em ordem cronológica
  const [allMessages, setAllMessages] = useState<(UIMessage & { agent: string })[]>([]);

  const chats = {
    nexus: useChat({
      transport: new DefaultChatTransport({ api: '/api/chat-ui' }),
      id: 'nexus-chat',
      onFinish: ({ message }) => {
        console.log('NEXUS terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'nexus' }]);
      },
    }),
    teste: useChat({
      transport: new DefaultChatTransport({ api: '/api/teste' }),
      id: 'teste-chat',
      onFinish: ({ message }) => {
        console.log('TESTE terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'teste' }]);
      },
    }),
    metaAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/meta-analyst' }),
      id: 'meta-analyst-chat',
      onFinish: ({ message }) => {
        console.log('METAANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'metaAnalyst' }]);
      },
    }),
    amazonAdsAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/amazon-ads-analyst' }),
      id: 'amazon-ads-analyst-chat',
      onFinish: ({ message }) => {
        console.log('AMAZON ADS ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'amazonAdsAnalyst' }]);
      },
    }),
    googleAnalyticsAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/google-analytics-analyst' }),
      id: 'google-analytics-analyst-chat',
      onFinish: ({ message }) => {
        console.log('GOOGLE ANALYTICS ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'googleAnalyticsAnalyst' }]);
      },
    }),
    shopifyAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/shopify-analyst' }),
      id: 'shopify-analyst-chat',
      onFinish: ({ message }) => {
        console.log('SHOPIFY ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'shopifyAnalyst' }]);
      },
    }),
    contaAzulAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/conta-azul-analyst' }),
      id: 'conta-azul-analyst-chat',
      onFinish: ({ message }) => {
        console.log('CONTA AZUL ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'contaAzulAnalyst' }]);
      },
    }),
    shopeeAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/shopee-analyst' }),
      id: 'shopee-analyst-chat',
      onFinish: ({ message }) => {
        console.log('SHOPEE ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'shopeeAnalyst' }]);
      },
    }),
    keywordAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/keyword-analyst' }),
      id: 'keyword-analyst-chat',
      onFinish: ({ message }) => {
        console.log('KEYWORD ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'keywordAnalyst' }]);
      },
    }),
    googleCampaignAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/google-campaign-analyst' }),
      id: 'google-campaign-analyst-chat',
      onFinish: ({ message }) => {
        console.log('GOOGLE CAMPAIGN ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'googleCampaignAnalyst' }]);
      },
    }),
    metaCampaignAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/meta-campaign-analyst' }),
      id: 'meta-campaign-analyst-chat',
      onFinish: ({ message }) => {
        console.log('META CAMPAIGN ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'metaCampaignAnalyst' }]);
      },
    }),
    metaCreativeAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/meta-creative-analyst' }),
      id: 'meta-creative-analyst-chat',
      onFinish: ({ message }) => {
        console.log('META CREATIVE ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'metaCreativeAnalyst' }]);
      },
    }),
    inventoryAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/inventory-analyst' }),
      id: 'inventory-analyst-chat',
      onFinish: ({ message }) => {
        console.log('INVENTORY ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'inventoryAnalyst' }]);
      },
    }),
    cashFlowAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/cash-flow-analyst' }),
      id: 'cash-flow-analyst-chat',
      onFinish: ({ message }) => {
        console.log('CASH FLOW ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'cashFlowAnalyst' }]);
      },
    }),
    pnlAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/pnl-analyst' }),
      id: 'pnl-analyst-chat',
      onFinish: ({ message }) => {
        console.log('P&L ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'pnlAnalyst' }]);
      },
    }),
    budgetPlanningAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/budget-planning-analyst' }),
      id: 'budget-planning-analyst-chat',
      onFinish: ({ message }) => {
        console.log('BUDGET PLANNING ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'budgetPlanningAnalyst' }]);
      },
    }),
  };

  // Escolhe qual hook vai enviar a próxima mensagem E pegar streaming
  const { messages, sendMessage, status } = chats[selectedAgent as keyof typeof chats] || chats.nexus;

  // Combinar histórico + streaming atual (sem duplicatas)
  const displayedMessages = [
    ...allMessages,
    ...messages.filter(msg => {
      // Para mensagens do usuário: só mostrar se não existe no allMessages
      if (msg.role === 'user') {
        return !allMessages.some(existing => {
          if (existing.role !== 'user' || existing.agent !== selectedAgent) return false;
          
          const existingText = existing.parts?.find(p => p.type === 'text')?.text;
          const msgText = msg.parts?.find(p => p.type === 'text')?.text;
          
          return existingText === msgText;
        });
      }
      // Para mensagens da IA: filtro por ID (como antes)
      return !allMessages.some(existing => existing.id === msg.id);
    })
  ];

  const [input, setInput] = useState('');
  
  // COMENTADO TEMPORARIAMENTE - localStorage
  /*
  useEffect(() => {
    setSavedMessages(messages);
  }, [messages]);
  
  useEffect(() => {
    console.log('Saving to localStorage:', { agent: currentAgent, messagesCount: messages.length });
    localStorage.setItem('chat-state', JSON.stringify({
      agent: currentAgent,
      messages: messages
    }));
  }, [messages, currentAgent]);
  
  useEffect(() => {
    const savedState = localStorage.getItem('chat-state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      console.log('Loaded from localStorage:', { agent: parsed.agent, messagesCount: parsed.messages?.length || 0 });
      setCurrentAgent(parsed.agent || 'nexus');
    }
  }, []);
  */
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      console.log('Enviando mensagem via:', selectedAgent);
      
      // Adicionar mensagem do user ao array unificado
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: input }],
        agent: selectedAgent
      };
      setAllMessages(prev => [...prev, userMessage]);
      
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="fixed inset-0 h-screen mx-[2.5%] md:mx-[12.5%] lg:mx-[25%]">
      <ChatContainer
        messages={displayedMessages}
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        status={status}
        selectedAgent={selectedAgent}
        onAgentChange={setCurrentAgent}
      />
    </div>
  );
}
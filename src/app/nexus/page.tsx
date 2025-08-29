'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import ChatContainer from '../../components/nexus/ChatContainer';
import type { UIMessage } from 'ai';
import { currentAgent, setCurrentAgent } from '../../stores/agentStore';

export default function Page() {
  const selectedAgent = useStore(currentAgent);
  
  // Array unificado que guarda TODAS as mensagens em ordem cronológica
  const [allMessages, setAllMessages] = useState<(UIMessage & { agent: string })[]>([]);
  
  // State para armazenar dados pendentes de análise
  const [pendingAnalysisData, setPendingAnalysisData] = useState<string | null>(null);

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
    tiktokAdsAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/tiktok-ads-analyst' }),
      id: 'tiktok-ads-analyst-chat',
      onFinish: ({ message }) => {
        console.log('TIKTOK ADS ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'tiktokAdsAnalyst' }]);
      },
    }),
    customerServiceAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/customer-service-analyst' }),
      id: 'customer-service-analyst-chat',
      onFinish: ({ message }) => {
        console.log('CUSTOMER SERVICE ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'customerServiceAnalyst' }]);
      },
    }),
    taxComplianceAnalyst: useChat({
      transport: new DefaultChatTransport({ api: '/api/agents/tax-compliance-analyst' }),
      id: 'tax-compliance-analyst-chat',
      onFinish: ({ message }) => {
        console.log('TAX COMPLIANCE ANALYST terminou:', message);
        setAllMessages(prev => [...prev, { ...message, agent: 'taxComplianceAnalyst' }]);
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
      
      // Check if there's pending analysis data
      const messageToSend = pendingAnalysisData && input.includes('[+') && input.includes('linhas de dados]')
        ? pendingAnalysisData
        : input;
      
      // Adicionar mensagem do user ao array unificado
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: input }], // Display text for UI
        agent: selectedAgent
      };
      setAllMessages(prev => [...prev, userMessage]);
      
      sendMessage({ text: messageToSend }); // Send full data or regular input
      setInput('');
      
      // Clear pending data after sending
      if (pendingAnalysisData) {
        setPendingAnalysisData(null);
      }
    }
  };

  // Handler para análise com IA dos dados SQL
  const handleAnalyzeWithAI = (data: Record<string, unknown>[], query: string) => {
    console.log('📊 Analisando dados com IA:', { rowCount: data.length, query });
    
    // Criar mensagem resumida para o chat (visível)
    const displayMessage = `[Dados da query para análise - ${data.length} registros]`;
    
    // Criar mensagem com dados completos para a IA
    const analysisMessage = {
      id: `analysis-${Date.now()}`,
      role: 'user' as const,
      parts: [{ 
        type: 'text' as const, 
        text: `Analise esses dados da query SQL: "${query}"\n\nDados (${data.length} registros):\n${JSON.stringify(data, null, 2)}`
      }],
      agent: selectedAgent
    };

    // Adicionar mensagem resumida visível ao chat
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: displayMessage }],
      agent: selectedAgent
    };
    
    setAllMessages(prev => [...prev, userMessage]);
    
    // Enviar dados completos para a IA (não aparece no chat)
    sendMessage({ 
      text: `Analise esses dados da query SQL: "${query}"\n\nDados (${data.length} registros):\n${JSON.stringify(data, null, 2)}`
    });
  };

  // Listen for postMessage from SQLExecution components
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: only accept messages from same origin
      if (event.origin !== window.location.origin && event.origin !== 'null') {
        return;
      }

      if (event.data.type === 'ANALYZE_DATA') {
        console.log('📊 Received ANALYZE_DATA message:', event.data);
        const { data, query } = event.data;
        
        if (data && Array.isArray(data) && data.length > 0) {
          handleAnalyzeWithAI(data, query || 'Query executada');
        }
      }

      if (event.data.type === 'SEND_TO_CHAT') {
        console.log('📊 Received SEND_TO_CHAT message:', event.data);
        const { data, displayText, query } = event.data;
        
        if (data && Array.isArray(data) && data.length > 0) {
          // Set the display text in the input
          setInput(displayText);
          
          // Prepare full analysis message for AI
          const analysisMessage = `Analise esses dados da query SQL: "${query || 'Dados da tabela SQL'}"\n\nDados (${data.length} registros):\n${JSON.stringify(data, null, 2)}`;
          
          // Store the full data for when user submits
          setPendingAnalysisData(analysisMessage);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedAgent]);

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12" style={{backgroundColor: 'white'}}>
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Creatto
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nexus</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4" style={{backgroundColor: 'white'}}>
          <div data-page="nexus" className="mx-auto w-full max-w-4xl">
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
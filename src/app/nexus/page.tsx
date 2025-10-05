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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, MessageSquare, Layout, BarChart3 } from "lucide-react";
import ChatContainer from '../../components/nexus/ChatContainer';
import DashboardChatPanel from '../../components/nexus/DashboardChatPanel';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { UIMessage } from 'ai';
import { currentAgent, setCurrentAgent } from '../../stores/nexus/agentStore';

export default function Page() {
  const selectedAgent = useStore(currentAgent);

  // Array unificado que guarda TODAS as mensagens em ordem cronológica
  const [allMessages, setAllMessages] = useState<(UIMessage & { agent: string })[]>([]);

  // State para armazenar dados pendentes de análise
  const [pendingAnalysisData, setPendingAnalysisData] = useState<string | null>(null);

  // State para controlar o modo de visualização
  const [viewMode, setViewMode] = useState<'chat' | 'split' | 'dashboard'>('chat');

  // Helper function to get API URL based on agent
  const getApiUrl = (agent: string) => {
    switch (agent) {
      case 'nexus': return '/api/chat-ui';
      case 'teste': return '/api/teste';
      case 'claudeAgent': return '/api/claudeAgents/simple';
      case 'shopifyAnalyst': return '/api/agents/shopify-analyst';
      case 'metaAnalyst': return '/api/agents/meta-analyst';
      case 'googleAnalyticsAnalyst': return '/api/agents/google-analytics-analyst';
      case 'amazonAdsAnalyst': return '/api/agents/amazon-ads-analyst';
      case 'contaAzulAnalyst': return '/api/agents/conta-azul-analyst';
      case 'shopeeAnalyst': return '/api/agents/shopee-analyst';
      case 'keywordAnalyst': return '/api/agents/keyword-analyst';
      case 'googleCampaignAnalyst': return '/api/agents/google-campaign-analyst';
      case 'metaCampaignAnalyst': return '/api/agents/meta-campaign-analyst';
      case 'metaCreativeAnalyst': return '/api/agents/meta-creative-analyst';
      case 'performanceAgent': return '/api/workflows/performance';
      case 'productAgent': return '/api/workflows/products';
      case 'analistaDados': return '/api/agents/analista-dados';
      case 'salesAgent': return '/api/claudeAgents/sales';
      case 'rhAgent': return '/api/claudeAgents/rh';
      case 'serviceOrdersAgent': return '/api/claudeAgents/service-orders';
      case 'contasAReceberAgent': return '/api/claudeAgents/contas-a-receber';
      case 'receiptsAgent': return '/api/claudeAgents/receipts';
      case 'nfeAgent': return '/api/claudeAgents/nfe';
      case 'inventoryAgent': return '/api/claudeAgents/inventory';
      case 'contasAPagarAgent': return '/api/claudeAgents/contas-a-pagar';
      case 'fluxoCaixaAgent': return '/api/claudeAgents/fluxo-caixa';
      default: return '/api/agents/shopify-analyst';
    }
  };

  // Dynamic useChat hook that changes API based on selectedAgent
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: getApiUrl(selectedAgent) }),
    id: selectedAgent,
    onFinish: ({ message }) => {
      console.log(`${selectedAgent.toUpperCase()} terminou:`, message);
      setAllMessages(prev => [...prev, { ...message, agent: selectedAgent }]);
    },
  });

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
          
          // Exact match for regular messages
          if (existingText === msgText) return true;
          
          // Special case: if existing is data summary and incoming is data analysis
          if (existingText?.includes('[+') && existingText?.includes('linhas de dados]') && 
              msgText?.includes('Analise esses dados da query SQL')) {
            return true; // Filter out the detailed message, keep the summary
          }
          
          if (existingText?.includes('📄 SQL_Results.json') && 
              msgText?.includes('Analise este arquivo JSON')) {
            return true; // Filter out the detailed message, keep the summary
          }
          
          return false;
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
      
      // Separate display text from AI data
      let displayText = input;
      let messageForAI = input;
      
      // Check if there's data attachment pattern
      if (input.includes('[+') && input.includes('linhas de dados]')) {
        // Keep display text as is - maintain the summary version
        displayText = input;
        
        // Use pending data for AI if available
        if (pendingAnalysisData) {
          messageForAI = pendingAnalysisData;
        }
      }
      
      // Add message to chat display (always use displayText for what user sees)
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: displayText }], // User sees clean/summary version
        agent: selectedAgent
      };
      setAllMessages(prev => [...prev, userMessage]);
      
      // Send complete data to AI (messageForAI contains full data when needed)
      sendMessage({ text: messageForAI });
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

      if (event.data.type === 'SEND_JSON_TO_CHAT') {
        console.log('📄 Received SEND_JSON_TO_CHAT message:', event.data);
        const { data, displayText, fileName, query } = event.data;
        
        if (data && Array.isArray(data) && data.length > 0) {
          // Set the display text in the input
          setInput(displayText);
          
          // Prepare full analysis message for AI with JSON format
          const analysisMessage = `Analise este arquivo JSON com dados da query SQL: "${query || 'Dados da tabela SQL'}"\n\nArquivo: ${fileName || 'SQL_Results.json'}\nRegistros: ${data.length}\n\nConteúdo:\n${JSON.stringify(data, null, 2)}`;
          
          // Store the full data for when user submits
          setPendingAnalysisData(analysisMessage);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedAgent]);

  // Componente Header reutilizável
  const ViewModeHeader = ({ mode }: { mode: 'chat' | 'split' }) => (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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

      {/* View Mode Dropdown */}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors">
              {mode === 'chat' ? (
                <>
                  <MessageSquare className="w-4 h-4" /> Chat
                </>
              ) : (
                <>
                  <Layout className="w-4 h-4" /> Workspace
                </>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewMode('chat')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewMode('split')}>
              <Layout className="w-4 h-4 mr-2" />
              Workspace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewMode('dashboard')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );

  // Renderiza ChatContainer ÚNICO - nunca é desmontado
  const renderChatContainer = () => (
    <ChatContainer
      messages={displayedMessages}
      input={input}
      setInput={setInput}
      onSubmit={handleSubmit}
      status={status}
      selectedAgent={selectedAgent}
      onAgentChange={setCurrentAgent}
    />
  );

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{backgroundColor: 'white'}}>
          {viewMode === 'chat' && (
            // Modo Chat Only - Header + ChatContainer
            <div className="flex flex-col h-full w-full">
              <ViewModeHeader mode="chat" />
              <div className="flex-1 overflow-hidden p-4" data-page="nexus">
                <div className="mx-auto w-full max-w-5xl h-full">
                  {renderChatContainer()}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'split' && (
            // Modo Split - Header + Chat | Dashboard
            <PanelGroup direction="horizontal">
              {/* Coluna Esquerda: Header + Chat */}
              <Panel defaultSize={33} minSize={25}>
                <div className="flex flex-col h-full">
                  <ViewModeHeader mode="split" />
                  {/* Chat Container */}
                  <div className="flex-1 overflow-hidden p-4" data-page="nexus">
                    {renderChatContainer()}
                  </div>
                </div>
              </Panel>

              {/* Coluna Direita: Dashboard altura completa */}
              <Panel defaultSize={67} minSize={40}>
                <div className="h-full">
                  <DashboardChatPanel />
                </div>
              </Panel>
            </PanelGroup>
          )}

          {viewMode === 'dashboard' && (
            // Modo Dashboard Only - Tela inteira
            <div className="h-full w-full">
              <DashboardChatPanel />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
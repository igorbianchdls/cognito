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
import NexusPageContainer from '@/components/nexus/NexusPageContainer';
import DashboardChatPanel from '../../components/nexus/DashboardChatPanel';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { UIMessage } from 'ai';
import { currentAgent, setCurrentAgent } from '../../stores/nexus/agentStore';
import { currentWorkflow } from '../../stores/nexus/workflowStore';
import type { AttachedFile } from '../../components/nexus/FileAttachmentPreview';
import NexusHeader from '@/components/nexus/NexusHeader';

export default function Page() {
  const selectedAgent = useStore(currentAgent);
  const selectedWorkflow = useStore(currentWorkflow);

  // Se há workflow selecionado, use ele. Caso contrário, use o agent. Se ambos null, fallback para salesAgent
  const activeAgentOrWorkflow = selectedWorkflow || selectedAgent || 'salesAgent';

  // Array unificado que guarda TODAS as mensagens em ordem cronológica
  const [allMessages, setAllMessages] = useState<(UIMessage & { agent: string })[]>([]);

  // State para armazenar dados pendentes de análise
  const [pendingAnalysisData, setPendingAnalysisData] = useState<string | null>(null);

  // State para controlar o modo de visualização
  const [viewMode, setViewMode] = useState<'chat' | 'split' | 'dashboard'>('chat');

  // Helper function to get API URL based on agent or workflow
  const getApiUrl = (agentOrWorkflow: string) => {
    switch (agentOrWorkflow) {
      // Agents
      case 'salesAgent': return '/api/claudeAgents/sales';
      case 'contasAReceberAgent': return '/api/claudeAgents/contas-a-receber';
      case 'inventoryAgent': return '/api/claudeAgents/inventory';
      case 'ecommerceSalesAgentV2': return '/api/claudeAgents/ecommerce-sales-v2';
      case 'webAnalyticsAgent': return '/api/claudeAgents/web-analytics';
      case 'logisticsAgent': return '/api/claudeAgents/logistics';
      case 'crmAgent': return '/api/claudeAgents/crm';
      case 'paidTrafficAgent': return '/api/claudeAgents/paid-traffic';
      case 'organicMarketingAgent': return '/api/claudeAgents/organic-marketing';
      case 'gestorDeComprasAgent': return '/api/claudeAgents/gestor-de-compras';
      case 'gestorDeProjetosAgent': return '/api/claudeAgents/gestor-de-projetos';
      case 'gestorDeServicosAgent': return '/api/claudeAgents/gestor-de-servicos';
      case 'funcionariosAgent': return '/api/claudeAgents/funcionarios';
      case 'gestorDeVendasB2BAgent': return '/api/claudeAgents/gestor-de-vendas-b2b';
      case 'contabilidadeAgent': return '/api/claudeAgents/contabilidade';
      case 'analistaVendas': return '/api/claudeAgents/analista-vendas';
      // Workflows
      case 'contas-a-pagar': return '/api/workflows/contas-a-pagar';
      case 'contas-a-receber': return '/api/workflows/contas-a-receber';
      case 'pagamento-efetuado': return '/api/workflows/pagamento-efetuado';
      case 'pagamento-recebido': return '/api/workflows/pagamento-recebido';
      case 'criador-de-dashboard': return '/api/workflows/criador-de-dashboard';
      default: return '/api/claudeAgents/sales';
    }
  };

  // Dynamic useChat hook that changes API based on active agent/workflow
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: getApiUrl(activeAgentOrWorkflow) }),
    id: activeAgentOrWorkflow,
    onFinish: ({ message }) => {
      console.log(`${activeAgentOrWorkflow.toUpperCase()} terminou:`, message);
      setAllMessages(prev => [...prev, { ...message, agent: activeAgentOrWorkflow }]);
    },
    onError: (error) => {
      try {
        const text = (error && (error as Error).message) ? (error as Error).message : String(error);
        console.error('🚨 Nexus chat error:', error);
        const assistantErrorMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          parts: [{ type: 'text' as const, text: `Erro (${activeAgentOrWorkflow}): ${text}` }],
          agent: activeAgentOrWorkflow,
        };
        setAllMessages(prev => [...prev, assistantErrorMessage]);
      } catch (e) {
        console.error('🚨 Failed to report error to chat UI:', e);
      }
    },
  });

  // Combinar histórico + streaming atual (sem duplicatas)
  const displayedMessages = [
    ...allMessages,
    ...messages.filter(msg => {
      // Para mensagens do usuário: só mostrar se não existe no allMessages
      if (msg.role === 'user') {
        return !allMessages.some(existing => {
          if (existing.role !== 'user' || existing.agent !== activeAgentOrWorkflow) return false;
          
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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  
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
      console.log('Enviando mensagem via:', activeAgentOrWorkflow);
      
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
      
      // Prepare file parts if there are attached files
      const fileParts = attachedFiles.map(file => ({
        type: 'file' as const,
        mediaType: file.type,
        url: file.dataUrl,
      }));

      // Add message to chat display with files included
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        parts: [
          { type: 'text' as const, text: displayText },
          ...fileParts  // Include file parts in display
        ],
        agent: activeAgentOrWorkflow
      };
      setAllMessages(prev => [...prev, userMessage]);

      // Send to AI with optional file attachments (multiple files support)
      if (attachedFiles.length > 0) {
        const textPart = { type: 'text' as const, text: messageForAI };

        sendMessage({
          role: 'user',
          parts: [textPart, ...fileParts],
        });
      } else {
        sendMessage({ text: messageForAI });
      }
      setInput('');
      setAttachedFiles([]);
      
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
      agent: activeAgentOrWorkflow
    };

    // Adicionar mensagem resumida visível ao chat
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: displayMessage }],
      agent: activeAgentOrWorkflow
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

      if (event.data.type === 'SET_CHAT_INPUT') {
        try {
          const text: unknown = event.data.text;
          if (typeof text === 'string' && text.trim().length > 0) {
            setInput(text);
          }
        } catch (e) {
          console.error('Failed to set chat input from message:', e);
        }
      }

      // (removido: handler específico de paid-traffic para evitar acoplamento na página /nexus)
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeAgentOrWorkflow]);

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          {viewMode === 'chat' && (
            // Modo Chat Only - Header + ChatContainer
            <div className="flex flex-col h-full w-full">
              <NexusHeader viewMode={viewMode} onChangeViewMode={setViewMode} borderless />

              <div className="flex-1 min-h-0" data-page="nexus">
                <NexusPageContainer className="h-full">
                  <div className="mx-auto w-full max-w-5xl h-full">
                    <ChatContainer
                      messages={displayedMessages}
                      input={input}
                      setInput={setInput}
                      onSubmit={handleSubmit}
                      status={status}
                      selectedAgent={selectedAgent}
                      onAgentChange={setCurrentAgent}
                      attachedFiles={attachedFiles}
                      onFilesChange={setAttachedFiles}
                    />
                  </div>
                </NexusPageContainer>
              </div>
            </div>
          )}

          {viewMode === 'split' && (
            // Modo Split - Header global + Workspaces lado a lado
            <div className="flex flex-col h-full w-full">
              <NexusHeader viewMode={viewMode} onChangeViewMode={setViewMode} borderless />
              <div className="flex-1 min-h-0">
                <NexusPageContainer className="h-full">
                  <PanelGroup direction="horizontal">
                  {/* Coluna Esquerda: Chat */}
                  <Panel defaultSize={33} minSize={25}>
                    <div className="h-full overflow-hidden" data-page="nexus">
                      <ChatContainer
                        messages={displayedMessages}
                        input={input}
                        setInput={setInput}
                        onSubmit={handleSubmit}
                        status={status}
                        selectedAgent={selectedAgent}
                        onAgentChange={setCurrentAgent}
                        attachedFiles={attachedFiles}
                        onFilesChange={setAttachedFiles}
                      />
                    </div>
                  </Panel>

                  {/* Coluna Direita: Dashboard altura completa */}
                  <Panel defaultSize={67} minSize={40}>
                    <div className="h-full">
                      <DashboardChatPanel />
                    </div>
                  </Panel>
                </PanelGroup>
                </NexusPageContainer>
              </div>
            </div>
          )}

          {viewMode === 'dashboard' && (
            // Modo Dashboard Only - Header + Tela inteira
            <div className="flex flex-col h-full w-full">
              <NexusHeader viewMode={viewMode} onChangeViewMode={setViewMode} borderless />
              <div className="flex-1 min-h-0">
                <NexusPageContainer className="h-full">
                  <DashboardChatPanel />
                </NexusPageContainer>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

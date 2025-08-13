'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent, useEffect, useMemo } from 'react';
import ChatContainer from '@/components/nexus/ChatContainer';
import type { UIMessage } from 'ai';

export default function Home() {
  // Estado para o agente atual e mensagens salvas
  const [currentAgent, setCurrentAgent] = useState<string>('nexus');
  const [savedMessages, setSavedMessages] = useState<UIMessage[]>([]);
  
  console.log('🔍 [page.tsx] currentAgent inicial:', currentAgent);
  
  const apiEndpoint = currentAgent === 'nexus' ? '/api/chat-ui' : '/api/meta-analyst';
  console.log('🔍 [page.tsx] apiEndpoint calculado:', apiEndpoint);
  
  // Recria transport quando currentAgent muda
  const transport = useMemo(() => {
    console.log('🔄 [page.tsx] Criando novo transport para:', apiEndpoint);
    return new DefaultChatTransport({
      api: apiEndpoint,
    });
  }, [apiEndpoint]);
  
  const { messages, sendMessage, status } = useChat({
    initialMessages: savedMessages, // Preserva mensagens anteriores
    transport,
  });
  const [input, setInput] = useState('');
  
  // Salva mensagens quando mudarem
  useEffect(() => {
    console.log('💾 [page.tsx] Salvando mensagens no estado:', messages.length);
    setSavedMessages(messages);
  }, [messages]);
  
  // Salvar estado no localStorage
  useEffect(() => {
    console.log('💾 [page.tsx] Saving to localStorage:', { agent: currentAgent, messagesCount: messages.length });
    localStorage.setItem('chat-state', JSON.stringify({
      agent: currentAgent,
      messages: messages
    }));
  }, [messages, currentAgent]);
  
  // Carregar estado do localStorage
  useEffect(() => {
    console.log('📂 [page.tsx] useEffect carregar localStorage executado');
    const savedState = localStorage.getItem('chat-state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      console.log('📂 [page.tsx] Loaded from localStorage:', { agent: parsed.agent, messagesCount: parsed.messages?.length || 0 });
      console.log('📂 [page.tsx] Mudando currentAgent de', currentAgent, 'para', parsed.agent || 'nexus');
      setCurrentAgent(parsed.agent || 'nexus');
    } else {
      console.log('📂 [page.tsx] Nenhum estado salvo encontrado');
    }
  }, []);
  
  // Callback para mudança de agente
  const handleAgentChange = (agent: string) => {
    console.log('🔄 [page.tsx] handleAgentChange chamado. Mudando de', currentAgent, 'para', agent);
    console.log('🔄 [page.tsx] Salvando', messages.length, 'mensagens antes da troca');
    setSavedMessages(messages); // Salva mensagens atuais
    setCurrentAgent(agent);     // Troca agente (re-cria useChat)
    console.log('🔄 [page.tsx] setCurrentAgent executado');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div style={{ marginLeft: '24%', marginRight: '25%' }}>
      <ChatContainer
        messages={messages}
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        status={status}
        currentAgent={currentAgent}
        onAgentChange={handleAgentChange}
      />
    </div>
  );
}
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent, useEffect, useMemo } from 'react';
import ChatContainer from '../../components/nexus/ChatContainer';
import type { UIMessage } from 'ai';

export default function Page() {
  // Estado para o agente atual e mensagens salvas
  const [currentAgent, setCurrentAgent] = useState<string>('nexus');
  const [savedMessages, setSavedMessages] = useState<UIMessage[]>([]);
  
  // Recria transport quando currentAgent muda
  const transport = useMemo(() => {
    const apiEndpoint = currentAgent === 'nexus' ? '/api/chat-ui' : '/api/meta-analyst';
    console.log('🔄 [nexus/page.tsx] Criando novo transport para:', apiEndpoint);
    return new DefaultChatTransport({
      api: apiEndpoint,
    });
  }, [currentAgent]);
  
  const { messages, sendMessage, status } = useChat({
    transport,
  });
  const [input, setInput] = useState('');
  
  // Salva mensagens quando mudarem
  useEffect(() => {
    setSavedMessages(messages);
  }, [messages]);
  
  // Salvar estado no localStorage
  useEffect(() => {
    console.log('Saving to localStorage:', { agent: currentAgent, messagesCount: messages.length });
    localStorage.setItem('chat-state', JSON.stringify({
      agent: currentAgent,
      messages: messages
    }));
  }, [messages, currentAgent]);
  
  // Carregar estado do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('chat-state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      console.log('Loaded from localStorage:', { agent: parsed.agent, messagesCount: parsed.messages?.length || 0 });
      setCurrentAgent(parsed.agent || 'nexus');
    }
  }, []);
  
  // Callback para mudança de agente
  const handleAgentChange = (agent: string) => {
    console.log('Agent changed to:', agent);
    setSavedMessages(messages); // Salva mensagens atuais
    setCurrentAgent(agent);     // Troca agente (re-cria useChat)
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div style={{ marginLeft: '25%', marginRight: '25%' }}>
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
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent, useEffect, useMemo } from 'react';
import ChatContainer from '../../components/nexus/ChatContainer';
import type { UIMessage } from 'ai';

export default function Page() {
  // Estado para o agente atual
  const [currentAgent, setCurrentAgent] = useState<string>('nexus');
  
  // Recria transport quando currentAgent muda
  const transport = useMemo(() => {
    const apiEndpoint = currentAgent === 'nexus' ? '/api/chat-ui' : '/api/meta-analyst';
    console.log('🔄 [nexus/useMemo] EXECUTANDO! currentAgent:', currentAgent);
    console.log('🔄 [nexus/useMemo] EXECUTANDO! transport para:', apiEndpoint);
    
    const newTransport = new DefaultChatTransport({
      api: apiEndpoint,
    });
    
    console.log('🔄 [nexus/useMemo] TRANSPORT CRIADO:', newTransport);
    console.log('🔄 [nexus/useMemo] TRANSPORT.api:', newTransport);
    
    return newTransport;
  }, [currentAgent]);
  
  console.log('🔄 [nexus/useChat] Recebendo transport:', transport);
  const { messages, sendMessage, status } = useChat({
    transport,
  });
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
  
  // Callback para mudança de agente
  const handleAgentChange = (agent: string) => {
    console.log('Agent changed to:', agent);
    setCurrentAgent(agent); // Força re-criação do componente
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
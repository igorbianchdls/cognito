'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent, useEffect } from 'react';
import ChatContainer from '@/components/nexus/ChatContainer';

export default function Home() {
  // Estado para o agente atual
  const [currentAgent, setCurrentAgent] = useState<string>('nexus');
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: currentAgent === 'nexus' ? '/api/chat-ui' : '/api/meta-analyst',
    }),
  });
  const [input, setInput] = useState('');
  
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
    setCurrentAgent(agent);
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
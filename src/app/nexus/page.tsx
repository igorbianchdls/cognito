'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import ChatContainer from '../../components/nexus/ChatContainer';
import type { UIMessage } from 'ai';
import { currentAgent } from '@/stores/agentStore';

export default function Page() {
  // Usar o nanostore como fonte única de verdade
  const selectedAgent = useStore(currentAgent);
  
  // DEBUG: Log detalhado do estado atual
  console.log('🔄 [nexus/Page] Component montado para agente:', selectedAgent);
  console.log('🎯 [nexus/Page] typeof selectedAgent:', typeof selectedAgent);
  console.log('🎯 [nexus/Page] currentAgent store value:', currentAgent.get());
  
  // Single useChat - será recriado quando key muda
  const apiEndpoint = selectedAgent === 'nexus' ? '/api/chat-ui' : '/api/meta-analyst';
  console.log('🔄 [nexus/useChat] Criando para API:', apiEndpoint);
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: apiEndpoint }),
    id: selectedAgent,
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
      />
    </div>
  );
}
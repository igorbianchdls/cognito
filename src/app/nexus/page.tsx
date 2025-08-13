'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent } from 'react';
import ChatContainer from '../../components/nexus/ChatContainer';
import type { UIMessage } from 'ai';

export default function Page() {
  // Estado local em vez de nanostore
  const [selectedAgent, setSelectedAgent] = useState('teste');
  
  // DEBUG: Log detalhado do estado atual
  console.log('🔄 [nexus/Page] Component montado para agente:', selectedAgent);
  
  // Chats separados para cada agente - IDs únicos
  const chats = {
    nexus: useChat({ 
      transport: new DefaultChatTransport({ api: '/api/chat-ui' }), 
      id: 'nexus-chat'
    }),
    teste: useChat({ 
      transport: new DefaultChatTransport({ api: '/api/teste' }), 
      id: 'teste-chat'
    }),
  };
  
  // Usa o chat do agente selecionado
  const { messages, sendMessage, status } = chats[selectedAgent === 'nexus' ? 'nexus' : 'teste'];
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
      console.log('🔄 [nexus/handleSubmit] Enviando mensagem via:', selectedAgent);
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
        selectedAgent={selectedAgent}
        onAgentChange={(newAgent) => {
          console.log('🔄 [nexus/Page] Trocando agente de', selectedAgent, 'para', newAgent);
          setSelectedAgent(newAgent);
        }}
      />
    </div>
  );
}
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import ChatContainer from '@/components/nexus/ChatContainer';
import { currentAgent as agentStore, setCurrentAgent } from '@/stores/nexus/agentStore';

export default function Home() {
  // Estado global do agente via nanostore
  const agent = useStore(agentStore);
  const [selectedAgent, setSelectedAgent] = useState<string | null>('nexus');
  
  console.log('🔍 [page.tsx] agent do nanostore:', agent);
  
  // Recria transport quando agent do nanostore muda
  const transport = useMemo(() => {
    const apiEndpoint = agent === 'nexus' ? '/api/chat-ui' : '/api/meta-analyst';
    console.log('🔄 [useMemo] EXECUTANDO! agent:', agent);
    console.log('🔄 [useMemo] EXECUTANDO! transport para:', apiEndpoint);
    
    const newTransport = new DefaultChatTransport({
      api: apiEndpoint,
    });
    
    console.log('🔄 [useMemo] TRANSPORT CRIADO:', newTransport);
    
    return newTransport;
  }, [agent]);
  
  console.log('🔄 [useChat] Recebendo transport:', transport);
  const { messages, sendMessage, status } = useChat({
    transport,
  });
  const [input, setInput] = useState('');
  
  
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
        selectedAgent={selectedAgent}
        onAgentChange={setSelectedAgent}
      />
    </div>
  );
}
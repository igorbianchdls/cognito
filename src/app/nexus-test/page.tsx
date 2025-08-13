'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent, useMemo } from 'react';
import ChatContainer from '../../components/nexus/ChatContainer';
import type { UIMessage } from 'ai';

export default function NexusTestPage() {
  console.log('🧪 [NEXUS-TEST] PÁGINA CARREGADA! MetaAnalyst FORÇADO!');
  
  // FORÇA MetaAnalyst - sem nanostore, sem troca
  const forcedAgent = 'meta-analyst';
  
  // Transport SEMPRE para meta-analyst
  const transport = useMemo(() => {
    const apiEndpoint = '/api/meta-analyst';
    console.log('🧪 [NEXUS-TEST] CRIANDO TRANSPORT:', apiEndpoint);
    console.log('🧪 [NEXUS-TEST] Agent forçado:', forcedAgent);
    
    const newTransport = new DefaultChatTransport({
      api: apiEndpoint,
    });
    
    console.log('🧪 [NEXUS-TEST] TRANSPORT CRIADO:', newTransport);
    return newTransport;
  }, []); // Sem dependências - sempre meta-analyst
  
  console.log('🧪 [NEXUS-TEST] useChat inicializando com transport:', transport);
  const { messages, sendMessage, status } = useChat({
    transport,
  });
  
  const [input, setInput] = useState('');
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      console.log('🧪 [NEXUS-TEST] ENVIANDO MENSAGEM:', input);
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div style={{ marginLeft: '25%', marginRight: '25%', backgroundColor: '#f0f8ff' }}>
      <div style={{ 
        padding: '20px', 
        background: 'linear-gradient(90deg, #4CAF50, #2196F3)',
        color: 'white',
        textAlign: 'center',
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h1>🧪 NEXUS TEST - MetaAnalyst ONLY</h1>
        <p>Esta página FORÇA o uso do MetaAnalyst - /api/meta-analyst</p>
        <p>Agent: <strong>{forcedAgent}</strong></p>
      </div>
      
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
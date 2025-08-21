'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, FormEvent } from 'react';
import { useStore } from '@nanostores/react';
import ChatContainer from '../../components/nexus/ChatContainer';
import type { UIMessage } from 'ai';
import { currentAgent, setCurrentAgent } from '../../stores/agentStore';

export default function Page() {
  const selectedAgent = useStore(currentAgent);
  
  // Estado que guarda TODAS as mensagens globalmente
  const [globalMessages, setGlobalMessages] = useState<UIMessage[]>([]);

  const chats = {
    nexus: useChat({
      transport: new DefaultChatTransport({ api: '/api/chat-ui' }),
      id: 'nexus-chat',
      onFinish: ({ message }) => {
        console.log('🔵 [NEXUS AI] Mensagem antes timestamp:', message);
        // Adicionar timestamp para ordenação cronológica
        const timestamp = Date.now();
        (message as UIMessage & { timestamp?: number }).timestamp = timestamp;
        console.log('🔵 [NEXUS AI] Timestamp adicionado:', timestamp, message);
      },
    }),
    teste: useChat({
      transport: new DefaultChatTransport({ api: '/api/teste' }),
      id: 'teste-chat',
      onFinish: ({ message }) => {
        console.log('🟢 [TESTE AI] Mensagem antes timestamp:', message);
        // Adicionar timestamp para ordenação cronológica
        const timestamp = Date.now();
        (message as UIMessage & { timestamp?: number }).timestamp = timestamp;
        console.log('🟢 [TESTE AI] Timestamp adicionado:', timestamp, message);
      },
    }),
  };

  // Escolhe qual hook vai enviar a próxima mensagem
  const { sendMessage, status } = chats[selectedAgent === 'nexus' ? 'nexus' : 'teste'];

  // Combina mensagens em ordem cronológica (última mensagem por último)
  const displayedMessages: UIMessage[] = Object.keys(chats)
    .flatMap(key => 
      chats[key as keyof typeof chats].messages.map(msg => ({
        ...msg,           // preserva todas propriedades originais
        agent: key        // adiciona agent baseado no chat (nexus/teste)
      }))
    )
    .sort((a, b) => {
      // Ordena por timestamp (cronológico)
      const timestampA = (a as UIMessage & { timestamp?: number }).timestamp || 0;
      const timestampB = (b as UIMessage & { timestamp?: number }).timestamp || 0;
      console.log('🔄 [SORT] Comparando:', {
        msgA: { id: a.id, role: a.role, timestamp: timestampA },
        msgB: { id: b.id, role: b.role, timestamp: timestampB },
        result: timestampA - timestampB
      });
      return timestampA - timestampB;
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
      console.log('Enviando mensagem via:', selectedAgent);
      
      // Adicionar timestamp para ordenação cronológica
      const messageWithTimestamp = { 
        text: input, 
        timestamp: Date.now() 
      };
      console.log('📤 [USER] Enviando mensagem com timestamp:', messageWithTimestamp);
      sendMessage(messageWithTimestamp);
      
      setInput('');
    }
  };

  return (
    <div style={{ marginLeft: '25%', marginRight: '25%' }}>
      <ChatContainer
        messages={displayedMessages}
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        status={status}
        selectedAgent={selectedAgent}
        onAgentChange={setCurrentAgent}
      />
    </div>
  );
}
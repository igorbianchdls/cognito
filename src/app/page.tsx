'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useState, FormEvent, useMemo, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import ChatContainer from '@/components/navigation/nexus/ChatContainer';
import { currentAgent as agentStore } from '@/stores/nexus/agentStore';
import type { AttachedFile } from '@/components/navigation/nexus/FileAttachmentPreview';

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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Persistência simples em localStorage
  type PersistedSession = {
    version: number;
    messages: UIMessage[];
    input: string;
    selectedAgent: string | null;
    updatedAt: number;
  }
  const LS_KEY = 'nexus:chat:session:v1';
  const [persistedMessages, setPersistedMessages] = useState<UIMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<number | null>(null);

  // Hidratar do localStorage na montagem
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY) : null;
      if (raw) {
        const data = JSON.parse(raw) as PersistedSession;
        if (data && Array.isArray(data.messages)) {
          setPersistedMessages(data.messages);
        }
        if (typeof data?.input === 'string') setInput(data.input);
        if (typeof data?.selectedAgent !== 'undefined') setSelectedAgent(data.selectedAgent);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Escolhe qual lista de mensagens exibir: hook ou persistida
  const viewMessages: UIMessage[] = (messages && messages.length > 0) ? messages : persistedMessages;

  // Persistir com debounce quando algo relevante muda
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: PersistedSession = {
      version: 1,
      messages: viewMessages,
      input,
      selectedAgent,
      updatedAt: Date.now(),
    };
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try { window.localStorage.setItem(LS_KEY, JSON.stringify(payload)); } catch {}
    }, 400) as unknown as number;
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [viewMessages, input, selectedAgent]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Prepare file parts if there are attached files
      const fileParts = attachedFiles.map(file => ({
        type: 'file' as const,
        mediaType: file.type,
        url: file.dataUrl,
      }));

      // Send to AI with optional file attachments (multiple files support)
      if (attachedFiles.length > 0) {
        const textPart = { type: 'text' as const, text: input };

        sendMessage({
          role: 'user',
          parts: [textPart, ...fileParts],
        });
      } else {
        sendMessage({ text: input });
      }
      setInput('');
      setAttachedFiles([]);
    }
  };

  return (
    <div style={{ marginLeft: '24%', marginRight: '25%' }}>
      <ChatContainer
        messages={viewMessages}
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        status={status}
        selectedAgent={selectedAgent}
        onAgentChange={setSelectedAgent}
        attachedFiles={attachedFiles}
        onFilesChange={setAttachedFiles}
      />
    </div>
  );
}

"use client";

import { useState, FormEvent, useMemo, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ChatContainer from "@/components/navigation/nexus/ChatContainer";
import type { AttachedFile } from "@/components/navigation/nexus/FileAttachmentPreview";

export default function VisualBuilderChat() {
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>("criador-de-dashboard");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const api = useMemo(() => {
    // Use o workflow criador-de-dashboard como backend padrão
    return "/api/workflows/criador-de-dashboard";
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api }),
    id: "vb-chat",
  });

  // Listen to apply-patch submit events coming from UI cards
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin && event.origin !== 'null') return;
      if (event.data && event.data.type === 'SEND_TO_CHAT_AND_SUBMIT') {
        try {
          const text: unknown = event.data.text;
          if (typeof text === 'string' && text.trim().length > 0) {
            sendMessage({ text });
            setInput('');
          }
        } catch (e) {
          console.error('VisualBuilderChat: failed to handle SEND_TO_CHAT_AND_SUBMIT', e);
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sendMessage]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    // Envia mensagem seguindo o padrão do Nexus (/nexus):
    // - quando há anexos, usamos parts com texto + arquivos
    // - caso contrário, usamos a forma simplificada com text
    if (attachedFiles.length > 0) {
      const textPart = { type: 'text' as const, text: trimmed };
      const fileParts = attachedFiles.map((file) => ({
        type: 'file' as const,
        mediaType: file.type,
        url: file.dataUrl,
      }));

      await sendMessage({
        role: 'user',
        parts: [textPart, ...fileParts],
      });
      setAttachedFiles([]);
    } else {
      await sendMessage({ text: trimmed });
    }
    setInput("");
  };

  return (
    <div className="h-full bg-white border-l border-gray-200">
      <ChatContainer
        messages={messages as UIMessage[]}
        input={input}
        setInput={setInput}
        onSubmit={onSubmit}
        status={status}
        selectedAgent={selectedAgent}
        onAgentChange={setSelectedAgent}
        attachedFiles={attachedFiles}
        onFilesChange={setAttachedFiles}
      />
    </div>
  );
}

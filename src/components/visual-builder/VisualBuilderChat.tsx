"use client";

import { useState, FormEvent, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ChatContainer from "@/components/nexus/ChatContainer";
import type { AttachedFile } from "@/components/nexus/FileAttachmentPreview";

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    await sendMessage({
      content: trimmed,
    });
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


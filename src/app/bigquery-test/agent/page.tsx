"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { CoreMessage } from "ai";

type ChatMessage = CoreMessage; // { role: 'user' | 'assistant' | 'system'; content: string }

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string | undefined>(undefined);
  const endRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      const next = [...messages, { role: "user", content: input } as ChatMessage];
      setMessages(next);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/mastra/teste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });
        const data: unknown = await res.json();
        const obj = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
        const text = typeof obj.text === "string" ? obj.text : JSON.stringify(data);
        const modelId = typeof obj.model === "string" ? obj.model : undefined;
        setMessages((prev) => [...prev, { role: "assistant", content: text }]);
        setModel(modelId);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Falha na requisição";
        setMessages((prev) => [...prev, { role: "assistant", content: `Erro: ${msg}` }]);
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 0);
      }
    },
    [input, messages, scrollToBottom]
  );

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100dvh - 64px)" }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <h1 style={{ margin: 0 }}>Mastra Test Agent</h1>
        {model && (
          <small style={{ color: "#666" }}>model: {model}</small>
        )}
      </header>

      <div style={{ marginTop: 16, border: "1px solid #e5e5e5", borderRadius: 8, padding: 12, flex: 1, overflow: "auto" }}>
        {messages.length === 0 ? (
          <div style={{ color: "#666" }}>Envie uma mensagem para começar.</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>{m.role === "user" ? "Você" : m.role === "assistant" ? "IA" : "Sistema"}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva sua mensagem..."
          style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button type="submit" disabled={!canSend} style={{ padding: "10px 14px" }}>
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

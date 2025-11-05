"use client";

import { useCallback, useState, useRef } from "react";

type DCRResult = {
  draft: string;
  critique: string;
  final: string;
  model?: string;
};

type StreamingState = {
  draft?: string;
  critique?: string;
  final?: string;
  model?: string;
  currentStep?: "draft" | "critique" | "revise";
};

type Message = {
  role: "user" | "assistant";
  question?: string;
  result?: DCRResult;
  streaming?: StreamingState;
  error?: string;
};

export default function DCRPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || loading) return;

      const question = input.trim();
      setMessages((prev) => [...prev, { role: "user", question }]);
      setInput("");
      setLoading(true);

      // Add a streaming message placeholder
      setMessages((prev) => [...prev, { role: "assistant", streaming: {} }]);
      const streamingMessageIndex = messages.length + 1;

      try {
        const res = await fetch("/api/mastra/workflows/dcr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });

        if (!res.ok) {
          const data = await res.json();
          const errorMsg = data?.error || "Erro na requisição";
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[streamingMessageIndex] = { role: "assistant", error: errorMsg };
            return newMessages;
          });
          setLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No reader available");
        }

        const streamingState: StreamingState = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (!data.trim()) continue;

              try {
                const event = JSON.parse(data);

                if (event.type === "workflow-step-start") {
                  const stepId = event.stepId;
                  if (stepId === "draft") streamingState.currentStep = "draft";
                  else if (stepId === "critique") streamingState.currentStep = "critique";
                  else if (stepId === "revise") streamingState.currentStep = "revise";

                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[streamingMessageIndex] = {
                      role: "assistant",
                      streaming: { ...streamingState },
                    };
                    return newMessages;
                  });
                } else if (event.type === "workflow-step-finish") {
                  const stepId = event.stepId;
                  const output = event.output;

                  if (stepId === "draft" && output?.draft) {
                    streamingState.draft = output.draft;
                    streamingState.model = output.model;
                  } else if (stepId === "critique" && output?.critique) {
                    streamingState.critique = output.critique;
                  } else if (stepId === "revise" && output?.final) {
                    streamingState.final = output.final;
                  }

                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[streamingMessageIndex] = {
                      role: "assistant",
                      streaming: { ...streamingState },
                    };
                    return newMessages;
                  });
                  setTimeout(scrollToBottom, 0);
                } else if (event.type === "workflow-finish") {
                  // Convert streaming to final result
                  const result: DCRResult = {
                    draft: streamingState.draft || "",
                    critique: streamingState.critique || "",
                    final: streamingState.final || "",
                    model: streamingState.model,
                  };

                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[streamingMessageIndex] = {
                      role: "assistant",
                      result,
                    };
                    return newMessages;
                  });
                } else if (event.type === "error") {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[streamingMessageIndex] = {
                      role: "assistant",
                      error: event.error || "Erro no streaming",
                    };
                    return newMessages;
                  });
                }
              } catch (parseError) {
                console.error("Error parsing SSE data:", parseError);
              }
            }
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Falha na requisição";
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[streamingMessageIndex] = { role: "assistant", error: msg };
          return newMessages;
        });
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 0);
      }
    },
    [input, loading, messages.length, scrollToBottom]
  );

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100dvh - 64px)" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>DCR Workflow Agent</h1>
        <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: 14 }}>
          Draft → Critique → Revise workflow usando Mastra
        </p>
      </header>

      <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 16, flex: 1, overflow: "auto", backgroundColor: "#fafafa" }}>
        {messages.length === 0 ? (
          <div style={{ color: "#666", textAlign: "center", paddingTop: 32 }}>
            Faça uma pergunta para começar o workflow DCR.
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 24, backgroundColor: "white", padding: 16, borderRadius: 6, border: "1px solid #e5e5e5" }}>
              {m.role === "user" ? (
                <div>
                  <div style={{ fontSize: 12, color: "#777", marginBottom: 8, fontWeight: 600 }}>VOCÊ</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.question}</div>
                </div>
              ) : m.error ? (
                <div>
                  <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 8, fontWeight: 600 }}>ERRO</div>
                  <div style={{ color: "#dc2626" }}>{m.error}</div>
                </div>
              ) : m.streaming ? (
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "#777", fontWeight: 600 }}>ASSISTENTE</div>
                    {m.streaming.model && (
                      <div style={{ fontSize: 11, color: "#999" }}>model: {m.streaming.model}</div>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0ea5e9", marginBottom: 6 }}>
                      📝 DRAFT {m.streaming.currentStep === "draft" && !m.streaming.draft && <span style={{ fontSize: 11, color: "#999" }}>⏳ gerando...</span>}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", paddingLeft: 12, borderLeft: "3px solid #0ea5e9" }}>
                      {m.streaming.draft || ""}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b", marginBottom: 6 }}>
                      🔍 CRITIQUE {m.streaming.currentStep === "critique" && !m.streaming.critique && <span style={{ fontSize: 11, color: "#999" }}>⏳ analisando...</span>}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", paddingLeft: 12, borderLeft: "3px solid #f59e0b" }}>
                      {m.streaming.critique || ""}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#10b981", marginBottom: 6 }}>
                      ✅ FINAL ANSWER {m.streaming.currentStep === "revise" && !m.streaming.final && <span style={{ fontSize: 11, color: "#999" }}>⏳ revisando...</span>}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", paddingLeft: 12, borderLeft: "3px solid #10b981" }}>
                      {m.streaming.final || ""}
                    </div>
                  </div>
                </div>
              ) : m.result ? (
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "#777", fontWeight: 600 }}>ASSISTENTE</div>
                    {m.result.model && (
                      <div style={{ fontSize: 11, color: "#999" }}>model: {m.result.model}</div>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0ea5e9", marginBottom: 6 }}>
                      📝 DRAFT
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", paddingLeft: 12, borderLeft: "3px solid #0ea5e9" }}>
                      {m.result.draft}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b", marginBottom: 6 }}>
                      🔍 CRITIQUE
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", paddingLeft: 12, borderLeft: "3px solid #f59e0b" }}>
                      {m.result.critique}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#10b981", marginBottom: 6 }}>
                      ✅ FINAL ANSWER
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", paddingLeft: 12, borderLeft: "3px solid #10b981" }}>
                      {m.result.final}
                    </div>
                  </div>
                </div>
              ) : null}
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
          placeholder="Faça uma pergunta..."
          disabled={loading}
          style={{ flex: 1, padding: 12, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            padding: "12px 20px",
            backgroundColor: loading || !input.trim() ? "#ccc" : "#0ea5e9",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {loading ? "Processando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

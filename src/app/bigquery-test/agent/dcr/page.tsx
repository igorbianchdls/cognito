"use client";

import { useCallback, useState, useRef } from "react";

type DCRResult = {
  draft: string;
  critique: string;
  final: string;
  model?: string;
};

type Message = {
  role: "user" | "assistant";
  question?: string;
  result?: DCRResult;
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

      try {
        const res = await fetch("/api/mastra/workflows/dcr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });

        const data: unknown = await res.json();

        if (!res.ok) {
          const errorMsg = typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : "Erro na requisição";
          setMessages((prev) => [...prev, { role: "assistant", error: errorMsg }]);
        } else {
          const obj = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
          const result: DCRResult = {
            draft: typeof obj.draft === "string" ? obj.draft : "",
            critique: typeof obj.critique === "string" ? obj.critique : "",
            final: typeof obj.final === "string" ? obj.final : "",
            model: typeof obj.model === "string" ? obj.model : undefined,
          };
          setMessages((prev) => [...prev, { role: "assistant", result }]);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Falha na requisição";
        setMessages((prev) => [...prev, { role: "assistant", error: msg }]);
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 0);
      }
    },
    [input, loading, scrollToBottom]
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

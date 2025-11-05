"use client";

import { useState } from "react";

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/mastra/teste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data: unknown = await res.json();
      const obj: Record<string, unknown> =
        typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};

      const r = obj["result"];
      let text = "";
      if (typeof r === "string") {
        text = r;
      } else if (r && typeof r === "object") {
        const ro = r as Record<string, unknown>;
        if ("output" in ro) text = String(ro["output"] ?? "");
        else if ("text" in ro) text = String(ro["text"] ?? "");
        else if ("message" in ro) text = String(ro["message"] ?? "");
        else text = JSON.stringify(r);
      } else if ("error" in obj) {
        text = String(obj["error"] ?? "Erro");
      } else {
        text = JSON.stringify(data);
      }
      setOutput(text);
    } catch (e: unknown) {
      setOutput(`Erro: ${e instanceof Error ? e.message : "Falha na requisição"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1>Mastra Test Agent</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escreva seu prompt..."
          style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
        />
        <button type="submit" disabled={loading || !prompt.trim()} style={{ padding: "8px 12px" }}>
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <strong>Resposta:</strong>
        <pre style={{ whiteSpace: "pre-wrap" }}>{output}</pre>
      </div>
    </div>
  );
}

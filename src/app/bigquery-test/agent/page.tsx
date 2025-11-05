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
      const data = await res.json();
      const r = (data as any)?.result;
      let text = "";
      if (typeof r === "string") text = r;
      else if (r?.output != null) text = String(r.output);
      else if (r?.text != null) text = String(r.text);
      else if (r?.message != null) text = String(r.message);
      else text = JSON.stringify(r ?? data);
      setOutput(text);
    } catch (e: any) {
      setOutput(`Erro: ${e?.message ?? "Falha na requisição"}`);
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


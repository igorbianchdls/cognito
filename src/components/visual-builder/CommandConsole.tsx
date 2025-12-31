"use client";

import { useState, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import { parseCommands } from "./commands/CommandParser";
import { runCommands } from "./commands/CommandRunner";
import { visualBuilderActions } from "@/stores/visualBuilderStore";

type Props = {
  sourceCode: string;
};

export default function CommandConsole({ sourceCode }: Props) {
  const [text, setText] = useState<string>(`// Exemplo: cria um novo grupo e adiciona 3 KPIs nele\naddGroup({\n  \"id\": \"grp_more_kpis\",\n  \"title\": \"KPIs (mais)\",\n  \"orientation\": \"horizontal\",\n  \"sizing\": \"fr\",\n  \"colsD\": 12,\n  \"gapX\": 16,\n  \"gapY\": 16\n});\n\n// Ao omitir \"group\", os KPIs irão para o último grupo criado (grp_more_kpis)\naddKPI({\n  \"id\": \"kpi_receita_2\",\n  \"title\": \"Receita (M)\",\n  \"unit\": \"R$\",\n  \"height\": 150,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"measure\": \"item_subtotal\", \"agg\": \"SUM\" },\n  \"style\": { \"tw\": \"kpi:viz:card\" }\n});\n\naddKPI({\n  \"id\": \"kpi_ticket_medio_2\",\n  \"title\": \"Ticket Médio (M)\",\n  \"unit\": \"R$\",\n  \"height\": 150,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"measure\": \"item_subtotal\", \"agg\": \"AVG\" },\n  \"style\": { \"tw\": \"kpi:viz:card\" }\n});\n\naddKPI({\n  \"id\": \"kpi_pedidos_2\",\n  \"title\": \"Pedidos (M)\",\n  \"height\": 150,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"measure\": \"pedido_id\", \"agg\": \"COUNT\" },\n  \"style\": { \"tw\": \"kpi:viz:card\" }\n});\n`);
  const [output, setOutput] = useState<Array<{ type: "ok" | "err"; text: string }>>([]);
  const lastResultRef = useRef<string>("");

  const run = (apply: boolean) => {
    const parsed = parseCommands(text);
    const logs: Array<{ type: "ok" | "err"; text: string }> = [];
    if (parsed.errors.length > 0) {
      parsed.errors.forEach((e) => logs.push({ type: "err", text: `L${e.line}: ${e.message}` }));
      setOutput(logs);
      return;
    }
    const { nextCode, diagnostics } = runCommands(sourceCode, parsed.commands);
    diagnostics.forEach((d) => {
      logs.push({ type: d.ok ? "ok" : "err", text: `${d.line ? `L${d.line}: ` : ""}${d.message}` });
    });
    lastResultRef.current = nextCode;
    setOutput(logs);
    if (apply) {
      try { visualBuilderActions.updateCode(nextCode); } catch {}
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Command Console</h2>
        <p className="text-sm text-gray-600">Escreva comandos como addGroup(), addKPI(), addChart(), setDashboard() e clique em Executar.</p>
      </div>
      <div className="flex-1 min-h-0 grid grid-rows-[1fr_auto]">
        <div className="min-h-0">
          <Editor
            height="100%"
            language="plaintext"
            value={text}
            onChange={(v) => setText(v || "")}
            options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on", lineNumbers: "on", scrollBeyondLastLine: false }}
          />
        </div>
        <div className="border-t bg-white">
          <div className="p-3 flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={() => run(true)}>
              Executar
            </button>
            <button className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => run(false)}>
              Pré-visualizar
            </button>
            <button className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setText("")}>Limpar</button>
          </div>
          {output.length > 0 && (
            <div className="px-3 pb-3 space-y-1 max-h-40 overflow-auto">
              {output.map((o, i) => (
                <div key={i} className={`text-xs ${o.type === "ok" ? "text-green-700" : "text-red-700"}`}>{o.text}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

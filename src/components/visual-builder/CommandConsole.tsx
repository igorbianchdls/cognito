"use client";

import { useState, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import { parseCommands } from "./commands/CommandParser";
import { runCommands } from "./commands/CommandRunner";
import { visualBuilderActions } from "@/stores/visualBuilderStore";

type Props = {
  sourceCode: string;
};

const CHARTS_EXAMPLE = `

// Agora cria um novo grupo de gráficos e adiciona 3 charts nele
addGroup({
  "id": "grp_charts",
  "title": "Gráficos",
  "orientation": "horizontal",
  "sizing": "fr",
  "colsD": 12,
  "gapX": 16,
  "gapY": 16
});

addChart({
  "id": "chart_vendas_regiao",
  "title": "Vendas por Região",
  "type": "bar",
  "height": 360,
  "widthFr": "1fr",
  "data": { "schema": "vendas", "table": "vw_pedidos", "dimension": "regiao", "measure": "item_subtotal", "agg": "SUM" },
  "style": { "tw": "legend:on grid:on mb:32" }
});

addChart({
  "id": "chart_canal",
  "title": "Vendas por Canal",
  "type": "pie",
  "height": 360,
  "widthFr": "1fr",
  "data": { "schema": "vendas", "table": "vw_pedidos", "dimension": "canal_venda_nome", "measure": "item_subtotal", "agg": "SUM" },
  "style": { "tw": "legend:on grid:off mb:32" }
});

addChart({
  "id": "chart_vendedor",
  "title": "Vendas por Vendedor",
  "type": "groupedbar",
  "height": 360,
  "widthFr": "1fr",
  "data": { "schema": "vendas", "table": "vw_pedidos", "dimension": "vendedor_nome", "measure": "item_subtotal", "agg": "SUM" },
  "style": { "tw": "legend:on grid:on mb:32" }
});
\n+// Exemplo de exclusão por ID (descomente para usar)
// deleteWidget({ "id": "kpi_receita_2" });
`;

export default function CommandConsole({ sourceCode }: Props) {
  const [text, setText] = useState<string>(`// Exemplo: cria 1 grupo de KPIs e 3 KPIs, depois 1 grupo de charts e 3 charts\naddGroup({\n  \"id\": \"grp_kpis\",\n  \"title\": \"KPIs\",\n  \"orientation\": \"horizontal\",\n  \"sizing\": \"fr\",\n  \"colsD\": 12,\n  \"gapX\": 16,\n  \"gapY\": 16\n});\n\naddKPI({\n  \"id\": \"kpi_receita\",\n  \"group\": \"grp_kpis\",\n  \"title\": \"Receita\",\n  \"unit\": \"R$\",\n  \"height\": 150,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"measure\": \"item_subtotal\", \"agg\": \"SUM\" },\n  \"style\": { \"tw\": \"kpi:viz:card\" }\n});\n\naddKPI({\n  \"id\": \"kpi_ticket_medio\",\n  \"group\": \"grp_kpis\",\n  \"title\": \"Ticket Médio\",\n  \"unit\": \"R$\",\n  \"height\": 150,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"measure\": \"item_subtotal\", \"agg\": \"AVG\" },\n  \"style\": { \"tw\": \"kpi:viz:card\" }\n});\n\naddKPI({\n  \"id\": \"kpi_pedidos\",\n  \"group\": \"grp_kpis\",\n  \"title\": \"Pedidos\",\n  \"height\": 150,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"measure\": \"pedido_id\", \"agg\": \"COUNT\" },\n  \"style\": { \"tw\": \"kpi:viz:card\" }\n});\n\naddGroup({\n  \"id\": \"grp_charts\",\n  \"title\": \"Gráficos\",\n  \"orientation\": \"horizontal\",\n  \"sizing\": \"fr\",\n  \"colsD\": 12,\n  \"gapX\": 16,\n  \"gapY\": 16\n});\n\naddChart({\n  \"id\": \"chart_vendas_regiao\",\n  \"title\": \"Vendas por Região\",\n  \"type\": \"bar\",\n  \"height\": 360,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"dimension\": \"regiao\", \"measure\": \"item_subtotal\", \"agg\": \"SUM\" },\n  \"style\": { \"tw\": \"legend:on grid:on mb:32\" }\n});\n\naddChart({\n  \"id\": \"chart_canal\",\n  \"title\": \"Vendas por Canal\",\n  \"type\": \"pie\",\n  \"height\": 360,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"dimension\": \"canal_venda_nome\", \"measure\": \"item_subtotal\", \"agg\": \"SUM\" },\n  \"style\": { \"tw\": \"legend:on grid:off mb:32\" }\n});\n\naddChart({\n  \"id\": \"chart_vendedor\",\n  \"title\": \"Vendas por Vendedor\",\n  \"type\": \"groupedbar\",\n  \"height\": 360,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"dimension\": \"vendedor_nome\", \"measure\": \"item_subtotal\", \"agg\": \"SUM\" },\n  \"style\": { \"tw\": \"legend:on grid:on mb:32\" }\n});\n\n// Atualizações: muda o fundo do primeiro KPI para preto e o fundo do grupo de KPIs para preto\nupdateWidget({ \"id\": \"kpi_receita\", \"style\": { \"tw\": \"bg:#000000\" } });\nupdateGroup({ \"id\": \"grp_kpis\", \"style\": { \"backgroundColor\": \"#00ff00\" } });\n\n// Exemplo de exclusão por ID\ndeleteWidget({ \"id\": \"kpi_receita\" });\n\n// Cria outro grupo com 2 charts e remove o grupo\naddGroup({\n  \"id\": \"grp_charts_2\",\n  \"title\": \"Gráficos 2\",\n  \"orientation\": \"horizontal\",\n  \"sizing\": \"fr\",\n  \"colsD\": 12,\n  \"gapX\": 16,\n  \"gapY\": 16\n});\n\naddChart({\n  \"id\": \"chart_categoria\",\n  \"title\": \"Vendas por Categoria\",\n  \"type\": \"bar\",\n  \"height\": 320,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"dimension\": \"categoria\", \"measure\": \"item_subtotal\", \"agg\": \"SUM\" },\n  \"style\": { \"tw\": \"legend:on grid:on mb:24\" }\n});\n\naddChart({\n  \"id\": \"chart_pagamento\",\n  \"title\": \"Vendas por Pagamento\",\n  \"type\": \"pie\",\n  \"height\": 320,\n  \"widthFr\": \"1fr\",\n  \"data\": { \"schema\": \"vendas\", \"table\": \"vw_pedidos\", \"dimension\": \"forma_pagamento\", \"measure\": \"item_subtotal\", \"agg\": \"SUM\" },\n  \"style\": { \"tw\": \"legend:on grid:off mb:24\" }\n});\n\ndeleteGroupt({ \"id\": \"grp_charts_2\" });\n`);
  const [output, setOutput] = useState<Array<{ type: "ok" | "err"; text: string }>>([]);
  const lastResultRef = useRef<string>("");

  // no-op

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
        <p className="text-sm text-gray-600">Escreva comandos como addGroup(), addKPI(), addChart(), setDashboard(), updateWidget(), updateGroup(), deleteWidget(), deleteGroupt() e clique em Executar.</p>
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

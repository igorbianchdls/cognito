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

addWidget({
  "id": "chart_vendas_regiao",
  "title": "Vendas por Região",
  "type": "bar",
  "height": 360,
  "widthFr": "1fr",
  "data": { "schema": "vendas", "table": "vw_pedidos", "dimension": "regiao", "measure": "item_subtotal", "agg": "SUM" },
  "style": { "tw": "legend:on grid:on mb:32" }
});

addWidget({
  "id": "chart_canal",
  "title": "Vendas por Canal",
  "type": "pie",
  "height": 360,
  "widthFr": "1fr",
  "data": { "schema": "vendas", "table": "vw_pedidos", "dimension": "canal_venda_nome", "measure": "item_subtotal", "agg": "SUM" },
  "style": { "tw": "legend:on grid:off mb:32" }
});

addWidget({
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
  const [text, setText] = useState<string>(`// Exemplo (sintaxe inline: key: "value";)\naddGroup(id: "grp_kpis"; title: "KPIs"; orientation: "horizontal"; sizing: "fr"; colsD: 12; gapX: 16; gapY: 16;);\n\naddWidget(id: "kpi_receita"; group: "grp_kpis"; title: "Receita"; height: 150; style.tw: "kpi:viz:card"; data.schema: "vendas"; data.table: "vw_pedidos"; data.measure: "item_subtotal"; data.agg: "SUM";);\naddWidget(id: "kpi_ticket_medio"; group: "grp_kpis"; title: "Ticket Médio"; height: 150; style.tw: "kpi:viz:card"; data.schema: "vendas"; data.table: "vw_pedidos"; data.measure: "item_subtotal"; data.agg: "AVG";);\naddWidget(id: "kpi_pedidos"; group: "grp_kpis"; title: "Pedidos"; height: 150; style.tw: "kpi:viz:card"; data.schema: "vendas"; data.table: "vw_pedidos"; data.measure: "pedido_id"; data.agg: "COUNT";);\n\naddGroup(id: "grp_charts"; title: "Gráficos"; orientation: "horizontal"; sizing: "fr"; colsD: 12; gapX: 16; gapY: 16;);\naddWidget(id: "chart_vendas_regiao"; title: "Vendas por Região"; type: "bar"; height: 360; widthFr: "1fr"; data.schema: "vendas"; data.table: "vw_pedidos"; data.dimension: "regiao"; data.measure: "item_subtotal"; data.agg: "SUM"; style.tw: "legend:on grid:on mb:32";);\naddWidget(id: "chart_canal"; title: "Vendas por Canal"; type: "pie"; height: 360; widthFr: "1fr"; data.schema: "vendas"; data.table: "vw_pedidos"; data.dimension: "canal_venda_nome"; data.measure: "item_subtotal"; data.agg: "SUM"; style.tw: "legend:on grid:off mb:32";);\naddWidget(id: "chart_vendedor"; title: "Vendas por Vendedor"; type: "groupedbar"; height: 360; widthFr: "1fr"; data.schema: "vendas"; data.table: "vw_pedidos"; data.dimension: "vendedor_nome"; data.measure: "item_subtotal"; data.agg: "SUM"; style.tw: "legend:on grid:on mb:32";);\n\n// Updates: KPI fundo preto e grupo fundo verde\nupdateWidget(id: "kpi_ticket_medio"; style.tw: "bg:#000000";);\nupdateGroup(id: "grp_kpis"; style.backgroundColor: "#00ff00";);\n\n// Excluir o primeiro KPI\ndeleteWidget(id: "kpi_receita";);\n\n// Segundo grupo com 2 charts e remoção\naddGroup(id: "grp_charts_2"; title: "Gráficos 2"; orientation: "horizontal"; sizing: "fr"; colsD: 12; gapX: 16; gapY: 16;);\naddWidget(id: "chart_categoria"; title: "Vendas por Categoria"; type: "bar"; height: 320; widthFr: "1fr"; data.schema: "vendas"; data.table: "vw_pedidos"; data.dimension: "categoria"; data.measure: "item_subtotal"; data.agg: "SUM"; style.tw: "legend:on grid:on mb:24";);\naddWidget(id: "chart_pagamento"; title: "Vendas por Pagamento"; type: "pie"; height: 320; widthFr: "1fr"; data.schema: "vendas"; data.table: "vw_pedidos"; data.dimension: "forma_pagamento"; data.measure: "item_subtotal"; data.agg: "SUM"; style.tw: "legend:on grid:off mb:24";);\ndeleteGroupt(id: "grp_charts_2";);`);
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
        <p className="text-sm text-gray-600">Escreva comandos como addGroup(), addWidget(type: "kpi"|"bar"|…), setDashboard(), updateWidget(), updateGroup(), deleteWidget(), deleteGroupt() e clique em Executar.</p>
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

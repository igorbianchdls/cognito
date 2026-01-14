"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Artifact,
  ArtifactHeader,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
} from "@/components/ai-elements/artifact";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MonacoEditor from "@/components/visual-builder/MonacoEditor";
import LiquidPreviewCanvas from "@/components/visual-builder/LiquidPreviewCanvas";
import CommandConsole from "@/components/visual-builder/CommandConsole";
import type { GlobalFilters } from "@/stores/visualBuilderStore";
import { CheckIcon, CopyIcon, XIcon, Eye, Code2, Terminal, Maximize2, MoreHorizontal } from "lucide-react";
import CodeThemeMenu from "@/components/visual-builder/CodeThemeMenu";

type SimpleArtifactPanelProps = {
  onClose?: () => void;
  dashboardId?: string;
  onExpand?: () => void;
};

export default function SimpleArtifactPanel({ onClose, dashboardId, onExpand }: SimpleArtifactPanelProps) {
  const [tab, setTab] = useState<'code' | 'preview' | 'console'>('code');
  const [code, setCode] = useState<string>(() => initialArtifactLiquid);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Falha ao copiar código', e);
    }
  }, [code]);

  const defaultFilters: GlobalFilters = useMemo(() => ({ dateRange: { type: 'last_30_days' } }), []);
  const dashboardHref = useMemo(() => (dashboardId ? `/dashboards/${dashboardId}/view` : '/dashboards'), [dashboardId]);

  return (
    <Artifact className="h-full" hideTopBorder>
      <ArtifactHeader className="bg-white">
        {/* Header Left: Toggle Preview/Code/Console (igual ao builder) */}
        <div className="flex items-center">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`inline-flex items-center justify-center w-9 h-8 rounded-lg text-sm transition-colors ${
                tab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTab('code')}
              className={`ml-1 inline-flex items-center justify-center w-9 h-8 rounded-lg text-sm transition-colors ${
                tab === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Código"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTab('console')}
              className={`ml-1 inline-flex items-center justify-center w-9 h-8 rounded-lg text-sm transition-colors ${
                tab === 'console' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Console"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Header Right: Toolbar / Copiar / Publicar / Fechar */}
        <ArtifactActions className="gap-2">
          <CodeThemeMenu code={code} onChange={setCode} triggerClassName="bg-gray-100 text-gray-600 border-0 hover:bg-gray-200 hover:text-gray-900" />
          <Button
            type="button"
            onClick={handleCopy}
            className="h-8 px-3 bg-gray-100 text-gray-600 border-0 hover:bg-gray-200 hover:text-gray-900"
            variant="outline"
          >
            {copied ? <CheckIcon className="w-4 h-4 mr-1" /> : <CopyIcon className="w-4 h-4 mr-1" />}
            Copiar
          </Button>
          <a href={dashboardHref} className="inline-flex">
            <Button type="button" className="h-8 px-3 bg-gray-100 text-gray-600 border-0 hover:bg-gray-200 hover:text-gray-900" variant="outline">
              Ver Dashboard
            </Button>
          </a>
          <Button
            type="button"
            onClick={() => console.log('Publicar acionado')}
            className="h-8 px-3 bg-gray-100 text-gray-600 border-0 hover:bg-gray-200 hover:text-gray-900"
          >
            Publicar
          </Button>
          {/* Botão de opções (Tela Cheia / Fechar) com ícone neutro */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="size-8 p-0 bg-gray-100 text-gray-600 border-0 hover:bg-gray-200 hover:text-gray-900" aria-label="Opções do painel">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {onExpand && (
                <DropdownMenuItem onClick={() => onExpand?.()}>
                  <Maximize2 className="w-4 h-4 mr-2" /> Tela Cheia
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onClose}>
                <XIcon className="w-4 h-4 mr-2" /> Fechar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Removido: botão Fechar isolado; agora embutido no menu acima */}
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className="p-0">
        <div className="h-full">
          {tab === 'code' && (
            <MonacoEditor value={code} onChange={setCode} language="html" />
          )}
          {tab === 'preview' && (
            <div className="h-full overflow-auto">
              <LiquidPreviewCanvas code={code} globalFilters={defaultFilters} className="w-full" interactive onChangeCode={setCode} />
            </div>
          )}
          {tab === 'console' && (
            <div className="h-full overflow-auto">
              <CommandConsole sourceCode={code} onApply={setCode} />
            </div>
          )}
        </div>
      </ArtifactContent>
    </Artifact>
  );
}

const initialArtifactLiquid = `
<dashboard render="html" theme="branco" date-type="last_30_days">
  <div class="vb-container" style="padding: 0;">
    <header class="vb-header" style="background-color:#ffffff; border-bottom:1px solid #e5e7eb; border-top:0; border-left:0; border-right:0; border-radius:0; padding-top:10px;">
      <p style="margin:0 0 4px; margin-left:16px; font-family:Inter, system-ui, sans-serif; font-size:18px; font-weight:700; color:#111827;">Visão Geral • Exemplo Inicial</p>
      <p style="margin:0; margin-left:16px; margin-bottom:6px; font-family:Inter, system-ui, sans-serif; font-size:14px; font-weight:400; color:#6b7280;">KPIs e gráficos de exemplo — edite o código e visualize abaixo</p>
    </header>

    <!-- KPIs: Linha 1 (4 itens) -->
    <section id="kpis-1" class="row kpis" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:12px; margin-top:12px; padding:16px;">
      <article id="kpi_receita_total" class="card" data-role="kpi" style="--fr:3; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px;">
        <p style="margin:0 0 6px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Receita Total</p>
        <div class="kpi-value" style="font-family:Inter, system-ui, sans-serif; font-size:28px; font-weight:700; letter-spacing:-0.02em; color:#111827;">R$ 1.234.567</div>
      </article>
      <article id="kpi_pedidos" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px;">
        <p style="margin:0 0 6px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Pedidos</p>
        <div class="kpi-value" style="font-family:Inter, system-ui, sans-serif; font-size:28px; font-weight:700; letter-spacing:-0.02em; color:#111827;">3.456</div>
      </article>
      <article id="kpi_ticket_medio" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px;">
        <p style="margin:0 0 6px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Ticket Médio</p>
        <div class="kpi-value" style="font-family:Inter, system-ui, sans-serif; font-size:28px; font-weight:700; letter-spacing:-0.02em; color:#111827;">R$ 357,20</div>
      </article>
      <article id="kpi_novos_clientes" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px;">
        <p style="margin:0 0 6px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Novos Clientes</p>
        <div class="kpi-value" style="font-family:Inter, system-ui, sans-serif; font-size:28px; font-weight:700; letter-spacing:-0.02em; color:#111827;">128</div>
      </article>
    </section>

    <!-- KPIs: Linha 2 (2 itens) -->
    <section id="kpis-2" class="row kpis" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:12px; margin-top:12px; padding:16px;">
      <article id="kpi_conversao" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px;">
        <p style="margin:0 0 6px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Conversão</p>
        <div class="kpi-value" style="font-family:Inter, system-ui, sans-serif; font-size:28px; font-weight:700; letter-spacing:-0.02em; color:#111827;">3,4%</div>
      </article>
      <article id="kpi_itens_pedido" class="card" data-role="kpi" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px;">
        <p style="margin:0 0 6px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Itens por Pedido</p>
        <div class="kpi-value" style="font-family:Inter, system-ui, sans-serif; font-size:28px; font-weight:700; letter-spacing:-0.02em; color:#111827;">2,1</div>
      </article>
    </section>

    <!-- Gráficos: Linha 1 (2 itens) -->
    <section id="sec1" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-top:16px; padding:16px;">
      <article id="chart_exemplo" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Vendas por Categoria</p>
        <Chart id="exemplo_bar" type="bar" height="320">
          <query schema="vendas" table="pedidos" dimension="categoria" measure="SUM(subtotal)" timeDimension="data_pedido" limit="5" order="value DESC" />
        </Chart>
      </article>
      <article id="chart_linha" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Receita • Últimos Meses</p>
        <Chart id="exemplo_line" type="line" height="320">
          <query schema="vendas" table="pedidos" dimension="cidade" measure="SUM(subtotal)" timeDimension="data_pedido" limit="5" order="value DESC" />
        </Chart>
      </article>
    </section>

    <!-- Gráficos: Linha 2 (2 itens) -->
    <section id="sec2" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-top:16px; padding:16px;">
      <article id="chart_pizza" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Participação por Região</p>
        <Chart id="exemplo_pie" type="pie" height="320">
          <query schema="vendas" table="pedidos" dimension="regiao" measure="SUM(subtotal)" timeDimension="data_pedido" limit="5" order="value DESC" />
        </Chart>
      </article>
      <article id="chart_grouped" class="card" data-role="chart" style="--fr:1; flex: var(--fr, 1) 1 0%; min-width:0; background-color:#ffffff; border-color:#e5e7eb; border-width:1px; border-style:solid; border-radius:12px; padding:12px; color:#111827;">
        <p style="margin:0 0 8px; font-family:Inter, system-ui, sans-serif; font-size:16px; font-weight:600; color:#111827;">Vendas por Canal</p>
        <Chart id="exemplo_grouped" type="groupedbar" height="320">
          <query schema="vendas" table="pedidos" dimension="canal" measure="SUM(subtotal)" timeDimension="data_pedido" order="value DESC" />
        </Chart>
      </article>
    </section>
  </div>
</dashboard>`;

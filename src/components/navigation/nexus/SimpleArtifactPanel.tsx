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
import MonacoEditor from "@/components/visual-builder/MonacoEditor";
import LiquidPreviewCanvas from "@/components/visual-builder/LiquidPreviewCanvas";
import type { GlobalFilters } from "@/stores/visualBuilderStore";
import { CheckIcon, CopyIcon, XIcon, Eye, Code2, Palette } from "lucide-react";
import { PRESETS, applyPresetOnCode, detectPresetKey, type PresetKey } from "@/components/visual-builder/CodeThemePresets";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type SimpleArtifactPanelProps = {
  onClose?: () => void;
};

export default function SimpleArtifactPanel({ onClose }: SimpleArtifactPanelProps) {
  const [tab, setTab] = useState<'code' | 'preview'>('code');
  const [code, setCode] = useState<string>(() => initialArtifactLiquid);
  const [copied, setCopied] = useState(false);
  const currentPreset = useMemo(() => detectPresetKey(code), [code]);

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

  return (
    <Artifact className="h-full" hideTopBorder>
      <ArtifactHeader className="bg-white">
        {/* Header Left: Toggle Preview/Code */}
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
          </div>
        </div>
        {/* Header Right: Tema / Copiar / Publicar / Fechar */}
        <ArtifactActions className="gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" className="h-8 px-3 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50" variant="outline">
                <Palette className="w-4 h-4 mr-1" />
                {currentPreset === 'custom' ? 'Tema' : PRESETS.find(p => p.key === currentPreset)?.name || 'Tema'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PRESETS.map((p) => (
                <DropdownMenuItem key={p.key} onClick={() => setCode(prev => applyPresetOnCode(prev, p.key as PresetKey))}>
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            onClick={handleCopy}
            className="h-8 px-3 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
            variant="outline"
          >
            {copied ? <CheckIcon className="w-4 h-4 mr-1" /> : <CopyIcon className="w-4 h-4 mr-1" />}
            Copiar
          </Button>
          <Button
            type="button"
            onClick={() => console.log('Publicar acionado')}
            className="h-8 px-3 bg-black text-white hover:bg-black/90"
          >
            Publicar
          </Button>
          <ArtifactAction
            tooltip="Fechar"
            label="Fechar"
            icon={XIcon}
            onClick={onClose}
          />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className="p-0">
        <div className="h-full">
          {tab === 'code' ? (
            <MonacoEditor value={code} onChange={setCode} language="html" />
          ) : (
            <div className="h-full overflow-auto">
              <LiquidPreviewCanvas code={code} globalFilters={defaultFilters} className="w-full" />
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
    <header class="vb-header" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
      <p style="margin:0 0 4px; font-family:Inter, system-ui, sans-serif; font-size:18px; font-weight:700; color:#111827;">Artifact • Exemplo Inicial</p>
      <p style="margin:0; font-family:Inter, system-ui, sans-serif; font-size:14px; font-weight:400; color:#6b7280;">Edite o código e visualize abaixo</p>
    </header>

    <section id="sec1" class="row charts" data-role="section" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:flex-start; align-items:stretch; gap:16px; margin-top:16px;">
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
  </div>
</dashboard>`;

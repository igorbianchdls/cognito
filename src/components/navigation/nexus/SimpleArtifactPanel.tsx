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
import { CheckIcon, CopyIcon, XIcon, Eye, Code2 } from "lucide-react";

type SimpleArtifactPanelProps = {
  onClose?: () => void;
};

export default function SimpleArtifactPanel({ onClose }: SimpleArtifactPanelProps) {
  const [tab, setTab] = useState<'code' | 'preview'>('code');
  const [code, setCode] = useState<string>(() => initialSampleHtml);
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
        {/* Header Right: Copiar / Publicar / Fechar */}
        <ArtifactActions className="gap-2">
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

const initialSampleHtml = `
<div style="font-family: system-ui;">
  <h2 style="margin: 0 0 8px;">Hello Artifact 👋</h2>
  <p style="margin: 0 0 12px; color: #4b5563;">
    Edite o código na aba "Código" e visualize aqui na aba "Preview".
  </p>
  <ul style="margin: 0; padding-left: 18px; color: #374151;">
    <li>Suporta HTML simples</li>
    <li>O botão Copiar copia o código</li>
    <li>O botão Publicar é um placeholder</li>
  </ul>
</div>
`;

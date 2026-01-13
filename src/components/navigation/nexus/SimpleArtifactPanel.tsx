"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
} from "@/components/ai-elements/artifact";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonacoEditor from "@/components/visual-builder/MonacoEditor";
import { CheckIcon, CopyIcon, XIcon } from "lucide-react";

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

  const preview = useMemo(() => ({ __html: code }), [code]);

  return (
    <Artifact className="h-full" hideTopBorder>
      <ArtifactHeader className="bg-white">
        <div className="flex flex-col">
          <ArtifactTitle>Artifact</ArtifactTitle>
          <ArtifactDescription>Código e visualização</ArtifactDescription>
        </div>
        <ArtifactActions className="gap-2">
          <ArtifactAction
            tooltip="Fechar"
            label="Fechar"
            icon={XIcon}
            onClick={onClose}
          />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className="p-0">
        <div className="h-full grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 240px' }}>
          {/* Esquerda: Tabs Código/Preview */}
          <div className="h-full min-h-0 border-r border-gray-200">
            <div className="h-full flex flex-col">
              <Tabs value={tab} onValueChange={(v) => setTab(v as 'code' | 'preview')} className="h-full flex flex-col">
                <div className="px-4 pt-3">
                  <TabsList variant="underline" className="mb-2">
                    <TabsTrigger value="code">Código</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex-1 min-h-0">
                  <TabsContent value="code" className="h-full mt-0">
                    <div className="h-full">
                      <MonacoEditor value={code} onChange={setCode} language="html" />
                    </div>
                  </TabsContent>
                  <TabsContent value="preview" className="h-full mt-0">
                    <div className="h-full overflow-auto p-4">
                      <div className="border border-gray-200 rounded-md p-4 bg-white" dangerouslySetInnerHTML={preview} />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Direita: Ações adicionais (duplicadas no header se quiser reforçar acesso) */}
          <div className="p-4 bg-gray-50">
            <div className="sticky top-0 space-y-2">
              <Button
                type="button"
                onClick={handleCopy}
                className="w-full h-9 bg-white text-gray-900 border border-gray-300 hover:bg-gray-100"
                variant="outline"
              >
                {copied ? <CheckIcon className="w-4 h-4 mr-1" /> : <CopyIcon className="w-4 h-4 mr-1" />}
                Copiar
              </Button>
              <Button
                type="button"
                onClick={() => console.log('Publicar acionado')}
                className="w-full h-9 bg-black text-white hover:bg-black/90"
              >
                Publicar
              </Button>
            </div>
          </div>
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

'use client';

import React, { useState } from 'react';
import { Copy, Download, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent
} from '@/components/ai-elements/artifact';

interface ReportResultsProps {
  titulo: string;
  markdown: string;
  totalInsights: number;
  totalAlertas: number;
  totalRecomendacoes: number;
  success: boolean;
  error?: string;
  metadata?: {
    generatedAt: string;
    dataSource: string;
  };
}

export default function ReportResults({
  titulo,
  markdown,
  totalInsights,
  totalAlertas,
  totalRecomendacoes,
  success,
  error,
  metadata
}: ReportResultsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titulo.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!success) {
    return (
      <Artifact>
        <ArtifactHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <ArtifactTitle className="text-red-800">Erro ao Gerar Relatório</ArtifactTitle>
          </div>
        </ArtifactHeader>
        <ArtifactContent>
          <p className="text-red-700">{error}</p>
        </ArtifactContent>
      </Artifact>
    );
  }

  return (
    <Artifact className="max-w-none">
      <ArtifactHeader>
        <div>
          <ArtifactTitle className="text-lg font-bold">{titulo}</ArtifactTitle>
          <ArtifactDescription className="mt-1">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {totalInsights} Insights
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {totalAlertas} Alertas
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {totalRecomendacoes} Recomendações
              </span>
            </div>
            {metadata && (
              <div className="mt-1 text-xs">
                Gerado em: {new Date(metadata.generatedAt).toLocaleString('pt-BR')}
              </div>
            )}
          </ArtifactDescription>
        </div>

        <ArtifactActions>
          <ArtifactAction
            icon={copied ? CheckCircle : Copy}
            tooltip={copied ? "Copiado!" : "Copiar markdown"}
            onClick={handleCopy}
            className={copied ? "text-green-600" : ""}
          />
          <ArtifactAction
            icon={Download}
            tooltip="Download arquivo .md"
            onClick={handleDownload}
          />
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent className="p-6">
        <div className="bg-gray-50 rounded-lg p-6 overflow-auto max-h-[70vh]">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
              {markdown}
            </pre>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Relatório consolidado em formato Markdown</span>
            <span>Total: {totalInsights + totalAlertas + totalRecomendacoes} itens</span>
          </div>
        </div>
      </ArtifactContent>
    </Artifact>
  );
}
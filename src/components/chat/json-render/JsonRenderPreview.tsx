"use client";

import React from 'react';
import { useStore } from '@nanostores/react';
import { $previewJsonrPath } from '@/stores/chat/sandboxStore';
import { DataProvider } from '@/components/json-render/context';
import { Renderer } from '@/components/json-render/renderer';
import { registry } from '@/components/json-render/registry';

type Props = { chatId?: string };

export default function JsonRenderPreview({ chatId }: Props) {
  const jsonrPath = useStore($previewJsonrPath);
  const [content, setContent] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tree, setTree] = React.useState<any | any[] | null>(null);

  React.useEffect(() => {
    (async () => {
      setError(null);
      setContent(null);
      setTree(null);
      if (!chatId) { setError('chatId ausente (abra uma sessão de chat).'); return; }
      if (!jsonrPath) { setError('Caminho do .jsonr não configurado.'); return; }
      try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-read', chatId, path: jsonrPath }) });
        const data = await res.json().catch(() => ({})) as { ok?: boolean; content?: string; isBinary?: boolean; error?: string };
        if (!res.ok || data.ok === false) {
          setError(data.error || `Falha ao ler arquivo ${jsonrPath}`);
          return;
        }
        if (data.isBinary) { setError('Arquivo .jsonr binário inválido.'); return; }
        const txt = String(data.content ?? '');
        setContent(txt);
        try { setTree(JSON.parse(txt)); } catch (e: any) { setError(e?.message ? String(e.message) : 'JSON inválido'); }
      } catch (e: any) {
        setError(e?.message ? String(e.message) : 'Erro ao buscar .jsonr');
      }
    })();
  }, [chatId, jsonrPath]);

  return (
    <div className="h-full w-full grid grid-rows-[auto_1fr] min-h-0">
      <div className="flex items-center justify-between h-10 border-b px-3 bg-gray-50 text-xs text-gray-600">
        <div className="truncate">Preview • {jsonrPath || '(sem caminho)'}{content && (<span className="ml-2 text-gray-400">({content.length} bytes)</span>)}</div>
      </div>
      <div className="min-h-0 overflow-auto p-2 bg-gray-50">
        {error && (
          <div className="rounded border border-red-300 bg-red-50 text-red-700 text-xs p-2">{error}</div>
        )}
        {!error && !tree && (
          <div className="text-xs text-gray-500 p-2">Carregando...</div>
        )}
        {!error && tree && (
          <div className="rounded border border-gray-200 bg-white p-0 min-h-[420px]">
            <DataProvider initialData={{}}>
              <Renderer tree={tree} registry={registry} />
            </DataProvider>
          </div>
        )}
      </div>
    </div>
  );
}


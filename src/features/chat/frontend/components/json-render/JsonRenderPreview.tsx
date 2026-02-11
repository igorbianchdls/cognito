"use client";

import React from 'react';
import { useStore } from '@nanostores/react';
import { $previewJsonrPath, sandboxActions } from '@/features/chat/state/sandboxStore';
import { DataProvider } from '@/components/json-render/context';
import { Renderer } from '@/components/json-render/renderer';
import { registry } from '@/components/json-render/registry';

type Props = { chatId?: string };

export default function JsonRenderPreview({ chatId }: Props) {
  const jsonrPath = useStore($previewJsonrPath);
  const [content, setContent] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tree, setTree] = React.useState<any | any[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [paths, setPaths] = React.useState<string[]>([]);
  const [loadingPaths, setLoadingPaths] = React.useState<boolean>(false);
  const [pathsError, setPathsError] = React.useState<string | null>(null);

  // Load persisted preview path
  React.useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('previewJsonrPath') : null;
    if (saved && saved !== jsonrPath) sandboxActions.setPreviewPath(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Persist on change
  React.useEffect(() => {
    if (typeof window !== 'undefined' && jsonrPath) window.localStorage.setItem('previewJsonrPath', jsonrPath);
  }, [jsonrPath]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setContent(null);
      setTree(null);
      if (!chatId) { setError('chatId ausente (abra uma sessão de chat).'); setLoading(false); return; }
      if (!jsonrPath) { setError('Caminho do .jsonr não configurado.'); setLoading(false); return; }
      try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-read', chatId, path: jsonrPath }) });
        const data = await res.json().catch(() => ({})) as { ok?: boolean; content?: string; isBinary?: boolean; error?: string };
        if (!res.ok || data.ok === false) {
          // Fallback: tentar descobrir um .jsonr e usar o primeiro
          const found = await refreshPaths();
          if (found && found.length) { sandboxActions.setPreviewPath(found[0]); setError(null); setLoading(false); return; }
          setError(data.error || `Falha ao ler arquivo ${jsonrPath}`);
          setLoading(false);
          return;
        }
        if (data.isBinary) { setError('Arquivo .jsonr binário inválido.'); setLoading(false); return; }
        const txt = String(data.content ?? '');
        setContent(txt);
        try {
          const parsed = JSON.parse(txt);
          if (parsed == null || (typeof parsed !== 'object' && !Array.isArray(parsed))) {
            setError('JSONR inválido: esperado objeto/array não nulo.');
            setTree(null);
            setLoading(false);
            return;
          }
          setTree(parsed);
        } catch (e: any) {
          setError(e?.message ? String(e.message) : 'JSON inválido');
        }
      } catch (e: any) {
        const found = await refreshPaths();
        if (found && found.length) { sandboxActions.setPreviewPath(found[0]); setError(null); setLoading(false); return; }
        setError(e?.message ? String(e.message) : 'Erro ao buscar .jsonr');
      } finally {
        setLoading(false);
      }
    })();
  }, [chatId, jsonrPath]);

  // Discover .jsonr files under /vercel/sandbox
  const refreshPaths = React.useCallback(async (): Promise<string[]> => {
    if (!chatId) { setPathsError('chatId ausente'); return []; }
    setLoadingPaths(true); setPathsError(null);
    try {
      const collected: string[] = [];

      // Fast path: use dashboard folder first (where defaults live).
      const directDirs = ['/vercel/sandbox/dashboard'];
      for (const dir of directDirs) {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-list', chatId, path: dir }) });
        const data = await res.json().catch(()=>({})) as { ok?: boolean; entries?: Array<{ name:string; path:string; type:'file'|'dir' }>; error?: string };
        if (!res.ok || data.ok === false) continue;
        const entries = data.entries || [];
        for (const e of entries) {
          if (e.type === 'file' && e.path.endsWith('.jsonr')) {
            collected.push(e.path);
          }
        }
      }

      // Fallback path: recursive scan only if dashboard folder has no files.
      if (collected.length === 0) {
        const visited = new Set<string>();
        const queue: string[] = ['/vercel/sandbox'];
        const MAX_FILES = 500; // safeguard
        const MAX_DIRS = 1000;
        let dirs = 0;
        while (queue.length && collected.length < MAX_FILES && dirs < MAX_DIRS) {
          const dir = queue.shift()!; dirs++;
          const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-list', chatId, path: dir }) });
          const data = await res.json().catch(()=>({})) as { ok?: boolean; entries?: Array<{ name:string; path:string; type:'file'|'dir' }>; error?: string };
          if (!res.ok || data.ok === false) { setPathsError(data.error || `Falha ao listar ${dir}`); break; }
          const entries = data.entries || [];
          for (const e of entries) {
            if (e.type === 'dir') {
              if (!visited.has(e.path)) { visited.add(e.path); queue.push(e.path); }
            } else if (e.type === 'file' && e.path.endsWith('.jsonr')) {
              collected.push(e.path);
            }
          }
        }
      }

      collected.sort();
      setPaths(collected);
      return collected;
    } catch (e: any) {
      setPathsError(e?.message ? String(e.message) : 'Falha ao buscar arquivos .jsonr');
      return [];
    } finally {
      setLoadingPaths(false);
    }
  }, [chatId]);

  React.useEffect(() => { refreshPaths(); }, [refreshPaths]);

  return (
    <div className="h-full w-full min-h-0 overflow-auto p-2 bg-gray-50">
      {(pathsError && !error) && (
        <div className="rounded border border-yellow-300 bg-yellow-50 text-yellow-800 text-xs p-2 mb-2">{pathsError}</div>
      )}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 text-xs p-2">{error}</div>
      )}
      {!error && loading && (
        <div className="text-xs text-gray-500 p-2">Carregando...</div>
      )}
      {!error && !loading && tree && (
        <div className="rounded border border-gray-200 bg-white p-0 min-h-[420px]">
          <DataProvider initialData={{}}>
            <Renderer tree={tree} registry={registry} />
          </DataProvider>
        </div>
      )}
    </div>
  );
}

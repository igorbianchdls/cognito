"use client";

import React from 'react';
import { useStore } from '@nanostores/react';
import { $previewArtifactPath, fetchPreviewArtifactPaths, sandboxActions } from '@/chat/sandbox';

type Props = { chatId?: string };

export default function DashboardPicker({
  chatId,
  compact = false,
  onSelected,
}: Props & { compact?: boolean; onSelected?: () => void }) {
  const current = useStore($previewArtifactPath);
  const [paths, setPaths] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

  const refresh = React.useCallback(async () => {
    if (!chatId) {
      setPaths([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    try {
      const { paths: nextPaths, error: nextError } = await fetchPreviewArtifactPaths(chatId);
      setPaths(nextPaths);
      setError(nextError);
    } catch (e: any) { setError(e?.message ? String(e.message) : 'Erro ao listar artefatos'); }
    finally { setLoading(false); }
  }, [chatId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const filtered = React.useMemo(() => {
    if (!query) return paths;
    const q = query.toLowerCase();
    return paths.filter(p => p.toLowerCase().includes(q));
  }, [paths, query]);

  return (
    <div className={compact ? "w-[420px] max-w-[calc(100vw-40px)]" : "h-full w-full p-3 bg-gray-50"}>
      <div className="mb-2 flex items-center gap-2">
        <input
          type="text"
          placeholder="Filtrar artefatos (.tsx)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`border border-gray-300 rounded px-2 py-1 text-xs bg-white ${compact ? 'w-full min-w-0' : 'min-w-[220px]'}`}
        />
        <button type="button" className="border border-gray-300 rounded px-2 py-1 text-xs bg-white hover:bg-gray-50" onClick={refresh} disabled={loading}>
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>
      {error && <div className="rounded border border-red-300 bg-red-50 text-red-700 text-xs p-2 mb-2">{error}</div>}
      <div className={`rounded border border-gray-200 bg-white p-2 overflow-auto ${compact ? 'max-h-[340px]' : 'max-h-[60vh]'}`}>
        {!chatId && (
          <div className="text-xs text-gray-500 p-2">
            UI de Workspace aberta. Inicie um computador para listar artefatos `.tsx`.
          </div>
        )}
        {chatId && filtered.length === 0 && <div className="text-xs text-gray-500">Nenhum artefato encontrado</div>}
        <ul className="divide-y divide-gray-100">
          {filtered.map(p => (
            <li key={p}>
              <button
                type="button"
                className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-50 ${current === p ? 'bg-gray-50 font-medium' : ''}`}
                onClick={() => {
                  if (chatId) {
                    try { window.localStorage.setItem(`previewArtifactPath:${chatId}`, p); } catch { /* noop */ }
                  } 
                  sandboxActions.setPreviewPath(p);
                  sandboxActions.setActiveTab('preview');
                  onSelected?.();
                }}
              >
                <span className="text-gray-800">{p.replace('/vercel/sandbox','')}</span>
                {current === p && <span className="ml-2 text-xs text-gray-500">(atual)</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

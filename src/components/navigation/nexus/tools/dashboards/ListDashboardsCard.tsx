'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, List, Search } from 'lucide-react';

type Visibility = 'private' | 'org' | 'public' | string;

type DashboardRow = {
  id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  version: number;
  created_at: string;
  updated_at: string;
};

interface ListDashboardsCardProps {
  success: boolean;
  items?: DashboardRow[];
  count?: number;
  input?: {
    q?: string;
    visibility?: Visibility;
    limit?: number;
    offset?: number;
  };
  error?: string;
}

export default function ListDashboardsCard({ success, items = [], count = 0, input, error }: ListDashboardsCardProps) {
  const totalLabel = useMemo(() => {
    if (!success) return 'Erro na listagem';
    if (!items.length) return 'Nenhum dashboard encontrado';
    return `${items.length} de ${count}`;
  }, [success, items.length, count]);

  const handleCopyId = async (id: string) => {
    try { await navigator.clipboard.writeText(id); } catch {}
  };

  const sendGetDetailsPrompt = (id: string) => {
    const text = `Por favor, chame a tool getDashboard com este payload:\n${JSON.stringify({ id }, null, 2)}`;
    window.postMessage({ type: 'SET_CHAT_INPUT', text }, window.location.origin);
  };

  const visibilityBadge = (v: Visibility) => {
    const map: Record<string, string> = {
      private: 'bg-gray-200 text-gray-800',
      org: 'bg-indigo-200 text-indigo-800',
      public: 'bg-green-200 text-green-800',
    };
    const klass = map[v] || 'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${klass}`}>{v}</span>;
  };

  if (!success) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="text-red-700 font-medium">Falha ao listar dashboards</div>
        {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b bg-gray-50 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-800">
          <List className="w-4 h-4" />
          <span className="font-medium">Dashboards</span>
          <Badge variant="secondary">{totalLabel}</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {input?.q && (
            <span className="inline-flex items-center gap-1 bg-white border rounded px-2 py-1">
              <Search className="w-3 h-3" />
              <span>q: {input.q}</span>
            </span>
          )}
          {input?.visibility && (
            <span className="inline-flex items-center gap-1 bg-white border rounded px-2 py-1">
              vis: {visibilityBadge(input.visibility)}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="text-left font-medium p-3">Título</th>
              <th className="text-left font-medium p-3">Descrição</th>
              <th className="text-left font-medium p-3">Visibilidade</th>
              <th className="text-left font-medium p-3">Versão</th>
              <th className="text-right font-medium p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3 text-gray-900">{row.title || '(sem título)'}</td>
                <td className="p-3 text-gray-600">{row.description || '-'}</td>
                <td className="p-3">{visibilityBadge(row.visibility)}</td>
                <td className="p-3 text-gray-700">{row.version}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => handleCopyId(row.id)}>
                      <Copy className="w-3.5 h-3.5 mr-1" /> ID
                    </Button>
                    <Button size="sm" onClick={() => sendGetDetailsPrompt(row.id)}>
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver detalhes
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Nenhum resultado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer (pagination info only) */}
      <div className="border-t bg-gray-50 p-2 text-xs text-gray-600 flex items-center justify-between">
        <span>
          Limite: {input?.limit ?? 20} • Offset: {input?.offset ?? 0}
        </span>
        <span>Atualizado em: {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}


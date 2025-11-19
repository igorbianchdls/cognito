'use client';

import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import { Button } from '@/components/ui/button';
import { visualBuilderActions } from '@/stores/visualBuilderStore';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Eye, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

type Visibility = 'private' | 'org' | 'public' | string;

type CreatedItem = {
  id: string;
  title: string;
  description: string | null;
  sourcecode: string;
  visibility: Visibility;
  version: number;
  created_at: string;
  updated_at: string;
};

interface DashboardCreatedCardProps {
  success: boolean;
  item?: CreatedItem;
  error?: string;
}

export default function DashboardCreatedCard({ success, item, error }: DashboardCreatedCardProps) {
  const [applied, setApplied] = useState(false);

  const handleCopyId = async () => { if (item) { try { await navigator.clipboard.writeText(item.id); } catch {} } };
  const handleCopyCode = async () => { if (item) { try { await navigator.clipboard.writeText(item.sourcecode); } catch {} } };
  const handleApply = () => {
    if (!item) return;
    visualBuilderActions.updateCode(item.sourcecode);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  const visBadge = (v: Visibility) => {
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
        <div className="text-red-700 font-medium">Falha ao criar dashboard</div>
        {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b bg-gray-50 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">Dashboard criado</span>
          <Badge variant="secondary">v{item.version}</Badge>
          {visBadge(item.visibility)}
          <span className="text-xs text-gray-500">ID: {item.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopyId}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Copiar ID
          </Button>
          <a href="/nexus" className="inline-flex"><Button size="sm" variant="secondary"><Eye className="w-3.5 h-3.5 mr-1" /> Abrir no Builder</Button></a>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3 border-b grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-600">Título</div>
          <div className="text-sm text-gray-900">{item.title || '(sem título)'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Descrição</div>
          <div className="text-sm text-gray-700">{item.description || '-'}</div>
        </div>
      </div>

      {/* Editor (visualização) */}
      <div className="h-96">
        <MonacoEditor value={item.sourcecode} onChange={() => {}} language="html" height="100%" />
      </div>

      {/* Actions */}
      <div className="border-t bg-gray-50 p-3 flex items-center justify-between">
        <div className="text-xs text-gray-600">Criado em {new Date(item.created_at).toLocaleString()}</div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopyCode}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Código
          </Button>
          <Button size="sm" onClick={handleApply} className={applied ? 'bg-green-600 hover:bg-green-600' : ''}>
            {applied ? (<><CheckCircle className="w-3.5 h-3.5 mr-1" /> Aplicado</>) : (<><LayoutDashboard className="w-3.5 h-3.5 mr-1" /> Aplicar ao Builder</>)}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Copy, Edit, Eye, Save, X } from 'lucide-react';

type Visibility = 'private' | 'org' | 'public' | string;

type DashboardItem = {
  id: string;
  title: string;
  description: string | null;
  sourcecode: string;
  visibility: Visibility;
  version: number;
  created_at: string;
  updated_at: string;
};

interface DashboardDetailsCardProps {
  success: boolean;
  item?: DashboardItem | null;
  error?: string;
}

export default function DashboardDetailsCard({ success, item, error }: DashboardDetailsCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [visibility, setVisibility] = useState<Visibility>(item?.visibility ?? 'private');
  const [version, setVersion] = useState<number>(item?.version ?? 1);
  const [code, setCode] = useState(item?.sourcecode ?? '');
  const [justSaved, setJustSaved] = useState(false);

  const snapshot = useRef<DashboardItem | null>(item ?? null);

  useEffect(() => {
    setTitle(item?.title ?? '');
    setDescription(item?.description ?? '');
    setVisibility(item?.visibility ?? 'private');
    setVersion(item?.version ?? 1);
    setCode(item?.sourcecode ?? '');
    snapshot.current = item ?? null;
  }, [item]);

  const visBadge = (v: Visibility) => {
    const map: Record<string, string> = {
      private: 'bg-gray-200 text-gray-800',
      org: 'bg-indigo-200 text-indigo-800',
      public: 'bg-green-200 text-green-800',
    };
    const klass = map[v] || 'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${klass}`}>{v}</span>;
  };

  const changes = useMemo(() => {
    if (!snapshot.current) return {} as Record<string, unknown>;
    const up: Record<string, unknown> = {};
    if (title !== snapshot.current.title) up.title = title;
    if ((description || null) !== (snapshot.current.description ?? null)) up.description = description || null;
    if (visibility !== snapshot.current.visibility) up.visibility = visibility;
    if (version !== snapshot.current.version) up.version = version;
    if (code !== snapshot.current.sourcecode) up.sourcecode = code;
    return up;
  }, [title, description, visibility, version, code]);

  const hasChanges = Object.keys(changes).length > 0;

  const copyPayload = async () => {
    if (!item) return;
    const payload = { id: item.id, ...changes };
    try { await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)); } catch {}
  };

  const stageUpdateInChat = () => {
    if (!item) return;
    const payload = { id: item.id, ...changes };
    const text = `Por favor, chame a tool updateDashboard com este payload:\n${JSON.stringify(payload, null, 2)}`;
    window.postMessage({ type: 'SET_CHAT_INPUT', text }, window.location.origin);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  if (!success) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="text-red-700 font-medium">Falha ao obter dashboard</div>
        {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        Dashboard não encontrado.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b bg-gray-50 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">Dashboard</span>
          <Badge variant="secondary">v{item.version}</Badge>
          {visBadge(item.visibility)}
          <span className="text-xs text-gray-500">ID: {item.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Edit className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => {
                setEditing(false);
                // reset fields to snapshot
                if (snapshot.current) {
                  setTitle(snapshot.current.title);
                  setDescription(snapshot.current.description ?? '');
                  setVisibility(snapshot.current.visibility);
                  setVersion(snapshot.current.version);
                  setCode(snapshot.current.sourcecode);
                }
              }}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancelar
              </Button>
              <Button size="sm" disabled={!hasChanges} onClick={stageUpdateInChat}>
                <Save className="w-3.5 h-3.5 mr-1" /> Salvar (preparar tool)
              </Button>
            </>
          )}
          <Button size="sm" variant="secondary" onClick={copyPayload} disabled={!hasChanges}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Copiar payload
          </Button>
          <a href="/nexus" className="inline-flex"><Button size="sm" variant="secondary"><Eye className="w-3.5 h-3.5 mr-1" /> Abrir no Builder</Button></a>
        </div>
      </div>

      {/* Title / Description / Meta */}
      <div className="p-3 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Título</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm disabled:bg-gray-50"
              disabled={!editing}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do dashboard"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Visibilidade</label>
            <select
              className="w-full border rounded px-2 py-1 text-sm disabled:bg-gray-50"
              disabled={!editing}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="private">private</option>
              <option value="org">org</option>
              <option value="public">public</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Descrição</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm disabled:bg-gray-50"
              disabled={!editing}
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Versão</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm disabled:bg-gray-50"
              disabled={!editing}
              value={version}
              onChange={(e) => setVersion(Number(e.target.value) || 0)}
              min={1}
            />
          </div>
        </div>
        {justSaved && (
          <div className="mt-2 inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Payload preparado no input do chat.
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="h-96">
        <MonacoEditor value={code} onChange={setCode} language="json" height="100%" />
      </div>
    </div>
  );
}


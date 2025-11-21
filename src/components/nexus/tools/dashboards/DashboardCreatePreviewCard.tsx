'use client';

import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type Visibility = 'private' | 'org' | 'public' | string;

interface DashboardCreatePreviewCardProps {
  title: string;
  description: string | null;
  sourcecode: string;
  visibility: Visibility;
  version: number;
}

export default function DashboardCreatePreviewCard({ title: initialTitle, description: initialDesc, sourcecode: initialCode, visibility: initialVis, version: initialVer }: DashboardCreatePreviewCardProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDesc ?? '');
  const [visibility, setVisibility] = useState<Visibility>(initialVis || 'private');
  const [version, setVersion] = useState<number>(initialVer || 1);
  const [code, setCode] = useState(initialCode);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null, sourcecode: code, visibility, version })
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Falha ao criar');
      setCreated({ id: json.item.id });
    } catch (e) {
      setError((e as Error).message || 'Erro desconhecido');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="border-b bg-gray-50 p-3 flex items-center justify-between">
        <div className="font-medium text-gray-900">Criar Dashboard (Preview)</div>
        {created ? (
          <div className="text-xs text-green-700">Criado com sucesso • ID: {created.id}</div>
        ) : null}
      </div>

      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 border-b">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Título</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Título do dashboard" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Descrição</label>
          <input value={description || ''} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Descrição (opcional)" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Visibilidade</label>
          <select value={visibility} onChange={e => setVisibility(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
            <option value="private">Privado</option>
            <option value="org">Organização</option>
            <option value="public">Público</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Versão</label>
          <input type="number" min={1} value={version} onChange={e => setVersion(parseInt(e.target.value || '1'))} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
      </div>

      <div className="h-96">
        <MonacoEditor value={code} onChange={setCode} language="html" height="100%" />
      </div>

      <div className="border-t bg-gray-50 p-3 flex items-center justify-between">
        {error ? <div className="text-xs text-red-600">{error}</div> : <div className="text-xs text-gray-600">Revise as informações antes de criar</div>}
        <Button size="sm" onClick={handleCreate} disabled={creating || !!created}>
          {creating ? 'Criando…' : (created ? 'Criado' : 'Criar dashboard')}
        </Button>
      </div>
    </div>
  );
}


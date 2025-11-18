"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { dashboardsApi } from '@/stores/dashboardsStore';

interface DashboardSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle?: string;
  initialDescription?: string;
  sourcecode: string;
  onSaved?: (id: string) => void;
}

export default function DashboardSaveDialog({ open, onOpenChange, initialTitle, initialDescription, sourcecode, onSaved }: DashboardSaveDialogProps) {
  const [title, setTitle] = useState(initialTitle || 'Meu Dashboard');
  const [description, setDescription] = useState(initialDescription || '');
  const [visibility, setVisibility] = useState<'private'|'org'|'public'>('private');
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const { item } = await dashboardsApi.create({ title, description: description || null, sourcecode, visibility, version });
      onOpenChange(false);
      onSaved?.(item.id);
    } catch (e) {
      setError((e as Error).message || 'Falha ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Salvar Dashboard</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Meu Dashboard" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Resumo do dashboard" className="w-full border rounded px-3 py-2 text-sm h-24" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Visibilidade</label>
              <select className="w-full border rounded px-2 py-2 text-sm" value={visibility} onChange={e => setVisibility(e.target.value as any)}>
                <option value="private">Privado</option>
                <option value="org">Organização</option>
                <option value="public">Público</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Versão</label>
              <input type="number" min={1} value={version} onChange={e => setVersion(parseInt(e.target.value || '1'))} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !title || !sourcecode}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

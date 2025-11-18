"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { dashboardsApi, type Dashboard } from '@/stores/dashboardsStore';

interface DashboardOpenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: (dashboard: Dashboard) => void;
}

export default function DashboardOpenDialog({ open, onOpenChange, onOpen }: DashboardOpenDialogProps) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true); setError(null);
    try {
      const { items } = await dashboardsApi.list({ q, limit: 50 });
      setItems(items);
    } catch (e) {
      setError((e as Error).message || 'Falha ao listar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) fetchList();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Abrir Dashboard</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-3">
          <Input placeholder="Buscar por título/descrição" value={q} onChange={e => setQ(e.target.value)} />
          <Button variant="outline" onClick={fetchList} disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</Button>
        </div>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div className="max-h-80 overflow-auto divide-y border rounded">
          {items.map(it => (
            <div key={it.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
              <div>
                <div className="font-medium">{it.title} <span className="text-xs text-gray-500">v{it.version}</span></div>
                {it.description && <div className="text-xs text-gray-500">{it.description}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{it.visibility}</span>
                <Button size="sm" onClick={() => onOpen(it)}>Abrir</Button>
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="p-6 text-center text-sm text-gray-500">Nenhum dashboard encontrado</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


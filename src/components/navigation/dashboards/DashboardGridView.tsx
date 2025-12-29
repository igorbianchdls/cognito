"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { dashboardsApi, type Dashboard } from "@/stores/dashboardsStore";
import DashboardCard from "@/components/navigation/dashboards/DashboardCard";

export default function DashboardGridView() {
  const [items, setItems] = useState<Dashboard[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardsApi.list({ limit: 24 });
        if (!mounted) return;
        setItems(res.items);
        setCount(res.count);
      } catch (e) {
        if (!mounted) return;
        setError((e as Error).message || "Falha ao carregar dashboards");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-white border rounded-xl animate-pulse" style={{ borderColor: '#e5e7eb' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">{error}</div>
    );
  }

  if (!items.length) {
    return (
      <div className="p-6 text-sm text-gray-600 bg-white border rounded">Nenhum dashboard encontrado.</div>
    );
  }

  const handleDeleted = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
    setCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600">{`${items.length} de ${count}`}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <DashboardCard key={it.id} item={it} onDeleted={handleDeleted} />
        ))}
      </div>
    </div>
  );
}

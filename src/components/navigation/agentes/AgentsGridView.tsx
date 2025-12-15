"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { agentsApi, type Agent } from "@/stores/agentsStore";
import AgentCard from "@/components/navigation/agentes/AgentCard";

export default function AgentsGridView({ category }: { category?: Agent['category'] }) {
  const [items, setItems] = useState<Agent[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await agentsApi.list({ category, limit: 24 });
        if (!mounted) return;
        setItems(res.items);
        setCount(res.count);
      } catch (e) {
        if (!mounted) return;
        setError((e as Error).message || "Falha ao carregar agentes");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [category]);

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
      <div className="p-6 text-sm text-gray-600 bg-white border rounded">Nenhum agente encontrado.</div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600">{`${items.length} de ${count}`}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <AgentCard key={it.id} item={it} />
        ))}
      </div>
    </div>
  );
}


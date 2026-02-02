"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import PageContainer from "@/components/chat/PageContainer";

type ChatRow = {
  id: string;
  title: string | null;
  model: string;
  composio_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export default function ChatListaPage() {
  const [items, setItems] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/lista?limit=20&offset=${reset ? 0 : offset}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Erro ao listar chats');
      const rows: ChatRow[] = data.items || [];
      setItems(reset ? rows : [...items, ...rows]);
      setOffset((reset ? 0 : offset) + rows.length);
      setHasMore(rows.length === 20);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleDelete = async (id: string) => {
    if (!id) return;
    const ok = window.confirm('Deseja deletar este chat? Esta ação é irreversível.');
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Falha ao deletar');
      // Remover item localmente
      setItems(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              <div className="h-full grid grid-rows-[auto_1fr]">
                <div className="px-4 py-3 border-b bg-white">
                  <h1 className="text-lg font-semibold">Chats</h1>
                  <p className="text-sm text-gray-500">Lista de conversas recentes</p>
                </div>
                <div className="overflow-auto min-h-0">
                  {error && (
                    <div className="p-4 text-red-600 text-sm">{error}</div>
                  )}
                  <div className="p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2 pr-2">Chat ID</th>
                          <th className="py-2 pr-2">Título</th>
                          <th className="py-2 pr-2">Modelo</th>
                          <th className="py-2 pr-2">Composio</th>
                          <th className="py-2 pr-2">Atualizado</th>
                          <th className="py-2 pr-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((row) => (
                          <tr key={row.id} className="border-t">
                            <td className="py-2 pr-2">
                              <Link href={`/chat/${row.id}`} className="text-blue-600 hover:underline font-mono">
                                {row.id}
                              </Link>
                            </td>
                            <td className="py-2 pr-2">{row.title || '-'}</td>
                            <td className="py-2 pr-2">{row.model}</td>
                            <td className="py-2 pr-2">{row.composio_enabled ? 'ON' : 'OFF'}</td>
                            <td className="py-2 pr-2">{new Date(row.updated_at).toLocaleString()}</td>
                            <td className="py-2 pr-2">
                              <button
                                onClick={() => handleDelete(row.id)}
                                disabled={deletingId === row.id}
                                className="px-2 py-1 rounded bg-red-600 text-white text-xs disabled:opacity-50"
                              >
                                {deletingId === row.id ? 'Deletando...' : 'Deletar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!items.length && !loading && (
                          <tr>
                            <td className="py-4 text-gray-500" colSpan={5}>Nenhum chat encontrado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <div className="mt-4">
                      <button
                        onClick={() => load(false)}
                        disabled={loading || !hasMore}
                        className="px-3 py-1.5 rounded bg-black text-white disabled:opacity-50"
                      >
                        {loading ? 'Carregando...' : hasMore ? 'Carregar mais' : 'Sem mais resultados'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </PageContainer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

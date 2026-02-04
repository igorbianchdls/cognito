"use client";

import { useEffect, useState } from 'react';
// no direct Link usage here; items use ChatListItem links
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import PageContainer from "@/components/chat/PageContainer";
import ChatListHeader from '@/components/chat/ChatListHeader';
import ChatListItem from '@/components/chat/ChatListItem';

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
  const [query, setQuery] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const router = useRouter();

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

  const handleRename = async (id: string, current?: string | null) => {
    const title = window.prompt('Novo título do chat:', current || '')
    if (title === null) return
    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Falha ao renomear')
      setItems(prev => prev.map(r => r.id === id ? { ...r, title } : r))
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  const filtered = items.filter(i => {
    const t = (i.title || '').toLowerCase();
    return !query || t.includes(query.toLowerCase());
  });

  const handleNewChat = () => {
    try {
      const id = (globalThis as any)?.crypto?.randomUUID?.() || (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
      router.replace(`/chat/${id}?auto=1`)
    } catch {
      const id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      router.replace(`/chat/${id}?auto=1`)
    }
  }

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer className="bg-[rgb(254,254,254)]">
              <div className="h-full grid grid-rows-[auto_1fr]">
                <ChatListHeader
                  value={query}
                  onChange={setQuery}
                  count={items.length}
                  selectMode={selectMode}
                  onToggleSelect={() => setSelectMode(!selectMode)}
                  onNewChat={handleNewChat}
                />
                <div className="overflow-auto min-h-0">
                  {error && <div className="max-w-3xl mx-auto px-6 text-red-600 text-sm">{error}</div>}
                  <div className="pb-6">
                    {filtered.map(row => (
                      <ChatListItem
                        key={row.id}
                        id={row.id}
                        title={row.title}
                        href={`/chat/${row.id}`}
                        updatedAt={row.updated_at}
                        lastMessageAt={row.last_message_at}
                        selectable={selectMode}
                        checked={!!selected[row.id]}
                        onCheckChange={(v)=> setSelected(s=> ({...s, [row.id]: v}))}
                        onEdit={() => handleRename(row.id, row.title)}
                        onDelete={() => handleDelete(row.id)}
                      />
                    ))}
                    {!filtered.length && !loading && (
                      <div className="max-w-3xl mx-auto px-6 text-gray-500">Nenhum chat encontrado.</div>
                    )}
                    <div className="max-w-3xl mx-auto px-6 mt-4">
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

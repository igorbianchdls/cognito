'use client'

import { useEffect, useMemo, useState } from 'react'

type ArtifactType = 'dashboard' | 'report' | 'slide'

type ArtifactItem = {
  id: string
  type: ArtifactType
  title: string
  chat_id: string
  snapshot_id: string | null
  file_path: string
  thumbnail_data_url: string | null
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

function sectionTitle(type: ArtifactType): string {
  if (type === 'dashboard') return 'Dashboards'
  if (type === 'report') return 'Reports'
  return 'Slides'
}

export default function ArtifactListPage({ type }: { type: ArtifactType }) {
  const [items, setItems] = useState<ArtifactItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/chat/artifacts?type=${encodeURIComponent(type)}`, { cache: 'no-store' })
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; items?: ArtifactItem[]; error?: string }
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || 'Falha ao carregar artifacts')
        }
        if (!cancelled) setItems(Array.isArray(json.items) ? json.items : [])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar artifacts')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [type])

  const title = useMemo(() => sectionTitle(type), [type])

  return (
    <div className="min-h-screen bg-[#F7F7F6] px-8 py-8 text-[#1F1F1D]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="mt-1 text-sm text-[#6A6A68]">Artifacts registrados a partir de snapshots do chat.</p>
        </div>

        {isLoading ? <div className="text-sm text-[#6A6A68]">Carregando...</div> : null}
        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        {!isLoading && !error ? (
          items.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[18px] border-[0.5px] border-[#DDDDD8] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
                >
                  <div className="aspect-[16/9] border-b-[0.5px] border-[#DDDDD8] bg-[#EEEEEB]">
                    {item.thumbnail_data_url ? (
                      <img
                        src={item.thumbnail_data_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#8A8A86]">Sem thumbnail</div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="text-[16px] font-semibold tracking-[-0.02em] text-[#1F1F1D]">{item.title}</div>
                    <div className="text-xs text-[#6A6A68]">{item.file_path}</div>
                    <div className="text-xs text-[#6A6A68]">Chat: {item.chat_id}</div>
                    <div className="text-xs text-[#6A6A68]">Atualizado: {new Date(item.updated_at).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border-[0.5px] border-[#DDDDD8] bg-white p-6 text-sm text-[#6A6A68]">
              Nenhum artifact encontrado.
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}

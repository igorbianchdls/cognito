'use client'

import Link from 'next/link'
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Edit3, LayoutGrid, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react'

import type { DashboardListItem } from '@/products/artifacts/backend/dashboardArtifactsService'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function formatRelativeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const absMinutes = Math.abs(diffMinutes)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (absMinutes < 60) return rtf.format(diffMinutes, 'minute')

  const diffHours = Math.round(diffMinutes / 60)
  const absHours = Math.abs(diffHours)
  if (absHours < 24) return rtf.format(diffHours, 'hour')

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day')

  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month')

  const diffYears = Math.round(diffDays / 365)
  return rtf.format(diffYears, 'year')
}

function hashTitle(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647
  }
  return Math.abs(hash)
}

function getThumbnailPalette(title: string, status: DashboardListItem['status']) {
  const palettes = [
    {
      shell: 'from-[#f8fafc] via-[#eef4ff] to-[#e0ecff]',
      accent: 'bg-[#2563eb]',
      card: 'bg-white/90',
      border: 'border-[#dbe6ff]',
      text: 'text-[#19325c]',
    },
    {
      shell: 'from-[#faf7f1] via-[#f6efe2] to-[#eedfca]',
      accent: 'bg-[#c27f45]',
      card: 'bg-white/88',
      border: 'border-[#ead8bd]',
      text: 'text-[#5f3d1f]',
    },
    {
      shell: 'from-[#f5f7fb] via-[#f1f4f9] to-[#e8edf5]',
      accent: 'bg-[#111827]',
      card: 'bg-white/92',
      border: 'border-[#dde5f0]',
      text: 'text-[#1f2937]',
    },
    {
      shell: 'from-[#eefbf6] via-[#e2f8ee] to-[#d2f2e3]',
      accent: 'bg-[#0f9f6e]',
      card: 'bg-white/90',
      border: 'border-[#cdebdc]',
      text: 'text-[#155240]',
    },
  ] as const

  if (status === 'published') return palettes[0]
  if (status === 'archived') return palettes[2]
  return palettes[hashTitle(title) % palettes.length]
}

function getInitials(title: string) {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'DB'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function DashboardThumbnail({ dashboard }: { dashboard: DashboardListItem }) {
  if (dashboard.thumbnail_data_url) {
    return (
      <div className="relative aspect-[1.75/1] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <img
          src={dashboard.thumbnail_data_url}
          alt={`Preview de ${dashboard.title}`}
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
      </div>
    )
  }

  const palette = getThumbnailPalette(dashboard.title, dashboard.status)
  const initials = getInitials(dashboard.title)

  return (
    <div className={`relative aspect-[1.75/1] overflow-hidden rounded-2xl border ${palette.border} bg-gradient-to-br ${palette.shell}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.85),transparent_42%)]" />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${palette.accent} text-xs font-semibold text-white shadow-sm`}>
          {initials}
        </div>
        <div className={`rounded-full border ${palette.border} ${palette.card} px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${palette.text}`}>
          {dashboard.status}
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-4 top-[30%] flex flex-col gap-3">
        <div className={`rounded-2xl border ${palette.border} ${palette.card} p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]`}>
          <div className={`text-sm font-semibold tracking-[-0.03em] ${palette.text}`}>{dashboard.title}</div>
          <div className="mt-2 flex gap-2">
            <div className={`h-2.5 w-16 rounded-full ${palette.accent} opacity-80`} />
            <div className="h-2.5 w-10 rounded-full bg-black/10" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-xl border ${palette.border} ${palette.card} px-3 py-2 shadow-[0_6px_16px_rgba(15,23,42,0.04)]`}
            >
              <div
                className={`h-2 w-7 rounded-full ${palette.accent}`}
                style={{ opacity: index === 0 ? 0.7 : 0.5 }}
              />
              <div className="mt-2 h-2.5 w-full rounded-full bg-black/8" />
              <div className="mt-1.5 h-2.5 w-3/4 rounded-full bg-black/8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DashboardCard({
  dashboard,
  isEditing,
  draftTitle,
  isSaving,
  onStartRename,
  onDraftTitleChange,
  onSaveRename,
  onCancelRename,
  onDelete,
}: {
  dashboard: DashboardListItem
  isEditing: boolean
  draftTitle: string
  isSaving: boolean
  onStartRename: (dashboard: DashboardListItem) => void
  onDraftTitleChange: (value: string) => void
  onSaveRename: () => void
  onCancelRename: () => void
  onDelete: (dashboard: DashboardListItem) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isEditing) return
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isEditing])

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void onSaveRename()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancelRename()
    }
  }

  return (
    <article className="group">
      <Link href={`/artifacts/dashboards/${dashboard.id}`} className="block">
        <DashboardThumbnail dashboard={dashboard} />
      </Link>

      <div className="flex items-start justify-between gap-3 px-1 pt-3">
        <div className="min-w-0 flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <LayoutGrid className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                value={draftTitle}
                onChange={(event) => onDraftTitleChange(event.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={() => {
                  if (isSaving) return
                  void onSaveRename()
                }}
                disabled={isSaving}
                className="block w-full rounded-md border border-[#d9deea] bg-white px-2 py-1 text-[18px] font-semibold tracking-[-0.03em] text-[#171717] outline-none transition focus:border-[#aab7cf] disabled:opacity-70"
              />
            ) : (
              <Link
                href={`/artifacts/dashboards/${dashboard.id}`}
                className="block truncate text-[18px] font-semibold tracking-[-0.03em] text-[#171717]"
                onDoubleClick={(event) => {
                  event.preventDefault()
                  onStartRename(dashboard)
                }}
              >
                {dashboard.title}
              </Link>
            )}
            <div className="mt-0.5 text-[14px] text-[#7a7a75]">{formatRelativeDate(dashboard.updated_at)}</div>
          </div>
        </div>

        {isEditing ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void onSaveRename()}
              disabled={isSaving}
              className="rounded-full border border-[#d9deea] px-3 py-1 text-[12px] font-semibold text-[#334155] transition hover:bg-[#f8fafc] disabled:opacity-60"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={onCancelRename}
              disabled={isSaving}
              className="rounded-full px-2 py-1 text-[12px] font-semibold text-[#64748b] transition hover:bg-[#f0f0ee] disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5f5f5a] transition hover:bg-[#f0f0ee]"
                aria-label={`More actions for ${dashboard.title}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem
                className="gap-2"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onStartRename(dashboard)
                }}
              >
                <Edit3 className="h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-red-600 focus:text-red-600"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onDelete(dashboard)
                }}
              >
                <Trash2 className="h-4 w-4" />
                Apagar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </article>
  )
}

export function DashboardListPage({ dashboards }: { dashboards: DashboardListItem[] }) {
  const [items, setItems] = useState(dashboards)
  const [query, setQuery] = useState('')
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [savingDashboardId, setSavingDashboardId] = useState<string | null>(null)
  const [deletingDashboardId, setDeletingDashboardId] = useState<string | null>(null)

  useEffect(() => {
    setItems(dashboards)
  }, [dashboards])

  const startRename = (dashboard: DashboardListItem) => {
    setEditingDashboardId(dashboard.id)
    setDraftTitle(dashboard.title)
  }

  const cancelRename = () => {
    if (savingDashboardId) return
    setEditingDashboardId(null)
    setDraftTitle('')
  }

  const saveRename = async () => {
    const dashboardId = editingDashboardId
    const nextTitle = draftTitle.trim()
    if (!dashboardId) return
    if (!nextTitle) {
      cancelRename()
      return
    }

    const currentDashboard = items.find((item) => item.id === dashboardId) || null
    if (currentDashboard && currentDashboard.title === nextTitle) {
      cancelRename()
      return
    }

    setSavingDashboardId(dashboardId)
    try {
      const response = await fetch(`/api/artifacts/dashboards/${dashboardId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          action: 'rename',
          title: nextTitle,
        }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok || !json?.dashboard) {
        throw new Error(json?.error || 'Falha ao renomear dashboard')
      }

      const updatedDashboard = json.dashboard as DashboardListItem
      setItems((current) => {
        const nextItems = current.map((item) => (item.id === updatedDashboard.id ? updatedDashboard : item))
        return nextItems.sort((left, right) => {
          const leftTime = new Date(left.updated_at).getTime()
          const rightTime = new Date(right.updated_at).getTime()
          if (rightTime !== leftTime) return rightTime - leftTime
          return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
        })
      })
      setEditingDashboardId(null)
      setDraftTitle('')
    } catch (error) {
      console.error(error)
    } finally {
      setSavingDashboardId(null)
    }
  }

  const deleteDashboard = async (dashboard: DashboardListItem) => {
    const confirmed = window.confirm(`Apagar o dashboard "${dashboard.title}"?`)
    if (!confirmed) return

    setDeletingDashboardId(dashboard.id)
    try {
      const response = await fetch(`/api/artifacts/dashboards/${dashboard.id}`, {
        method: 'DELETE',
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(json?.error || 'Falha ao apagar dashboard')
      }

      setItems((current) => current.filter((item) => item.id !== dashboard.id))
      if (editingDashboardId === dashboard.id) {
        setEditingDashboardId(null)
        setDraftTitle('')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setDeletingDashboardId(null)
    }
  }

  const filteredDashboards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return items

    return items.filter((dashboard) => {
      const haystack = [
        dashboard.title,
        dashboard.slug || '',
        dashboard.status,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [items, query])

  return (
    <main className="min-h-screen bg-white px-8 py-9 text-[#171717]">
      <div className="mx-auto max-w-[1360px]">
        <header className="mb-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1
              className="text-[52px] font-semibold tracking-[-0.05em] text-[#101828]"
              style={{ fontFamily: 'var(--font-eb-garamond), "EB Garamond", serif' }}
            >
              Dashboards
            </h1>
            <p className="mt-2 text-[16px] text-[#6d7689]">Gerencie e acesse todos os dashboards do Creatto.</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto xl:justify-end">
            <label className="relative block w-full sm:w-[280px] xl:w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#97A2B8]" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar dashboard"
                className="h-11 w-full rounded-[12px] border border-[#E1E6F0] bg-white pl-11 pr-4 text-[14px] text-[#1E2942] outline-none transition placeholder:text-[#9AA6BC] focus:border-[#B3BDED]"
              />
            </label>

            <button
              type="button"
              disabled
              className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-[14px] bg-black px-5 text-[14px] font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition disabled:cursor-not-allowed disabled:opacity-55"
              title="Criação de dashboard ainda não foi ligada nesta tela"
            >
              <Plus className="h-4 w-4" />
              Novo Dashboard
            </button>
          </div>
        </header>

        <section className="mb-8 flex items-center justify-between">
          <div className="text-[14px] text-[#7b8496]">
            {filteredDashboards.length} dashboards encontrados
          </div>
        </section>

        {items.length === 0 ? (
          <section className="rounded-[28px] border border-[#ecece8] bg-[#fafaf9] px-8 py-14">
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#111111]">No dashboards yet</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-[#6f6f6a]">
              Dashboards persisted in the database will appear here as soon as the creation flow is connected to this catalog.
            </p>
          </section>
        ) : filteredDashboards.length === 0 ? (
          <section className="rounded-[28px] border border-[#ecece8] bg-[#fafaf9] px-8 py-14">
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#111111]">No results</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-[#6f6f6a]">
              No dashboard matches <span className="font-medium text-[#171717]">{query}</span>.
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {filteredDashboards.map((dashboard) => (
              <DashboardCard
                key={dashboard.id}
                dashboard={dashboard}
                isEditing={editingDashboardId === dashboard.id}
                draftTitle={editingDashboardId === dashboard.id ? draftTitle : dashboard.title}
                isSaving={savingDashboardId === dashboard.id || deletingDashboardId === dashboard.id}
                onStartRename={startRename}
                onDraftTitleChange={setDraftTitle}
                onSaveRename={saveRename}
                onCancelRename={cancelRename}
                onDelete={deleteDashboard}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

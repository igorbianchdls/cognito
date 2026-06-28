'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Edit3, FileText, LayoutGrid, MoreHorizontal, Plus, Presentation, Search, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ArtifactKind } from '@/products/artifacts/core/types/artifactTypes'
import type { ArtifactListItem, DashboardListItem } from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

function formatRelativeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const absMinutes = Math.abs(diffMinutes)

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
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

type ArtifactCatalogConfig = {
  artifactType: ArtifactKind
  title: string
  singularLabel: string
  pluralLabel: string
  routeSegment: string
  newButtonLabel: string
  searchPlaceholder: string
  description: string
  emptyTitle: string
  emptyDescription: string
}

const ARTIFACT_CATALOG_CONFIG: Record<ArtifactKind, ArtifactCatalogConfig> = {
  dashboard: {
    artifactType: 'dashboard',
    title: 'Dashboards',
    singularLabel: 'dashboard',
    pluralLabel: 'dashboards',
    routeSegment: 'dashboards',
    newButtonLabel: 'Novo Dashboard',
    searchPlaceholder: 'Buscar dashboard',
    description: 'Gerencie e acesse todos os dashboards do Creatto.',
    emptyTitle: 'Nenhum dashboard ainda',
    emptyDescription: 'Os dashboards persistidos no banco aparecem aqui assim que forem criados.',
  },
  report: {
    artifactType: 'report',
    title: 'Reports',
    singularLabel: 'report',
    pluralLabel: 'reports',
    routeSegment: 'reports',
    newButtonLabel: 'Novo Report',
    searchPlaceholder: 'Buscar report',
    description: 'Gerencie e acesse todos os reports do Creatto.',
    emptyTitle: 'Nenhum report ainda',
    emptyDescription: 'Reports criados via MCP aparecerão aqui assim que forem persistidos.',
  },
  slide: {
    artifactType: 'slide',
    title: 'Slides',
    singularLabel: 'slide',
    pluralLabel: 'slides',
    routeSegment: 'slides',
    newButtonLabel: 'Novo Slide',
    searchPlaceholder: 'Buscar slide',
    description: 'Gerencie e acesse todas as apresentações do Creatto.',
    emptyTitle: 'Nenhum slide ainda',
    emptyDescription: 'Decks criados via MCP aparecerão aqui assim que forem persistidos.',
  },
}

function getArtifactIcon(artifactType: ArtifactKind) {
  if (artifactType === 'report') return FileText
  if (artifactType === 'slide') return Presentation
  return LayoutGrid
}

function getThumbnailPalette(title: string, status: ArtifactListItem['status']) {
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

function getStatusLabel(status: ArtifactListItem['status']) {
  if (status === 'published') return 'Publicado'
  if (status === 'archived') return 'Arquivado'
  return 'Rascunho'
}

function getStatusVariant(status: ArtifactListItem['status']) {
  if (status === 'published') return 'default'
  if (status === 'archived') return 'outline'
  return 'secondary'
}

function ArtifactEmptyState({
  config,
  title,
  description,
}: {
  config: ArtifactCatalogConfig
  title: string
  description: ReactNode
}) {
  const Icon = getArtifactIcon(config.artifactType)

  return (
    <Card className="rounded-lg border-dashed bg-muted/25 py-0 shadow-none">
      <CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ArtifactThumbnail({ artifact }: { artifact: ArtifactListItem }) {
  if (artifact.thumbnail_data_url) {
    return (
      <div className="relative aspect-video overflow-hidden border-b bg-muted">
        <img
          src={artifact.thumbnail_data_url}
          alt={`Preview de ${artifact.title}`}
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
      </div>
    )
  }

  const palette = getThumbnailPalette(artifact.title, artifact.status)
  const initials = getInitials(artifact.title)

  return (
    <div className={`relative aspect-video overflow-hidden border-b ${palette.border} bg-gradient-to-br ${palette.shell}`}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${palette.accent} text-xs font-semibold text-white shadow-sm`}>
          {initials}
        </div>
        <Badge variant={getStatusVariant(artifact.status)} className="bg-background/85">
          {getStatusLabel(artifact.status)}
        </Badge>
      </div>

      <div className="absolute inset-x-4 bottom-4 top-[34%] flex flex-col gap-3">
        <div className={`rounded-lg border ${palette.border} ${palette.card} p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]`}>
          <div className={`truncate text-sm font-semibold ${palette.text}`}>{artifact.title}</div>
          <div className="mt-2 flex gap-2">
            <div className={`h-2.5 w-16 rounded-full ${palette.accent} opacity-80`} />
            <div className="h-2.5 w-10 rounded-full bg-black/10" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-md border ${palette.border} ${palette.card} px-3 py-2 shadow-[0_6px_16px_rgba(15,23,42,0.04)]`}
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

function ArtifactCard({
  artifact,
  config,
  isEditing,
  draftTitle,
  isSaving,
  onStartRename,
  onDraftTitleChange,
  onSaveRename,
  onCancelRename,
  onDelete,
}: {
  artifact: ArtifactListItem
  config: ArtifactCatalogConfig
  isEditing: boolean
  draftTitle: string
  isSaving: boolean
  onStartRename: (artifact: ArtifactListItem) => void
  onDraftTitleChange: (value: string) => void
  onSaveRename: () => void
  onCancelRename: () => void
  onDelete: (artifact: ArtifactListItem) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const Icon = getArtifactIcon(config.artifactType)

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
    <Card className="group gap-0 overflow-hidden rounded-lg py-0 shadow-xs transition hover:shadow-md">
      <Link href={`/artifacts/${config.routeSegment}/${artifact.id}`} className="block">
        <ArtifactThumbnail artifact={artifact} />
      </Link>

      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <Input
                ref={inputRef}
                value={draftTitle}
                onChange={(event) => onDraftTitleChange(event.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={() => {
                  if (isSaving) return
                  void onSaveRename()
                }}
                disabled={isSaving}
                className="h-9 border bg-background text-sm font-medium"
              />
            ) : (
              <Link
                href={`/artifacts/${config.routeSegment}/${artifact.id}`}
                className="block truncate text-sm font-semibold text-foreground hover:underline"
                onDoubleClick={(event) => {
                  event.preventDefault()
                  onStartRename(artifact)
                }}
              >
                {artifact.title}
              </Link>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={getStatusVariant(artifact.status)}>{getStatusLabel(artifact.status)}</Badge>
              <span>Atualizado {formatRelativeDate(artifact.updated_at)}</span>
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void onSaveRename()}
              onMouseDown={(event) => event.preventDefault()}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelRename}
              onMouseDown={(event) => event.preventDefault()}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={`More actions for ${artifact.title}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem
                className="gap-2"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onStartRename(artifact)
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
                  onDelete(artifact)
                }}
              >
                <Trash2 className="h-4 w-4" />
                Apagar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  )
}

export function ArtifactListPage({
  artifacts,
  artifactType,
}: {
  artifacts: ArtifactListItem[]
  artifactType: ArtifactKind
}) {
  const config = ARTIFACT_CATALOG_CONFIG[artifactType]
  const [items, setItems] = useState(artifacts)
  const [query, setQuery] = useState('')
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [savingDashboardId, setSavingDashboardId] = useState<string | null>(null)
  const [deletingDashboardId, setDeletingDashboardId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ArtifactListItem | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setItems(artifacts)
  }, [artifacts])

  const startRename = (artifact: ArtifactListItem) => {
    setEditingDashboardId(artifact.id)
    setDraftTitle(artifact.title)
    setActionError(null)
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
    setActionError(null)
    try {
      const response = await fetch(`/api/artifacts/${config.routeSegment}/${dashboardId}`, {
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
      if (!response.ok || (!json?.artifact && !json?.dashboard)) {
        throw new Error(json?.error || `Falha ao renomear ${config.singularLabel}`)
      }

      const updatedDashboard = (json.artifact || json.dashboard) as ArtifactListItem
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
      setActionError(error instanceof Error ? error.message : `Falha ao renomear ${config.singularLabel}.`)
    } finally {
      setSavingDashboardId(null)
    }
  }

  const deleteDashboard = async () => {
    const artifact = deleteTarget
    if (!artifact) return

    setDeletingDashboardId(artifact.id)
    setActionError(null)
    try {
      const response = await fetch(`/api/artifacts/${config.routeSegment}/${artifact.id}`, {
        method: 'DELETE',
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(json?.error || `Falha ao apagar ${config.singularLabel}`)
      }

      setItems((current) => current.filter((item) => item.id !== artifact.id))
      if (editingDashboardId === artifact.id) {
        setEditingDashboardId(null)
        setDraftTitle('')
      }
      setDeleteTarget(null)
    } catch (error) {
      console.error(error)
      setActionError(error instanceof Error ? error.message : `Falha ao apagar ${config.singularLabel}.`)
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
    <main className="min-h-screen bg-background px-5 py-6 text-foreground md:px-8">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-normal text-foreground">{config.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto xl:justify-end">
              <label className="relative block w-full sm:w-[280px] xl:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={config.searchPlaceholder}
                  className="h-10 border bg-background pl-9"
                />
              </label>

              <Button
                type="button"
                variant="secondary"
                disabled
                className="h-10 justify-start sm:justify-center"
                title={`Criação de ${config.singularLabel} ainda não foi ligada nesta tela`}
              >
                <Plus className="h-4 w-4" />
                {config.newButtonLabel}
              </Button>
            </div>
          </div>
        </header>

        <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredDashboards.length} {filteredDashboards.length === 1 ? config.singularLabel : config.pluralLabel} encontrados
          </div>
          {actionError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </div>
          ) : null}
        </section>

        {items.length === 0 ? (
          <ArtifactEmptyState config={config} title={config.emptyTitle} description={config.emptyDescription} />
        ) : filteredDashboards.length === 0 ? (
          <ArtifactEmptyState
            config={config}
            title="Nenhum resultado"
            description={<>Nenhum {config.singularLabel} corresponde a <span className="font-medium text-foreground">{query}</span>.</>}
          />
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDashboards.map((dashboard) => (
              <ArtifactCard
                key={dashboard.id}
                artifact={dashboard}
                config={config}
                isEditing={editingDashboardId === dashboard.id}
                draftTitle={editingDashboardId === dashboard.id ? draftTitle : dashboard.title}
                isSaving={savingDashboardId === dashboard.id || deletingDashboardId === dashboard.id}
                onStartRename={startRename}
                onDraftTitleChange={setDraftTitle}
                onSaveRename={saveRename}
                onCancelRename={cancelRename}
                onDelete={setDeleteTarget}
              />
            ))}
          </section>
        )}
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => {
        if (!open && !deletingDashboardId) setDeleteTarget(null)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apagar {config.singularLabel}</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>Esta ação remove "{deleteTarget.title}" da lista. Não será possível desfazer.</>
              ) : (
                'Esta ação não poderá ser desfeita.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingDashboardId)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={deleteDashboard} disabled={Boolean(deletingDashboardId)}>
              {deletingDashboardId ? 'Apagando...' : 'Apagar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export function DashboardListPage({ dashboards }: { dashboards: DashboardListItem[] }) {
  return <ArtifactListPage artifacts={dashboards} artifactType="dashboard" />
}

'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { LayoutGrid, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type ArtifactCatalogItem = {
  id: string
  title: string
  summary: string
  status: 'draft' | 'published' | 'archived'
  updatedAt: string
  href: string
}

type ArtifactCatalogKind = 'dashboard'

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

function getInitials(title: string) {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AR'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function getThumbnailPalette(title: string, status: ArtifactCatalogItem['status']) {
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

function ArtifactCatalogThumbnail({ item }: { item: ArtifactCatalogItem }) {
  const palette = getThumbnailPalette(item.title, item.status)
  const initials = getInitials(item.title)

  return (
    <div className={`relative aspect-[1.75/1] overflow-hidden rounded-2xl border ${palette.border} bg-gradient-to-br ${palette.shell}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.85),transparent_42%)]" />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${palette.accent} text-xs font-semibold text-white shadow-sm`}>
          {initials}
        </div>
        <div className={`rounded-full border ${palette.border} ${palette.card} px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${palette.text}`}>
          {item.status}
        </div>
      </div>
      <div className="absolute inset-x-4 bottom-4 top-[30%] flex flex-col gap-3">
        <div className={`rounded-2xl border ${palette.border} ${palette.card} p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]`}>
          <div className={`text-sm font-semibold tracking-[-0.03em] ${palette.text}`}>{item.title}</div>
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

function ArtifactCatalogCard({ item }: { item: ArtifactCatalogItem }) {
  const router = useRouter()

  return (
    <article className="group">
      <Link href={item.href} className="block">
        <ArtifactCatalogThumbnail item={item} />
      </Link>

      <div className="flex items-start justify-between gap-3 px-1 pt-3">
        <div className="min-w-0 flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <LayoutGrid className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <Link
              href={item.href}
              className="block truncate text-[18px] font-semibold tracking-[-0.03em] text-[#171717]"
            >
              {item.title}
            </Link>
            <div className="mt-0.5 text-[14px] text-[#7a7a75]">{formatRelativeDate(item.updatedAt)}</div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5f5f5a] transition hover:bg-[#f0f0ee]"
              aria-label={`More actions for ${item.title}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuItem
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                router.push(item.href)
              }}
            >
              Abrir editor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}

export function ArtifactCatalogPage({
  title,
  description,
  primaryActionLabel,
  primaryActionHref,
  emptyTitle,
  emptyDescription,
  kind,
  items,
}: {
  title: string
  description: string
  primaryActionLabel: string
  primaryActionHref: string
  emptyTitle: string
  emptyDescription: string
  kind: ArtifactCatalogKind
  items: ArtifactCatalogItem[]
}) {
  const [query, setQuery] = useState('')
  void kind

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return items

    return items.filter((item) => {
      const haystack = [item.title, item.summary, item.status].join(' ').toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [items, query])

  return (
    <main className="min-h-screen bg-white px-8 py-9 text-[#171717]">
      <div className="mx-auto max-w-[1360px]">
        <header className="mb-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <h1
              className="text-[52px] font-semibold tracking-[-0.05em] text-[#101828]"
              style={{ fontFamily: 'var(--font-eb-garamond), "EB Garamond", serif' }}
            >
              {title}
            </h1>
            <Link
              href={primaryActionHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#171717] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2b2b29]"
            >
              <Plus className="h-4 w-4" />
              {primaryActionLabel}
            </Link>
          </div>
          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#6f6f6a]">{description}</p>
        </header>

        <div className="mb-7 flex max-w-xl items-center gap-2 rounded-full border border-[#e4e4df] bg-[#f8f8f6] px-4 py-2.5">
          <Search className="h-4 w-4 text-[#8a8a84]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar dashboards"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#171717] outline-none placeholder:text-[#9a9a94]"
          />
        </div>

        {filteredItems.length ? (
          <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredItems.map((item) => (
              <ArtifactCatalogCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <section className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#d8d8d2] bg-[#fafaf8] px-6 text-center">
            <LayoutGrid className="mb-4 h-8 w-8 text-[#8f8f89]" />
            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#171717]">{emptyTitle}</h2>
            <p className="mt-2 max-w-md text-[14px] leading-6 text-[#777770]">{emptyDescription}</p>
          </section>
        )}
      </div>
    </main>
  )
}

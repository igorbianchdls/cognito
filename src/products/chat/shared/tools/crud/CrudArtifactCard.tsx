"use client"

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Table as TableIcon } from 'lucide-react'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/shared/EntityDisplay'
import type { CrudRow, CrudToolViewModel } from '@/products/chat/shared/tools/crud/types'

type EntityKind = 'cliente' | 'fornecedor'

function safeExportName(title: string) {
  const cleaned = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned || 'crud_result'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[-\s]+/g, '_')
}

function isImageColumnKey(normalizedKey: string): boolean {
  return (
    normalizedKey.includes('imagem') ||
    normalizedKey.includes('image') ||
    normalizedKey.includes('avatar') ||
    normalizedKey.includes('foto') ||
    normalizedKey.includes('icone') ||
    normalizedKey.includes('icon')
  )
}

function getEntityKindFromColumn(column: string): EntityKind | null {
  const normalized = normalizeKey(column)
  if (normalized.includes('cliente')) return 'cliente'
  if (normalized.includes('fornecedor')) return 'fornecedor'
  return null
}

function pickEntityColumn(columns: string[]): string | null {
  let best: { key: string; score: number } | null = null

  for (const column of columns) {
    const normalized = normalizeKey(column)
    const kind = getEntityKindFromColumn(column)
    if (!kind) continue
    if (isImageColumnKey(normalized)) continue

    let score = 10
    if (normalized === kind) score = 0
    else if (normalized === `${kind}_nome` || normalized === `nome_${kind}`) score = 1
    else if (normalized.endsWith('_id')) score = 30
    else if (normalized.startsWith(`${kind}_`) || normalized.endsWith(`_${kind}`)) score = 4

    if (!best || score < best.score) best = { key: column, score }
  }

  return best?.key ?? null
}

function compactValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (Array.isArray(value)) return value.length ? `${value.length} itens` : '0 itens'
  if (isRecord(value)) {
    const firstLabel =
      (typeof value.nome === 'string' && value.nome) ||
      (typeof value.name === 'string' && value.name) ||
      (typeof value.titulo === 'string' && value.titulo) ||
      (typeof value.title === 'string' && value.title)
    if (firstLabel) return firstLabel
    return '[objeto]'
  }
  return String(value)
}

function pickEntityCellData(row: CrudRow, entityColumn: string): { name: string; imageUrl?: string } {
  const entityKind = getEntityKindFromColumn(entityColumn)
  const entityValue = row[entityColumn]

  const values: unknown[] = [entityValue]

  if (entityKind) {
    values.push(row[entityKind], row[`${entityKind}_nome`], row[`nome_${entityKind}`], row[`${entityKind}_fantasia`], row[`${entityKind}_razao_social`])
  }

  let name = ''
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      name = value.trim()
      break
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
      name = String(value)
      break
    }
    if (isRecord(value)) {
      const nestedName =
        (typeof value.nome === 'string' && value.nome.trim() && value.nome.trim()) ||
        (typeof value.name === 'string' && value.name.trim() && value.name.trim()) ||
        (typeof value.titulo === 'string' && value.titulo.trim() && value.titulo.trim()) ||
        (typeof value.title === 'string' && value.title.trim() && value.title.trim())
      if (nestedName) {
        name = nestedName
        break
      }
    }
  }
  if (!name) name = 'Sem nome'

  const imageCandidates: unknown[] = []
  if (isRecord(entityValue)) {
    imageCandidates.push(
      entityValue.imagem_url,
      entityValue.image_url,
      entityValue.avatar_url,
      entityValue.foto_url,
      entityValue.icon_url,
      entityValue.icone_url,
    )
  }
  imageCandidates.push(
    row[`${entityColumn}_imagem_url`],
    row[`${entityColumn}_image_url`],
    row[`${entityColumn}_avatar_url`],
    row[`${entityColumn}_foto_url`],
  )
  if (entityKind) {
    imageCandidates.push(
      row[`${entityKind}_imagem_url`],
      row[`${entityKind}_image_url`],
      row[`${entityKind}_avatar_url`],
      row[`imagem_${entityKind}_url`],
      row[`image_${entityKind}_url`],
    )
  }
  imageCandidates.push(row.imagem_url, row.image_url, row.avatar_url, row.foto_url, row.icon_url, row.icone_url)

  let imageUrl: string | undefined
  for (const value of imageCandidates) {
    if (typeof value === 'string' && value.trim()) {
      imageUrl = value.trim()
      break
    }
  }

  return { name, imageUrl }
}

function humanizeKey(key: string): string {
  const raw = key.replace(/[_-]+/g, ' ').trim()
  if (!raw) return key
  return raw.replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildColumns(keys: string[]): ColumnDef<CrudRow>[] {
  const entityColumn = pickEntityColumn(keys)
  const entityKind = entityColumn ? getEntityKindFromColumn(entityColumn) : null
  const filteredColumns = keys.filter((column) => {
    if (!entityKind) return true
    const normalized = normalizeKey(column)
    if (column === entityColumn) return true
    if (!isImageColumnKey(normalized)) return true
    return !normalized.includes(entityKind)
  })
  const finalColumns = entityColumn
    ? [entityColumn, ...filteredColumns.filter((column) => column !== entityColumn)]
    : filteredColumns

  return finalColumns.map((key) => ({
    accessorKey: key,
    header: humanizeKey(key),
    cell: ({ row }) => {
      if (entityColumn && key === entityColumn) {
        const entity = pickEntityCellData(row.original, entityColumn)
        return (
          <div className="max-w-[280px] overflow-hidden whitespace-nowrap">
            <EntityDisplay name={entity.name} imageUrl={entity.imageUrl} size={24} />
          </div>
        )
      }

      const value = row.getValue(key)
      return <span className="block max-w-[220px] truncate">{compactValue(value)}</span>
    },
  }))
}

export function CrudArtifactCard({ model }: { model: CrudToolViewModel }) {
  const columns = useMemo(() => buildColumns(model.columns), [model.columns])
  const message = model.ok
    ? model.message || `Consulta executada com sucesso (${model.count} registro(s)).`
    : model.error || model.message || 'Falha ao consultar dados.'

  return (
    <ArtifactDataTable<CrudRow>
      data={model.rows}
      columns={columns}
      title={model.title}
      icon={TableIcon}
      message={message}
      success={model.ok}
      count={model.count}
      error={model.error || undefined}
      exportFileName={safeExportName(model.title)}
      sqlQuery={model.sqlQuery || undefined}
    />
  )
}

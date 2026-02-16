"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import NexusShell from "@/components/navigation/nexus/NexusShell"
import ColumnActionsDialog from "@/products/airtable/frontend/features/column-actions/ColumnActionsDialog"
import { useAirtablePagination } from "@/products/airtable/frontend/features/pagination/useAirtablePagination"
import { useRecordEditing } from "@/products/airtable/frontend/features/record-editing/useRecordEditing"
import AirtableSchemaHeader from "@/products/airtable/frontend/features/schema-header/AirtableSchemaHeader"
import AirtableTableTabs from "@/products/airtable/frontend/features/table-tabs/AirtableTableTabs"
import AirtableTableViewCard from "@/products/airtable/frontend/features/table-view/AirtableTableViewCard"
import type {
  FieldRow,
  HeaderMenuTarget,
  RecordApiRow,
  SchemaRow,
  TableRow,
} from "@/products/airtable/frontend/features/table-view/types"

export default function AirtableSchemaPage() {
  const router = useRouter()
  const params = useParams<{ schemaId: string }>()
  const schemaId = String(params?.schemaId || "")

  const [schema, setSchema] = useState<SchemaRow | null>(null)
  const [tables, setTables] = useState<TableRow[]>([])
  const [selectedTableId, setSelectedTableId] = useState("")

  const [fields, setFields] = useState<FieldRow[]>([])
  const [records, setRecords] = useState<RecordApiRow[]>([])
  const [total, setTotal] = useState(0)

  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const [isLoadingTable, setIsLoadingTable] = useState(false)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [isCreatingField, setIsCreatingField] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [headerMenuTarget, setHeaderMenuTarget] = useState<HeaderMenuTarget>(null)

  const { pageIndex, pageSize, setPageIndex, setPageSize } = useAirtablePagination(50)

  const loadSchemaAndTables = useCallback(async () => {
    if (!schemaId) return

    setIsLoadingSchema(true)
    setError(null)

    try {
      const [schemaRes, tablesRes] = await Promise.all([
        fetch(`/api/airtable/schemas/${schemaId}`, { cache: "no-store" }),
        fetch(`/api/airtable/schemas/${schemaId}/tables`, { cache: "no-store" }),
      ])

      if (!schemaRes.ok) throw new Error(`HTTP ${schemaRes.status}`)
      if (!tablesRes.ok) throw new Error(`HTTP ${tablesRes.status}`)

      const schemaJson = await schemaRes.json()
      const tablesJson = await tablesRes.json()
      setSchema((schemaJson?.row || null) as SchemaRow | null)

      const nextTables = (tablesJson?.rows || []) as TableRow[]
      const list = Array.isArray(nextTables) ? nextTables : []
      setTables(list)

      setSelectedTableId((prev) => {
        if (prev && list.some((table) => table.id === prev)) return prev
        return list?.[0]?.id || ""
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar schema")
      setSchema(null)
      setTables([])
      setSelectedTableId("")
    } finally {
      setIsLoadingSchema(false)
    }
  }, [schemaId])

  const loadTableData = useCallback(async (tableId: string, nextPageIndex: number, nextPageSize: number) => {
    if (!tableId) return

    setIsLoadingTable(true)
    setError(null)

    try {
      const [fieldsRes, recordsRes] = await Promise.all([
        fetch(`/api/airtable/tables/${tableId}/fields`, { cache: "no-store" }),
        fetch(`/api/airtable/tables/${tableId}/records?page=${nextPageIndex + 1}&pageSize=${nextPageSize}`, {
          cache: "no-store",
        }),
      ])

      if (!fieldsRes.ok) throw new Error(`HTTP ${fieldsRes.status}`)
      if (!recordsRes.ok) throw new Error(`HTTP ${recordsRes.status}`)

      const fieldsJson = await fieldsRes.json()
      const recordsJson = await recordsRes.json()

      const nextFields = (fieldsJson?.rows || []) as FieldRow[]
      const nextRecords = (recordsJson?.rows || []) as RecordApiRow[]

      setFields(Array.isArray(nextFields) ? nextFields : [])
      setRecords(Array.isArray(nextRecords) ? nextRecords : [])
      setTotal(Number(recordsJson?.total ?? 0) || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar tabela")
      setFields([])
      setRecords([])
      setTotal(0)
    } finally {
      setIsLoadingTable(false)
    }
  }, [])

  useEffect(() => {
    void loadSchemaAndTables()
  }, [loadSchemaAndTables])

  useEffect(() => {
    setPageIndex(0)
  }, [selectedTableId, setPageIndex])

  useEffect(() => {
    if (!selectedTableId) return
    void loadTableData(selectedTableId, pageIndex, pageSize)
  }, [selectedTableId, pageIndex, pageSize, loadTableData])

  const fieldBySlug = useMemo(() => {
    const map = new Map<string, FieldRow>()
    for (const field of fields) map.set(field.slug, field)
    return map
  }, [fields])

  const { onCellEdit } = useRecordEditing({
    records,
    fieldBySlug,
    selectedTableId,
    pageIndex,
    pageSize,
    loadTableData,
    setError,
  })

  const createTable = async (input: { name: string; slug?: string }) => {
    if (!schemaId) return false

    setIsCreatingTable(true)
    setError(null)

    try {
      const res = await fetch(`/api/airtable/schemas/${schemaId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input.name, slug: input.slug }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `HTTP ${res.status}`)
      }

      await loadSchemaAndTables()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar tabela")
      return false
    } finally {
      setIsCreatingTable(false)
    }
  }

  const createField = async (input: {
    name: string
    slug?: string
    type: "text" | "number" | "bool" | "date" | "json"
  }) => {
    if (!selectedTableId) return false

    setIsCreatingField(true)
    setError(null)

    try {
      const res = await fetch(`/api/airtable/tables/${selectedTableId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input.name, slug: input.slug, type: input.type }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `HTTP ${res.status}`)
      }

      await loadTableData(selectedTableId, pageIndex, pageSize)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar campo")
      return false
    } finally {
      setIsCreatingField(false)
    }
  }

  const createRecord = async () => {
    if (!selectedTableId) return

    setError(null)

    try {
      const res = await fetch(`/api/airtable/tables/${selectedTableId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `HTTP ${res.status}`)
      }

      await loadTableData(selectedTableId, pageIndex, pageSize)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar registro")
    }
  }

  return (
    <NexusShell contentClassName="p-0" outerBg="#f9fafb" sidebarBorderless={false}>
      <div className="h-full flex flex-col">
        <AirtableSchemaHeader
          schemaName={schema?.name ?? null}
          schemaDescription={schema?.description ?? null}
          isCreatingTable={isCreatingTable}
          onBack={() => router.push("/airtable")}
          onCreateTable={createTable}
        />

        <AirtableTableTabs
          tables={tables}
          selectedTableId={selectedTableId}
          onSelectTable={setSelectedTableId}
        />

        <AirtableTableViewCard
          selectedTableId={selectedTableId}
          fields={fields}
          records={records}
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          isCreatingField={isCreatingField}
          onPaginationChange={({ pageIndex: p, pageSize: ps }) => {
            setPageIndex(p)
            setPageSize(ps)
          }}
          onCellEdit={onCellEdit}
          onOpenColumnActions={setHeaderMenuTarget}
          onCreateField={createField}
          onCreateRecord={createRecord}
        />

        {isLoadingSchema || isLoadingTable ? <div className="mt-3 text-sm text-muted-foreground">Carregando...</div> : null}
        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
      </div>

      <ColumnActionsDialog
        open={Boolean(headerMenuTarget)}
        onOpenChange={(open) => {
          if (!open) setHeaderMenuTarget(null)
        }}
        tableId={selectedTableId}
        target={headerMenuTarget}
        onChanged={async () => {
          if (!selectedTableId) return
          await loadTableData(selectedTableId, pageIndex, pageSize)
        }}
        onError={(message) => setError(message)}
      />
    </NexusShell>
  )
}

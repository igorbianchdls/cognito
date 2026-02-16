"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Table as TableIcon, Columns3, Rows3 } from "lucide-react"

import NexusShell from "@/components/navigation/nexus/NexusShell"
import PageHeader from "@/features/erp/frontend/components/PageHeader"
import TabsNav, { type Opcao } from "@/features/erp/frontend/components/TabsNav"
import DataTable, { type TableData } from "@/components/widgets/Table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SchemaRow = { id: string; name: string; description: string | null; created_at: string }
type TableRow = { id: string; name: string; slug: string; description: string | null; created_at: string }
type FieldRow = { id: string; name: string; slug: string; type: string; required: boolean; order: number }
type RecordApiRow = { id: string; title: string | null; created_at: string; updated_at: string; cells: Record<string, unknown> }

type Row = TableData & { id: string }

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "bool", label: "Booleano" },
  { value: "date", label: "Data" },
  { value: "json", label: "JSON" },
] as const

export default function AirtableSchemaPage() {
  const router = useRouter()
  const params = useParams<{ schemaId: string }>()
  const schemaId = String(params?.schemaId || "")

  const [schema, setSchema] = useState<SchemaRow | null>(null)
  const [tables, setTables] = useState<TableRow[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string>("")

  const [fields, setFields] = useState<FieldRow[]>([])
  const [records, setRecords] = useState<RecordApiRow[]>([])
  const [total, setTotal] = useState<number>(0)
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(50)

  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const [isLoadingTable, setIsLoadingTable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [openNewTable, setOpenNewTable] = useState(false)
  const [newTableName, setNewTableName] = useState("")
  const [newTableSlug, setNewTableSlug] = useState("")
  const [isCreatingTable, setIsCreatingTable] = useState(false)

  const [openNewField, setOpenNewField] = useState(false)
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldSlug, setNewFieldSlug] = useState("")
  const [newFieldType, setNewFieldType] = useState<(typeof FIELD_TYPES)[number]["value"]>("text")
  const [isCreatingField, setIsCreatingField] = useState(false)

  const loadSchemaAndTables = async () => {
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
      const rows = (tablesJson?.rows || []) as TableRow[]
      const list = Array.isArray(rows) ? rows : []
      setTables(list)

      setSelectedTableId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev
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
  }

  const loadTableData = async (tableId: string, pIndex: number, pSize: number) => {
    if (!tableId) return
    setIsLoadingTable(true)
    setError(null)
    try {
      const [fieldsRes, recordsRes] = await Promise.all([
        fetch(`/api/airtable/tables/${tableId}/fields`, { cache: "no-store" }),
        fetch(`/api/airtable/tables/${tableId}/records?page=${pIndex + 1}&pageSize=${pSize}`, { cache: "no-store" }),
      ])
      if (!fieldsRes.ok) throw new Error(`HTTP ${fieldsRes.status}`)
      if (!recordsRes.ok) throw new Error(`HTTP ${recordsRes.status}`)

      const fieldsJson = await fieldsRes.json()
      const recordsJson = await recordsRes.json()
      const f = (fieldsJson?.rows || []) as FieldRow[]
      const r = (recordsJson?.rows || []) as RecordApiRow[]
      setFields(Array.isArray(f) ? f : [])
      setRecords(Array.isArray(r) ? r : [])
      setTotal(Number(recordsJson?.total ?? 0) || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar tabela")
      setFields([])
      setRecords([])
      setTotal(0)
    } finally {
      setIsLoadingTable(false)
    }
  }

  useEffect(() => {
    loadSchemaAndTables()
  }, [schemaId])

  useEffect(() => {
    setPageIndex(0)
  }, [selectedTableId])

  useEffect(() => {
    if (!selectedTableId) return
    loadTableData(selectedTableId, pageIndex, pageSize)
  }, [selectedTableId, pageIndex, pageSize])

  const tabsOptions: Opcao[] = useMemo(
    () =>
      tables.map((t) => ({
        value: t.id,
        label: t.name,
        icon: <TableIcon className="h-4 w-4" />,
      })),
    [tables]
  )

  const fieldBySlug = useMemo(() => {
    const m = new Map<string, FieldRow>()
    for (const f of fields) m.set(f.slug, f)
    return m
  }, [fields])

  const tableData: Row[] = useMemo(() => {
    return records.map((rec) => {
      const row: Record<string, string | number | boolean | null | undefined> = {
        id: rec.id,
        title: rec.title ?? "",
      }
      for (const f of fields) {
        const v = (rec.cells || {})[f.slug]
        if (v == null) row[f.slug] = null
        else if (f.type === "json") row[f.slug] = JSON.stringify(v)
        else row[f.slug] = v as string | number | boolean
      }
      return row as Row
    })
  }, [records, fields])

  const columns: ColumnDef<Row>[] = useMemo(() => {
    const cols: ColumnDef<Row>[] = [
      { accessorKey: "title", id: "title", header: "Título" },
      ...fields.map((f) => ({
        accessorKey: f.slug,
        id: f.slug,
        header: f.name,
      })),
    ]
    return cols
  }, [fields])

  const createTable = async () => {
    const n = newTableName.trim()
    if (!n || !schemaId) return
    setIsCreatingTable(true)
    try {
      const res = await fetch(`/api/airtable/schemas/${schemaId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, slug: newTableSlug.trim() || undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`)
      setOpenNewTable(false)
      setNewTableName("")
      setNewTableSlug("")
      await loadSchemaAndTables()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar tabela")
    } finally {
      setIsCreatingTable(false)
    }
  }

  const createField = async () => {
    const n = newFieldName.trim()
    if (!n || !selectedTableId) return
    setIsCreatingField(true)
    try {
      const res = await fetch(`/api/airtable/tables/${selectedTableId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, slug: newFieldSlug.trim() || undefined, type: newFieldType }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`)
      setOpenNewField(false)
      setNewFieldName("")
      setNewFieldSlug("")
      setNewFieldType("text")
      await loadTableData(selectedTableId, pageIndex, pageSize)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar campo")
    } finally {
      setIsCreatingField(false)
    }
  }

  const createRecord = async () => {
    if (!selectedTableId) return
    try {
      const res = await fetch(`/api/airtable/tables/${selectedTableId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`)
      await loadTableData(selectedTableId, pageIndex, pageSize)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar registro")
    }
  }

  const onCellEdit = async (rowIndex: number, columnKey: string, newValue: unknown) => {
    if (columnKey === "title") return
    const rec = records[rowIndex]
    const field = fieldBySlug.get(columnKey)
    if (!rec?.id || !field?.id) return
    try {
      await fetch(`/api/airtable/records/cells`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: [{ record_id: rec.id, field_id: field.id, value: newValue }] }),
      })
    } catch {
      // keep UI optimistic for now
    }
  }

  return (
    <NexusShell contentClassName="p-0" outerBg="#f9fafb" sidebarBorderless={false}>
      <div className="h-full flex flex-col">
        <PageHeader
          title={schema?.name ? `Airtable: ${schema.name}` : "Airtable"}
          subtitle={schema?.description || "Crie tabelas, campos e registros"}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => router.push("/airtable")}>
                Voltar
              </Button>
              <Dialog open={openNewTable} onOpenChange={setOpenNewTable}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova tabela
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova tabela</DialogTitle>
                    <DialogDescription>Crie uma tabela dentro deste schema.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome</label>
                      <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="Ex: Clientes" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug (opcional)</label>
                      <Input value={newTableSlug} onChange={(e) => setNewTableSlug(e.target.value)} placeholder="Ex: clientes" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpenNewTable(false)} disabled={isCreatingTable}>
                      Cancelar
                    </Button>
                    <Button onClick={createTable} disabled={isCreatingTable || !newTableName.trim()}>
                      Criar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <div className="pt-1">
          {tabsOptions.length > 0 ? (
            <TabsNav
              options={tabsOptions}
              value={selectedTableId}
              onValueChange={setSelectedTableId}
              fontFamily="var(--font-geist-sans)"
              fontSize={15}
              fontWeight="400"
              color="rgb(99, 99, 99)"
              letterSpacing={-0.3}
              iconSize={16}
              labelOffsetY={8}
              startOffset={22}
              activeColor="rgb(41, 41, 41)"
              activeFontWeight="500"
              activeBorderColor="rgb(41, 41, 41)"
              className="px-0 md:px-0"
            />
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma tabela ainda. Clique em "Nova tabela".</div>
          )}
        </div>

        <div className="flex-1 min-h-0 p-4 md:p-6">
          <div className="bg-white rounded-lg border h-full flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Rows3 className="h-4 w-4" />
                Registros
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={openNewField} onOpenChange={setOpenNewField}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary" disabled={!selectedTableId}>
                      <Columns3 className="h-4 w-4 mr-2" />
                      Novo campo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo campo</DialogTitle>
                      <DialogDescription>Adicione um campo na tabela atual.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome</label>
                        <Input value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Ex: Email" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Slug (opcional)</label>
                        <Input value={newFieldSlug} onChange={(e) => setNewFieldSlug(e.target.value)} placeholder="Ex: email" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo</label>
                        <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as (typeof FIELD_TYPES)[number]["value"])}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setOpenNewField(false)} disabled={isCreatingField}>
                        Cancelar
                      </Button>
                      <Button onClick={createField} disabled={isCreatingField || !newFieldName.trim()}>
                        Criar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button size="sm" onClick={createRecord} disabled={!selectedTableId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo registro
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <DataTable<Row>
                columns={columns}
                data={tableData}
                enableSearch
                showPagination
                pageSize={pageSize}
                serverSidePagination
                serverTotalRows={total}
                pageIndex={pageIndex}
                onPaginationChange={({ pageIndex: p, pageSize: ps }) => {
                  setPageIndex(p)
                  setPageSize(ps)
                }}
                editableMode
                editableCells={fields.map((f) => f.slug)}
                onCellEdit={onCellEdit}
              />
            </div>
          </div>

          {isLoadingSchema || isLoadingTable ? <div className="mt-3 text-sm text-muted-foreground">Carregando...</div> : null}
          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
        </div>
      </div>
    </NexusShell>
  )
}

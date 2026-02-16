import type { FieldRow, RecordApiRow } from "@/products/airtable/frontend/features/table-view/types"

type UseRecordEditingParams = {
  records: RecordApiRow[]
  fieldBySlug: Map<string, FieldRow>
  selectedTableId: string
  pageIndex: number
  pageSize: number
  loadTableData: (tableId: string, pageIndex: number, pageSize: number) => Promise<void>
  setError: (message: string | null) => void
}

function normalizeFieldValue(field: FieldRow, rawValue: unknown): unknown {
  if (rawValue == null || rawValue === "") return null

  const t = String(field.type || "").toLowerCase()
  if (t === "number") {
    const n = Number(rawValue)
    return Number.isFinite(n) ? n : rawValue
  }

  if (t === "bool") {
    if (typeof rawValue === "boolean") return rawValue
    const txt = String(rawValue).trim().toLowerCase()
    if (["1", "true", "sim", "yes"].includes(txt)) return true
    if (["0", "false", "nao", "não", "no"].includes(txt)) return false
    return rawValue
  }

  if (t === "json") {
    if (typeof rawValue === "string") {
      try {
        return JSON.parse(rawValue)
      } catch {
        return rawValue
      }
    }
    return rawValue
  }

  return rawValue
}

export function useRecordEditing({
  records,
  fieldBySlug,
  selectedTableId,
  pageIndex,
  pageSize,
  loadTableData,
  setError,
}: UseRecordEditingParams) {
  const onCellEdit = async (
    rowIndex: number,
    columnKey: string,
    newValue: string | number | boolean | null | undefined
  ) => {
    const rec = records[rowIndex]
    if (!rec?.id) return
    setError(null)

    try {
      if (columnKey === "title") {
        const res = await fetch(`/api/airtable/tables/${selectedTableId}/records`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordId: rec.id,
            title: newValue == null || newValue === "" ? null : String(newValue),
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || `HTTP ${res.status}`)
        }
        return
      }

      const field = fieldBySlug.get(columnKey)
      if (!field?.id) return

      const normalized = normalizeFieldValue(field, newValue)
      const res = await fetch(`/api/airtable/records/cells`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ record_id: rec.id, field_id: field.id, value: normalized }],
        }),
      })
      const json = await res.json().catch(() => ({}))
      const failed = Array.isArray(json?.results)
        ? json.results.find((r: { ok?: boolean; message?: string }) => r?.ok === false)
        : null

      if (!res.ok || json?.success === false || failed) {
        throw new Error((failed && failed.message) || json?.message || `HTTP ${res.status}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar célula")
      if (selectedTableId) await loadTableData(selectedTableId, pageIndex, pageSize)
    }
  }

  return { onCellEdit }
}

"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"

import DataTable, { type TableData } from "@/components/widgets/Table"
import { getFieldTypeIcon } from "@/products/airtable/frontend/features/field-icons/fieldIcons"
import NewFieldDialogButton from "@/products/airtable/frontend/features/column-management/NewFieldDialogButton"
import NewRecordButton from "@/products/airtable/frontend/features/record-management/NewRecordButton"
import type { FieldRow, HeaderMenuTarget, RecordApiRow } from "@/products/airtable/frontend/features/table-view/types"

type Row = TableData & { id: string }

type AirtableTableViewCardProps = {
  selectedTableId: string
  fields: FieldRow[]
  records: RecordApiRow[]
  total: number
  pageIndex: number
  pageSize: number
  isCreatingField: boolean
  onPaginationChange: (info: { pageIndex: number; pageSize: number }) => void
  onCellEdit: (rowIndex: number, columnKey: string, newValue: string | number | boolean | null | undefined) => void | Promise<void>
  onOpenColumnActions: (target: HeaderMenuTarget) => void
  onCreateField: (input: { name: string; slug?: string; type: "text" | "number" | "bool" | "date" | "json" }) => Promise<boolean>
  onCreateRecord: () => Promise<void>
}

export default function AirtableTableViewCard({
  selectedTableId,
  fields,
  records,
  total,
  pageIndex,
  pageSize,
  isCreatingField,
  onPaginationChange,
  onCellEdit,
  onOpenColumnActions,
  onCreateField,
  onCreateRecord,
}: AirtableTableViewCardProps) {
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
    const renderColumnHeader = (
      label: string,
      type: string,
      fieldId: string | null,
      required?: boolean,
      slug?: string
    ) => (
      <div className="inline-flex items-center gap-1.5">
        {getFieldTypeIcon({ type, name: label, slug })}
        <span>{label}</span>
        <button
          type="button"
          className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation()
            onOpenColumnActions({ fieldId, label, type, required })
          }}
          aria-label={`Opções da coluna ${label}`}
          title={`Opções da coluna ${label}`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    )

    return [
      {
        accessorKey: "title",
        id: "title",
        header: () => renderColumnHeader("Título", "text", null, false, "title"),
      },
      ...fields.map((f) => ({
        accessorKey: f.slug,
        id: f.slug,
        header: () => renderColumnHeader(f.name, f.type, f.id, f.required, f.slug),
      })),
    ]
  }, [fields, onOpenColumnActions])

  const columnOptions = useMemo(() => {
    const opts: Record<string, { cellNoWrap?: boolean }> = { title: { cellNoWrap: true } }
    for (const f of fields) {
      opts[f.slug] = { cellNoWrap: true }
    }
    return opts
  }, [fields])

  return (
    <div className="flex-1 min-h-0 pb-4 md:pb-6">
      <div className="bg-white border-b border-x-0 rounded-none h-full flex flex-col overflow-hidden">
        <div className="px-0 py-2 border-b flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <NewFieldDialogButton
              disabled={!selectedTableId}
              isCreating={isCreatingField}
              onCreateField={onCreateField}
            />
            <NewRecordButton disabled={!selectedTableId} onCreateRecord={onCreateRecord} />
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <DataTable<Row>
            columns={columns}
            data={tableData}
            enableSearch
            showPagination
            pageSize={pageSize}
            padding={8}
            headerPadding={3}
            columnOptions={columnOptions}
            serverSidePagination
            serverTotalRows={total}
            pageIndex={pageIndex}
            onPaginationChange={({ pageIndex: p, pageSize: ps }) => {
              onPaginationChange({ pageIndex: p, pageSize: ps })
            }}
            editableMode
            editTrigger="click"
            saveBehavior="onBlur"
            editableCells={["title", ...fields.map((f) => f.slug)]}
            onCellEdit={onCellEdit}
          />
        </div>
      </div>
    </div>
  )
}

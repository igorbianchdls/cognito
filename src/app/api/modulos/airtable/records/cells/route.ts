import { NextRequest } from "next/server"
import { withTransaction } from "@/lib/postgres"
import { getTenantId } from "../../_shared"

export const maxDuration = 300
export const dynamic = "force-dynamic"
export const revalidate = 0

type CellUpdate = {
  record_id: string
  field_id: string
  value: unknown
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req)
    const body = (await req.json().catch(() => ({}))) as { updates?: CellUpdate[] }
    const updates = Array.isArray(body?.updates) ? body.updates : []
    if (updates.length === 0) return Response.json({ success: false, message: "updates é obrigatório" }, { status: 400 })
    if (updates.length > 200) return Response.json({ success: false, message: "updates muito grande" }, { status: 413 })

    const result = await withTransaction(async (client) => {
      const out: { record_id: string; field_id: string; ok: boolean; message?: string }[] = []

      for (const u of updates) {
        const recordId = String(u?.record_id || "")
        const fieldId = String(u?.field_id || "")
        if (!recordId || !fieldId) {
          out.push({ record_id: recordId, field_id: fieldId, ok: false, message: "record_id/field_id obrigatórios" })
          continue
        }

        const fieldQ = await client.query(
          `select f.type, f.table_id::text as table_id, f.schema_id::text as schema_id
           from airtable."field" f
           where f.tenant_id = $1 and f.id = $2::uuid
           limit 1`,
          [tenantId, fieldId]
        )
        if (fieldQ.rows.length === 0) {
          out.push({ record_id: recordId, field_id: fieldId, ok: false, message: "field não encontrado" })
          continue
        }
        const field = fieldQ.rows[0] as { type: string; table_id: string; schema_id: string }

        // Ensure record belongs to same table/schema and tenant.
        const recQ = await client.query(
          `select 1
           from airtable."record" r
           where r.tenant_id = $1
             and r.id = $2::uuid
             and r.table_id = $3::uuid
             and r.schema_id = $4::uuid
           limit 1`,
          [tenantId, recordId, field.table_id, field.schema_id]
        )
        if (recQ.rows.length === 0) {
          out.push({ record_id: recordId, field_id: fieldId, ok: false, message: "record não encontrado (ou não pertence à tabela)" })
          continue
        }

        const t = String(field.type || "text").toLowerCase()
        const v = u.value

        // Normalize value per type.
        let set = { text: null as string | null, number: null as string | null, bool: null as boolean | null, date: null as string | null, json: null as string | null }
        if (v == null || v === "") {
          // keep all null to "clear" cell
        } else if (t === "number") {
          const n = Number(v)
          if (!Number.isFinite(n)) {
            out.push({ record_id: recordId, field_id: fieldId, ok: false, message: "valor inválido para number" })
            continue
          }
          set.number = String(n)
        } else if (t === "bool") {
          if (typeof v === "boolean") set.bool = v
          else if (String(v).toLowerCase() === "true") set.bool = true
          else if (String(v).toLowerCase() === "false") set.bool = false
          else {
            out.push({ record_id: recordId, field_id: fieldId, ok: false, message: "valor inválido para bool" })
            continue
          }
        } else if (t === "date") {
          const s = String(v)
          // Expect YYYY-MM-DD, keep as-is (Postgres will validate).
          set.date = s
        } else if (t === "json") {
          try {
            set.json = JSON.stringify(v)
          } catch {
            out.push({ record_id: recordId, field_id: fieldId, ok: false, message: "valor inválido para json" })
            continue
          }
        } else {
          set.text = String(v)
        }

        await client.query(
          `
          insert into airtable."cell" (tenant_id, schema_id, table_id, record_id, field_id, text, number, bool, date, json, updated_at)
          values ($1, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7::numeric, $8::boolean, $9::date, $10::jsonb, now())
          on conflict (record_id, field_id) do update
          set text = excluded.text,
              number = excluded.number,
              bool = excluded.bool,
              date = excluded.date,
              json = excluded.json,
              updated_at = now()
          `,
          [
            tenantId,
            field.schema_id,
            field.table_id,
            recordId,
            fieldId,
            set.text,
            set.number,
            set.bool,
            set.date,
            set.json,
          ]
        )

        // Touch record updated_at
        await client.query(
          `update airtable."record" set updated_at = now() where tenant_id = $1 and id = $2::uuid`,
          [tenantId, recordId]
        )

        out.push({ record_id: recordId, field_id: fieldId, ok: true })
      }

      return out
    })

    return Response.json({ success: true, results: result }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/records/cells POST error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

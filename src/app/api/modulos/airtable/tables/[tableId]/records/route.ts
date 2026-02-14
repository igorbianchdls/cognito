import { NextRequest } from "next/server"
import { runQuery, withTransaction } from "@/lib/postgres"
import { getTenantId, maxDuration, dynamic, revalidate } from "../../../_shared"

export { maxDuration, dynamic, revalidate }

const parseNumber = (v: string | null, fallback: number) => {
  const n = Number.parseInt(String(v ?? ""), 10)
  return Number.isFinite(n) ? n : fallback
}

export async function GET(req: NextRequest, ctx: { params: { tableId: string } }) {
  try {
    const tenantId = getTenantId(req)
    const { tableId } = ctx.params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseNumber(searchParams.get("page"), 1))
    const pageSize = Math.max(1, Math.min(200, parseNumber(searchParams.get("pageSize"), 50)))
    const offset = (page - 1) * pageSize

    const totalRows = await runQuery<{ n: number }>(
      `select count(*)::int as n from airtable."record" where tenant_id = $1 and table_id = $2::uuid`,
      [tenantId, tableId]
    )
    const total = totalRows?.[0]?.n ?? 0

    // Return rows with a 'cells' json object keyed by field.slug
    const rows = await runQuery<{ id: string; title: string | null; created_at: string; updated_at: string; cells: unknown }>(
      `
      select
        r.id::text as id,
        r.title,
        r.created_at::text as created_at,
        r.updated_at::text as updated_at,
        coalesce(
          jsonb_object_agg(
            f.slug,
            case f.type
              when 'number' then to_jsonb(c.number)
              when 'bool' then to_jsonb(c.bool)
              when 'date' then to_jsonb(c.date)
              when 'json' then c.json
              else to_jsonb(c.text)
            end
          ) filter (where f.id is not null),
          '{}'::jsonb
        ) as cells
      from airtable."record" r
      left join airtable."cell" c
        on c.record_id = r.id
       and c.tenant_id = r.tenant_id
      left join airtable."field" f
        on f.id = c.field_id
       and f.tenant_id = r.tenant_id
      where r.tenant_id = $1 and r.table_id = $2::uuid
      group by r.id
      order by r.created_at desc
      limit $3 offset $4
      `,
      [tenantId, tableId, pageSize, offset]
    )

    return Response.json({ success: true, rows, total, page, pageSize }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/tables/[tableId]/records GET error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: { tableId: string } }) {
  try {
    const tenantId = getTenantId(req)
    const { tableId } = ctx.params
    const body = (await req.json().catch(() => ({}))) as { title?: string | null }
    const title = body?.title != null ? String(body.title) : null

    const created = await withTransaction(async (client) => {
      const tbl = await client.query(
        `select schema_id::text as schema_id
         from airtable."table"
         where tenant_id = $1 and id = $2::uuid
         limit 1`,
        [tenantId, tableId]
      )
      if (tbl.rows.length === 0) return { ok: false as const, notFound: true as const, row: null as const }
      const schemaId = String((tbl.rows[0] as { schema_id: string }).schema_id)

      const ins = await client.query(
        `insert into airtable."record" (tenant_id, schema_id, table_id, title)
         values ($1, $2::uuid, $3::uuid, $4)
         returning id::text as id, title, created_at::text, updated_at::text`,
        [tenantId, schemaId, tableId, title]
      )
      return { ok: true as const, notFound: false as const, row: ins.rows[0] }
    })

    if (created.notFound) {
      return Response.json({ success: false, message: "Tabela não encontrada" }, { status: 404 })
    }
    if (!created.ok || !created.row) {
      return Response.json({ success: false, message: "Falha ao criar registro" }, { status: 500 })
    }

    return Response.json({ success: true, row: created.row }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/tables/[tableId]/records POST error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

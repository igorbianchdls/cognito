import { NextRequest } from "next/server"
import { runQuery, withTransaction } from "@/lib/postgres"
import { getTenantId, maxDuration, dynamic, revalidate, toSlug } from "../../../_shared"

export { maxDuration, dynamic, revalidate }

const ALLOWED_TYPES = new Set(["text", "number", "bool", "date", "json", "select", "multi_select", "link"])

export async function GET(req: NextRequest, ctx: { params: { tableId: string } }) {
  try {
    const tenantId = getTenantId(req)
    const { tableId } = ctx.params
    const rows = await runQuery<{
      id: string
      name: string
      slug: string
      type: string
      required: boolean
      config: unknown
      order: number
      created_at: string
    }>(
      `select id::text as id,
              name,
              slug,
              type,
              required,
              config,
              "order" as "order",
              created_at::text
       from airtable."field"
       where tenant_id = $1 and table_id = $2::uuid
       order by "order" asc, created_at asc`,
      [tenantId, tableId]
    )
    return Response.json({ success: true, rows }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/tables/[tableId]/fields GET error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: { tableId: string } }) {
  try {
    const tenantId = getTenantId(req)
    const { tableId } = ctx.params
    const body = (await req.json().catch(() => ({}))) as {
      name?: string
      slug?: string
      type?: string
      required?: boolean
      config?: unknown
      order?: number
    }

    const name = String(body?.name || "").trim()
    if (!name) return Response.json({ success: false, message: "name é obrigatório" }, { status: 400 })

    const type = String(body?.type || "text").trim().toLowerCase()
    if (!ALLOWED_TYPES.has(type)) return Response.json({ success: false, message: "type inválido" }, { status: 400 })

    const slug = toSlug(body?.slug ? String(body.slug) : name)
    const required = !!body?.required
    const config = body?.config ?? {}
    const order = Number.isFinite(Number(body?.order)) ? Number(body.order) : 0

    const created = await withTransaction(async (client) => {
      const tbl = await client.query(
        `select schema_id::text as schema_id
         from airtable."table"
         where tenant_id = $1 and id = $2::uuid
         limit 1`,
        [tenantId, tableId]
      )
      if (tbl.rows.length === 0) return { ok: false as const, notFound: true as const, conflict: false as const, row: null as const }
      const schemaId = String((tbl.rows[0] as { schema_id: string }).schema_id)

      const exists = await client.query(
        `select 1 from airtable."field" where tenant_id = $1 and table_id = $2::uuid and lower(slug) = lower($3) limit 1`,
        [tenantId, tableId, slug]
      )
      if (exists.rows.length > 0) return { ok: false as const, notFound: false as const, conflict: true as const, row: null as const }

      const ins = await client.query(
        `insert into airtable."field" (tenant_id, schema_id, table_id, name, slug, type, required, config, "order")
         values ($1, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::jsonb, $9)
         returning id::text as id, name, slug, type, required, config, "order" as "order", created_at::text`,
        [tenantId, schemaId, tableId, name, slug, type, required, JSON.stringify(config), order]
      )
      return { ok: true as const, notFound: false as const, conflict: false as const, row: ins.rows[0] }
    })

    if (created.notFound) {
      return Response.json({ success: false, message: "Tabela não encontrada" }, { status: 404 })
    }
    if (created.conflict) {
      return Response.json({ success: false, message: "Campo já existe (slug)" }, { status: 409 })
    }
    if (!created.ok || !created.row) {
      return Response.json({ success: false, message: "Falha ao criar campo" }, { status: 500 })
    }
    return Response.json({ success: true, row: created.row }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/tables/[tableId]/fields POST error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

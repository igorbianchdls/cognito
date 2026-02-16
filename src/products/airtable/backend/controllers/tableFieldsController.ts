import { NextRequest } from "next/server"
import { runQuery, withTransaction } from "@/lib/postgres"
import { getTenantId, toSlug } from "@/products/airtable/backend/shared"

export const maxDuration = 300
export const dynamic = "force-dynamic"
export const revalidate = 0

const ALLOWED_TYPES = new Set(["text", "number", "bool", "date", "json", "select", "multi_select", "link"])

export async function GET(req: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    const tenantId = getTenantId(req)
    const { tableId } = await context.params
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
    console.error("🧩 API /api/airtable/tables/[tableId]/fields GET error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    const tenantId = getTenantId(req)
    const { tableId } = await context.params
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
      if (tbl.rows.length === 0) return { ok: false as const, notFound: true as const, conflict: false as const, row: null }
      const schemaId = String((tbl.rows[0] as { schema_id: string }).schema_id)

      const exists = await client.query(
        `select 1 from airtable."field" where tenant_id = $1 and table_id = $2::uuid and lower(slug) = lower($3) limit 1`,
        [tenantId, tableId, slug]
      )
      if (exists.rows.length > 0) return { ok: false as const, notFound: false as const, conflict: true as const, row: null }

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
    console.error("🧩 API /api/airtable/tables/[tableId]/fields POST error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    const tenantId = getTenantId(req)
    const { tableId } = await context.params
    const body = (await req.json().catch(() => ({}))) as {
      fieldId?: string
      name?: string
      slug?: string
      type?: string
      required?: boolean
      config?: unknown
      order?: number
    }

    const fieldId = String(body?.fieldId || "").trim()
    if (!fieldId) return Response.json({ success: false, message: "fieldId é obrigatório" }, { status: 400 })

    if (typeof body?.name !== "undefined" && !String(body.name || "").trim()) {
      return Response.json({ success: false, message: "name inválido" }, { status: 400 })
    }

    if (typeof body?.type !== "undefined") {
      const t = String(body.type || "").trim().toLowerCase()
      if (!ALLOWED_TYPES.has(t)) return Response.json({ success: false, message: "type inválido" }, { status: 400 })
    }

    const updated = await withTransaction(async (client) => {
      const currentQ = await client.query<{
        id: string
        name: string
        slug: string
        type: string
        required: boolean
        config: unknown
        order: number
      }>(
        `select id::text as id, name, slug, type, required, config, "order" as "order"
         from airtable."field"
         where tenant_id = $1 and table_id = $2::uuid and id = $3::uuid
         limit 1`,
        [tenantId, tableId, fieldId]
      )

      if (currentQ.rows.length === 0) {
        return { ok: false as const, notFound: true as const, conflict: false as const, row: null }
      }

      const current = currentQ.rows[0]
      const nextName = typeof body?.name !== "undefined" ? String(body.name).trim() : current.name
      const nextSlug = typeof body?.slug !== "undefined" ? toSlug(String(body.slug || "")) : current.slug
      const nextType = typeof body?.type !== "undefined" ? String(body.type || "").trim().toLowerCase() : current.type
      const nextRequired = typeof body?.required !== "undefined" ? Boolean(body.required) : current.required
      const nextConfig = typeof body?.config !== "undefined" ? body.config : (current.config ?? {})
      const nextOrder = Number.isFinite(Number(body?.order)) ? Number(body?.order) : current.order

      const conflictQ = await client.query(
        `select 1
         from airtable."field"
         where tenant_id = $1
           and table_id = $2::uuid
           and id <> $3::uuid
           and lower(slug) = lower($4)
         limit 1`,
        [tenantId, tableId, fieldId, nextSlug]
      )
      if (conflictQ.rows.length > 0) {
        return { ok: false as const, notFound: false as const, conflict: true as const, row: null }
      }

      const upd = await client.query(
        `update airtable."field"
         set name = $4,
             slug = $5,
             type = $6,
             required = $7,
             config = $8::jsonb,
             "order" = $9
         where tenant_id = $1 and table_id = $2::uuid and id = $3::uuid
         returning id::text as id, name, slug, type, required, config, "order" as "order", created_at::text`,
        [tenantId, tableId, fieldId, nextName, nextSlug, nextType, nextRequired, JSON.stringify(nextConfig ?? {}), nextOrder]
      )

      return { ok: true as const, notFound: false as const, conflict: false as const, row: upd.rows[0] }
    })

    if (updated.notFound) {
      return Response.json({ success: false, message: "Campo não encontrado" }, { status: 404 })
    }
    if (updated.conflict) {
      return Response.json({ success: false, message: "Slug de campo já existe nesta tabela" }, { status: 409 })
    }
    if (!updated.ok || !updated.row) {
      return Response.json({ success: false, message: "Falha ao atualizar campo" }, { status: 500 })
    }
    return Response.json({ success: true, row: updated.row }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/airtable/tables/[tableId]/fields PATCH error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  try {
    const tenantId = getTenantId(req)
    const { tableId } = await context.params
    const body = (await req.json().catch(() => ({}))) as { fieldId?: string }
    const fieldId = String(body?.fieldId || "").trim()
    if (!fieldId) return Response.json({ success: false, message: "fieldId é obrigatório" }, { status: 400 })

    const result = await withTransaction(async (client) => {
      await client.query(
        `delete from airtable."cell"
         where tenant_id = $1 and table_id = $2::uuid and field_id = $3::uuid`,
        [tenantId, tableId, fieldId]
      )

      const del = await client.query(
        `delete from airtable."field"
         where tenant_id = $1 and table_id = $2::uuid and id = $3::uuid
         returning id::text as id`,
        [tenantId, tableId, fieldId]
      )
      if (del.rows.length === 0) return { ok: false as const, notFound: true as const }
      return { ok: true as const, notFound: false as const }
    })

    if (result.notFound) {
      return Response.json({ success: false, message: "Campo não encontrado" }, { status: 404 })
    }
    return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/airtable/tables/[tableId]/fields DELETE error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

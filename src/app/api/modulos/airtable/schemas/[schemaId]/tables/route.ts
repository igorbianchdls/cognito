import { NextRequest } from "next/server"
import { runQuery, withTransaction } from "@/lib/postgres"
import { getTenantId, toSlug } from "../../../_shared"

export const maxDuration = 300
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest, ctx: { params: { schemaId: string } }) {
  try {
    const tenantId = getTenantId(req)
    const { schemaId } = ctx.params
    const rows = await runQuery<{ id: string; name: string; slug: string; description: string | null; created_at: string }>(
      `select id::text as id, name, slug, description, created_at::text
       from airtable."table"
       where tenant_id = $1 and schema_id = $2::uuid
       order by created_at asc, name asc`,
      [tenantId, schemaId]
    )
    return Response.json({ success: true, rows }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/schemas/[schemaId]/tables GET error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: { schemaId: string } }) {
  try {
    const tenantId = getTenantId(req)
    const { schemaId } = ctx.params
    const body = (await req.json().catch(() => ({}))) as { name?: string; slug?: string; description?: string | null }
    const name = String(body?.name || "").trim()
    if (!name) return Response.json({ success: false, message: "name é obrigatório" }, { status: 400 })

    const slug = toSlug(body?.slug ? String(body.slug) : name)
    const description = body?.description != null ? String(body.description) : null

    const created = await withTransaction(async (client) => {
      const schemaExists = await client.query(
        `select 1 from airtable."schema" where tenant_id = $1 and id = $2::uuid limit 1`,
        [tenantId, schemaId]
      )
      if (schemaExists.rows.length === 0) return { ok: false as const, notFound: true as const, conflict: false as const, row: null as const }

      const exists = await client.query(
        `select 1 from airtable."table" where tenant_id = $1 and schema_id = $2::uuid and lower(slug) = lower($3) limit 1`,
        [tenantId, schemaId, slug]
      )
      if (exists.rows.length > 0) return { ok: false as const, notFound: false as const, conflict: true as const, row: null as const }

      const ins = await client.query(
        `insert into airtable."table" (tenant_id, schema_id, name, slug, description)
         values ($1, $2::uuid, $3, $4, $5)
         returning id::text as id, name, slug, description, created_at::text`,
        [tenantId, schemaId, name, slug, description]
      )
      return {
        ok: true as const,
        notFound: false as const,
        conflict: false as const,
        row: ins.rows[0] as { id: string; name: string; slug: string; description: string | null; created_at: string },
      }
    })

    if (created.notFound) {
      return Response.json({ success: false, message: "Schema não encontrado" }, { status: 404 })
    }
    if (created.conflict) {
      return Response.json({ success: false, message: "Tabela já existe (slug)" }, { status: 409 })
    }
    if (!created.ok || !created.row) {
      return Response.json({ success: false, message: "Falha ao criar tabela" }, { status: 500 })
    }

    return Response.json({ success: true, row: created.row }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/schemas/[schemaId]/tables POST error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

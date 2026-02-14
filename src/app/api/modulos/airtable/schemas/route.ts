import { NextRequest } from "next/server"
import { runQuery, withTransaction } from "@/lib/postgres"
import { getTenantId } from "../_shared"

export const maxDuration = 300
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req)
    const rows = await runQuery<{ id: string; name: string; description: string | null; created_at: string }>(
      `select id::text as id, name, description, created_at::text
       from airtable."schema"
       where tenant_id = $1
       order by created_at desc`,
      [tenantId]
    )
    return Response.json({ success: true, rows }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/schemas GET error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req)
    const body = (await req.json().catch(() => ({}))) as { name?: string; description?: string | null }
    const name = String(body?.name || "").trim()
    if (!name) return Response.json({ success: false, message: "name é obrigatório" }, { status: 400 })

    const description = body?.description != null ? String(body.description) : null

    const created = await withTransaction(async (client) => {
      const exists = await client.query(
        `select 1 from airtable."schema" where tenant_id = $1 and lower(name) = lower($2) limit 1`,
        [tenantId, name]
      )
      if (exists.rows.length > 0) {
        return { ok: false as const, conflict: true as const, row: null as const }
      }

      const ins = await client.query(
        `insert into airtable."schema" (tenant_id, name, description)
         values ($1, $2, $3)
         returning id::text as id, name, description, created_at::text`,
        [tenantId, name, description]
      )
      return {
        ok: true as const,
        conflict: false as const,
        row: ins.rows[0] as { id: string; name: string; description: string | null; created_at: string },
      }
    })

    if (created.conflict) {
      return Response.json({ success: false, message: "Schema já existe" }, { status: 409 })
    }

    if (!created.ok || !created.row) {
      return Response.json({ success: false, message: "Falha ao criar schema" }, { status: 500 })
    }

    return Response.json({ success: true, row: created.row }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/schemas POST error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

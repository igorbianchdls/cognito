import { auth } from '@clerk/nextjs/server'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { definirCategoria, empresasDaPessoa } from '@/products/plataforma/server/empresa'
import { isCategoria } from '@/products/plataforma/shared/categorias'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (status: number, body: object) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })

/** GET — the person's companies, with their category (the menu and the company switcher use it). */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return json(401, { erro: 'Entre para continuar.' })
  try {
    return json(200, { empresas: await empresasDaPessoa(userId) })
  } catch (error) {
    console.error(JSON.stringify({ scope: 'plataforma', code: 'EMPRESAS_FAILED', message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível carregar as empresas.' })
  }
}

/** PATCH { categoria } — changes the category of the active company (owner or admin only). */
export async function PATCH(request: Request) {
  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) return json(403, { erro: 'Só o dono ou um administrador da empresa pode mudar a categoria.' })
  const body = await request.json().catch(() => null) as { categoria?: unknown } | null
  if (!body || !isCategoria(body.categoria)) return json(400, { erro: 'Categoria inválida.' })
  try {
    await definirCategoria(tenant.tenantId, body.categoria)
    return json(200, { categoria: body.categoria })
  } catch (error) {
    console.error(JSON.stringify({ scope: 'plataforma', code: 'CATEGORIA_FAILED', message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível mudar a categoria.' })
  }
}

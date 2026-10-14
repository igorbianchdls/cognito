import { NextResponse } from 'next/server'
import { z } from 'zod'
import { accountingOptions } from '../../../server/erpAccountingRepository'
import { resolveErpApiAccess } from '../../http/access'
import { withErpHttp } from '../../http/handler'
import { ErpDomainError } from '../../../shared/erpErrors'

const querySchema = z.object({
  q: z.string().max(500).default(''), page: z.coerce.number().int().min(1).max(10000).default(1),
  tipo: z.enum(['analitica','sintetica']).default('analitica'),
  excluir: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  classificacao: z.enum(['ativo','passivo','patrimonio_liquido','receita','custo','despesa']).optional(),
}).strict()
async function handleGET(request: Request) {
  const access = await resolveErpApiAccess('erp.cadastros.visualizar')
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) throw new ErpDomainError('VALIDATION_ERROR','Confira os filtros das contas contábeis.',422)
  const q = parsed.data
  return NextResponse.json(await accountingOptions(access.tenantId,q.q,q.page,q.tipo,q.excluir,q.classificacao))
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/catalogos/contas-contabeis' })

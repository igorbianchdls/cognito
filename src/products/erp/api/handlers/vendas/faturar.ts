import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"

 async function handlePOST() {
  return erpFailure('Esta rota foi descontinuada. Use /atender para a operacao de estoque; a emissao fiscal possui fluxo proprio.', 410)
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/vendas/[id]/faturar","authentication":"none","maxBodyBytes":1048576})

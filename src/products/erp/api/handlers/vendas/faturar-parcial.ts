import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"

 async function handlePOST() {
  return erpFailure('Esta rota foi descontinuada. Use /atender-parcial para a operação de estoque.', 410)
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/vendas/[id]/faturar-parcial","authentication":"none","maxBodyBytes":1048576})

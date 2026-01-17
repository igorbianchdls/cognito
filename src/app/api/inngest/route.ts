import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { contaAPagarCriadaFn, pagamentoEfetuadoCriadoFn, contaAReceberCriadaFn, pagamentoRecebidoCriadoFn } from '@/inngest/financeiro'
import { compraCriadaFn } from '@/inngest/compras'
import { pedidoCriadoFn } from '@/inngest/vendas'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [contaAPagarCriadaFn, pagamentoEfetuadoCriadoFn, contaAReceberCriadaFn, pagamentoRecebidoCriadoFn, compraCriadaFn, pedidoCriadoFn],
})

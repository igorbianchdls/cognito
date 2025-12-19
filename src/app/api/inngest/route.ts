import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { contaAPagarCriadaFn, pagamentoEfetuadoCriadoFn } from '@/inngest/financeiro'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [contaAPagarCriadaFn, pagamentoEfetuadoCriadoFn],
})

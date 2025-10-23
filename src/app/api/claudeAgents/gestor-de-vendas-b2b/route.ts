import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'
import {
  listarPedidosVendas,
  listarClientesVendas,
  listarTerritoriosVendas,
  listarEquipesVendas,
  listarCanaisVendas,
  kpisVendas,
} from '@/tools/vendasB2BTools'

export const maxDuration = 300

export async function POST(req: Request) {
  console.log('🧭 GESTOR DE VENDAS B2B: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      // @ts-expect-error experimental
      toolCallStreaming: true,
      providerOptions: { anthropic: { thinking: { type: 'enabled', budgetTokens: 10000 } } },
      system: `Você é o Gestor de Vendas B2B. Consulta dados reais do schema gestaovendas (pedidos, clientes, territórios, equipes, canais) e apresenta resultados claros, com foco operacional.

# 🛠️ Ferramentas
- listarPedidosVendas: período (data_pedido), status, cliente, vendedor, canal, valor_min/max, q
- listarClientesVendas: período (cliente_desde), ativo, vendedor, território, status, q
- listarTerritoriosVendas: agregados de clientes e vendedores
- listarEquipesVendas: agregados de vendedores e territórios atendidos
- listarCanaisVendas: agregados de pedidos/receita e primeira/última venda
- kpisVendas: total_pedidos, receita_total, ticket_medio, clientes_unicos

# ✅ Boas práticas
- Validar períodos e filtros antes de chamar a tool
- Ordenar e paginar quando houver muitas linhas
- Responder com recomendações objetivas quando solicitado`,
      messages: convertToModelMessages(messages),
      tools: {
        listarPedidosVendas,
        listarClientesVendas,
        listarTerritoriosVendas,
        listarEquipesVendas,
        listarCanaisVendas,
        kpisVendas,
      },
    })
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('🧭 GESTOR DE VENDAS B2B: erro:', error)
    return new Response(JSON.stringify({ error: 'Erro interno no Gestor de Vendas B2B' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

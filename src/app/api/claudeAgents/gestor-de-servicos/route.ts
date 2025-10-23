import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'
import {
  listarOrdensDeServico,
  listarTecnicos,
  listarAgendamentos,
  listarCatalogoDeServicos,
  historicoDeServicosDoCliente,
  indicadoresDeServicos,
} from '@/tools/servicosTools'

export const maxDuration = 300

export async function POST(req: Request) {
  console.log('🛠️ GESTOR DE SERVIÇOS AGENT: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('🛠️ GESTOR DE SERVIÇOS AGENT: Messages:', messages?.length)

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      // @ts-expect-error - experimental
      toolCallStreaming: true,
      providerOptions: { anthropic: { thinking: { type: 'enabled', budgetTokens: 10000 } } },
      system: `Você é um assistente AI especializado em gestão de serviços (ordens de serviço, técnicos, agendamentos e catálogo). Seu objetivo é ajudar times operacionais a gerir a operação, melhorar SLA, e acompanhar KPIs de serviços.

# 🎯 Sua Missão
- Consultar ordens de serviço e status
- Visualizar agenda e atribuição de técnicos
- Listar catálogo de serviços
- Analisar KPIs (backlog, TMA, concluídas, receita)

# 🛠️ Suas Ferramentas (schema: servicos)

## 📄 listarOrdensDeServico
Lista OS com filtros: status, prioridade, técnico, cliente, valor_min/max, período (data_abertura), q
Campos retornados: numero_os, cliente, técnico, status, prioridade, datas e valores

## 👷 listarTecnicos
Lista técnicos com agregados: ordens_servico e horas_trabalhadas
Filtros: status, especialidade, custo_min/max, período (data_admissao), q

## 📅 listarAgendamentos
Lista agendamentos com OS e técnico
Filtros: técnico, status, período (data_agendada), q

## 🧾 listarCatalogoDeServicos
Lista itens do catálogo de serviços
Filtros: categoria, ativo ('true'|'false'), preco_min/max, q

## 🧑‍💼 historicoDeServicosDoCliente
Histórico de OS por cliente
Filtros: cliente_id (obrigatório), período (data_abertura)

## 📈 indicadoresDeServicos
KPIs por período: os_abertas, os_em_andamento, os_concluidas, backlog, tma_dias, receita_total

# 💡 BOAS PRÁTICAS
- Sempre confirmar o período (de/ate) quando o usuário citar datas
- Ordenar OS por data_abertura desc quando pertinente
- Para status: considerar 'aberta', 'em_andamento', 'aguardando_pecas', 'concluida', 'cancelada'
- Para valores: usar COALESCE(valor_final, valor_estimado) quando aplicável
- Responder de forma clara, com listas e recomendações acionáveis
`,
      messages: convertToModelMessages(messages),
      tools: {
        listarOrdensDeServico,
        listarTecnicos,
        listarAgendamentos,
        listarCatalogoDeServicos,
        historicoDeServicosDoCliente,
        indicadoresDeServicos,
      },
    })

    return result.toAIStreamResponse()
  } catch (error) {
    console.error('🛠️ GESTOR DE SERVIÇOS AGENT: Erro ao processar request:', error)
    throw error
  }
}


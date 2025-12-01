import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'
import { buscarContaPagar, criarPagamentoEfetuado } from '@/tools/pagamentosEfetuadosWorkflowTools'
import { buscarFinanceiroLookups } from '@/tools/financeiroLookupsTools'

export const maxDuration = 300

const baseSystem = `Você é um assistente especializado em WORKFLOW de registro de Pagamentos Efetuados.

# 🎯 OBJETIVO
Guiar o usuário através do processo de registro de um pagamento efetuado e baixa da conta a pagar correspondente.

# 🛠️ SUAS FERRAMENTAS

**buscarContaPagar**
- Input: fornecedor_id, fornecedor_nome, valor, data_vencimento, status (todos opcionais)
- Busca conta a pagar existente no sistema
- Retorna dados completos da conta se encontrada
- Pode buscar por ranges de valor e datas

**buscarFinanceiroLookups**
- Lista contas financeiras e métodos de pagamento disponíveis
- Use para mostrar opções ao usuário antes de criar o pagamento
- Retorna contas bancárias e métodos (PIX, transferência, boleto, etc)

**criarPagamentoEfetuado**
- Input: lancamento_origem_id (AP ID), conta_financeira_id, metodo_pagamento_id, descricao
- Gera PRÉVIA do pagamento. A criação real acontece ao clicar em "Criar" na UI.
- IMPORTANTE: O SISTEMA BAIXA A CONTA A PAGAR AUTOMATICAMENTE ao confirmar
- Calcula automaticamente o valor pendente (considerando pagamentos anteriores)

# ✅ INSTRUÇÕES IMPORTANTES

**Quando receber comprovante:**
- Analise cuidadosamente e extraia TODOS os dados (valor, data, fornecedor)
- Busque a conta a pagar correspondente
- Se encontrar múltiplas possibilidades, confirme com usuário

**Interação com usuário:**
- Seja proativo ao extrair dados de documentos
- Confirme valores antes de registrar
- Pergunte sobre juros/multa/desconto se houver diferença de valor

**Ao final:**
- Confirme que pagamento foi registrado com sucesso
- Mostre resumo (valor, data, forma pagamento, conta baixada)
- Informe que a conta a pagar foi BAIXADA AUTOMATICAMENTE

Você é um ASSISTENTE DE WORKFLOW. Conduza o usuário passo a passo de forma clara e eficiente.`

export async function POST(req: Request) {
  console.log('✅ WORKFLOW PAGAMENTO EFETUADO: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('✅ WORKFLOW PAGAMENTO EFETUADO: Messages:', messages?.length)

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 8000 },
        },
      },
      system: baseSystem,
      messages: convertToModelMessages(messages),
      tools: {
        buscarContaPagar,
        buscarFinanceiroLookups,
        criarPagamentoEfetuado,
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('✅ WORKFLOW PAGAMENTO EFETUADO: Erro:', error)
    throw error
  }
}

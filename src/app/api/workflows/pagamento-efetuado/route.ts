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
      // Steps reintroduzidos (sem travas), seguindo o padrão do agente de Contas a Pagar
      prepareStep: ({ stepNumber }) => {
        if (stepNumber === 1) {
          return {
            system: baseSystem + `

# 🧭 Step 1 — Analisar documento e buscar conta a pagar

Objetivo: Se houver comprovante/documento, extraia valor, data do pagamento e fornecedor. Em seguida, CHAME a tool **buscarContaPagar** para localizar o título a pagar correspondente.

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Use filtros adequados: fornecedor_id OU fornecedor_nome (nome_fantasia), valor/valor_min/valor_max, data_vencimento (ou de_vencimento/ate_vencimento) e status.
- Sem dados suficientes: faça uma busca mais ampla (ex.: por intervalo de vencimento ou valor aproximado) e permita que o usuário escolha.
- NÃO simule listas; a UI renderiza a tabela a partir do retorno da tool.
`,
            tools: { buscarContaPagar },
          };
        }

        if (stepNumber === 2) {
          return {
            system: baseSystem + `

# 🧭 Step 2 — Buscar Contas Financeiras e Métodos de Pagamento

Objetivo: CHAMAR **buscarFinanceiroLookups** para listar contas financeiras e métodos (PIX, transferência, boleto, etc.).

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- NÃO simule listas; a UI renderiza as opções retornadas pela tool.
`,
            tools: { buscarFinanceiroLookups },
          };
        }

        if (stepNumber === 3) {
          return {
            system: baseSystem + `

# 🧭 Step 3 — Criar Pagamento Efetuado (PRÉVIA)

Objetivo: Consolidar dados (lancamento_origem_id da AP, conta_financeira_id, metodo_pagamento_id, descricao) e CHAMAR **criarPagamentoEfetuado** para gerar a PRÉVIA.

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Esta tool gera apenas PRÉVIA; a criação real acontece na UI e baixa automaticamente a AP ao confirmar.
- NÃO invente payloads; a UI mostrará o cartão de prévia com os campos retornados.
`,
            tools: { criarPagamentoEfetuado },
          };
        }

        return undefined;
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('✅ WORKFLOW PAGAMENTO EFETUADO: Erro:', error)
    throw error
  }
}

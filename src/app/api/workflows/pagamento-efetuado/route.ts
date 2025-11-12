import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage, stepCountIs, hasToolCall } from 'ai'
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
      stopWhen: [stepCountIs(20), hasToolCall('criarPagamentoEfetuado')],
      prepareStep: ({ stepNumber }) => {
        if (stepNumber === 1) {
          return {
            system: baseSystem + `

# 📍 STEP 1: ANALISAR DOCUMENTO + BUSCAR CONTA A PAGAR

**Seu objetivo neste step:**
1. Se o usuário enviou comprovante de pagamento (boleto, transferência, PIX, nota fiscal), extraia TODOS os dados:
   - Valor pago
   - Data do pagamento
   - Fornecedor/beneficiário
   - Número da nota fiscal (se houver)
   - Informações bancárias
2. Liste os dados extraídos para o usuário confirmar
3. Use a tool **buscarContaPagar** com os dados extraídos para encontrar a conta a pagar correspondente
4. Busque por: fornecedor_nome, valor (ou valor_min/valor_max se não exato), data_vencimento
5. Se encontrar múltiplas contas, mostre as opções ao usuário para ele escolher

**Tools disponíveis:**
- buscarContaPagar

**Próximo step:**
- Se conta a pagar encontrada: Step 2 (buscar contas financeiras e métodos de pagamento)
- Se não encontrada: pergunte mais detalhes e tente buscar novamente`,
            tools: {
              buscarContaPagar
            }
          }
        }

        if (stepNumber === 2) {
          return {
            system: baseSystem + `

# 📍 STEP 2: BUSCAR CONTAS FINANCEIRAS E MÉTODOS DE PAGAMENTO

**Seu objetivo neste step:**
1. Use a tool **buscarFinanceiroLookups** para listar as opções disponíveis
2. Mostre ao usuário:
   - Contas financeiras disponíveis (contas bancárias de onde o pagamento saiu)
   - Métodos de pagamento disponíveis (PIX, transferência, boleto, dinheiro, etc.)
3. Ajude o usuário a escolher a conta financeira correta (de onde foi debitado)
4. Ajude a escolher o método de pagamento usado
5. Se o valor do comprovante difere do valor da AP, pergunte sobre:
   - Juros ou multa (se pagou a mais)
   - Desconto (se pagou a menos)
6. Aguarde o usuário informar suas escolhas (IDs)

**Tools disponíveis:**
- buscarFinanceiroLookups

**Próximo step:**
- Após usuário escolher conta financeira e método: Step 3 (criar pagamento)`,
            tools: {
              buscarFinanceiroLookups
            }
          }
        }

        if (stepNumber === 3) {
          return {
            system: baseSystem + `

# 📍 STEP 3: CRIAR PAGAMENTO EFETUADO (PRÉVIA)

**Seu objetivo neste step:**
1. Você tem TODOS os dados necessários:
   - Conta a pagar ID / lancamento_origem_id (do step 1)
   - Conta financeira ID (do step 2)
   - Método de pagamento ID (do step 2)
   - Descrição/observações do pagamento
2. Use a tool **criarPagamentoEfetuado** com TODOS esses dados
3. IMPORTANTE:
   - Esta tool gera apenas a PRÉVIA
   - O sistema calcula automaticamente o valor pendente
   - A criação real acontece quando o usuário clica em "Criar" na UI
   - A CONTA A PAGAR SERÁ BAIXADA AUTOMATICAMENTE ao confirmar
4. Mostre o resumo completo do pagamento ao usuário

**Tools disponíveis:**
- criarPagamentoEfetuado

**Final do workflow:**
- Após gerar a prévia, aguarde o usuário clicar em "Criar" na UI
- Confirme o sucesso e mostre o resumo final
- LEMBRE o usuário que a conta a pagar foi BAIXADA AUTOMATICAMENTE`,
            tools: {
              criarPagamentoEfetuado
            }
          }
        }

        // Default: todas as tools disponíveis
        return {
          system: baseSystem,
          tools: {
            buscarContaPagar,
            buscarFinanceiroLookups,
            criarPagamentoEfetuado
          }
        }
      }
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('✅ WORKFLOW PAGAMENTO EFETUADO: Erro:', error)
    throw error
  }
}

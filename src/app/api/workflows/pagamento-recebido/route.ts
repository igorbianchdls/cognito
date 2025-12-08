import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'
import { buscarContaReceber, criarPagamentoRecebido } from '@/tools/pagamentosRecebidosWorkflowTools'
import { buscarFinanceiroLookups } from '@/tools/financeiroLookupsTools'
import { buscarCliente, criarCliente, criarContaReceber } from '@/tools/contasReceberWorkflowTools'
import { buscarClassificacoesFinanceiras } from '@/tools/contasPagarWorkflowTools'

export const maxDuration = 300

const baseSystem = `Você é um assistente especializado em WORKFLOW de registro de Pagamentos Recebidos.

# 🎯 OBJETIVO
Guiar o usuário através do processo de registro de um pagamento recebido e baixa da conta a receber correspondente.

# 🛠️ SUAS FERRAMENTAS

**buscarContaReceber**
- Input: cliente_id, cliente_nome, valor, data_vencimento, status (todos opcionais)
- Busca conta a receber existente no sistema
- Retorna dados completos da conta se encontrada
- Pode buscar por ranges de valor e datas

**buscarFinanceiroLookups**
- Lista contas financeiras e métodos de pagamento disponíveis
- Use para mostrar opções ao usuário antes de criar o pagamento
- Retorna contas bancárias e métodos (PIX, transferência, boleto, etc)

**criarPagamentoRecebido**
- Input: lancamento_origem_id (AR ID), conta_financeira_id, metodo_pagamento_id, descricao
- Gera PRÉVIA do pagamento. A criação real acontece ao clicar em "Criar" na UI.
- IMPORTANTE: O SISTEMA BAIXA A CONTA A RECEBER AUTOMATICAMENTE ao confirmar
- Calcula automaticamente o valor pendente (considerando pagamentos anteriores)

# ✅ INSTRUÇÕES IMPORTANTES

**Quando receber comprovante:**
- Analise cuidadosamente e extraia TODOS os dados (valor, data, cliente)
- Busque a conta a receber correspondente
- Se encontrar múltiplas possibilidades, confirme com usuário

**Interação com usuário:**
- Seja proativo ao extrair dados de documentos
- Confirme valores antes de registrar
- Pergunte sobre juros/multa/desconto se houver diferença de valor

**Ao final:**
- Confirme que pagamento foi registrado com sucesso
- Mostre resumo (valor, data, forma pagamento, conta baixada)
- Informe que a conta a receber foi BAIXADA AUTOMATICAMENTE

Você é um ASSISTENTE DE WORKFLOW. Conduza o usuário passo a passo de forma clara e eficiente.

# 🔎 Heurística de Busca (prioridade)
- Preferir CPF/CNPJ → cliente_id quando disponível.
- Sem CPF/CNPJ: usar cliente_nome (ILIKE) + valor com tolerância.
- Se só houver valor: usar faixa de valor + janela de vencimento.
- Por padrão, buscar apenas títulos com status pendente.

# ⚙️ Parâmetros sugeridos
- Tolerância de valor: ±1% ou ±R$ 1 (o que for maior).
- Janela de vencimento: ±15 dias em torno da data do pagamento quando necessário.
- Ordenação: order_by=data_vencimento, order_dir=desc; Limite: 20.

# 🧾 Campos opcionais úteis
- Quando houver: numero_nota_fiscal (NF) e/ou descrição do título (descricao) podem ser usados para refinar a busca.

# 📌 Observação
- A tool buscarContaReceber retorna valor_recebido e valor_pendente consolidados a partir de recebimentos já registrados.

# 🔀 Fluxo Condicional
- Se Step 1 encontrar (ou o usuário selecionar) uma conta a receber, pule Steps 2 e 3 e siga para Lookups (Step 4) e criação do recebimento (Step 5).
- Se Step 1 NÃO encontrar nenhuma AR adequada, execute Step 2 (Buscar Cliente) e Step 3 (Criar Conta a Receber), depois prossiga com Steps 4 e 5.`

export async function POST(req: Request) {
  console.log('💸 WORKFLOW PAGAMENTO RECEBIDO: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('💸 WORKFLOW PAGAMENTO RECEBIDO: Messages:', messages?.length)

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
        // Busca/seleção de AR existente
        buscarContaReceber,
        // Fluxo condicional de criação de AR
        buscarCliente,
        criarCliente,
        buscarClassificacoesFinanceiras,
        criarContaReceber,
        // Lookups e criação do recebimento
        buscarFinanceiroLookups,
        criarPagamentoRecebido,
      },
      prepareStep: ({ stepNumber }) => {
        if (stepNumber === 1) {
          return {
            system: baseSystem + `

# 🧭 Step 1 — Analisar documento e buscar conta a receber

Objetivo: Se houver comprovante/documento, extraia valor, data do recebimento e cliente. Em seguida, CHAME a tool **buscarContaReceber** para localizar o título a receber correspondente.

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Use a heurística: (1) cliente_id quando tiver CPF/CNPJ; (2) cliente_nome + faixa de valor; (3) valor_min/valor_max + janela de vencimento.
- Parâmetros: aplique tolerância de valor (±1% ou ±R$1), status pendente por padrão, limite 20, order_by=data_vencimento desc.
- Filtros adicionais quando disponíveis: numero_nota_fiscal (NF) e/ou descricao (ILIKE parcial).
- Sem dados suficientes: faça uma busca mais ampla (intervalo de vencimento maior ou ampliar tolerância) e permita que o usuário escolha.
- NÃO simule listas; a UI renderiza a tabela a partir do retorno da tool.

Condição:
- Se uma única AR for encontrada (ou o usuário selecionar uma), ANOTE o id e PULE Steps 2 e 3, seguindo para Lookups (Step 4).
- Se nenhuma AR adequada for encontrada, continue para o Step 2 (Buscar Cliente).
`,
            tools: { buscarContaReceber },
          };
        }

        // Condicional: só quando Step 1 não encontrar AR
        if (stepNumber === 2) {
          return {
            system: baseSystem + `

# 🧭 Step 2 — Buscar Cliente (Condicional)

Objetivo: Quando nenhuma AR for encontrada no Step 1, resolva um cliente válido para criar uma nova AR.

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Use **buscarCliente** com CPF/CNPJ (normalizado) quando disponível; senão, por nome_fantasia (ILIKE). Sem filtros: lista limitada.
- NÃO simule listas; a UI renderiza a tabela a partir do retorno da tool.

Condição:
- Se um cliente for selecionado (ou único), siga para Step 3 para criar a AR (prévia).
- Se ainda não houver cliente adequado, ajuste filtros e tente novamente.
`,
            tools: { buscarCliente },
          };
        }

        // Condicional: criação de AR quando não existia uma
        if (stepNumber === 3) {
          return {
            system: baseSystem + `

# 🧭 Step 3 — Criar Conta a Receber (PRÉVIA, Condicional)

Objetivo: Consolidar dados do cliente (Step 2) e dimensões financeiras para gerar a PRÉVIA da nova AR.

Regras obrigatórias:
- Se faltarem dimensões (categoria/centro de lucro/natureza), primeiro CHAME **buscarClassificacoesFinanceiras** para listar opções ao usuário.
- Então CHAME **criarContaReceber** com os IDs e dados extraídos do comprovante (valor, vencimento, descrição, NF quando houver).
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- A tool gera PRÉVIA; a criação real ocorre na UI. NÃO invente payloads; a UI mostra os campos retornados.

Condição:
- Após a confirmação/criação na UI, ANOTE o id da AR criada e siga para Lookups (Step 4).
`,
            tools: { buscarClassificacoesFinanceiras, criarContaReceber },
          };
        }

        // Lookups para recebimento (sempre executado após ter uma AR definida)
        if (stepNumber === 4) {
          return {
            system: baseSystem + `

# 🧭 Step 4 — Buscar Contas Financeiras e Métodos de Pagamento

Objetivo: CHAMAR **buscarFinanceiroLookups** para listar contas financeiras e métodos (PIX, transferência, boleto, etc.).

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- NÃO simule listas; a UI renderiza as opções retornadas pela tool.
`,
            tools: { buscarFinanceiroLookups },
          };
        }

        // Criar recebimento (prévia)
        if (stepNumber === 5) {
          return {
            system: baseSystem + `

# 🧭 Step 5 — Criar Pagamento Recebido (PRÉVIA)

Objetivo: Consolidar dados (lancamento_origem_id da AR, conta_financeira_id, metodo_pagamento_id, descricao) e CHAMAR **criarPagamentoRecebido** para gerar a PRÉVIA.

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Esta tool gera apenas PRÉVIA; a criação real acontece na UI e baixa automaticamente a AR ao confirmar.
- NÃO invente payloads; a UI mostrará o cartão de prévia com os campos retornados.
`,
            tools: { criarPagamentoRecebido },
          };
        }

        return undefined;
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('💸 WORKFLOW PAGAMENTO RECEBIDO: Erro:', error)
    throw error
  }
}

import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'
import { buscarContaPagar, criarPagamentoEfetuado } from '@/tools/pagamentosEfetuadosWorkflowTools'
import { buscarFinanceiroLookups } from '@/tools/financeiroLookupsTools'
import { buscarFornecedor, criarContaPagar, buscarClassificacoesFinanceiras } from '@/tools/contasPagarWorkflowTools'

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

Você é um ASSISTENTE DE WORKFLOW. Conduza o usuário passo a passo de forma clara e eficiente.

# 🔎 Heurística de Busca (prioridade)
- Preferir CNPJ/fornecedor_id quando disponível.
- Sem CNPJ: usar fornecedor_nome (ILIKE) + valor com tolerância.
- Se só houver valor: usar faixa de valor + janela de vencimento.
- Por padrão, buscar apenas títulos com status pendente.

# ⚙️ Parâmetros sugeridos
- Tolerância de valor: ±1% ou ±R$ 1 (o que for maior).
- Janela de vencimento: ±15 dias em torno da data do pagamento quando necessário.
- Ordenação: order_by=data_vencimento, order_dir=desc; Limite: 20.

# 🧾 Campos opcionais úteis
- Quando houver: numero_nota_fiscal (NF) e/ou descrição do título (descricao) podem ser usados para refinar a busca.

# 📌 Observação
- A tool buscarContaPagar retorna valor_pago e valor_pendente consolidados a partir de pagamentos já registrados.

# 🔀 Fluxo Condicional
- Se Step 1 encontrar (ou o usuário selecionar) uma conta a pagar, pule Steps 2 e 3 e siga para Lookups (Step 4) e criação do pagamento (Step 5).
- Se Step 1 NÃO encontrar nenhuma AP adequada, execute Step 2 (Buscar Fornecedor) e Step 3 (Criar Conta a Pagar), depois prossiga com Steps 4 e 5.`

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
        // Busca/seleção de AP existente
        buscarContaPagar,
        // Fluxo condicional de criação de AP (reuso do workflow Contas a Pagar)
        buscarFornecedor,
        buscarClassificacoesFinanceiras,
        criarContaPagar,
        // Lookups e criação do pagamento
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
- Use a heurística: (1) fornecedor_id quando tiver CNPJ; (2) fornecedor_nome + faixa de valor; (3) valor_min/valor_max + janela de vencimento.
- Parâmetros: aplique tolerância de valor (±1% ou ±R$1), status pendente por padrão, limite 20, order_by=data_vencimento desc.
- Filtros adicionais quando disponíveis: numero_nota_fiscal (NF) e/ou descricao (ILIKE parcial).
- Sem dados suficientes: faça uma busca mais ampla (intervalo de vencimento maior ou ampliar tolerância) e permita que o usuário escolha.
- NÃO simule listas; a UI renderiza a tabela a partir do retorno da tool.

Condição:
- Se uma única AP for encontrada (ou o usuário selecionar uma), ANOTE o id e PULE Steps 2 e 3, seguindo para Lookups (Step 4).
- Se nenhuma AP adequada for encontrada, continue para o Step 2 (Buscar Fornecedor).
`,
            tools: { buscarContaPagar },
          };
        }

        // Condicional: só quando Step 1 não encontrar AP
        if (stepNumber === 2) {
          return {
            system: baseSystem + `

# 🧭 Step 2 — Buscar Fornecedor (Condicional)

Objetivo: Quando nenhuma AP for encontrada no Step 1, resolva um fornecedor válido para criar uma nova AP.

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Use **buscarFornecedor** com CNPJ (normalizado) quando disponível; senão, por nome_fantasia (ILIKE). Sem filtros: lista limitada.
- NÃO simule listas; a UI renderiza a tabela a partir do retorno da tool.

Condição:
- Se um fornecedor for selecionado (ou único), siga para Step 3 para criar a AP (prévia).
- Se ainda não houver fornecedor adequado, ajuste filtros e tente novamente.
`,
            tools: { buscarFornecedor },
          };
        }

        // Condicional: criação de AP quando não existia uma
        if (stepNumber === 3) {
          return {
            system: baseSystem + `

# 🧭 Step 3 — Criar Conta a Pagar (PRÉVIA, Condicional)

Objetivo: Consolidar dados do fornecedor (Step 2) e dimensões financeiras para gerar a PRÉVIA da nova AP.

Regras obrigatórias:
- Se faltarem dimensões (categoria/centro de custo, etc.), primeiro CHAME **buscarClassificacoesFinanceiras** para listar opções ao usuário.
- Então CHAME **criarContaPagar** com os IDs e dados extraídos do comprovante (valor, vencimento, descrição, NF quando houver).
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- A tool gera PRÉVIA; a criação real ocorre na UI. NÃO invente payloads; a UI mostra os campos retornados.

Condição:
- Após a confirmação/criação na UI, ANOTE o id da AP criada e siga para Lookups (Step 4).
`,
            tools: { buscarClassificacoesFinanceiras, criarContaPagar },
          };
        }

        // Lookups para pagamento (sempre executado após ter uma AP definida)
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

        // Criar pagamento (prévia)
        if (stepNumber === 5) {
          return {
            system: baseSystem + `

# 🧭 Step 5 — Criar Pagamento Efetuado (PRÉVIA)

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

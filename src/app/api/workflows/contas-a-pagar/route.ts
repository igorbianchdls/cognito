import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'
import {
  buscarClassificacoesFinanceiras,
  buscarFornecedor,
  criarFornecedor,
  criarContaPagar
} from '@/tools/contasPagarWorkflowTools'

export const maxDuration = 300

const baseSystem = `Você é um assistente especializado em WORKFLOW de criação de Contas a Pagar.

# 🎯 OBJETIVO
Guiar o usuário através do processo completo de criação de uma conta a pagar, desde o upload do documento até o registro final no sistema.

# 🛠️ SUAS FERRAMENTAS

**buscarClassificacoesFinanceiras**
- Mostra todas classificações disponíveis
- Use ANTES de criar a conta para o usuário escolher

**buscarFornecedor**
- Input: cnpj, nome (nome_fantasia) ou query (alias). Se vazio, lista TODOS (com limite padrão).
- Verifica se fornecedor já existe. NUNCA simule resultados; SEMPRE chame a tool para obter a lista real.

# ⚠️ REGRAS OBRIGATÓRIAS PARA CHAMADA DE TOOLS
- Sempre que precisar listar ou filtrar fornecedores, CHAME a tool **buscarFornecedor**.
- NÃO escreva blocos "function_calls"/"function_result" como texto. Use a tool de verdade.
- NÃO invente arrays "fornecedores"; o retorno deve vir da tool e ser renderizado pelo componente de UI (tabela).
- Para filtro por nome, use SEMPRE a coluna nome_fantasia (LIKE case-insensitive) — a tool já faz isso.
- Para CNPJ, normalize (apenas dígitos) — a tool já faz isso.
- Sem CNPJ e sem nome: chame buscarFornecedor sem filtros (listagem com limite padrão).

**criarFornecedor**
- Input: nome, cnpj, endereco, telefone, email
- Gera PRÉVIA com os dados para revisão. A criação real acontece ao clicar em "Criar" na UI.

**criarContaPagar**
- Input (cabeçalho): fornecedor_id, categoria_id, centro_custo_id, valor, data_vencimento, data_emissao, numero_nota_fiscal, descricao
- Input (itens): array de objetos com numero_item?, descricao, quantidade, unidade?, valor_unitario, desconto?, acrescimo?, valor_total?, categoria_id?, centro_custo_id?, natureza_financeira_id?, observacao?
- Observação: se os itens não forem enviados, a API criará 1 item padrão com base no cabeçalho. Enviar os itens é RECOMENDADO para que a expansão da lista mostre o detalhamento correto.
- Gera PRÉVIA; a criação real ocorre após confirmação na UI.

# ✅ INSTRUÇÕES IMPORTANTES

**Quando receber documento:**
- Faça OCR do documento (PDF/Imagem) e EXTRAIA cabeçalho, ITENS da invoice e, se aplicável, PARCELAS (linhas de pagamento):
  - Cabeçalho:
    - fornecedor: CNPJ (14 dígitos, apenas números) e nome_fantasia (se disponível)
    - numero_nota_fiscal (se houver), descricao (curta)
    - data_emissao (YYYY-MM-DD), data_vencimento (YYYY-MM-DD)
    - valor_total (número, separador decimal “.”)
  - Itens (financeiro.lancamentos_financeiros_itens):
    - Para cada item: descricao, quantidade, unidade (opcional), valor_unitario, desconto (opcional), acrescimo (opcional), valor_total (se ausente, calcule: quantidade*valor_unitario + acrescimo - desconto)
    - Opcionalmente: numero_item, categoria_id, centro_custo_id, natureza_financeira_id, observacao
  - Parcelas (financeiro.lancamentos_financeiros_linhas) — opcional:
    - Se houver parcelas explícitas, extraia: numero_parcela, data_vencimento, valor_liquido; opcionalmente juros, multa, desconto, status
    - Se NÃO houver parcelas, pode criar 1 linha única com: tipo_linha="parcela", numero_parcela=1, valor_liquido=valor_total, data_vencimento=cabeçalho.data_vencimento
  - Normalização:
    - Datas: sempre no formato YYYY-MM-DD
    - Números: usar “.” como separador decimal
    - Se valor_total do cabeçalho não for confiável, adote a soma dos itens.
  - Fornecedor:
    - Se tiver CNPJ ou nome_fantasia, CHAME buscarFornecedor para encontrar o fornecedor e obter o fornecedor_id
    - Se não existir, gere PRÉVIA com criarFornecedor e use o fornecedor_id após criação
- Liste os dados extraídos (cabeçalho + itens + (opcional) parcelas) para o usuário confirmar

**Interação com usuário:**
- Peça confirmação dos dados extraídos quando necessário
- Ajude a escolher categoria/centro de custo corretos
- Seja proativo e conduza o fluxo naturalmente
 - Ao listar fornecedores, use a tool e exiba a lista no componente da UI (não imprima listas manuais). Não gere function_calls fictícios; use a ferramenta.

**Ao final:**
- Após a confirmação do usuário (clique em Criar na UI), confirme que a conta foi criada com sucesso e mostre o resumo (ID, valor, vencimento, status)

Você é um ASSISTENTE DE WORKFLOW. Conduza o usuário passo a passo de forma clara e eficiente.`

export async function POST(req: Request) {
  console.log('💳 WORKFLOW CONTAS A PAGAR: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('💳 WORKFLOW CONTAS A PAGAR: Messages:', messages?.length)

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
        buscarClassificacoesFinanceiras,
        buscarFornecedor,
        criarFornecedor,
        criarContaPagar,
      },
      // Reintroduz apenas o Step 1 (extração + busca de fornecedor), sem travas
      prepareStep: ({ stepNumber }) => {
        if (stepNumber === 1) {
      return {
            system:
              baseSystem + `

# 🧭 Step 1 — Extrair dados do documento e buscar fornecedor

Objetivo: Se houver documento, FAÇA OCR e extraia:
- Cabeçalho: CNPJ, nome_fantasia, numero_nota_fiscal, descricao, data_emissao, data_vencimento, valor_total
- Itens: descricao, quantidade, unidade (opcional), valor_unitario, desconto (opcional), acrescimo (opcional), valor_total (calcule se ausente)
- (Opcional) Parcelas: numero_parcela, data_vencimento, valor_liquido, juros/multa/desconto quando houver

Em seguida, CHAME a tool buscarFornecedor para obter fornecedor_id.

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Se tiver CNPJ: buscarFornecedor { cnpj } (normalizar apenas dígitos)
- Se tiver nome fantasia: buscarFornecedor { nome } (LIKE case-insensitive na coluna nome_fantasia)
- Se não houver dados suficientes: buscarFornecedor {} (lista TODOS com limite padrão)
- NÃO simule listas; a UI renderiza a tabela a partir do retorno da tool
`,
            tools: { buscarFornecedor },
          };
        }

        if (stepNumber === 2) {
          return {
            system:
              baseSystem + `

# 🧭 Step 2 — Criar Fornecedor (Prévia)

Objetivo: Quando o fornecedor não existir, gere uma PRÉVIA com **criarFornecedor** usando os dados extraídos (nome_fantasia/nome, cnpj, endereço, telefone, email).

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Esta tool gera apenas PRÉVIA; a criação real ocorre na UI.
- NÃO invente payloads; a UI mostrará o cartão de prévia com os campos retornados.
`,
            tools: { criarFornecedor },
          };
        }

        if (stepNumber === 3) {
          return {
            system:
              baseSystem + `

# 🧭 Step 3 — Buscar Classificações Financeiras

Objetivo: Listar opções com **buscarClassificacoesFinanceiras** (categorias financeiras, centros de custo, naturezas). Use termo_busca opcional para filtrar.

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- NÃO simule listas; a UI renderiza a tabela/grade a partir do retorno da tool.
`,
            tools: { buscarClassificacoesFinanceiras },
          };
        }
        if (stepNumber === 4) {
          return {
            system:
              baseSystem + `

# 🧭 Step 4 — Criar Conta a Pagar (PRÉVIA)

Objetivo: Consolidar IDs e dados e chamar **criarContaPagar** para gerar a PRÉVIA.

Forneça (quando disponíveis):
- fornecedor_id (do Step 1/2), categoria_id e centro_custo_id (do Step 3)
- Cabeçalho: valor, data_vencimento, data_emissao, numero_nota_fiscal, descricao
- Itens: numero_item?, descricao, quantidade, unidade?, valor_unitario, desconto?, acrescimo?, valor_total?, categoria_id?, centro_custo_id?, natureza_financeira_id?, observacao?

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Esta tool gera apenas PRÉVIA; a criação real ocorre na UI.
- NÃO invente payloads; a UI mostrará o cartão de prévia com os campos retornados.
`,
            tools: { criarContaPagar },
          };
        }
        return undefined;
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('💳 WORKFLOW CONTAS A PAGAR: Erro:', error)
    throw error
  }
}

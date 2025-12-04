import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage } from 'ai'
import { buscarClassificacoesFinanceiras } from '@/tools/contasPagarWorkflowTools'
import {
  buscarCliente,
  criarCliente,
  criarContaReceber
} from '@/tools/contasReceberWorkflowTools'

export const maxDuration = 300

const baseSystem = `Você é um assistente especializado em WORKFLOW de criação de Contas a Receber.

# 🎯 OBJETIVO
Guiar o usuário através do processo completo de criação de uma conta a receber, desde o upload do documento até o registro final no sistema.

# 🛠️ SUAS FERRAMENTAS

**buscarClassificacoesFinanceiras**
- Mostra todas classificações disponíveis
- Use ANTES de criar a conta para o usuário escolher

**buscarCliente**
- Input: cpf_cnpj ou nome
- Verifica se cliente já existe
- Diferencia CPF (11 dígitos) de CNPJ (14 dígitos)

**criarCliente**
- Input: nome, cpf_cnpj, tipo_pessoa, endereco, telefone, email
- Gera PRÉVIA com os dados para revisão. A criação real acontece ao clicar em "Criar" na UI.
- tipo_pessoa: "fisica" ou "juridica"

**criarContaReceber**
- Input (cabeçalho): cliente_id, categoria_id, centro_lucro_id, valor, data_vencimento, data_emissao, numero_nota_fiscal, descricao
- Itens: array de objetos com numero_item?, descricao, quantidade, unidade?, valor_unitario, desconto?, acrescimo?, valor_total?, categoria_id?, centro_lucro_id?, natureza_financeira_id?, observacao?
- Observação: se os itens não forem enviados, a API criará 1 item padrão com base no cabeçalho. Enviar os itens é RECOMENDADO para que a expansão da lista mostre o detalhamento correto.
- Gera PRÉVIA; a criação real ocorre após confirmação na UI.

# ⚠️ REGRAS OBRIGATÓRIAS PARA CHAMADA DE TOOLS
- Sempre que precisar listar classificações, CHAME a tool **buscarClassificacoesFinanceiras**. Não escreva blocos "function_calls"/"function_result" como texto.
- Para buscar clientes, CHAME **buscarCliente** (usa nome_fantasia ILIKE e/ou CPF/CNPJ normalizado). Sem filtros, liste TODOS com limite padrão (ex.: 100).
- NÃO invente arrays/listas em texto; a UI renderiza automaticamente o retorno das tools.
- Respostas textuais devem ser sucintas (1–2 linhas) e nunca substituir a chamada real das tools.

# ✅ INSTRUÇÕES IMPORTANTES

**Quando receber documento:**
- Faça OCR do documento (nota/fatura) e EXTRAIA:
  - Cabeçalho: nome_fantasia (cliente), CPF/CNPJ (apenas dígitos), numero_nota_fiscal, descricao, data_emissao (YYYY-MM-DD), data_vencimento (YYYY-MM-DD), valor_total (ponto como separador decimal)
  - Itens: descricao, quantidade, unidade (opcional), valor_unitario, desconto (opcional), acrescimo (opcional), valor_total (se ausente, calcule: quantidade*valor_unitario + acrescimo - desconto)
  - (Opcional) Parcelas: numero_parcela, data_vencimento, valor_liquido
  - Normalização: usar “.” como separador decimal; datas em YYYY-MM-DD; se valor_total do cabeçalho não for confiável, adote a soma dos itens

**Interação com usuário:**
- NÃO pergunte CPF/CNPJ se o NOME foi extraído com confiança — chame buscarCliente { nome } diretamente.
- Ordem de busca: cpf_cnpj (se existir) > nome (se existir) > listagem geral (sem filtros, com limite).
- Só peça CPF/CNPJ se a busca por NOME retornar múltiplos e for necessária para desambiguar.
- Ajude a escolher categoria/centro de lucro corretos (e dimensões opcionais) no passo de classificações.
- Seja proativo e conduza o fluxo naturalmente.

**Ao final:**
- Após a confirmação do usuário (clique em Criar na UI), confirme que a conta foi criada com sucesso e mostre o resumo (ID, valor, vencimento, status)

Você é um ASSISTENTE DE WORKFLOW. Conduza o usuário passo a passo de forma clara e eficiente.`

export async function POST(req: Request) {
  console.log('💰 WORKFLOW CONTAS A RECEBER: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('💰 WORKFLOW CONTAS A RECEBER: Messages:', messages?.length)

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
        buscarCliente,
        criarCliente,
        criarContaReceber,
      },
      // Reintrodução de 3 steps (sem travas), no padrão dos demais agentes
      prepareStep: ({ stepNumber }) => {
        if (stepNumber === 1) {
          return {
            system: baseSystem + `

# 🧭 Step 1 — Extrair dados e buscar cliente

Objetivo: Se houver documento, FAÇA OCR e extraia nome_fantasia e/ou CPF/CNPJ do cliente. Em seguida, CHAME **buscarCliente**:

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Prioridade de chamada: (1) cpf_cnpj (normalizado) se existir; (2) nome (nome_fantasia) se existir; (3) listagem geral (sem filtros, limite padrão) se não houver dados.
- NÃO pergunte CPF/CNPJ se o NOME foi extraído — execute buscarCliente { nome } diretamente. Só peça CPF/CNPJ se a busca por nome retornar múltiplos e precisar desambiguar.
- NÃO simule listas; a UI renderiza a tabela a partir do retorno da tool.
`,
            tools: { buscarCliente },
          };
        }

        if (stepNumber === 2) {
          return {
            system: baseSystem + `

# 🧭 Step 2 — Buscar Classificações Financeiras

Objetivo: CHAMAR **buscarClassificacoesFinanceiras** para listar as opções necessárias:
- Categoria Financeira (obrigatória)
- Centro de Lucro (obrigatório para CR)
- Naturezas financeiras (opcional)
- Departamentos/Filiais/Projetos (opcionais)

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- NÃO simule listas; a UI renderiza a tabela/grade a partir do retorno da tool.
`,
            tools: { buscarClassificacoesFinanceiras },
          };
        }

        if (stepNumber === 3) {
          return {
            system: baseSystem + `

# 🧭 Step 3 — Criar Conta a Receber (PRÉVIA)

Objetivo: Consolidar dados e CHAMAR **criarContaReceber** para gerar a PRÉVIA.

Forneça (quando disponíveis):
- cliente_id (do Step 1), categoria_id e centro_lucro_id (do Step 2)
- Dimensões opcionais: departamento_id, filial_id, projeto_id
- Cabeçalho: valor, data_vencimento, data_emissao, numero_nota_fiscal, descricao
- Itens: numero_item?, descricao, quantidade, unidade?, valor_unitario, desconto?, acrescimo?, valor_total?, categoria_id?, centro_lucro_id?, natureza_financeira_id?, observacao?

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Esta tool gera apenas PRÉVIA; a criação real acontece na UI.
- NÃO invente payloads; a UI mostrará o cartão de prévia com os campos retornados.
`,
            tools: { criarContaReceber },
          };
        }

        return undefined;
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('💰 WORKFLOW CONTAS A RECEBER: Erro:', error)
    throw error
  }
}

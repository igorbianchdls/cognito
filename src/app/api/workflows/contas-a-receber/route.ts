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
- Input: cliente_id, categoria_id, centro_custo_id, valor, data_vencimento, etc.
- Gera PRÉVIA; a criação real ocorre após confirmação na UI.

# ⚠️ REGRAS OBRIGATÓRIAS PARA CHAMADA DE TOOLS
- Sempre que precisar listar classificações, CHAME a tool **buscarClassificacoesFinanceiras**. Não escreva blocos "function_calls"/"function_result" como texto.
- Para buscar clientes, CHAME **buscarCliente** (usa nome_fantasia ILIKE e/ou CPF/CNPJ normalizado). Sem filtros, liste TODOS com limite padrão (ex.: 100).
- NÃO invente arrays/listas em texto; a UI renderiza automaticamente o retorno das tools.
- Respostas textuais devem ser sucintas (1–2 linhas) e nunca substituir a chamada real das tools.

# ✅ INSTRUÇÕES IMPORTANTES

**Quando receber documento:**
- Analise cuidadosamente e extraia TODOS os dados
- Liste os dados extraídos para o usuário confirmar quando necessário

**Interação com usuário:**
- Peça confirmação dos dados extraídos quando necessário
- Ajude a escolher categoria/centro de custo corretos
- Seja proativo e conduza o fluxo naturalmente

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

# 🧭 Step 1 — Analisar documento e buscar cliente

Objetivo: Se houver documento, extraia CPF/CNPJ e/ou nome_fantasia do cliente. Em seguida, CHAME a tool **buscarCliente**.

Regras obrigatórias:
- NÃO escreva "function_calls"/"function_result" em texto. Invoque a tool real.
- Se tiver CPF/CNPJ: buscarCliente { cpf_cnpj } (normalizar apenas dígitos)
- Se tiver nome (nome fantasia): buscarCliente { nome } (ILIKE case-insensitive em nome_fantasia)
- Sem dados: buscarCliente {} para listar TODOS (com limite padrão)
- NÃO simule listas; a UI renderiza a tabela a partir do retorno da tool.
`,
            tools: { buscarCliente },
          };
        }

        if (stepNumber === 2) {
          return {
            system: baseSystem + `

# 🧭 Step 2 — Buscar Classificações Financeiras

Objetivo: CHAMAR **buscarClassificacoesFinanceiras** para listar categorias financeiras, centros de custo e naturezas.

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

Objetivo: Consolidar dados (cliente_id, categoria_id, centro_custo_id, valor, data_vencimento, data_emissao, descricao, itens) e CHAMAR **criarContaReceber** para gerar a PRÉVIA.

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

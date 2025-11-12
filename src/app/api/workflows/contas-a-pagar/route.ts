import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage, stepCountIs, hasToolCall } from 'ai'
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
- Input: cnpj ou nome
- Verifica se fornecedor já existe

**criarFornecedor**
- Input: nome, cnpj, endereco, telefone, email
- Gera PRÉVIA com os dados para revisão. A criação real acontece ao clicar em "Criar" na UI.

**criarContaPagar**
- Input: fornecedor_id, categoria_id, centro_custo_id, valor, data_vencimento, etc.
- Gera PRÉVIA; a criação real ocorre após confirmação na UI.

# ✅ INSTRUÇÕES IMPORTANTES

**Quando receber documento:**
- Analise cuidadosamente e extraia TODOS os dados
- Liste os dados extraídos para o usuário confirmar

**Interação com usuário:**
- Peça confirmação dos dados extraídos quando necessário
- Ajude a escolher categoria/centro de custo corretos
- Seja proativo e conduza o fluxo naturalmente

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
      stopWhen: [stepCountIs(20), hasToolCall('criarContaPagar')],
      prepareStep: ({ stepNumber }) => {
        if (stepNumber === 1) {
          return {
            system: baseSystem + `

# 📍 STEP 1: EXTRAIR DADOS DO DOCUMENTO + BUSCAR FORNECEDOR

**Seu objetivo neste step:**
1. Se o usuário enviou um documento (imagem/PDF), extraia TODOS os dados:
   - Fornecedor (nome + CNPJ)
   - Valor total
   - Data de vencimento
   - Data de emissão
   - Número da nota fiscal
   - Itens/descrição (se houver)
2. Liste os dados extraídos para o usuário confirmar
3. Use a tool **buscarFornecedor** com o CNPJ extraído para verificar se o fornecedor já existe no sistema

**Tools disponíveis:**
- buscarFornecedor

**Próximo step:**
- Se fornecedor NÃO existe: Step 2 (criar fornecedor)
- Se fornecedor existe: Step 3 (buscar classificações)`,
            tools: {
              buscarFornecedor
            }
          }
        }

        if (stepNumber === 2) {
          return {
            system: baseSystem + `

# 📍 STEP 2: CRIAR FORNECEDOR (PRÉVIA)

**Seu objetivo neste step:**
1. O fornecedor não existe no sistema
2. Use a tool **criarFornecedor** com os dados extraídos do documento
3. IMPORTANTE: Esta tool gera apenas uma PRÉVIA. A criação real acontece quando o usuário clica em "Criar" na UI
4. Mostre a prévia do fornecedor ao usuário

**Tools disponíveis:**
- criarFornecedor

**Próximo step:**
- Após criar a prévia do fornecedor: Step 3 (buscar classificações)`,
            tools: {
              criarFornecedor
            }
          }
        }

        if (stepNumber === 3) {
          return {
            system: baseSystem + `

# 📍 STEP 3: BUSCAR CLASSIFICAÇÕES FINANCEIRAS

**Seu objetivo neste step:**
1. Use a tool **buscarClassificacoesFinanceiras** para mostrar as opções disponíveis
2. Retorna: categorias financeiras, centros de custo, naturezas financeiras
3. Com base na descrição da despesa/itens do documento, ajude o usuário a escolher:
   - Categoria financeira correta
   - Centro de custo adequado
   - Natureza financeira (se aplicável)
4. Aguarde o usuário informar suas escolhas (IDs)

**Tools disponíveis:**
- buscarClassificacoesFinanceiras

**Próximo step:**
- Após usuário escolher classificações: Step 4 (criar conta a pagar)`,
            tools: {
              buscarClassificacoesFinanceiras
            }
          }
        }

        if (stepNumber === 4) {
          return {
            system: baseSystem + `

# 📍 STEP 4: CRIAR CONTA A PAGAR (PRÉVIA)

**Seu objetivo neste step:**
1. Você tem TODOS os dados necessários:
   - Fornecedor ID (do step 1 ou 2)
   - Categoria ID (do step 3)
   - Centro de custo ID (do step 3)
   - Dados do documento (valor, vencimento, NF, etc.)
2. Use a tool **criarContaPagar** com TODOS esses dados
3. IMPORTANTE: Esta tool gera apenas a PRÉVIA. A criação real acontece quando o usuário clica em "Criar" na UI
4. Mostre o resumo completo da conta a pagar ao usuário

**Tools disponíveis:**
- criarContaPagar

**Final do workflow:**
- Após gerar a prévia, aguarde o usuário clicar em "Criar" na UI
- Confirme o sucesso e mostre o resumo final`,
            tools: {
              criarContaPagar
            }
          }
        }

        // Default: todas as tools disponíveis
        return {
          system: baseSystem,
          tools: {
            buscarClassificacoesFinanceiras,
            buscarFornecedor,
            criarFornecedor,
            criarContaPagar
          }
        }
      }
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('💳 WORKFLOW CONTAS A PAGAR: Erro:', error)
    throw error
  }
}

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
      tools: undefined,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('💰 WORKFLOW CONTAS A RECEBER: Erro:', error)
    throw error
  }
}

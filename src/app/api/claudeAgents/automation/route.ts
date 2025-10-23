import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage, generateObject } from 'ai'
import { z } from 'zod'
import { findFornecedor, createFornecedor, createContaAPagar, automationSummary } from '@/tools/automationTools'

export const maxDuration = 300

// Schema do OCR da fatura
const faturaOcrSchema = z.object({
  fornecedor_nome: z.string().optional(),
  fornecedor_cnpj: z.string().optional(),
  numero_documento: z.string().optional(),
  data_emissao: z.string().optional(),
  data_vencimento: z.string().optional(),
  valor_total: z.number().optional(),
})

export async function POST(req: Request) {
  console.log('⚙️ AUTOMATION AGENT: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('⚙️ AUTOMATION AGENT: Messages:', messages?.length)

  try {
    // Tenta localizar um "file part" (PDF/Imagem) nos messages para OCR
    const lastUserMsg = [...(messages || [])].reverse().find((m) => m.role === 'user')
    const filePart = lastUserMsg?.parts?.find((p: any) => p.type === 'file' && (p.mediaType?.includes('pdf') || p.mediaType?.startsWith('image/')))

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 8000 },
        },
      },
      system: `Você é um orquestrador de automações operacionais. Objetivo: processar documentos (faturas) para cadastrar fornecedores e contas a pagar.

Fluxo sugerido quando o usuário enviar um PDF/Imagem de fatura:
1) Fazer OCR do documento com visão e extrair campos: fornecedor_nome, fornecedor_cnpj, numero_documento, data_emissao, data_vencimento, valor_total.
2) Consultar fornecedor por CNPJ ou nome (findFornecedor). Se não existir, criar (createFornecedor).
3) Criar conta a pagar (createContaAPagar) com status Pendente.
4) Exibir resumo final via (automationSummary), com os dados extraídos e IDs criados.

Se faltar arquivo, solicite ao usuário anexar um PDF ou imagem da fatura.`,

      messages: convertToModelMessages(messages),

      tools: {
        findFornecedor,
        createFornecedor,
        createContaAPagar,
        automationSummary,
      },

      // Orquestração automática step-by-step: O modelo decide quando chamar as tools.
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('⚙️ AUTOMATION AGENT: Erro:', error)
    throw error
  }
}


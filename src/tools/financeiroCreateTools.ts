import { z } from 'zod'
import { tool } from 'ai'

export const criarCentroCusto = tool({
  description: 'Prévia de criação de Centro de Custo. Só cria ao clicar em Criar na UI.',
  inputSchema: z.object({
    nome: z.string().min(1, 'nome é obrigatório'),
    codigo: z.string().optional(),
    descricao: z.string().optional(),
    ativo: z.boolean().optional(),
  }),
  execute: async ({ nome, codigo, descricao, ativo }) => {
    const payload = {
      nome: String(nome || '').trim(),
      codigo: codigo ? String(codigo).trim() : undefined,
      descricao: descricao ? String(descricao).trim() : undefined,
      ativo: typeof ativo === 'boolean' ? ativo : true,
    }
    const validations: Array<{ field: string; status: 'ok' | 'warn' | 'error'; message?: string }> = []
    if (!payload.nome) validations.push({ field: 'nome', status: 'error', message: 'Informe o nome' })
    return {
      success: validations.every(v => v.status !== 'error'),
      preview: true,
      title: 'Centro de Custo (Prévia)',
      message: 'Revise os campos e clique em Criar para confirmar.',
      payload,
      validations,
      metadata: { entity: 'centro_custo', action: 'create', commitEndpoint: '/api/agent-tools/financeiro/centros-custo/criar' }
    } as const
  }
})


import { z } from 'zod'
import { ErpDomainError } from './erpErrors'

const optionalText = z.string().trim().max(500).default('')
const identity = z.string().regex(/^[1-9]\d*$/).optional()
const contact = z.object({
  id: identity, nome: z.string().trim().min(1).max(200), cargo: optionalText,
  email: z.union([z.literal(''), z.string().trim().email()]).default(''), telefone: optionalText,
  whatsapp: z.boolean().default(false), finalidades: z.array(z.enum(['comercial','financeiro','operacional'])).min(1),
  principais: z.array(z.enum(['comercial','financeiro','operacional'])).default([]),
}).strict().refine(v => Boolean(v.email || v.telefone), 'Informe e-mail ou telefone do contato.')
const address = z.object({
  id: identity, identificacao: z.string().trim().min(1).max(200), logradouro: z.string().trim().min(1).max(500),
  numero: optionalText, complemento: optionalText, bairro: optionalText, cidade: z.string().trim().min(1).max(200),
  uf: z.string().trim().max(2).default(''), cep: optionalText, pais: z.string().trim().min(1).default('Brasil'),
  finalidades: z.array(z.enum(['comercial','cobranca','prestacao'])).min(1),
  principais: z.array(z.enum(['comercial','cobranca','prestacao'])).default([]),
}).strict()
export const registrationRelationsSchema = z.object({ contatos: z.array(contact).max(100).optional(), enderecos: z.array(address).max(100).optional() }).superRefine((value, ctx) => {
  for (const key of ['contatos','enderecos'] as const) {
    const ids = new Set<string>(), primary = new Set<string>()
    for (const [index, row] of (value[key] || []).entries()) {
      const invalid = (message: string) => ctx.addIssue({ code: 'custom', path: [key,index], message })
      if (row.id && ids.has(row.id)) invalid('Registro repetido.')
      if (row.id) ids.add(row.id)
      if (new Set(row.finalidades).size !== row.finalidades.length || new Set(row.principais).size !== row.principais.length) invalid('Finalidade repetida.')
      for (const purpose of row.principais) {
        if (!(row.finalidades as string[]).includes(purpose) || primary.has(purpose)) invalid('Defina apenas um principal para cada finalidade selecionada.')
        primary.add(purpose)
      }
    }
  }
})
export type RegistrationRelations = z.infer<typeof registrationRelationsSchema>
export function parseRegistrationRelations(values: Record<string, unknown>): RegistrationRelations {
  const parsed = registrationRelationsSchema.safeParse(values)
  if (!parsed.success) throw new ErpDomainError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Revise contatos e endereços.', 422, parsed.error.flatten())
  return parsed.data
}

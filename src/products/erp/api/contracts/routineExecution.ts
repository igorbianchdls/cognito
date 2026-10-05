import { z } from 'zod'
import { erpDateSchema } from '../../shared/erpTransport'

export const contractExecutionBody = z.object({ ate: erpDateSchema.optional() }).strict()
export const recurrenceExecutionBody = contractExecutionBody.extend({ limite: z.number().int().min(1).max(100).optional() }).strict()
export const reversePaymentBody = z.object({ motivo: z.string().trim().max(1000).nullable().optional() }).strict()

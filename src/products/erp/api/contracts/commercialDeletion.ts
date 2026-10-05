import { z } from 'zod'
import { erpVersionSchema } from '../../shared/erpTransport'
export const commercialDeleteBody = z.object({ expectedVersion: erpVersionSchema, motivo: z.string().trim().min(3).max(1000) }).strict()

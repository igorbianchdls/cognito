import { z } from 'zod'

export const bankImportBody = z.object({
  accountId: z.union([z.number(), z.string().regex(/^[1-9]\d*$/).transform(Number)]).pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
  fileName: z.string().trim().min(1).max(255).default('extrato.ofx'),
  content: z.string().min(1).max(4 * 1024 * 1024),
}).strict()

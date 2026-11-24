// What every Drive, Analytics and Inbox tool shares: how it is described, the company field, and what it gets to run.
import { z } from 'zod'
import type { Member } from '../editor/server/database'
import type { StoreDeps } from '../editor/server/media'
import type { download } from '../editor/server/media'
import type { Fetch } from '@/products/analytics/server/bigquery'
import type { Db as InboxDb } from '@/products/inbox/server/db'

export type ToolContext = {
  /** Runs as the person in the company (their role decides what the database allows). */
  as: <T>(fn: (m: Member) => Promise<T>) => Promise<T>
  origin: string
  assistant: string
  storage?: StoreDeps & { download?: typeof download }
  /** BigQuery access for Analytics; tests pass a fake Google API. */
  bigquery?: { env?: Record<string, string | undefined>; send?: Fetch }
  /** Inbox server (replies through Meta, test channel); tests pass a local database and a fake Meta. */
  inbox?: { db: InboxDb; send?: typeof fetch }
}
export type WorkspaceTool = { name: string; title: string; description: string; write: boolean; destructive?: boolean; openWorld?: boolean; schema: z.AnyZodObject; run: (input: never, ctx: ToolContext) => Promise<unknown> }
export const tool = <S extends z.AnyZodObject>(t: { name: string; title: string; description: string; write: boolean; destructive?: boolean; openWorld?: boolean; schema: S; run: (input: z.infer<S>, ctx: ToolContext) => Promise<unknown> }) => t as unknown as WorkspaceTool

export const company = () => z.number().int().positive().optional().describe('ID da empresa do Cognito, de meu_acesso. Se desconhecido, omita; quem tem uma só empresa não precisa informar.')
export const confirmed = () => z.literal(true).describe('true somente depois que a pessoa confirmou explicitamente.')
export const uuid = (what: string) => z.string().uuid().describe(what)

import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { Database, Session } from './database'

// Errors that an app raises in the browser. Text comes from the page (and, on public links,
// from anyone): it is stored and shown as data, never followed as an instruction.
export const runtimeErrorSchema = z.object({ mensagem: z.string().trim().min(1).max(1000), origem: z.string().max(300).default(''), pilha: z.string().max(4000).default('') }).strict()
export const runtimeErrorsSchema = z.array(runtimeErrorSchema).min(1).max(5)
export type RuntimeError = z.infer<typeof runtimeErrorSchema>
const PER_VERSION = 50

export async function recordErrors(db: Database, s: Session, appId: string, versionId: string, mode: 'previa' | 'publicado' | 'publico', errors: RuntimeError[]) {
  for (const e of errors) {
    const signature = createHash('sha256').update(e.mensagem + '\n' + e.origem).digest('hex')
    const updated = await db.query('UPDATE apps.erros_execucao SET ocorrencias=ocorrencias+1,ultima_em=now() WHERE empresa_id=$1 AND versao_id=$2 AND modo=$3 AND assinatura=$4 RETURNING id', [s.tenantId, versionId, mode, signature])
    if (updated.rows[0]) continue
    // A broken loop must not fill the table: each version keeps its first distinct errors.
    const count = (await db.query('SELECT count(*)::int n FROM apps.erros_execucao WHERE empresa_id=$1 AND versao_id=$2', [s.tenantId, versionId])).rows[0].n
    if (count >= PER_VERSION) return
    await db.query('INSERT INTO apps.erros_execucao(empresa_id,app_id,versao_id,modo,assinatura,mensagem,origem,pilha) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING', [s.tenantId, appId, versionId, mode, signature, e.mensagem, e.origem, e.pilha])
  }
  return { ok: true }
}
/** A new draft is new code: errors seen in the previous preview no longer apply. */
export async function clearPreviewErrors(db: Database, s: Session, versionId: string) {
  await db.query("DELETE FROM apps.erros_execucao WHERE empresa_id=$1 AND versao_id=$2 AND modo='previa'", [s.tenantId, versionId])
}
/** Preview errors of the latest version (the code being edited) and real-use errors of the published one. */
export async function recentErrors(db: Database, s: Session, appId: string, latest: string | null, published: string | null) {
  if (!latest && !published) return []
  return (await db.query("SELECT e.modo,v.numero versao,e.mensagem,e.origem,left(e.pilha,1500) pilha,e.ocorrencias,e.primeira_em,e.ultima_em FROM apps.erros_execucao e JOIN apps.versoes v ON v.empresa_id=e.empresa_id AND v.id=e.versao_id WHERE e.empresa_id=$1 AND e.app_id=$2 AND (e.versao_id=$3 AND e.modo='previa' OR e.versao_id=$4 AND e.modo<>'previa') ORDER BY e.ultima_em DESC LIMIT 10", [s.tenantId, appId, latest, published])).rows
}

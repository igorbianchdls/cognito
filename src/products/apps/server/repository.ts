import type { App, Version } from '../shared/contracts'
import { AppsError } from '../shared/contracts'
import type { Database, Session } from './database'

export const appSelect = `SELECT a.*, EXISTS(SELECT 1 FROM apps.favoritos f WHERE f.empresa_id=a.empresa_id AND f.app_id=a.id AND f.usuario_id=$2) favorito,
 p.id publicacao_id,p.versao_id versao_publicada_id,EXISTS(SELECT 1 FROM apps.versoes v WHERE v.empresa_id=a.empresa_id AND v.app_id=a.id AND v.estado='rascunho') tem_rascunho,
 ac.modo acesso,ac.slug endereco
 FROM apps.apps a LEFT JOIN apps.publicacoes p ON p.empresa_id=a.empresa_id AND p.app_id=a.id AND p.estado='ativa'
 LEFT JOIN apps.acessos ac ON ac.empresa_id=a.empresa_id AND ac.app_id=a.id`
export async function getApp(db: Database, s: Session, id: string, lock = false, includeTrash = false): Promise<App> {
  if (lock) await db.query('SELECT id FROM apps.apps WHERE empresa_id=$1 AND id=$2 FOR UPDATE', [s.tenantId, id])
  const a = (await db.query(appSelect + ` WHERE a.empresa_id=$1 AND a.id=$3 ${includeTrash ? '' : 'AND a.excluido_em IS NULL'}`, [s.tenantId, s.sharedUserId, id])).rows[0]
  if (!a) throw new AppsError('NOT_FOUND', 'App não encontrado.', 404)
  return a as App
}
export function expected(app: App, version: number) {
  if (app.versao_concorrencia !== version) throw new AppsError('VERSION_CONFLICT', 'O app mudou. Recarregue antes de salvar suas alterações.', 409)
}
export function editable(s: Session) { if (s.role === 'viewer') throw new AppsError('READ_ONLY', 'Seu acesso permite apenas consultas.', 403) }
export function publisher(s: Session) { if (!['owner', 'admin'].includes(s.role)) throw new AppsError('FORBIDDEN', 'Somente administradores podem publicar ou restaurar versões.', 403) }
export function available(app: App) { if (app.excluido_em || app.arquivado_em) throw new AppsError('APP_UNAVAILABLE', 'Restaure o app antes de continuar.', 409) }
export async function versions(db: Database, s: Session, id: string): Promise<Version[]> { return (await db.query('SELECT * FROM apps.versoes WHERE empresa_id=$1 AND app_id=$2 ORDER BY numero DESC', [s.tenantId, id])).rows as Version[] }
export async function bump(db: Database, s: Session, id: string) { await db.query('UPDATE apps.apps SET versao_concorrencia=versao_concorrencia+1,atualizado_em=clock_timestamp(),atualizado_por=$3 WHERE empresa_id=$1 AND id=$2', [s.tenantId, id, s.sharedUserId]) }
export async function event(db: Database, s: Session, id: string, action: string, operation?: string) { await db.query('INSERT INTO apps.eventos(empresa_id,app_id,usuario_id,acao,operacao_id) VALUES($1,$2,$3,$4,$5)', [s.tenantId, id, s.sharedUserId, action, operation ?? null]) }

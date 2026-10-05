import { readFileSync } from 'node:fs'
export const migrationFile='20261005180000_professionalize_shared.sql'
export const tableNames={users:'usuarios',tenants:'empresas',tenant_memberships:'usuarios_empresas',erp_permission_profiles:'perfis_acesso',erp_profile_permissions:'permissoes_perfil',tenant_invitations:'convites_empresa'}
export function rewriteSharedSQL(sql) {
  for(const [oldName,newName] of Object.entries(tableNames)) sql=sql.replaceAll('shared.'+oldName,'shared.'+newName)
  return sql.replace(/\btenant_id\b/g,'empresa_id').replace(/\berp_profile_id\b/g,'perfil_acesso_id')
    .replace(/\b(memberships|m)\.user_id\b/g,'$1.usuario_id').replace(/\b(permissions|p)\.profile_id\b/g,'$1.perfil_acesso_id')
    .replace(/\bprofile_id\b/g,'perfil_acesso_id')
}
export async function applySharedMigration(db) {
  // The historical, local-only fixture includes three already-retired AI tables.
  // Remote migration runners use pg.query and never call this fixture helper.
  await db.exec('DROP TABLE IF EXISTS shared.ai_action_approvals,shared.ai_connections,shared.ai_tool_executions CASCADE')
  await db.exec(readFileSync(new URL('../../supabase/migrations/'+migrationFile,import.meta.url),'utf8'))
}

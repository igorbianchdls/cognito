import { runQuery, withTransaction } from '@/lib/postgres'
import {enqueueClerkOperation,processClerkOperation} from './clerkOutbox'
import type {ErpAccessProfile} from '@/products/erp/shared/professionalContracts'
import type {
  SettingsMember,
  SettingsProfile,
  SettingsState,
  SettingsWorkspace,
  UpdateMemberInput,
  UpdateWorkspaceInput,
  WorkspaceMemberStatus,
} from '@/products/auth/shared/settingsContracts'
import type { AuthTenantRole } from '@/products/auth/shared/authContracts'

type SettingsRow = {
  avatar_url: string | null
  clerk_membership_id: string | null
  clerk_organization_id: string | null
  clerk_organization_slug: string | null
  clerk_user_id: string | null
  email: string
  full_name: string | null
  role: string
  status: string
  empresa_id: string | number
  tenant_name: string
  tenant_slug: string | null
  tenant_status: string
  usuario_id: string | number
  perfil_acesso_id: ErpAccessProfile
  sync_pending: boolean
}

function normalizeRole(value: unknown): AuthTenantRole {
  return value === 'owner' || value === 'admin' || value === 'viewer' ? value : 'member'
}

function normalizeStatus(value: unknown): WorkspaceMemberStatus {
  return value === 'invited' || value === 'suspended' ? value : 'active'
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeWorkspaceSlug(value: string) {
  const slug = slugify(value)
  if (slug.length < 2) throw new Error('Slug deve ter pelo menos 2 caracteres.')
  if (slug.length > 80) throw new Error('Slug deve ter no maximo 80 caracteres.')
  return slug
}

export function normalizeWorkspaceName(value: string) {
  const name = String(value || '').trim().replace(/\s+/g, ' ')
  if (name.length < 2) throw new Error('Nome deve ter pelo menos 2 caracteres.')
  if (name.length > 120) throw new Error('Nome deve ter no maximo 120 caracteres.')
  return name
}

export function normalizeFullName(value: string) {
  const name = String(value || '').trim().replace(/\s+/g, ' ')
  if (name.length < 2) throw new Error('Nome deve ter pelo menos 2 caracteres.')
  if (name.length > 120) throw new Error('Nome deve ter no maximo 120 caracteres.')
  return name
}

function toMember(row: SettingsRow): SettingsMember {
  return {
    avatarUrl: row.avatar_url,
    clerkMembershipId: row.clerk_membership_id,
    clerkOrganizationId: row.clerk_organization_id,
    clerkUserId: row.clerk_user_id,
    email: row.email,
    fullName: row.full_name,
    role: normalizeRole(row.role),
    status: normalizeStatus(row.status),
    userId: Number(row.usuario_id),
    profileId: row.perfil_acesso_id,
    syncPending: row.sync_pending,
  }
}

export async function getSettingsState(input: {
  sharedUserId: number
  tenantId: number
}): Promise<SettingsState> {
  const rows = await runQuery<SettingsRow>(
    `SELECT
       users.id::text AS usuario_id,
       users.email::text AS email,
       users.full_name::text AS full_name,
       users.avatar_url::text AS avatar_url,
       users.clerk_user_id::text AS clerk_user_id,
       tenants.id::text AS empresa_id,
       tenants.name::text AS tenant_name,
       tenants.slug::text AS tenant_slug,
       tenants.clerk_organization_id::text AS clerk_organization_id,
       tenants.clerk_organization_slug::text AS clerk_organization_slug,
       tenants.status::text AS tenant_status,
       memberships.clerk_membership_id::text AS clerk_membership_id,
       memberships.role::text AS role,
       memberships.status::text AS status,
       memberships.perfil_acesso_id,
       EXISTS(SELECT 1 FROM shared.eventos_webhook w WHERE w.provedor='clerk_outbox' AND w.entidade_id=tenants.clerk_organization_id||':'||users.clerk_user_id AND w.status IN ('pending','failed','processing')) AS sync_pending
     FROM shared.usuarios_empresas AS memberships
     JOIN shared.usuarios AS users
       ON users.id = memberships.usuario_id
     JOIN shared.empresas AS tenants
       ON tenants.id = memberships.empresa_id
     WHERE memberships.empresa_id = $1
     ORDER BY
       CASE memberships.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'member' THEN 3
         WHEN 'viewer' THEN 4
         ELSE 5
       END,
       users.full_name ASC NULLS LAST,
       users.email ASC`,
    [input.tenantId],
  )

  const current = rows.find((row) => Number(row.usuario_id) === input.sharedUserId)
  if (!current) throw new Error('Usuario nao tem acesso ao workspace.')

  const profile: SettingsProfile = {
    avatarUrl: current.avatar_url,
    clerkUserId: current.clerk_user_id || '',
    email: current.email,
    fullName: current.full_name,
    sharedUserId: Number(current.usuario_id),
  }

  const workspace: SettingsWorkspace = {
    clerkOrganizationId: current.clerk_organization_id,
    clerkOrganizationSlug: current.clerk_organization_slug,
    id: Number(current.empresa_id),
    name: current.tenant_name,
    slug: current.tenant_slug,
    status: current.tenant_status,
  }

  return {
    currentUserRole: normalizeRole(current.role),
    members: rows.map(toMember),
    profile,
    workspace,
  }
}

export async function updateSharedUserProfile(input: {
  avatarUrl?: string | null
  fullName: string
  sharedUserId: number
}): Promise<SettingsProfile> {
  const fullName = normalizeFullName(input.fullName)
  const rows = await runQuery<SettingsRow>(
    `UPDATE shared.usuarios
     SET
       full_name = $2,
       avatar_url = COALESCE($3, avatar_url),
       metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('updatedBy', 'settings_profile', 'updatedAt', now()),
       updated_at = now()
     WHERE id = $1
     RETURNING
       id::text AS usuario_id,
       email::text AS email,
       full_name::text AS full_name,
       avatar_url::text AS avatar_url,
       clerk_user_id::text AS clerk_user_id,
       0::text AS empresa_id,
       ''::text AS tenant_name,
       NULL::text AS tenant_slug,
       NULL::text AS clerk_organization_id,
       NULL::text AS clerk_organization_slug,
       ''::text AS tenant_status,
       NULL::text AS clerk_membership_id,
       'owner'::text AS role,
       'active'::text AS status`,
    [input.sharedUserId, fullName, input.avatarUrl || null],
  )
  const row = rows[0]
  if (!row) throw new Error('Usuario nao encontrado.')
  return {
    avatarUrl: row.avatar_url,
    clerkUserId: row.clerk_user_id || '',
    email: row.email,
    fullName: row.full_name,
    sharedUserId: Number(row.usuario_id),
  }
}

export async function updateWorkspace(input: { tenantId: number; values: UpdateWorkspaceInput }): Promise<SettingsWorkspace> {
  const name=normalizeWorkspaceName(input.values.name),slug=normalizeWorkspaceSlug(input.values.slug)
  const outcome=await withTransaction(async client=>{
    await client.query("SELECT set_config('app.shared_source','settings_workspace',true)")
    const result=await client.query("UPDATE shared.empresas SET name=$2,slug=$3,updated_at=now() WHERE id=$1 AND status='active' RETURNING id,name,slug,status,clerk_organization_id,clerk_organization_slug",[input.tenantId,name,slug])
    const row=result.rows[0]
    if(!row)throw new Error('Empresa nao encontrada ou sem acesso ativo.')
    const operationId=row.clerk_organization_id?await enqueueClerkOperation(client,{type:'organization',organizationId:String(row.clerk_organization_id),name,slug}):null
    return {row,operationId}
  })
  if(outcome.operationId)await processClerkOperation(outcome.operationId)
  const row=outcome.row
  return {id:Number(row.id),name:String(row.name),slug:String(row.slug),status:String(row.status),clerkOrganizationId:row.clerk_organization_id as string|null,clerkOrganizationSlug:row.clerk_organization_slug as string|null}
}

export async function updateWorkspaceMember(input: {
  actorUserId: number
  tenantId: number
  values: UpdateMemberInput
}): Promise<SettingsMember> {
  const allowedRoles=['owner','admin','member','viewer']
  const allowedStatuses=['active','suspended']
  const profiles=['administrador','consulta','financeiro','vendas','compras','estoque']
  const values=input.values
  if(values.role && !allowedRoles.includes(values.role)) throw new Error('Papel invalido.')
  if(values.status && !allowedStatuses.includes(values.status)) throw new Error('Estado invalido. Convites sao gerenciados separadamente.')
  if(values.profileId && !profiles.includes(values.profileId)) throw new Error('Perfil invalido.')
  if(!values.role && !values.status && !values.profileId) throw new Error('Nada para atualizar.')
  const reason=String(values.reason || '').trim()
  if(reason.length>1000)throw new Error('Motivo muito longo.')
  const result=await withTransaction(async client=>{
    const company=await client.query("SELECT id FROM shared.empresas WHERE id=$1 AND status='active' FOR UPDATE",[input.tenantId])
    if(!company.rows.length)throw new Error('Empresa sem acesso ativo.')
    const identity=await client.query("SELECT id FROM shared.usuarios WHERE id=$1 AND status='active'",[input.actorUserId])
    if(!identity.rows.length)throw new Error('Usuario sem acesso ativo.')
    const memberships=await client.query('SELECT usuario_id,role,status,perfil_acesso_id,suspenso_localmente FROM shared.usuarios_empresas WHERE empresa_id=$1 AND usuario_id=ANY($2::bigint[]) FOR UPDATE',[input.tenantId,[input.actorUserId,values.userId]])
    const actor=memberships.rows.find(row=>Number(row.usuario_id)===input.actorUserId)
    const target=memberships.rows.find(row=>Number(row.usuario_id)===values.userId)
    if(!actor || actor.status!=='active' || actor.suspenso_localmente || !['owner','admin'].includes(String(actor.role)))throw new Error('Acesso negado.')
    if(!target)throw new Error('Membro nao encontrado.')
    if(actor.role!=='owner' && (target.role==='owner' || values.role==='owner'))throw new Error('Somente um proprietario pode alterar outro proprietario.')
    const role=values.role || String(target.role)
    const profile=role==='owner'||role==='admin'?'administrador':values.profileId || (target.perfil_acesso_id==='administrador'?'consulta':String(target.perfil_acesso_id))
    if(!['owner','admin'].includes(role) && profile==='administrador')throw new Error('Perfil administrador exige papel de administrador.')
    await client.query("SELECT set_config('app.shared_actor_id',$1,true),set_config('app.shared_source','settings_members',true),set_config('app.shared_reason',$2,true)",[String(input.actorUserId),reason])
    const updated=await client.query("UPDATE shared.usuarios_empresas SET role=$3,perfil_acesso_id=$4,status=COALESCE($5,status),suspenso_localmente=CASE WHEN $5 IS NULL THEN suspenso_localmente ELSE $5='suspended' END, metadata=metadata||jsonb_build_object('accessRoleManaged',true,'updatedBy','settings_members'),updated_at=now() WHERE empresa_id=$1 AND usuario_id=$2 RETURNING usuario_id",[input.tenantId,values.userId,role,profile,values.status || null])
    if(!updated.rows.length)throw new Error('Membro nao encontrado.')
    const ids=await client.query('SELECT e.clerk_organization_id,u.clerk_user_id FROM shared.empresas e JOIN shared.usuarios u ON u.id=$2 WHERE e.id=$1',[input.tenantId,values.userId])
    const row=ids.rows[0];let operationId:number|null=null
    if(values.role && row?.clerk_organization_id && row?.clerk_user_id)operationId=await enqueueClerkOperation(client,{type:'membership',organizationId:String(row.clerk_organization_id),clerkUserId:String(row.clerk_user_id),appRole:role as AuthTenantRole})
    return {operationId}
  })
  if(result.operationId)await processClerkOperation(result.operationId)
  const state=await getSettingsState({sharedUserId:input.actorUserId,tenantId:input.tenantId})
  const member=state.members.find(row=>row.userId===values.userId)
  if(!member)throw new Error('Membro nao encontrado apos atualizacao.')
  return member
}

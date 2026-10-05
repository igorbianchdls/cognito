import { withTransaction, type SQLClient } from '@/lib/postgres'
import { clerkClient } from '@clerk/nextjs/server'
import { syncClerkProfileWithClient, markClerkUserDeletedWithClient } from './clerkTenantBootstrap'
import { syncClerkOrganization, syncClerkOrganizationMembership, syncClerkOrganizationInvitation, markClerkOrganizationDeletedWithClient } from './clerkOrganizationSync'

type RecordValue=Record<string,unknown>
export type VerifiedClerkEvent={ type: string; timestamp?: number; data: unknown }
const record=(value:unknown):RecordValue=>value && typeof value==='object'&&!Array.isArray(value)?value as RecordValue:{}
const text=(value:unknown)=>typeof value==='string'?value.trim():''

async function ensureOrganization(client:Pick<SQLClient,'query'>,data:RecordValue) {
  const id=text(data.organization_id)||text(record(data.organization).id)||text(record(data.public_organization_data).id)
  if(!id)throw new Error('MISSING_ORGANIZATION')
  const found=await client.query('SELECT id FROM shared.empresas WHERE clerk_organization_id=$1',[id])
  if(found.rows.length)return
  const organization=await (await clerkClient()).organizations.getOrganization({organizationId:id})
  await syncClerkOrganization(client,{id:organization.id,name:organization.name,slug:organization.slug,public_metadata:organization.publicMetadata,private_metadata:organization.privateMetadata})
}

async function dispatch(client:Pick<SQLClient,'query'>,event:VerifiedClerkEvent):Promise<boolean> {
  const data=record(event.data),type=event.type.toLowerCase()
  if(type==='user.deleted'){await markClerkUserDeletedWithClient(client,text(data.id));return true}
  if(type==='user.created'||type==='user.updated'){
    const emails=Array.isArray(data.email_addresses)?data.email_addresses.map(record):[]
    const primary=emails.find(email=>email.id===data.primary_email_address_id)||emails[0]
    if(!primary || !text(primary.email_address))throw new Error('MISSING_EMAIL')
    await syncClerkProfileWithClient(client,{clerkUserId:text(data.id),clerkOrganizationId:null,
      email:text(primary.email_address),emailVerified:record(primary.verification).status==='verified',
      fullName:[text(data.first_name),text(data.last_name)].filter(Boolean).join(' ')||null,
      avatarUrl:text(data.image_url)||null})
    return true
  }
  if(type==='organization.deleted'){await markClerkOrganizationDeletedWithClient(client,text(data.id));return true}
  if(type==='organization.created'||type==='organization.updated')return Boolean(await syncClerkOrganization(client,data))
  if(/^organization_?membership\./.test(type)){
    await ensureOrganization(client,data)
    return syncClerkOrganizationMembership(client,data,{deleted:type.endsWith('.deleted')})
  }
  if(/^organization_?invitation\./.test(type)){
    await ensureOrganization(client,data)
    return syncClerkOrganizationInvitation(client,{...data,status:type.endsWith('.accepted')?'accepted':type.endsWith('.revoked')?'revoked':data.status})
  }
  return false
}

export async function processVerifiedClerkEvent(eventId:string,event:VerifiedClerkEvent):Promise<{duplicate?:boolean;ignored?:boolean}> {
  const data=record(event.data),type=event.type.toLowerCase()
  const supported=/^(user|organization|organization_?membership|organization_?invitation)\./.test(type)
  const id=text(data.id)||(!supported?eventId:'')
  const milliseconds=Number(data.updated_at || event.timestamp || data.created_at || (!supported?1:0))
  if(!eventId || eventId.length>200 || !id || !Number.isFinite(milliseconds) || milliseconds<=0)
    throw new Error('INVALID_EVENT_ENVELOPE')
  const occurred=new Date(milliseconds).toISOString()
  const category=type.slice(0,type.lastIndexOf('.')).replaceAll('_','')
  const entity=`${category}:${id}`
  await withTransaction(async client=>{
    await client.query(`INSERT INTO shared.eventos_webhook(provedor,evento_id,tipo,entidade_id,ocorrido_em)
      VALUES('clerk',$1,$2,$3,$4) ON CONFLICT(provedor,evento_id) DO NOTHING`,[eventId,type,entity,occurred])
  })
  try{
    return await withTransaction(async client=>{
      await client.query('SELECT pg_advisory_xact_lock(73007,hashtext($1))',[entity])
      const receipt=await client.query(`SELECT id,status,tipo,entidade_id,ocorrido_em FROM shared.eventos_webhook WHERE provedor='clerk' AND evento_id=$1 FOR UPDATE`,[eventId])
      const row=receipt.rows[0]
      if(row.tipo!==type||row.entidade_id!==entity||new Date(row.ocorrido_em as string|Date).toISOString()!==occurred)throw new Error('EVENT_ID_COLLISION')
      if(['processed','ignored'].includes(String(row.status)))return {duplicate:true}
      const newer=await client.query(`SELECT id FROM shared.eventos_webhook WHERE provedor='clerk' AND entidade_id=$1
        AND status='processed' AND id<>$3
        AND (ocorrido_em>$2 OR (ocorrido_em=$2 AND ($4=false OR tipo LIKE '%.deleted'))) LIMIT 1`,[entity,occurred,row.id,type.endsWith('.deleted')])
      if(newer.rows.length){
        await client.query("UPDATE shared.eventos_webhook SET status='ignored',tentativas=tentativas+1,processado_em=now() WHERE id=$1",[row.id])
        return {ignored:true}
      }
      await client.query("SELECT set_config('app.shared_source','clerk_webhook',true)")
      const applied=await dispatch(client,event)
      await client.query(`UPDATE shared.eventos_webhook SET status=$2,tentativas=tentativas+1,processado_em=now(),erro_codigo=NULL WHERE id=$1`,[row.id,applied?'processed':'ignored'])
      return applied?{}:{ignored:true}
    })
  }catch{
    await withTransaction(client=>client.query(`UPDATE shared.eventos_webhook SET status='failed',tentativas=tentativas+1,erro_codigo='CLERK_EVENT_FAILED',proxima_tentativa_em=now()+interval '1 minute'
      WHERE provedor='clerk' AND evento_id=$1 AND status NOT IN ('processed','ignored')`,[eventId]))
    throw new Error('CLERK_EVENT_FAILED')
  }
}

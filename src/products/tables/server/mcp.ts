import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { Database, TablesSession } from './database'
import * as service from './service'
import { getBundle, readFields, readRecord, requireBase, requireTable, assertVersion } from './repository'
import { listRecords } from './queries'
import { attachmentAction, prepareAttachment, attachmentInputSchema } from './storage'
import { baseInputSchema, fieldInputSchema, viewInputSchema, listQuerySchema, TablesError, type Values, type DataRecord } from '../shared/contracts'

// Only validated MCP schemas reach this internal adapter. Database rows use the
// same open shape as the product repositories; inputs are validated again there.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Input = Record<string, any>
export function digest(value: unknown): string {
  function canonical(v: unknown): unknown { if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object'&&!(v instanceof Date))return Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,canonical(x)]));return v }
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
}
const missing = () => new TablesError('NOT_FOUND','Item não disponível nesta empresa.',404)
export function paginate<T>(items:T[],page:number,size:number) { const start=(page-1)*size;return {itens:items.slice(start,start+size),total:items.length,pagina:page,tamanho:size,tem_mais:start+size<items.length} }
export function clipped(record:DataRecord, selected?:string[],limit=1000) {
  const values:Values={}, truncados:string[]=[]
  for(const [id,value] of Object.entries(record.valores))if(!selected||selected.includes(id)) {
    if(typeof value==='string'&&value.length>limit){values[id]=value.slice(0,limit);truncados.push(id)}
    else if(Array.isArray(value)&&value.length>Math.max(1,Math.min(50,Math.floor(limit/42)))){values[id]=value.slice(0,Math.max(1,Math.min(50,Math.floor(limit/42))));truncados.push(id)}
    else values[id]=value
  }
  return {...record,valores:values,campos_truncados:truncados}
}

/** Readable values are keyed by field name; repeated names get a short ID suffix. */
function fieldLabels(fields:{id:string;nome:string}[]) { const seen=new Map<string,number>();for(const f of fields)seen.set(f.nome,(seen.get(f.nome)||0)+1);return new Map(fields.map(f=>[f.id,seen.get(f.nome)!>1?`${f.nome} (${f.id.slice(0,8)})`:f.nome])) }

export async function displayRecords(db:Database,session:TablesSession,records:DataRecord[],fields:Awaited<ReturnType<typeof readFields>>,limit:number) {
 const userIds=new Set<string>(),linkIds=new Set<string>()
 for(const r of records)for(const f of fields){const value=r.valores[f.id];if(!Array.isArray(value))continue;for(const id of value){if(['usuario','usuarios','criado_por','alterado_por'].includes(f.tipo))userIds.add(id);if(f.tipo==='vinculo')linkIds.add(id)}}
 const users=userIds.size?(await db.query('SELECT id,nome FROM tables.membros() WHERE id=ANY($1::text[])',[[...userIds]])).rows:[]
 const links=linkIds.size?(await db.query("SELECT r.id,coalesce(r.valores->>t.campo_principal_id::text,'Sem nome') nome FROM tables.registros r JOIN tables.tabelas t ON t.empresa_id=r.empresa_id AND t.id=r.tabela_id JOIN tables.bases b ON b.empresa_id=t.empresa_id AND b.id=t.base_id WHERE r.empresa_id=$1 AND r.id=ANY($2::uuid[]) AND r.excluido_em IS NULL AND t.excluido_em IS NULL AND b.excluido_em IS NULL",[session.tenantId,[...linkIds]])).rows:[]
 const names=new Map([...users,...links].map(r=>[String(r.id),String(r.nome)])),label=fieldLabels(fields)
 // System columns are shown through their fields (Nº, Criado por...), not as raw columns.
 return records.map(({numero:_n,criado_por:_c,atualizado_por:_a,...r}:DataRecord&Input)=>({...r,exibicao:Object.fromEntries(fields.filter(f=>r.valores[f.id]!==undefined).map(f=>{const value=r.valores[f.id];let text:string;if(f.tipo==='busca'&&Array.isArray(value))text=value.join(', ');else if(f.tipo==='porcentagem'&&typeof value==='number')text=String(value).replace('.',',')+'%';else if(Array.isArray(value))text=value.map(id=>f.opcoes.find(o=>o.id===id)?.nome||names.get(id)||'Item indisponível').join(', ');else text=value===null?'':typeof value==='boolean'?(value?'Sim':'Não'):String(value);return [label.get(f.id)!,text.length>limit?text.slice(0,limit)+'…':text]}))}))
}

export async function readMcp(db:Database, session:TablesSession, name:string, input:Input) {
  const {pagina=1,tamanho=10}=input
  if(name==='listar_bases')return paginate((await service.listBases(db,session)).filter(b=>b.nome.toLocaleLowerCase().includes(input.busca.toLocaleLowerCase())),pagina,tamanho)
  if(name==='obter_base'){const result=await service.getBase(db,session,input.base_id);return {base:result.base,tabelas:paginate(result.tabelas,pagina,tamanho)}}
  if(name==='obter_tabela') {
    const b=await getBundle(db,session,input.tabela_id)
    const page=paginate<Input>(input.secao==='campos'?b.campos.filter(f=>!input.campo_id||f.id===input.campo_id):input.secao==='usuarios'?b.usuarios:input.secao==='tabelas'?b.tabelas:b.visualizacoes.filter(v=>!input.visualizacao_id||v.id===input.visualizacao_id),pagina,Math.min(tamanho,10))
    const items=page.itens as Input[]
    return {tabela:b.tabela,secao:input.secao,...page,itens:input.secao==='campos'?items.map(f=>({...f,opcoes:paginate(f.opcoes,(input.opcoes_pagina||1),10)})):input.secao==='visualizacoes'&&!input.visualizacao_id?items.map(v=>({id:v.id,nome:v.nome,tipo:v.tipo,versao:v.versao})):items}
  }
  if(name==='consultar_registros') {
    const fields=await readFields(db,session,input.tabela_id)
    const selected: string[]=input.campos||fields.slice(0,10).map(f=>f.id)
    if(selected.some(id=>!fields.some(f=>f.id===id)))throw new TablesError('INVALID_FIELD','Um campo não pertence à tabela.')
    const page=await listRecords(db,session,input.tabela_id,listQuerySchema.parse(inputWithout(input,['campos','tabela_id'])))
    const limit=Math.max(10,Math.min(1000,Math.floor(35000/(Math.max(1,page.registros.length)*Math.max(1,selected.length)*4)))),visible=fields.filter(f=>selected.includes(f.id))
    return {...page,registros:(await displayRecords(db,session,page.registros.map(r=>clipped(r,selected,limit)),visible,limit)).map(r=>Object.fromEntries(Object.entries(r).filter(([key])=>!['valores','tabela_id','posicao'].includes(key)))),campos:visible.map(f=>({id:f.id,nome:f.nome,tipo:f.tipo})),tem_mais:pagina*tamanho<page.total,colunas_omitidas:fields.filter(f=>!selected.includes(f.id)).map(f=>f.nome)}
  }
  if(name==='obter_registro') {
    const record=await readRecord(db,session,input.registro_id);await requireTable(db,session,record.tabela_id)
    const fields=await readFields(db,session,record.tabela_id), selected=input.campos||fields.slice(0,10).map(f=>f.id)
    if(selected.some((id:string)=>!fields.some(f=>f.id===id)))throw new TablesError('INVALID_FIELD','Campo não encontrado.')
    if(input.trecho){const value=record.valores[input.trecho.campo_id];if(!fields.some(f=>f.id===input.trecho.campo_id)||typeof value!=='string'&&!Array.isArray(value))throw new TablesError('INVALID_FIELD','Selecione um campo ativo textual ou de múltiplas escolhas.');const size=Array.isArray(value)?Math.min(input.trecho.tamanho,100):input.trecho.tamanho;return {registro_id:record.id,versao:record.versao,trecho:{...input.trecho,tamanho:size,...(typeof value==='string'?{texto:value.slice(input.trecho.inicio,input.trecho.inicio+size)}:{valores:value.slice(input.trecho.inicio,input.trecho.inicio+size)}),total:value.length,tem_mais:input.trecho.inicio+size<value.length}}}
    const attachments=await db.query("SELECT id,campo_id,nome,mime_type,tamanho::text FROM tables.anexos WHERE empresa_id=$1 AND registro_id=$2 AND estado='confirmado' ORDER BY criado_em,id LIMIT 21",[session.tenantId,record.id])
    const visible=fields.filter(f=>selected.includes(f.id)),limit=Math.min(1000,Math.floor(35000/(Math.max(1,selected.length)*4)))
    return {registro:(await displayRecords(db,session,[clipped(record,selected,limit)],visible,limit))[0],campos:visible.map(f=>({id:f.id,nome:f.nome,tipo:f.tipo})),colunas_omitidas:fields.filter(f=>!selected.includes(f.id)).map(f=>f.nome),anexos:attachments.rows.slice(0,20),anexos_truncados:attachments.rows.length>20}
  }
  if(name==='listar_comentarios'||name==='consultar_historico') {
    const r=await readRecord(db,session,input.registro_id);await requireTable(db,session,r.tabela_id)
    const source=name==='listar_comentarios'?"SELECT c.id,c.texto,c.criado_em,coalesce(m.nome,'Usuário removido') autor FROM tables.comentarios c LEFT JOIN tables.membros() m ON m.id=c.autor_id::text WHERE c.empresa_id=$1 AND c.registro_id=$2 AND c.excluido_em IS NULL":"SELECT DISTINCT ON(h.operacao_id) h.id,h.acao,h.entidade,h.criado_em,h.operacao_id,coalesce(m.nome,'Usuário removido') autor FROM tables.historico h LEFT JOIN tables.membros() m ON m.id=h.autor_id::text WHERE h.empresa_id=$1 AND h.registro_id=$2 ORDER BY h.operacao_id,(h.acao='INSERT') DESC,h.criado_em DESC,h.id"
    const rows=await db.query(`SELECT * FROM (${source}) itens ORDER BY criado_em DESC,id LIMIT $3 OFFSET $4`,[session.tenantId,r.id,tamanho+1,(pagina-1)*tamanho])
    const count=await db.query(`SELECT count(*)::int n FROM (${source}) itens`,[session.tenantId,r.id])
    return {itens:rows.rows.slice(0,tamanho),pagina,tamanho,total:count.rows[0].n,tem_mais:rows.rows.length>tamanho}
  }
  if(name==='listar_lixeira') {
    const result=await db.query(`SELECT b.id,b.nome,'bases' tipo,b.excluido_em,NULL::uuid pai_id FROM tables.bases b WHERE b.empresa_id=$1 AND b.excluido_em IS NOT NULL
      UNION ALL SELECT t.id,t.nome,'tabelas',t.excluido_em,t.base_id FROM tables.tabelas t JOIN tables.bases b ON b.empresa_id=t.empresa_id AND b.id=t.base_id WHERE t.empresa_id=$1 AND t.excluido_em IS NOT NULL AND b.excluido_em IS NULL
      UNION ALL SELECT c.id,c.nome,'campos',c.excluido_em,c.tabela_id FROM tables.campos c JOIN tables.tabelas t ON t.empresa_id=c.empresa_id AND t.id=c.tabela_id JOIN tables.bases b ON b.empresa_id=t.empresa_id AND b.id=t.base_id WHERE c.empresa_id=$1 AND c.excluido_em IS NOT NULL AND t.excluido_em IS NULL AND b.excluido_em IS NULL
      UNION ALL SELECT r.id,coalesce(r.valores->>t.campo_principal_id::text,'Sem nome'),'registros',r.excluido_em,r.tabela_id FROM tables.registros r JOIN tables.tabelas t ON t.empresa_id=r.empresa_id AND t.id=r.tabela_id JOIN tables.bases b ON b.empresa_id=t.empresa_id AND b.id=t.base_id WHERE r.empresa_id=$1 AND r.excluido_em IS NOT NULL AND t.excluido_em IS NULL AND b.excluido_em IS NULL ORDER BY excluido_em DESC,id LIMIT $2 OFFSET $3`,[session.tenantId,tamanho+1,(pagina-1)*tamanho])
    return {itens:result.rows.slice(0,tamanho),pagina,tamanho,tem_mais:result.rows.length>tamanho}
  }
  if(name==='obter_link_anexo')return attachmentAction(db,session,input.anexo_id,'download')
  throw missing()
}
function inputWithout(input:Input,keys:string[]) { return Object.fromEntries(Object.entries(input).filter(([key])=>!keys.includes(key))) }

// Only versions the operation depends on go into the hash: edits elsewhere in the same table or base must not stale a preview.
const STRUCTURE_OPERATIONS=new Set(['salvar_registros','importar_csv','criar_campo','editar_campo','editar_tabela','mover_para_lixeira','restaurar_item'])
const RECORD_OPERATIONS=new Set(['salvar_registros','mover_registros_para_lixeira'])
export async function operationSnapshot(db:Database,session:TablesSession,name:string,data:Input) {
  const snapshot:Input={bases:[],tabelas:[],registros:[],itens:[]}, refs:Input[]=[]
  const structural=STRUCTURE_OPERATIONS.has(name)&&data.tipo!=='registros'
  const baseIds=new Set<string>(), tableIds=new Set<string>(), recordIds=new Set<string>()
  if(data.base_id)baseIds.add(data.base_id)
  if(data.tabela_id)tableIds.add(data.tabela_id)
  if(data.registro_id)recordIds.add(data.registro_id)
  for(const item of (data.registros||[]) as Input[])if(item.registro_id)recordIds.add(item.registro_id)
  if(data.anexo_id){const a=(await db.query("SELECT * FROM tables.anexos WHERE empresa_id=$1 AND id=$2 AND estado<>'excluido'",[session.tenantId,data.anexo_id])).rows[0];if(!a)throw missing();snapshot.itens.push({tipo:'anexos',id:a.id,estado:a.estado});recordIds.add(a.registro_id);refs.push({id:a.id,nome:a.nome,tipo:'anexo'})}
  if(data.item_id) {
    const kind=z.enum(['bases','tabelas','campos','registros']).parse(data.tipo)
    const item=(await db.query(`SELECT * FROM tables.${kind} WHERE empresa_id=$1 AND id=$2`,[session.tenantId,data.item_id])).rows[0]
    if(!item|| (name==='restaurar_item')!==Boolean(item.excluido_em))throw missing()
    snapshot.itens.push({tipo:kind,id:item.id,versao:item.versao||item.versao_estrutura||null,excluido_em:item.excluido_em})
    if(kind!=='bases') {if(kind==='tabelas'){if(name!=='restaurar_item')tableIds.add(item.id);baseIds.add(item.base_id)}else tableIds.add(item.tabela_id)}
    // Records have no "nome" column: their name is the value of the table's primary field.
    const label=kind!=='registros'?item.nome:(await db.query("SELECT coalesce(nullif($2::jsonb->>campo_principal_id::text,''),'Sem nome') nome FROM tables.tabelas WHERE empresa_id=$1 AND id=$3",[session.tenantId,JSON.stringify(item.valores||{}),item.tabela_id])).rows[0]?.nome
    refs.push({id:item.id,nome:String(label||'Sem nome').slice(0,120),tipo:kind})
    if(data.expectedVersion!==undefined&&kind!=='campos')assertVersion(item.versao||item.versao_estrutura,data.expectedVersion)
  }
  for(const id of recordIds) {
    const record=await readRecord(db,session,id);tableIds.add(record.tabela_id);snapshot.registros.push({id,versao:RECORD_OPERATIONS.has(name)?record.versao:null})
    const requested=data.registro_id===id?data.expectedVersion:((data.registros||[]) as Input[]).find(r=>r.registro_id===id)?.expectedVersion
    if(requested!==undefined)assertVersion(record.versao,requested)
    if(data.tabela_id&&data.tabela_id!==record.tabela_id)throw missing()
  }
  for(const id of tableIds) {
    const table=await requireTable(db,session,id);baseIds.add(table.base_id)
    if(data.tipo==='campos'&&data.expectedVersion!==undefined)assertVersion(table.versao_estrutura,data.expectedVersion)
    if(id===data.tabela_id&&data.expectedStructureVersion!==undefined)assertVersion(table.versao_estrutura,data.expectedStructureVersion)
    snapshot.tabelas.push({id,versao:structural?table.versao_estrutura:null});refs.push({id,nome:table.nome,tipo:'tabela'})
    const fields=await readFields(db,session,id),items:Input[]=data.registros||[data]
    const changed=new Set<string>([...(data.campo_id?[data.campo_id]:[]),...items.flatMap(i=>[...Object.keys(i.valores||{}),...(i.relacoes||[]).map((r:Input)=>r.campo_id)])])
    const mentioned=new Set<string>(items.flatMap(i=>[...Object.values(i.valores||{}).filter(Array.isArray).flat(),...(i.relacoes||[]).flatMap((r:Input)=>r.valores)]) as string[])
    for(const field of fields.filter(f=>changed.has(f.id))){refs.push({id:field.id,nome:field.nome,tipo:'campo'});for(const option of field.opcoes.filter(o=>mentioned.has(o.id)))refs.push({id:option.id,nome:option.nome,tipo:'opção'})}
    if(mentioned.size){const members=await db.query('SELECT id,nome FROM tables.membros() WHERE id=ANY($1::text[])',[[...mentioned]]);for(const member of members.rows)refs.push({id:member.id,nome:String(member.nome).slice(0,120),tipo:'pessoa'})}
    if(data.visualizacao_id){const v=(await getBundle(db,session,id)).visualizacoes.find(v=>v.id===data.visualizacao_id);if(!v)throw missing();if(data.expectedVersion!==undefined)assertVersion(v.versao,data.expectedVersion);snapshot.itens.push({tipo:'visualizacoes',id:v.id,versao:v.versao});refs.push({id:v.id,nome:v.nome,tipo:'visualização'})}
  }
  for(const id of baseIds){const base=await requireBase(db,session,id);snapshot.bases.push({id,versao:['editar_base','compartilhar_base'].includes(name)?base.versao:null});refs.push({id,nome:base.nome,tipo:'base'});if(data.base_id===id&&data.expectedVersion!==undefined)assertVersion(base.versao,data.expectedVersion)}
  const recordRefs=[...new Set<string>([...recordIds,...[...JSON.stringify(data).matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)].map(m=>m[0])])].filter(id=>!refs.some(r=>r.id===id))
  if(recordRefs.length)for(const r of (await db.query("SELECT r.id,coalesce(nullif(r.valores->>t.campo_principal_id::text,''),'Sem nome') nome FROM tables.registros r JOIN tables.tabelas t ON t.empresa_id=r.empresa_id AND t.id=r.tabela_id WHERE r.empresa_id=$1 AND r.id=ANY($2::uuid[])",[session.tenantId,recordRefs])).rows)refs.push({id:String(r.id),nome:String(r.nome).slice(0,120),tipo:'registro'})
  if(name==='criar_base')refs.push({nome:data.nome,tipo:'base nova'})
  if(name==='compartilhar_base'&&data.membros?.length){const people=await db.query('SELECT id,nome FROM tables.membros() WHERE id=ANY($1::text[])',[data.membros.map((m:Input)=>m.usuario_id)]);for(const p of people.rows)refs.push({id:String(p.id),nome:String(p.nome).slice(0,120),tipo:'pessoa'})}
  return {hash:digest(snapshot),referencias:refs,snapshot}
}

async function recordValues(db:Database,session:TablesSession,tableId:string,item:Input,recordId?:string) {
  const values:Values={...item.valores}, fields=await readFields(db,session,tableId), current=recordId?(await readRecord(db,session,recordId)).valores:{}
  const touched=new Set(Object.keys(values))
  for(const change of (item.relacoes||[]) as Input[]) {
    if(touched.has(change.campo_id))throw new TablesError('INVALID_INPUT','Informe cada campo uma única vez, em valores ou relações.')
    touched.add(change.campo_id)
    const field=fields.find(f=>f.id===change.campo_id)
    if(!field||!['selecao','selecao_multipla','usuario','usuarios','vinculo'].includes(field.tipo))throw new TablesError('INVALID_FIELD','Escolha um campo relacional.')
    if(change.modo!=='definir'&&!['usuarios','vinculo','selecao_multipla'].includes(field.tipo))throw new TablesError('INVALID_FIELD','Adicionar/remover exige um campo que aceite várias escolhas.')
    const old=Array.isArray(current[field.id])?current[field.id] as string[]:[]
    values[field.id]=change.modo==='definir'?change.valores:change.modo==='adicionar'?[...new Set([...old,...change.valores])]:old.filter(v=>!change.valores.includes(v))
  }
  return values
}

export async function applyMcp(db:Database,session:TablesSession,name:string,data:Input,dryRun=false):Promise<Input> {
  if(name==='criar_base')return service.createBase(db,session,baseInputSchema.parse(data))
  if(name==='editar_base'){const b=await requireBase(db,session,data.base_id);if(!Object.keys(data.alteracoes).length)throw new TablesError('INVALID_INPUT','Informe uma alteração.');return {base:await service.changeBase(db,session,b.id,{nome:b.nome,descricao:b.descricao,cor:b.cor,...data.alteracoes,expectedVersion:b.versao})}}
  if(name==='compartilhar_base'){const current=await service.getSharing(db,session,data.base_id);const sharing=await service.saveSharing(db,session,data.base_id,{acesso:data.acesso??current.acesso,membros:data.membros??current.membros.filter(m=>!m.administrador_empresa).map(m=>({usuario_id:m.id,papel:m.papel})),expectedVersion:current.versao});return {acesso:sharing.acesso,membros:sharing.membros.map(m=>({nome:m.nome,papel:m.papel,...(m.administrador_empresa?{administrador_empresa:true}:{})}))}}
  if(name==='criar_tabela')return {tabela:await service.createTable(db,session,data.base_id,data.nome)}
  if(name==='editar_tabela'){const t=await requireTable(db,session,data.tabela_id);return {tabela:await service.changeTable(db,session,t.id,{nome:data.nome,expectedStructureVersion:t.versao_estrutura})}}
  if(name==='criar_campo'||name==='editar_campo') {
    const b=await getBundle(db,session,data.tabela_id), old=b.campos.find(f=>f.id===data.campo_id)
    if(name==='editar_campo'&&!old)throw missing()
    if(name==='editar_campo'&&!Object.keys(data.alteracoes).length)throw new TablesError('INVALID_INPUT','Informe uma alteração.')
    const previous=old?{nome:old.nome,tipo:old.tipo,obrigatorio:old.obrigatorio,tabela_destino_id:old.tabela_destino_id,configuracao:old.configuracao,opcoes:old.opcoes.filter(o=>!o.arquivado).map(o=>({id:o.id,nome:o.nome,cor:o.cor}))}:{}
    const patch=name==='criar_campo'?data.campo:data.alteracoes
    return service.saveField(db,session,b.tabela.id,fieldInputSchema.parse({...previous,...patch,configuracao:{...previous.configuracao,...patch.configuracao},expectedStructureVersion:b.tabela.versao_estrutura}),data.campo_id)
  }
  if(['salvar_registros','criar_registro','editar_registro','criar_registros_em_lote','editar_registros_em_lote','mover_registros_para_lixeira'].includes(name)) {
    const items:Input[]=data.registros||[data], ids=items.filter(i=>i.registro_id).map(i=>i.registro_id as string)
    if(new Set(ids).size!==ids.length)throw new TablesError('INVALID_INPUT','Um registro aparece mais de uma vez no lote.')
    const table=await requireTable(db,session,data.tabela_id,'record'), result=[]
    for(const item of [...items].sort((a,b)=>String(a.registro_id||'').localeCompare(String(b.registro_id||'')))) {
      try {
        const old=item.registro_id?await readRecord(db,session,item.registro_id):undefined
        if(old&&old.tabela_id!==table.id)throw missing()
        if(name==='mover_registros_para_lixeira'){await service.trash(db,session,'registros',old!.id,old!.versao);result.push({id:old!.id,status:'na_lixeira'});continue}
        const valores=await recordValues(db,session,table.id,item,item.registro_id)
        const record=await service.saveRecord(db,session,table.id,{valores,expectedStructureVersion:table.versao_estrutura,expectedVersion:old?.versao},item.registro_id)
        result.push({id:record.id,versao:record.versao})
      } catch(error){if(error instanceof TablesError)throw new TablesError(error.code,`Item ${items.indexOf(item)+1}: ${error.message}`,error.status);throw error}
    }
    return {registros:result,quantidade:result.length}
  }
  if(name==='criar_visualizacao'||name==='editar_visualizacao'||name==='excluir_visualizacao') {
    const bundle=await getBundle(db,session,data.tabela_id), old=bundle.visualizacoes.find(v=>v.id===data.visualizacao_id)
    if(name!=='criar_visualizacao'&&!old)throw missing()
    if(name==='excluir_visualizacao'){await requireTable(db,session,data.tabela_id,'structure');if(bundle.visualizacoes.length<=1)throw new TablesError('LAST_VIEW','Mantenha ao menos uma visualização.');await db.query('DELETE FROM tables.visualizacoes WHERE empresa_id=$1 AND id=$2',[session.tenantId,old!.id]);return {id:old!.id,status:'excluido_definitivamente'}}
    const patch=name==='criar_visualizacao'?data.visualizacao:data.alteracoes
    if(!Object.keys(patch).length)throw new TablesError('INVALID_INPUT','Informe uma alteração.')
    const previous=old?{nome:old.nome,tipo:old.tipo,campos:old.campos}:{}
    return {visualizacao:await service.saveView(db,session,data.tabela_id,viewInputSchema.parse({...previous,...patch,configuracao:{...old?.configuracao,...patch.configuracao},expectedVersion:old?.versao}),data.visualizacao_id)}
  }
  if(name==='importar_csv'){const t=await requireTable(db,session,data.tabela_id,'record');const {importRows}=await import('./csv');return importRows(db,session,t.id,{colunas:data.colunas,linhas:data.linhas,expectedStructureVersion:t.versao_estrutura})}
  if(name==='adicionar_comentario')return service.addComment(db,session,data.registro_id,data.texto)
  if(name==='mover_para_lixeira') {
    if(data.tipo==='campos'){const f=(await db.query('SELECT tabela_id FROM tables.campos WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL',[session.tenantId,data.item_id])).rows[0];if(!f)throw missing();const t=await requireTable(db,session,f.tabela_id);await service.deleteField(db,session,t.id,data.item_id,t.versao_estrutura)}
    else {const row=(await db.query(`SELECT * FROM tables.${z.enum(['bases','tabelas']).parse(data.tipo)} WHERE empresa_id=$1 AND id=$2`,[session.tenantId,data.item_id])).rows[0];if(!row)throw missing();await service.trash(db,session,data.tipo,data.item_id,row.versao||row.versao_estrutura)}
    return {id:data.item_id,status:'na_lixeira'}
  }
  if(name==='restaurar_item'){await service.restore(db,session,data.tipo,data.item_id);return {id:data.item_id,status:'restaurado',...(data.tipo==='campos'?{aviso:'Campo restaurado como opcional. Filtros e agrupamentos removidos não são recriados.'}:{})}}
  if(name==='preparar_upload') {
    const r=await readRecord(db,session,data.registro_id),f=(await readFields(db,session,r.tabela_id)).find(f=>f.id===data.campo_id&&f.tipo==='anexo');if(!f)throw new TablesError('INVALID_FIELD','Selecione um campo de anexo.')
    if(data.nome===undefined&&data.tamanho===undefined&&data.mime_type===undefined)return {status:'aguardando_envio',registro_id:r.id,campo_id:f.id}
    const input=attachmentInputSchema.parse({...inputWithout(data,['registro_id']),expectedVersion:r.versao})
    if(dryRun)return {status:'aguardando_envio',nome:input.nome,tamanho:input.tamanho}
    return {...await prepareAttachment(db,session,r.id,input),status:'aguardando_envio'}
  }
  if(name==='remover_anexo'||name==='confirmar_upload'){if(dryRun)return {anexo_id:data.anexo_id,status:name==='remover_anexo'?'a_remover':'a_confirmar'};return {...await attachmentAction(db,session,data.anexo_id,name==='remover_anexo'?'excluir':'confirmar'),anexo_id:data.anexo_id,status:name==='remover_anexo'?'excluido':'confirmado'}}
  throw missing()
}

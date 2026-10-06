import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {connection,project} from './evolution-db.mjs'

const apply=process.argv.includes('--apply'),company=2,actor=3,version='20261006030000',name='entity_category_types',folder='.cache/entity-categories'
assert(process.argv.slice(2).every(arg=>['--check','--apply','--project='+project].includes(arg)))
if(apply)assert(process.argv.includes('--project='+project),'Specify the verified project')
const sql=readFileSync(`supabase/migrations/${version}_${name}.sql`,'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex'),digest=hash(sql)
const groups={
 cliente:{
  'Saúde':['Aurora Clínica Integrada','Vila Serena Odontologia','Estação Saúde','Essência Fisioterapia','Vértice Laboratório'],
  'Veterinária':['Bosque Veterinária'],
  'Construção e imóveis':['Horizonte Engenharia','Lume Arquitetura','Terracota Construções','Alameda Imóveis'],
  'Educação e editoras':['Jardim das Letras Escola','Nexo Cursos Profissionais','Semente Editora'],
  'Comércio e distribuição':['Brisa Comércio de Alimentos','Vale Verde Distribuidora','Raiz Mercado Natural','Porto Claro Importadora','Trama Confecções','Planalto Autopeças'],
  'Logística e transportes':['Ponto Norte Logística','Rota Nova Transportes'],
  'Serviços profissionais':['Atlas Consultoria','Candeia Advocacia','Prisma Contabilidade','Farol Seguros','Nova Ponte Serviços'],
  'Comunicação e eventos':['Mosaico Comunicação','Orla Eventos'],
  'Hotelaria e alimentação':['Costa Azul Hotelaria','Sabor da Praça Restaurantes'],
 },
 fornecedor:{
  'Tecnologia e equipamentos':['Núcleo Distribuição de Tecnologia','Circuito Equipamentos','Ponte Digital Atacado','Rede Sul Componentes','TecnoVale Periféricos'],
  'Serviços técnicos':['Oficina Byte Serviços','Conecta Redes Técnicas','Campo Aberto Infraestrutura'],
  'Infraestrutura e instalações':['Edifício Horizonte Administração'],
  'Energia e telecomunicações':['Energia Aurora Serviços','Fibra Nexo Telecom'],
  'Software e serviços digitais':['Nuvem Clara Software'],
  'Marketing e comunicação':['Estúdio Prisma Marketing'],
  'Contabilidade e assessoria':['Conta Certa Assessoria'],
  'Transporte e mobilidade':['Rota Urbana Mobilidade'],
 },
}
const assignments=Object.entries(groups).flatMap(([type,categories])=>Object.entries(categories).flatMap(([category,names])=>names.map(entity=>({type,category,entity}))))
assert.equal(assignments.length,45);assert.equal(new Set(assignments.map(a=>a.entity)).size,45)
mkdirSync(folder,{recursive:true})
if(apply){const proof=JSON.parse(readFileSync(folder+'/check.json'));assert.equal(proof.status,'passed');assert.equal(proof.digest,digest)}
const db=connection(),result={date:new Date().toISOString(),project,company,actor,digest,mode:apply?'apply':'rollback_check',createdCategories:0,updatedEntities:0}
async function fingerprints(){
 const tables=(await db.query("SELECT tablename FROM pg_tables WHERE schemaname='erp' AND tablename NOT IN ('entidades','categorias','cadastros_eventos') ORDER BY tablename")).rows
 const output={}
 for(const {tablename} of tables){assert(/^[a-z_]+$/.test(tablename));output[tablename]=hash((await db.query(`SELECT row_to_json(t) value FROM erp.${tablename} t ORDER BY id`)).rows)}
 return output
}
async function event(type,id,version,event,before,after){
 await db.query(`INSERT INTO erp.cadastros_eventos(empresa_id,entidade_tipo,entidade_id,evento,versao,dados,criado_por) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)`,[company,type,id,event,version,JSON.stringify({antes:before,depois:after,origem:'classificacao_demo_20261006'}),actor])
}
try{
 await db.connect();await db.query('BEGIN ISOLATION LEVEL READ COMMITTED');await db.query("SET LOCAL lock_timeout='10s'")
 await db.query('SELECT pg_advisory_xact_lock(172942,2026100603)')
 const identity=(await db.query("SELECT u.id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=$1 AND e.id=$2 AND u.status='active' AND e.status='active' AND m.status='active' AND m.role='owner' AND NOT m.suspenso_localmente",[actor,company])).rows
 assert.equal(identity.length,1)
 const before=await fingerprints()
 const entities=(await db.query("SELECT * FROM erp.entidades WHERE empresa_id=$1 AND excluido_em IS NULL AND (eh_cliente OR eh_fornecedor) ORDER BY id FOR UPDATE",[company])).rows
 assert.equal(entities.length,45);assert(entities.every(e=>e.metadata.dataset==='erp-demo-20261006'))
 const originalCategories=(await db.query('SELECT * FROM erp.categorias WHERE empresa_id=$1 ORDER BY id',[company])).rows
 if(apply&&!existsSync(folder+'/before.json'))writeFileSync(folder+'/before.json',JSON.stringify({date:result.date,entities,categories:originalCategories},null,2),{flag:'wx'})
 const ledger=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows
 if(ledger.length){assert.equal(ledger[0].name,name);assert.deepEqual(ledger[0].statements,[sql])}
 else {await db.query(sql);await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[sql]])}
 await db.query("SELECT set_config('app.erp_empresa_id',$1,true),set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(company),String(actor)])
 await db.query('SET LOCAL ROLE erp_runtime')
 for(const [type,categories] of Object.entries(groups))for(const category of Object.keys(categories)){
  let rows=(await db.query('SELECT * FROM erp.categorias WHERE empresa_id=$1 AND tipo=$2 AND nome=$3 AND excluido_em IS NULL FOR UPDATE',[company,type,category])).rows
  assert(rows.length<=1,'Ambiguous category');if(!rows.length){rows=(await db.query(`INSERT INTO erp.categorias(empresa_id,nome,tipo,ativo,metadata,criado_por,atualizado_por) VALUES($1,$2,$3,true,$4::jsonb,$5,$5) RETURNING *`,[company,category,type,JSON.stringify({demo:true,dataset:'erp-demo-20261006',descricao:`Classificação de ${type==='cliente'?'clientes':'fornecedores'} por ramo de atividade.`}),actor])).rows;await event('categoria',rows[0].id,rows[0].versao,'criado',{},rows[0]);result.createdCategories++}
  assert(rows[0].ativo,'Category must be active')
 }
 for(const assignment of assignments){
  const entity=entities.find(e=>e.nome===assignment.entity);assert(entity,'Known demo entity required');assert(entity[assignment.type==='cliente'?'eh_cliente':'eh_fornecedor'])
  const previous=entity.metadata.categoria||'';assert(!previous||previous===assignment.category,'Preserve manual classification')
  if(previous===assignment.category)continue
  const updated=(await db.query(`UPDATE erp.entidades SET metadata=metadata||jsonb_build_object('categoria',$3::text),versao=versao+1,atualizado_por=$4 WHERE empresa_id=$1 AND id=$2 AND versao=$5 RETURNING *`,[company,entity.id,assignment.category,actor,entity.versao])).rows
  assert.equal(updated.length,1);await event('entidade',entity.id,updated[0].versao,'categoria_atribuida',entity,updated[0]);result.updatedEntities++
 }
 const classified=(await db.query(`SELECT CASE WHEN eh_cliente THEN 'cliente' ELSE 'fornecedor' END tipo,metadata->>'categoria' categoria,count(*)::int quantidade FROM erp.entidades WHERE empresa_id=$1 AND excluido_em IS NULL AND (eh_cliente OR eh_fornecedor) GROUP BY 1,2 ORDER BY 1,2`,[company])).rows
 assert.equal(classified.length,17);assert(classified.every(r=>r.categoria));assert.equal(classified.reduce((n,r)=>n+r.quantidade,0),45)
 assert.equal((await db.query(`SELECT count(*)::int n FROM erp.entidades e WHERE e.empresa_id=$1 AND e.excluido_em IS NULL AND (e.eh_cliente OR e.eh_fornecedor) AND NOT EXISTS(SELECT 1 FROM erp.categorias c WHERE c.empresa_id=e.empresa_id AND c.nome=e.metadata->>'categoria' AND c.excluido_em IS NULL AND c.ativo AND ((c.tipo='cliente' AND e.eh_cliente) OR (c.tipo='fornecedor' AND e.eh_fornecedor)))`,[company])).rows[0].n,0)
 await db.query('RESET ROLE');assert.deepEqual(await fingerprints(),before)
 const after=(await db.query('SELECT * FROM erp.entidades WHERE empresa_id=$1 AND excluido_em IS NULL AND (eh_cliente OR eh_fornecedor) ORDER BY id',[company])).rows
 const preserved=e=>{const {versao,atualizado_em,atualizado_por,metadata,...rest}=e;const {categoria,...meta}=metadata;return {...rest,metadata:meta}}
 assert.deepEqual(after.map(preserved),entities.map(preserved))
 for(const category of originalCategories)assert.deepEqual((await db.query('SELECT * FROM erp.categorias WHERE empresa_id=$1 AND id=$2',[company,category.id])).rows[0],category)
 await db.query(apply?'COMMIT':'ROLLBACK');result.status='passed';result.businessRecordsPreserved=true;result.classified=classified;result.clients=30;result.suppliers=15
}catch(error){await db.query('ROLLBACK').catch(()=>{});result.status='failed';result.error={code:error.code||error.name,message:error.message};process.exitCode=1}
finally {await db.end().catch(()=>{});writeFileSync(folder+(apply?'/application.json':'/check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result))}

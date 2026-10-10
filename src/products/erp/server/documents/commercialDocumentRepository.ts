import {createHash} from 'node:crypto'
import {runQuery,withTransaction,runWithErpReadSnapshot,type SQLClient} from '@/lib/postgres'
import {getErpDatabaseContext} from '@/lib/erpDatabaseContext'
import {ErpDomainError} from '../../shared/erpErrors'
import {discountAmount} from '../../shared/erpMoney'
import {quoteSituation} from '../../shared/quoteLifecycle'
import {renderCommercialPdf,COMMERCIAL_PDF_LAYOUT_VERSION,type CommercialPdf,type CommercialDocumentKind} from './commercialPdf'
import {commercialPdfPath,uploadCommercialPdf,readCommercialPdf,type CommercialFile} from './commercialPdfStorage'
type Row=Record<string,unknown>
const source=(kind:CommercialDocumentKind)=>kind==='orcamento'?{table:'vendas',items:'vendas_itens',foreign:'venda_id',pdf:'orcamento_id'}:{table:'ordens_servico',items:'ordens_servico_itens',foreign:'ordem_servico_id',pdf:'ordem_servico_id'}
const day=(value:unknown)=>value instanceof Date?value.toISOString().slice(0,10):value?String(value).slice(0,10):null
const hash=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex')
const filename=(kind:CommercialDocumentKind,number:unknown,revision?:number)=>`${kind==='orcamento'?'proposta':'ordem-servico'}-${String(number).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,70)}${revision?'-r'+revision:''}.pdf`
async function load(company:number,kind:CommercialDocumentKind,id:number,client?:SQLClient){
 const s=source(kind),query=async(sql:string,params:unknown[])=>client?(await client.query(sql,params)).rows:runQuery<Row>(sql,params);
 const row=(await query(`SELECT * FROM erp.${s.table} WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL${kind==='orcamento'?" AND tipo_documento='orcamento'":''}${client?' FOR UPDATE':''}`,[company,id]))[0];
 if(!row)throw new ErpDomainError('NOT_FOUND','Documento comercial não disponível nesta empresa.',404);
 const items=await query(`SELECT descricao,quantidade,valor_unitario,desconto,total FROM erp.${s.items} WHERE empresa_id=$1 AND ${s.foreign}=$2 AND excluido_em IS NULL ORDER BY id`,[company,id]);
 const cfg=(await query('SELECT razao_social,cnpj,endereco_logradouro AS logradouro,endereco_numero AS numero,endereco_bairro AS bairro,endereco_municipio AS municipio,endereco_uf AS uf,endereco_cep AS cep FROM erp.configuracoes_fiscais WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY padrao DESC,id LIMIT 1',[company]))[0];
 const issuer=cfg||(await query('SELECT name AS nome FROM shared.empresas WHERE id=$1',[company]))[0]||{nome:'Empresa '+company};
 const customer=row.cliente_snapshot as Row||{};
 const publicCustomer=Object.fromEntries(['nome','documento','email','telefone','logradouro','numero','complemento','bairro','cidade','municipio','uf','cep','endereco'].filter(k=>typeof customer[k]==='string').map(k=>[k,customer[k]]));
 const installments=kind==='orcamento'?await query('SELECT numero_parcela,data_vencimento,valor,descricao FROM erp.vendas_recebimentos_previstos WHERE empresa_id=$1 AND venda_id=$2 AND excluido_em IS NULL ORDER BY numero_parcela,id',[company,id]):[];
 const labels:Record<string,string>={em_andamento:'Em andamento',enviada:'Enviada',aprovado:'Aprovada',recusado:'Recusada',convertido:'Convertida em venda',cancelado:'Cancelada',rascunho:'Rascunho',aprovada:'Aprovada',orcamento_pendente:'Orçamento pendente',em_execucao:'Em execução',concluida:'Concluída',cancelada:'Cancelada'};
 const state=kind==='orcamento'?quoteSituation(row.situacao):String(row.status);
 const snapshot:CommercialPdf={kind,number:String(row.numero),status:labels[state]||state,date:day(row.data_venda||row.data_inicio)!,validUntil:day(row.validade_em),delivery:day(row.previsao_entrega),issuer,customer:publicCustomer,items,
  subtotal:Number(row.subtotal),discount:kind==='orcamento'?discountAmount(String(row.subtotal),String(row.desconto),row.tipo_desconto==='percentual'?'percentual':'valor'):Number(row.desconto),freight:Number(row.frete||0),total:Number(row.total),installments:installments.map(r=>({...r,data_vencimento:day(r.data_vencimento)})),
  notes:String(kind==='orcamento'?row.observacoes||'':row.observacoes_publicas||''),paymentNotes:String(row.observacoes_pagamento||''),
  equipment:kind==='ordem_servico'?[row.equipamento,row.marca,row.modelo,row.numero_serie&&'Série '+row.numero_serie].filter(Boolean).join(' - '):null,
  problem:kind==='ordem_servico'?String(row.problema_informado||''):null,diagnosis:kind==='ordem_servico'?String(row.diagnostico||''):null};
 return {row,snapshot,snapshotHash:hash(JSON.stringify(snapshot))};
}
export async function currentCommercialDocument(company:number,kind:CommercialDocumentKind,id:number){
 const fn=()=>load(company,kind,id);return getErpDatabaseContext()?.readOnly?runWithErpReadSnapshot(fn):fn();
}
export async function commercialDocumentPdf(company:number,kind:CommercialDocumentKind,id:number,input:{revision?:number;expectedVersion?:number}={}){
 const s=source(kind);
 if(input.revision){
  // Revalida o documento e suas permissões, inclusive o escopo do vendedor.
  await currentCommercialDocument(company,kind,id);
  const row=(await runQuery<Row>(`SELECT p.*,a.nome,a.caminho,a.tamanho_bytes,a.hash_sha256 FROM erp.documentos_comerciais_pdfs p JOIN erp.arquivos a ON a.empresa_id=p.empresa_id AND a.id=p.arquivo_id WHERE p.empresa_id=$1 AND p.${s.pdf}=$2 AND p.revisao=$3 AND a.excluido_em IS NULL`,[company,id,input.revision]))[0];
  if(!row)throw new ErpDomainError('NOT_FOUND','Revisão do PDF não encontrada.',404);
  const file:CommercialFile={company,kind,id,revision:Number(row.revisao),layout:Number(row.layout_versao),path:String(row.caminho),size:Number(row.tamanho_bytes),hash:String(row.hash_sha256)};
  return {bytes:await readCommercialPdf(file),name:String(row.nome),version:Number(row.origem_versao),revision:file.revision,archived:true};
 }
 const current=await currentCommercialDocument(company,kind,id);
 if(input.expectedVersion&&Number(current.row.versao)!==input.expectedVersion)throw new ErpDomainError('VERSION_CONFLICT','O documento mudou. Solicite um novo PDF para conferir os dados atuais.',409);
 return {bytes:renderCommercialPdf(current.snapshot),name:filename(kind,current.row.numero),version:Number(current.row.versao),revision:null,archived:false};
}
export async function archiveCommercialDocument(company:number,actor:number,kind:CommercialDocumentKind,id:number,expectedVersion?:number){
 return withTransaction(async client=>{
  const current=await load(company,kind,id,client),s=source(kind);
  if(expectedVersion!==undefined&&Number(current.row.versao)!==expectedVersion)throw new ErpDomainError('VERSION_CONFLICT','O documento mudou. Confira os dados antes de arquivar.',409);
  const latest=(await client.query(`SELECT id::text,revisao,snapshot_hash,layout_versao FROM erp.documentos_comerciais_pdfs WHERE empresa_id=$1 AND ${s.pdf}=$2 ORDER BY revisao DESC LIMIT 1`,[company,id])).rows[0];
  if(latest?.snapshot_hash===current.snapshotHash&&Number(latest.layout_versao)===COMMERCIAL_PDF_LAYOUT_VERSION)return {id:String(latest.id),revision:Number(latest.revisao),reused:true};
  const revision=Number(latest?.revisao||0)+1,bytes=renderCommercialPdf({...current.snapshot,revision}),digest=hash(bytes),path=commercialPdfPath(company,kind,id,revision,COMMERCIAL_PDF_LAYOUT_VERSION,digest);
  await uploadCommercialPdf({company,kind,id,revision,layout:COMMERCIAL_PDF_LAYOUT_VERSION,path,size:bytes.length,hash:digest},bytes);
  const saved=(await client.query('SELECT erp.registrar_pdf_comercial(empresa_id,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) AS id FROM (SELECT $1::bigint AS empresa_id) contexto',[company,kind,id,revision,Number(current.row.versao),COMMERCIAL_PDF_LAYOUT_VERSION,path,filename(kind,current.row.numero,revision),bytes.length,digest,current.snapshotHash])).rows[0];
  return {id:String(saved.id),revision,reused:false};
 });
}

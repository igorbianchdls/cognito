type Row=Record<string,unknown>
type Query=(sql:string,params:unknown[])=>Promise<Row[]>
export type EditSnapshot={campos:Row;conhecidos:string[];referencias:Record<string,string>;participante:string|null;avisos:string[];preserva_demais:boolean;efeitos:Row;
  resultado?:{campos:Row;conhecidos:string[];referencias:Record<string,string>;participante:string|null}}
const dateValue=(value:unknown)=>value instanceof Date?value.toISOString().slice(0,10):value
export async function editSnapshot(input:{tenantId:number;kind:string;table:string;row:Row;values:Row;items:Row[];parts:Row[];totals:Row;query:Query;lock:boolean}):Promise<EditSnapshot>{
  const {row,values,items,parts,table,kind}=input,fields:Row={},references:Record<string,string>={},metadata=(row.metadata||{}) as Row
  for(const key of Object.keys(values).filter(key=>key!=='registro_id')){
    if(key==='itens')fields[key]=items.filter(item=>!item.excluido_em).map(item=>({tipo:item.servico_id?'servico':'produto',item_id:item.servico_id||item.produto_id,
      ...(item.descricao!==undefined?{descricao:item.descricao}:{}),quantidade:item.quantidade,valor_unitario:item.valor_unitario,desconto:item.valor_desconto??item.desconto??0}))
    else if(key==='parcelas')fields[key]=parts.filter(part=>!part.excluido_em).map(part=>({data_vencimento:dateValue(part.data_vencimento),valor:part.valor,
      ...(['vendas','compras'].includes(table)?{numero_parcela:part.numero_parcela,descricao:part.descricao,conta_financeira_id:part.conta_financeira_id,metodo_pagamento_id:part.metodo_pagamento_id}:{})}))
    else if(key==='data_vencimento'&&['vendas','compras'].includes(table)&&parts.length)fields[key]=dateValue(parts.filter(part=>!part.excluido_em).map(part=>part.data_vencimento).sort((first,second)=>String(first).localeCompare(String(second)))[0])
    else if(key==='conta_financeira_id'&&table.startsWith('contas_')){const accounts=[...new Set(parts.filter(part=>!part.excluido_em).map(part=>part.conta_financeira_id??null))];if(accounts.length===1)fields[key]=accounts[0]}
    else if(key==='preco'&&table==='produtos')fields[key]=row.preco_venda
    else if(key==='tipo'&&table==='entidades')fields[key]=row.tipo_pessoa??row.tipo
    else if((key==='controla_estoque'||key==='padrao')&&typeof row[key]==='boolean')fields[key]=row[key]?'sim':'nao'
    else if(key==='status'&&typeof row.ativo==='boolean')fields[key]=row.ativo?'ativo':table==='produtos'||table==='servicos'?'pausado':'inativo'
    else if(table==='categorias'&&key==='descricao')fields[key]=metadata.descricao??''
    else if(table==='categorias'&&key==='dre_grupo_codigo'){
      if(row.dre_grupo_id){const [group]=await input.query(`SELECT codigo FROM erp.dre_grupos WHERE empresa_id=$1 AND id=$2${input.lock?' FOR SHARE':''}`,[input.tenantId,row.dre_grupo_id]);if(group)fields[key]=group.codigo}else fields[key]=null
    }
    else if(table==='notas_fiscais'&&key==='cliente_id')fields[key]=row.entidade_id
    else if(table==='notas_fiscais'&&key==='aliquota_iss')fields[key]=items[0]?.aliquota_iss
    else if(table==='notas_fiscais'&&key==='iss_retido')fields[key]=input.totals.iss_retido
    else if(table==='notas_fiscais'&&key==='retencoes_federais')fields[key]=metadata.retencoes_federais??{}
    else if(table==='notas_fiscais'&&key==='observacoes')fields[key]=metadata.observacoes??''
    else if(Object.hasOwn(row,key))fields[key]=dateValue(row[key])
  }
  const referenceTables:Record<string,string>={cliente_id:'entidades',fornecedor_id:'entidades',vendedor_id:'entidades',transportadora_id:'entidades',conta_financeira_id:'contas_financeiras',categoria_id:table==='produtos'||table==='servicos'?'categorias_cadastro':'categorias',categoria_pai_id:'categorias'}
  const partyKey=table==='compras'||table==='contas_pagar'?'fornecedor_id':'cliente_id',partyId=table==='notas_fiscais'?row.entidade_id:row[partyKey]
  for(const [key,referenceTable] of Object.entries(referenceTables)){
    const ids=[...new Set([fields[key],values[key],...(key===partyKey?[partyId]:[])].filter(value=>value!==null&&value!==undefined&&Number.isSafeInteger(Number(value))&&Number(value)>0).map(Number))]
    if(!ids.length)continue
    const records=await input.query(`SELECT id::text,nome FROM erp.${referenceTable} WHERE empresa_id=$1 AND id=ANY($2::bigint[]) ORDER BY id${input.lock?' FOR SHARE':''}`,[input.tenantId,ids])
    for(const record of records)references[key+':'+record.id]=String(record.nome)
  }
  const full=['vendas','compras','ordens_servico','notas_fiscais','contas_pagar','contas_receber'].includes(table),warnings:string[]=[]
  if(full)warnings.push('O ERP revalida e recalcula o documento completo. Itens ou parcelas podem ser reorganizados; confira também os valores e a condição de pagamento.')
  if(kind==='editar_orcamento')warnings.push('A edição reabre o orçamento em andamento e remove a aprovação e o envio anteriores. Será necessário revisar o fluxo de aprovação.')
  if(kind==='editar_ordem_servico')warnings.push('O ERP também revalida a situação da ordem e seus documentos vinculados.')
  if(kind==='editar_nota_servico')warnings.push('Somente o rascunho de NFS-e simulada será atualizado. Nada será enviado à prefeitura.')
  const effects:Row=kind==='editar_orcamento'?{situacao:'em_andamento'}:kind==='editar_ordem_servico'?{status:'rascunho'}:table==='contas_pagar'||table==='contas_receber'?{status:'aberto'}:{}
  if(['vendas','compras','ordens_servico','notas_fiscais'].includes(table)&&(row.total!==undefined&&row.total!==null||row.valor_total!==undefined&&row.valor_total!==null))fields.total=row.total??row.valor_total
  for(const key of Object.keys(effects))if(Object.hasOwn(row,key))fields[key]=row[key]
  return {campos:Object.fromEntries(Object.entries(fields).filter(([,value])=>value!==undefined)),conhecidos:Object.keys(fields).filter(key=>fields[key]!==undefined),referencias:references,participante:partyId?references[partyKey+':'+partyId]||null:null,avisos:warnings,preserva_demais:!full,efeitos:effects}
}

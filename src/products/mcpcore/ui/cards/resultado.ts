// Resultado depois da execução: o que foi salvo e o próximo passo. Só saved com registro confirma.
export const resultCardScript=String.raw`
const registrationModules={cliente:'clientes',fornecedor:'fornecedores',vendedor:'vendedores',produto:'produtos',servico:'servicos',categoria:'categorias',conta_financeira:'contas-financeiras'};
function nextSteps(tipo,id,dados){
  const view=(tool,args)=>({label:'Ver registro',run:()=>(open(tool,withCompany(args)))});
  if(tipo==='venda')return [{label:'Confirmar venda',primary:true,run:()=>preview('confirmar_venda',{dados:{registro_id:id}})},view('obter_venda',{venda_id:id})];
  if(tipo==='orcamento'||tipo==='editar_venda'||tipo==='editar_orcamento')return [view('obter_venda',{venda_id:id})];
  if(tipo==='converter_orcamento')return [{label:'Confirmar venda',primary:true,run:()=>preview('confirmar_venda',{dados:{registro_id:id}})},{label:'Ver venda',run:()=>(open('obter_venda',withCompany({venda_id:id})))}];
  if(tipo==='confirmar_venda')return [{label:'Atender venda',primary:true,run:()=>preview('atender_venda',{dados:{registro_id:id}})},view('obter_venda',{venda_id:id})];
  if(tipo==='atender_venda'||tipo==='cancelar_venda')return [view('obter_venda',{venda_id:id})];
  if(/nota_servico$/.test(tipo)&&tipo!=='excluir_nota_servico'){const note=tipo==='nota_servico'?id:Number(dados.registro_id)||id;
    return [tipo==='nota_servico'||tipo==='editar_nota_servico'?{label:'Emitir',primary:true,run:()=>preview('emitir_nota_servico',{dados:{registro_id:note}})}:null,view('obter_nota_servico',{nota_id:note})].filter(Boolean)}
  if(tipo==='compra')return [{label:'Confirmar compra',primary:true,run:()=>preview('confirmar_compra',{dados:{registro_id:id}})},view('obter_compra',{compra_id:id})];
  if(/_compra$/.test(tipo))return [view('obter_compra',{compra_id:id})];
  if(/conta_(pagar|receber)$/.test(tipo)&&!/^excluir_/.test(tipo))return [view('obter_titulo_financeiro',{tipo:tipo.endsWith('pagar')?'pagar':'receber',conta_id:id})];
  if(tipo==='pagar_parcela'||tipo==='receber_parcela')return [view('obter_parcela_financeira',{tipo:tipo==='pagar_parcela'?'pagar':'receber',parcela_id:Number(dados.registro_id)})];
  const kind=tipo.replace(/^(editar)_/,'');if(registrationModules[kind]&&!/^excluir_/.test(tipo))return [view('obter_cadastro',{tipo:registrationModules[kind],registro_id:id})];
  return []}
function renderResult(target,data){const proposal=data.proposta||{},dados=proposal.dados||{},saved=data.status==='saved',alvo=data.alvo;
  const subject=alvo&&alvo.nome||dados.nome||dados.descricao||'';
  heading(target,(operationLabels[proposal.tipo]||'Operação')+(subject?' · '+subject:''));
  target.append(notice(saved?(/^excluir_/.test(proposal.tipo||'')?'Excluído no ERP.':'Salvo no ERP.'):'Situação: '+(states[data.status]||data.status),saved?'success':'info'));
  const summary={};if(proposal.total!==undefined)summary.total=proposal.total;
  for(const key of ['valor','data_pagamento','data_venda','data_compra','data_vencimento'])if(dados[key]!==undefined)summary[key]=dados[key];
  if(Object.keys(summary).length)target.append(fields(summary));
  const id=Number(data.registro_id);if(saved&&id)target.append(actionsBar(nextSteps(proposal.tipo||'',id,dados)))}
`

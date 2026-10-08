// Detalhes de um registro, com até duas ações conforme o tipo e a situação. Ações que já têm
// todos os dados geram a prévia direto (o usuário confirma no card); as demais pedem na conversa.
export const detailsCardScript=String.raw`
const detailFields={
  obter_parcela_financeira:r=>['descricao',r.lado==='receber'?'cliente':'fornecedor','numero_documento','parcela','vencimento','valor','valor_pago','credito','renegociado','saldo'],
  obter_venda:()=>['cliente_nome','data_venda','data_vencimento','subtotal','total','observacoes'],
  obter_compra:()=>['fornecedor_nome','data_compra','data_vencimento','subtotal','total','observacoes'],
};
const itemColumns={obter_venda:['descricao','quantidade','valor_unitario','desconto','total','quantidade_atendida'],obter_compra:['descricao','quantidade','quantidade_recebida','valor_unitario','total']};
const openStatuses=['aberto','pendente','vencido','parcial'];
// Prévia direta: a tool de escrita valida e devolve o card de revisão com Confirmar/Ajustar.
// Chamadas a partir de botões: button() já serializa o clique em run().
function preview(tool,extra){return open(tool,withCompany({chave_operacao:crypto.randomUUID(),...extra}))}
function ask(text){return say(text)}
function detailActions(tool,args,data,record){
  const name=record.nome||record.numero||record.descricao||('#'+record.id);
  if(tool==='obter_parcela_financeira'){const side=record.lado||args.tipo||'pagar',verb=side==='receber'?'recebimento':'pagamento',account=record.conta_financeira_sugerida;
    const open_=openStatuses.includes(record.status)&&Number(record.saldo)>0;
    return [open_&&{label:'Registrar '+verb,primary:true,run:()=>account?preview('registrar_baixa',{tipo:side,dados:{registro_id:Number(record.id),valor:Number(record.saldo),data_pagamento:today(),conta_financeira_id:Number(account.id)}})
        :ask('Registrar o '+verb+' da parcela '+name+' (ID '+record.id+'), no valor de '+money(record.saldo)+'.')},
      record.conta_id&&{label:'Ver título',run:()=>(open('obter_titulo_financeiro',withCompany({tipo:side,conta_id:Number(record.conta_id)})))}]}
  if(tool==='obter_titulo_financeiro'){const side=args.tipo||'pagar',next=(data.installments||[]).find(p=>openStatuses.includes(p.status)&&Number(p.saldo)>0);
    return [next&&{label:'Próxima parcela',primary:true,run:()=>(open('obter_parcela_financeira',withCompany({tipo:side,parcela_id:Number(next.id)})))},
      {label:'Editar título',run:()=>ask('Quero editar o título '+name+' (ID '+record.id+').')}]}
  if(tool==='obter_venda'){const id=Number(record.id),quote=record.tipo_documento==='orcamento';
    if(quote)return record.status==='cancelada'?[]:[{label:'Converter em venda',primary:true,run:()=>preview('converter_orcamento',{dados:{registro_id:id}})},{label:'Editar orçamento',run:()=>ask('Quero editar o orçamento '+name+' (ID '+id+').')}];
    if(record.status==='rascunho')return [{label:'Confirmar venda',primary:true,run:()=>preview('confirmar_venda',{dados:{registro_id:id}})},{label:'Editar',run:()=>ask('Quero editar a venda '+name+' (ID '+id+').')}];
    if(record.status==='confirmada')return [record.atendimento_status==='pendente'&&{label:'Atender venda',primary:true,run:()=>preview('atender_venda',{dados:{registro_id:id}})},
      {label:'Cancelar venda',run:()=>ask('Quero cancelar a venda '+name+' (ID '+id+').')}];return []}
  if(tool==='obter_compra'){const id=Number(record.id);
    if(record.status==='rascunho')return [{label:'Confirmar compra',primary:true,run:()=>preview('confirmar_compra',{dados:{registro_id:id}})},{label:'Editar',run:()=>ask('Quero editar a compra '+name+' (ID '+id+').')}];
    if(['confirmada','parcialmente_recebida'].includes(record.status))return [{label:'Cancelar compra',run:()=>preview('cancelar_compra',{dados:{registro_id:id}})}];return []}
  if(tool==='obter_cadastro'){const kind=args.tipo,id=record.id;
    const primary=kind==='clientes'?{label:'Nova venda',primary:true,run:()=>ask('Criar uma venda para o cliente '+name+' (ID '+id+').')}
      :kind==='fornecedores'?{label:'Nova compra',primary:true,run:()=>ask('Criar uma compra do fornecedor '+name+' (ID '+id+').')}
      :kind==='produtos'?{label:'Ver estoque',primary:true,run:()=>(open('consultar_estoque',withCompany({busca:String(record.nome||'')})))}:null;
    return [primary,{label:'Editar',run:()=>ask('Quero editar o cadastro '+name+' (ID '+id+').')}]}
  return []}
function renderDetails(target,data){const full=state.displayMode==='fullscreen',args=state.args||{};
  const record=data.record||data.sale||data.purchase||{},name=record.nome||record.numero||record.descricao||('#'+(record.id||''));
  const title=state.tool==='obter_cadastro'&&registrationNouns[args.tipo]?registrationNouns[args.tipo][0][0].toUpperCase()+registrationNouns[args.tipo][0].slice(1):(titles[state.tool]||'Registro');
  target.append(element('h1',title+' '+name));
  const sub=element('p',undefined,'sub');if(record.status)sub.append(chip(record.status));const due=dueText(record.vencimento,record.status);if(due)sub.append(element('span',' '+due,due.startsWith('venceu')?'due':'soon'));if(sub.childNodes.length)target.append(sub);
  const preferred=(detailFields[state.tool]||(()=>[]))(record);
  const keys=[...preferred.filter(k=>record[k]!==undefined&&record[k]!==null&&record[k]!==''),...Object.keys(record).filter(k=>!preferred.includes(k)&&record[k]!==null&&typeof record[k]!=='object'&&!/(_id|versao|lado)$/.test(k)&&!['id','status','nome','numero','tipo_documento','atendimento_status'].includes(k))];
  const inlineFields=strict?5:8;
  target.append(fields(record,full?keys:keys.slice(0,inlineFields)));
  const account=record.conta_financeira_sugerida;if(account&&full)target.append(element('p','Conta sugerida para a baixa: '+account.nome,'muted'));
  const lists=[['items','Itens'],['installments','Parcelas'],['history','Histórico']].filter(([k])=>Array.isArray(data[k])&&data[k].length);
  for(const [key,caption] of full?lists:lists.slice(0,strict?0:1)){const rows=data[key],keysFor=key==='items'?(itemColumns[state.tool]||columns(rows,5)).filter(k=>rows.some(r=>r[k]!==undefined)):key==='installments'?['parcela','vencimento','valor','saldo','status'].filter(k=>rows.some(r=>r[k]!==undefined)):columns(rows,full?6:4);
    const t=element('table'),head=element('tr');t.append(element('caption',caption));for(const k of keysFor){const th=element('th',label(k));if(moneyKeys.has(k)||/quantidade/.test(k))th.className='num';head.append(th)}
    const thead=element('thead');thead.append(head);const body=element('tbody');for(const row of full?rows:rows.slice(0,5)){const tr=element('tr',undefined,row.status==='vencido'?'overdue':'');for(const k of keysFor)tr.append(cell(k==='vencimento'?'vencimento':k,row));body.append(tr)}
    t.append(thead,body);target.append(t)}
  if(data.itemsTruncated||data.installmentsTruncated||data.historyTruncated)target.append(notice('A lista foi limitada; consulte o ERP para ver todos os registros.'));
  const actions=detailActions(state.tool,args,data,record).filter(Boolean);
  const hidden=!full&&(keys.length>inlineFields||lists.length>(strict?0:1)||lists.some(([k])=>data[k].length>5));
  // No Claude o card inline tem no máximo duas ações: a principal e "Ver detalhes" quando há mais dados.
  if(strict&&hidden){target.append(actionsBar([actions.find(a=>a.primary)||actions[0],{label:'Ver detalhes',run:fullscreen}]));return}
  if(actions.length)target.append(actionsBar(actions));
  if(hidden){const more=element('p',undefined,'more');more.append(button('Ver todos os dados',fullscreen));target.append(more)}}
`

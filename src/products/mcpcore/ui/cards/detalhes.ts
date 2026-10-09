// Detalhes de um registro, com até duas ações conforme o tipo e a situação. Ações que já têm
// todos os dados geram a prévia direto (o usuário confirma no card); as demais pedem na conversa.
export const detailsCardScript=String.raw`
const detailFields={
  obter_parcela_financeira:r=>['descricao',r.lado==='receber'?'cliente':'fornecedor','numero_documento','parcela','vencimento','valor','valor_pago','credito','renegociado','saldo'],
  obter_venda:()=>['cliente_nome','data_venda','data_vencimento','subtotal','total','observacoes'],
  obter_compra:()=>['fornecedor_nome','data_compra','data_vencimento','subtotal','total','observacoes'],
  obter_nota_servico:()=>['cliente','data_competencia','valor_total','valor_iss','retencao_iss','retencoes_federais','valor_liquido','local_prestacao','autorizada_em','codigo_verificacao','chave_acesso','erro_mensagem','observacoes'],
};
const itemColumns={obter_venda:['descricao','quantidade','valor_unitario','desconto','total','quantidade_atendida'],obter_compra:['descricao','quantidade','quantidade_recebida','valor_unitario','total'],obter_nota_servico:['descricao','quantidade','valor_unitario','desconto','valor_total']};
const openStatuses=['aberto','pendente','vencido','parcial'];
// Prévia direta: a tool de escrita valida e devolve o card de revisão com Confirmar/Ajustar.
// Chamadas a partir de botões: button() já serializa o clique em run().
function preview(tool,extra){return open(tool,withCompany({chave_operacao:crypto.randomUUID(),...extra}))}
function ask(text){return say(text)}
// Links do ERP (PDF/XML) abrem pelo host; sem suporte a ui/open-link, o link vai para a conversa.
function openLink(url,caption){return request('ui/open-link',{url}).catch(()=>say(caption+': '+url))}
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
  if(tool==='obter_nota_servico'){const id=Number(record.id),note=noteTitle(record),pdf=record.pdf_url&&{label:'Abrir PDF',run:()=>openLink(record.pdf_url,'DANFSe da '+note)};
    if(record.status==='rascunho')return [{label:'Emitir',primary:true,run:()=>preview('emitir_nota_servico',{dados:{registro_id:id}})},{label:'Editar',run:()=>ask('Quero editar o '+note.toLowerCase()+' (ID '+id+').')}];
    if(record.status==='falha')return [{label:'Corrigir dados',primary:true,run:()=>ask('Quero corrigir a '+note+' (ID '+id+'): '+(record.erro_mensagem||'veja o motivo da falha')+'.')}];
    if(record.status==='aguardando_retorno')return [{label:'Consultar retorno',primary:true,run:()=>preview('consultar_nota_servico',{dados:{registro_id:id}})},pdf];
    if(record.status==='emitida')return [pdf&&{...pdf,primary:true},{label:'Cancelar nota',run:()=>ask('Quero cancelar a '+note+' (ID '+id+').')}];
    return [pdf]}
  if(tool==='obter_cadastro'){const kind=args.tipo,id=record.id;
    const primary=kind==='clientes'?{label:'Nova venda',primary:true,run:()=>ask('Criar uma venda para o cliente '+name+' (ID '+id+').')}
      :kind==='fornecedores'?{label:'Nova compra',primary:true,run:()=>ask('Criar uma compra do fornecedor '+name+' (ID '+id+').')}
      :kind==='produtos'?{label:'Ver estoque',primary:true,run:()=>(open('consultar_estoque',withCompany({busca:String(record.nome||'')})))}:null;
    return [primary,{label:'Editar',run:()=>ask('Quero editar o cadastro '+name+' (ID '+id+').')}]}
  return []}
// NFS-e simulada: "NFS-e nº 13" depois de autorizada; antes disso o número é interno e não aparece.
function noteTitle(r){const authorized=['emitida','cancelada'].includes(r.status)||Boolean(r.chave_acesso);
  return authorized&&r.numero?'NFS-e nº '+r.numero:r.status==='aguardando_retorno'?'NFS-e aguardando retorno':r.status==='falha'?'NFS-e com falha':'Rascunho de NFS-e'}
const cancelReasons={'1':'Erro na emissão','2':'Serviço não prestado','9':'Outros'};
function renderNote(target,data){const full=state.displayMode==='fullscreen',r=data.record||{},args=state.args||{},snap=r.destinatario_snapshot||{};
  hero(target,{eyebrow:noteTitle(r),title:r.cliente||snap.nome||'Cliente',status:r.status,amount:r.valor_total,
    meta:['Competência '+formatted('data_competencia',r.data_competencia),r.local_prestacao].filter(Boolean).join(' · ')});
  if(r.status==='falha'&&r.erro_mensagem)target.append(notice(r.erro_mensagem,'danger'));
  else target.append(element('p',r.aviso||'Simulação — sem validade fiscal.','notice notice-warning slim'));
  const values=kv([['valor_iss',r.valor_iss],['retencao_iss',Number(r.retencao_iss)>0?r.retencao_iss:undefined],['retencoes_federais',Number(r.retencoes_federais)>0?r.retencoes_federais:undefined],['valor_liquido',r.valor_liquido,{strong:true}]]);
  const actions=detailActions(state.tool,args,data,r).filter(Boolean);
  // Inline: só o essencial (até 5 dados) e no máximo duas ações; o resto em tela cheia.
  if(!full){target.append(section('Valores',values));
    if(strict){target.append(actionsBar([actions.find(a=>a.primary)||actions[0],{label:'Ver detalhes',run:fullscreen}]));return}
    target.append(actionsBar(actions));const more=element('p',undefined,'more');more.append(button('Ver todos os dados',fullscreen));target.append(more);return}
  target.append(section('Valores',values));
  target.append(section('Tomador',kv([['cliente',snap.nome||r.cliente,{label:'Nome'}],['documento',formatDocument(snap.documento),{label:'CPF/CNPJ',raw:true}],['email',snap.email,{raw:true}],
    ['cidade',[snap.cidade||snap.municipio,snap.uf].filter(Boolean).join('/'),{raw:true}]])));
  if(r.chave_acesso)target.append(section('Identificação fiscal',kv([['codigo_verificacao',r.codigo_verificacao,{mono:true,raw:true}],['autorizada_em',r.autorizada_em],
    ['protocolo',r.protocolo,{mono:true,raw:true}],['numero_dps',r.numero_dps?r.numero_dps+' / série '+(r.serie_dps||'—'):undefined,{label:'DPS',raw:true}],
    ['chave_acesso',copyable(String(r.chave_acesso)),{wide:true}]])));
  const items=data.items||[];if(items.length)target.append(section('Itens',table(items,['descricao','quantidade','valor_unitario','desconto','valor_total'])));
  if(r.observacoes)target.append(section('Observações',element('p',r.observacoes)));
  const tech=element('details',undefined,'tech');tech.append(element('summary','Detalhes técnicos'));
  const techFields=kv([['modelo_emissao',r.modelo_emissao],['emitida_em',r.emitida_em],['cancelada_em',r.cancelada_em],['codigo_municipio_prestacao',r.codigo_municipio_prestacao,{label:'Município (IBGE)',raw:true}],
    ['simulacao_cenario',r.simulacao_cenario,{label:'Cenário da simulação',raw:true}],['versao',r.versao,{label:'Versão',raw:true}],['id',r.id,{label:'ID',raw:true}]]);
  if(techFields){tech.append(techFields);target.append(tech)}
  if(actions.length)target.append(actionsBar(actions))}
// Cabeçalho de cada tipo de registro e os campos que ele já mostra (não se repetem na grade).
function heroFor(tool,record,args){const date=k=>record[k]?formatted('data',record[k]):null,side=record.lado||args.tipo||'pagar',party=side==='receber'?'cliente':'fornecedor';
  const due=dueText(record.vencimento,record.status);
  if(tool==='obter_venda')return {keys:['numero','cliente_nome','total','status','data_venda','data_vencimento','tipo_documento'],eyebrow:(record.tipo_documento==='orcamento'?'Orçamento ':'Venda ')+(record.numero||''),
    title:record.cliente_nome||'Cliente',amount:record.total,status:record.status,meta:[date('data_venda')&&'Data '+date('data_venda'),date('data_vencimento')&&'Vencimento '+date('data_vencimento')].filter(Boolean).join(' · ')};
  if(tool==='obter_compra')return {keys:['numero','fornecedor_nome','total','status','data_compra','data_vencimento'],eyebrow:'Compra '+(record.numero||''),title:record.fornecedor_nome||'Fornecedor',
    amount:record.total,status:record.status,meta:[date('data_compra')&&'Data '+date('data_compra'),date('data_vencimento')&&'Vencimento '+date('data_vencimento')].filter(Boolean).join(' · ')};
  if(tool==='obter_titulo_financeiro')return {keys:['descricao','status',party,'valor_total'],eyebrow:side==='receber'?'Conta a receber':'Conta a pagar',title:record.descricao||'Título',
    amount:record.valor_total!==undefined?record.valor_total:record.valor,status:record.status,meta:record[party]||''};
  if(tool==='obter_parcela_financeira')return {keys:['descricao','status',party,'saldo','vencimento','parcela'],eyebrow:'Parcela '+(record.parcela||'')+' · '+(side==='receber'?'Conta a receber':'Conta a pagar'),
    title:record.descricao||'Parcela',amount:record.saldo,amountLabel:'Saldo',status:record.status,meta:[record[party],record.vencimento&&'Vence '+formatted('vencimento',record.vencimento),due].filter(Boolean).join(' · ')};
  if(tool==='obter_cadastro'){const noun=(registrationNouns[args.tipo]||['cadastro'])[0];return {keys:['nome','status','documento','cidade'],eyebrow:noun[0].toUpperCase()+noun.slice(1),title:record.nome||'Cadastro',
    status:record.status,meta:[record.documento&&formatDocument(record.documento),record.cidade].filter(Boolean).join(' · ')}}
  return {keys:['nome','numero','status'],eyebrow:titles[tool]||'Registro',title:record.nome||record.numero||record.descricao||('#'+(record.id||'')),status:record.status}}
function renderDetails(target,data){if(state.tool==='obter_nota_servico')return renderNote(target,data);const full=state.displayMode==='fullscreen',args=state.args||{};
  const record=data.record||data.sale||data.purchase||{},head=heroFor(state.tool,record,args);
  hero(target,head);if(record.aviso)target.append(element('p',record.aviso,'notice notice-warning slim'));
  const preferred=(detailFields[state.tool]||(()=>[]))(record).filter(k=>!head.keys.includes(k));
  const hiddenKeys=['id','status','nome','numero','tipo_documento','atendimento_status','aviso','modo_operacao','pdf_url','xml_url','lado',...head.keys];
  const keys=[...preferred.filter(k=>record[k]!==undefined&&record[k]!==null&&record[k]!==''),...Object.keys(record).filter(k=>!preferred.includes(k)&&record[k]!==null&&record[k]!==''&&typeof record[k]!=='object'&&!/(_id|versao)$/.test(k)&&!hiddenKeys.includes(k))];
  const inlineFields=strict?4:6,shown=full?keys:keys.slice(0,inlineFields);
  if(record.atendimento_status&&state.tool==='obter_venda')shown.unshift('atendimento_status');
  target.append(section(full?'Resumo':null,kv(shown.map(k=>[k,record[k]]))));
  const account=record.conta_financeira_sugerida;if(account&&full)target.append(element('p','Conta sugerida para a baixa: '+account.nome,'muted'));
  const lists=[['items','Itens'],['installments','Parcelas'],['history','Histórico']].filter(([k])=>Array.isArray(data[k])&&data[k].length);
  for(const [key,caption] of full?lists:lists.slice(0,strict?0:1)){const rows=data[key],keysFor=key==='items'?(itemColumns[state.tool]||columns(rows,5)).filter(k=>rows.some(r=>r[k]!==undefined)):key==='installments'?['parcela','vencimento','data_vencimento','valor','saldo','status'].filter(k=>rows.some(r=>r[k]!==undefined)):columns(rows,full?6:4);
    const t=element('table'),headRow=element('tr');for(const k of keysFor){const th=element('th',label(k));if(moneyKeys.has(k)||/quantidade/.test(k))th.className='num';headRow.append(th)}
    const thead=element('thead');thead.append(headRow);const body=element('tbody');for(const row of full?rows:rows.slice(0,5)){const tr=element('tr',undefined,row.status==='vencido'?'overdue':'');for(const k of keysFor)tr.append(cell(k==='vencimento'?'vencimento':k,row));body.append(tr)}
    t.append(thead,body);target.append(section(caption,t))}
  if(data.itemsTruncated||data.installmentsTruncated||data.historyTruncated)target.append(notice('A lista foi limitada; consulte o ERP para ver todos os registros.'));
  const actions=detailActions(state.tool,args,data,record).filter(Boolean);
  const hidden=!full&&(keys.length>inlineFields||lists.length>(strict?0:1)||lists.some(([k])=>data[k].length>5));
  // No Claude o card inline tem no máximo duas ações: a principal e "Ver detalhes" quando há mais dados.
  if(strict&&hidden){target.append(actionsBar([actions.find(a=>a.primary)||actions[0],{label:'Ver detalhes',run:fullscreen}]));return}
  if(actions.length)target.append(actionsBar(actions));
  if(hidden){const more=element('p',undefined,'more');more.append(button('Ver todos os dados',fullscreen));target.append(more)}}
`

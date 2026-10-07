// Prévia de uma escrita: antes/depois, itens com nomes, total do ERP e no máximo duas ações
// (Confirmar e Ajustar). Ajustar edita quantidade, preço e desconto e gera uma nova prévia.
export const reviewCardScript=String.raw`
const risky=/^(excluir|cancelar|estornar)_/;
function referenceName(data,key,value){const refs=data.referencias||{};if(key==='cliente_id'&&refs.cliente)return refs.cliente.nome;if(key==='fornecedor_id'&&refs.fornecedor)return refs.fornecedor.nome;return null}
function itemName(data,item){const refs=(data.referencias&&data.referencias.itens)||[];const found=refs.find(r=>String(r.id)===String(item.item_id)&&r.tipo===item.tipo);return found?found.nome:(item.descricao||label(item.tipo)+' #'+item.item_id)}
function renderReview(target,data){const proposal=data.proposta||{},dados=proposal.dados||{},alvo=data.alvo,pendingDraft=data.status==='pending';
  heading(target,operationLabels[proposal.tipo]||'Operação',pendingDraft?'Prévia — nada foi salvo ainda.':'');
  if(!pendingDraft)target.append(element('p','Situação: '+(states[data.status]||data.status)));
  if(alvo&&alvo.nome)target.append(element('p','Registro: '+alvo.nome+(alvo.status?' · '+(states[alvo.status]||alvo.status):''),'muted'));
  if(risky.test(proposal.tipo||''))target.append(notice('Atenção: esta operação desfaz ou remove dados no ERP.','danger'));
  const keys=Object.keys(dados).filter(k=>!['itens','parcelas','registro_id'].includes(k)&&(dados[k]===null||typeof dados[k]!=='object'));
  if(keys.length){const before=alvo&&alvo.campos||null,t=element('table'),head=element('tr');head.append(element('th','Campo'));if(before)head.append(element('th','Atual'));head.append(element('th',before?'Novo':'Valor'));
    const thead=element('thead');thead.append(head);const body=element('tbody');
    for(const key of keys){const tr=element('tr'),name=referenceName(data,key,dados[key]),value=name||formatted(key,dados[key]);tr.append(element('td',name?label(key).replace(/ \(ID\)$/,''):label(key)));
      if(before){const old=before[key]===undefined?'—':formatted(key,before[key]);tr.append(element('td',old,'muted'));tr.append(element('td',value,old!==value?'changed':''))}else tr.append(element('td',value));body.append(tr)}
    t.append(thead,body);target.append(t)}
  if(Array.isArray(dados.itens)&&dados.itens.length)target.append(itemsTable(data,dados.itens));
  if(Array.isArray(dados.parcelas)&&dados.parcelas.length)target.append(table(dados.parcelas,['data_vencimento','valor'],'Parcelas'));
  if(proposal.total!==undefined)target.append(metrics([{label:'Total calculado pelo ERP',value:money(proposal.total)}]));
  if(!pendingDraft||!data.confirmar)return;
  const actions=element('div',undefined,'actions');
  if(state.edit)actions.append(button('Atualizar prévia',()=>updatePreview(data),true),button('Cancelar',()=>{state.edit=false;render()}));
  else actions.append(button(risky.test(proposal.tipo||'')?'Confirmar mesmo assim':'Confirmar',()=>confirmDraft(data),true),
    button('Ajustar',()=>Array.isArray(dados.itens)&&dados.itens.length?(state.edit=true,render()):say('Quero ajustar esta proposta antes de confirmar.')));
  target.append(actions)}
function itemsTable(data,items){const t=element('table');t.append(element('caption','Itens'));const head=element('tr');
  for(const [text,num] of [['Item'],['Qtd.',1],['Preço',1],['Desconto',1],['Total',1]]){const th=element('th',text);if(num)th.className='num';head.append(th)}
  const thead=element('thead');thead.append(head);const body=element('tbody');
  items.forEach((item,index)=>{const tr=element('tr');tr.append(element('td',itemName(data,item)));
    for(const key of ['quantidade','valor_unitario','desconto']){const td=element('td',undefined,'num');
      if(state.edit){const input=element('input');input.className='cell';input.type='number';input.min='0';input.step=key==='quantidade'?'0.0001':'0.01';input.value=String(item[key]??0);input.dataset.index=String(index);input.dataset.key=key;input.setAttribute('aria-label',label(key)+' de '+itemName(data,item));td.append(input)}
      else td.textContent=formatted(key,item[key]??0);tr.append(td)}
    tr.append(element('td',item.total!==undefined?money(item.total):'—','num'));body.append(tr)});
  t.append(thead,body);return t}
async function confirmDraft(data){const result=await callTool(data.confirmar.tool,data.confirmar.argumentos);state.error=null;state.edit=false;state.data=result.data;render();
  tellModel('O usuário confirmou no card. Resultado: status '+result.data.status+(result.data.registro_id?', registro_id '+result.data.registro_id:'')+'.',{rascunho_id:result.data.rascunho_id,status:result.data.status,registro_id:result.data.registro_id})}
async function updatePreview(data){const proposal=data.proposta,dados=JSON.parse(JSON.stringify(proposal.dados));
  for(const input of root.querySelectorAll('input.cell')){const value=Number(input.value);if(!Number.isFinite(value)||value<0)throw new Error('Informe números válidos nos itens.');dados.itens[Number(input.dataset.index)][input.dataset.key]=value}
  for(const item of dados.itens)delete item.total;
  const call=toolFor[proposal.tipo];if(!call)throw new Error('Esta operação não pode ser ajustada aqui.');
  const result=await callTool(call.tool,{empresa_id:data.empresa_id,...(call.tipo?{tipo:call.tipo}:{}),chave_operacao:crypto.randomUUID(),dados});
  state.edit=false;state.error=null;state.data=result.data;render();
  tellModel('O usuário ajustou os itens no card. A nova prévia '+result.data.rascunho_id+' substitui a anterior '+data.rascunho_id+'.',{rascunho_id:result.data.rascunho_id,substitui:data.rascunho_id})}
`

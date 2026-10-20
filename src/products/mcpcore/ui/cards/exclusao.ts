export const deletionCardScript=String.raw`
const deletionSpecs={
  excluir_venda:{name:'venda',done:'Venda excluída',record:'Venda',amount:'Valor da venda',tool:'listar_vendas'},
  excluir_orcamento:{name:'orçamento',done:'Orçamento excluído',record:'Orçamento',amount:'Valor do orçamento',tool:'listar_vendas',args:{tipo_documento:'orcamento'}},
  excluir_compra:{name:'compra',done:'Compra excluída',record:'Compra',amount:'Valor da compra',tool:'listar_compras'},
  excluir_cliente:{name:'cliente',done:'Cliente excluído',record:'Cliente',module:'clientes'},
  excluir_fornecedor:{name:'fornecedor',done:'Fornecedor excluído',record:'Fornecedor',module:'fornecedores'},
  excluir_vendedor:{name:'vendedor',done:'Vendedor excluído',record:'Vendedor',module:'vendedores'},
  excluir_produto:{name:'produto',done:'Produto excluído',record:'Produto',module:'produtos',amount:'Preço'},
  excluir_servico:{name:'serviço',done:'Serviço excluído',record:'Serviço',module:'servicos',amount:'Preço'},
  excluir_categoria:{name:'categoria',done:'Categoria excluída',record:'Categoria',module:'categorias'},
  excluir_conta_financeira:{name:'conta financeira',done:'Conta financeira excluída',record:'Conta financeira',module:'contas-financeiras',amount:'Saldo inicial'},
  excluir_conta_pagar:{name:'conta a pagar',done:'Conta a pagar excluída',record:'Conta a pagar',tool:'consultar_financeiro',args:{tipo:'pagar'}},
  excluir_conta_receber:{name:'conta a receber',done:'Conta a receber excluída',record:'Conta a receber',tool:'consultar_financeiro',args:{tipo:'receber'}},
  excluir_nota_servico:{name:'rascunho de NFS-e',done:'Rascunho de NFS-e excluído',record:'NFS-e',tool:'listar_notas_servico',simulation:true}
};
const deletionReasons=['Registro criado por engano','Registro duplicado','Dados incorretos'],deletionViews=new WeakMap();
function deletionSpec(data){return deletionSpecs[(data.proposta||{}).tipo]}
function deletionView(data){if(!deletionViews.has(data))deletionViews.set(data,{reason:String((data.proposta.dados||{}).motivo||''),kept:false,issue:null,previewCall:null});return deletionViews.get(data)}
function deletionTarget(data){const id=Number((data.proposta.dados||{}).registro_id);return Number.isSafeInteger(id)&&id>0&&Number((data.alvo||{}).registro_id)===id}
function deletionSucceeded(data){return Boolean(deletionSpec(data)&&deletionTarget(data)&&registered(data)&&Number(data.registro_id)===Number(data.proposta.dados.registro_id)&&Number.isSafeInteger(Number(data.empresa_id))&&Number(data.empresa_id)>0)}
function deletionReady(data){const call=toolFor[data.proposta.tipo],confirm=data.confirmar;return deletionTarget(data)&&call&&confirm&&confirm.argumentos&&confirm.tool===call.tool&&Number(data.empresa_id)>0&&Number(confirm.argumentos.empresa_id)===Number(data.empresa_id)&&confirm.argumentos.rascunho_id===data.rascunho_id}
function deletionDirty(data){return deletionView(data).reason.trim()!==String(data.proposta.dados.motivo||'').trim()}
function deletionIcon(kind){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');for(const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'}))svg.setAttribute(key,value);
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',kind==='warning'?'M10.3 3.9 1.8 18.1A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0 M12 9v4 M12 17h.01':'M3 6h18 M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14 M10 10v7 M14 10v7');svg.append(path);return svg}
function deletionHeading(card,title,subtitle){const head=element('header',undefined,'deletion-header'),text=element('div'),icon=element('span',undefined,'deletion-trash');text.append(element('h1',title),element('p',subtitle));icon.append(deletionIcon('trash'));head.append(text,icon);card.append(head)}
function deletionSummary(data,result=false){const spec=deletionSpec(data),target=data.alvo||{},details=target.resumo_exclusao||{},party=details.participante,summary=element('dl',undefined,'creation-summary deletion-summary');
  const append=(name,value,className)=>{if(value===undefined||value===null||value==='')return;const row=element('div');row.append(element('dt',name),element('dd',String(value),className));summary.append(row)};
  if(result)append('Registro',target.nome||spec.record+' #'+data.proposta.dados.registro_id);
  if(target.valor!==null&&target.valor!==undefined&&target.valor!==''&&Number.isFinite(Number(target.valor)))append(spec.amount||'Valor',money(target.valor));
  if(!result&&details.data)append(details.data_label||'Data',formatted('data',details.data));
  if(!result&&party)append(label(party.tipo),party.nome||label(party.tipo)+' #'+party.id);
  if(result){append('Situação',spec.done.endsWith('excluído')?'Excluído':'Excluída','deletion-status');const reason=element('div',undefined,'deletion-summary-reason');reason.append(element('dt','Motivo'),element('dd',data.proposta.dados.motivo));summary.append(reason)}return summary}
function deletionListCall(data){const spec=deletionSpec(data);return {tool:spec.module?'buscar_cadastros':spec.tool,args:{empresa_id:Number(data.empresa_id),...(spec.module?{tipo:spec.module}:{}),...(spec.args||{}),...(['listar_vendas','listar_compras'].includes(spec.tool)?{por_pagina:5}:{})}}}
function deletionListButton(data){const call=deletionListCall(data);return button(deletionSpec(data).tool==='listar_vendas'?'Consultar vendas':'Consultar registros',()=>open(call.tool,call.args))}
function keepDeletion(data){const view=deletionView(data);view.kept=true;state.error=null;state.stack=[];render();tellModel('O usuário escolheu manter o registro. A revisão de exclusão foi encerrada apenas neste card, sem solicitar a exclusão ao ERP.',{exclusao_executada:false,revisao_encerrada_localmente:true,empresa_id:data.empresa_id,rascunho_id:data.rascunho_id})}
function deletionActions(card,data){const view=deletionView(data),spec=deletionSpec(data),actions=element('div',undefined,'deletion-actions');card.querySelector('.deletion-actions')?.remove();
  if(view.issue==='uncertain'){actions.append(button('Verificar na conversa',()=>say('Verifique o resultado da exclusão do rascunho '+data.rascunho_id+' na empresa '+data.empresa_id+'. Não repita a exclusão nem crie outra proposta antes de verificar a execução anterior.')))}
  else if(data.status==='pending'||creationExpired(data)){
    actions.append(button('Manter registro',()=>keepDeletion(data)));
    if(strict&&state.displayMode!=='fullscreen')actions.append(button('Revisar exclusão',fullscreen));
    else if(creationExpired(data)||view.issue||deletionDirty(data)||!deletionReady(data)){const update=button('Atualizar prévia',()=>updateDeletionPreview(data));const reason=view.reason.trim();update.disabled=reason.length<3||reason.length>1000;actions.append(update)}
    else{const confirm=button('Excluir '+spec.name,()=>{confirm.textContent='Excluindo…';return confirmDraft(data)});confirm.classList.add('deletion-destructive');confirm.prepend(deletionIcon('trash'));actions.append(confirm)}
  }card.insertBefore(actions,card.querySelector('.creation-footnote'))}
function renderDeletionReview(target,data){const spec=deletionSpec(data),view=deletionView(data),card=element('section',undefined,'deletion-card');
  if(view.kept){deletionHeading(card,'Registro mantido','A revisão foi encerrada neste card');card.append(element('p','Esta revisão foi encerrada sem excluir o registro.','creation-label'),deletionSummary(data));const actions=element('div',undefined,'deletion-actions');actions.append(deletionListButton(data));card.append(actions);target.append(card);return}
  deletionHeading(card,'Excluir '+spec.name+'?','Confira os dados antes de excluir');
  const selected=element('section',undefined,'deletion-selected'),identity=element('div',undefined,'deletion-identity'),icon=element('span',undefined,'deletion-record-icon'),text=element('div'),current=data.alvo||{},party=(current.resumo_exclusao||{}).participante;
  selected.append(element('p','Registro selecionado','creation-label'));icon.append(creationIcon('receipt'));text.append(element('strong',current.nome||spec.record+' #'+data.proposta.dados.registro_id),element('span',(party&&party.nome?party.nome+' · ':'')+'Registro #'+data.proposta.dados.registro_id,'creation-label'));identity.append(icon,text);if(current.status)identity.append(chip(current.status));selected.append(identity);card.append(selected,deletionSummary(data));
  if(data.status==='pending'&&!view.issue&&!creationExpired(data)&&(!strict||state.displayMode==='fullscreen')){
    const field=element('div',undefined,'deletion-reason'),caption=element('label','Motivo da exclusão'),select=element('select'),custom=!deletionReasons.includes(view.reason);caption.htmlFor='deletion-reason';select.id='deletion-reason';
    for(const reason of [...deletionReasons,'Outro motivo']){const option=element('option',reason);option.value=reason==='Outro motivo'?'custom':reason;select.append(option)}select.value=custom?'custom':view.reason;
    select.onchange=()=>{view.reason=select.value==='custom'?'':select.value;state.error=null;render()};field.append(caption,select);
    if(custom){const caption=element('label','Descreva o motivo'),input=element('textarea');caption.htmlFor='deletion-custom-reason';input.id='deletion-custom-reason';input.value=view.reason;input.maxLength=1000;input.minLength=3;input.required=true;input.rows=3;input.oninput=()=>{view.reason=input.value;deletionActions(card,data)};field.append(caption,input)}card.append(field);
    if(deletionDirty(data))card.append(element('p','Atualize a prévia para revisar o motivo antes de excluir.','creation-label'))
  }
  const warning=element('div',undefined,'deletion-warning'),warningText=element('div');warning.append(deletionIcon('warning'));warningText.append(element('strong','Confira antes de excluir.'),element('p','O registro deixará de aparecer nas consultas. O histórico da operação será preservado.'));warning.append(warningText);card.append(warning);
  if(spec.simulation)card.append(notice('Somente o rascunho da NFS-e simulada será excluído. Nenhuma nota será cancelada na prefeitura.','info'));
  if(creationExpired(data)||view.issue==='refresh')card.append(notice('A prévia expirou ou o registro mudou. Atualize e confira os dados novamente.','warning'));
  else if(view.issue==='blocked')card.append(notice('O ERP não permitiu a exclusão. Confira o motivo informado e as permissões antes de atualizar a prévia.','warning'));
  else if(view.issue==='uncertain')card.append(notice('O resultado da exclusão ainda não foi confirmado. Verifique a execução antes de tentar novamente.','warning'));
  else if(!deletionReady(data))card.append(notice('Atualize a prévia para conferir o registro antes de excluir.','warning'));
  if(!['pending','expired'].includes(data.status))card.append(notice('Esta revisão está encerrada. Situação: '+(states[data.status]||data.status)+'.','info'));
  deletionActions(card,data);card.append(element('p',view.issue==='uncertain'?'Não repita a operação sem verificar o resultado.':'A exclusão só acontece após sua confirmação.','creation-footnote'));target.append(card)}
async function updateDeletionPreview(data){const view=deletionView(data),reason=view.reason.trim();if(view.kept||view.issue==='uncertain')return;if(reason.length<3||reason.length>1000)throw new Error('Informe um motivo entre 3 e 1.000 caracteres.');
  const mapping=toolFor[data.proposta.tipo];if(!mapping)throw new Error('Não foi possível atualizar esta prévia.');
  if(!view.previewCall||view.previewCall.args.dados.motivo!==reason)view.previewCall={tool:mapping.tool,args:{empresa_id:Number(data.empresa_id),...(mapping.tipo?{tipo:mapping.tipo}:{}),chave_operacao:crypto.randomUUID(),dados:{registro_id:Number(data.proposta.dados.registro_id),motivo:reason}}};
  const result=await callTool(view.previewCall.tool,view.previewCall.args),next=result.data;
  if(!next||next.empresa_id!==data.empresa_id||!next.proposta||next.proposta.tipo!==data.proposta.tipo||Number(next.proposta.dados.registro_id)!==Number(data.proposta.dados.registro_id)||next.proposta.dados.motivo!==reason||!deletionReady(next)||next.status!=='pending')throw new Error('Não foi possível validar a nova prévia. Confira a operação na conversa.');
  view.kept=true;state.error=null;state.stack=[];state.edit=false;state.data=next;absorb(result);render();
  tellModel('O motivo da exclusão foi atualizado. A nova prévia substitui a anterior e ainda exige confirmação explícita.',{empresa_id:data.empresa_id,rascunho_id:next.rascunho_id,substitui:data.rascunho_id,execucao_confirmada:false})}
async function confirmDeletion(data){const view=deletionView(data);if(view.kept||view.issue||data.status!=='pending'||creationExpired(data)||deletionDirty(data)||!deletionReady(data)){render();return}
  let result;try{result=await callTool(data.confirmar.tool,data.confirmar.argumentos);const next=result.data;
    if(!next||!deletionSucceeded(next)||next.empresa_id!==data.empresa_id||next.rascunho_id!==data.rascunho_id||next.proposta.tipo!==data.proposta.tipo||Number(next.registro_id)!==Number(data.proposta.dados.registro_id)||next.proposta.dados.motivo!==data.proposta.dados.motivo)throw new Error('O ERP não retornou uma confirmação válida desta exclusão.');
  }catch(error){view.issue=['DRAFT_EXPIRED','STALE_PROPOSAL','STALE_VERSION','VERSION_CONFLICT'].includes(error.code)?'refresh':['INVALID_INPUT','VALIDATION_ERROR','INVALID_REFERENCE','INVALID_STATE','INVALID_VALUE','ACCESS_DENIED','INSUFFICIENT_SCOPE','PERIOD_CLOSED'].includes(error.code)?'blocked':'uncertain';throw error}
  view.kept=true;state.error=null;state.stack=[];state.edit=false;state.tool=data.confirmar.tool;state.data=result.data;state.contextWarning=false;absorb(result);render();
  tellModel('O usuário confirmou a exclusão no card e o ERP confirmou a execução. O registro saiu das consultas e o histórico foi preservado. Não repita a exclusão.',{confirmado_no_card:true,execucao_confirmada:true,tipo:data.proposta.tipo,empresa_id:data.empresa_id,rascunho_id:data.rascunho_id,registro_id:result.data.registro_id,status:result.data.status})
    .then(ok=>{if(!ok&&state.data===result.data){state.contextWarning=true;render()}})}
function renderDeletionResult(target,data){const spec=deletionSpec(data),card=element('section',undefined,'deletion-card deletion-result');
  if(!deletionSucceeded(data)){deletionHeading(card,'Exclusão não confirmada','Confira a situação antes de tentar novamente');card.append(notice('Não houve confirmação válida desta exclusão no ERP. Não repita a operação sem verificar o resultado.','warning'));contextNotice(card);target.append(card);return}
  const head=element('header',undefined,'creation-success'),icon=element('span',undefined,'creation-success-icon');icon.append(creationIcon('success'));head.append(icon,element('h1',spec.done),element('p','O registro saiu das consultas. O histórico foi preservado.'));card.append(head,deletionSummary(data,true));
  const actions=element('div',undefined,'deletion-actions');actions.append(deletionListButton(data));card.append(actions);if(spec.simulation)card.append(element('p','Rascunho de NFS-e simulada. Nenhuma nota foi cancelada na prefeitura.','creation-footnote'));contextNotice(card);target.append(card)}
`

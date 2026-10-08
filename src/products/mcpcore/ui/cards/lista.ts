// Listas: colunas por tipo de lista, tabela quando o card é largo e duas linhas por item quando é
// estreito (troca por CSS conforme a largura). Inline: resumo, até 5 itens e no máximo 2 ações.
// Tela cheia: filtros, ordenação no servidor, paginação e clique na linha para abrir os detalhes.
export const listCardScript=String.raw`
const registrationNouns={clientes:['cliente','clientes'],fornecedores:['fornecedor','fornecedores'],vendedores:['vendedor','vendedores'],produtos:['produto','produtos'],servicos:['serviço','serviços'],categorias:['categoria','categorias'],'contas-financeiras':['conta financeira','contas financeiras']};
const financialStatuses=[['aberto','Em aberto'],['vencido','Vencidas'],['parcial','Parciais'],['pago','Pagas'],['cancelado','Canceladas']];
function party(args){return args.tipo==='receber'?'cliente':'fornecedor'}
const listSpecs={
  consultar_financeiro:{columns:args=>['vencimento','descricao',party(args),'saldo','status'],primary:'descricao',secondary:args=>party(args),amount:'saldo',date:'vencimento',due:true,metrics:['em_aberto','vencidas','vence_em_7_dias'],
    noun:['conta','contas'],period:['vencimento_inicio','vencimento_fim'],statuses:financialStatuses,
    sorts:[['vencimento','Vencimento mais próximo'],['-vencimento','Vencimento mais distante'],['-saldo','Maior saldo']],
    detail:(row,args)=>({tool:'obter_parcela_financeira',args:{tipo:args.tipo||'pagar',parcela_id:Number(row.id)}})},
  listar_vendas:{columns:()=>['numero','cliente','data','total','status'],primary:'numero',secondary:()=>'cliente',amount:'total',date:'data',metrics:['valor_total','valor_confirmado'],
    noun:args=>args.tipo_documento==='orcamento'?['orçamento','orçamentos']:['venda','vendas'],period:['inicio','fim'],
    statuses:[['rascunho','Rascunho'],['confirmada','Confirmadas'],['faturada','Faturadas'],['cancelada','Canceladas']],
    sorts:[['-data','Mais recentes'],['data','Mais antigas'],['-total','Maior valor']],
    detail:row=>({tool:'obter_venda',args:{venda_id:Number(row.id)}})},
  listar_compras:{columns:()=>['numero','fornecedor','data','total','status'],primary:'numero',secondary:()=>'fornecedor',amount:'total',date:'data',metrics:['valor_total','valor_confirmado'],
    noun:['compra','compras'],period:['inicio','fim'],
    statuses:[['rascunho','Rascunho'],['confirmada','Confirmadas'],['parcialmente_recebida','Parcialmente recebidas'],['recebida','Recebidas'],['cancelada','Canceladas']],
    sorts:[['-data','Mais recentes'],['data','Mais antigas'],['-total','Maior valor']],
    detail:row=>({tool:'obter_compra',args:{compra_id:Number(row.id)}})},
  consultar_estoque:{columns:()=>['produto','local','quantidade_disponivel','quantidade_reservada','quantidade_fisica'],primary:'produto',secondary:()=>'local',amount:'quantidade_disponivel',noun:['item','itens']},
  listar_pagamentos:{columns:()=>['data_pagamento','tipo','valor_liquido','estornado_em'],primary:'tipo',secondary:()=>'data_pagamento',amount:'valor_liquido',noun:['pagamento','pagamentos']},
  buscar_cadastros:{columns:(args,rows)=>['nome','documento','sku','preco','cidade','email','telefone','status'].filter(k=>rows.some(r=>r[k]!==undefined&&r[k]!==null&&r[k]!=='')).slice(0,4),
    primary:'nome',secondary:(args,row)=>['documento','sku','cidade','email'].find(k=>row&&row[k]),amount:'preco',noun:args=>registrationNouns[args.tipo]||['cadastro','cadastros'],
    detail:(row,args)=>({tool:'obter_cadastro',args:{tipo:args.tipo||'clientes',registro_id:Number(row.id)}})},
};
function specFor(tool){return listSpecs[tool]||{columns:(args,rows)=>columns(rows,5),primary:null,noun:['registro','registros']}}
function nounOf(spec,args,count){const noun=typeof spec.noun==='function'?spec.noun(args):spec.noun;return count===1?noun[0]:noun[1]}
function subtitle(spec,args,data,count){
  const parts=[(data.total!==undefined&&data.total!==null?Number(data.total):count).toLocaleString('pt-BR')+' '+nounOf(spec,args,Number(data.total??count))];
  const status=(spec.statuses||[]).find(([v])=>v===args.status);if(status)parts.push(status[1].toLowerCase());
  if(spec.period&&(args[spec.period[0]]||args[spec.period[1]]))parts.push((args[spec.period[0]]?'de '+formatted('data',args[spec.period[0]])+' ':'')+(args[spec.period[1]]?'até '+formatted('data',args[spec.period[1]]):''));
  const sort=(spec.sorts||[]).find(([v])=>v===args.ordenar)||(spec.sorts||[])[0];if(sort)parts.push(sort[1].toLowerCase());
  if(args.busca)parts.push('busca "'+args.busca+'"');return parts.join(' · ')}
function rowTone(spec,row){return row.status==='vencido'||(spec.due&&row.status!=='pago'&&Number(row.saldo||0)>0&&row.vencimento&&daysBetween(today(),String(row.vencimento).slice(0,10))<0)?'overdue':''}
function cell(key,row){const td=element('td');if(key==='status'){td.append(chip(row.status))}else{td.textContent=formatted(key,row[key]);if(moneyKeys.has(key)||/quantidade/.test(key))td.className='num'}
  if(key==='vencimento'){const due=dueText(row.vencimento,row.status);if(due)td.append(element('small',' · '+due,due.startsWith('venceu')?'due':'soon'))}return td}
function listView(spec,args,rows,clickable){
  // No Claude o card inline usa sempre a lista de duas linhas (nome, valor, data e situação).
  const keys=spec.columns(args,rows),wrap=element('div',undefined,'list'+(strict&&!clickable?' compact':''));
  const t=element('table',undefined,'wide'),head=element('tr');for(const key of keys){const th=element('th',label(key));if(moneyKeys.has(key)||/quantidade/.test(key))th.className='num';head.append(th)}
  const thead=element('thead');thead.append(head);const body=element('tbody');
  const stack=element('ul',undefined,'narrow');
  for(const row of rows){const tone=rowTone(spec,row),tr=element('tr',undefined,tone);for(const key of keys)tr.append(cell(key,row));
    const li=element('li',undefined,'item '+tone),top=element('div',undefined,'item-top'),bottom=element('div',undefined,'item-bottom');
    const title=spec.primary?formatted(spec.primary,row[spec.primary]):formatted(keys[0],row[keys[0]]);
    top.append(element('span',title,'item-title'));if(spec.amount&&row[spec.amount]!==undefined)top.append(element('strong',formatted(spec.amount,row[spec.amount]),'item-amount'));
    const meta=[];const second=spec.secondary&&spec.secondary(args,row);if(second&&row[second])meta.push(formatted(second,row[second]));
    if(spec.date&&row[spec.date])meta.push((spec.due?'vence ':'')+formatted('data',row[spec.date]));const due=spec.due?dueText(row.vencimento,row.status):'';if(due)meta.push(due);
    bottom.append(element('span',meta.join(' · '),'muted'));if(row.status)bottom.append(chip(row.status));li.append(top,bottom);
    if(clickable&&spec.detail){const go=()=>run(()=>{const d=spec.detail(row,args);return open(d.tool,withCompany(d.args))});
      for(const node of [tr,li]){node.classList.add('clickable');node.tabIndex=0;node.setAttribute('role','button');node.setAttribute('aria-label','Abrir '+title);node.onclick=go;node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}}}
    body.append(tr);stack.append(li)}
  t.append(thead,body);wrap.append(t,stack);return wrap}
// Escolha entre poucos cadastros parecidos: cada opção envia a escolha para a conversa.
function choiceView(args,rows){const box=element('div',undefined,'choices');for(const row of rows){const item=element('div',undefined,'choice'),text=element('div');
  text.append(element('strong',row.nome||('#'+row.id)),element('div',[row.documento,row.cidade,row.email,row.sku].filter(Boolean).join(' · ')||'—','muted'));
  item.append(text,button('Usar este',()=>say('Usar '+(registrationNouns[args.tipo]||['cadastro'])[0]+': '+(row.nome||'')+' (ID '+row.id+').')));box.append(item)}return box}
function renderList(target,data){const full=state.displayMode==='fullscreen',rows=data.records||[],args=state.args||{},spec=specFor(state.tool);
  const subject=(state.tool==='buscar_cadastros'||state.tool==='consultar_financeiro')&&registrationTitles[args.tipo]?registrationTitles[args.tipo]:state.tool==='listar_vendas'&&args.tipo_documento==='orcamento'?'Orçamentos':titles[state.tool]||'Resultados';
  heading(target,subject,subtitle(spec,args,data,rows.length));
  if(data.summary){const keys=(spec.metrics||Object.keys(data.summary)).filter(k=>!['referencia','quantidade'].includes(k)&&data.summary[k]!==undefined&&data.summary[k]!==null&&typeof data.summary[k]!=='object');
    const items=keys.slice(0,full?8:strict?2:3).map(k=>({label:label(k),value:formatted(k,data.summary[k])}));if(items.length)target.append(metrics(items))}
  if(full)target.append(filtersView(spec,args));
  if(!rows.length){target.append(notice(args.status?'Nada encontrado com esse filtro.':'Nenhum registro encontrado.'));
    if(args.status||args.busca)target.append(actionsBar([{label:'Limpar filtros',run:()=>load({...args,status:undefined,busca:undefined,pagina:1})}]));return}
  if(!full&&state.tool==='buscar_cadastros'&&args.busca&&rows.length>=2&&rows.length<=8&&!data.hasMore){target.append(choiceView(args,rows));return}
  const inlineRows=strict?3:5;
  target.append(listView(spec,args,full?rows:rows.slice(0,inlineRows),full));
  if(!full){const more=rows.length>inlineRows||data.hasMore===true||Number(data.total||0)>rows.length;
    const overdue=state.tool==='consultar_financeiro'&&args.status!=='vencido'&&Number(data.summary&&data.summary.vencidas||0)>0;
    target.append(actionsBar([overdue&&{label:'Ver vencidas',primary:true,run:async()=>{await load({...args,status:'vencido',pagina:1});await fullscreen()}},(more||rows.length)&&{label:'Ver tudo',run:fullscreen}]));return}
  const page=Number(args.pagina||data.page||1),pager=element('div',undefined,'pager'),prev=button('Anterior',()=>load({...args,pagina:page-1})),next=button('Próxima',()=>load({...args,pagina:page+1}));
  prev.disabled=page<=1;next.disabled=!(data.hasMore===true||page*Number(data.pageSize||args.por_pagina||20)<Number(data.total||0));
  pager.append(prev,element('span','Página '+page,'muted'),next);target.append(pager)}
function filtersView(spec,args){const bar=element('div',undefined,'toolbar');const values={};let apply;
  const field=(text,node)=>{const wrap=element('label',text);wrap.append(node);bar.append(wrap);return node};
  if(state.tool!=='listar_pagamentos'){const search=field('Buscar',element('input'));search.type='search';search.value=args.busca||'';search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();apply.click()}};values.busca=()=>search.value.trim()||undefined}
  // No Claude não há listas suspensas: situação e ordem viram botões de escolha.
  if(spec.statuses){if(strict)values.status=segmented(field,'Situação',[['','Todas'],...spec.statuses],args.status||'');else{const select=field('Situação',element('select'));select.append(new Option('Todas',''));for(const [value,text] of spec.statuses)select.append(new Option(text,value));select.value=args.status||'';values.status=()=>select.value||undefined}}
  if(spec.period){for(const [index,text] of [[0,'De'],[1,'Até']]){const input=field(text,element('input'));input.type='date';input.value=args[spec.period[index]]||'';values[spec.period[index]]=()=>input.value||undefined}}
  if(spec.sorts){if(strict)values.ordenar=segmented(field,'Ordenar por',spec.sorts,args.ordenar||spec.sorts[0][0]);else{const select=field('Ordenar por',element('select'));for(const [value,text] of spec.sorts)select.append(new Option(text,value));select.value=args.ordenar||spec.sorts[0][0];values.ordenar=()=>select.value}}
  apply=button('Aplicar',()=>load({...args,...Object.fromEntries(Object.entries(values).map(([k,f])=>[k,f()])),pagina:1}),true);bar.append(apply);return bar}
// Grupo de botões com uma opção marcada (aria-pressed); devolve o leitor do valor escolhido.
function segmented(field,text,options,current){let value=current;const group=element('div',undefined,'segmented');group.setAttribute('role','group');group.setAttribute('aria-label',text);
  for(const [option,caption] of options){const b=element('button',caption);b.type='button';b.setAttribute('aria-pressed',String(option===value));
    b.onclick=()=>{value=option;for(const other of group.children)other.setAttribute('aria-pressed',String(other===b))};group.append(b)}
  field(text,group);return ()=>value||undefined}
async function load(args){const clean=Object.fromEntries(Object.entries(args).filter(([,v])=>v!==undefined&&v!==''));const content=await callTool(state.tool,clean);absorb(content);state.args=clean;state.error=null;state.data=content.data;render()}
`

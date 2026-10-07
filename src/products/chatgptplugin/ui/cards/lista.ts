// Inline: resumo e até 5 linhas, com uma única ação ("Ver tudo"). Tela cheia: tabela completa, busca e paginação.
export const listCardScript=String.raw`
function renderList(target,data){const full=state.displayMode==='fullscreen',rows=data.records||[],args=state.args||{};
  const subject=(state.tool==='buscar_cadastros'||state.tool==='consultar_financeiro')&&registrationTitles[args.tipo]?registrationTitles[args.tipo]:state.tool==='listar_vendas'&&args.tipo_documento==='orcamento'?'Orçamentos':titles[state.tool]||'Resultados';
  heading(target,subject,data.total!==undefined&&data.total!==null?Number(data.total).toLocaleString('pt-BR')+' registro(s)':'');
  if(data.summary){const items=Object.entries(data.summary).filter(([,v])=>v!==null&&typeof v!=='object').slice(0,full?8:4).map(([k,v])=>({label:label(k),value:formatted(k,v)}));if(items.length)target.append(metrics(items))}
  if(!rows.length){target.append(notice('Nenhum registro encontrado.'));return}
  const keys=columns(rows,full?8:4);target.append(table(full?rows:rows.slice(0,5),keys));
  const more=rows.length>5||data.hasMore===true||Number(data.total||0)>rows.length;
  if(!full){if(more){const actions=element('div',undefined,'actions');actions.append(button('Ver tudo',fullscreen));target.append(actions)}return}
  const page=Number(args.pagina||data.page||1),toolbar=element('div',undefined,'toolbar');
  if(state.tool!=='listar_pagamentos'){const search=element('input');search.type='search';search.placeholder='Buscar';search.setAttribute('aria-label','Buscar');search.value=args.busca||'';
    const go=()=>load({...args,busca:search.value.trim()||undefined,pagina:1});search.onkeydown=e=>{if(e.key==='Enter')run(go)};toolbar.append(search,button('Buscar',go))}
  const pager=element('div',undefined,'pager'),prev=button('Anterior',()=>load({...args,pagina:page-1})),next=button('Próxima',()=>load({...args,pagina:page+1}));
  prev.disabled=page<=1;next.disabled=!(data.hasMore===true||page*Number(data.pageSize||args.por_pagina||20)<Number(data.total||0));
  pager.append(prev,element('span','Página '+page,'muted'),next);target.append(toolbar,pager)}
async function load(args){const clean=Object.fromEntries(Object.entries(args).filter(([,v])=>v!==undefined));const result=await callTool(state.tool,clean);state.args=clean;state.error=null;state.data=result.data;render()}
`

// Indicadores mensais em barras, relatórios em tabela e o resumo geral da empresa.
export const analysisCardScript=String.raw`
function renderAnalysis(target,data){const full=state.displayMode==='fullscreen',rows=data.records||[];
  const period=(data.inicio||data.from)&&(data.fim||data.to)?formatted('data',data.inicio||data.from)+' a '+formatted('data',data.fim||data.to):'';
  heading(target,state.tool==='consultar_relatorio'?label(data.report||'Relatório'):'Indicadores · '+label(data.tipo||''),period);
  if(data.summary)target.append(metrics(Object.entries(data.summary).filter(([,v])=>v!==null&&typeof v!=='object').map(([k,v])=>({label:label(k),value:formatted(k,v)}))));
  if(!rows.length){target.append(notice('Sem movimento no período.'));return}
  if(state.tool==='analisar_periodo'){const max=Math.max(...rows.map(r=>Math.abs(Number(r.valor||0))),1),bars=element('div',undefined,'bars');
    for(const row of rows){const line=element('div',undefined,'bar'),fill=element('i');fill.style.width=Math.max(2,Math.round(Math.abs(Number(row.valor||0))/max*100))+'%';
      const track=element('span');track.append(fill);line.setAttribute('aria-label',row.periodo+': '+money(row.valor));line.append(element('span',row.periodo,'muted'),track,element('b',money(row.valor)));bars.append(line)}
    target.append(bars);return}
  target.append(table(full?rows:rows.slice(0,5),columns(rows,full?8:4)));
  if(!full&&(rows.length>5||data.hasMore)){const actions=element('div',undefined,'actions');actions.append(button('Ver tudo',fullscreen));target.append(actions)}}
function renderOverview(target,data){heading(target,'Resumo da empresa');
  target.append(metrics(Object.entries(data).filter(([,v])=>v!==null&&typeof v!=='object').map(([k,v])=>({label:label(k),value:formatted(k,v)}))))}
function renderAccess(target,data){const companies=data.empresas||[];heading(target,'Suas empresas',companies.length>1?'Escolha a empresa para continuar.':'');
  for(const company of companies){const row=element('div',undefined,'choice'),text=element('div');text.append(element('strong',company.name),element('div',label(company.profile||''),'muted'));row.append(text);
    if(companies.length>1)row.append(button('Usar esta',()=>say('Use a empresa '+company.name+' (empresa_id '+company.id+').')));target.append(row)}}
`

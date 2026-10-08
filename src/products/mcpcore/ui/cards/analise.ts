// Indicadores mensais, fluxo de caixa, inadimplência por faixa, relatórios em tabela, resumo e empresas.
export const analysisCardScript=String.raw`
function bar(labelText,value,max,tone,extra){const line=element('div',undefined,'bar'),track=element('span',undefined,'track'),fill=element('i',undefined,tone||'');
  fill.style.width=Math.max(2,Math.round(Math.abs(Number(value||0))/(max||1)*100))+'%';track.append(fill);line.setAttribute('aria-label',labelText+': '+money(value));
  line.append(element('span',labelText,'muted'),track,element('b',money(value)+(extra||'')));return line}
function variation(current,previous){if(!previous)return '';const change=(Number(current)-Number(previous))/Math.abs(Number(previous))*100;if(!Number.isFinite(change))return '';return ' ('+(change>=0?'+':'')+change.toFixed(0)+'%)'}
function cashFlow(target,rows,full){const max=Math.max(...rows.flatMap(r=>[Number(r.entradas_realizadas)+Number(r.entradas_previstas),Number(r.saidas_realizadas)+Number(r.saidas_previstas)]),1),box=element('div',undefined,'bars');
  for(const row of full?rows:rows.slice(0,6)){const group=element('div',undefined,'flow'),saldo=Number(row.saldo_acumulado);
    group.append(element('strong',monthLabel(row.competencia)));
    group.append(bar('Entradas',Number(row.entradas_realizadas)+Number(row.entradas_previstas),max,'in'),bar('Saídas',Number(row.saidas_realizadas)+Number(row.saidas_previstas),max,'out'));
    group.append(element('div','Saldo acumulado: '+money(saldo),saldo<0?'due':'muted'));box.append(group)}
  target.append(box);const negative=rows.find(r=>Number(r.saldo_acumulado)<0);if(negative)target.append(notice('O saldo previsto fica negativo em '+monthLabel(negative.competencia)+'.','danger'))}
function aging(target,rows,full){const bands=[['a_vencer','A vencer'],['vencido_1_30','1–30 dias'],['vencido_31_60','31–60'],['vencido_61_90','61–90'],['vencido_mais_90','+90']],max=Math.max(...rows.map(r=>Number(r.total)),1),box=element('div',undefined,'bars');
  const totals=Object.fromEntries(bands.map(([k])=>[k,rows.reduce((s,r)=>s+Number(r[k]||0),0)]));target.append(metrics(bands.filter(([k])=>totals[k]>0).slice(0,4).map(([k,t])=>({label:t,value:money(totals[k])}))));
  const who=rows[0]&&('cliente' in rows[0]?'cliente':'fornecedor');
  for(const row of full?rows:rows.slice(0,5)){const line=element('div',undefined,'bar'),track=element('span',undefined,'track stack');
    for(const [k,t] of bands){const value=Number(row[k]||0);if(!value)continue;const part=element('i',undefined,'band-'+k);part.style.width=(value/max*100)+'%';part.title=t+': '+money(value);track.append(part)}
    line.setAttribute('aria-label',row[who]+': vencido '+money(row.vencido)+' de '+money(row.total));line.append(element('span',row[who],'muted'),track,element('b',money(row.total)));box.append(line)}
  target.append(box)}
function renderAnalysis(target,data){const full=state.displayMode==='fullscreen',rows=data.records||[],report=data.report;
  const period=(data.inicio||data.from)&&(data.fim||data.to)?formatted('data',data.inicio||data.from)+' a '+formatted('data',data.fim||data.to):'';
  heading(target,state.tool==='consultar_relatorio'?label(report||'Relatório'):'Indicadores · '+label(data.tipo||''),period);
  if(data.summary)target.append(metrics(Object.entries(data.summary).filter(([,v])=>v!==null&&typeof v!=='object').map(([k,v])=>({label:label(k),value:formatted(k,v)}))));
  if(!rows.length){target.append(notice('Sem movimento no período.'));return}
  if(report==='fluxo-de-caixa')cashFlow(target,rows,full);
  else if(report==='aging-receber'||report==='aging-pagar')aging(target,rows,full);
  else if(state.tool==='analisar_periodo'){const max=Math.max(...rows.map(r=>Math.abs(Number(r.valor||0))),1),bars=element('div',undefined,'bars');
    rows.forEach((row,index)=>bars.append(bar(monthLabel(row.periodo),row.valor,max,'',variation(row.valor,rows[index-1]&&rows[index-1].valor))));target.append(bars);return}
  else target.append(table((full?rows:rows.slice(0,5)).map(r=>r.competencia?{...r,competencia:monthLabel(r.competencia)}:r),columns(rows,full?8:4)));
  if(!full&&(rows.length>(report==='fluxo-de-caixa'?6:5)||data.hasMore))target.append(actionsBar([{label:'Ver tudo',run:fullscreen}]))}
// Cada indicador abre a lista correspondente no próprio card.
const overviewLinks={saldoReceber:['consultar_financeiro',{tipo:'receber'}],saldoPagar:['consultar_financeiro',{tipo:'pagar'}],receberVencido:['consultar_financeiro',{tipo:'receber',status:'vencido'}],
  vendasRascunho:['listar_vendas',{status:'rascunho'}],comprasAbertas:['listar_compras',{status:'confirmada'}],clientesAtivos:['buscar_cadastros',{tipo:'clientes',status:'ativo'}]};
function renderOverview(target,data){heading(target,'Resumo da empresa');const box=element('div',undefined,'metrics');
  for(const [k,v] of Object.entries(data).filter(([,v])=>v!==null&&typeof v!=='object')){const link=overviewLinks[k],node=element(link?'button':'div',undefined,'metric'+(k==='receberVencido'&&Number(v)>0?' alert':''));
    node.append(element('span',label(k)),element('strong',formatted(k,v)));if(link){node.type='button';node.onclick=()=>run(()=>open(link[0],withCompany(link[1])))}box.append(node)}
  target.append(box)}
function renderAccess(target,data){const companies=data.empresas||[];heading(target,'Suas empresas',companies.length>1?'Escolha a empresa para continuar.':'');
  for(const company of companies){const row=element('div',undefined,'choice'),text=element('div');text.append(element('strong',company.name),element('div',label(company.profile||''),'muted'));row.append(text);
    if(companies.length>1)row.append(button('Usar esta',()=>say('Use a empresa '+company.name+' (empresa_id '+company.id+').')));target.append(row)}}
`

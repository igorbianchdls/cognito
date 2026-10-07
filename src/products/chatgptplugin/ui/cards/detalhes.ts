// Um registro com seus itens, parcelas e histórico. Inline mostra os campos e a primeira lista.
export const detailsCardScript=String.raw`
function renderDetails(target,data){const full=state.displayMode==='fullscreen';
  const record=data.record||data.sale||data.purchase||{},name=record.nome||record.numero||record.descricao||('#'+(record.id||''));
  heading(target,(titles[state.tool]||'Registro')+' '+name,record.status?(states[record.status]||record.status):'');
  const keys=Object.keys(record).filter(k=>record[k]!==null&&typeof record[k]!=='object'&&!/(_id|versao)$/.test(k)&&k!=='id');
  target.append(fields(record,full?keys:keys.slice(0,8)));
  const lists=[['items','Itens'],['installments','Parcelas'],['history','Histórico']].filter(([k])=>Array.isArray(data[k])&&data[k].length);
  let hidden=keys.length>8;
  for(const [key,title] of full?lists:lists.slice(0,1)){const rows=data[key];target.append(table(full?rows:rows.slice(0,5),columns(rows,full?7:4),title));if(rows.length>5)hidden=true}
  if(!full&&(hidden||lists.length>1)){const actions=element('div',undefined,'actions');actions.append(button('Ver tudo',fullscreen));target.append(actions)}
  if(data.itemsTruncated||data.installmentsTruncated||data.historyTruncated)target.append(notice('A lista foi limitada; consulte o ERP para ver todos os registros.'))}
`

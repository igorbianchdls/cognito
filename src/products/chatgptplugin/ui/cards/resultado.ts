// Resultado depois da execução: somente saved com registro confirma a operação.
export const resultCardScript=String.raw`
function renderResult(target,data){const proposal=data.proposta||{},saved=data.status==='saved';
  heading(target,operationLabels[proposal.tipo]||'Operação');
  target.append(notice(saved?'Salvo no ERP.':'Situação: '+(states[data.status]||data.status),saved?'success':'info'));
  target.append(fields({registro_id:data.registro_id,status:data.status},['registro_id','status']));
  if(proposal.total!==undefined)target.append(metrics([{label:'Total',value:money(proposal.total)}]))}
`

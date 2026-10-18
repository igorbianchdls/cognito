import { cardStyles } from '../../../ui/styles/cards'
import { commonScript } from '../../../ui/components/common'
import { bridgeScript } from '../../../ui/bridge/mcpApps'

// Card do Tables sobre o mesmo sistema dos cards do ERP (estilos, componentes e ponte MCP Apps).
// Dados chegam pela ponte e entram com textContent; o HTML não contém dados da empresa.
const tablesScript=String.raw`
Object.assign(states,{saved:'Salvo',pending:'Aguardando confirmação',aguardando_envio:'Aguardando arquivo',confirmado:'Confirmado'});
Object.assign(labels,{base:'Base',tabela:'Tabela',campo:'Campo',visualizacao:'Visualização',grupo:'Grupo',texto:'Comentário',autor:'Autor',acao:'Ação',entidade:'Item',excluido_em:'Excluído em',tabelas:'Tabelas',campos:'Campos',registros:'Registros',obrigatorio:'Obrigatório'});
const fieldTypes={texto:'Texto',texto_longo:'Texto longo',numero:'Número',moeda:'Moeda',data:'Data',data_hora:'Data e hora',checkbox:'Checkbox',selecao:'Seleção',selecao_multipla:'Seleção múltipla',usuario:'Responsável',usuarios:'Pessoas',email:'E-mail',url:'URL',vinculo:'Vínculo',anexo:'Anexo',telefone:'Telefone',porcentagem:'Porcentagem',avaliacao:'Avaliação',formula:'Fórmula',busca:'Busca em vínculo',agregacao:'Agregação',autonumero:'Numeração automática',criado_em:'Criado em',alterado_em:'Alterado em',criado_por:'Criado por',alterado_por:'Alterado por',grade:'Grade',kanban:'Kanban',calendario:'Calendário',bases:'Base',tabelas:'Tabela',campos:'Campo',registros:'Registro'};
const titlesByTool={listar_bases:'Bases',obter_tabela:'Estrutura da tabela',consultar_registros:'Registros',obter_registro:'Registro',resumir:'Resumo',listar_atividade:'Atividade',listar_lixeira:'Lixeira',obter_link_anexo:'Anexo',obter_operacao:'Operação',exportar:'Exportação',listar_automacoes:'Automações'};
const short=tool=>String(tool||'').replace(/^tables_/,'');
function heading(target,title,subtitle){target.append(element('h1',title));if(subtitle)target.append(element('p',subtitle,'sub'))}
function openLink(url){return request('ui/open-link',{url})}
async function reload(args){const content=await callTool(state.tool,withCompany(args));state.args=args;state.data=content.data;state.error=null;render()}
function viewFor(tool,data){if(data&&data.operacao_id&&data.status)return renderOperation;if(Array.isArray(data.grupos)||short(tool)==='resumir')return renderSummary;
  if(Array.isArray(data.registros))return renderRecords;if(data.registro)return renderRecord;if(data.url&&short(tool)==='obter_link_anexo')return renderLink;if(data.link_download)return renderExport;return renderItems}
function cellText(record,field){const shown=record.exibicao||{};const value=shown[field.nome]!==undefined?shown[field.nome]:shown[field.nome+' ('+String(field.id).slice(0,8)+')'];if(value===undefined||value==='')return '—';const n=Number(value);if(field.tipo==='moeda'&&Number.isFinite(n))return money(n);if(field.tipo==='numero'&&Number.isFinite(n))return n.toLocaleString('pt-BR',{maximumFractionDigits:6});return value}
const amount=value=>{const text=String(value);return Number(value).toLocaleString('pt-BR',{minimumFractionDigits:text.includes('.')?2:0,maximumFractionDigits:2})}
function pager(data){const page=Number(data.pagina||1),box=element('div',undefined,'pager'),prev=button('Anterior',()=>reload({...state.args,pagina:page-1})),next=button('Próxima',()=>reload({...state.args,pagina:page+1}));
  prev.disabled=page<=1;next.disabled=!data.tem_mais;box.append(prev,element('span','Página '+page,'muted'),next);return box}

// Prévia, resultado e situação de uma alteração.
function describeChanges(op,changes){if(!changes||typeof changes!=='object')return null;
  if(changes.previsto){const p=changes.previsto,errors=(p.erros||[]).length;return kv([['linhas',changes.linhas,{label:'Linhas',raw:true}],['colunas',(changes.colunas||[]).join(', '),{label:'Colunas',raw:true}],['criados',p.criados,{label:'Registros a criar',raw:true}],...(errors?[['erros',errors+(errors===1?' linha com erro':' linhas com erro'),{label:'Erros',raw:true}]]:[])])}
  if(Array.isArray(changes.registros)){const count=changes.registros.length,editing=changes.registros.filter(r=>r.registro_id).length;return kv([['registros',count+(count===1?' registro':' registros')+(editing?' ('+editing+' em edição)':'')]])}
  const flat=Object.entries(changes.alteracoes||changes.campo||changes.visualizacao||changes).filter(([k,v])=>v!==null&&typeof v!=='object'&&!/_id$|^expected/.test(k));
  return kv(flat.slice(0,6).map(([k,v])=>[k,k==='tipo'?(fieldTypes[v]||v):v]))}
function renderOperation(target,data){const done=data.status==='saved',preview=data.previa||{},result=data.resultado||{};
  hero(target,{eyebrow:'Tables',title:data.titulo||'Operação',status:data.status});
  const refs=(preview.referencias||[]).filter(r=>r.nome).slice(0,5);if(refs.length)target.append(kv(refs.map(r=>[r.tipo,r.nome,{label:(fieldTypes[r.tipo]||label(r.tipo)).replace(/^./,c=>c.toUpperCase()),raw:true}])));
  if(data.status==='pending'){target.append(section('O que vai mudar',describeChanges(data.operacao,preview.alteracoes)));if(preview.aviso)target.append(notice(preview.aviso,'warning'));
    target.append(notice('Revise a alteração antes de confirmar.'));
    if(data.confirmar)target.append(actionsBar([{label:'Confirmar',primary:true,run:async()=>{const content=await callTool(data.confirmar.tool,data.confirmar.argumentos);state.data=content.data;state.error=null;render();
      tellModel('Confirmado no card do Tables: '+JSON.stringify({tool:data.confirmar.tool,operacao_id:data.operacao_id,status:content.data.status}))}},
      {label:'Cancelar',run:async()=>{const content=await callTool('tables_cancelar_operacao',withCompany({operacao_id:data.operacao_id}));state.data=content.data;render();tellModel('Prévia do Tables cancelada no card: '+data.operacao_id)}}]));return}
  target.append(notice({saved:'Operação executada.',cancelled:'Prévia cancelada.',expired:'Prévia expirada.'}[data.status]||label(data.status),done?'success':'info'));
  if(done){const saved=[];if(Array.isArray(result.registros))saved.push(['registros',result.quantidade||result.registros.length]);if(result.criados!==undefined)saved.push(['registros',result.criados],...((result.erros||[]).length?[['erros',result.erros.length+' linhas com erro',{label:'Erros',raw:true}]]:[]));
    for(const key of ['base','tabela','campo','visualizacao'])if(result[key]&&result[key].nome)saved.push([key,result[key].nome,{label:label(key),raw:true}]);
    const box=kv(saved);if(box)target.append(box);
    const actions=[];if(result.upload_form_url)actions.push({label:result.status==='confirmado'?'Abrir envio':'Enviar arquivo',primary:result.status!=='confirmado',run:()=>openLink(result.upload_form_url)});
    if(data.produto_url)actions.push({label:'Abrir no Tables',run:()=>openLink(data.produto_url)});if(actions.length)target.append(actionsBar(actions))}}

// Registros com colunas escolhidas e totais do filtro completo.
function renderRecords(target,data){const full=state.displayMode==='fullscreen',rows=data.registros||[],fields=data.campos||[];
  heading(target,titlesByTool.consultar_registros,data.total+(data.total===1?' registro':' registros'));
  const sums=Object.entries(data.somas||{}).map(([id,value])=>{const f=fields.find(x=>x.id===id);return f?{label:'Soma · '+f.nome,value:f.tipo==='moeda'?money(value):Number(value).toLocaleString('pt-BR')}:null}).filter(Boolean);
  if(sums.length)target.append(metrics(sums.slice(0,full?6:strict?2:3)));
  if(!rows.length){target.append(notice('Nenhum registro encontrado.'));return}
  const visible=fields.slice(0,full?fields.length:strict?3:4),shown=full?rows:rows.slice(0,strict?3:5);
  const t=element('table'),head=element('tr');for(const f of visible){const th=element('th',f.nome);if(['moeda','numero'].includes(f.tipo))th.className='num';head.append(th)}const thead=element('thead');thead.append(head);const body=element('tbody');
  for(const r of shown){const line=element('tr');for(const f of visible){const cell=element('td',cellText(r,f));if(['moeda','numero'].includes(f.tipo))cell.className='num';line.append(cell)}line.className='clickable';line.tabIndex=0;line.onclick=()=>run(()=>open('tables_obter_registro',withCompany({registro_id:r.id})));body.append(line)}
  t.append(thead,body);target.append(t);
  if(full){if(data.tem_mais||Number(data.pagina||1)>1)target.append(pager(data))}else if(rows.length>shown.length||data.tem_mais||fields.length>visible.length)target.append(actionsBar([{label:'Ver tudo',run:fullscreen}]))}
function renderRecord(target,data){const record=data.registro||{},shown=record.exibicao||{},entries=Object.entries(shown);
  hero(target,{eyebrow:'Registro',title:entries.length?String(entries[0][1]||'Sem nome'):'Registro',meta:record.atualizado_em?'Atualizado em '+formatted('criado_em',record.atualizado_em):''});
  const box=kv(entries.slice(1).map(([k,v])=>[k,v,{label:k,raw:true}]));if(box)target.append(box);
  if((data.anexos||[]).length)target.append(section('Anexos',kv(data.anexos.map(a=>[a.id,a.nome,{label:'Arquivo',raw:true}]))));
  if((data.colunas_omitidas||[]).length)target.append(element('p','Outros campos: '+data.colunas_omitidas.join(', '),'sub'))}

// Contagem e métricas por grupo, com barras proporcionais.
function renderSummary(target,data){const groups=data.grupos||[],metricNames=Object.keys(data.metricas||{});
  heading(target,titlesByTool.resumir,data.agrupado_por?'Por '+data.agrupado_por.nome:'Todos os registros do filtro');
  target.append(metrics([{label:'Registros',value:Number(data.total||0).toLocaleString('pt-BR')},...metricNames.slice(0,strict?1:3).map(n=>({label:n[0].toUpperCase()+n.slice(1),value:data.metricas[n]===null?'—':amount(data.metricas[n])}))]));
  if(!groups.length)return;
  const max=Math.max(...groups.map(g=>g.quantidade),1),list=element('div',undefined,'bars'),limit=state.displayMode==='fullscreen'?groups.length:strict?4:6;
  for(const g of groups.slice(0,limit)){const row=element('div',undefined,'bar'),track=element('div',undefined,'track'),fill=element('span');fill.style.width=Math.max(2,Math.round(g.quantidade/max*100))+'%';fill.style.background='var(--accent, #6b5bd2)';track.append(fill);
    const extra=metricNames[0]&&g.metricas[metricNames[0]]!==null?' · '+amount(g.metricas[metricNames[0]]):'';row.style.gridTemplateColumns='minmax(96px,32%) 1fr auto';
    row.append(element('span',g.rotulo,'item-title'),track,element('span',g.quantidade+extra,'num'));list.append(row)}
  target.append(list);if(data.observacao)target.append(element('p',data.observacao,'sub'));
  if(groups.length>limit||data.grupos_omitidos)target.append(actionsBar([{label:'Ver tudo',run:fullscreen}]))}

// Listas: bases, estrutura da tabela, atividade e lixeira.
function renderItems(target,data){const full=state.displayMode==='fullscreen',tool=short(state.tool);
  if(data.base){hero(target,{eyebrow:'Base',title:data.base.nome,meta:data.base.descricao||''})}else heading(target,titlesByTool[tool]||'Tables',data.tabela?data.tabela.nome:(data.total!==undefined?data.total+' itens':''));
  const source=data.itens||(data.tabelas&&data.tabelas.itens)||(data.automacoes&&data.automacoes.map(a=>({nome:a.nome,gatilho:a.gatilho,ativa:a.ativa?'Sim':'Não',ultima_entrega:a.ultimas_entregas[0]?a.ultimas_entregas[0].estado:'—'})))||[];const rows=source.map(item=>{const row={...item};if(row.tipo)row.tipo=fieldTypes[row.tipo]||row.tipo;if(row.opcoes&&row.opcoes.itens)row.opcoes=row.opcoes.itens.map(o=>o.nome).join(', ');return row});
  if(!rows.length){target.append(notice(tool==='listar_lixeira'?'A lixeira está vazia.':'Nada encontrado.'));return}
  const keys=columns(rows,full?6:strict?2:3).filter(k=>!['posicao','cor','icone'].includes(k));const shown=full?rows:rows.slice(0,strict?3:5);
  target.append(table(shown,keys.length?keys:['nome']));
  if(full){if(data.tem_mais||Number(data.pagina||1)>1)target.append(pager(data.itens?data:data.tabelas))}else if(rows.length>shown.length||data.tem_mais||(data.tabelas&&data.tabelas.tem_mais))target.append(actionsBar([{label:'Ver tudo',run:fullscreen}]))}
function renderExport(target,data){hero(target,{eyebrow:'Exportação',title:data.tabela||'Tabela',meta:Number(data.registros||0).toLocaleString('pt-BR')+' registros · o link vale 1 hora'});target.append(actionsBar([{label:'Baixar CSV',primary:true,run:()=>openLink(data.link_download)}]))}
function renderLink(target,data){hero(target,{eyebrow:'Anexo',title:'Link de download pronto',meta:'O link expira em instantes; gere outro se precisar.'});target.append(actionsBar([{label:'Baixar arquivo',primary:true,run:()=>openLink(data.url)}]))}
`

export function renderTablesCard(host:'chatgpt'|'claude') {
 const constants=`const fieldLabels={},HOST=${JSON.stringify(host)},strict=HOST==='claude';document.documentElement.classList.add('host-'+HOST);`
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cardStyles}</style></head><body><main><section id="app" aria-live="polite" aria-label="Resultado do Tables"></section><p id="status" class="muted" role="status">Conectando…</p></main><script>(function(){${constants}\n${commonScript}\n${tablesScript}\n${bridgeScript({name:'tables-cards',version:'2.0.0',host})}})();</script></body></html>`
}

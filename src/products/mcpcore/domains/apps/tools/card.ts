import { cardStyles } from '../../../ui/styles/cards'
import { commonScript } from '../../../ui/components/common'
import { bridgeScript } from '../../../ui/bridge/mcpApps'

// Card de Apps sobre o mesmo sistema dos cards do ERP e do Tables. Dados entram com textContent.
const appsScript = String.raw`
Object.assign(states,{saved:'Salvo',pending:'Aguardando confirmação',no_ar:'No ar',em_construcao:'Em construção',arquivado:'Arquivado',na_lixeira:'Na lixeira',ok:'Compila',erro:'Com erro'});
Object.assign(toneOf,{no_ar:'success',em_construcao:'info',arquivado:'muted',na_lixeira:'muted',ok:'success',erro:'danger'});
Object.assign(labels,{app:'App',versao:'Versão',substitui:'Substitui',modelo:'Modelo',tabelas:'Tabelas do Tables',colecoes:'Coleções',acao:'Ação',situacao:'Situação',compilacao:'Compilação'});
const short=tool=>String(tool||'').replace(/^apps_/,'');
function openLink(url){return request('ui/open-link',{url})}
function heading(target,title,subtitle){target.append(element('h1',title));if(subtitle)target.append(element('p',subtitle,'sub'))}
function linkActions(l,extra){return actionsBar([extra,l&&l.previa&&{label:'Abrir prévia',primary:!extra,run:()=>openLink(l.previa)},l&&l.app&&{label:'Abrir app',run:()=>openLink(l.app)},l&&!l.app&&l.editor&&{label:'Abrir editor',run:()=>openLink(l.editor)}].filter(Boolean))}
function buildError(target,text){if(!text)return;target.append(notice('O rascunho foi salvo, mas não compilou.','danger'));const pre=element('pre',text,'mono');pre.style.whiteSpace='pre-wrap';target.append(pre)}
function viewFor(tool,data){if(data&&data.operacao_id&&data.status)return renderOperation;const t=short(tool);if(t==='listar'||Array.isArray(data.apps))return renderList;if(t==='obter_codigo')return renderCode;if(t==='consultar_dados')return renderData;return renderApp}

function renderOperation(target,data){const preview=data.previa||{},result=data.resultado||{};
  hero(target,{eyebrow:'Apps',title:data.titulo||'Operação',meta:preview.app||result.nome||'',status:data.status});
  if(data.status==='pending'){target.append(kv(['versao','substitui','modelo','acao'].map(k=>[k,preview[k]]).concat([['tabelas',(preview.tabelas||[]).join(', ')||undefined],['colecoes',(preview.colecoes||[]).join(', ')||undefined]])));
    if(preview.aviso)target.append(notice(preview.aviso,'warning'));
    if(data.confirmar)target.append(actionsBar([{label:'Confirmar',primary:true,run:async()=>{const content=await callTool(data.confirmar.tool,data.confirmar.argumentos);state.data=content.data;state.error=null;render();tellModel('Confirmado no card de Apps: '+JSON.stringify({tool:data.confirmar.tool,operacao_id:data.operacao_id,status:content.data.status}))}},
      {label:'Cancelar',run:async()=>{const content=await callTool('apps_cancelar_operacao',withCompany({operacao_id:data.operacao_id}));state.data=content.data;render()}}]));return}
  if(data.status!=='saved'){target.append(notice({cancelled:'Prévia cancelada.',expired:'Prévia expirada.'}[data.status]||label(data.status)));return}
  if(result.compilacao==='erro')buildError(target,result.erro_compilacao);else target.append(notice(data.operacao==='salvar_codigo'?'Rascunho salvo. A versão no ar não mudou.':'Operação executada.','success'));
  const box=kv([['versao',result.versao],['situacao',result.situacao],['modelo',result.modelo],['compilacao',result.compilacao]]);if(box)target.append(box);
  if((result.alterados||[]).length)target.append(element('p','Arquivos alterados: '+result.alterados.join(', '),'sub'));
  if(result.links)target.append(linkActions(result.links))}

function renderApp(target,data){const app=data.app||{};
  hero(target,{eyebrow:'App',title:app.nome,meta:[data.modelo==='react'?'React':'HTML',data.versao_publicada?'versão '+data.versao_publicada+' no ar':null].filter(Boolean).join(' · '),status:app.situacao});
  const draft=(data.versoes||[]).find(v=>v.estado==='rascunho');if(draft&&draft.compilacao==='erro')buildError(target,draft.erro_compilacao);
  const box=kv([['tabelas',(data.tabelas||[]).map(t=>t.chave+' ('+t.operacoes.join(', ')+')').join(', ')||undefined],['colecoes',(data.colecoes||[]).map(c=>c.nome).join(', ')||undefined],['versao',draft?'rascunho '+draft.numero:undefined]]);if(box)target.append(box);
  if((data.arquivos||[]).length&&state.displayMode==='fullscreen')target.append(section('Arquivos',table(data.arquivos.map(f=>({nome:f.caminho,tamanho:f.tamanho+' caracteres'})),['nome','tamanho'])));
  target.append(linkActions(data.links))}

function renderList(target,data){const rows=data.apps||[],full=state.displayMode==='fullscreen';heading(target,'Apps',data.total+(data.total===1?' app':' apps'));
  if(!rows.length){target.append(notice('Nenhum app encontrado.'));return}
  const shown=full?rows:rows.slice(0,strict?3:5),t=element('table'),body=element('tbody');
  for(const a of shown){const line=element('tr');line.append(element('td',a.nome),element('td'));line.lastChild.append(chip(a.situacao));line.className='clickable';line.tabIndex=0;line.onclick=()=>run(()=>open('apps_obter',withCompany({app_id:a.id})));body.append(line)}
  t.append(body);target.append(t);if(!full&&(rows.length>shown.length||data.tem_mais))target.append(actionsBar([{label:'Ver tudo',run:fullscreen}]))}

function renderCode(target,data){heading(target,data.caminho||'Arquivos do app','versão '+data.versao);
  if(Array.isArray(data.arquivos)){target.append(table(data.arquivos.map(f=>({nome:f.caminho,tamanho:f.tamanho+' caracteres'})),['nome','tamanho']));return}
  if(data.codificacao==='base64'){target.append(notice('Imagem ('+data.tamanho+' caracteres em base64).'));return}
  const full=state.displayMode==='fullscreen',text=String(data.conteudo||''),pre=element('pre',full?text:text.slice(0,1500),'mono');pre.style.whiteSpace='pre-wrap';pre.style.fontSize='12px';target.append(pre);
  if(!full&&text.length>1500||data.tem_mais)target.append(actionsBar([{label:'Ver tudo',run:fullscreen}]))}

function renderData(target,data){const rows=data.registros||[];heading(target,(data.colecao&&data.colecao.nome)||'Dados',data.total+' registros');
  if(data.aviso)target.append(element('p',data.aviso,'sub'));if(!rows.length){target.append(notice('Nenhum registro.'));return}
  const keys=[...new Set(rows.flatMap(r=>Object.keys(r.dados||{})))].slice(0,strict?3:5);target.append(table(rows.slice(0,state.displayMode==='fullscreen'?rows.length:5).map(r=>r.dados||{}),keys))}
`

export function renderAppsCard(host: 'chatgpt' | 'claude') {
  const constants = `const fieldLabels={},HOST=${JSON.stringify(host)},strict=HOST==='claude';document.documentElement.classList.add('host-'+HOST);`
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cardStyles}</style></head><body><main><section id="app" aria-live="polite" aria-label="Resultado de Apps"></section><p id="status" class="muted" role="status">Conectando…</p></main><script>(function(){${constants}\n${commonScript}\n${appsScript}\n${bridgeScript({ name: 'apps-cards', version: '1.0.0', host })}})();</script></body></html>`
}

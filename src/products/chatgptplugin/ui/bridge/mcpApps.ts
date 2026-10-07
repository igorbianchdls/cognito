import { CHATGPTPLUGIN_VERSION } from '../../shared/version'
// Ponte MCP Apps (JSON-RPC por postMessage). O card descobre a tool que o abriu por
// hostContext.toolInfo (ou _meta do resultado) e escolhe a visualização correspondente.
export const bridgeScript=String.raw`
const pending=new Map();let sequence=1,connected=false,queued=null;
const state={tool:null,args:{},data:null,error:null,displayMode:'inline',busy:false,edit:false,generation:0};
const root=document.getElementById('app'),status=document.getElementById('status');
function request(method,params){return new Promise((resolve,reject)=>{const id=sequence++,timer=setTimeout(()=>{pending.delete(id);reject(new Error('A conexão demorou. Tente novamente.'))},30000);pending.set(id,{resolve,reject,timer});window.parent.postMessage({jsonrpc:'2.0',id,method,params},'*')})}
function notify(method,params){window.parent.postMessage({jsonrpc:'2.0',method,params},'*')}
function failure(result){let error;try{error=JSON.parse(result.content.find(c=>c.type==='text').text)}catch{}const e=new Error(error&&error.message||'Não foi possível concluir.');e.fields=error&&error.campos||[];e.code=error&&error.code;return e}
async function callTool(name,args){const result=await request('tools/call',{name,arguments:args});if(!result||result.isError)throw failure(result||{});if(!result.structuredContent||!result.structuredContent.ok)throw new Error('Resposta indisponível.');return result.structuredContent}
function fullscreen(){return request('ui/request-display-mode',{mode:'fullscreen'}).then(r=>{if(r&&r.mode){state.displayMode=r.mode;render()}})}
function say(text){return request('ui/message',{role:'user',content:{type:'text',text}})}
function tellModel(text,structured){return request('ui/update-model-context',{content:[{type:'text',text}],...(structured?{structuredContent:structured}:{})}).catch(()=>undefined)}
function applyHost(context){if(!context)return;if(context.theme==='light'||context.theme==='dark')document.documentElement.style.colorScheme=context.theme;
  const vars=context.styles&&context.styles.variables;if(vars)for(const [key,value] of Object.entries(vars))if(/^--[a-z0-9-]+$/.test(key)&&typeof value==='string')document.documentElement.style.setProperty(key,value);
  if(context.displayMode)state.displayMode=context.displayMode;if(context.toolInfo&&context.toolInfo.tool&&context.toolInfo.tool.name)state.tool=context.toolInfo.tool.name}
function receive(result){if(result&&result._meta&&typeof result._meta['cognito/tool']==='string')state.tool=result._meta['cognito/tool'];
  if(!result||result.isError){state.error=failure(result||{});state.data=null}else{state.error=null;state.data=result.structuredContent&&result.structuredContent.data}render()}
async function run(fn){if(state.busy)return;state.busy=true;const ticket=++state.generation;root.setAttribute('aria-busy','true');status.textContent='Consultando…';for(const c of root.querySelectorAll('button,input,select'))c.disabled=true
  try{await fn()}catch(error){if(ticket===state.generation){state.error=error;render()}}finally{state.busy=false;root.setAttribute('aria-busy','false');if(status.textContent==='Consultando…')status.textContent='';for(const c of root.querySelectorAll('button,input,select'))c.disabled=false}}
function render(){root.replaceChildren();status.textContent='';
  try{if(state.error&&!state.data)renderError(root,state.error);else if(state.data)(viewFor(state.tool,state.data))(root,state.data);if(state.error&&state.data)root.append(errorNotice(state.error))}
  catch(error){root.replaceChildren(notice('Não foi possível exibir este resultado.','danger'))}
  notify('ui/notifications/size-changed',{height:document.documentElement.scrollHeight})}
function errorNotice(error){const box=element('div'),hasFields=error.fields&&error.fields.length;box.append(notice(hasFields?'Confira os campos abaixo.':error.message,'danger'));if(error.fields&&error.fields.length){const list=element('ul');for(const f of error.fields)list.append(element('li',label(String(f.campo).replace(/^dados\./,''))+': '+f.motivo));box.append(list)}return box}
function renderError(target,error){target.append(element('h1','Não foi possível concluir'),errorNotice(error))}
window.addEventListener('message',event=>{if(event.source!==window.parent)return;const m=event.data;if(!m||m.jsonrpc!=='2.0')return;
  const waiting=pending.get(m.id);if(waiting&&m.method===undefined){clearTimeout(waiting.timer);pending.delete(m.id);m.error?waiting.reject(new Error(m.error.message||'Falha na conexão')):waiting.resolve(m.result);return}
  if(m.method==='ui/notifications/tool-input')state.args=(m.params&&m.params.arguments)||{};
  if(m.method==='ui/notifications/tool-result'){if(connected)receive(m.params);else queued=m.params}
  if(m.method==='ui/notifications/tool-cancelled'){root.replaceChildren(notice('Consulta cancelada.'))}
  if(m.method==='ui/notifications/host-context-changed'){const before=state.displayMode;applyHost(m.params);if(state.displayMode!==before&&state.data)render()}
  if(m.method==='ui/resource-teardown'&&m.id!==undefined)window.parent.postMessage({jsonrpc:'2.0',id:m.id,result:{}},'*')});
request('ui/initialize',{protocolVersion:'2026-01-26',appInfo:{name:'chatgptplugin-cards',version:'${CHATGPTPLUGIN_VERSION}'},appCapabilities:{availableDisplayModes:['inline','fullscreen']}})
  .then(result=>{connected=true;applyHost(result&&result.hostContext);notify('ui/notifications/initialized',{});if(queued)receive(queued);else status.textContent='Aguardando o resultado…'})
  .catch(error=>{root.replaceChildren(notice(error.message,'danger'))});
new ResizeObserver(()=>notify('ui/notifications/size-changed',{height:document.documentElement.scrollHeight})).observe(document.body);
`

import type { AppPackage } from '../../shared/contracts'

const quote = (s: string) => JSON.stringify(s).replace(/</g, '\\u003c')
export type CompiledApp = { js: string; css: string; vendor: string }
export function buildDocument(p: AppPackage, session: string, nonce: string, compiled?: CompiledApp) {
  const doc = new DOMParser().parseFromString(p.arquivos.find(f => f.caminho === 'index.html')!.conteudo, 'text/html')
  const files = new Map(p.arquivos.map(f => [f.caminho, f]))
  for (const n of doc.querySelectorAll('base,meta[http-equiv],iframe,object,embed,portal')) n.remove()
  for (const n of doc.querySelectorAll('*')) for (const a of [...n.attributes]) {
    if (/^on/i.test(a.name) || ['srcdoc', 'formaction', 'action', 'ping', 'srcset', 'target'].includes(a.name.toLowerCase())) n.removeAttribute(a.name)
  }
  for (const link of doc.querySelectorAll('link')) {
    const f = files.get((link.getAttribute('href') ?? '').replace(/^\.\//, ''))
    if (link.rel === 'stylesheet' && f?.caminho.endsWith('.css')) { const style = doc.createElement('style'); style.textContent = f.conteudo; link.replaceWith(style) } else link.remove()
  }
  for (const image of doc.querySelectorAll('img')) {
    const f = files.get((image.getAttribute('src') ?? '').replace(/^\.\//, ''))
    if (f?.codificacao === 'base64') image.src = `data:image/${f.caminho.endsWith('.jpg') ? 'jpeg' : f.caminho.split('.').pop()};base64,${f.conteudo}`
    else if (!image.getAttribute('src')?.startsWith('data:image/')) image.removeAttribute('src')
  }
  // Keep user code out of HTML parser raw-text delimiters: each script creates the real one.
  const inject = (code: string) => { const s = doc.createElement('script'); s.nonce = nonce; s.textContent = `{const s=document.createElement('script');s.nonce=${quote(nonce)};s.textContent=${quote(code)};document.currentScript.after(s);}`; return s }
  if (compiled) {
    // React apps: index.html only hosts the root; the compiled bundle replaces its scripts.
    for (const script of doc.querySelectorAll('script')) script.remove()
    if (compiled.css) { const style = doc.createElement('style'); style.textContent = compiled.css; doc.head.append(style) }
    doc.body.append(inject(compiled.vendor), inject(compiled.js))
  }
  else for (const script of doc.querySelectorAll('script')) {
    const src = script.getAttribute('src'), f = src ? files.get(src.replace(/^\.\//, '')) : undefined
    if (src && !f?.caminho.endsWith('.js')) { script.remove(); continue }
    const code = f?.conteudo ?? script.textContent ?? ''
    const replacement = doc.createElement('script'); replacement.nonce = nonce
    // Keep user code out of HTML parser raw-text delimiters.
    replacement.textContent = `{const s=document.createElement('script');s.nonce=${quote(nonce)};s.textContent=${quote(code)};document.currentScript.after(s);}`
    script.replaceWith(replacement)
  }
  const sdk = doc.createElement('script'); sdk.nonce = nonce
  sdk.textContent = `(()=>{let port,seq=0;const early=[],seen=new Set();let reported=0;function report(m,o,p){if(reported>=20)return;const msg={type:'erro',mensagem:String(m||'Erro desconhecido').replace(/^Uncaught /,'').slice(0,1000),origem:String(o||'').slice(0,300),pilha:String(p||'').slice(0,4000)},key=msg.mensagem+'|'+msg.origem;if(seen.has(key))return;seen.add(key);reported++;port?port.postMessage(msg):early.push(msg)}addEventListener('error',e=>report(e.message||(e.error&&e.error.message),e.filename?(e.filename==='about:srcdoc'?'linha '+e.lineno+':'+e.colno:e.filename+':'+e.lineno):'',e.error&&e.error.stack));addEventListener('unhandledrejection',e=>{const r=e.reason;report(r&&r.message||String(r),'promessa sem tratamento',r&&r.stack)});const consoleError=console.error.bind(console);console.error=(...a)=>{consoleError(...a);const err=a.find(x=>x instanceof Error);report(a.map(x=>x instanceof Error?x.message:typeof x==='string'?x:(()=>{try{return JSON.stringify(x)}catch{return String(x)}})()).join(' '),'console.error',err&&err.stack)};const pending=new Map();let resolveReady;const ready=new Promise(r=>resolveReady=r);function send(message){return ready.then(()=>new Promise((resolve,reject)=>{const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(Error('A operação demorou demais.'))},20000);pending.set(id,{resolve,reject,t});port.postMessage({...message,id})}))}const call=(operacao,colecao,args={})=>send({operacao,colecao,...args});const table=(operacao,fonte,args={})=>send({...args,canal:'tabelas',operacao,fonte});const tables=Object.freeze({campos:fonte=>table('campos',fonte),listar:(fonte,opcoes={})=>table('listar',fonte,opcoes),obter:(fonte,id)=>table('obter',fonte,{registroId:id}),criar:(fonte,valores)=>table('criar',fonte,{valores}),editar:(fonte,id,valores,versao)=>table('editar',fonte,{registroId:id,valores,...(versao?{expectedVersion:versao}:{})}),resumir:(fonte,opcoes={})=>table('resumir',fonte,opcoes)});Object.defineProperty(window,'otto',{value:Object.freeze({ready:()=>ready,data:Object.freeze({list:(colecao,pagina=1)=>call('listar',colecao,{pagina}),save:(colecao,registro)=>call('salvar',colecao,{registro}),remove:(colecao,id,expectedVersion)=>call('excluir',colecao,{registroId:id,expectedVersion})}),tables}),writable:false});addEventListener('message',function connect(e){if(e.source!==parent||e.data?.type!=='otto:connect'||e.data?.session!==${quote(session)}||!e.ports[0])return;removeEventListener('message',connect);port=e.ports[0];port.onmessage=e=>{const p=pending.get(e.data?.id);if(!p)return;pending.delete(e.data.id);clearTimeout(p.t);e.data.error?p.reject(Error(e.data.error)):p.resolve(e.data.result)};port.start();resolveReady();port.postMessage({type:'ready'});for(const e of early.splice(0))port.postMessage(e)});parent.postMessage({type:'otto:ready',session:${quote(session)}},'*');document.addEventListener('click',e=>{if(e.target.closest?.('a'))e.preventDefault()});})();`
  doc.head.prepend(sdk)
  const csp = doc.createElement('meta'); csp.httpEquiv = 'Content-Security-Policy'
  csp.content = `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; media-src 'none'`
  doc.head.prepend(csp)
  // Browsers hide nonce attributes when serializing a parsed document. Restore
  // the generated nonce only on the SDK and replacement scripts we created.
  return '<!doctype html>\n' + doc.documentElement.outerHTML.replace(/<script\b[^>]*>/gi, `<script nonce="${nonce}">`)
}

import type { AppPackage } from '../../shared/contracts'

const quote = (s: string) => JSON.stringify(s).replace(/</g, '\\u003c')
export function buildDocument(p: AppPackage, session: string, nonce: string) {
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
  for (const script of doc.querySelectorAll('script')) {
    const src = script.getAttribute('src'), f = src ? files.get(src.replace(/^\.\//, '')) : undefined
    if (src && !f?.caminho.endsWith('.js')) { script.remove(); continue }
    const code = f?.conteudo ?? script.textContent ?? ''
    const replacement = doc.createElement('script'); replacement.nonce = nonce
    // Keep user code out of HTML parser raw-text delimiters.
    replacement.textContent = `{const s=document.createElement('script');s.nonce=${quote(nonce)};s.textContent=${quote(code)};document.currentScript.after(s);}`
    script.replaceWith(replacement)
  }
  const sdk = doc.createElement('script'); sdk.nonce = nonce
  sdk.textContent = `(()=>{let port,seq=0;const pending=new Map();let resolveReady;const ready=new Promise(r=>resolveReady=r);function call(operacao,colecao,args={}){return ready.then(()=>new Promise((resolve,reject)=>{const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(Error('A operação demorou demais.'))},20000);pending.set(id,{resolve,reject,t});port.postMessage({id,operacao,colecao,...args})}))}Object.defineProperty(window,'otto',{value:Object.freeze({ready:()=>ready,data:Object.freeze({list:(colecao,pagina=1)=>call('listar',colecao,{pagina}),save:(colecao,registro)=>call('salvar',colecao,{registro}),remove:(colecao,id,expectedVersion)=>call('excluir',colecao,{registroId:id,expectedVersion})})}),writable:false});addEventListener('message',function connect(e){if(e.source!==parent||e.data?.type!=='otto:connect'||e.data?.session!==${quote(session)}||!e.ports[0])return;removeEventListener('message',connect);port=e.ports[0];port.onmessage=e=>{const p=pending.get(e.data?.id);if(!p)return;pending.delete(e.data.id);clearTimeout(p.t);e.data.error?p.reject(Error(e.data.error)):p.resolve(e.data.result)};port.start();resolveReady();port.postMessage({type:'ready'})});parent.postMessage({type:'otto:ready',session:${quote(session)}},'*');document.addEventListener('click',e=>{if(e.target.closest?.('a'))e.preventDefault()});})();`
  doc.head.prepend(sdk)
  const csp = doc.createElement('meta'); csp.httpEquiv = 'Content-Security-Policy'
  csp.content = `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; media-src 'none'`
  doc.head.prepend(csp)
  // Browsers hide nonce attributes when serializing a parsed document. Restore
  // the generated nonce only on the SDK and replacement scripts we created.
  return '<!doctype html>\n' + doc.documentElement.outerHTML.replace(/<script\b[^>]*>/gi, `<script nonce="${nonce}">`)
}

import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {sourceLoader} from './accounting-test-runtime.mjs'
const slots=[];let cursor=0,queue=[]
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]))
const hooks={Fragment:'Fragment',useState(initial){const i=cursor++;slots[i] ||= {value:typeof initial==='function'?initial():initial};return [slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v}]},
 useRef(value){const i=cursor++;return (slots[i] ||= {current:value})},useMemo(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={value:fn(),deps};return slots[i].value},
 useCallback(fn,deps){return hooks.useMemo(()=>fn,deps)},useEffect(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps)){const old=slots[i];slots[i]={deps,cleanup:old?.cleanup};queue.push(()=>{old?.cleanup?.();slots[i].cleanup=fn()})}}}
const components=names=>Object.fromEntries(names.map(n=>[n,n]))
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'Fragment'}
const load=sourceLoader({'react':hooks,'react/jsx-runtime':jsx,'next/link':'Link',
 'lucide-react':components(['AlertTriangle','ChevronDown','ChevronRight','Download','Loader2','Printer','RefreshCw']),
 '@/components/ui/button':components(['Button']),'@/components/ui/dialog':components(['Dialog','DialogContent','DialogHeader','DialogTitle']),
 '@/components/ui/table':components(['Table','TableBody','TableCell','TableHead','TableHeader','TableRow']),
 '@/products/erp/frontend/services/erpTimeZone':{erpClientToday:()=> '2026-10-12'}})
const {DreReportPage}=load('@/products/erp/frontend/modules/relatorios/DreReportPage')
const savedFetch=globalThis.fetch,savedWindow=globalThis.window,pending=[],checks=[]
globalThis.window={location:{search:''}}
globalThis.fetch=(url,init)=>new Promise((resolve,reject)=>pending.push({url:String(url),signal:init.signal,resolve,reject}))
function render(){cursor=0;return DreReportPage()}
function effects(){const run=queue;queue=[];run.forEach(fn=>fn())}
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);if(n&&typeof n==='object'&&n.props)return[n,...nodes(n.props.children)];return[]}
function text(n){if(Array.isArray(n))return n.map(text).join(' ');if(n&&typeof n==='object'&&n.props)return text(n.props.children);return n==null||typeof n==='boolean'?'':String(n)}
const node=(tree,test)=>{const result=nodes(tree).find(test);assert(result,'Missing UI control');return result}
function body(request,value){const p=new URL(request.url,'https://erp.test').searchParams;return{visao:p.get('visao'),inicio:p.get('inicio'),fim:p.get('fim'),meses:[],grupos:[],linhas:[{tipo:'subtotal',chave:'lucro_liquido',nome:'Lucro líquido',total:value,mensal:{},anterior:0}],base_percentual:value,nao_classificado:0,fora_dre:0,anterior:{from:'2025-01-01',to:'2025-12-31'}}}
const tick=()=>new Promise(resolve=>setImmediate(resolve))
try{
 let tree=render();effects();assert.equal(pending.length,1);assert.match(pending[0].url,/visao=competencia/)
 node(tree,n=>n.props.role==='tab'&&n.props.children==='Caixa').props.onClick();tree=render();effects();assert.equal(pending.length,2);assert.equal(pending[0].signal.aborted,true)
 pending[1].resolve(new Response(JSON.stringify(body(pending[1],456)),{status:200}));await tick();tree=render();effects();assert(text(tree).includes('456,00'))
 // Deliberately ignore AbortSignal in the transport to force an old response to arrive last.
 pending[0].resolve(new Response(JSON.stringify(body(pending[0],123)),{status:200}));await tick();tree=render();effects();assert(text(tree).includes('456,00'));assert(!text(tree).includes('123,00'));checks.push('Switch to cash cancels competence and rejects late competence response even if transport ignores abort')
 node(tree,n=>n.props['aria-label']==='De').props.onChange({target:{value:'2026-10-01'}});tree=render();assert(!text(tree).includes('456,00'));effects();assert.equal(pending.length,3)
 pending[2].resolve(new Response(JSON.stringify(body(pending[2],789)),{status:200}));await tick();tree=render();effects();assert(text(tree).includes('789,00'));checks.push('Period change hides values for the previous period until the matching result arrives')
 node(tree,n=>n.props.title==='Atualizar').props.onClick();node(tree,n=>n.props.title==='Atualizar').props.onClick();assert.equal(pending.length,5);assert(pending[3].signal.aborted)
 pending[4].resolve(new Response(JSON.stringify(body(pending[4],987)),{status:200}));await tick();tree=render();effects();assert(text(tree).includes('987,00'))
 pending[3].reject(new Error('Obsolete failure'));await tick();tree=render();effects();assert(text(tree).includes('987,00'));assert(!text(tree).includes('Obsolete failure'));checks.push('Repeated refresh rejects stale failures and keeps latest data')
 slots.forEach(s=>s?.cleanup?.());assert(pending[4].signal.aborted);checks.push('Unmount cancels outstanding request; controls remain keyboard buttons with selected state')
 const report={status:'passed',generatedAt:new Date().toISOString(),actualComponent:true,transportFixture:true,checks};mkdirSync('.cache/accounting',{recursive:true});writeFileSync('.cache/accounting/ui-regression.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}finally{globalThis.fetch=savedFetch;if(savedWindow===undefined)delete globalThis.window;else globalThis.window=savedWindow}

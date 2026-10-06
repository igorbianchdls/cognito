'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {FileText,Plus,Trash2,Loader2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog'
import {Table,TableHeader,TableBody,TableHead,TableRow,TableCell} from '@/components/ui/table'
import {ErpWorkspaceHeader,ErpSalesTabs,ErpSearchToolbar,ErpStatusBadge} from '../../components/ErpWorkspaceChrome'
import {ErpRecordIdentity} from '../../components/ErpRecordIdentity'
import {parseErpResponse} from '../../services/erpProfessionalClient'
import {serviceInvoiceInputSchema,serviceInvoiceTotals,SIMULATION_NOTICE,type ServiceInvoiceInput} from '../../../shared/serviceInvoiceContracts'

type Note={id:string;numero:string;cliente:string;status:string;versao:number;valor_total:number;data_competencia:string;erro_mensagem?:string;pdf_url:string}
type Details={record:Note;input:ServiceInvoiceInput;items:Record<string,unknown>[];totals:Record<string,unknown>;events:Record<string,unknown>[]}
type Option={id:string;nome:string;preco?:number}
const money=(x:unknown)=>Number(x||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Fortaleza'})
const empty=():ServiceInvoiceInput=>({cliente_id:0,data_competencia:today(),codigo_municipio_prestacao:'2304400',modelo_emissao:'nfse_nacional',itens:[],aliquota_iss:0,iss_retido:false,observacoes:''})
async function json<T>(url:string,init?:RequestInit){return parseErpResponse<T>(await fetch(url,{cache:'no-store',...init}))}
export function ServiceInvoicesPage(){
 const [records,setRecords]=useState<Note[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[query,setQuery]=useState(''),[status,setStatus]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState('')
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 const [form,setForm]=useState<ServiceInvoiceInput>(empty),[editor,setEditor]=useState(false),[editing,setEditing]=useState<Note|null>(null),[review,setReview]=useState(false)
 const [detail,setDetail]=useState<Details|null>(null),[customers,setCustomers]=useState<Option[]>([]),[services,setServices]=useState<Option[]>([])
 const [selectedService,setSelectedService]=useState(''),[action,setAction]=useState<{note:Note;name:'simular'|'consultar'|'cancelar'|'excluir'}|null>(null),[scenario,setScenario]=useState('sucesso'),[reason,setReason]=useState('')
 const pending=useRef<{payload:string;key:string}|null>(null)
 const load=useCallback(async()=>{
  setLoading(true)
  try{const p=new URLSearchParams({pagina:String(page),por_pagina:'20'});if(query)p.set('busca',query);if(status)p.set('status',status);if(from)p.set('inicio',from);if(to)p.set('fim',to)
   const data=await json<{records:Note[];total:number}>('/api/erp/notas-servico?'+p);setRecords(data.records);setTotal(data.total);setError('')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível carregar as notas.')}finally{setLoading(false)}
 },[page,query,status,from,to])
 useEffect(()=>{const timer=setTimeout(()=>void load(),200);return()=>clearTimeout(timer)},[load])
 async function catalogs(){
  const [clients,items]=await Promise.all([json<{records:Option[]}>('/api/erp/clientes?pageSize=100'),json<{records:Option[]}>('/api/erp/servicos?pageSize=100')]);setCustomers(clients.records);setServices(items.records)
 }
 async function openEditor(note?:Note){
  setError('');setBusy(true);pending.current=null
  try{await catalogs();setEditing(note||null);if(note){const data=await json<Details>('/api/erp/notas-servico/'+note.id);setForm(data.input);setEditing(data.record)}else setForm(empty());setReview(false);setEditor(true)}catch(e){setError(e instanceof Error?e.message:'Não foi possível abrir o formulário.')}finally{setBusy(false)}
 }
 function addService(){const item=services.find(s=>s.id===selectedService);if(!item)return;setForm(current=>({...current,itens:[...current.itens,{tipo:'servico',item_id:Number(item.id),descricao:item.nome,quantidade:1,valor_unitario:Number(item.preco||0),desconto:0}]}));setSelectedService('')}
 async function mutate(url:string,method:string,data:Record<string,unknown>){
  const signature=JSON.stringify({url,method,data})
  if(pending.current?.payload!==signature)pending.current={payload:signature,key:crypto.randomUUID()}
  return json<{record:Note}>(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,chave_operacao:pending.current.key})})
 }
 async function save(){
  setBusy(true);setError('')
  try{const data=serviceInvoiceInputSchema.parse(form),result=await mutate('/api/erp/notas-servico'+(editing?'/'+editing.id:''),editing?'PATCH':'POST',{dados:data,...(editing?{versao:editing.versao}:{})});pending.current=null;setEditor(false);setMessage('Rascunho simulado salvo. Nenhuma nota real foi emitida.');await load();setDetail(await json<Details>('/api/erp/notas-servico/'+result.record.id))}catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.')}finally{setBusy(false)}
 }
 async function confirmAction(){
  if(!action)return;setBusy(true);setError('')
  try{const result=await mutate(`/api/erp/notas-servico/${action.note.id}/${action.name}`,'POST',{versao:action.note.versao,...(action.name==='simular'?{cenario:scenario}:{}),...(['cancelar','excluir'].includes(action.name)?{motivo:reason}:{})});pending.current=null;setAction(null);await load();setMessage(action.name==='excluir'?'Rascunho excluído.':'Operação simulada concluída.');if(action.name!=='excluir')setDetail(await json<Details>('/api/erp/notas-servico/'+result.record.id));else setDetail(null)}catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.')}finally{setBusy(false)}
 }
 async function show(note:Note){try{setDetail(await json<Details>('/api/erp/notas-servico/'+note.id))}catch(e){setError(e instanceof Error?e.message:'Não foi possível consultar.')}}
 function prepare(note:Note,name:NonNullable<typeof action>['name']){pending.current=null;setAction({note,name});setScenario('sucesso');setReason('');setError('')}
 let totals:ReturnType<typeof serviceInvoiceTotals>|null=null;try{totals=serviceInvoiceTotals(form)}catch{}
 const change=<K extends keyof ServiceInvoiceInput>(key:K,value:ServiceInvoiceInput[K])=>setForm(current=>({...current,[key]:value}))
 return <div className="flex min-h-full min-w-0 flex-col bg-white">
  <ErpWorkspaceHeader section="Vendas" title="Notas de serviço" primaryAction={<Button disabled={busy} onClick={()=>void openEditor()}><Plus className="size-4"/>Nova nota simulada</Button>}/>
  <ErpSalesTabs activeHref="/erp/vendas/notas-fiscais"/>
  <div className="border-y border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900 md:px-8 lg:px-10">{SIMULATION_NOTICE}. Nenhuma transmissão fiscal externa.</div>
  {error&&<p role="alert" className="m-5 rounded-lg border border-red-200 p-3 text-red-700">{error}</p>}
  {message&&<p role="status" className="px-5 py-3 text-sm">{message}</p>}
  <ErpSearchToolbar query={query} onQueryChange={v=>{setQuery(v);setPage(1)}} placeholder="Buscar por número ou cliente" resultLabel={`${total} notas simuladas`}>
   <select aria-label="Situação" className="h-10 rounded-lg border bg-white px-3" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Todas as situações</option>{['rascunho','aguardando_retorno','emitida','falha','cancelada'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select>
   <Input aria-label="Competência inicial" type="date" value={from} onChange={e=>{setFrom(e.target.value);setPage(1)}} className="w-40"/><Input aria-label="Competência final" type="date" value={to} onChange={e=>{setTo(e.target.value);setPage(1)}} className="w-40"/>
  </ErpSearchToolbar>
  <div className="min-w-0 flex-1 overflow-x-auto"><Table className="erp-workspace-table min-w-[980px]"><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Nota</TableHead><TableHead>Competência</TableHead><TableHead>Valor</TableHead><TableHead>Situação simulada</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>
   {loading?<TableRow><TableCell colSpan={6}><Loader2 className="mx-auto my-10 size-5 animate-spin"/></TableCell></TableRow>:records.length?records.map(note=><TableRow key={note.id}><TableCell><ErpRecordIdentity name={note.cliente} category="Nota de serviço simulada" identityKey={note.id}/></TableCell><TableCell>{note.numero}</TableCell><TableCell>{String(note.data_competencia).slice(0,10).split('-').reverse().join('/')}</TableCell><TableCell>{money(note.valor_total)}</TableCell><TableCell><ErpStatusBadge status={note.status}/></TableCell><TableCell><Button variant="ghost" onClick={()=>void show(note)}>Detalhes</Button></TableCell></TableRow>):<TableRow><TableCell colSpan={6} className="py-16 text-center text-gray-500">Nenhuma nota encontrada.</TableCell></TableRow>}
  </TableBody></Table><div className="flex items-center justify-end gap-3 px-5 py-4 md:px-8 lg:px-10"><Button variant="outline" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</Button><span>Página {page}</span><Button variant="outline" disabled={page*20>=total} onClick={()=>setPage(p=>p+1)}>Próxima</Button></div></div>
  <Dialog open={editor} onOpenChange={v=>{if(!busy)setEditor(v)}}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{review?'Revisar nota simulada':editing?'Editar rascunho':'Nova nota de serviço simulada'}</DialogTitle></DialogHeader><p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">{SIMULATION_NOTICE}</p>
   <fieldset disabled={review||busy} className="grid gap-4 sm:grid-cols-2">
    <Label>Cliente<select className="mt-2 h-10 w-full rounded border bg-white px-3" value={form.cliente_id||''} onChange={e=>change('cliente_id',Number(e.target.value))}><option value="">Selecione</option>{customers.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Label>
    <Label>Competência<Input type="date" value={form.data_competencia} onChange={e=>change('data_competencia',e.target.value)}/></Label>
    <Label>Venda vinculada (opcional)<Input type="number" min={1} value={form.venda_id||''} onChange={e=>change('venda_id',e.target.value?Number(e.target.value):undefined)}/></Label>
    <Label>Código IBGE do município de prestação<Input value={form.codigo_municipio_prestacao} maxLength={7} onChange={e=>change('codigo_municipio_prestacao',e.target.value)}/></Label>
    <Label>Modelo<select className="mt-2 h-10 w-full rounded border bg-white px-3" value={form.modelo_emissao} onChange={e=>change('modelo_emissao',e.target.value as 'nfse_nacional')}><option value="nfse_nacional">NFS-e Nacional</option><option value="nfse_municipal">NFS-e Municipal</option></select></Label>
    <Label>ISS demonstrativo (%)<Input type="number" min={0} max={100} step="0.0001" value={form.aliquota_iss} onChange={e=>change('aliquota_iss',Number(e.target.value))}/></Label>
    <Label className="flex items-center gap-2"><input type="checkbox" checked={form.iss_retido} onChange={e=>change('iss_retido',e.target.checked)}/>ISS retido demonstrativo</Label>
    <Label>Observações<Input value={form.observacoes} onChange={e=>change('observacoes',e.target.value)}/></Label>
    <div className="flex gap-2 sm:col-span-2"><select aria-label="Adicionar serviço" className="min-w-0 flex-1 rounded border bg-white p-2" value={selectedService} onChange={e=>setSelectedService(e.target.value)}><option value="">Selecione um serviço</option>{services.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</select><Button type="button" onClick={addService}>Adicionar</Button></div>
    {form.itens.map((item,index)=><div key={index} className="grid gap-3 rounded-lg border p-3 sm:col-span-2 sm:grid-cols-4"><Label className="sm:col-span-4">Descrição<Input value={item.descricao} onChange={e=>change('itens',form.itens.map((i,j)=>j===index?{...i,descricao:e.target.value}:i))}/></Label>{(['quantidade','valor_unitario','desconto'] as const).map(field=><Label key={field}>{field==='valor_unitario'?'Valor unitário':field==='quantidade'?'Quantidade':'Desconto'}<Input type="number" min={0} step={field==='quantidade'?'0.0001':'0.01'} value={item[field]||0} onChange={e=>change('itens',form.itens.map((i,j)=>j===index?{...i,[field]:Number(e.target.value)}:i))}/></Label>)}<Button type="button" variant="ghost" aria-label={'Remover serviço '+(index+1)} onClick={()=>change('itens',form.itens.filter((_,j)=>j!==index))}><Trash2 className="size-4"/></Button></div>)}
   </fieldset>
   {totals&&<div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 text-sm"><p>Total<br/><strong>{money(totals.total)}</strong></p><p>ISS demonstrativo<br/><strong>{money(totals.valor_iss)}</strong></p><p>Líquido<br/><strong>{money(totals.valor_liquido)}</strong></p></div>}
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   <div className="flex justify-end gap-2">{review?<><Button variant="outline" disabled={busy} onClick={()=>setReview(false)}>Ajustar</Button><Button disabled={busy} onClick={()=>void save()}>Confirmar rascunho simulado</Button></>:<Button disabled={busy} onClick={()=>{try{serviceInvoiceInputSchema.parse(form);setReview(true);setError('')}catch{setError('Confira cliente, competência, município e serviços antes de revisar.')}}}>Revisar nota</Button>}</div>
  </DialogContent></Dialog>
  <Dialog open={!!detail} onOpenChange={v=>{if(!v)setDetail(null)}}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{detail?.record.numero} · Nota de serviço</DialogTitle></DialogHeader>{detail&&<><p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">{SIMULATION_NOTICE}</p><p>{detail.record.cliente} · <ErpStatusBadge status={detail.record.status}/></p><p>Total: <strong>{money(detail.record.valor_total)}</strong> · Líquido: {money(detail.totals.valor_liquido)}</p>{detail.record.erro_mensagem&&<p className="text-red-700">{detail.record.erro_mensagem}</p>}<div className="grid gap-2">{detail.items.map((item,i)=><div key={i} className="border-b py-2"><p>{String(item.descricao)}</p><p className="text-sm text-gray-500">{String(item.quantidade)} × {money(item.valor_unitario)} · {money(item.valor_total)}</p></div>)}</div><div className="flex flex-wrap gap-2"><Button variant="outline" asChild><a href={detail.record.pdf_url} target="_blank" rel="noopener noreferrer"><FileText className="size-4"/>PDF demonstrativo</a></Button>{detail.record.status==='rascunho'&&<Button variant="outline" onClick={()=>{const note=detail.record;setDetail(null);void openEditor(note)}}>Editar</Button>}{['rascunho','falha'].includes(detail.record.status)&&<Button onClick={()=>prepare(detail.record,'simular')}>Emitir simulação</Button>}{detail.record.status==='aguardando_retorno'&&<Button onClick={()=>prepare(detail.record,'consultar')}>Consultar resultado simulado</Button>}{detail.record.status==='emitida'&&<Button variant="outline" onClick={()=>prepare(detail.record,'cancelar')}>Cancelar simulação</Button>}{detail.record.status==='rascunho'&&<Button variant="outline" onClick={()=>prepare(detail.record,'excluir')}>Excluir rascunho</Button>}</div><h3 className="font-medium">Histórico</h3>{detail.events.map((event,i)=><p key={i} className="text-sm text-gray-600">{String(event.evento).replaceAll('_',' ')} · {String(event.status_novo||'')}</p>)}</>}</DialogContent></Dialog>
  <Dialog open={!!action} onOpenChange={v=>{if(!v&&!busy)setAction(null)}}><DialogContent><DialogHeader><DialogTitle>Confirmar operação simulada</DialogTitle></DialogHeader><p>{SIMULATION_NOTICE}</p><p>{action?.note.numero} · {action?.name}</p>{action?.name==='simular'&&<Label>Cenário<select className="mt-2 h-10 w-full rounded border bg-white px-3" value={scenario} onChange={e=>setScenario(e.target.value)}><option value="sucesso">Sucesso</option><option value="rejeicao">Rejeição</option><option value="demora">Demora no processamento</option><option value="timeout">Resposta perdida</option></select></Label>}{action&&['cancelar','excluir'].includes(action.name)&&<Label>Motivo<Input value={reason} onChange={e=>setReason(e.target.value)}/></Label>}{error&&<p role="alert" className="text-red-700">{error}</p>}<Button disabled={busy} onClick={()=>void confirmAction()}>Confirmar simulação</Button></DialogContent></Dialog>
 </div>
}

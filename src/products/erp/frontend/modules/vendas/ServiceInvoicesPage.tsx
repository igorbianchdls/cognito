'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {FileText,FileCode,Plus,Trash2,Loader2,Building2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog'
import {Table,TableHeader,TableBody,TableHead,TableRow,TableCell} from '@/components/ui/table'
import {ErpWorkspaceHeader,ErpSalesTabs,ErpSearchToolbar,ErpStatusBadge} from '../../components/ErpWorkspaceChrome'
import {ErpRecordIdentity} from '../../components/ErpRecordIdentity'
import {parseErpResponse,ErpRequestError} from '../../services/erpProfessionalClient'
import {serviceInvoiceInputSchema,serviceInvoiceTotals,SIMULATION_NOTICE,type ServiceInvoiceInput} from '../../../shared/serviceInvoiceContracts'

type Note={id:string;numero:string;cliente:string;status:string;versao:number;valor_total:number;data_competencia:string;erro_mensagem?:string;pdf_url:string
 numero_dps?:string;serie_dps?:string;chave_acesso?:string|null;codigo_verificacao?:string|null;protocolo?:string|null;xml_url?:string|null
 retencoes?:{iss:number;federais:number;total:number}|null;resposta_provedor?:{erros?:FieldIssue[]}}
type FieldIssue={campo:string;mensagem:string}
// O número só identifica a nota depois de autorizada; antes disso é um código interno de rascunho.
const noteLabel=(note:{numero:string;status:string})=>['emitida','cancelada'].includes(note.status)||/^\d+$/.test(String(note.numero))?note.numero:note.status==='aguardando_retorno'?'Aguardando retorno':'Rascunho'
type Fiscal={cnpj:string;razao_social:string;nome_fantasia:string;inscricao_municipal:string;regime_tributario:string;endereco_logradouro:string;endereco_numero:string
 endereco_bairro:string;endereco_codigo_municipio:string;endereco_municipio:string;endereco_uf:string;endereco_cep:string;serie_dps:string;aliquota_iss_padrao:number|null}
const FEDERAL=[['irrf','IRRF'],['inss','INSS'],['pis','PIS'],['cofins','COFINS'],['csll','CSLL']] as const
const REASONS=[['1','1 - Erro na emissão'],['2','2 - Serviço não prestado'],['9','9 - Outros']] as const
const REGIMES=[['simples_nacional','Simples Nacional'],['simples_nacional_excesso','Simples Nacional (excesso de sublimite)'],['mei','MEI'],['lucro_presumido','Lucro presumido'],['lucro_real','Lucro real']] as const
const blankFiscal=():Fiscal=>({cnpj:'',razao_social:'',nome_fantasia:'',inscricao_municipal:'',regime_tributario:'simples_nacional',endereco_logradouro:'',endereco_numero:'',endereco_bairro:'',
 endereco_codigo_municipio:'',endereco_municipio:'',endereco_uf:'',endereco_cep:'',serie_dps:'1',aliquota_iss_padrao:null})
// Erros por campo do leiaute (vêm do servidor como details.campos).
const issuesOf=(error:unknown)=>error instanceof ErpRequestError&&Array.isArray((error.details as {campos?:unknown})?.campos)?(error.details as {campos:FieldIssue[]}).campos:[]
type Details={record:Note;input:ServiceInvoiceInput;items:Record<string,unknown>[];totals:Record<string,unknown>;events:Record<string,unknown>[]}
type Option={id:string;nome:string;preco?:number}
const money=(x:unknown)=>Number(x||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Fortaleza'})
const empty=(fiscal?:Fiscal|null):ServiceInvoiceInput=>({cliente_id:0,data_competencia:today(),codigo_municipio_prestacao:fiscal?.endereco_codigo_municipio||'',modelo_emissao:'nfse_nacional',itens:[],
 aliquota_iss:Number(fiscal?.aliquota_iss_padrao||0),iss_retido:false,retencoes_federais:{},observacoes:''})
async function json<T>(url:string,init?:RequestInit){return parseErpResponse<T>(await fetch(url,{cache:'no-store',...init}))}
export function ServiceInvoicesPage(){
 const [records,setRecords]=useState<Note[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[query,setQuery]=useState(''),[status,setStatus]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState('')
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 const [form,setForm]=useState<ServiceInvoiceInput>(empty),[editor,setEditor]=useState(false),[editing,setEditing]=useState<Note|null>(null),[review,setReview]=useState(false)
 const [detail,setDetail]=useState<Details|null>(null),[customers,setCustomers]=useState<Option[]>([]),[services,setServices]=useState<Option[]>([])
 const [selectedService,setSelectedService]=useState(''),[action,setAction]=useState<{note:Note;name:'simular'|'consultar'|'cancelar'|'excluir'}|null>(null),[scenario,setScenario]=useState('sucesso'),[reason,setReason]=useState('')
 const [codeReason,setCodeReason]=useState('1'),[issues,setIssues]=useState<FieldIssue[]>([]),[fiscal,setFiscal]=useState<Fiscal|null>(null),[fiscalForm,setFiscalForm]=useState<Fiscal|null>(null)
 const pending=useRef<{payload:string;key:string}|null>(null)
 const fail=(e:unknown,fallback:string)=>{setError(e instanceof Error?e.message:fallback);setIssues(issuesOf(e))}
 const loadFiscal=useCallback(async()=>{const data=await json<{record:Fiscal|null}>('/api/erp/notas-servico/configuracao');setFiscal(data.record);return data.record},[])
 useEffect(()=>{void loadFiscal().catch(()=>undefined)},[loadFiscal])
 async function saveFiscal(){
  if(!fiscalForm)return;setBusy(true);setError('');setIssues([])
  try{const data=await json<{record:Fiscal}>('/api/erp/notas-servico/configuracao',{method:'PUT',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({...fiscalForm,aliquota_iss_padrao:fiscalForm.aliquota_iss_padrao?Number(fiscalForm.aliquota_iss_padrao):null})})
   setFiscal(data.record);setFiscalForm(null);setMessage('Dados fiscais salvos. Eles entram como prestador no DPS das próximas notas.')}catch(e){fail(e,'Não foi possível salvar os dados fiscais.')}finally{setBusy(false)}
 }
 const load=useCallback(async()=>{
  setLoading(true)
  try{const p=new URLSearchParams({pagina:String(page),por_pagina:'20'});if(query)p.set('busca',query);if(status)p.set('status',status);if(from)p.set('inicio',from);if(to)p.set('fim',to)
   const data=await json<{records:Note[];total:number}>('/api/erp/notas-servico?'+p);setRecords(data.records);setTotal(data.total);setError('')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível carregar as notas.')}finally{setLoading(false)}
 },[page,query,status,from,to])
 useEffect(()=>{const timer=setTimeout(()=>void load(),200);return()=>clearTimeout(timer)},[load])
 // O QR do PDF abre a nota específica; a API mantém o isolamento da empresa selecionada.
 useEffect(()=>{
  const id=new URLSearchParams(window.location.search).get('nota_id');if(!id||!/^[1-9]\d*$/.test(id))return
  let active=true
  void json<Details>('/api/erp/notas-servico/'+id).then(data=>{if(active)setDetail(data)}).catch(()=>{if(active)setError('Não foi possível abrir a nota. Confira se a empresa correta está selecionada e se você tem acesso.')})
  return()=>{active=false}
 },[])
 async function catalogs(){
  const [clients,items]=await Promise.all([json<{records:Option[]}>('/api/erp/clientes?pageSize=100'),json<{records:Option[]}>('/api/erp/servicos?pageSize=100')]);setCustomers(clients.records);setServices(items.records)
 }
 async function openEditor(note?:Note){
  setError('');setBusy(true);pending.current=null
  try{await catalogs();const config=fiscal||await loadFiscal().catch(()=>null);setEditing(note||null);if(note){const data=await json<Details>('/api/erp/notas-servico/'+note.id);setForm({...data.input,retencoes_federais:data.input.retencoes_federais||{}});setEditing(data.record)}else setForm(empty(config));setReview(false);setIssues([]);setEditor(true)}catch(e){fail(e,'Não foi possível abrir o formulário.')}finally{setBusy(false)}
 }
 function addService(){const item=services.find(s=>s.id===selectedService);if(!item)return;setForm(current=>({...current,itens:[...current.itens,{tipo:'servico',item_id:Number(item.id),descricao:item.nome,quantidade:1,valor_unitario:Number(item.preco||0),desconto:0}]}));setSelectedService('')}
 async function mutate(url:string,method:string,data:Record<string,unknown>){
  const signature=JSON.stringify({url,method,data})
  if(pending.current?.payload!==signature)pending.current={payload:signature,key:crypto.randomUUID()}
  return json<{record:Note}>(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,chave_operacao:pending.current.key})})
 }
 async function save(){
  setBusy(true);setError('')
  try{const data=serviceInvoiceInputSchema.parse(form),result=await mutate('/api/erp/notas-servico'+(editing?'/'+editing.id:''),editing?'PATCH':'POST',{dados:data,...(editing?{versao:editing.versao}:{})});pending.current=null;setEditor(false);setMessage('Rascunho simulado salvo. Nenhuma nota real foi emitida.');await load();setDetail(await json<Details>('/api/erp/notas-servico/'+result.record.id))}catch(e){fail(e,'Não foi possível salvar.')}finally{setBusy(false)}
 }
 async function confirmAction(){
  if(!action)return;setBusy(true);setError('');setIssues([])
  try{const result=await mutate(`/api/erp/notas-servico/${action.note.id}/${action.name}`,'POST',{versao:action.note.versao,...(action.name==='simular'?{cenario:scenario}:{}),...(['cancelar','excluir'].includes(action.name)?{motivo:reason}:{}),...(action.name==='cancelar'?{codigo_motivo:codeReason}:{})})
   pending.current=null;setAction(null);await load()
   const status=(result.record as Note).status
   setMessage(action.name==='excluir'?'Rascunho excluído.':status==='emitida'?'NFS-e autorizada na simulação (homologação). Nenhuma nota real foi emitida.':status==='falha'?'O provedor simulado rejeitou o DPS. Veja os erros por campo nos detalhes.':status==='aguardando_retorno'?'DPS recebido pelo provedor simulado; consulte o resultado em seguida.':'Operação simulada concluída.')
   if(action.name!=='excluir')setDetail(await json<Details>('/api/erp/notas-servico/'+result.record.id));else setDetail(null)}catch(e){fail(e,'Não foi possível concluir.')}finally{setBusy(false)}
 }
 async function show(note:Note){try{setDetail(await json<Details>('/api/erp/notas-servico/'+note.id))}catch(e){setError(e instanceof Error?e.message:'Não foi possível consultar.')}}
 function prepare(note:Note,name:NonNullable<typeof action>['name']){pending.current=null;setAction({note,name});setScenario('sucesso');setReason('');setCodeReason('1');setError('');setIssues([])}
 const federal=(key:typeof FEDERAL[number][0],value:string)=>setForm(current=>({...current,retencoes_federais:{...(current.retencoes_federais||{}),[key]:value?Number(value):undefined}}))
 const fiscalField=(key:keyof Fiscal,label:string,props:Record<string,unknown>={})=><Label key={key}>{label}<Input value={String(fiscalForm?.[key]??'')} onChange={e=>setFiscalForm(current=>current&&{...current,[key]:e.target.value})} {...props}/></Label>
 const issueList=issues.length?<ul role="alert" className="list-disc rounded-lg border border-red-200 bg-red-50 py-2 pl-8 pr-3 text-sm text-red-800">{issues.map((issue,i)=><li key={i}><code className="text-xs">{issue.campo}</code> — {issue.mensagem}</li>)}</ul>:null
 let totals:ReturnType<typeof serviceInvoiceTotals>|null=null;try{totals=serviceInvoiceTotals(form)}catch{}
 const change=<K extends keyof ServiceInvoiceInput>(key:K,value:ServiceInvoiceInput[K])=>setForm(current=>({...current,[key]:value}))
 return <div className="flex min-h-full min-w-0 flex-col bg-white">
  <ErpWorkspaceHeader section="Vendas" title="Notas de serviço" primaryAction={<div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={()=>{setIssues([]);setError('');setFiscalForm(fiscal?{...blankFiscal(),...Object.fromEntries(Object.entries(fiscal).map(([k,v])=>[k,v??'']))} as Fiscal:blankFiscal())}}><Building2 className="size-4"/>Dados fiscais</Button><Button disabled={busy} onClick={()=>void openEditor()}><Plus className="size-4"/>Nova nota simulada</Button></div>}/>
  <ErpSalesTabs activeHref="/erp/vendas/notas-fiscais"/>
  <div className="border-y border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900 md:px-8 lg:px-10">{SIMULATION_NOTICE}. O DPS é montado e validado como no padrão NFS-e Nacional (ambiente de homologação), sem transmissão externa.</div>
  {!fiscal&&!loading&&<p className="mx-5 mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">Cadastre os dados fiscais da empresa (CNPJ, inscrição municipal, regime e município) para emitir: eles entram como prestador no DPS.</p>}
  {!editor&&!action&&!fiscalForm&&issueList}
  {error&&<p role="alert" className="m-5 rounded-lg border border-red-200 p-3 text-red-700">{error}</p>}
  {message&&<p role="status" className="px-5 py-3 text-sm">{message}</p>}
  <ErpSearchToolbar query={query} onQueryChange={v=>{setQuery(v);setPage(1)}} placeholder="Buscar por número ou cliente" resultLabel={`${total} notas simuladas`}>
   <select aria-label="Situação" className="h-10 rounded-lg border bg-white px-3" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Todas as situações</option>{['rascunho','aguardando_retorno','emitida','falha','cancelada'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select>
   <Input aria-label="Competência inicial" type="date" value={from} onChange={e=>{setFrom(e.target.value);setPage(1)}} className="w-40"/><Input aria-label="Competência final" type="date" value={to} onChange={e=>{setTo(e.target.value);setPage(1)}} className="w-40"/>
  </ErpSearchToolbar>
  <div className="min-w-0 flex-1 overflow-x-auto"><Table className="erp-workspace-table min-w-[980px]"><TableHeader><TableRow><TableHead className="erp-table-identity-heading">Cliente</TableHead><TableHead>Nota</TableHead><TableHead>Competência</TableHead><TableHead>Valor</TableHead><TableHead>Situação simulada</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>
   {loading?<TableRow><TableCell colSpan={6}><Loader2 className="mx-auto my-10 size-5 animate-spin"/></TableCell></TableRow>:records.length?records.map(note=><TableRow key={note.id}><TableCell><ErpRecordIdentity name={note.cliente} category="Nota de serviço simulada" identityKey={note.id}/></TableCell><TableCell>{noteLabel(note)}</TableCell><TableCell>{String(note.data_competencia).slice(0,10).split('-').reverse().join('/')}</TableCell><TableCell>{money(note.valor_total)}</TableCell><TableCell><ErpStatusBadge status={note.status}/></TableCell><TableCell><Button variant="ghost" onClick={()=>void show(note)}>Detalhes</Button></TableCell></TableRow>):<TableRow><TableCell colSpan={6} className="py-16 text-center text-gray-500">Nenhuma nota encontrada.</TableCell></TableRow>}
  </TableBody></Table><div className="flex items-center justify-end gap-3 px-5 py-4 md:px-8 lg:px-10"><Button variant="outline" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</Button><span>Página {page}</span><Button variant="outline" disabled={page*20>=total} onClick={()=>setPage(p=>p+1)}>Próxima</Button></div></div>
  <Dialog open={editor} onOpenChange={v=>{if(!busy)setEditor(v)}}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{review?'Revisar nota simulada':editing?'Editar rascunho':'Nova nota de serviço simulada'}</DialogTitle></DialogHeader><p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">{SIMULATION_NOTICE}</p>
   <fieldset disabled={review||busy} className="grid gap-4 sm:grid-cols-2">
    <Label>Cliente<select className="mt-2 h-10 w-full rounded border bg-white px-3" value={form.cliente_id||''} onChange={e=>change('cliente_id',Number(e.target.value))}><option value="">Selecione</option>{customers.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Label>
    <Label>Competência<Input type="date" value={form.data_competencia} onChange={e=>change('data_competencia',e.target.value)}/></Label>
    <Label>Venda vinculada (opcional)<Input type="number" min={1} value={form.venda_id||''} onChange={e=>change('venda_id',e.target.value?Number(e.target.value):undefined)}/></Label>
    <Label>Código IBGE do município de prestação<Input value={form.codigo_municipio_prestacao} maxLength={7} onChange={e=>change('codigo_municipio_prestacao',e.target.value)}/></Label>
    <Label>Modelo<select className="mt-2 h-10 w-full rounded border bg-white px-3" value={form.modelo_emissao} onChange={e=>change('modelo_emissao',e.target.value as 'nfse_nacional')}><option value="nfse_nacional">NFS-e Nacional</option><option value="nfse_municipal">NFS-e Municipal</option></select></Label>
    <Label>Alíquota de ISS (%)<Input type="number" min={2} max={5} step="0.01" value={form.aliquota_iss} onChange={e=>change('aliquota_iss',Number(e.target.value))}/></Label>
    <Label className="flex items-center gap-2"><input type="checkbox" checked={form.iss_retido} onChange={e=>change('iss_retido',e.target.checked)}/>ISS retido pelo tomador (só pessoa jurídica)</Label>
    <fieldset className="grid gap-3 rounded-lg border p-3 sm:col-span-2 sm:grid-cols-5"><legend className="px-1 text-sm font-medium">Retenções federais (% sobre os serviços, tomador PJ)</legend>
     {FEDERAL.map(([key,label])=><Label key={key}>{label}<Input type="number" min={0} max={30} step="0.01" value={form.retencoes_federais?.[key]??''} onChange={e=>federal(key,e.target.value)}/></Label>)}</fieldset>
    <Label>Observações<Input value={form.observacoes} onChange={e=>change('observacoes',e.target.value)}/></Label>
    <div className="flex gap-2 sm:col-span-2"><select aria-label="Adicionar serviço" className="min-w-0 flex-1 rounded border bg-white p-2" value={selectedService} onChange={e=>setSelectedService(e.target.value)}><option value="">Selecione um serviço</option>{services.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</select><Button type="button" onClick={addService}>Adicionar</Button></div>
    {form.itens.map((item,index)=><div key={index} className="grid gap-3 rounded-lg border p-3 sm:col-span-2 sm:grid-cols-4"><Label className="sm:col-span-4">Descrição<Input value={item.descricao} onChange={e=>change('itens',form.itens.map((i,j)=>j===index?{...i,descricao:e.target.value}:i))}/></Label>{(['quantidade','valor_unitario','desconto'] as const).map(field=><Label key={field}>{field==='valor_unitario'?'Valor unitário':field==='quantidade'?'Quantidade':'Desconto'}<Input type="number" min={0} step={field==='quantidade'?'0.0001':'0.01'} value={item[field]||0} onChange={e=>change('itens',form.itens.map((i,j)=>j===index?{...i,[field]:Number(e.target.value)}:i))}/></Label>)}<Button type="button" variant="ghost" aria-label={'Remover serviço '+(index+1)} onClick={()=>change('itens',form.itens.filter((_,j)=>j!==index))}><Trash2 className="size-4"/></Button></div>)}
   </fieldset>
   {totals&&<div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-4"><p>Total<br/><strong>{money(totals.total)}</strong></p><p>ISS<br/><strong>{money(totals.valor_iss)}</strong></p><p>Retido (ISS + federais)<br/><strong>{money(totals.retencao_iss+totals.retencao_federal)}</strong></p><p>Líquido a receber<br/><strong>{money(totals.valor_liquido)}</strong></p></div>}
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{issueList}
   <div className="flex justify-end gap-2">{review?<><Button variant="outline" disabled={busy} onClick={()=>setReview(false)}>Ajustar</Button><Button disabled={busy} onClick={()=>void save()}>Confirmar rascunho simulado</Button></>:<Button disabled={busy} onClick={()=>{try{serviceInvoiceInputSchema.parse(form);setReview(true);setError('')}catch{setError('Confira cliente, competência, município e serviços antes de revisar.')}}}>Revisar nota</Button>}</div>
  </DialogContent></Dialog>
  <Dialog open={!!detail} onOpenChange={v=>{if(!v)setDetail(null)}}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{detail?noteLabel(detail.record):''} · Nota de serviço</DialogTitle></DialogHeader>{detail&&<><p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">{SIMULATION_NOTICE}</p><p>{detail.record.cliente} · <ErpStatusBadge status={detail.record.status}/></p><p>Total: <strong>{money(detail.record.valor_total)}</strong> · Líquido: {money(detail.totals.valor_liquido)}{detail.record.retencoes?.total?<> · Retido: {money(detail.record.retencoes.total)}</>:null}</p>
   {detail.record.numero_dps&&/^\d+$/.test(detail.record.numero_dps)&&<dl className="grid gap-x-4 gap-y-1 rounded-lg border p-3 text-sm sm:grid-cols-2"><dt className="text-gray-500">DPS</dt><dd>{detail.record.numero_dps} · série {detail.record.serie_dps}</dd>
    {detail.record.protocolo&&<><dt className="text-gray-500">Protocolo</dt><dd>{detail.record.protocolo}</dd></>}
    {detail.record.chave_acesso&&<><dt className="text-gray-500">Chave de acesso</dt><dd className="break-all font-mono text-xs">{detail.record.chave_acesso}</dd><dt className="text-gray-500">Código de verificação</dt><dd>{detail.record.codigo_verificacao}</dd></>}</dl>}
   {detail.record.erro_mensagem&&<p className="text-red-700">{detail.record.erro_mensagem}</p>}
   {detail.record.resposta_provedor?.erros?.length?<ul className="list-disc rounded-lg border border-red-200 bg-red-50 py-2 pl-8 pr-3 text-sm text-red-800">{detail.record.resposta_provedor.erros.map((issue,i)=><li key={i}><code className="text-xs">{issue.campo}</code> — {issue.mensagem}</li>)}</ul>:null}<div className="grid gap-2">{detail.items.map((item,i)=><div key={i} className="border-b py-2"><p>{String(item.descricao)}</p><p className="text-sm text-gray-500">{String(item.quantidade)} × {money(item.valor_unitario)} · {money(item.valor_total)}</p></div>)}</div><div className="flex flex-wrap gap-2"><Button variant="outline" asChild><a href={detail.record.pdf_url} target="_blank" rel="noopener noreferrer"><FileText className="size-4"/>DANFSe (simulação)</a></Button>{detail.record.xml_url&&<Button variant="outline" asChild><a href={detail.record.xml_url} download><FileCode className="size-4"/>XML</a></Button>}{detail.record.status==='rascunho'&&<Button variant="outline" onClick={()=>{const note=detail.record;setDetail(null);void openEditor(note)}}>Editar</Button>}{['rascunho','falha'].includes(detail.record.status)&&<Button onClick={()=>prepare(detail.record,'simular')}>Emitir simulação</Button>}{detail.record.status==='aguardando_retorno'&&<Button onClick={()=>prepare(detail.record,'consultar')}>Consultar resultado simulado</Button>}{detail.record.status==='emitida'&&<Button variant="outline" onClick={()=>prepare(detail.record,'cancelar')}>Cancelar simulação</Button>}{detail.record.status==='rascunho'&&<Button variant="outline" onClick={()=>prepare(detail.record,'excluir')}>Excluir rascunho</Button>}</div><h3 className="font-medium">Histórico</h3>{detail.events.map((event,i)=><p key={i} className="text-sm text-gray-600">{String(event.evento).replaceAll('_',' ')} · {String(event.status_novo||'')}</p>)}</>}</DialogContent></Dialog>
  <Dialog open={!!action} onOpenChange={v=>{if(!v&&!busy)setAction(null)}}><DialogContent><DialogHeader><DialogTitle>Confirmar operação simulada</DialogTitle></DialogHeader><p>{SIMULATION_NOTICE}</p><p>{action?noteLabel(action.note):''} · {action?.name}</p>{action?.name==='simular'&&<Label>Cenário<select className="mt-2 h-10 w-full rounded border bg-white px-3" value={scenario} onChange={e=>setScenario(e.target.value)}><option value="sucesso">Sucesso</option><option value="rejeicao">Rejeição</option><option value="demora">Demora no processamento</option><option value="timeout">Resposta perdida</option></select></Label>}{action?.name==='cancelar'&&<Label>Código do motivo<select className="mt-2 h-10 w-full rounded border bg-white px-3" value={codeReason} onChange={e=>setCodeReason(e.target.value)}>{REASONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Label>}
   {action&&['cancelar','excluir'].includes(action.name)&&<Label>{action.name==='cancelar'?'Justificativa (mínimo 15 caracteres)':'Motivo'}<Input value={reason} onChange={e=>setReason(e.target.value)}/></Label>}
   {action?.name==='cancelar'&&<p className="text-sm text-gray-600">Se houve retenção abatida no contas a receber da venda, o abatimento é estornado.</p>}
   {error&&<p role="alert" className="text-red-700">{error}</p>}{issueList}<Button disabled={busy} onClick={()=>void confirmAction()}>Confirmar simulação</Button></DialogContent></Dialog>
  <Dialog open={!!fiscalForm} onOpenChange={v=>{if(!v&&!busy)setFiscalForm(null)}}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Dados fiscais da empresa</DialogTitle></DialogHeader>
   <p className="text-sm text-gray-600">Prestador do DPS (NFS-e Nacional). Na simulação as notas ficam sempre no ambiente de homologação.</p>
   {fiscalForm&&<fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
    {fiscalField('cnpj','CNPJ')}{fiscalField('razao_social','Razão social')}{fiscalField('nome_fantasia','Nome fantasia')}{fiscalField('inscricao_municipal','Inscrição municipal')}
    <Label>Regime tributário<select className="mt-2 h-10 w-full rounded border bg-white px-3" value={fiscalForm.regime_tributario} onChange={e=>setFiscalForm({...fiscalForm,regime_tributario:e.target.value})}>{REGIMES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Label>
    {fiscalField('endereco_codigo_municipio','Código IBGE do município',{maxLength:7})}{fiscalField('endereco_municipio','Município')}{fiscalField('endereco_uf','UF',{maxLength:2})}
    {fiscalField('endereco_logradouro','Logradouro')}{fiscalField('endereco_numero','Número')}{fiscalField('endereco_bairro','Bairro')}{fiscalField('endereco_cep','CEP')}
    {fiscalField('serie_dps','Série do DPS',{maxLength:5})}{fiscalField('aliquota_iss_padrao','Alíquota de ISS padrão (%)',{type:'number',min:2,max:5,step:'0.01'})}
   </fieldset>}
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={()=>setFiscalForm(null)}>Fechar</Button><Button disabled={busy} onClick={()=>void saveFiscal()}>Salvar dados fiscais</Button></div>
  </DialogContent></Dialog>
 </div>
}

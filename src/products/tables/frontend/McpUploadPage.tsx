'use client'
import { useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, Paperclip, UploadCloud, X } from 'lucide-react'
import { useResource,useTablesApi,send } from './client'
import './tables.css'
type UploadInfo={status:string;nome?:string;tamanho?:number;upload_url?:string}
const bytes=(n:number)=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1).replace('.',',')+' KB':(n/1048576).toFixed(1).replace('.',',')+' MB'
export default function McpUploadPage(){
 const {operationId}=useParams<{operationId:string}>(),auth=useAuth(),api=useTablesApi()
 const [revision,setRevision]=useState(0),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[dragging,setDragging]=useState(false)
 const input=useRef<HTMLInputElement>(null)
 const info=useResource<UploadInfo>(api,auth.isSignedIn?'/mcp-envios/'+operationId:null,revision)
 function pick(next:File|null){setFile(next);setError('');if(input.current&&!next)input.current.value=''}
 function drop(e:DragEvent){e.preventDefault();setDragging(false);if(!busy)pick(e.dataTransfer.files?.[0]||null)}
 async function upload(){if(!file)return;setBusy(true);setError('');try{
  const prepared=await api<UploadInfo>('/mcp-envios/'+operationId,send('POST',{acao:'iniciar',nome:file.name,mime_type:file.type||'application/octet-stream',tamanho:file.size}))
  if(prepared.status!=='confirmado'){if(!prepared.upload_url)throw Error('Não foi possível preparar o envio.');const sent=await fetch(prepared.upload_url,{method:'PUT',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});try{await api('/mcp-envios/'+operationId,send('POST',{acao:'confirmar'}))}catch(e){if(!sent.ok)throw Error('O envio não pôde ser confirmado. Você pode tentar novamente.');throw e}}
  setRevision(v=>v+1)
 }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar.')}finally{setBusy(false)}}
 const status=(icon:ReactNode,text:ReactNode,tone='')=><div className={'tables-upload-status '+tone} role={tone==='erro'?'alert':'status'}>{icon}<div>{text}</div></div>
 const body=!auth.isLoaded?status(<LoaderCircle size={18} className="tables-spin"/>,'Carregando…')
  :!auth.isSignedIn?status(<AlertCircle size={18}/>,<>Entre na conta usada no chat para continuar. <Link href="/sign-in">Entrar</Link></>)
  :info.loading?status(<LoaderCircle size={18} className="tables-spin"/>,'Conferindo o envio…')
  :info.error?status(<AlertCircle size={18}/>,<>{info.error} Confira se a empresa selecionada é a mesma do chat.</>,'erro')
  :info.data?.status==='confirmado'?<>{status(<CheckCircle2 size={18}/>,<><strong>Arquivo enviado e confirmado.</strong> Você pode voltar ao chat.</>,'ok')}<Link className="tables-upload-link" href="/tables">Abrir Tables</Link></>
  :<>
   <p className="tables-upload-lead">Selecione o arquivo para anexar ao registro autorizado no chat.{info.data?.nome&&<> Arquivo informado: <strong>{info.data.nome}</strong>.</>}</p>
   <input ref={input} id="tables-upload-file" type="file" hidden disabled={busy} onChange={e=>pick(e.target.files?.[0]||null)}/>
   {file?<div className="tables-upload-file">
     <FileText size={20}/>
     <div><strong>{file.name}</strong><span>{bytes(file.size)}</span></div>
     <button type="button" className="tables-icon-button" aria-label="Remover arquivo" disabled={busy} onClick={()=>pick(null)}><X size={16}/></button>
    </div>
   :<label htmlFor="tables-upload-file" className={'tables-upload-drop'+(dragging?' ativo':'')} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={drop}>
     <UploadCloud size={28}/>
     <strong>Clique para escolher um arquivo</strong>
     <span>ou arraste e solte aqui</span>
    </label>}
   {error&&status(<AlertCircle size={18}/>,error,'erro')}
   <div className="tables-upload-actions">
    {!file&&<span>Escolha um arquivo para continuar.</span>}
    {file&&!busy&&<button type="button" onClick={()=>input.current?.click()}>Trocar arquivo</button>}
    <button type="button" className="tables-button-primary" disabled={busy||!file} onClick={()=>void upload()}>{busy?<><LoaderCircle size={15} className="tables-spin"/>Enviando…</>:'Enviar arquivo'}</button>
   </div>
  </>
 return <main className="tables-app tables-upload"><section className="tables-upload-card"><p className="tables-upload-eyebrow"><Paperclip size={13}/>Tables · Anexos</p><h1>Enviar arquivo</h1>{body}</section></main>
}

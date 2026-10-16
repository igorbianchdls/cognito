'use client'
import { useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'
import Link from 'next/link'
import { useResource,useTablesApi,send } from './client'
type UploadInfo={status:string;nome?:string;tamanho?:number;upload_url?:string}
export default function McpUploadPage(){
 const {operationId}=useParams<{operationId:string}>(),auth=useAuth(),api=useTablesApi()
 const [revision,setRevision]=useState(0),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const info=useResource<UploadInfo>(api,auth.isSignedIn?'/mcp-envios/'+operationId:null,revision)
 async function upload(){if(!file)return;setBusy(true);setError('');try{
  const prepared=await api<UploadInfo>('/mcp-envios/'+operationId,send('POST',{acao:'iniciar',nome:file.name,mime_type:file.type||'application/octet-stream',tamanho:file.size}))
  if(prepared.status!=='confirmado'){if(!prepared.upload_url)throw Error('Não foi possível preparar o envio.');const sent=await fetch(prepared.upload_url,{method:'PUT',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});try{await api('/mcp-envios/'+operationId,send('POST',{acao:'confirmar'}))}catch(e){if(!sent.ok)throw Error('O envio não pôde ser confirmado. Você pode tentar novamente.');throw e}}
  setRevision(v=>v+1)
 }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar.')}finally{setBusy(false)}}
 return <main style={{maxWidth:560,margin:'60px auto',padding:24,fontFamily:'system-ui'}}><p>Tables · Anexos</p><h1>Enviar arquivo</h1>{!auth.isLoaded?<p role="status">Carregando…</p>:!auth.isSignedIn?<p>Entre na conta usada no chat para continuar. <Link href="/sign-in">Entrar</Link></p>:info.loading?<p role="status">Conferindo o envio…</p>:info.error?<p role="alert">{info.error} Confira se a empresa selecionada é a mesma do chat.</p>:info.data?.status==='confirmado'?<><p role="status">Arquivo enviado e confirmado. Você pode voltar ao chat.</p><Link href="/tables">Abrir Tables</Link></>:<><p>Selecione o arquivo para anexar ao registro autorizado no chat.</p>{info.data?.nome&&<p>Arquivo informado: {info.data.nome}</p>}<label>Arquivo<input type="file" disabled={busy} onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:'block',margin:'16px 0'}} /></label><button disabled={busy||!file} onClick={()=>void upload()} style={{padding:'10px 18px',border:0,borderRadius:8,background:'#7154db',color:'white'}}>{busy?'Enviando…':'Enviar arquivo'}</button>{error&&<p role="alert">{error}</p>}</>}</main>
}

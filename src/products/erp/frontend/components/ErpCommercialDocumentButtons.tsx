'use client'
import {useState} from 'react'
import {FileDown,Archive,Loader2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {parseErpResponse} from '../services/erpProfessionalClient'
export function ErpCommercialDocumentButtons({kind,id,version,canArchive}:{kind:'orcamento'|'ordem_servico';id:string;version:number;canArchive:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[revision,setRevision]=useState<number|null>(null);
 const path=`/api/erp/documentos-comerciais/${kind}/${id}/pdf`;
 async function archive(){setBusy(true);setError(null);try{const result=await parseErpResponse<{revision:number}>(await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedVersion:version})}));setRevision(result.revision)}catch(e){setError(e instanceof Error?e.message:'Não foi possível arquivar o PDF.')}finally{setBusy(false)}}
 return <div className="flex flex-wrap items-center gap-2">
  <Button variant="outline" size="sm" asChild><a href={path} target="_blank" rel="noopener noreferrer"><FileDown className="size-4"/>Abrir PDF</a></Button>
  {canArchive?<Button variant="outline" size="sm" onClick={()=>void archive()} disabled={busy}>{busy?<Loader2 className="size-4 animate-spin"/>:<Archive className="size-4"/>}Arquivar revisão</Button>:null}
  {revision?<a className="text-sm underline" href={`${path}?revisao=${revision}`} target="_blank" rel="noopener noreferrer">Baixar revisão {revision}</a>:null}
  {error?<p className="w-full text-xs text-red-700" role="alert">{error}</p>:null}
 </div>
}

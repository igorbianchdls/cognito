// Local UI fixture: real components, fictitious HTTP responses. Never touches the ERP database.
import { build } from 'esbuild'
import { createServer } from 'node:http'
const stubs = {
 'next/link': 'import {createElement} from "react";export default function Link({href,children,...props}){return createElement("a",{href,...props},children)}',
 'next/navigation': 'export const useRouter=()=>({push(){},refresh(){}});export const usePathname=()=>"/erp/financeiro/conciliacao-bancaria";export const useSearchParams=()=>new URLSearchParams();',
 '@/products/erp/frontend/hooks/useErpAccess': 'export const useErpAccess=()=>({can:()=>true,loading:false});',
 '@/components/ui/sidebar': 'export const SidebarTrigger=()=>null;',
 '@/products/erp/frontend/components/ErpHistoryPanel': 'export const ErpHistoryPanel=()=>null;export const ErpBillingHistory=()=>null;',
 '@/products/erp/frontend/components/ErpContractDetails': 'export const ErpContractDetails=()=>null;',
 '@/products/erp/frontend/components/ErpStockCountEditor': 'export const ErpStockCountEditor=()=>null;',
}
const result=await build({stdin:{contents:`
 import React,{useState} from 'react';import{createRoot}from'react-dom/client';
 import{ErpConfirmationProvider}from'@/products/erp/frontend/components/ErpConfirmation';
 import{FinancialRecurrences}from'@/products/erp/frontend/modules/financeiro/FinancialRecurrences';
 import{FinancialInstallmentActions}from'@/products/erp/frontend/modules/financeiro/FinancialInstallmentActions';
 import{BankReconciliationPage}from'@/products/erp/frontend/modules/financeiro/BankReconciliationPage';
 function Test(){const[tab,setTab]=useState('recorrencias');return <ErpConfirmationProvider><h1>Validação local — dados fictícios</h1><nav>{['recorrencias','credito','conciliacao'].map(t=><button key={t} onClick={()=>setTab(t)}>{t}</button>)}</nav><main>{tab==='recorrencias'?<FinancialRecurrences onChanged={async()=>{}}/>:tab==='credito'?<FinancialInstallmentActions record={{parcela_id:'1',conta_id:'1',entidade_id:'1',saldo:100,valor:100,valor_pago:0,credito:0,renegociado:0}} side="receber" entityName="QA Cliente" accounts={[{id:'21',nome:'QA Banco',padrao:true}]} methods={[]} canManage canReverse onChanged={async()=>{}}/>:<BankReconciliationPage/>}</main></ErpConfirmationProvider>}
 createRoot(document.getElementById('root')).render(<Test/>);
 `,loader:'tsx',resolveDir:process.cwd()},bundle:true,platform:'browser',format:'iife',jsx:'automatic',write:false,define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'qa-stubs',setup(b){b.onResolve({filter:/.*/},a=>a.path in stubs?{path:a.path,namespace:'qa'}:undefined);b.onLoad({filter:/.*/,namespace:'qa'},a=>({contents:stubs[a.path],loader:'tsx',resolveDir:process.cwd()}))}}]})
let recurrence={id:'1',tipo:'pagar',descricao:'QA Aluguel recorrente',frequencia:'mes',intervalo:1,termino_tipo:'ocorrencias',quantidade_ocorrencias:12,termino_em:null,proxima_competencia:'2027-02-28',ativa:true,pausada_em:null,encerrada_em:null,atualizado_em:'2026-10-14T12:00:00Z'}
let status='pendente',applied=false
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),p=url.pathname
 if(p==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(result.outputFiles[0].text);return}
 if(!p.startsWith('/api/')){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html><head><style>body{font:15px Arial;padding:24px;color:#172018;background:#f6f8f5}button,input,select{font:inherit;padding:9px;margin:5px}button{cursor:pointer;border:1px solid #abb4a8;border-radius:6px;background:white}article,section{padding:12px;margin:10px;border:1px solid #ddd}table{border-collapse:collapse;width:100%}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}[role=dialog]{position:fixed;inset:5vh 5vw;overflow:auto;padding:24px;background:white;border:2px solid #d8e1d4;border-radius:14px;box-shadow:0 0 0 100vw #0005;z-index:50}label{display:block;margin:10px}svg{width:16px;height:16px}nav{margin-bottom:24px}a{color:#325930}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>');return}
 let body={};if(req.method!=='GET'){let text='';for await(const chunk of req)text+=chunk;try{body=JSON.parse(text)}catch{}}
 let data={records:[]}
 if(p==='/api/erp/recorrencias'){
  if(req.method==='PATCH'){
   if(body.action==='editar')Object.assign(recurrence,body.values)
   if(body.action==='pausar'){recurrence.ativa=false;recurrence.pausada_em=new Date().toISOString()}
   if(body.action==='retomar'){recurrence.ativa=true;recurrence.pausada_em=null}
   if(body.action==='encerrar'){recurrence.ativa=false;recurrence.encerrada_em=new Date().toISOString();recurrence.proxima_competencia=null}
   recurrence.atualizado_em=new Date().toISOString()
  }
  data={financial:[recurrence],hasMore:false}
 }else if(p.includes('/financeiro/composicao'))data={valor:100,principal_pago:0,credito:applied?20:0,renegociado:0,saldo:applied?80:100,dinheiro_movimentado:0}
 else if(p.endsWith('/financeiro/aplicar-adiantamento')){applied=true;data={id:'1'}}
 else if(p.endsWith('/financeiro/adiantamentos'))data={records:[{id:'1',saldo:applied?0:20,valor:20,data_movimento:'2026-10-14T00:00:00.000Z',conta_financeira_id:'21',metodo_pagamento_id:'21'}]}
 else if(p.endsWith('/financeiro/aplicacoes'))data={records:applied?[{id:'1',valor:20,data_aplicacao:'2026-10-14T00:00:00.000Z',motivo:'QA aplicação',revertida:false}]:[]}
 else if(p.endsWith('/operacoes/catalogos'))data={records:url.searchParams.get('source')==='payments'?(url.searchParams.get('transactionId')==='1'?[{value:'1',label:'#1 Recebimento · 14/10/2026 · R$ 20,00 · QA Venda · QA Cliente · QA Banco'}]:[]):[{value:'21',label:'QA Banco'}]}
 else if(p.endsWith('/operacoes/conciliacao-bancaria'))data={records:[{id:'1',data:'2026-10-14',conta:'QA Banco',descricao:'QA Extrato visual',tipo:'credito',valor:20,status}],total:1}
 else if(p.endsWith('/operacoes/conciliar-transacao')){status='conciliada';data={id:'1'}}
 else if(p.endsWith('/desfazer')){status='pendente';data={id:'1'}}
 else if(p.endsWith('/ignorar')){status='ignorada';data={id:'1'}}
 else if(p.endsWith('/conciliacao/sugestoes'))data={records:[]}
 else if(p.endsWith('/conciliacao/concluidas'))data={records:status==='conciliada'?[{transacao_bancaria_id:'1',pagamento_id:'1',origem_conciliacao:'manual',valor_conciliado:20,conciliado_em:'2026-10-14',data:'2026-10-14',descricao:'QA Extrato visual'}]:[]}
 else if(p.endsWith('/conciliacao/lancamentos')&&url.searchParams.has('saldo_conta'))data={conta:'QA Banco',saldo_extrato:20,saldo_erp:20,diferenca:0,pendentes:status==='pendente'?1:0,conciliado_ate:status==='pendente'?null:'2026-10-14',data_extrato:'2026-10-14'}
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))
})
server.listen(3197,'127.0.0.1',()=>console.log('QA UI http://127.0.0.1:3197'))

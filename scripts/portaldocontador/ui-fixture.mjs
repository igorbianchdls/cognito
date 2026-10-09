import { build } from "esbuild";
import { createServer } from "node:http";
import { resolve } from "node:path";

// Teste de navegador com os componentes reais, sem credenciais ou chamadas externas.
// Abra http://127.0.0.1:4319. Encerrar o processo remove o ambiente de teste.
const entry = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {PortalPage} from './src/products/portaldocontador/frontend/PortalPage';
import {PortalInvitations} from './src/products/portaldocontador/frontend/PortalInvitations';
import './src/products/portaldocontador/frontend/portal.css';
import {RouterContext} from 'next/navigation';
let permitted=true, hold=false, pending=[], requests=[], notify=()=>{};
const companies=[1,2].map(id=>({id,name:'Empresa '+id,organizationId:'fixture_'+id,timeZone:'America/Fortaleza',capabilities:['erp.financeiro.visualizar']}));
window.fetch=async (url,init={})=>{
 const path=new URL(url,location.origin), body=init.body?JSON.parse(init.body):null;
 requests.push({url:path.pathname+path.search,method:init.method||'GET',body});notify();
 const respond=()=>Response.json(path.pathname==='/api/contador/empresas'?{companies:permitted?companies:[]}:
 path.pathname==='/api/contador/convites'?{invitations:[{id:body?.companyId||Number(path.searchParams.get('companyId')),email:'contador'+(body?.companyId||path.searchParams.get('companyId'))+'@example.invalid',status:'pending',expiresAt:null,syncPending:false}]}:
 {table:{columns:[{key:'descricao',label:'Descrição'},{key:'valor',label:'Valor',format:'currency'}],records:[{id:1,descricao:'Dados da empresa '+path.pathname.split('/')[4],valor:100}],total:1,page:1,pageSize:20}});
 if(hold&&(path.pathname.includes('/empresas/1/')||(path.pathname==='/api/contador/convites'&&init.method==='POST')))return new Promise(r=>pending.push(()=>r(respond())));
 return respond();
};
function App(){
 const [url,setUrl]=useState('/contador/empresas/1/financeiro'),[mode,setMode]=useState('consultas'),[,tick]=useState(0);
 notify=()=>queueMicrotask(()=>tick(x=>x+1));
 const id=Number(url.split('/')[3]), route={url,navigate:setUrl};
 return <RouterContext.Provider value={route}>
  <header style={{padding:16,background:'#fff7db'}}><strong>Teste local — dados fictícios</strong>
   <div style={{display:'flex',gap:12,marginTop:12,flexWrap:'wrap'}}>
    <button onClick={()=>setMode('consultas')}>Tela de consultas</button>
    <button onClick={()=>setMode('convites')}>Tela de convites</button>
    <button onClick={()=>{hold=true}}>Preparar resposta atrasada</button>
    <button onClick={()=>{hold=false;pending.splice(0).forEach(done=>done())}}>Liberar respostas atrasadas</button>
    <button onClick={()=>{permitted=false}}>Remover acesso fictício</button>
    <button onClick={()=>setUrl('/contador/empresas/'+(id===1?2:1)+'/financeiro')}>Trocar empresa fictícia</button>
   </div>
  </header>
  {mode==='consultas'?<PortalPage companyId={id} section='financeiro'/>:<section style={{padding:24}}><h1>Convites da empresa {id}</h1><PortalInvitations companyId={id}/></section>}
  <details><summary>Requisições simuladas</summary><pre>{JSON.stringify(requests,null,2)}</pre></details>
 </RouterContext.Provider>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
`;
const stubs = {
  "next/link": `import React from 'react';import {useRouter} from 'next/navigation';export default function Link({href,children,...props}){const router=useRouter();return <a href={href} {...props} onClick={e=>{e.preventDefault();router.push(href)}}>{children}</a>}`,
  "next/navigation": `import {createContext,useContext} from 'react';export const RouterContext=createContext(null);export function useRouter(){const c=useContext(RouterContext);return {push:c.navigate,replace:c.navigate}};export function useSearchParams(){return new URLSearchParams(useContext(RouterContext).url.split('?')[1]||'')}`,
  "@clerk/nextjs": `export function UserButton(){return null}`,
  "@/products/erp/frontend/modules/dashboards/visao-geral/OverviewDashboardView": `export function OverviewDashboardView(){return null}`,
};
const result = await build({
  stdin: { contents: entry, resolveDir: process.cwd(), loader: "tsx" },
  bundle: true,
  write: false,
  outfile: "fixture.js",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "fixture-adapters",
      setup(b) {
        b.onResolve(
          {
            filter:
              /^(next\/|@clerk\/nextjs$|@\/products\/erp\/frontend\/modules\/dashboards\/visao-geral\/OverviewDashboardView$)/,
          },
          (a) =>
            stubs[a.path] ? { path: a.path, namespace: "fixture" } : undefined,
        );
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
          contents: stubs[a.path],
          loader: "tsx",
          resolveDir: process.cwd(),
        }));
        b.onResolve({ filter: /^@\// }, (a) => ({
          path: resolve("src", a.path.slice(2)) + ".ts",
        }));
      },
    },
  ],
});
const js = result.outputFiles.find((f) => f.path.endsWith(".js")).contents;
const css =
  result.outputFiles.find((f) => f.path.endsWith(".css"))?.contents || "";
createServer((req, res) => {
  const isJs = req.url === "/fixture.js",
    isCss = req.url === "/fixture.css";
  res.setHeader(
    "Content-Type",
    isJs
      ? "application/javascript"
      : isCss
        ? "text/css"
        : "text/html; charset=utf-8",
  );
  res.setHeader("Cache-Control", "no-store");
  res.end(
    isJs
      ? js
      : isCss
        ? css
        : '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Regressão local do portal</title><link rel="stylesheet" href="/fixture.css"><style>body{margin:0;font-family:Arial,sans-serif}button{cursor:pointer}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>',
  );
}).listen(4319, "127.0.0.1", () =>
  console.log(
    "Portal fixture: http://127.0.0.1:4319 — no external requests or emails",
  ),
);

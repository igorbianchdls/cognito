import {SIMULATION_NOTICE} from '../../shared/serviceInvoiceContracts'

type InvoicePdf={numero:unknown;status:unknown;data_competencia:unknown;emitente_snapshot:unknown;destinatario_snapshot:unknown;
 valor_total:unknown;items:Record<string,unknown>[];totals:Record<string,unknown>;observacoes?:unknown
 numero_dps?:unknown;serie_dps?:unknown;chave_acesso?:unknown;codigo_verificacao?:unknown;autorizada_em?:unknown;dps?:Record<string,unknown>|null}
type Row=Record<string,unknown>
// Larguras AFM (1/1000 em) de Helvetica e Helvetica-Bold para os caracteres 32..126, usadas para centralizar, alinhar e quebrar texto.
const HELV=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,
 667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,
 556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584]
const BOLD=[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,
 722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,
 556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]
const STATUS:Record<string,string>={rascunho:'Rascunho',emitida:'Autorizada',cancelada:'Cancelada',rejeitada:'Rejeitada',aguardando_retorno:'Aguardando retorno'}
const LEFT=28,RIGHT=567,WIDTH=RIGHT-LEFT,BOTTOM=40,INK='0.12 0.14 0.17',MUTED='0.4 0.43 0.47',PANEL='0.92 0.94 0.96',BRAND='0.09 0.35 0.36'
const money=(x:unknown)=>Number(x||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const currency=(x:unknown)=>Number(x||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const escape=(x:unknown)=>String(x??'').replace(/[\u0000-\u001f]/g,' ').replace(/[–—]/g,'-').replace(/[^\x20-\xFF]/g,'?').replace(/([\\()])/g,'\\$1')
const measure=(text:string,size:number,bold=false)=>[...text.normalize('NFD').replace(/[̀-ͯ]/g,'')]
 .reduce((sum,c)=>{const code=c.charCodeAt(0);return sum+(code>=32&&code<=126?(bold?BOLD:HELV)[code-32]:556)},0)*size/1000
function fit(text:string,size:number,width:number,bold=false){
 if(measure(text,size,bold)<=width)return text
 let cut=text;while(cut&&measure(cut+'...',size,bold)>width)cut=cut.slice(0,-1);return cut.trimEnd()+'...'
}
function wrap(text:string,size:number,width:number,bold=false){
 const lines:string[]=[]
 for(const paragraph of text.split(/\r?\n/)){let current=''
  for(const word of paragraph.split(/\s+/).filter(Boolean)){let part=word
   while(measure(part,size,bold)>width){let n=part.length;while(n>1&&measure(part.slice(0,n),size,bold)>width)n--;if(current){lines.push(current);current=''}lines.push(part.slice(0,n));part=part.slice(n)}
   const next=current?current+' '+part:part
   if(current&&measure(next,size,bold)>width){lines.push(current);current=part}else current=next
  }lines.push(current)}
 return lines
}
function documentNumber(value:unknown){
 const digits=String(value||'').replace(/\D/g,'')
 if(digits.length===14)return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5')
 if(digits.length===11)return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/,'$1.$2.$3-$4')
 return String(value||'')||'Não informado'
}
const date=(value:unknown)=>{const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return match?`${match[3]}/${match[2]}/${match[1]}`:String(value||'-')}
function dateTime(value:unknown){
 if(!value)return '-'
 const parsed=value instanceof Date?value:new Date(String(value))
 return Number.isNaN(parsed.getTime())?String(value):parsed.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}).replace(',','')
}
/** Small, deterministic PDF writer for the controlled demonstration layout; no fiscal signatures. */
export function renderServiceInvoicePdf(data:InvoicePdf):Buffer{
 const issuer=(data.emitente_snapshot||{}) as Row,customer=(data.destinatario_snapshot||{}) as Row
 // Leiaute em quadros inspirado no DANFSe: cabeçalho, prestador, tomador, discriminação, valores e outras informações.
 const inf=((data.dps||{}) as {infDPS?:Row}).infDPS||{},serv=(inf.serv||{}) as Record<string,Row>
 const authorized=Boolean(data.chave_acesso),cancelled=data.status==='cancelada',status=STATUS[String(data.status)]||String(data.status||'-')
 const number=authorized?String(data.numero):'NÃO AUTORIZADA',verification=String(data.codigo_verificacao||'-')
 const pages:string[][]=[];let ops:string[]=[],y=0
 const n=(v:number)=>v.toFixed(2)
 const text=(x:number,yy:number,value:string,size=8,bold=false,color=INK)=>{ops.push(`BT /${bold?'F2':'F1'} ${size} Tf ${color} rg ${n(x)} ${n(yy)} Td (${escape(value)}) Tj ET`)}
 const center=(x:number,width:number,yy:number,value:string,size=8,bold=false,color=INK)=>{const v=fit(value,size,width-8,bold);text(x+(width-measure(v,size,bold))/2,yy,v,size,bold,color)}
 const right=(x:number,yy:number,value:string,size=8,bold=false,color=INK)=>text(x-measure(value,size,bold),yy,value,size,bold,color)
 const rect=(x:number,yy:number,w:number,h:number,fill?:string)=>{if(fill)ops.push(`${fill} rg ${n(x)} ${n(yy)} ${n(w)} ${n(h)} re f`);ops.push(`0.6 w 0.25 0.27 0.3 RG ${n(x)} ${n(yy)} ${n(w)} ${n(h)} re S`)}
 const line=(x1:number,y1:number,x2:number,y2:number)=>{ops.push(`0.6 w 0.25 0.27 0.3 RG ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`)}
 const field=(x:number,yy:number,label:string,value:string,width:number)=>{const offset=measure(label,8)+4;text(x,yy,label,8);text(x+offset,yy,fit(value,8.5,width-offset,true),8.5,true)}
 const section=(title:string)=>{rect(LEFT,y-16,WIDTH,16,PANEL);center(LEFT,WIDTH,y-11.5,title,10,true);y-=16}
 const newPage=()=>{ops=[];pages.push(ops);text(LEFT,826,`* ${SIMULATION_NOTICE}. Dados gerados pelo Cognito ERP para demonstração; nenhuma autorização fiscal foi solicitada.`,7,false,'0.62 0.16 0.12');y=816}
 const continuationHeader=()=>{rect(LEFT,y-30,WIDTH,30);text(36,y-19,'DANFSe - DOCUMENTO AUXILIAR DA NFS-e (continuação)',10,true)
  right(RIGHT-6,y-12,'Número da Nota: '+number,8,true);right(RIGHT-6,y-24,'Código de Verificação: '+verification,8);y-=30}
 newPage()
 // Cabeçalho: brasão estilizado, identificação do município e quadro com número, emissão e verificação.
 {const top=y,h=84,column=RIGHT-140;rect(LEFT,top-h,WIDTH,h);line(column,top,column,top-h)
  rect(36,top-76,62,68,BRAND);center(36,62,top-40,'NFS-e',14,true,'1 1 1');center(36,62,top-54,'Nacional',7,false,'1 1 1')
  const city=String(issuer.municipio||'').trim()
  center(104,column-104,top-24,city?'PREFEITURA DO MUNICÍPIO DE '+city.toUpperCase():'NFS-e - PADRÃO NACIONAL',13,true)
  center(104,column-104,top-44,'DOCUMENTO AUXILIAR DA NFS-e - DANFSe',9.5,true,MUTED)
  center(104,column-104,top-66,'NOTA FISCAL DE SERVIÇO ELETRÔNICA - NFS-e',11,true)
  ;[['Número da Nota',number],['Data e Hora da Emissão',dateTime(data.autorizada_em)],['Código de Verificação',verification]].forEach(([label,value],i)=>{
   const cell=top-i*28;if(i)line(column,cell,RIGHT,cell);text(column+4,cell-9,label,7,false,MUTED);center(column,140,cell-23,value,i===0&&authorized?11:9.5,true)})
  y-=h}
 {const cells:[string,string,number][]=[['Chave de Acesso',authorized?String(data.chave_acesso):'Disponível após a autorização',236],
   ['DPS / Série',`${/^\d+$/.test(String(data.numero_dps||''))?data.numero_dps:'-'} / ${data.serie_dps||'-'}`,95],['Competência',date(data.data_competencia),95],['Situação',status,113]]
  rect(LEFT,y-28,WIDTH,28);let x=LEFT
  for(const [i,[label,value,width]] of cells.entries()){if(i)line(x,y,x,y-28);text(x+4,y-9,label,7,false,MUTED)
   if(i)center(x,width,y-22,value,9,true,i===3&&cancelled?'0.75 0.1 0.1':INK);else text(x+4,y-22,fit(value,8,width-8,true),8,true);x+=width}
  y-=28}
 section('PRESTADOR DE SERVIÇOS')
 {const h=50,name=String(issuer.razao_social||issuer.nome||'Empresa')
  const initials=name.split(/\s+/).filter(word=>word.length>2&&/^[A-Za-zÀ-ÿ]/.test(word)).slice(0,3).map(word=>word[0]).join('').toUpperCase()||'NF'
  rect(LEFT,y-h,WIDTH,h);rect(36,y-44,52,38,BRAND);center(36,52,y-30,initials,14,true,'1 1 1')
  field(96,y-14,'CPF/CNPJ:',documentNumber(issuer.cnpj),300);field(400,y-14,'Inscrição Municipal:',String(issuer.inscricao_municipal||'-'),163)
  field(96,y-28,'Nome/Razão Social:',name,467)
  field(96,y-42,'Município:',String(issuer.municipio||'-'),300);field(400,y-42,'UF:',String(issuer.uf||'-'),163)
  y-=h}
 section('TOMADOR DE SERVIÇOS')
 {const cep=String(customer.cep||'').replace(/\D/g,'').replace(/^(\d{5})(\d{3})$/,'$1-$2')
  const street=[customer.logradouro,customer.numero].filter(Boolean).join(', ')
  const address=typeof customer.endereco==='string'?customer.endereco:[[street,customer.complemento].filter(Boolean).join(' - '),customer.bairro,cep&&'CEP: '+cep].filter(Boolean).join(' - ')
  const rows=address?4:3,h=rows*14+8;rect(LEFT,y-h,WIDTH,h);let row=y-14
  field(36,row,'Nome/Razão Social:',String(customer.nome||'Cliente'),527);row-=14
  field(36,row,'CPF/CNPJ:',documentNumber(customer.documento),320);field(360,row,'Inscrição Municipal:',String(customer.inscricao_municipal||'----'),203);row-=14
  if(address){field(36,row,'Endereço:',address,527);row-=14}
  field(36,row,'Município:',String(customer.municipio||customer.cidade||'-'),210);field(250,row,'UF:',String(customer.uf||'-'),66);field(320,row,'E-mail:',String(customer.email||'-'),243)
  y-=h}
 // Rodapé de valores: calculado antes para que a discriminação ocupe o espaço restante, como no modelo.
 const notes=[`- ${SIMULATION_NOTICE}: nenhuma autorização fiscal foi solicitada e os valores tributários são demonstrativos.`]
 if(!authorized)notes.push(`- NFS-e ainda não autorizada (situação: ${status}). Número, chave de acesso e código de verificação são preenchidos após a autorização simulada.`)
 if(cancelled)notes.push('- Esta NFS-e foi cancelada na simulação e não produz efeitos.')
 const other=notes.flatMap(note=>wrap(note,8,WIDTH-16))
 if(data.observacoes){const observation=wrap('- Observações: '+String(data.observacoes),8,WIDTH-16);other.push(...observation.slice(0,10));if(observation.length>10)other[other.length-1]+=' ...'}
 const footer=22+30+28+28+16+other.length*10+10
 const lines:{text:string;size:number;color?:string}[]=[]
 for(const [index,item] of data.items.entries()){
  for(const part of wrap(`${index+1}. ${String(item.descricao||'Serviço')}`,8.5,WIDTH-16))lines.push({text:part,size:8.5})
  lines.push({text:`Quantidade: ${Number(item.quantidade||0).toLocaleString('pt-BR')}   |   Valor unitário: ${currency(item.valor_unitario)}   |   Desconto: ${currency(item.desconto)}   |   Total: ${currency(item.valor_total)}`,size:7.5,color:MUTED})
  lines.push({text:'',size:1})
 }
 if(!lines.length)lines.push({text:'Nenhum serviço informado.',size:8.5})
 section('DISCRIMINAÇÃO DOS SERVIÇOS');let discTop=y;y-=6
 for(const entry of lines){const height=entry.size+3
  if(y-height<BOTTOM){rect(LEFT,BOTTOM,WIDTH,discTop-BOTTOM);newPage();continuationHeader();section('DISCRIMINAÇÃO DOS SERVIÇOS (continuação)');discTop=y;y-=6}
  if(entry.text)text(36,y-entry.size,entry.text,entry.size,false,entry.color);y-=height}
 if(y-6>=BOTTOM+footer){rect(LEFT,BOTTOM+footer,WIDTH,discTop-BOTTOM-footer);y=BOTTOM+footer}
 else{rect(LEFT,y-6,WIDTH,discTop-y+6);newPage();continuationHeader()}
 rect(LEFT,y-22,WIDTH,22,PANEL);center(LEFT,WIDTH,y-15.5,'VALOR TOTAL DA NOTA = '+currency(data.valor_total),12,true);y-=22
 {const code=serv.cServ||{},municipal=data.items[0]?.codigo_servico_municipal
  const service=[code.cTribNac?`${code.cTribNac} - Código de tributação nacional`:municipal?`${municipal} - Código de serviço municipal`:'Não informado',
   code.cTribMun?`Municipal ${code.cTribMun}`:'',code.cNBS?`NBS ${code.cNBS}`:''].filter(Boolean).join('   |   ')
  rect(LEFT,y-30,WIDTH,30);line(400,y,400,y-30)
  text(32,y-9,'Código do Serviço',7,false,MUTED);text(32,y-23,fit(service,8.5,360,true),8.5,true)
  text(404,y-9,'Local da Prestação',7,false,MUTED);text(404,y-23,fit(String(serv.locPrest?.cLocPrestacao||issuer.municipio||'-'),8.5,159,true),8.5,true);y-=30}
 const taxRow=(cells:[string,string][])=>{const width=WIDTH/cells.length;rect(LEFT,y-28,WIDTH,28)
  cells.forEach(([label,value],i)=>{const x=LEFT+i*width;if(i)line(x,y,x,y-28);center(x,width,y-9,label,6.8,false,MUTED);right(x+width-5,y-22,value,9,true)});y-=28}
 const deductions=data.items.reduce((sum,item)=>sum+Number(item.desconto||0),0),rate=Number(data.items[0]?.aliquota_iss||0)
 taxRow([['Valor Total das Deduções (R$)',money(deductions)],['Base de Cálculo (R$)',money(data.totals.base_iss??data.valor_total)],
  ['Alíquota (%)',rate.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%'],['Valor do ISS (R$)',money(data.totals.valor_iss)],['ISS Retido (R$)',money(data.totals.retencao_iss)]])
 taxRow([...['irrf','inss','pis','cofins','csll'].map(key=>[`${key.toUpperCase()} (R$)`,money(data.totals['retencao_'+key])] as [string,string]),
  ['Valor Líquido (R$)',money(data.totals.valor_liquido)]])
 section('OUTRAS INFORMAÇÕES')
 {const h=other.length*10+10;rect(LEFT,y-h,WIDTH,h);other.forEach((entry,i)=>text(36,y-12-i*10,entry,8));y-=h}
 // Marca d'água diagonal semitransparente (como o "EXEMPLO" do modelo) e numeração de páginas.
 const mark=cancelled?'CANCELADA':'SIMULAÇÃO',length=measure(mark,90,true),cos=0.574,sin=0.819
 for(const [index,page] of pages.entries()){ops=page
  ops.push(`q /GS1 gs BT /F2 90 Tf ${cancelled?'0.8 0.1 0.1':'0.3 0.32 0.35'} rg ${cos} ${-sin} ${sin} ${cos} ${n(297.5-length/2*cos-sin*32)} ${n(421+length/2*sin-cos*32)} Tm (${escape(mark)}) Tj ET Q`)
  text(LEFT,24,`${SIMULATION_NOTICE} - Cognito ERP`,7,false,MUTED);right(RIGHT,24,`Página ${index+1} de ${pages.length}`,7,false,MUTED)
 }
 const objects:string[]=['','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>']
 const kids:number[]=[]
 for(const stream of pages.map(page=>page.join('\n'))){const pageId=objects.length+1,contentId=pageId+1;kids.push(pageId)
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /ExtGState << /GS1 << /Type /ExtGState /ca 0.12 /CA 0.12 >> >> >> /Contents ${contentId} 0 R >>`)
  objects.push(`<< /Length ${Buffer.byteLength(stream,'latin1')} >>\nstream\n${stream}\nendstream`)
 }
 objects[0]='<< /Type /Catalog /Pages 2 0 R >>';objects[1]=`<< /Type /Pages /Kids [${kids.map(id=>id+' 0 R').join(' ')}] /Count ${kids.length} >>`
 let pdf='%PDF-1.4\n%âãÏÓ\n';const offsets=[0]
 objects.forEach((body,i)=>{offsets.push(Buffer.byteLength(pdf,'latin1'));pdf+=`${i+1} 0 obj\n${body}\nendobj\n`})
 const start=Buffer.byteLength(pdf,'latin1')
 pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`
 return Buffer.from(pdf,'latin1')
}

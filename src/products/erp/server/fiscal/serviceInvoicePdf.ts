import {create as createQr} from 'qrcode'
import {SIMULATION_NOTICE} from '../../shared/serviceInvoiceContracts'

export const SERVICE_INVOICE_PDF_LAYOUT_VERSION=2
type Row=Record<string,unknown>
export type InvoicePdf={numero:unknown;status:unknown;data_competencia:unknown;emitente_snapshot:unknown;destinatario_snapshot:unknown;
 valor_total:unknown;items:Row[];totals:Row;observacoes?:unknown;numero_dps?:unknown;serie_dps?:unknown;chave_acesso?:unknown;
 codigo_verificacao?:unknown;autorizada_em?:unknown;emitida_em?:unknown;codigo_municipio_prestacao?:unknown;dps?:Row|null;consulta_url?:string}
const HELV=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,
 667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,
 556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584]
const BOLD=[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,
 722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,
 556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]
const STATUS:Record<string,string>={rascunho:'Rascunho',emitida:'Autorizada (simulação)',cancelada:'Cancelada (simulação)',falha:'Falha / rejeição',rejeitada:'Rejeitada',aguardando_retorno:'Aguardando retorno'}
const REGIME:Record<string,string>={simples_nacional:'Simples Nacional',simples_nacional_excesso:'Simples Nacional (excesso)',mei:'MEI',lucro_real:'Lucro real',lucro_presumido:'Lucro presumido'}
const L=18,R=577,W=R-L,BOTTOM=38,INK='0.12 0.12 0.12',MUTED='0.38 0.38 0.38',PANEL='0.95 0.95 0.95',RED='0.65 0.12 0.1'
const value=(v:unknown)=>v===undefined||v===null||String(v).trim()===''?'Não informado':String(v)
const money=(v:unknown)=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const currency=(v:unknown)=>'R$ '+money(v)
const escape=(v:string)=>v.replace(/[\u0000-\u001f]/g,' ').replace(/[–—]/g,'-').replace(/[^\x20-\xFF]/g,'?').replace(/([\\()])/g,'\\$1')
const measure=(s:string,size:number,bold=false)=>[...s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')].reduce((sum,c)=>sum+(c.charCodeAt(0)>=32&&c.charCodeAt(0)<=126?(bold?BOLD:HELV)[c.charCodeAt(0)-32]:556),0)*size/1000
function fit(s:string,size:number,width:number,bold=false){if(measure(s,size,bold)<=width)return s;let cut=s;while(cut&&measure(cut+'...',size,bold)>width)cut=cut.slice(0,-1);return cut.trimEnd()+'...'}
function wrap(s:string,size:number,width:number){const lines:string[]=[];for(const paragraph of s.split(/\r?\n/)){let current='';for(const word of paragraph.split(/\s+/).filter(Boolean)){let part=word;while(measure(part,size)>width){let n=part.length;while(n>1&&measure(part.slice(0,n),size)>width)n--;if(current){lines.push(current);current=''}lines.push(part.slice(0,n));part=part.slice(n)}const next=current?current+' '+part:part;if(current&&measure(next,size)>width){lines.push(current);current=part}else current=next}lines.push(current)}return lines}
function document(v:unknown){const raw=value(v),digits=raw.replace(/\D/g,'');if(digits&&/^0+$/.test(digits))return'Não informado';return /^\d{14}$/.test(raw)?digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5'):/^\d{11}$/.test(raw)?digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/,'$1.$2.$3-$4'):raw}
function date(v:unknown){const s=v instanceof Date?v.toISOString():String(v||''),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:value(v)}
function dateTime(v:unknown){if(!v)return'Não informada';const d=new Date(String(v));return Number.isNaN(d.getTime())?value(v):d.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}).replace(',','')}
function address(p:Row){if(typeof p.endereco==='string')return p.endereco;const street=[p.logradouro,p.numero].filter(Boolean).join(', ');return [street,p.complemento,p.bairro].filter(Boolean).join(' - ')||'Não informado'}

/** Apresentação demonstrativa inspirada no DANFSe nacional; não representa autorização fiscal. */
export function renderServiceInvoicePdf(data:InvoicePdf):Buffer{
 const issuer=(data.emitente_snapshot||{}) as Row,customer=(data.destinatario_snapshot||{}) as Row,inf=((data.dps||{}) as {infDPS?:Row}).infDPS||{}
 const serv=(inf.serv||{}) as Record<string,Row>,code=serv.cServ||{},cancelled=data.status==='cancelada'
 const authorized=Boolean(data.chave_acesso),legacyAuthorized=data.status==='emitida'||cancelled
 const number=authorized||legacyAuthorized?value(data.numero):'Não autorizada',status=STATUS[String(data.status)]||value(data.status)
 const pages:string[][]=[];let ops:string[]=[],y=0;const n=(v:number)=>v.toFixed(3)
 const text=(x:number,yy:number,s:string,size=8,bold=false,color=INK)=>ops.push(`BT /${bold?'F2':'F1'} ${size} Tf ${color} rg ${n(x)} ${n(yy)} Td (${escape(s)}) Tj ET`)
 const line=(x1:number,y1:number,x2:number,y2:number)=>ops.push(`0.5 w 0.35 0.35 0.35 RG ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`)
 const rect=(x:number,yy:number,w:number,h:number,fill?:string)=>{if(fill)ops.push(`${fill} rg ${n(x)} ${n(yy)} ${n(w)} ${n(h)} re f`);ops.push(`0.5 w 0.35 0.35 0.35 RG ${n(x)} ${n(yy)} ${n(w)} ${n(h)} re S`)}
 const centered=(x:number,width:number,yy:number,s:string,size=8,bold=false,color=INK)=>{const v=fit(s,size,width-10,bold);text(x+(width-measure(v,size,bold))/2,yy,v,size,bold,color)}
 const right=(x:number,yy:number,s:string,size=8,bold=false)=>text(x-measure(s,size,bold),yy,s,size,bold)
 const section=(s:string)=>{rect(L,y-17,W,17,PANEL);text(L+6,y-12,s,7.6,true);y-=17}
 const fields=(cells:[string,string,number?][],height=25)=>{rect(L,y-height,W,height);let x=L;for(const [label,v,fraction] of cells){const w=W*(fraction??1/cells.length);if(x>L)line(x,y,x,y-height);text(x+5,y-8,fit(label,6.1,w-10,true),6.1,true,MUTED);text(x+5,y-height+6,fit(v,7.6,w-10),7.6);x+=w}y-=height}
 const page=(continuation=false)=>{ops=[];pages.push(ops);y=822;if(continuation){rect(L,y-35,W,35,PANEL);text(L+6,y-13,'DANFSe demonstrativo - continuação dos serviços',9,true);text(L+6,y-27,`${SIMULATION_NOTICE} | Nota ${number}`,7,false,RED);y-=35}}
 const ensure=(height:number)=>{if(y-height<BOTTOM)page(true)}
 page()
 rect(L,y-56,W,56,PANEL);line(L+113,y,L+113,y-56);line(R-150,y,R-150,y-56)
 text(L+9,y-25,'NFS-e',21,true);text(L+9,y-43,'SIMULADOR ERP',6.5,true,MUTED)
 centered(L+113,W-263,y-18,'DANFSe - NFS-e',13,true);centered(L+113,W-263,y-33,'Documento Auxiliar da NFS-e',8)
 centered(L+113,W-263,y-47,'SIMULAÇÃO - SEM VALIDADE FISCAL',8.1,true,RED)
 text(R-143,y-16,fit([issuer.municipio,issuer.uf].filter(Boolean).join(' / ')||'Município não informado',8,138),8)
 text(R-143,y-31,'Ambiente: simulação local',7);text(R-143,y-45,'Sem transmissão fiscal externa',6.5,false,MUTED);y-=56
 // QR vetorial para o ERP autenticado, sem credencial temporária embutida no documento.
 const top=y,leftWidth=W-100,rowWidth=leftWidth/3;rect(L,y-100,W,100);line(R-100,y,R-100,y-100)
 text(L+5,y-10,'CHAVE DE ACESSO SIMULADA',6.1,true,MUTED)
 text(L+5,y-24,fit(authorized?value(data.chave_acesso):'Não disponível nesta nota simulada',8.1,leftWidth-10),8.1)
 line(L,y-33,R-100,y-33)
 const ids=[['NÚMERO DA NOTA',number],['COMPETÊNCIA',date(data.data_competencia)],['DATA / HORA DA EMISSÃO',dateTime(data.autorizada_em||data.emitida_em)],
  ['DPS / SÉRIE',`${/^\d+$/.test(String(data.numero_dps||''))?data.numero_dps:'Não atribuído'} / ${value(data.serie_dps)}`],['SITUAÇÃO',status],['CÓDIGO DE VERIFICAÇÃO',value(data.codigo_verificacao)]]
 for(const [i,[label,v]] of ids.entries()){const col=i%3,row=Math.floor(i/3),x=L+col*rowWidth,yy=top-33-row*33.5;if(col)line(x,yy,x,yy-33.5);if(row===1&&col===0)line(L,yy,R-100,yy);text(x+5,yy-10,label,6,true,MUTED);text(x+5,yy-25,fit(v,8.1,rowWidth-10),8.1,false,i===4&&cancelled?RED:INK)}
 if(data.consulta_url){const qr=createQr(data.consulta_url,{errorCorrectionLevel:'M'}).modules,padding=4,size=72,unit=size/(qr.size+padding*2),x=R-86,bottom=top-76
  ops.push(`1 1 1 rg ${n(x)} ${n(bottom)} ${size} ${size} re f`,`0 0 0 rg`)
  for(let row=0;row<qr.size;row++)for(let col=0;col<qr.size;col++)if(qr.data[row*qr.size+col])ops.push(`${n(x+(col+padding)*unit)} ${n(bottom+size-(row+padding+1)*unit)} ${n(unit+0.015)} ${n(unit+0.015)} re f`)
  centered(R-100,100,top-87,'Consultar simulação no ERP',5.9);centered(R-100,100,top-96,'Acesso com login',5.9,false,MUTED)
 }else centered(R-100,100,top-50,'Consulta pelo ERP',7)
 y-=100
 const party=(title:string,p:Row,provider=false)=>{section(title)
  fields([['CPF / CNPJ',document(provider?p.cnpj||p.documento:p.documento)],['INSCRIÇÃO MUNICIPAL',value(p.inscricao_municipal)],['TELEFONE',value(p.telefone)]])
  fields([['NOME / RAZÃO SOCIAL',value(p.razao_social||p.nome),1]])
  fields([['ENDEREÇO',address(p),1]])
  fields([['MUNICÍPIO / UF',value([p.municipio||p.cidade,p.uf].filter(Boolean).join(' / ')),0.4],['CEP',value(p.cep),0.18],['E-MAIL',value(p.email),0.42]])
  if(provider)fields([['REGIME TRIBUTÁRIO',REGIME[String(p.regime_tributario)]||value(p.regime_tributario),0.65],['CÓDIGO IBGE',value(p.codigo_municipio),0.35]])
 }
 party('PRESTADOR DE SERVIÇOS',issuer,true);party('TOMADOR DOS SERVIÇOS',customer)
 section('SERVIÇO PRESTADO')
 fields([['TRIBUTAÇÃO NACIONAL',value(code.cTribNac||data.items[0]?.codigo_tributacao_nacional)],['TRIBUTAÇÃO MUNICIPAL',value(code.cTribMun||data.items[0]?.codigo_servico_municipal)],['CÓDIGO NBS',value(code.cNBS||data.items[0]?.codigo_nbs)]])
 const place=String(serv.locPrest?.cLocPrestacao||data.codigo_municipio_prestacao||'')
 fields([['LOCAL DA PRESTAÇÃO',place&&place===String(issuer.codigo_municipio)?`${value(issuer.municipio)} / ${value(issuer.uf)} (${place})`:value(place),1]])
 const columns=[L,L+W-202,L+W-157,L+W-80,R]
 const tableHeader=()=>{ensure(35);section('DISCRIMINAÇÃO DOS SERVIÇOS');rect(L,y-18,W,18,PANEL);['DESCRIÇÃO','QTD.','UNITÁRIO (R$)','TOTAL (R$)'].forEach((label,i)=>text(columns[i]+5,y-12,label,6.1,true));y-=18}
 tableHeader()
 for(const [index,item] of data.items.entries()){
  const description=wrap(`${index+1}. ${value(item.descricao)}`,8,columns[1]-L-12)
  if(Number(item.desconto)>0)description.push('Desconto: '+currency(item.desconto))
  let offset=0
  while(offset<description.length){if(y-27<BOTTOM){page(true);tableHeader()}
   const capacity=Math.max(1,Math.floor((y-BOTTOM-12)/10)),chunk=description.slice(offset,offset+capacity),height=Math.max(27,chunk.length*10+12)
   rect(L,y-height,W,height);columns.slice(1,-1).forEach(x=>line(x,y,x,y-height));chunk.forEach((s,i)=>text(L+5,y-13-i*10,s,8))
   if(offset===0){right(columns[2]-5,y-14,Number(item.quantidade||0).toLocaleString('pt-BR'),8);right(columns[3]-5,y-14,money(item.valor_unitario),8);right(R-5,y-14,money(item.valor_total),8)}
   y-=height;offset+=chunk.length
  }
 }
 if(!data.items.length)fields([['SERVIÇOS','Não informados',1]])
 const notes=[SIMULATION_NOTICE+'. Nenhuma autorização fiscal foi solicitada.',...(cancelled?['Cancelada na simulação. Não produz efeitos fiscais.']:[]),...(!authorized?['Número, chave e verificação podem estar ausentes em notas demonstrativas antigas ou não autorizadas.']:[]),...(data.observacoes?[String(data.observacoes)]:[])]
 const noteLines=notes.flatMap(s=>wrap(s,7.5,W-12)),deductions=data.items.reduce((sum,i)=>sum+Number(i.desconto||0),0),rate=Number(data.items[0]?.aliquota_iss||0)
 ensure(17+25+17+25+17+25+32+17+Math.min(noteLines.length,4)*10+12)
 section('TRIBUTAÇÃO MUNICIPAL - ISSQN (DEMONSTRATIVA)')
 fields([['BASE DE CÁLCULO (R$)',money(data.totals.base_iss??data.valor_total)],['ALÍQUOTA (%)',money(rate)+'%'],['ISS APURADO (R$)',money(data.totals.valor_iss)],['ISS RETIDO (R$)',money(data.totals.retencao_iss)]])
 section('RETENÇÕES FEDERAIS (DEMONSTRATIVAS)')
 fields(['irrf','inss','pis','cofins','csll'].map(key=>[key.toUpperCase()+' (R$)',money(data.totals['retencao_'+key])] as [string,string]))
 section('VALORES DA NFS-e')
 fields([['SERVIÇOS (R$)',money(Number(data.valor_total||0)+deductions)],['DESCONTOS (R$)',money(deductions)],['TOTAL RETIDO (R$)',money(Number(data.totals.retencao_iss||0)+['irrf','inss','pis','cofins','csll'].reduce((s,k)=>s+Number(data.totals['retencao_'+k]||0),0))]])
 rect(L,y-32,W,32,PANEL);text(L+6,y-20,'VALOR LÍQUIDO DA NFS-e',9,true);right(R-7,y-22,currency(data.totals.valor_liquido??data.valor_total),14,true);y-=32
 section('INFORMAÇÕES COMPLEMENTARES')
 let noteOffset=0
 while(noteOffset<noteLines.length){if(y-24<BOTTOM){page(true);section('INFORMAÇÕES COMPLEMENTARES (CONTINUAÇÃO)')}
  const capacity=Math.max(1,Math.floor((y-BOTTOM-12)/10)),chunk=noteLines.slice(noteOffset,noteOffset+capacity),height=chunk.length*10+12
  rect(L,y-height,W,height);chunk.forEach((s,i)=>text(L+6,y-13-i*10,s,7.5));y-=height;noteOffset+=chunk.length
 }
 for(const [index,p] of pages.entries()){ops=p;const mark=cancelled?'CANCELADA':'SIMULAÇÃO';ops.push(`q /GS1 gs BT /F2 76 Tf 0.3 0.3 0.3 rg 0.707 -0.707 0.707 0.707 127 523 Tm (${escape(mark)}) Tj ET Q`)
  text(L,22,`${SIMULATION_NOTICE} | Cognito ERP | Layout ${SERVICE_INVOICE_PDF_LAYOUT_VERSION}`,6.5,false,MUTED);right(R,22,`Página ${index+1} de ${pages.length}`,6.5)
 }
 const objects:string[]=['','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'],kids:number[]=[]
 for(const stream of pages.map(p=>p.join('\n'))){const pageId=objects.length+1,contentId=pageId+1;kids.push(pageId);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /ExtGState << /GS1 << /Type /ExtGState /ca 0.07 /CA 0.07 >> >> >> /Contents ${contentId} 0 R >>`);objects.push(`<< /Length ${Buffer.byteLength(stream,'latin1')} >>\nstream\n${stream}\nendstream`)}
 objects[0]='<< /Type /Catalog /Pages 2 0 R >>';objects[1]=`<< /Type /Pages /Kids [${kids.map(id=>id+' 0 R').join(' ')}] /Count ${kids.length} >>`
 let pdf='%PDF-1.4\n%âãÏÓ\n';const offsets=[0];objects.forEach((body,i)=>{offsets.push(Buffer.byteLength(pdf,'latin1'));pdf+=`${i+1} 0 obj\n${body}\nendobj\n`});const start=Buffer.byteLength(pdf,'latin1');pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;return Buffer.from(pdf,'latin1')
}

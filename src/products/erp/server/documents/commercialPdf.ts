export const COMMERCIAL_PDF_LAYOUT_VERSION = 1
type Row = Record<string, unknown>
export type CommercialDocumentKind = 'orcamento' | 'ordem_servico'
export type CommercialPdf = {kind:CommercialDocumentKind;number:string;status:string;date:string;validUntil?:string|null;delivery?:string|null;
  issuer:Row;customer:Row;items:Row[];subtotal:number;discount:number;freight:number;total:number;
  installments:Row[];notes?:string|null;paymentNotes?:string|null;equipment?:string|null;problem?:string|null;diagnosis?:string|null;revision?:number}
const money=(value:unknown)=>'R$ '+Number(value||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const day=(value:unknown)=>String(value||'').replace(/^(\d{4})-(\d{2})-(\d{2}).*/, '$3/$2/$1')
const safe=(value:unknown)=>String(value??'').replace(/[\u0000-\u0008\u000b-\u001f]/g,' ').replace(/[–—]/g,'-')
const escape=(s:string)=>safe(s).replace(/[^\x20-\xFF]/g,'?').replace(/([\\()])/g,'\\$1')
const widths=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584]
const measure=(s:string,size:number)=>[...s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')].reduce((n,c)=>n+(widths[c.charCodeAt(0)-32]||600),0)*size/1000
function wrap(s:string,size:number,width:number){const lines:string[]=[];for(const paragraph of safe(s).split(/\r?\n/)){let current='';for(const token of paragraph.split(/\s+/).filter(Boolean)){let word=token;while(measure(word,size)>width){if(current){lines.push(current);current=''}let n=word.length;while(n>1&&measure(word.slice(0,n),size)>width)n--;lines.push(word.slice(0,n));word=word.slice(n)}const next=current?current+' '+word:word;if(current&&measure(next,size)>width){lines.push(current);current=word}else current=next}lines.push(current)}return lines}
const documentNumber=(v:unknown)=>String(v||'').replace(/\D/g,'').length===14?String(v).replace(/\D/g,'').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5'):String(v||'').replace(/\D/g,'').length===11?String(v).replace(/\D/g,'').replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/,'$1.$2.$3-$4'):String(v||'')
const partyLines=(p:Row)=>[p.razao_social||p.nome, documentNumber(p.cnpj||p.documento), typeof p.endereco==='string'?p.endereco:[p.logradouro,p.numero,p.complemento,p.bairro].filter(Boolean).join(', '),[p.cidade||p.municipio,p.uf,p.cep].filter(Boolean).join(' - '),[p.email,p.telefone].filter(Boolean).join(' | ')].filter(Boolean).map(safe)

/** Commercial document only. Internal notes and credentials never enter this public snapshot. */
export function renderCommercialPdf(data:CommercialPdf):Buffer{
 const pages:string[][]=[];let ops:string[]=[],y=0;const L=36,R=559,W=523,MIN=58;
 const text=(x:number,yy:number,s:string,size=9,bold=false,color='0.12 0.14 0.13')=>ops.push(`BT /${bold?'F2':'F1'} ${size} Tf ${color} rg ${x.toFixed(2)} ${yy.toFixed(2)} Td (${escape(s)}) Tj ET`)
 const line=(yy:number)=>ops.push(`0.6 w 0.86 0.87 0.86 RG ${L} ${yy} m ${R} ${yy} l S`)
 const right=(x:number,yy:number,s:string,size=9,bold=false)=>text(x-measure(s,size)*(bold?1.04:1),yy,s,size,bold)
 const numberCell=(left:number,x:number,yy:number,s:string,bold=false)=>{const width=x-left-8,size=Math.min(8,width/Math.max(1,measure(s,1)*(bold?1.04:1)));right(x-5,yy,s,size,bold)}
 const heading=data.kind==='orcamento'?'PROPOSTA COMERCIAL':'ORDEM DE SERVIÇO'
 const page=()=>{ops=[];pages.push(ops);text(L,802,'OTTO ERP',11,true);right(R,802,`${heading} ${data.number}`,10,true);line(787);y=765}
 const ensure=(h:number)=>{if(y-h<MIN)page()}
 const block=(title:string,body:string)=>{const lines=wrap(body,9,W);ensure(36);text(L,y,title.toUpperCase(),8,true,'0.4 0.42 0.4');y-=18;for(const s of lines){ensure(14);text(L,y,s);y-=13}y-=15}
 page();text(L,y,data.kind==='orcamento'?'Proposta comercial':'Ordem de serviço',24,true);y-=28;
 text(L,y,`Nº ${data.number}  |  ${data.status}  |  ${data.revision?'Revisão '+data.revision:'Documento atual'}`,10);y-=21;
 const dates=[`Data: ${day(data.date)}`,data.validUntil&&`Validade: ${day(data.validUntil)}`,data.delivery&&`Entrega prevista: ${day(data.delivery)}`].filter(Boolean).join('   |   ');text(L,y,dates,9);y-=27;line(y);y-=24;
 const parties=[partyLines(data.issuer),partyLines(data.customer)].map(lines=>lines.flatMap(s=>wrap(s,9,245)));
 const height=Math.max(4,...parties.map(p=>p.length))*13+38;
 for(let col=0;col<2;col++){const x=L+col*270;text(x,y,col?'CLIENTE':'EMPRESA',8,true,'0.4 0.42 0.4');parties[col].forEach((s,i)=>text(x,y-19-i*13,s,9,i===0))}y-=height;
 if(data.equipment)block('Equipamento',data.equipment);
 if(data.problem)block('Solicitação do cliente',data.problem);
 if(data.diagnosis)block('Diagnóstico / escopo',data.diagnosis);
 const cols=[L,291,328,403,468,R];
 const tableHeader=()=>{ensure(45);ops.push(`0.95 0.96 0.95 rg ${L} ${y-23} ${W} 23 re f`);['DESCRIÇÃO','QTD.','UNITÁRIO','DESC.','TOTAL'].forEach((s,i)=>text(cols[i]+5,y-15,s,7.5,true));y-=23}
 tableHeader();
 for(const item of data.items){const lines=wrap(safe(item.descricao),9,cols[1]-L-12);let offset=0;
  while(offset<lines.length){if(y-32<MIN){page();tableHeader()}const capacity=Math.max(1,Math.floor((y-MIN-14)/13)),chunk=lines.slice(offset,offset+capacity),h=Math.max(34,chunk.length*13+14);
   chunk.forEach((s,i)=>text(L+5,y-15-i*13,s));if(offset===0){numberCell(cols[1],cols[2],y-16,Number(item.quantidade).toLocaleString('pt-BR',{maximumFractionDigits:4}));numberCell(cols[2],cols[3],y-16,money(item.valor_unitario));numberCell(cols[3],cols[4],y-16,money(item.desconto));numberCell(cols[4],R,y-16,money(item.total),true)}y-=h;line(y);offset+=chunk.length;
  }
 }
 ensure(112);y-=24;const amounts=[['Subtotal',data.subtotal],['Desconto geral',data.discount],...(data.freight?[['Frete',data.freight]]:[])] as [string,number][];
 for(const [label,value] of amounts){text(335,y,label,9);right(R,y,money(value),9);y-=17}
 text(335,y-7,'TOTAL',10,true);const grand=money(data.total);right(R,y-7,grand,Math.min(16,180/Math.max(1,measure(grand,1)*1.04)),true);y-=42;
 if(data.installments.length)block('Condições de pagamento',data.installments.map((row,i)=>`${i+1}. ${day(row.data_vencimento)} - ${money(row.valor)}${row.descricao?' - '+safe(row.descricao):''}`).join('\n'));
 if(data.paymentNotes)block('Observações do pagamento',data.paymentNotes);
 if(data.notes)block('Observações',data.notes);
 ensure(90);y-=30;line(y);text(L,y-15,'Nome / assinatura do cliente',8);right(R,y-15,'Data: ____ / ____ / ______',8);y-=32;
 for(const [index,p] of pages.entries()){ops=p;line(41);text(L,28,'Documento comercial. Não é nota fiscal nem comprovante de pagamento.',7,false,'0.4 0.42 0.4');right(R,28,`${index+1} / ${pages.length}`,7)}
 const objects=['','','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];const kids:number[]=[];
 for(const content of pages.map(p=>p.join('\n'))){const id=objects.length+1;kids.push(id);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id+1} 0 R >>`,`<< /Length ${Buffer.byteLength(content,'latin1')} >>\nstream\n${content}\nendstream`)}
 objects[0]='<< /Type /Catalog /Pages 2 0 R >>';objects[1]=`<< /Type /Pages /Kids [${kids.map(n=>n+' 0 R').join(' ')}] /Count ${pages.length} >>`;
 let pdf='%PDF-1.4\n%âãÏÓ\n';const offsets:number[]=[];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf,'latin1'));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});const start=Buffer.byteLength(pdf,'latin1');pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;return Buffer.from(pdf,'latin1');
}

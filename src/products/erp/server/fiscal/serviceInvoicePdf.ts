import {SIMULATION_NOTICE} from '../../shared/serviceInvoiceContracts'

type InvoicePdf={numero:unknown;status:unknown;data_competencia:unknown;emitente_snapshot:unknown;destinatario_snapshot:unknown;
 valor_total:unknown;items:Record<string,unknown>[];totals:Record<string,unknown>;observacoes?:unknown
 numero_dps?:unknown;serie_dps?:unknown;chave_acesso?:unknown;codigo_verificacao?:unknown;autorizada_em?:unknown;dps?:Record<string,unknown>|null}
const currency=(x:unknown)=>Number(x||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const escape=(x:unknown)=>String(x??'').replace(/[\u0000-\u001f]/g,' ').replace(/[–—]/g,'-').replace(/[^\x20-\xFF]/g,'?').replace(/([\\()])/g,'\\$1')
function wrap(text:string,width=78){
 const lines:string[]=[];let current=''
 for(const part of text.split(/\s+/).flatMap(w=>w.length>width?w.match(new RegExp('.{1,'+width+'}','g'))||[]:[w])){
  if((current+' '+part).trim().length>width){lines.push(current);current=part}else current=(current+' '+part).trim()
 }if(current)lines.push(current);return lines
}
/** Small, deterministic PDF writer for the controlled demonstration layout; no fiscal signatures. */
export function renderServiceInvoicePdf(data:InvoicePdf):Buffer{
 const streams:string[]=[],pages:string[][]=[];let lines:string[]=[]
 const append=(text:string)=>{for(const line of text?wrap(text):['']){if(lines.length>=40){pages.push(lines);lines=[]}lines.push(line)}}
 const issuer=(data.emitente_snapshot||{}) as Record<string,unknown>,customer=(data.destinatario_snapshot||{}) as Record<string,unknown>
 // Leiaute inspirado no DANFSe da NFS-e Nacional: identificação, emitente, tomador, serviço, valores e chave.
 const inf=((data.dps||{}) as {infDPS?:Record<string,unknown>}).infDPS||{},serv=(inf.serv||{}) as Record<string,Record<string,unknown>>
 const authorized=Boolean(data.chave_acesso)
 append('DANFSe - DOCUMENTO AUXILIAR DA NFS-e (SIMULAÇÃO)');append('')
 append(`NFS-e: ${authorized?data.numero:'não autorizada'}   |   DPS: ${data.numero_dps||'-'} série ${data.serie_dps||'-'}   |   Situação: ${data.status}`)
 append(`Competência: ${String(data.data_competencia||'').slice(0,10)}${data.autorizada_em?`   |   Autorização: ${String(data.autorizada_em instanceof Date?data.autorizada_em.toISOString():data.autorizada_em).slice(0,19).replace('T',' ')}`:''}`)
 if(authorized){append(`Chave de acesso: ${data.chave_acesso}`);append(`Código de verificação: ${data.codigo_verificacao}`)}
 append('')
 append('EMITENTE');append(String(issuer.razao_social||issuer.nome||'Empresa'))
 append(`CNPJ: ${issuer.cnpj||'não cadastrado'}  |  Inscrição municipal: ${issuer.inscricao_municipal||'-'}  |  ${[issuer.municipio,issuer.uf].filter(Boolean).join('/')}`)
 append('TOMADOR');append(String(customer.nome||'Cliente'));append(`CPF/CNPJ: ${customer.documento||'Não informado'}${customer.email?`  |  ${customer.email}`:''}`);append('')
 if(serv.cServ?.cTribNac)append(`Código de tributação nacional: ${serv.cServ.cTribNac}${serv.cServ.cTribMun?`  |  Municipal: ${serv.cServ.cTribMun}`:''}${serv.cServ.cNBS?`  |  NBS: ${serv.cServ.cNBS}`:''}  |  Local da prestação: ${serv.locPrest?.cLocPrestacao||'-'}`)
 append('SERVIÇOS')
 for(const [index,item] of data.items.entries()){
  append(`${index+1}. ${item.descricao}`)
  append(`Quantidade: ${Number(item.quantidade)}  |  Unitário: ${currency(item.valor_unitario)}  |  Desconto: ${currency(item.desconto)}  |  Total: ${currency(item.valor_total)}`);append('')
 }
 append('TOTAIS');append(`Serviços: ${currency(data.valor_total)}`)
 append(`ISS: ${currency(data.totals.valor_iss)} (alíquota ${Number(data.items[0]?.aliquota_iss||0)}%)  |  ISS retido: ${currency(data.totals.retencao_iss)}`)
 const federal=['irrf','inss','pis','cofins','csll'].filter(key=>Number(data.totals['retencao_'+key]||0)>0)
 if(federal.length)append(`Retenções federais: ${federal.map(key=>`${key.toUpperCase()} ${currency(data.totals['retencao_'+key])}`).join('  |  ')}`)
 append(`Valor líquido: ${currency(data.totals.valor_liquido)}`)
 if(data.observacoes){append('');append('OBSERVAÇÕES');append(String(data.observacoes))}
 append('');append('Nenhuma autorização fiscal foi solicitada. Valores tributários demonstrativos.');pages.push(lines)
 for(const [index,page] of pages.entries()){
  const stream=['q 0.94 0.96 0.98 rg 32 756 531 54 re f Q',
   `BT /F2 12 Tf 0.55 0.18 0.12 rg 44 782 Td (${escape(SIMULATION_NOTICE)}) Tj ET`,
   `BT /F1 9 Tf 0.35 0.35 0.35 rg 44 765 Td (Cognito ERP - documento de demonstracao) Tj ET`,
   'q 0.94 0.94 0.94 rg BT /F2 34 Tf 0.866 0.5 -0.5 0.866 75 360 Tm (SEM VALIDADE FISCAL) Tj ET Q']
  page.forEach((line,i)=>stream.push(`BT /${['EMITENTE','TOMADOR','SERVIÇOS','TOTAIS','OBSERVAÇÕES','VALORES'].includes(line)||i===0&&index===0?'F2':'F1'} ${i===0&&index===0?13:10} Tf 0.12 0.14 0.17 rg 44 ${732-i*16} Td (${escape(line)}) Tj ET`))
  stream.push(`BT /F1 8 Tf 0.4 0.4 0.4 rg 44 34 Td (${escape(SIMULATION_NOTICE)} - Página ${index+1} de ${pages.length}) Tj ET`)
  streams.push(stream.join('\n'))
 }
 const objects:string[]=['','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>']
 const kids:number[]=[]
 for(const stream of streams){const pageId=objects.length+1,contentId=pageId+1;kids.push(pageId)
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`)
  objects.push(`<< /Length ${Buffer.byteLength(stream,'latin1')} >>\nstream\n${stream}\nendstream`)
 }
 objects[0]='<< /Type /Catalog /Pages 2 0 R >>';objects[1]=`<< /Type /Pages /Kids [${kids.map(id=>id+' 0 R').join(' ')}] /Count ${kids.length} >>`
 let pdf='%PDF-1.4\n%âãÏÓ\n';const offsets=[0]
 objects.forEach((body,i)=>{offsets.push(Buffer.byteLength(pdf,'latin1'));pdf+=`${i+1} 0 obj\n${body}\nendobj\n`})
 const start=Buffer.byteLength(pdf,'latin1')
 pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`
 return Buffer.from(pdf,'latin1')
}

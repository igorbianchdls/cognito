import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {renderCommercialPdf,type CommercialPdf} from '../../src/products/erp/server/documents/commercialPdf'
const root='output/pdf',cache='.cache/commercial-documents';mkdirSync(root,{recursive:true});mkdirSync(cache,{recursive:true})
const data:CommercialPdf={kind:'orcamento',number:'ORC-DEMO-001',status:'Em andamento',date:'2026-10-10',validUntil:'2026-10-25',delivery:'2026-10-20',
 issuer:{nome:'Creatto Tecnologia - Demonstração',documento:'39562381000138',logradouro:'Rua de Aracati',numero:'1450',bairro:'Meireles',cidade:'Fortaleza',uf:'CE',cep:'60115081'},
 customer:{nome:'Clínica Aurora - Cliente de demonstração',documento:'42631314000132',logradouro:'Rua Demonstrativa',numero:'100',cidade:'Fortaleza',uf:'CE',email:'cliente@example.invalid'},
 items:[{descricao:'Manutenção preventiva e configuração do equipamento',quantidade:2,valor_unitario:100,desconto:0,total:200}],subtotal:200,discount:25,freight:10,total:185,
 installments:[{data_vencimento:'2026-10-20',valor:100},{data_vencimento:'2026-11-09',valor:85}],notes:'Proposta demonstrativa válida por quinze dias. Garantia dos serviços: 90 dias.'}
const proposal=renderCommercialPdf(data);writeFileSync(root+'/proposta-teste.pdf',proposal)
const os=renderCommercialPdf({...data,kind:'ordem_servico',number:'OS-DEMO-001',status:'Aprovada',validUntil:null,freight:0,total:175,installments:[],equipment:'Notebook profissional - Dell Latitude - Série DEMO-001',problem:'Equipamento com lentidão durante o uso.',diagnosis:'Limpeza, revisão dos componentes e configuração do sistema.',notes:'Prazo estimado de dez dias. Garantia dos serviços: 90 dias.'});writeFileSync(root+'/ordem-servico-teste.pdf',os)
const long='Descrição extensa de serviços: '+Array(20).fill('Inspeção, manutenção e configuração detalhada.').join(' '),items=Array.from({length:24},(_,i)=>({descricao:`ITEM ${i+1} - ${long}`,quantidade:2,valor_unitario:100,desconto:0,total:200}));
const multiple=renderCommercialPdf({...data,items,subtotal:4800,discount:0,freight:0,total:4800,installments:[],notes:'FIM_DO_DOCUMENTO '+Array(60).fill('Condições comerciais da proposta e descrição do prazo.').join('\n')});writeFileSync(cache+'/layout-longo.pdf',multiple)
assert(multiple.toString('latin1').includes('ITEM 24'));assert(multiple.toString('latin1').includes('FIM_DO_DOCUMENTO'));assert(Number(multiple.toString('latin1').match(/\/Count (\d+)/)?.[1])>1)
const extreme=renderCommercialPdf({...data,items:[{descricao:'Valores elevados e quantidades fracionárias',quantidade:100000,valor_unitario:100000000,desconto:100000000,total:9999900000000}],subtotal:9999900000000,discount:0,freight:0,total:9999900000000,installments:[]});writeFileSync(cache+'/layout-valores.pdf',extreme)
console.log(JSON.stringify({status:'passed',examples:2,stressLayouts:2,longItems:24,privacy:'public input only',visualReviewRequired:true}))

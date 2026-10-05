import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync,mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { renderFormHtml } from '../src/products/chatgptplugin/extensions/form'

async function main() {
  const executable=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
  if(!executable)throw new Error('Navegador local ausente.')
  const encoded=JSON.stringify(renderFormHtml('https://erp.example.invalid/api/mcp')).replaceAll('<','\\u003c')
  const host=`<!doctype html><html><body style="margin:0"><iframe id="app" style="width:100%;height:1100px;border:0"></iframe><script>
    window.calls=[];window.writes=[];window.opened=[];const frame=document.getElementById('app');frame.srcdoc=${encoded};
    addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.data.id===undefined)return;const m=e.data;let result={};
      if(m.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'test',version:'1'},hostCapabilities:{},hostContext:{theme:'light'}};
      if(m.method==='tools/call'){calls.push(m.params);const data=m.params.name==='meu_acesso'?{empresas:[{id:1,name:'Empresa A'},{id:2,name:'Empresa B'}]}:m.params.name==='buscar_cadastros'?{records:[{id:'101',nome:'Cadastro visível'},{id:'501',nome:'Produto escolhido'}]}:m.params.name==='listar_vendas'?{records:[{id:'301',numero:'VEN-301',cliente:'Cliente atual'}]}:m.params.name==='consultar_financeiro'?{records:[{id:'901',conta_id:'701',descricao:'Aluguel atual',fornecedor:'Fornecedor atual'},{id:'902',conta_id:'701',descricao:'Aluguel atual',fornecedor:'Fornecedor atual'}]}:m.params.name==='obter_venda'?{sale:{id:'301',cliente_id:101,cliente_nome:'Cliente atual',data_venda:'2026-10-05',data_vencimento:'2026-10-20',observacoes:'Preservar esta nota'},items:[{tipo:'produto',item_id:'501',quantidade:'2',valor_unitario:'15',desconto:'0'}],installments:[{data_vencimento:'2026-10-20',valor:'30'}]}:m.params.name==='obter_titulo_financeiro'?{record:{id:'701',fornecedor_id:'101',descricao:'Aluguel atual',valor_total:'100',categoria_id:'101',numero_documento:'DOC-1',observacoes:'Nota atual',data_competencia:'2026-10-05',data_emissao:'2026-10-05'},installments:[{vencimento:'2026-10-20',valor:'100'}]}:{rascunho_id:'d0000000-0000-4000-8000-000000000001',status:'pending',revisao_url:'https://erp.example.invalid/chatgptplugin/approvals/d0000000-0000-4000-8000-000000000001'};result={structuredContent:{ok:true,data}};}
      if(m.method==='ui/open-link')opened.push(m.params.url);
      if(m.method==='resources/read')result={contents:[{uri:m.params.uri,text:JSON.stringify({tipo:'editar_produto',dados:{registro_id:101,nome:'Nome do arquivo',preco:10}}),_meta:{'openai/resource':{writable:true,etag:'v1'}}}]};
      if(m.method==='openai/resources/write'){writes.push(m.params);result={outcome:m.params.ifMatch==='v1'?'saved':'conflict',etag:'v2'};}
      frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result},'*');
    });</script></body></html>`
  const server=createServer((_req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(host)})
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r))
  const browser=await chromium.launch({executablePath:executable,headless:true})
  try {
    const page=await browser.newPage({viewport:{width:1100,height:1150}})
    await page.goto(`http://127.0.0.1:${(server.address() as {port:number}).port}`)
    const frame=page.frameLocator('#app')
    await frame.getByText('Escolha a operação e preencha os dados.').waitFor()
    await frame.getByLabel('Empresa',{exact:true}).selectOption('2')
    await frame.getByLabel('Operação',{exact:true}).selectOption('produto')
    await frame.getByLabel('Nome',{exact:true}).fill('<img src=x onerror=alert(1)>')
    await frame.getByLabel('Preço',{exact:true}).fill('15.50')
    const submit=frame.getByRole('button',{name:'Preparar para revisão',exact:true})
    await submit.click();await frame.getByText('Proposta preparada. Abra a revisão para aprovar no ERP.').waitFor()
    await submit.click();await frame.getByText('Proposta preparada. Abra a revisão para aprovar no ERP.').waitFor()
    await page.waitForFunction(()=>((window as unknown as {calls:{name:string}[]}).calls.filter(c=>c.name==='preparar_rascunho').length===2))
    type Call={name:string;arguments:{empresa_id:number;chave_operacao:string;proposta:{tipo:string;dados:{preco:number;nome:string}}}}
    const calls=await page.evaluate(()=>(window as unknown as {calls:Call[]}).calls.filter(c=>c.name==='preparar_rascunho'))
    assert.equal(calls.length,2);assert.equal(calls[0].arguments.chave_operacao,calls[1].arguments.chave_operacao)
    assert.equal(calls[0].arguments.empresa_id,2);assert.equal(calls[0].arguments.proposta.dados.preco,15.5)
    assert.equal(await frame.locator('img').count(),0)
    await frame.getByLabel('Preço',{exact:true}).fill('16');await submit.click()
    await page.waitForFunction(()=>((window as unknown as {calls:Call[]}).calls.filter(c=>c.name==='preparar_rascunho').length===3))
    const changed=await page.evaluate(()=>(window as unknown as {calls:Call[]}).calls.filter(c=>c.name==='preparar_rascunho')[2])
    assert.notEqual(changed.arguments.chave_operacao,calls[0].arguments.chave_operacao)
    await frame.getByRole('button',{name:'Abrir revisão no ERP',exact:true}).click()
    await page.waitForFunction(()=>((window as unknown as {opened:string[]}).opened.length===1))
    await frame.getByText('Arquivo de proposta',{exact:true}).click()
    await frame.locator('#document').fill(JSON.stringify({tipo:'cliente',dados:{nome:'Importado',tenant_id:2}}))
    await frame.getByRole('button',{name:'Carregar no formulário',exact:true}).click()
    await frame.getByText('O arquivo contém campos não suportados neste formulário.').waitFor()
    await page.evaluate(()=>document.querySelector<HTMLIFrameElement>('#app')!.contentWindow!.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:{file:{name:'aberto.erp-proposta',resourceUri:'file:///aberto.erp-proposta'}}}},'*'))
    await frame.getByText('Dados carregados. Confira o formulário antes de preparar a revisão.').waitFor()
    await frame.getByLabel('Nome',{exact:true}).fill('Arquivo revisado')
    await frame.getByRole('button',{name:'Salvar arquivo aberto',exact:true}).click()
    await frame.getByText('Arquivo salvo. Os registros do ERP só mudam após a aprovação da proposta.').waitFor()
    const writes=await page.evaluate(()=>(window as unknown as {writes:{ifMatch:string;text:string}[]}).writes)
    assert.equal(writes.length,1);assert.equal(writes[0].ifMatch,'v1');assert.equal(JSON.parse(writes[0].text).tipo,'editar_produto')
    assert.equal(JSON.parse(await frame.locator('#document').inputValue()).dados.nome,'Arquivo revisado')
    assert.equal(await frame.locator('#kind option').count(),44)
    for(const proposta of [{tipo:'conta_pagar',dados:{fornecedor_id:101,descricao:'Aluguel',valor_total:100,categoria_id:1,data_competencia:'2026-10-04',data_emissao:'2026-10-04',parcelas:[{data_vencimento:'2026-10-20',valor:100}]}},{tipo:'excluir_conta_receber',dados:{registro_id:7,motivo:'Registro duplicado'}}]){
      await frame.locator('#document').fill(JSON.stringify(proposta));await frame.getByRole('button',{name:'Carregar no formulário',exact:true}).click();await frame.getByText('Dados carregados. Confira o formulário antes de preparar a revisão.').waitFor();await submit.click();await frame.getByText('Proposta preparada. Abra a revisão para aprovar no ERP.').waitFor();
      const sent=await page.evaluate(()=>(window as any).calls.filter((c:any)=>c.name==='preparar_rascunho').at(-1).arguments.proposta);assert.deepEqual(sent,proposta)
    }
    await frame.locator('#kind').selectOption('venda')
    await frame.locator('#f-data_venda').fill('2026-10-05');await frame.locator('#f-data_vencimento').fill('2026-10-20')
    await frame.getByRole('button',{name:'Buscar opções',exact:true}).nth(0).click();await frame.locator('#f-cliente_id option[value="101"]').waitFor({state:'attached'});await frame.locator('#f-cliente_id').selectOption('101')
    await frame.getByRole('button',{name:'Buscar opções',exact:true}).nth(1).click();await frame.locator('#f-itens select[data-numeric] option[value="501"]').waitFor({state:'attached'});await frame.locator('#f-itens select[data-numeric]').selectOption('501')
    await frame.getByLabel('Quantidade',{exact:true}).fill('2');await frame.getByLabel('Preço unitário',{exact:true}).fill('15');await submit.click();await frame.getByText('Proposta preparada. Abra a revisão para aprovar no ERP.').waitFor()
    type Captured={name:string;arguments:{proposta:{tipo:string;dados:Record<string,unknown>}}}
    const sentSale=await page.evaluate(()=>(window as unknown as {calls:Captured[]}).calls.filter(c=>c.name==='preparar_rascunho').at(-1)!.arguments.proposta)
    assert.deepEqual(sentSale.dados.itens,[{tipo:'produto',item_id:501,quantidade:2,valor_unitario:15,desconto:0}])
    await frame.getByLabel('Tipo',{exact:true}).selectOption('servico');assert.equal(await frame.locator('#f-itens select[data-numeric]').inputValue(),'');assert.equal(await frame.locator('#f-itens select[data-numeric] option').count(),1)
    await frame.locator('#kind').selectOption('editar_venda');await frame.locator('#f-registro_id + div button').click();await frame.locator('#f-registro_id option[value="301"]').waitFor({state:'attached'});await frame.locator('#f-registro_id').selectOption('301');await frame.getByRole('button',{name:'Carregar dados atuais'}).click();await frame.getByText('Dados atuais carregados. Confira as alterações antes de preparar a revisão.').waitFor()
    assert.equal(await frame.locator('#f-cliente_id').inputValue(),'101');assert.equal(await frame.locator('#f-itens select[data-numeric]').inputValue(),'501');assert.equal(await frame.locator('#f-observacoes').inputValue(),'Preservar esta nota')
    await frame.locator('#kind').selectOption('editar_conta_pagar');await frame.locator('#f-registro_id + div button').click();await frame.locator('#f-registro_id option[value="701"]').waitFor({state:'attached'});assert.equal(await frame.locator('#f-registro_id option[value="701"]').count(),1);assert.equal(await frame.locator('#f-registro_id option[value="901"]').count(),0);await frame.locator('#f-registro_id').selectOption('701');await frame.getByRole('button',{name:'Carregar dados atuais'}).click();await frame.getByText('Dados atuais carregados. Confira as alterações antes de preparar a revisão.').waitFor()
    await frame.getByLabel('Apagar Documento',{exact:true}).check();await submit.click();await frame.getByText('Proposta preparada. Abra a revisão para aprovar no ERP.').waitFor()
    const cleared=await page.evaluate(()=>(window as unknown as {calls:Captured[]}).calls.filter(c=>c.name==='preparar_rascunho').at(-1)!.arguments.proposta)
    assert.equal(cleared.dados.numero_documento,null);assert.deepEqual(cleared.dados.parcelas,[{data_vencimento:'2026-10-20',valor:100}])
    assert(!(await page.evaluate(()=>(window as unknown as {calls:Call[]}).calls)).some(c=>c.name.includes('aprovar')))
    mkdirSync('.cache',{recursive:true});await page.screenshot({path:resolve('.cache/chatgptplugin-form.png'),fullPage:true})
    console.log(JSON.stringify({status:'passed',forms:true,visualRows:true,nameSelection:true,prefill:true,explicitClear:true,fileReadWrite:true,fileConflictGuard:true,xssBlocked:true,idempotency:true,humanApprovalRequired:true,realChatGPT:false}))
  } finally {await browser.close();await new Promise<void>((r,j)=>server.close(e=>e?j(e):r()))}
}
void main().catch(e=>{console.error(e);process.exitCode=1})

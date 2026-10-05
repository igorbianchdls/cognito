// Embedded controls share the host's existing tool channel and never write ERP records.
export const formControlsSource=String.raw`
const catalogKinds={cliente_id:'clientes',fornecedor_id:'fornecedores',vendedor_id:'vendedores',categoria_id:'categorias',conta_financeira_id:'contas-financeiras'};
let controlsRevision=0;
function recordCatalog(kind){
 const target=kind.replace(/^(editar|excluir|confirmar|atender|cancelar|converter)_/,'');
 const registrations={cliente:'clientes',fornecedor:'fornecedores',vendedor:'vendedores',produto:'produtos',servico:'servicos',categoria:'categorias',conta_financeira:'contas-financeiras'};
 if(registrations[target])return {tool:'buscar_cadastros',tipo:registrations[target]};
 if(target==='conta_pagar'||target==='conta_receber')return {tool:'consultar_financeiro',tipo:target.endsWith('pagar')?'pagar':'receber',title:true};
 if(['venda','orcamento','compra'].includes(target))return {tool:target==='compra'?'listar_compras':target==='orcamento'?'listar_orcamentos':'listar_vendas'};
 if(kind==='pagar_parcela'||kind==='receber_parcela')return {tool:'consultar_financeiro',tipo:kind==='pagar_parcela'?'pagar':'receber'};
 return null;
}
function catalogControl(name,value,kind,selectedName){
 const select=document.createElement('select');select.dataset.numeric='true';
 const blank=document.createElement('option');blank.value='';blank.textContent='Escolha pelo nome';select.append(blank);
 if(value!==undefined&&value!==null&&value!==''){const o=document.createElement('option');o.value=String(value);o.textContent=selectedName||'Seleção carregada · '+value;select.append(o);select.value=String(value)}
 select.catalogKind=kind;return select;
}
function activateCatalog(select,label){
 const tools=document.createElement('div'),search=document.createElement('input'),button=document.createElement('button');
 search.type='search';search.placeholder='Buscar '+label.toLowerCase();search.setAttribute('aria-label','Buscar '+label);button.type='button';button.textContent='Buscar opções';
 button.onclick=async()=>{const company=Number($('company').value);if(!company){status.textContent='Escolha a empresa antes de buscar.';return}button.disabled=true;const revision=controlsRevision;
 try{const kind=typeof select.catalogKind==='function'?select.catalogKind():select.catalogKind,spec=typeof kind==='object'?kind:null;
 const args={empresa_id:company,busca:search.value,pagina:1,por_pagina:20};if(spec?.tipo)args.tipo=spec.tipo;if(!spec){args.tipo=kind;args.status='ativo'}
 const data=unpack(await request('tools/call',{name:spec?.tool||'buscar_cadastros',arguments:args}));if(revision!==controlsRevision||company!==Number($('company').value)||!select.isConnected)return;
 const prior=select.value,priorName=select.selectedOptions[0]?.textContent;select.replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent='Escolha uma opção';select.append(blank);
 const listed=new Set();for(const r of data.records||[]){const id=spec?.title?r.conta_id:r.id;if(!id||listed.has(String(id)))continue;listed.add(String(id));const o=document.createElement('option');o.value=String(id);o.textContent=[r.nome||r.numero||r.descricao||id,r.cliente||r.fornecedor,...(spec?.tool==='consultar_financeiro'&&!spec.title?[r.vencimento&&String(r.vencimento).slice(0,10),'Parcela '+r.parcela]:[])].filter(Boolean).join(' · ');select.append(o)}
 if(prior&&!Array.from(select.options).some(o=>o.value===prior)){const kept=document.createElement('option');kept.value=prior;kept.textContent=priorName||'Seleção carregada · '+prior;select.append(kept)}
 if(prior)select.value=prior;
 status.textContent=(data.records||[]).length?'Escolha o cadastro encontrado.':'Nenhum cadastro encontrado. Ajuste a busca.';
 }catch(e){status.textContent=e.message}finally{button.disabled=false}};
 tools.append(search,button);select.after(tools);
}
function arrayControl(name,initial){
 const fieldset=document.createElement('fieldset'),rows=document.createElement('div'),add=document.createElement('button');fieldset.dataset.array='true';
 const values=[];const fields=name==='parcelas'?['data_vencimento','valor']:['tipo','item_id','quantidade','valor_unitario','desconto'];
 function addRow(data={}){if(values.length>=50)return;const row=document.createElement('div');row.style.cssText='border:1px solid #ccd5df;border-radius:8px;padding:12px;margin:12px 0';const controls={};values.push(controls);
 for(const field of fields){const label=document.createElement('label');label.textContent=({tipo:'Tipo',item_id:'Item',quantidade:'Quantidade',valor_unitario:'Preço unitário',desconto:'Desconto',data_vencimento:'Vencimento',valor:'Valor'})[field];
 const id='row-'+crypto.randomUUID();label.htmlFor=id;let control;
 if(field==='tipo'){control=document.createElement('select');for(const v of ['produto','servico']){const o=document.createElement('option');o.value=v;o.textContent=v==='produto'?'Produto':'Serviço';control.append(o)}}
 else if(field==='item_id')control=catalogControl(field,data[field],()=>controls.tipo.value==='servico'?'servicos':'produtos');
 else{control=document.createElement('input');control.type=field==='data_vencimento'?'date':'number';control.min='0';control.step=field==='quantidade'?'0.0001':'0.01'}
 control.id=id;control.required=field!=='desconto';if(field!=='item_id')control.value=data[field]!==undefined?String(data[field]):field==='tipo'?'produto':field==='quantidade'?'1':field==='desconto'?'0':'';controls[field]=control;row.append(label,control);if(field==='item_id')activateCatalog(control,'Item')}
 controls.tipo?.addEventListener('change',()=>{controls.item_id.replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent='Escolha pelo nome';controls.item_id.append(blank)});
 const remove=document.createElement('button');remove.type='button';remove.textContent='Remover linha';remove.onclick=()=>{values.splice(values.indexOf(controls),1);row.remove()};row.append(remove);rows.append(row)}
 add.type='button';add.textContent=name==='parcelas'?'Adicionar parcela':'Adicionar item';add.onclick=()=>addRow();fieldset.append(rows,add);
 Object.defineProperty(fieldset,'value',{get(){return JSON.stringify(values.map(row=>Object.fromEntries(fields.map(f=>[f,f==='tipo'||f==='data_vencimento'?row[f].value:Number(row[f].value)]))))},set(v){rows.replaceChildren();values.length=0;for(const r of (typeof v==='string'?JSON.parse(v||'[]'):v)||[])addRow(r);if(!values.length)addRow()}});
 fieldset.value=initial||[];return fieldset;
}
function createControl(name,meta,choices,data){
 const field=name==='tipo_pessoa'?'tipo':name.startsWith('status_')?'status':name;
 if(['itens','parcelas'].includes(name))return arrayControl(name,data[field]);
 if(name==='registro_id'){const spec=recordCatalog($('kind').value);if(spec)return catalogControl(name,data[field],spec,data.__labels?.[name])}
 if(catalogKinds[name])return catalogControl(name,data[field],catalogKinds[name],data.__labels?.[name]);
 return document.createElement(choices?'select':meta.json||name==='observacoes'?'textarea':'input');
}
async function prefillRecord(){
 const revision=controlsRevision;
 const kind=$('kind').value,id=Number($('f-registro_id')?.value),empresa_id=Number($('company').value);if(!id||!empresa_id)throw new Error('Escolha a empresa e o registro.');
 const registration={editar_cliente:'clientes',editar_fornecedor:'fornecedores',editar_vendedor:'vendedores',editar_produto:'produtos',editar_servico:'servicos',editar_categoria:'categorias',editar_conta_financeira:'contas-financeiras'};
 let name,args;if(registration[kind]){name='obter_cadastro';args={empresa_id,tipo:registration[kind],registro_id:id}}
 else if(kind==='editar_conta_pagar'||kind==='editar_conta_receber'){name='obter_titulo_financeiro';args={empresa_id,tipo:kind.endsWith('pagar')?'pagar':'receber',conta_id:id}}
 else if(kind==='editar_compra'){name='obter_compra';args={empresa_id,compra_id:id}}
 else{name='obter_venda';args={empresa_id,venda_id:id}}
 const data=unpack(await request('tools/call',{name,arguments:args}));if(revision!==controlsRevision||empresa_id!==Number($('company').value)||kind!==$('kind').value)return;
 if(data.itemsTruncated||data.installmentsTruncated||(data.items?.length||0)>50)throw new Error('Este documento excede os limites do formulário. Abra a edição no ERP.');
 if((kind==='editar_venda'||kind==='editar_orcamento'||kind==='editar_compra')&&(data.installments?.length||0)>1)throw new Error('Este documento tem várias parcelas. Abra a edição no ERP para preservar a condição de pagamento.');
 const record={...(data.record||data.document||data.sale||data.purchase||{}),registro_id:id};
 record.__labels={cliente_id:record.cliente_nome,fornecedor_id:record.fornecedor_nome};
 if(typeof record.controla_estoque==='boolean')record.controla_estoque=record.controla_estoque?'sim':'nao';
 if(data.items)record.itens=data.items.map(i=>({tipo:i.tipo,item_id:Number(i.item_id),quantidade:Number(i.quantidade),valor_unitario:Number(i.valor_unitario),desconto:Number(i.desconto||0)}));
 const parts=data.parcelas||data.installments;if((kind==='editar_conta_pagar'||kind==='editar_conta_receber')&&parts)record.parcelas=parts.filter(p=>!p.excluido_em).map(p=>({data_vencimento:String(p.data_vencimento||p.vencimento).slice(0,10),valor:Number(p.valor)}));
 for(const key of Object.keys(record))if(key.startsWith('data_'))record[key]=String(record[key]).slice(0,10);
 render(record);status.textContent='Dados atuais carregados. Confira as alterações antes de preparar a revisão.';
}
`

'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { operationLabels } from '@/products/mcpcore/actions/labels'
import { fieldLabels } from '@/products/mcpcore/actions/fieldLabels'
import { ReviewValue } from './ReviewValue'

type Review={rascunho_id:string;empresa_id:number;empresa_nome?:string;status:string;registro_id:string|null;expira_em:string;
  alvo?:{registro_id:number;nome:string;status:string|null;valor:string|null;parcelas:{numero:number;vencimento:string;valor:number}[];conta_financeira:{id:string;nome:string}|null;campos?:Record<string,unknown>}|null;
  proposta:{tipo:string;dados:Record<string,unknown>;total?:number};referencias:{cliente:{nome:string}|null;fornecedor?:{nome:string}|null;itens:{id:string;tipo:string;nome:string}[]}|null}
const labels:Record<string,string>={...fieldLabels,registro_id:'Registro',documento:'Documento',status:'Situação',valor:'Valor',motivo:'Motivo',data_pagamento:'Data do pagamento',conta_financeira_id:'Conta financeira (ID)',nome:'Nome',tipo:'Tipo de pessoa',email:'E-mail',telefone:'Telefone',cidade:'Cidade',sku:'Código do produto',preco:'Preço',controla_estoque:'Controlar estoque',cliente_id:'Cliente',data_venda:'Data',data_vencimento:'Vencimento',observacoes:'Observações'}
const kinds:Record<string,string>={...operationLabels,cliente:'Novo cliente',produto:'Novo produto',orcamento:'Novo orçamento',venda:'Nova venda em rascunho',editar_cliente:'Editar cliente',editar_produto:'Editar produto',confirmar_venda:'Confirmar venda',cancelar_venda:'Cancelar venda',confirmar_compra:'Confirmar compra',cancelar_compra:'Cancelar compra',atender_venda:'Atender estoque da venda',receber_parcela:'Registrar recebimento',pagar_parcela:'Registrar pagamento',estornar_pagamento:'Estornar pagamento'}
const consequences:Record<string,string>={confirmar_venda:'A confirmação gera os efeitos financeiros e a reserva de estoque previstos no ERP.',confirmar_compra:'A confirmação pode gerar títulos a pagar e recebimento de estoque.',cancelar_venda:'O cancelamento aplica as regras financeiras e de liberação de estoque do ERP.',cancelar_compra:'O cancelamento aplica as regras financeiras e de reversão de estoque do ERP.',atender_venda:'Esta operação registra a saída de estoque. Não emite nota fiscal.',receber_parcela:'O recebimento altera o saldo financeiro da parcela e da conta escolhida.',pagar_parcela:'O pagamento altera o saldo financeiro da parcela e da conta escolhida.',estornar_pagamento:'O estorno reverte os efeitos financeiros do pagamento, preservando seu histórico.'}
const states:Record<string,string>={pending:'Aguardando sua decisão',saved:'Salvo no ERP',cancelled:'Cancelado',expired:'Expirado'}
const currency=(value:unknown) => Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
export default function ApprovalPage({id}:{id:string}) {
  const [review,setReview]=useState<Review|null>(null)
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  useEffect(()=>{let alive=true;fetch(`/api/chatgptplugin/approvals/${id}`,{cache:'no-store'}).then(async response=>{
    const body=await response.json();if(!response.ok)throw new Error(body.message || 'Não foi possível abrir a revisão.')
    if(alive)setReview(body)
  }).catch(error=>{if(alive)setMessage(error.message)});return()=>{alive=false}},[id])
  async function decide(decision:'save'|'cancel') {
    setBusy(true);setMessage('')
    try {
      const response=await fetch(`/api/chatgptplugin/approvals/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision})})
      const body=await response.json();if(!response.ok)throw new Error(body.message || 'Não foi possível concluir.')
      setReview(current=>current ? {...current,status:body.status,registro_id:body.registro_id} : current)
      setMessage(decision === 'save' ? 'Operação concluída. Você pode voltar ao ChatGPT.' : 'Rascunho cancelado.')
    } catch(error){setMessage(error instanceof Error ? error.message : 'Não foi possível concluir.')} finally{setBusy(false)}
  }
  const installments=(review?.proposta.dados.parcelas || []) as {data_vencimento:string;valor:number}[]
  const items=(review?.proposta.dados.itens || []) as Record<string,unknown>[]
  const names:Record<string,string>=Object.fromEntries((review?.referencias?.itens || []).map(item=>[`${item.tipo}:${item.id}`,item.nome]))
  if(review?.referencias?.cliente) names[`cliente_id:${review.proposta.dados.cliente_id}`]=review.referencias.cliente.nome
  if(review?.referencias?.fornecedor) names[`fornecedor_id:${review.proposta.dados.fornecedor_id}`]=review.referencias.fornecedor.nome
  if(review?.alvo?.conta_financeira) names[`conta_financeira_id:${review.alvo.conta_financeira.id}`]=review.alvo.conta_financeira.nome
  return <main className="mx-auto max-w-3xl px-6 py-10">
    <Link href="/configuracoes" className="text-sm underline">Voltar ao ERP</Link>
    <p className="mt-8 text-sm text-muted-foreground">ChatGPT Plugin · Revisão</p>
    <h1 className="mt-2 text-3xl font-semibold">{review ? kinds[review.proposta.tipo] : 'Revisar rascunho'}</h1>
    <p className="mt-3 text-muted-foreground">Confira os dados antes de aprovar. {review && consequences[review.proposta.tipo] || (review?.proposta.tipo.startsWith('excluir_')?'A exclusão retira o registro das consultas e preserva seu histórico. Registros com vínculos ou movimentações são protegidos.':review?.proposta.dados.parcelas?'Confira o título e a distribuição das parcelas. Alterações exigem título manual sem histórico de movimentação.':'Documentos comerciais são criados e editados em rascunho.')}</p>
    {message && <p role="status" className="my-5 rounded-xl border p-4">{message}</p>}
    {!review && !message && <p className="mt-6">Carregando revisão…</p>}
    {review && <>
      {review.proposta.tipo.includes('nota_servico') && <p className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-4">SIMULAÇÃO - SEM VALIDADE FISCAL. Nenhuma transmissão externa, título financeiro ou movimentação de estoque será gerado.</p>}
      <p className="my-6">{review.empresa_nome || `Empresa ${review.empresa_id}`} · {states[review.status] || review.status}</p>
      {review.alvo && <p className="my-4 rounded-xl border p-4">Registro: {review.alvo.nome} · ID {review.alvo.registro_id}{review.alvo.status ? ` · ${review.alvo.status}`:''}{review.alvo.valor ? ` · ${currency(review.alvo.valor)}`:''}</p>}
      {review.alvo?.conta_financeira && <p>Conta financeira: {review.alvo.conta_financeira.nome} · ID {review.alvo.conta_financeira.id}</p>}
      {review.proposta.tipo.startsWith('editar_') && review.alvo?.campos && <section className="my-4 overflow-x-auto rounded-xl border p-4"><h2 className="font-semibold">Alterações propostas</h2><table className="mt-3 w-full text-left text-sm"><thead><tr><th scope="col" className="p-2">Campo</th><th scope="col" className="p-2">Atual</th><th scope="col" className="p-2">Proposto</th></tr></thead><tbody>{Object.entries(review.proposta.dados).filter(([key])=>key!=='registro_id').map(([key,value])=><tr key={key} className="border-t"><th scope="row" className="p-2">{labels[key]||key}</th><td className="max-w-xs break-words p-2"><ReviewValue field={key} value={review.alvo?.campos?.[key]} names={names} /></td><td className="max-w-xs break-words p-2"><ReviewValue field={key} value={value} names={names} /></td></tr>)}</tbody></table></section>}
      {Boolean(review.alvo?.parcelas.length) && <section className="my-4 rounded-xl border p-4"><h2 className="font-semibold">Parcelas previstas</h2>{review.alvo?.parcelas.map((p,index)=><p key={index}>Parcela {p.numero} · {String(p.vencimento).slice(0,10)} · {currency(p.valor)}</p>)}</section>}
      <dl className="grid gap-4 rounded-2xl border p-6 sm:grid-cols-2">
        {Object.entries(review.proposta.dados).filter(([key])=>!['itens','parcelas'].includes(key)).map(([key,value])=><div key={key}>
          <dt className="text-sm text-muted-foreground">{labels[key] || key}</dt>
          <dd className="mt-1 break-words font-medium">{key === 'cliente_id' ? review.referencias?.cliente?.nome || `Cliente ${value}` : key === 'fornecedor_id' ? review.referencias?.fornecedor?.nome || `Fornecedor ${value}` : ['preco','valor','valor_total','custo','saldo_inicial'].includes(key) ? currency(value) : String(value)}</dd>
        </div>)}
      </dl>
      {items.length>0 && <div className="mt-6 overflow-x-auto rounded-2xl border"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Item</th><th className="p-3">Quantidade</th><th className="p-3">Preço</th><th className="p-3">Desconto</th><th className="p-3">Total</th></tr></thead><tbody>
        {items.map((item,index)=><tr key={index} className="border-b"><td className="p-3">{review.referencias?.itens.find(r=>r.id===String(item.item_id)&&r.tipo===item.tipo)?.nome || `${item.tipo} ${item.item_id}`}</td><td className="p-3">{String(item.quantidade)}</td><td className="p-3">{currency(item.valor_unitario)}</td><td className="p-3">{currency(item.desconto)}</td><td className="p-3">{currency(item.total)}</td></tr>)}
      </tbody></table></div>}
      {installments.length>0 && <section className="mt-6 rounded-xl border p-4"><h2 className="font-semibold">Parcelas da proposta</h2>{installments.map((p,index)=><p key={index}>Parcela {index+1} · {p.data_vencimento} · {currency(p.valor)}</p>)}</section>}
      {review.proposta.total !== undefined && <p className="mt-5 text-xl font-semibold">Total: {currency(review.proposta.total)}</p>}
      {review.status === 'pending' && <div className="mt-8 flex gap-3"><button disabled={busy} onClick={()=>decide('save')} className="rounded-lg bg-foreground px-5 py-3 text-background disabled:opacity-50">{busy ? 'Aguarde…' : review.proposta.tipo.startsWith('excluir_')?'Excluir no ERP':'Salvar no ERP'}</button><button disabled={busy} onClick={()=>decide('cancel')} className="rounded-lg border px-5 py-3 disabled:opacity-50">Cancelar rascunho</button></div>}
      {review.registro_id && <p className="mt-5">Registro: {review.registro_id}</p>}
      <p className="mt-6 text-sm text-muted-foreground">Válido até {new Date(review.expira_em).toLocaleString('pt-BR')}. A conta e a empresa ativas devem ser as mesmas usadas na proposta.</p>
    </>}
  </main>
}

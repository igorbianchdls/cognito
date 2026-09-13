import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ErpHistoryPanel } from '@/products/erp/frontend/components/ErpHistoryPanel'

const titles:Record<string,string>={vendas:'Venda',compras:'Compra',contratos:'Contrato','ordens-servico':'Ordem de serviço','contas-receber':'Conta a receber','contas-pagar':'Conta a pagar','notas-fiscais':'Nota fiscal','notas-compra':'Nota de compra'}
export default async function DocumentHistoryPage({params}:{params:Promise<{kind:string;id:string}>}){
  const {kind,id}=await params
  if(!titles[kind]||!/^[1-9]\d*$/.test(id))notFound()
  return <main className="mx-auto grid max-w-4xl gap-5 p-6"><Link className="underline" href="/erp">Visão geral</Link><h1 className="text-2xl font-semibold">{titles[kind]} {id}: histórico e anexos</h1><ErpHistoryPanel kind={kind} id={id}/></main>
}

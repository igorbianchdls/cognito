"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import CompraItemsEditor, { type CompraItem } from "@/components/modulos/compras/CompraItemsEditor"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function NovaCotacaoForm() {
  const router = useRouter()
  const [numero, setNumero] = React.useState('')
  const [dataSolicitacao, setDataSolicitacao] = React.useState('')
  const [prazoResposta, setPrazoResposta] = React.useState('')
  const [validadeProposta, setValidadeProposta] = React.useState('')
  const [observacoes, setObservacoes] = React.useState('')

  const [itens, setItens] = React.useState<CompraItem[]>([{ id: String(Date.now()), produto: '', quantidade: 1, unidade: 'un', valorUnitario: 0 }])

  const produtoOptions = React.useMemo(() => [
    { value: 'papel_a4', label: 'Papel A4' },
    { value: 'canetas', label: 'Canetas' },
    { value: 'ssd_1tb', label: 'SSD 1TB' },
  ], [])

  const totalItens = React.useMemo(() => itens.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valorUnitario)), 0), [itens])

  function onSalvar() {
    console.log('Salvar (Cotação stub):', { numero, dataSolicitacao, prazoResposta, validadeProposta, observacoes, itens })
    router.push('/modulos/compras?tab=cotacoes')
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Informações da cotação</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3"><Label>Número</Label><Input value={numero} onChange={(e)=>setNumero(e.target.value)} /></div>
          <div className="md:col-span-3"><Label>Data Solicitação</Label><Input type="date" value={dataSolicitacao} onChange={(e)=>setDataSolicitacao(e.target.value)} /></div>
          <div className="md:col-span-3"><Label>Prazo Resposta</Label><Input type="date" value={prazoResposta} onChange={(e)=>setPrazoResposta(e.target.value)} /></div>
          <div className="md:col-span-3"><Label>Validade Proposta</Label><Input type="date" value={validadeProposta} onChange={(e)=>setValidadeProposta(e.target.value)} /></div>
          <div className="md:col-span-12">
            <Label>Observações</Label>
            <Textarea rows={3} value={observacoes} onChange={(e)=>setObservacoes(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-4 mx-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-semibold text-slate-800">Itens solicitados</div>
          <div className="text-sm text-gray-600">Total estimado: R$ {totalItens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <CompraItemsEditor items={itens} onChange={setItens} produtoOptions={produtoOptions} />
      </Card>

      <Card className="p-4 mx-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={()=>router.push('/modulos/compras?tab=cotacoes')}>Cancelar</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSalvar}>Salvar</Button>
        </div>
      </Card>
    </div>
  )
}


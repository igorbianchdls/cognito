"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

type Item = { id: string; produto: string; incentivoPercentual: string; incentivoValor: string; metaQuantidade: string }

export default function CadastroCampanhaVendasSheet({ onSaved, triggerLabel = 'Cadastrar' }: { onSaved?: () => void; triggerLabel?: string }) {
  const [nome, setNome] = React.useState('')
  const [tipo, setTipo] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [dataInicio, setDataInicio] = React.useState('')
  const [dataFim, setDataFim] = React.useState('')
  const [ativo, setAtivo] = React.useState(true)
  const [itens, setItens] = React.useState<Item[]>([])

  const addItem = () => setItens(prev => [...prev, { id: String(Date.now()), produto: '', incentivoPercentual: '', incentivoValor: '', metaQuantidade: '' }])
  const remItem = (id: string) => setItens(prev => prev.filter(i => i.id !== id))
  const upd = (id: string, patch: Partial<Item>) => setItens(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) return { success: false, error: 'Informe o nome da campanha.' }
    try {
      const payload = {
        nome: nome.trim(), tipo: tipo.trim() || null, descricao: descricao.trim() || null,
        data_inicio: dataInicio || null, data_fim: dataFim || null, ativo,
        itens: itens.filter(i => i.produto).map(i => ({ produto_id: Number(i.produto), incentivo_percentual: i.incentivoPercentual ? Number(i.incentivoPercentual) : null, incentivo_valor: i.incentivoValor ? Number(i.incentivoValor) : null, meta_quantidade: i.metaQuantidade ? Number(i.metaQuantidade) : null }))
      }
      const res = await fetch('/api/modulos/comercial/campanhas-vendas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok || !j?.success) return { success: false, error: j?.message || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' } }
  }

  return (
    <BaseCadastroSheet title="Cadastrar Campanha de Vendas" description="Defina período, tipo e incentivos por produto" onSubmit={onSubmit} onSuccess={onSaved}>
      <div className="md:col-span-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div><Label>Tipo</Label><Input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ex.: Black Friday" /></div>
      <div className="md:col-span-2"><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
      <div><Label>Início</Label><Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
      <div><Label>Fim</Label><Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
      <div>
        <Label>Status</Label>
        <select className="border rounded h-9 px-2" value={ativo ? 'true' : 'false'} onChange={(e) => setAtivo(e.target.value !== 'false')}>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <div className="text-sm font-semibold text-slate-800 mb-2">Produtos da Campanha</div>
        <button type="button" className="text-sm text-blue-600 hover:underline mb-2" onClick={addItem}>+ Adicionar produto</button>
        <div className="space-y-2">
          {itens.map(i => (
            <div key={i.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4"><Label>Produto (ID)</Label><Input value={i.produto} onChange={(e) => upd(i.id, { produto: e.target.value })} placeholder="ID do produto" /></div>
              <div className="md:col-span-2"><Label>% Incentivo</Label><Input value={i.incentivoPercentual} onChange={(e) => upd(i.id, { incentivoPercentual: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>R$ Incentivo</Label><Input value={i.incentivoValor} onChange={(e) => upd(i.id, { incentivoValor: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Meta Qtd</Label><Input value={i.metaQuantidade} onChange={(e) => upd(i.id, { metaQuantidade: e.target.value })} /></div>
              <div className="md:col-span-2 text-right"><button type="button" className="text-xs text-red-600 hover:underline" onClick={() => remItem(i.id)}>Remover</button></div>
            </div>
          ))}
        </div>
      </div>
    </BaseCadastroSheet>
  )
}


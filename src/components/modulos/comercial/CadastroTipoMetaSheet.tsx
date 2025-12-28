"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

export default function CadastroTipoMetaSheet({ onSaved, triggerLabel = 'Cadastrar' }: { onSaved?: () => void; triggerLabel?: string }) {
  const [nome, setNome] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [tipoValor, setTipoValor] = React.useState<'valor'|'percentual'|'quantidade'>('valor')
  const [medidaSql, setMedidaSql] = React.useState('')
  const [ativo, setAtivo] = React.useState(true)

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) return { success: false, error: 'Informe o nome do tipo de meta.' }
    try {
      const payload = { nome: nome.trim(), descricao: descricao.trim() || null, tipo_valor: tipoValor, medida_sql: medidaSql.trim() || null, ativo }
      const res = await fetch('/api/modulos/comercial/tipos-metas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok || !j?.success) return { success: false, error: j?.message || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' } }
  }

  return (
    <BaseCadastroSheet title="Cadastrar Tipo de Meta" description="Defina o tipo de meta e como é medido" onSubmit={onSubmit} onSuccess={onSaved}>
      <div className="md:col-span-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div className="md:col-span-2"><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
      <div>
        <Label>Tipo de Valor</Label>
        <select className="border rounded h-9 px-2" value={tipoValor} onChange={(e) => setTipoValor(e.target.value as any)}>
          <option value="valor">Valor</option>
          <option value="percentual">Percentual</option>
          <option value="quantidade">Quantidade</option>
        </select>
      </div>
      <div className="md:col-span-2"><Label>Medida (SQL opcional)</Label><Input value={medidaSql} onChange={(e) => setMedidaSql(e.target.value)} placeholder="Ex.: SELECT ..." /></div>
      <div>
        <Label>Status</Label>
        <select className="border rounded h-9 px-2" value={ativo ? 'true' : 'false'} onChange={(e) => setAtivo(e.target.value !== 'false')}>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>
    </BaseCadastroSheet>
  )
}


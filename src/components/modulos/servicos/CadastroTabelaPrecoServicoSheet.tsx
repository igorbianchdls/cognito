"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

type Props = { triggerLabel?: string; onSaved?: () => void }

export default function CadastroTabelaPrecoServicoSheet({ triggerLabel = 'Cadastrar', onSaved }: Props) {
  const [nome, setNome] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [ativo, setAtivo] = React.useState(true)

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) return { success: false, error: 'Informe o nome da tabela.' }
    try {
      const payload = { nome: nome.trim(), descricao: descricao.trim() || null, ativo }
      const res = await fetch('/api/modulos/servicos/tabelas-preco', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok || !j?.success) return { success: false, error: j?.message || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Tabela de Preço"
      description="Defina uma nova tabela de preço para serviços"
      widthClassName="max-w-3xl"
      onSubmit={onSubmit}
      onSuccess={onSaved}
    >
      <div className="md:col-span-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Tabela 2025" /></div>
      <div className="md:col-span-2"><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Texto opcional" /></div>
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


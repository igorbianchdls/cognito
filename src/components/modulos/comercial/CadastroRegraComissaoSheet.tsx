"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

export default function CadastroRegraComissaoSheet({ onSaved, triggerLabel = 'Cadastrar' }: { onSaved?: () => void; triggerLabel?: string }) {
  const [nome, setNome] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [pdef, setPdef] = React.useState('')
  const [pmin, setPmin] = React.useState('')
  const [pmax, setPmax] = React.useState('')
  const [ativo, setAtivo] = React.useState(true)

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) return { success: false, error: 'Informe o nome da regra.' }
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        percentual_default: pdef ? Number(pdef) : null,
        percentual_min: pmin ? Number(pmin) : null,
        percentual_max: pmax ? Number(pmax) : null,
        ativo,
      }
      const res = await fetch('/api/modulos/comercial/regras-comissoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok || !j?.success) return { success: false, error: j?.message || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' } }
  }

  return (
    <BaseCadastroSheet title="Cadastrar Regra de Comissão" description="Defina os percentuais e status da regra" onSubmit={onSubmit} onSuccess={onSaved}>
      <div className="md:col-span-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div className="md:col-span-2"><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
      <div><Label>% Padrão</Label><Input value={pdef} onChange={(e) => setPdef(e.target.value)} /></div>
      <div><Label>% Mínimo</Label><Input value={pmin} onChange={(e) => setPmin(e.target.value)} /></div>
      <div><Label>% Máximo</Label><Input value={pmax} onChange={(e) => setPmax(e.target.value)} /></div>
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


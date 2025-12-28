"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

export default function CadastroVendedorSheet({ onSaved, triggerLabel = 'Cadastrar' }: { onSaved?: () => void; triggerLabel?: string }) {
  const [nome, setNome] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [telefone, setTelefone] = React.useState('')
  const [territorioId, setTerritorioId] = React.useState<string>('')
  const [comissao, setComissao] = React.useState('0')
  const [ativo, setAtivo] = React.useState(true)
  const [territorios, setTerritorios] = React.useState<Array<{ value: string; label: string }>>([])

  React.useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await fetch('/api/modulos/comercial?view=territorios&pageSize=1000', { cache: 'no-store', signal: ac.signal })
        if (res.ok) {
          const j = await res.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id || r.territorio_id || ''), label: String(r.territorio || '') }))
          setTerritorios(opts)
        }
      } catch {}
    })()
    return () => ac.abort()
  }, [])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) return { success: false, error: 'Informe o nome do vendedor.' }
    try {
      const payload = { nome: nome.trim(), email: email.trim() || null, telefone: telefone.trim() || null, territorio_id: territorioId ? Number(territorioId) : null, comissao_padrao: comissao ? Number(comissao) : null, ativo }
      const res = await fetch('/api/modulos/comercial/vendedores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok || !j?.success) return { success: false, error: j?.message || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' } }
  }

  return (
    <BaseCadastroSheet title="Cadastrar Vendedor" description="Inclua um novo vendedor e defina o território" onSubmit={onSubmit} onSuccess={onSaved}>
      <div className="md:col-span-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div><Label>E-mail</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
      <div>
        <Label>Território</Label>
        <Select value={territorioId} onValueChange={setTerritorioId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {territorios.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Comissão padrão (%)</Label><Input value={comissao} onChange={(e) => setComissao(e.target.value)} /></div>
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


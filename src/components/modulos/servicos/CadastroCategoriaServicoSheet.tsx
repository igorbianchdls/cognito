"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

type Props = { triggerLabel?: string; onSaved?: () => void }

export default function CadastroCategoriaServicoSheet({ triggerLabel = 'Cadastrar', onSaved }: Props) {
  const [nome, setNome] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [paiId, setPaiId] = React.useState<string>('')
  const [categorias, setCategorias] = React.useState<Array<{ value: string; label: string }>>([])

  React.useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await fetch('/api/modulos/servicos?view=categorias&pageSize=1000&order_by=nome', { cache: 'no-store', signal: ac.signal })
        if (res.ok) {
          const j = await res.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome }))
          setCategorias(opts)
        }
      } catch {}
    })()
    return () => ac.abort()
  }, [])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) return { success: false, error: 'Informe o nome da categoria.' }
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        categoria_pai_id: paiId ? Number(paiId) : null,
      }
      const res = await fetch('/api/modulos/servicos/categorias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
      title="Cadastrar Categoria de Serviço"
      description="Crie uma nova categoria para organizar os serviços"
      widthClassName="max-w-3xl"
      onSubmit={onSubmit}
      onSuccess={onSaved}
    >
      <div className="md:col-span-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Consultoria" /></div>
      <div className="md:col-span-2"><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Texto opcional" /></div>
      <div>
        <Label>Categoria Pai</Label>
        <Select value={paiId} onValueChange={setPaiId}>
          <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
          <SelectContent>
            {categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </BaseCadastroSheet>
  )
}


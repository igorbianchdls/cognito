"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

type Props = { triggerLabel?: string; onSaved?: () => void }

export default function CadastroCatalogoServicoSheet({ triggerLabel = 'Cadastrar', onSaved }: Props) {
  const [nome, setNome] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [categoriaId, setCategoriaId] = React.useState<string>('')
  const [unidade, setUnidade] = React.useState('h')
  const [preco, setPreco] = React.useState('0')
  const [ativo, setAtivo] = React.useState(true)
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
    if (!nome.trim()) return { success: false, error: 'Informe o nome do serviço.' }
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        categoria_id: categoriaId ? Number(categoriaId) : null,
        unidade_medida: unidade || null,
        preco_padrao: preco ? Number(preco) : null,
        ativo,
      }
      const res = await fetch('/api/modulos/servicos/catalogo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
      title="Cadastrar Serviço (Catálogo)"
      description="Inclua um novo serviço no catálogo"
      widthClassName="max-w-3xl"
      onSubmit={onSubmit}
      onSuccess={onSaved}
    >
      <div className="md:col-span-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Suporte técnico" /></div>
      <div className="md:col-span-2"><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Texto opcional" /></div>
      <div>
        <Label>Categoria</Label>
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Unidade</Label>
        <Input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="Ex.: h (hora), un (unidade)" />
      </div>
      <div>
        <Label>Preço padrão</Label>
        <Input value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0.00" />
      </div>
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


"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

type Props = { triggerLabel?: string; onSaved?: () => void }

export default function CadastroSlaServicoSheet({ triggerLabel = 'Cadastrar', onSaved }: Props) {
  const [servicoId, setServicoId] = React.useState<string>('')
  const [tempo, setTempo] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [servicos, setServicos] = React.useState<Array<{ value: string; label: string }>>([])

  React.useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await fetch('/api/modulos/servicos?view=catalogo&pageSize=1000&order_by=nome', { cache: 'no-store', signal: ac.signal })
        if (res.ok) {
          const j = await res.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: r.nome }))
          setServicos(opts)
        }
      } catch {}
    })()
    return () => ac.abort()
  }, [])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!servicoId) return { success: false, error: 'Selecione o serviço.' }
    try {
      const payload = {
        servico_id: Number(servicoId),
        tempo_estimado: tempo.trim() || null,
        descricao: descricao.trim() || null,
      }
      const res = await fetch('/api/modulos/servicos/slas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
      title="Cadastrar SLA de Serviço"
      description="Defina o SLA (tempo estimado) para um serviço do catálogo"
      widthClassName="max-w-3xl"
      onSubmit={onSubmit}
      onSuccess={onSaved}
    >
      <div>
        <Label>Serviço *</Label>
        <Select value={servicoId} onValueChange={setServicoId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {servicos.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Tempo Estimado</Label><Input value={tempo} onChange={(e) => setTempo(e.target.value)} placeholder="Ex.: 48h, 3 dias" /></div>
      <div className="md:col-span-2"><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Texto opcional" /></div>
    </BaseCadastroSheet>
  )
}


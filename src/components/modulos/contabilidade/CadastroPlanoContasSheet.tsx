"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

type Props = { onSaved?: () => void }

export default function CadastroPlanoContasSheet({ onSaved }: Props) {
  const [codigo, setCodigo] = React.useState('')
  const [nome, setNome] = React.useState('')
  const [paiId, setPaiId] = React.useState<string>('')
  const [aceita, setAceita] = React.useState(false)
  const [tipo, setTipo] = React.useState<string>('')
  const [contas, setContas] = React.useState<Array<{ value: string; label: string }>>([])

  React.useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await fetch('/api/modulos/contabilidade?view=plano-contas&pageSize=1000&order_by=codigo', { cache: 'no-store', signal: ac.signal })
        if (res.ok) {
          const j = await res.json()
          const opts = (j?.rows || []).map((r: any) => ({ value: String(r.id), label: `${r.codigo || ''} — ${r.nome || ''}` }))
          setContas(opts)
        }
      } catch {}
    })()
    return () => ac.abort()
  }, [])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!codigo.trim() || !nome.trim()) return { success: false, error: 'Informe código e nome.' }
    try {
      const payload = {
        codigo: codigo.trim(),
        nome: nome.trim(),
        conta_pai_id: paiId ? Number(paiId) : null,
        aceita_lancamento: aceita,
        tipo_conta: tipo || null,
      }
      const res = await fetch('/api/modulos/contabilidade/plano-contas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok || !j?.success) return { success: false, error: j?.message || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      title="Cadastrar Conta Contábil"
      description="Inclui uma conta no Plano de Contas"
      widthClassName="max-w-3xl"
      onSubmit={onSubmit}
      onSuccess={onSaved}
    >
      <div><Label>Código *</Label><Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: 1.1.1" /></div>
      <div className="md:col-span-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Caixa" /></div>
      <div>
        <Label>Conta Pai</Label>
        <Select value={paiId} onValueChange={setPaiId}>
          <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
          <SelectContent>
            {contas.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Aceita lançamento?</Label>
        <select className="border rounded h-9 px-2" value={aceita ? 'true' : 'false'} onChange={(e) => setAceita(e.target.value !== 'false')}>
          <option value="true">Sim</option>
          <option value="false">Não</option>
        </select>
      </div>
      <div>
        <Label>Tipo de Conta</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {['Ativo','Passivo','Patrimônio Líquido','Receita','Despesa','Custo'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </BaseCadastroSheet>
  )
}


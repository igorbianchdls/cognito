"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

type Props = { onSaved?: () => void }
type Linha = { id: string; conta: string; debito: string; credito: string; historico: string }

export default function CadastroLancamentoContabilSheet({ onSaved }: Props) {
  const [tenantId, setTenantId] = React.useState('1')
  const [dataLanc, setDataLanc] = React.useState('')
  const [historico, setHistorico] = React.useState('')
  const [linhas, setLinhas] = React.useState<Linha[]>([{ id: String(Date.now()), conta: '', debito: '0', credito: '0', historico: '' }])

  const addLinha = () => setLinhas(prev => [...prev, { id: String(Date.now()), conta: '', debito: '0', credito: '0', historico: '' }])
  const remLinha = (id: string) => setLinhas(prev => prev.filter(l => l.id !== id))
  const upd = (id: string, patch: Partial<Linha>) => setLinhas(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!dataLanc) return { success: false, error: 'Informe a data do lançamento.' }
    const parsed = linhas
      .filter(l => l.conta && (Number(l.debito) > 0 || Number(l.credito) > 0))
      .map(l => ({ conta_id: Number(l.conta), debito: Number(l.debito || 0), credito: Number(l.credito || 0), historico: l.historico || null }))
    if (!parsed.length) return { success: false, error: 'Inclua ao menos uma linha com conta e valor.' }
    try {
      const payload = {
        tenant_id: Number(tenantId || '1'),
        data_lancamento: dataLanc,
        historico: historico || null,
        linhas: parsed,
      }
      const res = await fetch('/api/modulos/contabilidade/lancamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok || !j?.success) return { success: false, error: j?.message || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      title="Cadastrar Lançamento Contábil"
      description="Informe o cabeçalho e as linhas (débitos e créditos)"
      widthClassName="max-w-4xl"
      onSubmit={onSubmit}
      onSuccess={onSaved}
    >
      <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="1" /></div>
      <div><Label>Data do Lançamento *</Label><Input type="date" value={dataLanc} onChange={(e) => setDataLanc(e.target.value)} /></div>
      <div className="md:col-span-2"><Label>Histórico</Label><Input value={historico} onChange={(e) => setHistorico(e.target.value)} placeholder="Descrição geral do lançamento" /></div>

      <div className="md:col-span-2">
        <div className="text-sm font-semibold text-slate-800 mb-2">Linhas</div>
        <div className="space-y-2">
          {linhas.map((l) => (
            <div key={l.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-3">
                <Label>Conta (ID)</Label>
                <Input value={l.conta} onChange={(e) => upd(l.id, { conta: e.target.value })} placeholder="Ex.: 101" />
              </div>
              <div className="md:col-span-2">
                <Label>Débito</Label>
                <Input value={l.debito} onChange={(e) => upd(l.id, { debito: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Crédito</Label>
                <Input value={l.credito} onChange={(e) => upd(l.id, { credito: e.target.value })} />
              </div>
              <div className="md:col-span-4">
                <Label>Histórico da linha</Label>
                <Input value={l.historico} onChange={(e) => upd(l.id, { historico: e.target.value })} />
              </div>
              <div className="md:col-span-1 text-right">
                <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => remLinha(l.id)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <button type="button" className="text-sm text-blue-600 hover:underline" onClick={addLinha}>+ Adicionar linha</button>
        </div>
      </div>
    </BaseCadastroSheet>
  )
}


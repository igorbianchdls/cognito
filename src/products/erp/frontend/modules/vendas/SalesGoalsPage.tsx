'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpModuleWorkspaceTabs, ErpWorkspaceHeader } from '@/products/erp/frontend/components/ErpWorkspaceChrome'
import { erpClientToday } from '@/products/erp/frontend/services/erpTimeZone'
import { DialogActions, DialogError, ErrorBanner, Field, NativeSelect, currency, erpJson, errorMessage, inputClass, primaryButtonClass, toNumber, type Option } from './commercialUi'

type Goal = { mes: string; vendedor: string; meta: string; realizado: string; atingimento_percentual: string | null }

// Metas de venda por mês (da empresa ou por vendedor) e atingimento pelas vendas confirmadas (Fase 2E).
export function SalesGoalsPage() {
  const year = erpClientToday().slice(0, 4)
  const [records, setRecords] = useState<Goal[]>([])
  const [sellers, setSellers] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [goals, catalogs] = await Promise.all([
        erpJson<{ records: Goal[] }>(`/api/erp/metas-vendas?inicio=${year}-01-01&fim=${year}-12-31`),
        erpJson<{ responsibles: Option[] }>('/api/erp/vendas/catalogos'),
      ])
      setRecords(goals.records); setSellers(catalogs.responsibles)
    } catch (loadError) { setError(errorMessage(loadError, 'Não foi possível carregar as metas.')) }
    finally { setLoading(false) }
  }, [year])
  useEffect(() => { void load() }, [load])

  return <div className="flex min-h-full min-w-0 flex-col bg-white">
    <ErpWorkspaceHeader section="Vendas" title="Metas de venda" menuItems={[{ label: 'Atualizar dados', onSelect: () => void load() }]}
      primaryAction={<Button className={primaryButtonClass} onClick={() => setOpen(true)}><Plus className="size-4" />Definir meta</Button>} />
    <ErpModuleWorkspaceTabs sectionId="vendas" moduleId="metas-vendas" />
    <ErrorBanner error={error} />
    <div className="min-w-0 overflow-x-auto"><Table className="erp-workspace-table min-w-[760px] border-b border-[#e7e7e4]">
      <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]"><TableHead>Mês</TableHead><TableHead className="erp-table-identity-heading">Vendedor</TableHead><TableHead className="text-right">Meta</TableHead><TableHead className="text-right">Realizado</TableHead><TableHead className="w-64">Atingimento</TableHead></TableRow></TableHeader>
      <TableBody>
        {loading ? <TableRow><TableCell colSpan={5} className="h-28 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>
          : records.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-gray-500">Nenhuma meta em {year}. Defina a meta do mês da empresa ou de cada vendedor.</TableCell></TableRow>
          : records.map(row => { const pct = Number(row.atingimento_percentual || 0)
            return <TableRow key={`${row.mes}-${row.vendedor}`}>
              <TableCell>{row.mes.slice(5)}/{row.mes.slice(0, 4)}</TableCell><TableCell className="font-medium">{row.vendedor}</TableCell>
              <TableCell className="text-right tabular-nums">{currency(row.meta)}</TableCell><TableCell className="text-right tabular-nums">{currency(row.realizado)}</TableCell>
              <TableCell><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded bg-gray-100"><div className={`h-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-[#c9f20a]'}`} style={{ width: `${Math.min(100, pct)}%` }} /></div><span className="w-14 text-right text-sm tabular-nums">{pct.toLocaleString('pt-BR')}%</span></div></TableCell>
            </TableRow> })}
      </TableBody></Table></div>
    {open ? <GoalDialog sellers={sellers} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); void load() }} /> : null}
  </div>
}

function GoalDialog({ sellers, onClose, onSaved }: { sellers: Option[]; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState({ mes: erpClientToday().slice(0, 7), vendedor_id: '', valor: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function save() {
    setSaving(true); setError(null)
    try { await erpJson('/api/erp/metas-vendas', { method: 'POST', body: { values: { mes: values.mes, vendedor_id: values.vendedor_id ? Number(values.vendedor_id) : null, valor: toNumber(values.valor) } } }); onSaved() }
    catch (saveError) { setError(errorMessage(saveError, 'Não foi possível salvar a meta.')) }
    finally { setSaving(false) }
  }
  return <Dialog open onOpenChange={value => { if (!value) onClose() }}><DialogContent className="max-w-md">
    <DialogHeader><DialogTitle>Definir meta de venda</DialogTitle></DialogHeader>
    <div className="grid gap-4 py-2">
      <Field label="Mês"><input type="month" className={inputClass} value={values.mes} onChange={event => setValues(current => ({ ...current, mes: event.target.value }))} /></Field>
      <Field label="Vendedor"><NativeSelect label="Vendedor" value={values.vendedor_id} onChange={vendedor_id => setValues(current => ({ ...current, vendedor_id }))} options={sellers} placeholder="Empresa (todos os vendedores)" /></Field>
      <Field label="Meta (R$)"><input className={inputClass} inputMode="decimal" value={values.valor} onChange={event => setValues(current => ({ ...current, valor: event.target.value }))} /></Field>
      <p className="text-xs text-gray-500">Se já houver meta no mês para o mesmo vendedor, ela é substituída.</p>
      <DialogError error={error} />
    </div>
    <DialogActions onCancel={onClose} onConfirm={() => void save()} saving={saving} label="Salvar meta" disabled={!values.mes || !(Number(toNumber(values.valor)) > 0)} />
  </DialogContent></Dialog>
}

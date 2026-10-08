'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpModuleWorkspaceTabs, ErpSearchToolbar, ErpStatusBadge, ErpWorkspaceHeader } from '@/products/erp/frontend/components/ErpWorkspaceChrome'
import {
  CatalogPicker, DialogActions, DialogError, ErrorBanner, Field, currency, dateLabel, erpJson, errorMessage, inputClass,
  percent, primaryButtonClass, toNumber, type Option,
} from './commercialUi'

type PriceTable = { id: string; nome: string; descricao: string | null; padrao: boolean; ativo: boolean; vigencia_inicio: string | null; vigencia_fim: string | null; versao: number; itens: number; clientes: number }
type PriceItem = { tipo: 'produto' | 'servico'; item_id: string; item: string; preco_cadastro?: number | null; preco: number; preco_minimo: number | null; desconto_maximo_percentual: number | null; quantidade_minima: number }
type Draft = { id?: string; versao?: number; nome: string; descricao: string; padrao: boolean; ativo: boolean; vigencia_inicio: string; vigencia_fim: string; itens: PriceItem[] }

const emptyDraft = (): Draft => ({ nome: '', descricao: '', padrao: false, ativo: true, vigencia_inicio: '', vigencia_fim: '', itens: [] })

// Tabelas de preço: preço por item e faixa de quantidade, com preço mínimo e desconto máximo. A venda usa a
// tabela informada, a do cliente ou a padrão.
export function PriceTablesPage() {
  const [records, setRecords] = useState<PriceTable[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setRecords((await erpJson<{ records: PriceTable[] }>('/api/erp/tabelas-preco?pageSize=100')).records) }
    catch (loadError) { setError(errorMessage(loadError, 'Não foi possível carregar as tabelas de preço.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  async function open(record: PriceTable) {
    setError(null)
    try {
      const detail = await erpJson<{ record: PriceTable; items: Array<Omit<PriceItem, 'preco' | 'preco_minimo' | 'desconto_maximo_percentual' | 'quantidade_minima'> & Record<'preco' | 'preco_minimo' | 'desconto_maximo_percentual' | 'quantidade_minima', string | number | null>> }>(`/api/erp/tabelas-preco/${record.id}`)
      const num = (value: string | number | null) => value == null ? null : Number(value)
      setDraft({
        id: detail.record.id, versao: detail.record.versao, nome: detail.record.nome, descricao: detail.record.descricao || '',
        padrao: detail.record.padrao, ativo: detail.record.ativo, vigencia_inicio: detail.record.vigencia_inicio || '', vigencia_fim: detail.record.vigencia_fim || '',
        itens: detail.items.map(item => ({ ...item, preco: Number(item.preco), preco_minimo: num(item.preco_minimo), desconto_maximo_percentual: num(item.desconto_maximo_percentual), quantidade_minima: Number(item.quantidade_minima) })),
      })
    } catch (openError) { setError(errorMessage(openError, 'Não foi possível abrir a tabela.')) }
  }

  const visible = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('pt-BR')
    return records.filter(record => !search || record.nome.toLocaleLowerCase('pt-BR').includes(search))
  }, [records, query])

  return <div className="flex min-h-full min-w-0 flex-col bg-white">
    <ErpWorkspaceHeader section="Vendas" title="Tabelas de preço" menuItems={[{ label: 'Atualizar dados', onSelect: () => void load() }]}
      primaryAction={<Button className={primaryButtonClass} onClick={() => setDraft(emptyDraft())}><Plus className="size-4" />Nova tabela</Button>} />
    <ErpModuleWorkspaceTabs sectionId="vendas" moduleId="tabelas-preco" />
    <ErpSearchToolbar query={query} onQueryChange={setQuery} placeholder="Pesquisar tabelas…" resultLabel={`${visible.length} de ${records.length} tabelas`} />
    <ErrorBanner error={error} />
    <div className="min-h-[300px] min-w-0 flex-1 overflow-x-auto"><Table className="erp-workspace-table min-w-[860px] border-b border-[#e7e7e4]">
      <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]"><TableHead className="erp-table-identity-heading">Tabela</TableHead><TableHead>Vigência</TableHead><TableHead className="text-right">Itens</TableHead><TableHead className="text-right">Clientes</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
      <TableBody>
        {loading ? <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>
          : visible.length === 0 ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-500">{records.length ? 'Nenhuma tabela corresponde à pesquisa.' : 'Nenhuma tabela de preço. Sem tabela, a venda usa o preço do cadastro.'}</TableCell></TableRow>
          : visible.map(record => <TableRow key={record.id} className="cursor-pointer hover:bg-[#fafaf8]" onClick={() => void open(record)}>
            <TableCell><span className="font-medium">{record.nome}</span>{record.padrao ? <span className="ml-2 rounded bg-[#eef7c8] px-1.5 py-0.5 text-xs text-[#3b4d00]">Padrão</span> : null}{record.descricao ? <p className="truncate text-xs text-gray-500">{record.descricao}</p> : null}</TableCell>
            <TableCell>{record.vigencia_inicio || record.vigencia_fim ? `${dateLabel(record.vigencia_inicio)} a ${dateLabel(record.vigencia_fim)}` : 'Sem prazo'}</TableCell>
            <TableCell className="text-right tabular-nums">{record.itens}</TableCell>
            <TableCell className="text-right tabular-nums">{record.clientes}</TableCell>
            <TableCell><ErpStatusBadge status={record.ativo ? 'ativo' : 'inativo'} /></TableCell>
          </TableRow>)}
      </TableBody></Table></div>
    {draft ? <PriceTableDialog draft={draft} onClose={() => setDraft(null)} onSaved={() => { setDraft(null); void load() }} /> : null}
  </div>
}

function PriceTableDialog({ draft: initial, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [kind, setKind] = useState<'produto' | 'servico'>('produto')
  const [picked, setPicked] = useState<Option | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const update = (patch: Partial<Draft>) => setDraft(current => ({ ...current, ...patch }))
  const updateItem = (index: number, patch: Partial<PriceItem>) => update({ itens: draft.itens.map((item, i) => i === index ? { ...item, ...patch } : item) })

  function addItem(option: Option | null) {
    setPicked(option)
    if (!option) return
    const catalog = option as Option & { valor_padrao?: number }
    update({ itens: [...draft.itens, { tipo: kind, item_id: option.id, item: option.nome, preco_cadastro: catalog.valor_padrao ?? null, preco: Number(catalog.valor_padrao || 0), preco_minimo: null, desconto_maximo_percentual: null, quantidade_minima: 1 }] })
    setPicked(null)
  }

  async function save() {
    setSaving(true); setError(null)
    const values = {
      nome: draft.nome, descricao: draft.descricao || null, padrao: draft.padrao, ativo: draft.ativo,
      vigencia_inicio: draft.vigencia_inicio || null, vigencia_fim: draft.vigencia_fim || null,
      itens: draft.itens.map(item => ({ tipo: item.tipo, item_id: Number(item.item_id), preco: item.preco, preco_minimo: item.preco_minimo, desconto_maximo_percentual: item.desconto_maximo_percentual, quantidade_minima: item.quantidade_minima })),
    }
    try {
      await erpJson(draft.id ? `/api/erp/tabelas-preco/${draft.id}` : '/api/erp/tabelas-preco',
        { method: draft.id ? 'PATCH' : 'POST', body: draft.id ? { expectedVersion: draft.versao, values } : { values } })
      onSaved()
    } catch (saveError) { setError(errorMessage(saveError, 'Não foi possível salvar a tabela.')) }
    finally { setSaving(false) }
  }

  async function remove() {
    if (!draft.id || !window.confirm(`Excluir a tabela "${draft.nome}"? Clientes vinculados voltam a usar a tabela padrão.`)) return
    setSaving(true); setError(null)
    try { await erpJson(`/api/erp/tabelas-preco/${draft.id}`, { method: 'DELETE', body: { expectedVersion: draft.versao } }); onSaved() }
    catch (removeError) { setError(errorMessage(removeError, 'Não foi possível excluir a tabela.')) }
    finally { setSaving(false) }
  }

  return <Dialog open onOpenChange={value => { if (!value) onClose() }}><DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
    <DialogHeader><DialogTitle>{draft.id ? 'Editar tabela de preço' : 'Nova tabela de preço'}</DialogTitle></DialogHeader>
    <div className="grid gap-4 py-2">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome"><input className={inputClass} value={draft.nome} onChange={event => update({ nome: event.target.value })} /></Field>
        <Field label="Descrição"><input className={inputClass} value={draft.descricao} onChange={event => update({ descricao: event.target.value })} /></Field>
        <Field label="Vigência — início"><input type="date" className={inputClass} value={draft.vigencia_inicio} onChange={event => update({ vigencia_inicio: event.target.value })} /></Field>
        <Field label="Vigência — fim"><input type="date" className={inputClass} value={draft.vigencia_fim} onChange={event => update({ vigencia_fim: event.target.value })} /></Field>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm"><Switch checked={draft.padrao} onCheckedChange={padrao => update({ padrao })} />Tabela padrão da empresa</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={draft.ativo} onCheckedChange={ativo => update({ ativo })} />Ativa</label>
      </div>
      <div className="grid gap-2 rounded-md border bg-[#fafaf8] p-3 md:grid-cols-[160px_minmax(0,1fr)]">
        <Field label="Adicionar"><select aria-label="Tipo de item" className={inputClass} value={kind} onChange={event => setKind(event.target.value as 'produto' | 'servico')}><option value="produto">Produto</option><option value="servico">Serviço</option></select></Field>
        <Field label={kind === 'produto' ? 'Produto' : 'Serviço'}><CatalogPicker key={kind} type={kind} label={kind} value={picked} onChange={addItem} /></Field>
      </div>
      <div className="overflow-x-auto rounded-md border"><Table className="min-w-[760px]">
        <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-24">Qtd. mín.</TableHead><TableHead className="w-28">Preço</TableHead><TableHead className="w-28">Preço mín.</TableHead><TableHead className="w-28">Desc. máx. %</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
        <TableBody>
          {draft.itens.length === 0 ? <TableRow><TableCell colSpan={6} className="h-16 text-center text-sm text-gray-500">Adicione produtos ou serviços. Repita o item com outra quantidade mínima para criar faixas.</TableCell></TableRow>
            : draft.itens.map((item, index) => <TableRow key={`${item.tipo}-${item.item_id}-${index}`}>
              <TableCell><span className="font-medium">{item.item}</span><p className="text-xs text-gray-500">{item.tipo === 'produto' ? 'Produto' : 'Serviço'}{item.preco_cadastro != null ? ` · cadastro ${currency(item.preco_cadastro)}` : ''}</p></TableCell>
              <TableCell><input aria-label="Quantidade mínima" className={inputClass} inputMode="decimal" defaultValue={item.quantidade_minima} onBlur={event => updateItem(index, { quantidade_minima: toNumber(event.target.value) ?? 1 })} /></TableCell>
              <TableCell><input aria-label="Preço" className={inputClass} inputMode="decimal" defaultValue={item.preco} onBlur={event => updateItem(index, { preco: toNumber(event.target.value) ?? 0 })} /></TableCell>
              <TableCell><input aria-label="Preço mínimo" className={inputClass} inputMode="decimal" defaultValue={item.preco_minimo ?? ''} onBlur={event => updateItem(index, { preco_minimo: toNumber(event.target.value) })} /></TableCell>
              <TableCell><input aria-label="Desconto máximo" className={inputClass} inputMode="decimal" defaultValue={item.desconto_maximo_percentual ?? ''} onBlur={event => updateItem(index, { desconto_maximo_percentual: toNumber(event.target.value) })} /></TableCell>
              <TableCell><Button variant="ghost" size="icon" aria-label="Remover item" onClick={() => update({ itens: draft.itens.filter((_, i) => i !== index) })}><Trash2 className="size-4" /></Button></TableCell>
            </TableRow>)}
        </TableBody></Table></div>
      <p className="text-xs text-gray-500">Desconto máximo vale por item, além do limite de desconto de cada usuário{draft.itens.some(item => item.desconto_maximo_percentual != null) ? ` (maior configurado: ${percent(Math.max(...draft.itens.map(item => item.desconto_maximo_percentual ?? 0)))})` : ''}.</p>
      <DialogError error={error} />
    </div>
    <DialogActions onCancel={onClose} onConfirm={() => void save()} saving={saving} label="Salvar tabela" disabled={!draft.nome.trim()}
      extra={draft.id ? <Button variant="ghost" className="text-rose-700" disabled={saving} onClick={() => void remove()}><Trash2 className="size-4" />Excluir</Button> : null} />
  </DialogContent></Dialog>
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { FileUp, Loader2, RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Option = { id: string; nome: string }
type PurchaseCandidate = { id: string; numero: string; total: number; fornecedor: string }
type Catalogs = { categories: Option[]; operationNatures: Option[]; purchaseCandidates: PurchaseCandidate[] }
type Invoice = { id: string; chave_acesso: string; numero: string; serie: string; fornecedor: string; valor_total: number; emitida_em: string; status: string; compra_id: string; compra_numero: string }
type ParsedInvoice = {
  chave_acesso: string; numero: string; serie: string; data_emissao: string;
  data_vencimento: string; destinatario_documento: string;
  fornecedor: { nome: string; documento: string };
  valor_produtos: number; valor_total: number; frete: number; desconto: number;
  itens: Array<{ codigo: string; descricao: string; ncm: string; cfop: string; unidade: string; quantidade: number; valor_unitario: number; valor_total: number }>;
  xml: string;
}

const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const textOf = (root: ParentNode, tag: string) => root.querySelector(tag)?.textContent?.trim() || ''
const numeric = (root: ParentNode, tag: string) => Number(textOf(root, tag) || 0)

function parseNfeXml(xml: string): ParsedInvoice {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const parserError = document.querySelector('parsererror')
  if (parserError) throw new Error('O arquivo XML esta invalido.')
  const info = document.querySelector('infNFe')
  if (!info) throw new Error('O arquivo nao contem uma NF-e valida.')
  const issuer = info.querySelector('emit')
  const recipient = info.querySelector('dest')
  const total = info.querySelector('ICMSTot')
  const rawKey = (info.getAttribute('Id') || textOf(document, 'chNFe')).replace(/^NFe/, '').replace(/\D/g, '')
  const issueText = textOf(info, 'dhEmi') || textOf(info, 'dEmi')
  const issueDate = issueText ? issueText.slice(0, 10) : new Date().toISOString().slice(0, 10)
  const dueDate = textOf(info, 'dup dVenc') || issueDate
  const items = Array.from(info.querySelectorAll('det')).map((detail) => {
    const product = detail.querySelector('prod') || detail
    return {
      codigo: textOf(product, 'cProd'), descricao: textOf(product, 'xProd'), ncm: textOf(product, 'NCM'),
      cfop: textOf(product, 'CFOP'), unidade: textOf(product, 'uCom') || 'UN', quantidade: numeric(product, 'qCom'),
      valor_unitario: numeric(product, 'vUnCom'), valor_total: numeric(product, 'vProd'),
    }
  })
  return {
    chave_acesso: rawKey, numero: textOf(info, 'ide nNF'), serie: textOf(info, 'ide serie'),
    data_emissao: issueDate, data_vencimento: dueDate,
    destinatario_documento: recipient ? textOf(recipient, 'CNPJ') || textOf(recipient, 'CPF') : '',
    fornecedor: { nome: issuer ? textOf(issuer, 'xNome') : '', documento: issuer ? textOf(issuer, 'CNPJ') || textOf(issuer, 'CPF') : '' },
    valor_produtos: total ? numeric(total, 'vProd') : 0, valor_total: total ? numeric(total, 'vNF') : 0,
    frete: total ? numeric(total, 'vFrete') : 0, desconto: total ? numeric(total, 'vDesc') : 0,
    itens: items, xml,
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(body.error || 'Nao foi possivel completar a operacao.')
  return body as T
}

export function PurchaseInvoicesPage() {
  const [records, setRecords] = useState<Invoice[]>([])
  const [catalogs, setCatalogs] = useState<Catalogs>({ categories: [], operationNatures: [], purchaseCandidates: [] })
  const [parsed, setParsed] = useState<ParsedInvoice | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [natureId, setNatureId] = useState('')
  const [purchaseId, setPurchaseId] = useState('')
  const [generatePurchase, setGeneratePurchase] = useState(true)
  const [generateFinancial, setGenerateFinancial] = useState(true)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [invoiceResponse, catalogResponse] = await Promise.all([
        fetch('/api/erp/notas-compra', { cache: 'no-store' }),
        fetch('/api/erp/compras/catalogos', { cache: 'no-store' }),
      ])
      setRecords((await parseResponse<{ records: Invoice[] }>(invoiceResponse)).records)
      setCatalogs(await parseResponse<Catalogs>(catalogResponse))
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar as notas.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function selectFile(file?: File) {
    if (!file) return
    setError(null)
    try { setParsed(parseNfeXml(await file.text())) }
    catch (parseError) { setParsed(null); setError(parseError instanceof Error ? parseError.message : 'XML invalido.') }
  }

  async function importInvoice() {
    if (!parsed) return
    setSaving(true); setError(null)
    try {
      await parseResponse(await fetch('/api/erp/notas-compra', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': parsed.chave_acesso },
        body: JSON.stringify({ values: { xml: parsed.xml, categoria_id: categoryId, natureza_operacao_id: natureId, compra_id: purchaseId, gerar_compra: generatePurchase, gera_financeiro: generateFinancial } }),
      }))
      setOpen(false); setParsed(null); await load()
    } catch (importError) { setError(importError instanceof Error ? importError.message : 'Nao foi possivel importar a NF-e.') }
    finally { setSaving(false) }
  }

  return <div className="flex min-h-full flex-col gap-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-medium text-gray-500">ERP / Compras</p><h1 className="mt-1 text-2xl font-semibold text-gray-950">Notas de compra</h1></div><div className="flex gap-2"><Button variant="outline" size="icon" title="Atualizar" onClick={() => void load()}><RefreshCw className="size-4" /></Button><Button onClick={() => { setParsed(null); setPurchaseId(''); setError(null); setOpen(true) }}><FileUp className="size-4" />Importar XML</Button></div></div>
    {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    <div className="overflow-hidden rounded-md border bg-white"><Table><TableHeader><TableRow className="bg-gray-50"><TableHead>Emissao</TableHead><TableHead>Nota</TableHead><TableHead>Fornecedor</TableHead><TableHead>Chave de acesso</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Vinculo</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
      {loading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow> : records.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-gray-500">Nenhuma NF-e de compra importada.</TableCell></TableRow> : records.map((record) => <TableRow key={record.id}><TableCell>{record.emitida_em ? record.emitida_em.slice(0, 10) : '-'}</TableCell><TableCell className="font-medium">{record.numero}/{record.serie}</TableCell><TableCell>{record.fornecedor}</TableCell><TableCell className="max-w-56 truncate font-mono text-xs">{record.chave_acesso}</TableCell><TableCell className="text-right font-medium">{currency(record.valor_total)}</TableCell><TableCell>{record.compra_numero || 'Sem compra'}</TableCell><TableCell><Badge variant="outline">{record.status}</Badge></TableCell></TableRow>)}
    </TableBody></Table></div>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Importar NF-e de compra</DialogTitle></DialogHeader><div className="grid gap-5 py-2">
      <div className="grid place-items-center rounded-md border border-dashed bg-gray-50 px-6 py-10"><input type="file" accept=".xml,application/xml,text/xml" className="block max-w-full text-sm" onChange={(event) => void selectFile(event.target.files?.[0])} /></div>
      {parsed ? <><div className="grid gap-px overflow-hidden rounded-md border bg-gray-200 sm:grid-cols-3"><Summary label="Fornecedor" value={parsed.fornecedor.nome} /><Summary label="Nota" value={`${parsed.numero}/${parsed.serie}`} /><Summary label="Total" value={currency(parsed.valor_total)} /></div><div className="grid gap-4 md:grid-cols-3"><div className="grid gap-2"><Label>Categoria financeira</Label><select value={categoryId} className="h-10 rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => setCategoryId(event.target.value)}><option value="">Selecione</option>{catalogs.categories.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></div><div className="grid gap-2"><Label>Natureza da operacao</Label><select value={natureId} className="h-10 rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => setNatureId(event.target.value)}><option value="">Selecione</option>{catalogs.operationNatures.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></div><div className="grid gap-2"><Label>Vincular compra existente</Label><select value={purchaseId} disabled={!generatePurchase} className="h-10 rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => setPurchaseId(event.target.value)}><option value="">Criar nova compra</option>{catalogs.purchaseCandidates.map((item) => <option key={item.id} value={item.id}>{item.numero} - {item.fornecedor} - {currency(item.total)}</option>)}</select></div></div><div className="flex flex-wrap gap-6"><div className="flex items-center gap-2"><Switch checked={generatePurchase} onCheckedChange={(checked) => { setGeneratePurchase(checked); if (!checked) setPurchaseId('') }} /><Label>Gerar ou vincular compra</Label></div><div className="flex items-center gap-2"><Switch checked={generateFinancial} onCheckedChange={setGenerateFinancial} disabled={!generatePurchase} /><Label>Gerar financeiro</Label></div></div><div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Unidade</TableHead><TableHead className="text-right">Quantidade</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{parsed.itens.map((item, index) => <TableRow key={`${item.codigo}-${index}`}><TableCell>{item.codigo} - {item.descricao}</TableCell><TableCell>{item.unidade}</TableCell><TableCell className="text-right">{item.quantidade}</TableCell><TableCell className="text-right">{currency(item.valor_total)}</TableCell></TableRow>)}</TableBody></Table></div></> : null}
    </div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={!parsed || saving} onClick={() => void importInvoice()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Importar NF-e</Button></div></DialogContent></Dialog>
  </div>
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div> }

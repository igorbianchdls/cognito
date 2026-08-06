'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import Papa from 'papaparse'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpStatusBadge } from '@/products/erp/frontend/components/ErpStatusBadge'

type ImportType = 'clientes' | 'fornecedores' | 'produtos' | 'servicos'
type ImportRecord = { id: string; arquivo: string; tipo: string; data: string; total_linhas: number; importadas: number; erros: number; status: string }

const types: Array<{ value: ImportType; label: string }> = [
  { value: 'clientes', label: 'Clientes' }, { value: 'fornecedores', label: 'Fornecedores' },
  { value: 'produtos', label: 'Produtos' }, { value: 'servicos', label: 'Servicos' },
]

export function ErpImportExportPage() {
  const [type, setType] = useState<ImportType>('clientes')
  const [file, setFile] = useState<File | null>(null)
  const [history, setHistory] = useState<ImportRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    const response = await fetch('/api/erp/operacoes/importacoes', { cache: 'no-store' })
    if (response.ok) {
      const body = await response.json() as { records: ImportRecord[] }
      setHistory(body.records)
    }
  }, [])

  useEffect(() => { void loadHistory() }, [loadHistory])

  const importFile = async () => {
    if (!file) { setError('Selecione um arquivo CSV.'); return }
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const rows = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
        Papa.parse<Record<string, unknown>>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          complete: (result) => result.errors.length ? reject(new Error(result.errors[0].message)) : resolve(result.data),
          error: (parseError) => reject(parseError),
        })
      })
      const response = await fetch(`/api/erp/importacoes/${type}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, rows }),
      })
      const result = await response.json() as { error?: string; imported?: number; errors?: number }
      if (!response.ok) throw new Error(result.error || 'Nao foi possivel importar o arquivo.')
      setMessage(`${result.imported || 0} registro(s) importado(s); ${result.errors || 0} erro(s).`)
      setFile(null)
      await loadHistory()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Nao foi possivel importar o arquivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-7">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-semibold tracking-normal text-gray-950">Importacao e exportacao</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">Mova cadastros por CSV com validacao individual, historico e relatorio de erros.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
        <div className="space-y-4">
          <div className="space-y-2"><Label htmlFor="import-type">Tipo de cadastro</Label><select id="import-type" value={type} onChange={(event) => setType(event.target.value as ImportType)} className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400">{types.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="import-file">Arquivo CSV</Label><Input id="import-file" type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} /></div>
          <div className="flex flex-wrap gap-2"><Button onClick={() => void importFile()} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}Importar</Button><Button variant="outline" asChild><a href={`/api/erp/importacoes/${type}`}><Download className="size-4" />Exportar {types.find((item) => item.value === type)?.label}</a></Button></div>
          {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        </div>
        <div className="border-l-0 border-gray-200 lg:border-l lg:pl-6">
          <FileSpreadsheet className="size-5 text-gray-500" />
          <h2 className="mt-3 text-sm font-semibold text-gray-950">Colunas reconhecidas</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">Clientes e fornecedores: nome, documento, email, telefone e cidade. Produtos: nome, SKU, preco e categoria. Servicos: nome, codigo, descricao, preco e custo.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-950">Historico</h2>
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <Table><TableHeader><TableRow className="hover:bg-white"><TableHead className="bg-gray-50">Arquivo</TableHead><TableHead className="bg-gray-50">Tipo</TableHead><TableHead className="bg-gray-50">Linhas</TableHead><TableHead className="bg-gray-50">Importadas</TableHead><TableHead className="bg-gray-50">Erros</TableHead><TableHead className="bg-gray-50">Status</TableHead></TableRow></TableHeader>
            <TableBody>{history.length ? history.map((record) => <TableRow key={record.id}><TableCell>{record.arquivo}</TableCell><TableCell>{record.tipo}</TableCell><TableCell>{record.total_linhas}</TableCell><TableCell>{record.importadas}</TableCell><TableCell>{record.erros}</TableCell><TableCell><ErpStatusBadge label={record.status} tone={record.status === 'concluida' ? 'success' : record.status === 'falha' ? 'danger' : 'warning'} /></TableCell></TableRow>) : <TableRow><TableCell colSpan={6} className="h-24 text-center text-sm text-gray-500">Nenhuma importacao realizada.</TableCell></TableRow>}</TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}

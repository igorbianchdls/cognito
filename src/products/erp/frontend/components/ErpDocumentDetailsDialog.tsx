'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type DetailRecord = Record<string, unknown>

function display(value: unknown) {
  if (value == null || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const headerFields = ['numero', 'status', 'tipo_movimento', 'cliente_nome', 'fornecedor_nome', 'data_venda', 'data_compra', 'data_prevista_entrega', 'total', 'observacoes']
const labels: Record<string, string> = {
  numero: 'Numero', status: 'Situacao', tipo_movimento: 'Movimento', cliente_nome: 'Cliente',
  fornecedor_nome: 'Fornecedor', data_venda: 'Data da venda', data_compra: 'Data da compra',
  data_prevista_entrega: 'Entrega prevista', total: 'Total', observacoes: 'Observacoes',
}

export function ErpDocumentDetailsDialog({ open, onOpenChange, title, loading, document, items, installments, events, invoices = [] }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  loading: boolean
  document?: DetailRecord | null
  items?: DetailRecord[]
  installments?: DetailRecord[]
  events?: DetailRecord[]
  invoices?: DetailRecord[]
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="h-[88vh] max-w-[min(980px,96vw)] overflow-hidden p-0">
      <DialogHeader className="border-b px-6 py-4"><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="overflow-y-auto px-6 py-5">
        {loading ? <div className="py-20 text-center text-sm text-gray-500">Carregando detalhes...</div> : document ? <div className="grid gap-6">
          <section className="grid gap-3"><h3 className="text-sm font-semibold">Informacoes</h3><dl className="grid gap-3 rounded-md border bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {headerFields.filter((key) => document[key] != null && document[key] !== '').map((key) => <div key={key}><dt className="text-xs text-gray-500">{labels[key]}</dt><dd className="mt-1 text-sm font-medium text-gray-900">{display(document[key])}</dd></div>)}
          </dl></section>
          <DetailTable title="Itens" rows={items || []} columns={['descricao', 'quantidade', 'valor_unitario', 'desconto', 'valor_desconto', 'total']} />
          <DetailTable title="Parcelas previstas" rows={installments || []} columns={['numero_parcela', 'data_vencimento', 'valor']} />
          {invoices.length ? <DetailTable title="Notas fiscais vinculadas" rows={invoices} columns={['numero', 'serie', 'chave_acesso', 'status', 'valor_total']} /> : null}
          <DetailTable title="Historico" rows={events || []} columns={['evento', 'status_anterior', 'status_novo', 'versao', 'criado_em']} />
        </div> : <div className="py-20 text-center text-sm text-gray-500">Documento nao encontrado.</div>}
      </div>
    </DialogContent>
  </Dialog>
}

function DetailTable({ title, rows, columns }: { title: string; rows: DetailRecord[]; columns: string[] }) {
  if (!rows.length) return null
  const visibleColumns = columns.filter((column) => rows.some((row) => row[column] != null && row[column] !== ''))
  return <section className="grid gap-3"><h3 className="text-sm font-semibold">{title}</h3><div className="overflow-hidden rounded-md border"><Table><TableHeader><TableRow className="bg-gray-50">{visibleColumns.map((column) => <TableHead key={column} className="text-xs uppercase">{column.replaceAll('_', ' ')}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={String(row.id || `${title}-${index}`)}>{visibleColumns.map((column) => <TableCell key={column} className="text-sm">{display(row[column])}</TableCell>)}</TableRow>)}</TableBody></Table></div></section>
}

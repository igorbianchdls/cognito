'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Receipt, CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

type ItemRow = {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  [key: string]: unknown;
}

type ContaPagarCriadaOutput = {
  success: boolean;
  // Preview mode
  preview?: boolean;
  payload?: {
    fornecedor_id: string;
    categoria_id?: string;
    centro_custo_id?: string;
    natureza_financeira_id?: string;
    tenant_id?: number | string;
    valor: number;
    data_vencimento: string;
    data_emissao?: string;
    numero_nota_fiscal?: string;
    descricao?: string;
    itens?: ItemRow[];
  };
  validations?: Array<{ field: string; status: 'ok' | 'warn' | 'error'; message?: string }>;
  metadata?: { entity?: string; action?: string; commitEndpoint?: string };
  // Created mode
  data: {
    id: string;
    fornecedor_id: string;
    categoria_id: string;
    centro_custo_id: string;
    natureza_financeira_id?: string | null;
    valor: number;
    valor_pago: number;
    valor_pendente: number;
    data_vencimento: string;
    data_emissao: string;
    data_cadastro: string;
    numero_nota_fiscal?: string | null;
    descricao?: string;
    status: string;
    itens: ItemRow[];
    quantidade_itens: number;
  };
  message: string;
  title?: string;
  resumo: {
    id: string;
    valor_formatado: string;
    data_vencimento: string;
    status_vencimento: string;
    dias_para_vencimento: number;
    numero_nota_fiscal: string;
    quantidade_itens: number;
  };
  error?: string;
}

type CreatedData = ContaPagarCriadaOutput['data']

export default function ContaPagarCriadaResult({ result }: { result: ContaPagarCriadaOutput }) {
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<CreatedData | null>(null)
  const isPreview = result.preview && result.payload && !created
  const hasErrors = (result.validations || []).some(v => v.status === 'error')
  // Display items in the table
  const tableRows: ItemRow[] = useMemo(() => {
    if (created) return created.itens || []
    if (isPreview) return result.payload?.itens || []
    return result.data?.itens || []
  }, [created, isPreview, result.data, result.payload]);

  const columns: ColumnDef<ItemRow>[] = useMemo(() => [
    {
      accessorKey: 'descricao',
      header: 'Descrição do Item',
      size: 300,
      minSize: 200,
      cell: ({ row }) => {
        const desc = row.original.descricao || '-';
        return <div className="text-sm">{desc}</div>;
      }
    },
    {
      accessorKey: 'quantidade',
      header: 'Quantidade',
      cell: ({ row }) => {
        const qtd = row.original.quantidade || 0;
        return <div className="text-sm text-center">{qtd}</div>;
      }
    },
    {
      accessorKey: 'valor_unitario',
      header: 'Valor Unitário',
      cell: ({ row }) => {
        const valor = row.original.valor_unitario || 0;
        return (
          <div className="text-sm">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    },
    {
      accessorKey: 'valor_total',
      header: 'Valor Total',
      cell: ({ row }) => {
        const valor = row.original.valor_total || 0;
        return (
          <div className="font-bold text-red-600">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    }
  ], []);

  const commit = async () => {
    if (!result.metadata?.commitEndpoint || !result.payload) return
    try {
      setCreating(true)
      // Se houver itens, enviar JSON (header + linhas) em uma única transação
      const hasItens = Array.isArray(result.payload.itens) && result.payload.itens.length > 0
      const dataLanc = result.payload.data_emissao || new Date().toISOString().slice(0,10)
      let res: Response
      if (hasItens) {
        const linhas = (result.payload.itens || []).map((it, idx) => {
          const bruto = (typeof it.valor_total === 'number' ? it.valor_total : (it.quantidade || 0) * (it.valor_unitario || 0)) || 0
          const liquido = (typeof it.valor_total === 'number' ? it.valor_total : (it.quantidade || 0) * (it.valor_unitario || 0)) || 0
          return {
            tipo_linha: 'parcela',
            numero_parcela: idx + 1,
            valor_bruto: bruto,
            juros: 0,
            multa: 0,
            desconto: 0,
            valor_liquido: liquido,
            data_vencimento: result.payload!.data_vencimento,
            status: 'pendente',
            observacao: it.descricao || undefined,
          }
        })
        const headerValor = Number(result.payload.valor || 0)
        const valorFromLinhas = linhas.reduce((acc, ln) => acc + Number(ln.valor_liquido || 0), 0)
        const body = {
          fornecedor_id: result.payload.fornecedor_id,
          categoria_id: result.payload.categoria_id || undefined,
          descricao: result.payload.descricao || 'Conta a pagar',
          valor: headerValor > 0 ? headerValor : valorFromLinhas,
          data_lancamento: dataLanc,
          data_vencimento: result.payload.data_vencimento,
          status: 'pendente',
          tenant_id: result.payload.tenant_id ?? 1,
          // Enviar itens para persistir em financeiro.lancamentos_financeiros_itens
          itens: result.payload.itens,
          linhas,
        }
        res = await fetch(result.metadata.commitEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } else {
        // Fallback: FormData (cabeçalho apenas)
        const fd = new FormData()
        fd.set('descricao', String(result.payload.descricao || 'Conta a pagar'))
        fd.set('valor', String(result.payload.valor))
        fd.set('data_lancamento', dataLanc)
        fd.set('data_vencimento', result.payload.data_vencimento)
        fd.set('status', 'pendente')
        if (result.payload.fornecedor_id) fd.set('entidade_id', result.payload.fornecedor_id)
        if (result.payload.categoria_id) fd.set('categoria_id', result.payload.categoria_id)
        fd.set('tenant_id', String(result.payload.tenant_id ?? 1))
        res = await fetch(result.metadata.commitEndpoint, { method: 'POST', body: fd })
      }
      const json = await res.json()
      if (!res.ok || !json?.success) {
        alert(json?.message || 'Falha ao criar conta a pagar')
        setCreating(false)
        return
      }
      // Minimal created response
      const createdData: CreatedData = {
        id: String(json.id),
        fornecedor_id: result.payload.fornecedor_id || '',
        categoria_id: result.payload.categoria_id || '',
        centro_custo_id: result.payload.centro_custo_id || '',
        natureza_financeira_id: result.payload.natureza_financeira_id || null,
        valor: result.payload.valor,
        valor_pago: 0,
        valor_pendente: result.payload.valor,
        data_vencimento: result.payload.data_vencimento,
        data_emissao: dataLanc,
        data_cadastro: new Date().toISOString(),
        numero_nota_fiscal: result.payload.numero_nota_fiscal || null,
        descricao: result.payload.descricao || '',
        status: 'pendente',
        itens: result.payload.itens || [],
        quantidade_itens: (result.payload.itens || []).length
      }
      setCreated(createdData)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar conta a pagar')
    } finally {
      setCreating(false)
    }
  }

  // Summary content (preview or created)
  const summaryValor = created ? created.valor : (isPreview ? (result.payload?.valor || 0) : (result.data?.valor || 0))
  const summaryVenc = created ? created.data_vencimento : (isPreview ? (result.payload?.data_vencimento || '') : result.resumo.data_vencimento)
  const summaryNF = created ? (created.numero_nota_fiscal || '-') : (isPreview ? (result.payload?.numero_nota_fiscal || '-') : result.resumo.numero_nota_fiscal)
  const summaryId = created ? created.id : (isPreview ? '-' : result.resumo.id)
  // Mostrar sempre o ID do fornecedor no 4º campo
  const summaryFornecedorId = created
    ? created.fornecedor_id
    : (isPreview
        ? (result.payload?.fornecedor_id || '-')
        : (result.data?.fornecedor_id || '-'))

  return (
    <div className="space-y-4">
      <div className={isPreview ? 'bg-blue-50 border border-blue-200 rounded-lg p-4' : 'bg-green-50 border border-green-200 rounded-lg p-4'}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className={isPreview ? 'h-6 w-6 text-blue-600 mt-0.5' : 'h-6 w-6 text-green-600 mt-0.5'} />
          <div className="flex-1">
            <h3 className={isPreview ? 'font-semibold text-blue-900 mb-2' : 'font-semibold text-green-900 mb-2'}>
              {isPreview ? (result.title || 'Conta a Pagar (Prévia)') : (result.title || 'Conta a Pagar Criada')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Valor Total:</span>
                <div className={isPreview ? 'text-blue-900 font-bold text-lg' : 'text-green-900 font-bold text-lg'}>
                  {Number(summaryValor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Vencimento:</span>
                <div className={isPreview ? 'text-blue-900' : 'text-green-900'}>
                  {summaryVenc ? new Date(summaryVenc).toLocaleDateString('pt-BR') : '-'}
                </div>
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>NF:</span>
                <div className={isPreview ? 'text-blue-900' : 'text-green-900'}>{summaryNF}</div>
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>ID do Fornecedor:</span>
                <div className={isPreview ? 'text-blue-900 font-mono text-xs' : 'text-green-900 font-mono text-xs'}>{summaryFornecedorId}</div>
              </div>
            </div>
          </div>
          {isPreview && (
            <div className="ml-auto">
              <Button onClick={commit} disabled={creating || hasErrors}>
                {creating ? 'Criando…' : 'Criar Conta a Pagar'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {tableRows.length > 0 && (
        <ArtifactDataTable
          data={tableRows}
          columns={columns}
          title="Itens da Nota Fiscal"
          icon={Receipt}
          iconColor="text-red-600"
          message={`${tableRows.length} ${tableRows.length === 1 ? 'item' : 'itens'} na nota fiscal`}
          success={result.success}
          count={tableRows.length}
          error={result.error}
          exportFileName={`conta_pagar_itens_${summaryId}`}
          pageSize={10}
        />
      )}
    </div>
  );
}

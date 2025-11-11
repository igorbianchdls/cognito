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

export default function ContaPagarCriadaResult({ result }: { result: ContaPagarCriadaOutput }) {
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<typeof result.data | null>(null)
  const isPreview = result.preview && result.payload && !created
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
      const fd = new FormData()
      // Mapear payload -> campos do endpoint existente
      fd.set('descricao', String(result.payload.descricao || 'Conta a pagar'))
      fd.set('valor', String(result.payload.valor))
      // data_lancamento: usar data_emissao ou hoje
      const dataLanc = result.payload.data_emissao || new Date().toISOString().slice(0,10)
      fd.set('data_lancamento', dataLanc)
      fd.set('data_vencimento', result.payload.data_vencimento)
      fd.set('status', 'pendente')
      if (result.payload.fornecedor_id) fd.set('entidade_id', result.payload.fornecedor_id)
      if (result.payload.categoria_id) fd.set('categoria_id', result.payload.categoria_id)
      // conta_financeira_id opcional - não disponível em payload

      const res = await fetch(result.metadata.commitEndpoint, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        alert(json?.message || 'Falha ao criar conta a pagar')
        setCreating(false)
        return
      }
      // Minimal created response: buscar novamente não é possível; compor resumo simples
      const createdData = {
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
      setCreated(createdData as any)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar conta a pagar')
    } finally {
      setCreating(false)
    }
  }

  // Summary content (preview or created)
  const summaryValor = created ? created.valor : (isPreview ? (result.payload?.valor || 0) : (result.data?.valor || 0))
  const summaryVenc = created ? created.data_vencimento : (isPreview ? (result.payload?.data_vencimento || '') : result.resumo.data_vencimento)
  const summaryId = created ? created.id : (isPreview ? '-' : result.resumo.id)
  const summaryNF = created ? (created.numero_nota_fiscal || '-') : (isPreview ? (result.payload?.numero_nota_fiscal || '-') : result.resumo.numero_nota_fiscal)

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
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>ID:</span>
                <div className={isPreview ? 'text-blue-900 font-mono text-xs' : 'text-green-900 font-mono text-xs'}>{summaryId}</div>
              </div>
            </div>
          </div>
          {isPreview && (
            <div className="ml-auto">
              <Button onClick={commit} disabled={creating}>
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

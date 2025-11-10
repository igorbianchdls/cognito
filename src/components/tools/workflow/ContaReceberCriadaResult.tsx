'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Receipt, CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'

type ItemRow = {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  [key: string]: unknown;
}

type ContaReceberCriadaOutput = {
  success: boolean;
  data: {
    id: string;
    cliente_id: string;
    categoria_id: string;
    centro_custo_id: string;
    natureza_financeira_id?: string | null;
    valor: number;
    valor_recebido: number;
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

export default function ContaReceberCriadaResult({ result }: { result: ContaReceberCriadaOutput }) {
  // Display items in the table
  const tableRows: ItemRow[] = useMemo(() => {
    return result.data?.itens || [];
  }, [result.data]);

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
          <div className="font-bold text-green-600">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-2">
              {result.title || 'Conta a Receber Criada'}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Valor Total:</span>
                <div className="text-green-900 font-bold text-lg">
                  {result.resumo.valor_formatado}
                </div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Vencimento:</span>
                <div className="text-green-900">
                  {new Date(result.resumo.data_vencimento).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-xs mt-1">{result.resumo.status_vencimento}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">NF:</span>
                <div className="text-green-900">{result.resumo.numero_nota_fiscal}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">ID:</span>
                <div className="text-green-900 font-mono text-xs">{result.resumo.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      {tableRows.length > 0 && (
        <ArtifactDataTable
          data={tableRows}
          columns={columns}
          title="Itens da Nota Fiscal"
          icon={Receipt}
          iconColor="text-green-600"
          message={`${tableRows.length} ${tableRows.length === 1 ? 'item' : 'itens'} na nota fiscal`}
          success={result.success}
          count={tableRows.length}
          error={result.error}
          exportFileName={`conta_receber_itens_${result.data.id}`}
          pageSize={10}
        />
      )}
    </div>
  );
}

'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { useMemo } from 'react'

type LancamentoRow = {
  id: string;
  tipo: string;
  data: string;
  descricao: string;
  valor: number;
  forma_pagamento: string;
  status: string;
  conciliado: boolean;
  [key: string]: unknown;
}

type LancamentosFinanceirosOutput = {
  success: boolean;
  data: LancamentoRow[];
  message: string;
  title?: string;
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  totais: {
    total_lancamentos: number;
    pagamentos_efetuados: number;
    pagamentos_recebidos: number;
    valor_saidas: number;
    valor_entradas: number;
  };
  error?: string;
}

export default function LancamentosFinanceirosResult({ result }: { result: LancamentosFinanceirosOutput }) {
  const tableRows: LancamentoRow[] = useMemo(() => {
    return result.data || [];
  }, [result.data]);

  const columns: ColumnDef<LancamentoRow>[] = useMemo(() => [
    {
      accessorKey: 'data',
      header: 'Data',
      size: 120,
      cell: ({ row }) => {
        const data = row.original.data;
        return <div className="text-sm">{new Date(data).toLocaleDateString('pt-BR')}</div>;
      }
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      size: 150,
      cell: ({ row }) => {
        const tipo = row.original.tipo;
        const isPagamento = tipo === 'pagamento_efetuado';
        const color = isPagamento ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
        const label = isPagamento ? 'Pagamento Efetuado' : 'Pagamento Recebido';
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
            {label}
          </span>
        );
      }
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const desc = row.original.descricao || '-';
        return <div className="text-sm">{desc}</div>;
      }
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => {
        const valor = row.original.valor || 0;
        const tipo = row.original.tipo;
        const color = tipo === 'pagamento_efetuado' ? 'text-red-700' : 'text-green-700';
        return (
          <div className={`font-bold ${color}`}>
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    },
    {
      accessorKey: 'forma_pagamento',
      header: 'Forma Pgto',
      size: 120,
      cell: ({ row }) => {
        const forma = row.original.forma_pagamento;
        return <div className="text-sm text-muted-foreground uppercase">{forma}</div>;
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: ({ row }) => {
        const status = row.original.status;
        if (!status) return '-';
        return <StatusBadge value={status} type="status" />;
      }
    },
    {
      accessorKey: 'conciliado',
      header: 'Conciliado',
      size: 100,
      cell: ({ row }) => {
        const conciliado = row.original.conciliado;
        return conciliado ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-400" />
        );
      }
    }
  ], []);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <DollarSign className="h-6 w-6 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              {result.title || 'Lançamentos Financeiros'}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Período:</span>
                <div className="text-blue-900">
                  {new Date(result.periodo.data_inicio).toLocaleDateString('pt-BR')} a{' '}
                  {new Date(result.periodo.data_fim).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Total Lançamentos:</span>
                <div className="text-blue-900 font-semibold">{result.totais.total_lancamentos}</div>
              </div>
            </div>

            {/* Totals */}
            <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700">Pagamentos Efetuados:</span>
                <div className="text-red-600 font-semibold">
                  {result.totais.valor_saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-blue-600">{result.totais.pagamentos_efetuados} lançamentos</div>
              </div>
              <div>
                <span className="text-blue-700">Pagamentos Recebidos:</span>
                <div className="text-green-600 font-semibold">
                  {result.totais.valor_entradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-blue-600">{result.totais.pagamentos_recebidos} lançamentos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <ArtifactDataTable
        data={tableRows}
        columns={columns}
        title="Lançamentos do Período"
        icon={DollarSign}
        iconColor="text-blue-600"
        message={result.message}
        success={result.success}
        count={tableRows.length}
        error={result.error}
        exportFileName="lancamentos_financeiros"
        pageSize={20}
      />
    </div>
  );
}

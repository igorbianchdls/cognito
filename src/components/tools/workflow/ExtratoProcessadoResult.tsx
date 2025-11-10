'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useMemo } from 'react'

type TransacaoRow = {
  data: string;
  descricao: string;
  valor: number;
  tipo: 'debito' | 'credito';
  saldo_apos?: number;
  [key: string]: unknown;
}

type ExtratoProcessadoOutput = {
  success: boolean;
  data: {
    banco: string;
    conta: string;
    agencia?: string;
    periodo: {
      data_inicio: string;
      data_fim: string;
      dias: number;
    };
    saldos: {
      inicial: number;
      final: number;
      calculado: number;
      conferido: boolean;
    };
    totais: {
      transacoes: number;
      debitos: number;
      creditos: number;
      quantidade_debitos: number;
      quantidade_creditos: number;
    };
    transacoes: TransacaoRow[];
  };
  message: string;
  title?: string;
  resumo: {
    banco: string;
    conta: string;
    periodo: string;
    total_transacoes: number;
    saldo_conferido: boolean;
  };
  error?: string;
}

export default function ExtratoProcessadoResult({ result }: { result: ExtratoProcessadoOutput }) {
  const tableRows: TransacaoRow[] = useMemo(() => {
    return result.data?.transacoes || [];
  }, [result.data]);

  const columns: ColumnDef<TransacaoRow>[] = useMemo(() => [
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
      accessorKey: 'descricao',
      header: 'Descrição',
      size: 300,
      minSize: 200,
      cell: ({ row }) => {
        const desc = row.original.descricao || '-';
        return <div className="text-sm">{desc}</div>;
      }
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      size: 100,
      cell: ({ row }) => {
        const tipo = row.original.tipo;
        const color = tipo === 'debito' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
        const label = tipo === 'debito' ? 'Débito' : 'Crédito';
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
            {label}
          </span>
        );
      }
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => {
        const valor = row.original.valor || 0;
        const tipo = row.original.tipo;
        const color = tipo === 'debito' ? 'text-red-700' : 'text-green-700';
        return (
          <div className={`font-semibold ${color}`}>
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    },
    {
      accessorKey: 'saldo_apos',
      header: 'Saldo',
      cell: ({ row }) => {
        const saldo = row.original.saldo_apos;
        if (saldo === undefined) return '-';
        return (
          <div className="text-sm font-medium">
            {Number(saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    }
  ], []);

  const Icon = result.data?.saldos.conferido ? CheckCircle : AlertCircle;
  const iconColor = result.data?.saldos.conferido ? 'text-green-600' : 'text-orange-600';

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-6 w-6 ${iconColor} mt-0.5`} />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              {result.title || 'Extrato Processado'}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Banco/Conta:</span>
                <div className="text-blue-900 font-semibold">
                  {result.data.banco} - {result.data.conta}
                </div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Período:</span>
                <div className="text-blue-900">{result.resumo.periodo}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Transações:</span>
                <div className="text-blue-900 font-semibold">{result.data.totais.transacoes}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Saldo Conferido:</span>
                <div className={result.data.saldos.conferido ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                  {result.data.saldos.conferido ? '✓ Sim' : '⚠ Divergência'}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-blue-700">Débitos:</span>
                <div className="text-red-600 font-semibold">
                  {result.data.totais.debitos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-blue-600">{result.data.totais.quantidade_debitos} transações</div>
              </div>
              <div>
                <span className="text-blue-700">Créditos:</span>
                <div className="text-green-600 font-semibold">
                  {result.data.totais.creditos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-blue-600">{result.data.totais.quantidade_creditos} transações</div>
              </div>
              <div>
                <span className="text-blue-700">Saldo Final:</span>
                <div className="text-blue-900 font-bold">
                  {result.data.saldos.final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <ArtifactDataTable
        data={tableRows}
        columns={columns}
        title="Transações do Extrato"
        icon={FileText}
        iconColor="text-blue-600"
        message={result.message}
        success={result.success}
        count={tableRows.length}
        error={result.error}
        exportFileName={`extrato_${result.data.banco}_${result.data.conta}`}
        pageSize={20}
      />
    </div>
  );
}

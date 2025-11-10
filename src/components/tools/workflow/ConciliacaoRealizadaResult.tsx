'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'

type ConciliadaRow = {
  data: string;
  descricao: string;
  valor: number;
  lancamento_id: string;
  score?: number;
}

type PossivelRow = {
  data: string;
  descricao: string;
  valor: number;
  possivel_lancamento: string;
  score?: number;
}

type DivergenciaRow = {
  data: string;
  descricao: string;
  valor: number;
}

type ConciliacaoRealizadaOutput = {
  success: boolean;
  data: {
    extrato_id: string;
    conciliacoes: unknown[];
    data_conciliacao: string;
  };
  message: string;
  title?: string;
  resumo: {
    total: number;
    conciliadas: number;
    possiveis_matches: number;
    divergencias: number;
    taxa_conciliacao: string;
  };
  detalhamento: {
    conciliadas: ConciliadaRow[];
    possiveis: PossivelRow[];
    divergencias: DivergenciaRow[];
  };
  error?: string;
}

export default function ConciliacaoRealizadaResult({ result }: { result: ConciliacaoRealizadaOutput }) {
  const conciliadasColumns: ColumnDef<ConciliadaRow>[] = useMemo(() => [
    {
      accessorKey: 'data',
      header: 'Data',
      size: 120,
      cell: ({ row }) => <div className="text-sm">{new Date(row.original.data).toLocaleDateString('pt-BR')}</div>
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      size: 300,
      cell: ({ row }) => <div className="text-sm">{row.original.descricao}</div>
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => (
        <div className="font-semibold">
          {Number(row.original.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )
    },
    {
      accessorKey: 'lancamento_id',
      header: 'Lançamento',
      cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{row.original.lancamento_id}</div>
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) => {
        const score = row.original.score || 0;
        return <div className="text-green-600 font-semibold">{score}%</div>
      }
    }
  ], []);

  const possiveisColumns: ColumnDef<PossivelRow>[] = useMemo(() => [
    {
      accessorKey: 'data',
      header: 'Data',
      size: 120,
      cell: ({ row }) => <div className="text-sm">{new Date(row.original.data).toLocaleDateString('pt-BR')}</div>
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      size: 250,
      cell: ({ row }) => <div className="text-sm">{row.original.descricao}</div>
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => (
        <div className="font-semibold">
          {Number(row.original.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )
    },
    {
      accessorKey: 'possivel_lancamento',
      header: 'Possível Match',
      size: 250,
      cell: ({ row }) => <div className="text-sm text-orange-700">{row.original.possivel_lancamento}</div>
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) => {
        const score = row.original.score || 0;
        return <div className="text-orange-600 font-semibold">{score}%</div>
      }
    }
  ], []);

  const divergenciasColumns: ColumnDef<DivergenciaRow>[] = useMemo(() => [
    {
      accessorKey: 'data',
      header: 'Data',
      size: 120,
      cell: ({ row }) => <div className="text-sm">{new Date(row.original.data).toLocaleDateString('pt-BR')}</div>
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      size: 350,
      cell: ({ row }) => <div className="text-sm">{row.original.descricao}</div>
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => (
        <div className="font-semibold text-red-700">
          {Number(row.original.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-2">
              {result.title || 'Conciliação Realizada'}
            </h3>
            <p className="text-sm text-green-700 mb-3">{result.message}</p>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Total:</span>
                <div className="text-green-900 font-bold text-lg">{result.resumo.total}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Conciliadas:</span>
                <div className="text-green-600 font-bold text-lg">{result.resumo.conciliadas}</div>
              </div>
              <div>
                <span className="text-orange-700 font-medium">Possíveis:</span>
                <div className="text-orange-600 font-bold text-lg">{result.resumo.possiveis_matches}</div>
              </div>
              <div>
                <span className="text-red-700 font-medium">Divergências:</span>
                <div className="text-red-600 font-bold text-lg">{result.resumo.divergencias}</div>
              </div>
            </div>

            {/* Taxa */}
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Taxa de Conciliação:</span>
                <span className="text-green-900 font-bold text-lg">{result.resumo.taxa_conciliacao}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conciliadas Section */}
      {result.detalhamento.conciliadas.length > 0 && (
        <ArtifactDataTable
          data={result.detalhamento.conciliadas}
          columns={conciliadasColumns}
          title="✅ Conciliadas Automaticamente"
          icon={CheckCircle2}
          iconColor="text-green-600"
          message={`${result.detalhamento.conciliadas.length} transações conciliadas com sucesso`}
          success={true}
          count={result.detalhamento.conciliadas.length}
          exportFileName="conciliadas"
          pageSize={10}
        />
      )}

      {/* Possíveis Matches Section */}
      {result.detalhamento.possiveis.length > 0 && (
        <ArtifactDataTable
          data={result.detalhamento.possiveis}
          columns={possiveisColumns}
          title="⚠️ Possíveis Matches (Requer Confirmação)"
          icon={AlertTriangle}
          iconColor="text-orange-600"
          message={`${result.detalhamento.possiveis.length} transações com possível correspondência`}
          success={true}
          count={result.detalhamento.possiveis.length}
          exportFileName="possiveis_matches"
          pageSize={10}
        />
      )}

      {/* Divergências Section */}
      {result.detalhamento.divergencias.length > 0 && (
        <ArtifactDataTable
          data={result.detalhamento.divergencias}
          columns={divergenciasColumns}
          title="❌ Divergências (Sem Match Encontrado)"
          icon={XCircle}
          iconColor="text-red-600"
          message={`${result.detalhamento.divergencias.length} transações sem correspondência no sistema`}
          success={true}
          count={result.detalhamento.divergencias.length}
          exportFileName="divergencias"
          pageSize={10}
        />
      )}
    </div>
  );
}

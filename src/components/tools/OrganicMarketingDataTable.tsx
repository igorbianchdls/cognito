'use client';

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';

interface MarketingRecord {
  id: string | number;
  // Campos comuns
  plataforma?: string;
  status?: string;
  tipo_post?: string;

  // Campos de contas_sociais
  nome_conta?: string;
  conectado_em?: string;

  // Campos de publicacoes
  titulo?: string;
  hook?: string;
  publicado_em?: string;
  criado_em?: string;

  // Campos de metricas
  curtidas?: number;
  comentarios?: number;
  compartilhamentos?: number;
  visualizacoes?: number;
  salvamentos?: number;
  alcance?: number;
  taxa_engajamento?: number;
  registrado_em?: string;

  // Campos de resumos_conta
  seguidores?: number;
  seguindo?: number;
  total_publicacoes?: number;
  alcance_total?: number;

  [key: string]: unknown;
}

interface OrganicMarketingDataTableProps {
  success: boolean;
  count: number;
  rows: MarketingRecord[];
  table: string;
  message: string;
  error?: string;
  sql_query?: string;
  sql_params?: string;
}

const getPlataformaColor = (plataforma?: string) => {
  const p = plataforma?.toLowerCase() || '';
  if (p.includes('instagram')) return 'bg-pink-100 text-pink-800 border-pink-300';
  if (p.includes('facebook')) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (p.includes('linkedin')) return 'bg-sky-100 text-sky-800 border-sky-300';
  if (p.includes('twitter') || p.includes('x')) return 'bg-gray-100 text-gray-800 border-gray-300';
  if (p.includes('youtube')) return 'bg-red-100 text-red-800 border-red-300';
  if (p.includes('tiktok')) return 'bg-purple-100 text-purple-800 border-purple-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'publicado': return 'bg-green-100 text-green-800 border-green-300';
    case 'agendado': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'rascunho': return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'cancelado': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export default function OrganicMarketingDataTable({ success, count, rows, table, message, error, sql_query }: OrganicMarketingDataTableProps) {
  const data = useMemo(() => rows ?? [], [rows]);

  const columns: ColumnDef<MarketingRecord>[] = useMemo(() => {
    const baseColumns: ColumnDef<MarketingRecord>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-xs">#{String(row.getValue('id')).substring(0, 8)}</span>,
      },
    ];

    // Colunas específicas por tabela
    if (table === 'contas_sociais') {
      return [
        ...baseColumns,
        {
          accessorKey: 'plataforma',
          header: 'Plataforma',
          cell: ({ row }) => {
            const plataforma = row.getValue<string | undefined>('plataforma');
            return plataforma ? <Badge className={getPlataformaColor(plataforma)}>{plataforma}</Badge> : '-';
          },
        },
        {
          accessorKey: 'nome_conta',
          header: 'Nome da Conta',
          cell: ({ row }) => {
            const nome = row.getValue<string | undefined>('nome_conta');
            return nome ? <span className="font-medium">{nome}</span> : '-';
          },
        },
        {
          accessorKey: 'conectado_em',
          header: 'Conectado em',
          cell: ({ row }) => {
            const data = row.getValue<string | undefined>('conectado_em');
            return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
          },
        },
      ];
    }

    if (table === 'publicacoes') {
      return [
        ...baseColumns,
        {
          accessorKey: 'nome_conta',
          header: 'Conta',
          cell: ({ row }) => {
            const nome = row.getValue<string | undefined>('nome_conta');
            return nome ? <span className="font-medium">{nome}</span> : '-';
          },
        },
        {
          accessorKey: 'plataforma',
          header: 'Plataforma',
          cell: ({ row }) => {
            const plataforma = row.getValue<string | undefined>('plataforma');
            return plataforma ? <Badge className={getPlataformaColor(plataforma)}>{plataforma}</Badge> : '-';
          },
        },
        {
          accessorKey: 'titulo',
          header: 'Título',
          cell: ({ row }) => {
            const titulo = row.getValue<string | undefined>('titulo');
            return titulo ? <span className="max-w-xs truncate block font-medium">{titulo}</span> : '-';
          },
        },
        {
          accessorKey: 'tipo_post',
          header: 'Tipo',
          cell: ({ row }) => {
            const tipo = row.getValue<string | undefined>('tipo_post');
            return tipo ? <Badge variant="outline">{tipo}</Badge> : '-';
          },
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue<string | undefined>('status');
            return status ? <Badge className={getStatusColor(status)}>{status}</Badge> : '-';
          },
        },
        {
          accessorKey: 'publicado_em',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Publicado em
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const data = row.getValue<string | undefined>('publicado_em');
            return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
          },
        },
      ];
    }

    if (table === 'metricas_publicacoes') {
      return [
        ...baseColumns,
        {
          accessorKey: 'nome_conta',
          header: 'Conta',
          cell: ({ row }) => {
            const nome = row.getValue<string | undefined>('nome_conta');
            return nome ? <span className="font-medium">{nome}</span> : '-';
          },
        },
        {
          accessorKey: 'plataforma',
          header: 'Plataforma',
          cell: ({ row }) => {
            const plataforma = row.getValue<string | undefined>('plataforma');
            return plataforma ? <Badge className={getPlataformaColor(plataforma)}>{plataforma}</Badge> : '-';
          },
        },
        {
          accessorKey: 'titulo',
          header: 'Título',
          cell: ({ row }) => {
            const titulo = row.getValue<string | undefined>('titulo');
            return titulo ? <span className="max-w-xs truncate block font-medium">{titulo}</span> : '-';
          },
        },
        {
          accessorKey: 'curtidas',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Curtidas
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('curtidas');
            return val !== undefined ? <span className="font-bold text-pink-600">{val.toLocaleString('pt-BR')}</span> : '-';
          },
        },
        {
          accessorKey: 'comentarios',
          header: 'Comentários',
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('comentarios');
            return val !== undefined ? val.toLocaleString('pt-BR') : '-';
          },
        },
        {
          accessorKey: 'compartilhamentos',
          header: 'Compartilhamentos',
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('compartilhamentos');
            return val !== undefined ? val.toLocaleString('pt-BR') : '-';
          },
        },
        {
          accessorKey: 'visualizacoes',
          header: 'Visualizações',
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('visualizacoes');
            return val !== undefined ? val.toLocaleString('pt-BR') : '-';
          },
        },
        {
          accessorKey: 'alcance',
          header: 'Alcance',
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('alcance');
            return val !== undefined ? val.toLocaleString('pt-BR') : '-';
          },
        },
        {
          accessorKey: 'taxa_engajamento',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Taxa Engajamento
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('taxa_engajamento');
            return val !== undefined ? (
              <span className="font-bold text-green-600">{(val * 100).toFixed(2)}%</span>
            ) : '-';
          },
        },
        {
          accessorKey: 'registrado_em',
          header: 'Data',
          cell: ({ row }) => {
            const data = row.getValue<string | undefined>('registrado_em');
            return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
          },
        },
      ];
    }

    if (table === 'resumos_conta') {
      return [
        ...baseColumns,
        {
          accessorKey: 'nome_conta',
          header: 'Conta',
          cell: ({ row }) => {
            const nome = row.getValue<string | undefined>('nome_conta');
            return nome ? <span className="font-medium">{nome}</span> : '-';
          },
        },
        {
          accessorKey: 'plataforma',
          header: 'Plataforma',
          cell: ({ row }) => {
            const plataforma = row.getValue<string | undefined>('plataforma');
            return plataforma ? <Badge className={getPlataformaColor(plataforma)}>{plataforma}</Badge> : '-';
          },
        },
        {
          accessorKey: 'seguidores',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Seguidores
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('seguidores');
            return val !== undefined ? <span className="font-bold">{val.toLocaleString('pt-BR')}</span> : '-';
          },
        },
        {
          accessorKey: 'seguindo',
          header: 'Seguindo',
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('seguindo');
            return val !== undefined ? val.toLocaleString('pt-BR') : '-';
          },
        },
        {
          accessorKey: 'total_publicacoes',
          header: 'Total de Posts',
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('total_publicacoes');
            return val !== undefined ? val.toLocaleString('pt-BR') : '-';
          },
        },
        {
          accessorKey: 'taxa_engajamento',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Taxa Engajamento
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('taxa_engajamento');
            return val !== undefined ? (
              <span className="font-bold text-green-600">{(val * 100).toFixed(2)}%</span>
            ) : '-';
          },
        },
        {
          accessorKey: 'alcance_total',
          header: 'Alcance Total',
          cell: ({ row }) => {
            const val = row.getValue<number | undefined>('alcance_total');
            return val !== undefined ? val.toLocaleString('pt-BR') : '-';
          },
        },
        {
          accessorKey: 'registrado_em',
          header: 'Data',
          cell: ({ row }) => {
            const data = row.getValue<string | undefined>('registrado_em');
            return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
          },
        },
      ];
    }

    return baseColumns;
  }, [table]);

  const chartRenderer = () => {
    // Escolhe eixo X e métricas conforme a tabela
    let xKey: string = 'id';
    let valueKeys: string[] = [];
    let metricLabels: Record<string, string> = {};

    if (table === 'contas_sociais') {
      xKey = 'nome_conta';
      valueKeys = ['seguidores', 'seguindo', 'total_publicacoes'];
      metricLabels = {
        seguidores: 'Seguidores',
        seguindo: 'Seguindo',
        total_publicacoes: 'Total de posts',
      };
    } else if (table === 'publicacoes') {
      xKey = 'titulo';
      valueKeys = ['curtidas', 'comentarios', 'compartilhamentos', 'visualizacoes', 'alcance', 'taxa_engajamento'];
      metricLabels = {
        curtidas: 'Curtidas',
        comentarios: 'Comentários',
        compartilhamentos: 'Compartilhamentos',
        visualizacoes: 'Visualizações',
        alcance: 'Alcance',
        taxa_engajamento: 'Taxa de engajamento',
      };
    } else if (table === 'metricas_publicacoes') {
      xKey = 'titulo';
      valueKeys = ['curtidas', 'comentarios', 'compartilhamentos', 'visualizacoes', 'alcance', 'taxa_engajamento'];
      metricLabels = {
        curtidas: 'Curtidas',
        comentarios: 'Comentários',
        compartilhamentos: 'Compartilhamentos',
        visualizacoes: 'Visualizações',
        alcance: 'Alcance',
        taxa_engajamento: 'Taxa de engajamento',
      };
    } else if (table === 'resumos_conta') {
      xKey = 'nome_conta';
      valueKeys = ['seguidores', 'seguindo', 'total_publicacoes', 'alcance_total', 'taxa_engajamento'];
      metricLabels = {
        seguidores: 'Seguidores',
        seguindo: 'Seguindo',
        total_publicacoes: 'Total de posts',
        alcance_total: 'Alcance total',
        taxa_engajamento: 'Taxa de engajamento',
      };
    } else {
      // fallback: tenta detectar primeiras colunas numéricas
      const sample = data[0] as Record<string, unknown> | undefined;
      xKey = sample ? Object.keys(sample).find((k) => typeof sample[k] !== 'number') || 'id' : 'id';
      valueKeys = sample ? Object.keys(sample).filter((k) => typeof sample[k] === 'number') : [];
      metricLabels = Object.fromEntries(valueKeys.map((k) => [k, k.replace(/_/g, ' ')]));
    }

    return (
      <ChartSwitcher
        rows={data}
        options={{
          xKey,
          valueKeys,
          metricLabels,
          title: 'Visualização de métricas',
          xLegend: xKey,
          yLegend: 'Valor',
          initialChartType: table === 'metricas_publicacoes' ? 'bar' : 'bar',
        }}
      />
    );
  };

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Dados de Marketing Orgânico"
      icon={TrendingUp}
      iconColor="text-pink-600"
      message={message}
      success={success}
      count={count}
      error={error}
      exportFileName={`organic_marketing_${table}`}
      pageSize={20}
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

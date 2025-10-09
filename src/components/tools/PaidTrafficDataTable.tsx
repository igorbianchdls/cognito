'use client';

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, DollarSign } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';

interface PaidTrafficRecord {
  id: string | number;

  // Campos de contas_ads
  plataforma?: string;
  nome_conta?: string;
  conectado_em?: string;

  // Campos de campanhas
  conta_ads_id?: string;
  nome?: string;
  objetivo?: string;
  orcamento_total?: number;
  orcamento_diario?: number;
  status?: string;
  inicio?: string;
  fim?: string;

  // Campos de grupos_de_anuncios
  campanha_id?: string;
  publico_alvo?: unknown;

  // Campos de anuncios_criacao
  grupo_id?: string;
  titulo?: string;
  hook?: string;
  criativo_status?: string;
  criado_por?: string;
  criado_em?: string;
  atualizado_em?: string;

  // Campos de anuncios_publicados
  anuncio_criacao_id?: string;
  anuncio_id_plataforma?: string;
  publicado_em?: string;

  // Campos de metricas_anuncios
  anuncio_publicado_id?: string;
  data?: string;
  impressao?: number;
  cliques?: number;
  ctr?: number;
  cpc?: number;
  conversao?: number;
  gasto?: number;
  receita?: number;
  cpa?: number;
  roas?: number;
  cpm_real?: number;

  // Campos de resumos_campanhas
  total_gasto?: number;
  total_cliques?: number;
  total_conversoes?: number;
  ctr_medio?: number;
  cpc_medio?: number;
  registrado_em?: string;

  [key: string]: unknown;
}

interface PaidTrafficDataTableProps {
  success: boolean;
  count: number;
  data: PaidTrafficRecord[];
  table: string;
  message: string;
  error?: string;
}

const getPlataformaColor = (plataforma?: string) => {
  const p = plataforma?.toLowerCase() || '';
  if (p.includes('google')) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (p.includes('meta') || p.includes('facebook')) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
  if (p.includes('tiktok')) return 'bg-gray-900 text-white border-gray-700';
  if (p.includes('linkedin')) return 'bg-sky-100 text-sky-800 border-sky-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getStatusColor = (status?: string) => {
  const s = status?.toLowerCase() || '';
  if (s === 'ativa' || s === 'ativo') return 'bg-green-100 text-green-800 border-green-300';
  if (s === 'pausada' || s === 'pausado') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (s === 'encerrada' || s === 'encerrado') return 'bg-red-100 text-red-800 border-red-300';
  if (s === 'rejeitado') return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getCriativoStatusColor = (status?: string) => {
  const s = status?.toLowerCase() || '';
  if (s === 'aprovado') return 'bg-green-100 text-green-800 border-green-300';
  if (s === 'rascunho') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (s === 'em_revisao') return 'bg-blue-100 text-blue-800 border-blue-300';
  if (s === 'rejeitado') return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString('pt-BR');
};

const formatPercentage = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `${(value * 100).toFixed(2)}%`;
};

const getRoasColor = (roas?: number) => {
  if (roas === undefined || roas === null) return '';
  if (roas >= 3) return 'text-green-600 font-bold';
  if (roas >= 1.5) return 'text-orange-600 font-bold';
  return 'text-red-600';
};

export default function PaidTrafficDataTable({ success, count, data, table, message, error }: PaidTrafficDataTableProps) {
  const columns: ColumnDef<PaidTrafficRecord>[] = useMemo(() => {
    const baseColumns: ColumnDef<PaidTrafficRecord>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-xs">#{String(row.getValue('id')).substring(0, 8)}</span>,
      },
    ];

    // 1. CONTAS ADS
    if (table === 'contas_ads') {
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

    // 2. CAMPANHAS
    if (table === 'campanhas') {
      return [
        ...baseColumns,
        {
          accessorKey: 'nome',
          header: 'Nome',
          cell: ({ row }) => {
            const nome = row.getValue<string | undefined>('nome');
            return nome ? <span className="font-medium max-w-xs truncate block">{nome}</span> : '-';
          },
        },
        {
          accessorKey: 'objetivo',
          header: 'Objetivo',
          cell: ({ row }) => {
            const obj = row.getValue<string | undefined>('objetivo');
            return obj ? <Badge variant="outline">{obj}</Badge> : '-';
          },
        },
        {
          accessorKey: 'orcamento_total',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Orçamento Total
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const valor = row.getValue<number | undefined>('orcamento_total');
            return <span className="font-bold text-blue-600">{formatCurrency(valor)}</span>;
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
          accessorKey: 'inicio',
          header: 'Início',
          cell: ({ row }) => {
            const data = row.getValue<string | undefined>('inicio');
            return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
          },
        },
        {
          accessorKey: 'fim',
          header: 'Fim',
          cell: ({ row }) => {
            const data = row.getValue<string | undefined>('fim');
            return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
          },
        },
      ];
    }

    // 3. GRUPOS DE ANÚNCIOS
    if (table === 'grupos_de_anuncios') {
      return [
        ...baseColumns,
        {
          accessorKey: 'nome',
          header: 'Nome',
          cell: ({ row }) => {
            const nome = row.getValue<string | undefined>('nome');
            return nome ? <span className="font-medium max-w-xs truncate block">{nome}</span> : '-';
          },
        },
        {
          accessorKey: 'orcamento_diario',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Orçamento Diário
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const valor = row.getValue<number | undefined>('orcamento_diario');
            return <span className="font-bold text-blue-600">{formatCurrency(valor)}</span>;
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
      ];
    }

    // 4. ANÚNCIOS CRIAÇÃO
    if (table === 'anuncios_criacao') {
      return [
        ...baseColumns,
        {
          accessorKey: 'titulo',
          header: 'Título',
          cell: ({ row }) => {
            const titulo = row.getValue<string | undefined>('titulo');
            return titulo ? <span className="font-medium max-w-xs truncate block">{titulo}</span> : '-';
          },
        },
        {
          accessorKey: 'hook',
          header: 'Hook',
          cell: ({ row }) => {
            const hook = row.getValue<string | undefined>('hook');
            return hook ? <span className="max-w-sm truncate block">{hook}</span> : '-';
          },
        },
        {
          accessorKey: 'criativo_status',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue<string | undefined>('criativo_status');
            return status ? <Badge className={getCriativoStatusColor(status)}>{status}</Badge> : '-';
          },
        },
        {
          accessorKey: 'criado_em',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Criado em
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const data = row.getValue<string | undefined>('criado_em');
            return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
          },
        },
      ];
    }

    // 5. ANÚNCIOS COLABORADORES
    if (table === 'anuncios_colaboradores') {
      return [
        ...baseColumns,
        {
          accessorKey: 'acao',
          header: 'Ação',
          cell: ({ row }) => {
            const acao = row.getValue<string | undefined>('acao');
            return acao ? <Badge variant="outline">{acao}</Badge> : '-';
          },
        },
        {
          accessorKey: 'comentario',
          header: 'Comentário',
          cell: ({ row }) => {
            const comentario = row.getValue<string | undefined>('comentario');
            return comentario ? <span className="max-w-md truncate block">{comentario}</span> : '-';
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

    // 6. ANÚNCIOS PUBLICADOS
    if (table === 'anuncios_publicados') {
      return [
        ...baseColumns,
        {
          accessorKey: 'titulo',
          header: 'Título',
          cell: ({ row }) => {
            const titulo = row.getValue<string | undefined>('titulo');
            return titulo ? <span className="font-medium max-w-xs truncate block">{titulo}</span> : '-';
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
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue<string | undefined>('status');
            return status ? <Badge className={getStatusColor(status)}>{status}</Badge> : '-';
          },
        },
        {
          accessorKey: 'anuncio_id_plataforma',
          header: 'ID Plataforma',
          cell: ({ row }) => {
            const id = row.getValue<string | undefined>('anuncio_id_plataforma');
            return id ? <span className="font-mono text-xs">{id}</span> : '-';
          },
        },
        {
          accessorKey: 'publicado_em',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
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

    // 7. MÉTRICAS ANÚNCIOS
    if (table === 'metricas_anuncios') {
      return [
        ...baseColumns,
        {
          accessorKey: 'data',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const data = row.getValue<string | undefined>('data');
            return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
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
          accessorKey: 'impressao',
          header: 'Impressões',
          cell: ({ row }) => formatNumber(row.getValue<number | undefined>('impressao')),
        },
        {
          accessorKey: 'cliques',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Cliques
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-bold">{formatNumber(row.getValue<number | undefined>('cliques'))}</span>,
        },
        {
          accessorKey: 'ctr',
          header: 'CTR',
          cell: ({ row }) => formatPercentage(row.getValue<number | undefined>('ctr')),
        },
        {
          accessorKey: 'gasto',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Gasto
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-bold text-red-600">{formatCurrency(row.getValue<number | undefined>('gasto'))}</span>,
        },
        {
          accessorKey: 'conversao',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Conversões
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-bold text-green-600">{formatNumber(row.getValue<number | undefined>('conversao'))}</span>,
        },
        {
          accessorKey: 'receita',
          header: 'Receita',
          cell: ({ row }) => <span className="font-bold text-green-600">{formatCurrency(row.getValue<number | undefined>('receita'))}</span>,
        },
        {
          accessorKey: 'roas',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              ROAS
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const roas = row.getValue<number | undefined>('roas');
            return roas !== undefined ? (
              <span className={getRoasColor(roas)}>{roas.toFixed(2)}x</span>
            ) : '-';
          },
        },
        {
          accessorKey: 'cpc',
          header: 'CPC',
          cell: ({ row }) => formatCurrency(row.getValue<number | undefined>('cpc')),
        },
        {
          accessorKey: 'cpa',
          header: 'CPA',
          cell: ({ row }) => formatCurrency(row.getValue<number | undefined>('cpa')),
        },
      ];
    }

    // 8. RESUMOS CAMPANHAS
    if (table === 'resumos_campanhas') {
      return [
        ...baseColumns,
        {
          accessorKey: 'total_gasto',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Gasto Total
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-bold text-red-600">{formatCurrency(row.getValue<number | undefined>('total_gasto'))}</span>,
        },
        {
          accessorKey: 'total_cliques',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Cliques Totais
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-bold">{formatNumber(row.getValue<number | undefined>('total_cliques'))}</span>,
        },
        {
          accessorKey: 'total_conversoes',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Conversões Totais
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-bold text-green-600">{formatNumber(row.getValue<number | undefined>('total_conversoes'))}</span>,
        },
        {
          accessorKey: 'ctr_medio',
          header: 'CTR Médio',
          cell: ({ row }) => formatPercentage(row.getValue<number | undefined>('ctr_medio')),
        },
        {
          accessorKey: 'cpc_medio',
          header: 'CPC Médio',
          cell: ({ row }) => formatCurrency(row.getValue<number | undefined>('cpc_medio')),
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

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Dados de Tráfego Pago"
      icon={DollarSign}
      iconColor="text-emerald-600"
      message={message}
      success={success}
      count={count}
      error={error}
      exportFileName={`paid_traffic_${table}`}
      pageSize={20}
    />
  );
}

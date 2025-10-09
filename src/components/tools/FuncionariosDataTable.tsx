'use client';

import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent
} from '@/components/ai-elements/artifact';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Users, Copy, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

interface FuncionariosRecord {
  id_funcionario?: number;
  id_departamento?: number;
  id_cargo?: number;
  id_historico?: number;
  id_ponto?: number;
  id_ausencia?: number;
  id_folha?: number;
  id_beneficio?: number;
  id_funcionario_beneficio?: number;
  id_treinamento?: number;
  id_funcionario_treinamento?: number;
  id_avaliacao?: number;
  id_desligamento?: number;

  // Funcionários
  nome_completo?: string;
  cpf?: string;
  email_corporativo?: string;
  telefone?: string;
  data_nascimento?: string;
  data_admissao?: string;
  genero?: string;
  status?: string;

  // Departamentos e Cargos
  nome?: string;
  titulo?: string;
  descricao?: string;

  // Histórico Cargos
  salario?: number;
  data_inicio?: string;
  data_fim?: string;

  // Ponto
  data_hora_marcacao?: string;
  tipo_marcacao?: string;

  // Ausências
  tipo?: string;
  motivo?: string;
  status_aprovacao?: string;

  // Folha Pagamento
  mes_referencia?: number;
  ano_referencia?: number;
  data_pagamento?: string;
  salario_base?: number;
  total_vencimentos?: number;
  total_descontos?: number;
  valor_liquido?: number;

  // Benefícios
  valor_padrao?: number;
  data_adesao?: string;

  // Treinamentos
  nome_curso?: string;
  carga_horaria?: number;
  data_conclusao?: string;
  nota_aproveitamento?: number;

  // Avaliações
  id_avaliador?: number;
  data_avaliacao?: string;
  nota?: number;
  comentarios?: string;

  // Desligamentos
  data_desligamento?: string;
  tipo_desligamento?: string;

  [key: string]: unknown;
}

interface FuncionariosDataTableProps {
  success: boolean;
  count: number;
  data: FuncionariosRecord[];
  table: string;
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('ativo') || s.includes('active') || s.includes('aprovado') || s.includes('concluído'))
    return 'bg-green-100 text-green-800 border-green-300';
  if (s.includes('pendente') || s.includes('pending') || s.includes('em andamento'))
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (s.includes('inativo') || s.includes('inactive') || s.includes('reprovado') || s.includes('cancelado'))
    return 'bg-red-100 text-red-800 border-red-300';
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

const formatDate = (value?: string) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('pt-BR');
  } catch {
    return value;
  }
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
};

export default function FuncionariosDataTable({ success, count, data, table, message, error }: FuncionariosDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [copied, setCopied] = useState(false);

  const columns: ColumnDef<FuncionariosRecord>[] = useMemo(() => {
    if (table === 'funcionarios') {
      return [
        {
          accessorKey: 'id_funcionario',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_funcionario')}</span>,
        },
        {
          accessorKey: 'nome_completo',
          header: 'Nome',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('nome_completo') || '-'}</span>,
        },
        {
          accessorKey: 'email_corporativo',
          header: 'Email',
          cell: ({ row }) => <span className="text-sm">{row.getValue('email_corporativo') || '-'}</span>,
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue('status') as string;
            return (
              <Badge variant="outline" className={getStatusColor(status)}>
                {status || '-'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'data_admissao',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Admissão <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_admissao'))}</span>,
        },
      ];
    }

    if (table === 'departamentos') {
      return [
        {
          accessorKey: 'id_departamento',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_departamento')}</span>,
        },
        {
          accessorKey: 'nome',
          header: 'Nome',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('nome') || '-'}</span>,
        },
        {
          accessorKey: 'descricao',
          header: 'Descrição',
          cell: ({ row }) => <span className="text-sm">{row.getValue('descricao') || '-'}</span>,
        },
      ];
    }

    if (table === 'cargos') {
      return [
        {
          accessorKey: 'id_cargo',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_cargo')}</span>,
        },
        {
          accessorKey: 'titulo',
          header: 'Título',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('titulo') || '-'}</span>,
        },
        {
          accessorKey: 'descricao',
          header: 'Descrição',
          cell: ({ row }) => <span className="text-sm">{row.getValue('descricao') || '-'}</span>,
        },
      ];
    }

    if (table === 'historico_cargos') {
      return [
        {
          accessorKey: 'id_historico',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_historico')}</span>,
        },
        {
          accessorKey: 'id_funcionario',
          header: 'Funcionário',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_funcionario')}</span>,
        },
        {
          accessorKey: 'salario',
          header: 'Salário',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatCurrency(row.getValue('salario'))}</span>,
        },
        {
          accessorKey: 'data_inicio',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Início <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_inicio'))}</span>,
        },
        {
          accessorKey: 'data_fim',
          header: 'Data Fim',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_fim'))}</span>,
        },
      ];
    }

    if (table === 'ponto') {
      return [
        {
          accessorKey: 'id_ponto',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_ponto')}</span>,
        },
        {
          accessorKey: 'id_funcionario',
          header: 'Funcionário',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_funcionario')}</span>,
        },
        {
          accessorKey: 'data_hora_marcacao',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data/Hora <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDateTime(row.getValue('data_hora_marcacao'))}</span>,
        },
        {
          accessorKey: 'tipo_marcacao',
          header: 'Tipo',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('tipo_marcacao') || '-'}</span>,
        },
      ];
    }

    if (table === 'ausencias') {
      return [
        {
          accessorKey: 'id_ausencia',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_ausencia')}</span>,
        },
        {
          accessorKey: 'id_funcionario',
          header: 'Funcionário',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_funcionario')}</span>,
        },
        {
          accessorKey: 'tipo',
          header: 'Tipo',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('tipo') || '-'}</span>,
        },
        {
          accessorKey: 'status_aprovacao',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue('status_aprovacao') as string;
            return (
              <Badge variant="outline" className={getStatusColor(status)}>
                {status || '-'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'data_inicio',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Início <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_inicio'))}</span>,
        },
        {
          accessorKey: 'data_fim',
          header: 'Data Fim',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_fim'))}</span>,
        },
      ];
    }

    if (table === 'folha_pagamento') {
      return [
        {
          accessorKey: 'id_folha',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_folha')}</span>,
        },
        {
          accessorKey: 'id_funcionario',
          header: 'Funcionário',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_funcionario')}</span>,
        },
        {
          accessorKey: 'mes_referencia',
          header: 'Mês',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('mes_referencia'))}</span>,
        },
        {
          accessorKey: 'ano_referencia',
          header: 'Ano',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('ano_referencia'))}</span>,
        },
        {
          accessorKey: 'salario_base',
          header: 'Salário Base',
          cell: ({ row }) => <span className="text-sm">{formatCurrency(row.getValue('salario_base'))}</span>,
        },
        {
          accessorKey: 'valor_liquido',
          header: 'Líquido',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatCurrency(row.getValue('valor_liquido'))}</span>,
        },
      ];
    }

    if (table === 'beneficios') {
      return [
        {
          accessorKey: 'id_beneficio',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_beneficio')}</span>,
        },
        {
          accessorKey: 'nome',
          header: 'Nome',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('nome') || '-'}</span>,
        },
        {
          accessorKey: 'descricao',
          header: 'Descrição',
          cell: ({ row }) => <span className="text-sm">{row.getValue('descricao') || '-'}</span>,
        },
        {
          accessorKey: 'valor_padrao',
          header: 'Valor',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatCurrency(row.getValue('valor_padrao'))}</span>,
        },
      ];
    }

    if (table === 'treinamentos') {
      return [
        {
          accessorKey: 'id_treinamento',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_treinamento')}</span>,
        },
        {
          accessorKey: 'nome_curso',
          header: 'Curso',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('nome_curso') || '-'}</span>,
        },
        {
          accessorKey: 'descricao',
          header: 'Descrição',
          cell: ({ row }) => <span className="text-sm">{row.getValue('descricao') || '-'}</span>,
        },
        {
          accessorKey: 'carga_horaria',
          header: 'Carga Horária',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('carga_horaria'))}h</span>,
        },
      ];
    }

    if (table === 'funcionarios_treinamentos') {
      return [
        {
          accessorKey: 'id_funcionario_treinamento',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_funcionario_treinamento')}</span>,
        },
        {
          accessorKey: 'id_funcionario',
          header: 'Funcionário',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_funcionario')}</span>,
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue('status') as string;
            return (
              <Badge variant="outline" className={getStatusColor(status)}>
                {status || '-'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'nota_aproveitamento',
          header: 'Nota',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatNumber(row.getValue('nota_aproveitamento'))}</span>,
        },
        {
          accessorKey: 'data_conclusao',
          header: 'Conclusão',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_conclusao'))}</span>,
        },
      ];
    }

    if (table === 'avaliacoes_desempenho') {
      return [
        {
          accessorKey: 'id_avaliacao',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_avaliacao')}</span>,
        },
        {
          accessorKey: 'id_funcionario',
          header: 'Funcionário',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_funcionario')}</span>,
        },
        {
          accessorKey: 'nota',
          header: 'Nota',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatNumber(row.getValue('nota'))}</span>,
        },
        {
          accessorKey: 'data_avaliacao',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Avaliação <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_avaliacao'))}</span>,
        },
        {
          accessorKey: 'comentarios',
          header: 'Comentários',
          cell: ({ row }) => <span className="text-sm">{(row.getValue('comentarios') as string)?.substring(0, 50) || '-'}</span>,
        },
      ];
    }

    if (table === 'desligamentos') {
      return [
        {
          accessorKey: 'id_desligamento',
          header: 'ID',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_desligamento')}</span>,
        },
        {
          accessorKey: 'id_funcionario',
          header: 'Funcionário',
          cell: ({ row }) => <span className="font-mono text-xs">#{row.getValue('id_funcionario')}</span>,
        },
        {
          accessorKey: 'tipo_desligamento',
          header: 'Tipo',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('tipo_desligamento') || '-'}</span>,
        },
        {
          accessorKey: 'data_desligamento',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_desligamento'))}</span>,
        },
        {
          accessorKey: 'motivo',
          header: 'Motivo',
          cell: ({ row }) => <span className="text-sm">{(row.getValue('motivo') as string)?.substring(0, 50) || '-'}</span>,
        },
      ];
    }

    // Default columns para outras tabelas
    return [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-xs">#{String(row.original.id_funcionario || row.original.id_beneficio || row.original.id_funcionario_beneficio || '?')}</span>,
      },
    ];
  }, [table]);

  const reactTable = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleDownloadCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' ? `"${val}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funcionarios_${table}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!success) {
    return (
      <Artifact className="w-full border-red-200 bg-red-50">
        <ArtifactHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <ArtifactTitle className="text-red-800">Erro ao Buscar Dados de Funcionários</ArtifactTitle>
          </div>
        </ArtifactHeader>
        <ArtifactContent>
          <p className="text-red-700">{message}</p>
          {error && (
            <p className="text-sm text-red-600 font-mono bg-red-100 p-3 rounded-md mt-2">{error}</p>
          )}
        </ArtifactContent>
      </Artifact>
    );
  }

  return (
    <Artifact className="w-full">
      <ArtifactHeader>
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <ArtifactTitle>Dados de Gestão de Funcionários</ArtifactTitle>
          </div>
          <ArtifactDescription className="mt-1">
            {message} - Mostrando {reactTable.getRowModel().rows.length} de {count} registros
          </ArtifactDescription>
        </div>

        <ArtifactActions>
          <ArtifactAction
            icon={copied ? CheckCircle : Copy}
            tooltip={copied ? "Copiado!" : "Copiar JSON"}
            onClick={handleCopyJSON}
            className={copied ? "text-green-600" : ""}
          />
          <ArtifactAction
            icon={Download}
            tooltip="Exportar CSV"
            onClick={handleDownloadCSV}
          />
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {reactTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {reactTable.getRowModel().rows?.length ? (
                reactTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Página {reactTable.getState().pagination.pageIndex + 1} de {reactTable.getPageCount()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => reactTable.previousPage()}
              disabled={!reactTable.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reactTable.nextPage()}
              disabled={!reactTable.getCanNextPage()}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </ArtifactContent>
    </Artifact>
  );
}

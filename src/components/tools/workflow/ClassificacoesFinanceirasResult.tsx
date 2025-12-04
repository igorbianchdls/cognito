'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import { ColumnDef } from '@tanstack/react-table'
import { FolderTree } from 'lucide-react'
import { useMemo } from 'react'

type ClassificacaoRow = {
  id: string;
  nome: string;
  tipo?: string;
  descricao?: string;
  categoria?: 'categoria' | 'centro_custo' | 'natureza' | 'departamento' | 'filial';
  [key: string]: unknown;
}

type ClassificacoesFinanceirasOutput = {
  success: boolean;
  message: string;
  title?: string;
  data: {
    categorias_financeiras: Array<{ id: string; nome: string; tipo: string; descricao: string }>;
    centros_custo: Array<{ id: string; nome: string; descricao: string }>;
    naturezas_financeiras: Array<{ id: string; nome: string; tipo: string }>;
    departamentos?: Array<{ id: string; nome: string }>;
    filiais?: Array<{ id: string; nome: string }>;
  };
  counts: {
    categorias: number;
    centros_custo: number;
    naturezas: number;
  };
  error?: string;
}

export default function ClassificacoesFinanceirasResult({ result }: { result: ClassificacoesFinanceirasOutput }) {
  // Flatten all classifications into a single table with category tags
  const allRows: ClassificacaoRow[] = useMemo(() => {
    const rows: ClassificacaoRow[] = [];

    result.data.categorias_financeiras.forEach(cat => {
      rows.push({ ...cat, categoria: 'categoria' });
    });

    result.data.centros_custo.forEach(cc => {
      rows.push({ ...cc, categoria: 'centro_custo', tipo: 'centro_custo' });
    });

    result.data.naturezas_financeiras.forEach(nat => {
      rows.push({ ...nat, categoria: 'natureza' });
    });

    // Departamentos
    (result.data.departamentos || []).forEach(dep => {
      rows.push({ ...dep, categoria: 'departamento', tipo: 'departamento' });
    });

    // Filiais
    (result.data.filiais || []).forEach(fil => {
      rows.push({ ...fil, categoria: 'filial', tipo: 'filial' });
    });

    return rows;
  }, [result.data]);

  const columns: ColumnDef<ClassificacaoRow>[] = useMemo(() => [
    {
      accessorKey: 'categoria',
      header: 'Tipo',
      size: 150,
      cell: ({ row }) => {
        const cat = row.original.categoria;
        const labels = {
          categoria: 'Categoria Financeira',
          centro_custo: 'Centro de Custo',
          natureza: 'Natureza Financeira',
          departamento: 'Departamento',
          filial: 'Filial'
        };
        const colors = {
          categoria: 'bg-blue-100 text-blue-700',
          centro_custo: 'bg-green-100 text-green-700',
          natureza: 'bg-purple-100 text-purple-700',
          departamento: 'bg-orange-100 text-orange-700',
          filial: 'bg-teal-100 text-teal-700'
        };
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${colors[cat || 'categoria']}`}>
            {labels[cat || 'categoria']}
          </span>
        );
      }
    },
    {
      accessorKey: 'nome',
      header: 'Nome',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const nome = row.original.nome || 'Sem nome';
        const descricao = row.original.descricao || row.original.tipo || '';
        return <EntityDisplay name={String(nome)} subtitle={String(descricao)} />;
      }
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => {
        const id = row.original.id;
        return <div className="text-xs font-mono text-muted-foreground">{id}</div>;
      }
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => {
        const desc = row.original.descricao || '-';
        return <div className="text-sm text-muted-foreground">{desc}</div>;
      }
    }
  ], []);

  return (
    <ArtifactDataTable
      data={allRows}
      columns={columns}
      title={result.title ?? 'Classificações Financeiras'}
      icon={FolderTree}
      iconColor="text-blue-600"
      message={result.message}
      success={result.success}
      count={allRows.length}
      error={result.error}
      exportFileName="classificacoes_financeiras"
      pageSize={20}
    />
  );
}

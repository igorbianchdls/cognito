'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { UserPlus, CheckCircle } from 'lucide-react'
import { useMemo } from 'react'

type FornecedorRow = {
  id: string;
  nome: string;
  cnpj: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  data_cadastro?: string;
  status?: string;
  observacoes?: string;
  [key: string]: unknown;
}

type CriarFornecedorOutput = {
  success: boolean;
  data: FornecedorRow | null;
  message: string;
  title?: string;
  error?: string;
  cnpj_formatado?: string;
}

export default function CriarFornecedorResult({ result }: { result: CriarFornecedorOutput }) {
  // Convert single fornecedor to array for table display
  const tableRows: FornecedorRow[] = useMemo(() => {
    return result.data ? [result.data] : [];
  }, [result.data]);

  const columns: ColumnDef<FornecedorRow>[] = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Fornecedor',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const nome = row.original.nome || 'Sem nome';
        const cnpj = row.original.cnpj || 'Sem CNPJ';
        return <EntityDisplay name={String(nome)} subtitle={String(cnpj)} />;
      }
    },
    {
      accessorKey: 'endereco',
      header: 'Endereço',
      cell: ({ row }) => {
        const end = row.original.endereco || 'Não informado';
        return <div className="text-sm text-muted-foreground">{end}</div>;
      }
    },
    {
      accessorKey: 'telefone',
      header: 'Telefone',
      cell: ({ row }) => {
        const tel = row.original.telefone || '-';
        return <div className="text-sm">{tel}</div>;
      }
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
      cell: ({ row }) => {
        const email = row.original.email || '-';
        return <div className="text-sm">{email}</div>;
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        if (!status) return '-';
        return <StatusBadge value={status} type="status" />;
      }
    },
    {
      accessorKey: 'data_cadastro',
      header: 'Data Cadastro',
      cell: ({ row }) => {
        const data = row.original.data_cadastro;
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
      }
    }
  ], []);

  return (
    <ArtifactDataTable
      data={tableRows}
      columns={columns}
      title={result.title ?? 'Fornecedor Criado'}
      icon={CheckCircle}
      iconColor="text-green-600"
      message={result.message}
      success={result.success}
      count={tableRows.length}
      error={result.error}
      exportFileName="fornecedor_criado"
      pageSize={10}
    />
  );
}

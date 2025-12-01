'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { Building2, CheckCircle, AlertCircle } from 'lucide-react'
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

type FornecedorOutput = {
  success: boolean;
  fornecedor_encontrado?: boolean; // only for buscarFornecedor
  data: FornecedorRow | null;
  rows?: FornecedorRow[]; // listagem múltipla
  count?: number;
  message: string;
  title?: string;
  error?: string;
  cnpj_formatado?: string; // only for criarFornecedor
}

export default function FornecedorResult({ result }: { result: FornecedorOutput }) {
  // Normalize rows: prefer result.rows; fallback to single data; legacy fallback to result.fornecedores
  const tableRows: FornecedorRow[] = useMemo(() => {
    if (Array.isArray(result.rows)) return result.rows;
    if (result && (result as unknown as { fornecedores?: Array<Record<string, unknown>> }).fornecedores) {
      const legacy = (result as unknown as { fornecedores: Array<Record<string, unknown>> }).fornecedores;
      return legacy.map((r) => ({
        id: String(r.id ?? r['fornecedor_id'] ?? ''),
        nome: String(r.nome ?? r['nome_fantasia'] ?? ''),
        cnpj: String(r.cnpj ?? ''),
        email: r.email ? String(r.email) : '',
        telefone: r.telefone ? String(r.telefone) : '',
        endereco: r.endereco ? String(r.endereco) : '',
      }));
    }
    return result.data ? [result.data] : [];
  }, [result]);

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
      accessorKey: 'data_cadastro',
      header: 'Data Cadastro',
      cell: ({ row }) => {
        const data = row.original.data_cadastro;
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
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
    }
  ], []);

  // Determine icon and color based on operation result
  const Icon = result.fornecedor_encontrado === false ? AlertCircle :
               result.data ? CheckCircle : Building2;
  const iconColor = result.fornecedor_encontrado === false ? 'text-orange-600' :
                    result.data ? 'text-green-600' : 'text-slate-700';

  return (
    <ArtifactDataTable
      data={tableRows}
      columns={columns}
      title={result.title ?? 'Fornecedores'}
      icon={Icon}
      iconColor={iconColor}
      message={result.message}
      success={result.success}
      count={tableRows.length}
      error={result.error}
      exportFileName="fornecedor"
      pageSize={10}
    />
  );
}

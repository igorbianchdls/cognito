'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { Users, CheckCircle, AlertCircle } from 'lucide-react'
import { useMemo } from 'react'

type ClienteRow = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  tipo_pessoa?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  data_cadastro?: string;
  status?: string;
  observacoes?: string;
  [key: string]: unknown;
}

type BuscarClienteOutput = {
  success: boolean;
  cliente_encontrado?: boolean;
  data: ClienteRow | null;
  rows?: ClienteRow[];
  count?: number;
  message: string;
  title?: string;
  error?: string;
}

export default function BuscarClienteResult({ result }: { result: BuscarClienteOutput }) {
  // Convert single cliente to array for table display
  const tableRows: ClienteRow[] = useMemo(() => {
    if (Array.isArray(result.rows)) return result.rows;
    return result.data ? [result.data] : [];
  }, [result.data, result.rows]);

  const columns: ColumnDef<ClienteRow>[] = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Cliente',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const nome = row.original.nome || 'Sem nome';
        const doc = row.original.cpf_cnpj || 'Sem CPF/CNPJ';
        return <EntityDisplay name={String(nome)} subtitle={String(doc)} />;
      }
    },
    {
      accessorKey: 'tipo_pessoa',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.original.tipo_pessoa;
        if (!tipo) return '-';
        const labels = {
          fisica: 'Pessoa Física',
          juridica: 'Pessoa Jurídica'
        };
        const colors = {
          fisica: 'bg-blue-100 text-blue-700',
          juridica: 'bg-purple-100 text-purple-700'
        };
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
            {labels[tipo as keyof typeof labels] || tipo}
          </span>
        );
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
    }
  ], []);

  // Determine icon and color based on operation result
  const Icon = result.cliente_encontrado === false ? AlertCircle :
               result.data ? CheckCircle : Users;
  const iconColor = result.cliente_encontrado === false ? 'text-orange-600' :
                    result.data ? 'text-green-600' : 'text-slate-700';

  return (
    <ArtifactDataTable
      data={tableRows}
      columns={columns}
      title={result.title ?? 'Buscar Cliente'}
      icon={Icon}
      iconColor={iconColor}
      message={result.message}
      success={result.success}
      count={tableRows.length}
      error={result.error}
      exportFileName="buscar_cliente"
      pageSize={10}
    />
  );
}

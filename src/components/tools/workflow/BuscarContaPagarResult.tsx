'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useMemo } from 'react'

type ContaPagarWorkflowRow = {
  id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  numero_nota_fiscal?: string;
  valor: number;
  valor_pago: number;
  valor_pendente: number;
  data_emissao: string;
  data_vencimento: string;
  status: string;
  categoria_id?: string;
  categoria_nome?: string;
  centro_custo_id?: string;
  centro_custo_nome?: string;
  descricao?: string;
  quantidade_itens?: number;
  [key: string]: unknown;
}

type BuscarContaPagarOutput = {
  success: boolean;
  conta_encontrada?: boolean;
  data: ContaPagarWorkflowRow | null;
  rows?: ContaPagarWorkflowRow[];
  count?: number;
  message: string;
  title?: string;
  error?: string;
  valor_formatado?: string;
  resumo?: {
    id: string;
    numero_nota_fiscal: string;
    fornecedor: string;
    valor: number;
    status: string;
    vencimento: string;
  };
}

export default function BuscarContaPagarResult({ result }: { result: BuscarContaPagarOutput }) {
  // Convert single or multiple to array for table display
  const tableRows: ContaPagarWorkflowRow[] = useMemo(() => {
    if (Array.isArray(result.rows)) return result.rows;
    return result.data ? [result.data] : [];
  }, [result.data, result.rows]);

  const columns: ColumnDef<ContaPagarWorkflowRow>[] = useMemo(() => [
    {
      accessorKey: 'numero_nota_fiscal',
      header: 'NF',
      size: 150,
      cell: ({ row }) => {
        const nf = row.original.numero_nota_fiscal || '-';
        return <div className="font-mono text-sm">{nf}</div>;
      }
    },
    {
      accessorKey: 'fornecedor_nome',
      header: 'Fornecedor',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const nome = row.original.fornecedor_nome || 'Sem nome';
        const id = row.original.fornecedor_id || '';
        return <EntityDisplay name={String(nome)} subtitle={String(id)} />;
      }
    },
    {
      accessorKey: 'valor',
      header: 'Valor Total',
      cell: ({ row }) => {
        const valor = row.original.valor || 0;
        return (
          <div className="font-bold text-red-700">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    },
    {
      accessorKey: 'valor_pendente',
      header: 'Pendente',
      cell: ({ row }) => {
        const valor = row.original.valor_pendente || 0;
        const color = valor > 0 ? 'text-orange-600' : 'text-gray-500';
        return (
          <div className={`font-semibold ${color}`}>
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    },
    {
      accessorKey: 'data_vencimento',
      header: 'Vencimento',
      cell: ({ row }) => {
        const data = row.original.data_vencimento;
        if (!data) return '-';
        const dataVenc = new Date(data);
        const hoje = new Date();
        const vencido = dataVenc < hoje;
        return (
          <div className={vencido ? 'text-red-600 font-semibold' : ''}>
            {new Date(data).toLocaleDateString('pt-BR')}
          </div>
        );
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
      accessorKey: 'categoria_nome',
      header: 'Categoria',
      cell: ({ row }) => {
        const cat = row.original.categoria_nome || '-';
        return <div className="text-sm text-muted-foreground">{cat}</div>;
      }
    }
  ], []);

  // Determine icon and color based on search result
  const Icon = result.conta_encontrada === false ? AlertCircle :
               result.data ? CheckCircle : FileText;
  const iconColor = result.conta_encontrada === false ? 'text-orange-600' :
                    result.data ? 'text-green-600' : 'text-slate-700';

  return (
    <ArtifactDataTable
      data={tableRows}
      columns={columns}
      title={result.title ?? 'Buscar Conta a Pagar'}
      icon={Icon}
      iconColor={iconColor}
      message={result.message}
      success={result.success}
      count={tableRows.length}
      error={result.error}
      exportFileName="buscar_conta_pagar"
      pageSize={10}
    />
  );
}

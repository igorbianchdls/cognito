'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { UserPlus, CheckCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

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

type CriarClienteOutput = {
  success: boolean;
  // preview mode
  preview?: boolean;
  payload?: Partial<ClienteRow> & { nome?: string; cpf_cnpj?: string; tipo_pessoa?: string };
  validations?: Array<{ field: string; status: 'ok' | 'warn' | 'error'; message?: string }>;
  metadata?: { entity?: string; action?: string; commitEndpoint?: string };
  // created mode
  data: ClienteRow | null;
  message: string;
  title?: string;
  error?: string;
  cpf_cnpj_formatado?: string;
}

export default function CriarClienteResult({ result }: { result: CriarClienteOutput }) {
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<ClienteRow | null>(null)
  const isPreview = result.preview && result.payload && !created
  // Convert single cliente to array for table display
  const tableRows: ClienteRow[] = useMemo(() => {
    if (created) return [created]
    if (isPreview) {
      const p = result.payload || {}
      return [{
        id: '',
        nome: String(p.nome || ''),
        cpf_cnpj: String(p.cpf_cnpj || ''),
        tipo_pessoa: p.tipo_pessoa ? String(p.tipo_pessoa) : undefined,
        endereco: p.endereco ? String(p.endereco) : undefined,
        telefone: p.telefone ? String(p.telefone) : undefined,
        email: p.email ? String(p.email) : undefined,
        status: undefined,
        data_cadastro: undefined,
      }]
    }
    return result.data ? [result.data] : []
  }, [created, isPreview, result.payload, result.data]);

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

  const commit = async () => {
    if (!result.metadata?.commitEndpoint || !result.payload) return
    try {
      setCreating(true)
      const res = await fetch(result.metadata.commitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: result.payload.nome,
          cpf_cnpj: result.payload.cpf_cnpj,
          email: result.payload.email,
          telefone: result.payload.telefone,
          endereco: result.payload.endereco,
          observacoes: result.payload.observacoes,
        })
      })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        alert(json?.message || 'Falha ao criar cliente')
        setCreating(false)
        return
      }
      setCreated(json.data as ClienteRow)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar cliente')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-3">
      <ArtifactDataTable
        data={tableRows}
        columns={columns}
        title={isPreview ? (result.title ?? 'Cliente (Prévia)') : (result.title ?? 'Cliente Criado')}
        icon={isPreview ? UserPlus : CheckCircle}
        iconColor={isPreview ? 'text-blue-600' : 'text-green-600'}
        message={result.message}
        success={result.success}
        count={tableRows.length}
        error={result.error}
        exportFileName={isPreview ? 'cliente_previa' : 'cliente_criado'}
        pageSize={10}
      />

      {isPreview && (
        <div className="flex items-center justify-end gap-2">
          <Button onClick={commit} disabled={creating}>
            {creating ? 'Criando…' : 'Criar Cliente'}
          </Button>
        </div>
      )}
    </div>
  );
}

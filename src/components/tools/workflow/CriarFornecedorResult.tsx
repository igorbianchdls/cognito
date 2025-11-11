'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { UserPlus, CheckCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

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
  // preview mode
  preview?: boolean;
  payload?: Partial<FornecedorRow> & { nome?: string; cnpj?: string };
  validations?: Array<{ field: string; status: 'ok' | 'warn' | 'error'; message?: string }>;
  metadata?: { entity?: string; action?: string; commitEndpoint?: string };
  // created mode
  data: FornecedorRow | null;
  message: string;
  title?: string;
  error?: string;
  cnpj_formatado?: string;
}

export default function CriarFornecedorResult({ result }: { result: CriarFornecedorOutput }) {
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<FornecedorRow | null>(null)

  const isPreview = result.preview && result.payload && !created

  // Table rows: created data OR preview payload as a single-row projection
  const tableRows: FornecedorRow[] = useMemo(() => {
    if (created) return [created]
    if (isPreview) {
      const p = result.payload || {}
      return [{
        id: '',
        nome: String(p.nome || ''),
        cnpj: String(p.cnpj || ''),
        endereco: p.endereco ? String(p.endereco) : undefined,
        telefone: p.telefone ? String(p.telefone) : undefined,
        email: p.email ? String(p.email) : undefined,
        status: undefined,
        data_cadastro: undefined,
      }]
    }
    return result.data ? [result.data] : []
  }, [created, isPreview, result.payload, result.data])

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

  const commit = async () => {
    if (!result.metadata?.commitEndpoint || !result.payload) return
    try {
      setCreating(true)
      const res = await fetch(result.metadata.commitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.payload)
      })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        alert(json?.message || 'Falha ao criar fornecedor')
        setCreating(false)
        return
      }
      // Atualiza para modo criado
      const row = json.data as FornecedorRow
      setCreated(row)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar fornecedor')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-3">
      <ArtifactDataTable
        data={tableRows}
        columns={columns}
        title={isPreview ? (result.title ?? 'Fornecedor (Prévia)') : (result.title ?? 'Fornecedor Criado')}
        icon={isPreview ? UserPlus : CheckCircle}
        iconColor={isPreview ? 'text-blue-600' : 'text-green-600'}
        message={result.message}
        success={result.success}
        count={tableRows.length}
        error={result.error}
        exportFileName={isPreview ? 'fornecedor_previa' : 'fornecedor_criado'}
        pageSize={10}
      />

      {isPreview && (
        <div className="flex items-center justify-end gap-2">
          <Button onClick={commit} disabled={creating}>
            {creating ? 'Criando…' : 'Criar Fornecedor'}
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import { CodeBlock } from '@/components/ai-elements/code-block'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle } from 'lucide-react'

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
  success?: boolean;
  data?: ClienteRow | null;
  message?: string;
  title?: string;
  error?: string;
}

export default function CriarClienteResult({ result }: { result: CriarClienteOutput }) {
  const created: ClienteRow | null = useMemo(() => (result?.data as any) ?? null, [result])
  const ok = Boolean(result?.success) || Boolean(created)
  const title = result?.title || (ok ? 'Cliente Criado' : 'Falha ao criar cliente')
  const message = result?.message || (ok ? 'Cliente criado com sucesso.' : (result?.error || 'Não foi possível criar o cliente.'))

  if (!ok) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <div className="text-red-800 font-semibold">{title}</div>
        </div>
        <div className="text-red-700 text-sm">{message}</div>
      </div>
    )
  }

  const items: Array<{ label: string; value?: string }> = [
    { label: 'ID', value: created?.id },
    { label: 'Nome', value: created?.nome },
    { label: 'CPF/CNPJ', value: created?.cpf_cnpj },
    { label: 'E-mail', value: created?.email as any },
    { label: 'Telefone', value: created?.telefone as any },
    { label: 'Endereço', value: created?.endereco as any },
  ]

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50">
      <div className="px-3 py-2 border-b flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <div className="text-sm font-semibold text-emerald-800">{title}</div>
      </div>
      <div className="p-3 space-y-3">
        <div className="text-sm text-emerald-900">{message}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.label} className="text-sm">
              <div className="text-slate-500">{it.label}</div>
              <div className="font-medium text-slate-900">{it.value || '-'}</div>
            </div>
          ))}
        </div>
        {created && (
          <div className="pt-2">
            <div className="text-xs font-medium text-slate-500 mb-2">JSON do Registro</div>
            <CodeBlock code={JSON.stringify(created, null, 2)} language="json" />
          </div>
        )}
      </div>
    </div>
  )
}

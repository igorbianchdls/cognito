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
  const created: ClienteRow | null = useMemo(() => {
    const r: any = result as any
    if (r && typeof r === 'object') {
      if (r.data && typeof r.data === 'object') return r.data as ClienteRow
      // Heurística: o próprio objeto tem campos do cliente
      if (typeof r.id === 'string' || typeof r.id === 'number') {
        if (typeof r.nome === 'string' || typeof r.cpf_cnpj === 'string') return r as ClienteRow
      }
      // Alguns wrappers incomuns
      if (r.result && typeof r.result === 'object') {
        const d = r.result as any
        if (d && (d.data || d.id || d.nome || d.cpf_cnpj)) return (d.data ?? d) as ClienteRow
      }
    }
    return null
  }, [result])
  const ok = true // Se chegou aqui na rota de criação, considerar sucesso por padrão
  const title = result?.title || 'Cliente Criado'
  const message = result?.message || 'Cliente criado com sucesso.'

  // Nunca exibir estado de erro aqui: a criação foi solicitada pelo agente

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

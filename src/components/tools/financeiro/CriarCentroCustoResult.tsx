'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Preview = {
  success: boolean
  preview?: boolean
  title?: string
  message: string
  payload?: { nome?: string; codigo?: string; descricao?: string; ativo?: boolean }
  validations?: Array<{ field: string; status: 'ok'|'warn'|'error'; message?: string }>
  metadata?: { entity?: string; action?: string; commitEndpoint?: string }
  data?: any
  error?: string
}

export default function CriarCentroCustoResult({ result }: { result: Preview }) {
  const [nome, setNome] = useState(result.payload?.nome || '')
  const [codigo, setCodigo] = useState(result.payload?.codigo || '')
  const [descricao, setDescricao] = useState(result.payload?.descricao || '')
  const [ativo, setAtivo] = useState(result.payload?.ativo ?? true)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<any>(null)

  const onCreate = async () => {
    if (!result.metadata?.commitEndpoint) return
    try {
      setCreating(true)
      const res = await fetch(result.metadata.commitEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, codigo: codigo || undefined, descricao: descricao || undefined, ativo })
      })
      const json = await res.json().catch(()=> ({}))
      if (!res.ok || json?.ok === false) { alert(json?.error || 'Falha ao criar'); setCreating(false); return }
      setCreated(json.data || json.result || json)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar')
    } finally {
      setCreating(false)
    }
  }

  if (created) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border p-3 bg-green-50 text-green-800">Centro de custo criado com sucesso.</div>
        <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto">{JSON.stringify(created, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border p-3 bg-white">
        <div className="text-sm text-gray-700 mb-2">{result.message || 'Preencha os campos e clique em Criar.'}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nome</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome do centro de custo" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Código</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={codigo} onChange={e=>setCodigo(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Descrição</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={ativo} onChange={e=>setAtivo(e.target.checked)} /> Ativo
            </label>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={onCreate} disabled={creating || !nome}>{creating ? 'Criando…' : 'Criar Centro de Custo'}</Button>
        </div>
      </div>
    </div>
  )
}


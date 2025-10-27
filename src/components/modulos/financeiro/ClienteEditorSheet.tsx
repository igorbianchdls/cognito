"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Cliente = {
  id: string | number
  nome_cliente?: string
  imagem_url?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string | number | null
  prefill?: { nome_cliente?: string; imagem_url?: string }
  onSaved: () => void
}

export default function ClienteEditorSheet({ open, onOpenChange, clienteId, prefill, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Cliente>({ id: '', nome_cliente: '', imagem_url: '' })
  const initialRef = useRef<Cliente>({ id: '' })

  const canSave = useMemo(() => !loading && !!clienteId, [loading, clienteId])

  useEffect(() => {
    const run = async () => {
      setError(null)
      if (!open) return
      try {
        const base = { nome_cliente: prefill?.nome_cliente ?? '', imagem_url: prefill?.imagem_url ?? '' }
        if (clienteId) {
          try {
            const res = await fetch(`/api/modulos/financeiro/clientes/${clienteId}`, { cache: 'no-store' })
            if (res.ok) {
              const json = await res.json()
              const c = json?.data as Record<string, unknown>
              setForm({ id: String(clienteId), nome_cliente: String(c?.nome_cliente ?? base.nome_cliente), imagem_url: String(c?.imagem_url ?? base.imagem_url) })
              initialRef.current = { id: String(clienteId), nome_cliente: String(c?.nome_cliente ?? base.nome_cliente), imagem_url: String(c?.imagem_url ?? base.imagem_url) }
              return
            }
          } catch {}
        }
        setForm({ id: String(clienteId ?? ''), ...base })
        initialRef.current = { id: String(clienteId ?? ''), ...base }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar cliente')
      }
    }
    run()
  }, [open, clienteId, prefill?.nome_cliente, prefill?.imagem_url])

  const onChange = (k: keyof Cliente, v: string) => setForm((prev) => ({ ...prev, [k]: v }))

  const getPatch = () => {
    const out: Record<string, unknown> = {}
    if (form.nome_cliente !== initialRef.current.nome_cliente) out['nome_cliente'] = form.nome_cliente
    if (form.imagem_url !== initialRef.current.imagem_url) out['imagem_url'] = form.imagem_url
    return Object.keys(out).length ? out : null
  }

  const save = async () => {
    setLoading(true)
    setError(null)
    try {
      const patch = getPatch()
      if (clienteId && patch) {
        const res = await fetch(`/api/modulos/financeiro/clientes/${clienteId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch)
        })
        if (!res.ok) throw new Error('Falha ao salvar cliente')
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar alterações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Cliente</SheetTitle>
          <SheetDescription>Atualize nome e imagem do cliente.</SheetDescription>
        </SheetHeader>
        {error && <div className="mt-4 mb-2 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">{error}</div>}
        <div className="mt-4 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nome_cliente">Nome</Label>
            <Input id="nome_cliente" value={form.nome_cliente ?? ''} onChange={(e) => onChange('nome_cliente', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imagem_url">Imagem (URL)</Label>
            <Input id="imagem_url" value={form.imagem_url ?? ''} onChange={(e) => onChange('imagem_url', e.target.value)} placeholder="https://..." />
            <p className="text-xs text-gray-500">Use um link público (jpg, png, webp).</p>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={save} disabled={!canSave || loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}


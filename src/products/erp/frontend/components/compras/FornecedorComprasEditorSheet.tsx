"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  fornecedorId: string | number | null
  prefill?: { nome_fantasia?: string; imagem_url?: string; categoria?: string }
  onSaved: () => void
}

export default function FornecedorComprasEditorSheet({ open, onOpenChange, fornecedorId, prefill, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<{ nome_fantasia?: string; imagem_url?: string; categoria?: string }>({})
  const initialRef = useRef<{ nome_fantasia?: string; imagem_url?: string; categoria?: string }>({})

  const canSave = useMemo(() => !loading && !!fornecedorId, [loading, fornecedorId])

  useEffect(() => {
    const run = async () => {
      setError(null)
      if (!open) return
      const base = {
        nome_fantasia: prefill?.nome_fantasia ?? '',
        imagem_url: prefill?.imagem_url ?? '',
        categoria: prefill?.categoria ?? '',
      }
      try {
        if (fornecedorId) {
          const res = await fetch(`/api/modulos/compras/fornecedores/${fornecedorId}`, { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            const d = json?.data as Record<string, unknown> | undefined
            if (d) {
              const next = {
                nome_fantasia: String(d['nome_fantasia'] ?? base.nome_fantasia),
                imagem_url: String(d['imagem_url'] ?? base.imagem_url),
                categoria: String(d['categoria'] ?? base.categoria),
              }
              setForm(next)
              initialRef.current = next
              return
            }
          }
        }
      } catch (_) {
        // ignore
      }
      setForm(base)
      initialRef.current = base
    }
    run()
  }, [open, fornecedorId, prefill])

  const onChange = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const save = async () => {
    if (!fornecedorId) return
    setLoading(true)
    setError(null)
    try {
      const patch: Record<string, unknown> = {}
      if (form.nome_fantasia !== initialRef.current.nome_fantasia) patch['nome_fantasia'] = form.nome_fantasia
      if (form.imagem_url !== initialRef.current.imagem_url) patch['imagem_url'] = form.imagem_url
      if (form.categoria !== initialRef.current.categoria) patch['categoria'] = form.categoria
      if (Object.keys(patch).length) {
        const res = await fetch(`/api/modulos/compras/fornecedores/${fornecedorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!res.ok) throw new Error('Falha ao salvar fornecedor')
      }
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle>Editar Fornecedor</SheetTitle>
          <SheetDescription>Atualize imagem, título e categoria do fornecedor.</SheetDescription>
        </SheetHeader>
        {error && (
          <div className="mt-4 mb-2 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">{error}</div>
        )}
        <div className="mt-4 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nome_fantasia">Título (Nome Fantasia)</Label>
            <Input id="nome_fantasia" value={form.nome_fantasia ?? ''} onChange={(e) => onChange('nome_fantasia', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imagem_url">Link da Imagem (https)</Label>
            <Input id="imagem_url" value={form.imagem_url ?? ''} onChange={(e) => onChange('imagem_url', e.target.value)} placeholder="https://exemplo.com/foto.jpg" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input id="categoria" value={form.categoria ?? ''} onChange={(e) => onChange('categoria', e.target.value)} placeholder="ex.: Materiais, Serviços, etc." />
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


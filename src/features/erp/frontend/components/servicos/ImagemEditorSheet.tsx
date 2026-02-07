"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Tipo = 'cliente' | 'tecnico'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: Tipo
  id: string | number | null
  prefill?: { nome?: string; imagem_url?: string }
  onSaved: () => void
}

export default function ImagemEditorSheet({ open, onOpenChange, tipo, id, prefill, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [imagemUrl, setImagemUrl] = useState('')
  const initialRef = useRef<{ imagem_url?: string }>({})

  const canSave = useMemo(() => !loading && !!id, [loading, id])

  useEffect(() => {
    const run = async () => {
      setError(null)
      if (!open) return
      const baseNome = prefill?.nome ?? ''
      const baseUrl = prefill?.imagem_url ?? ''
      try {
        if (id) {
          const res = await fetch(`/api/modulos/servicos/${tipo}s/${id}`, { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            const d = json?.data as Record<string, unknown> | undefined
            if (d) {
              setNome(String(d['nome'] ?? baseNome))
              setImagemUrl(String(d['imagem_url'] ?? baseUrl))
              initialRef.current = { imagem_url: String(d['imagem_url'] ?? baseUrl) }
              return
            }
          }
        }
      } catch (_) {
        // ignore
      }
      setNome(baseNome)
      setImagemUrl(baseUrl)
      initialRef.current = { imagem_url: baseUrl }
    }
    run()
  }, [open, id, tipo, prefill])

  const save = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const patch: Record<string, unknown> = {}
      if (imagemUrl !== (initialRef.current.imagem_url ?? '')) patch['imagem_url'] = imagemUrl
      if (Object.keys(patch).length) {
        const res = await fetch(`/api/modulos/servicos/${tipo}s/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!res.ok) throw new Error('Falha ao salvar imagem')
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
      <SheetContent side="right" className="w-[480px] sm:w-[560px]">
        <SheetHeader>
          <SheetTitle>Editar Imagem do {tipo === 'cliente' ? 'Cliente' : 'Técnico'}</SheetTitle>
          <SheetDescription>Informe um link HTTPS público da imagem para renderizar na lista.</SheetDescription>
        </SheetHeader>
        {error && (
          <div className="mt-4 mb-2 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">{error}</div>
        )}
        <div className="mt-4 space-y-4">
          <div>
            <Label>Nome</Label>
            <div className="text-sm text-gray-800 font-medium">{nome || 'Sem nome'}</div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imagem_url">Link da Imagem (https)</Label>
            <Input id="imagem_url" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://exemplo.com/foto.jpg" />
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


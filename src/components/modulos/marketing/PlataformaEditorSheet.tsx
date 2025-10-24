"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contaId: string | number | null
  prefill?: { plataforma?: string; imagem_url?: string }
  onSaved: () => void
}

export default function PlataformaEditorSheet({ open, onOpenChange, contaId, prefill, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plataforma, setPlataforma] = useState('')
  const [imagemUrl, setImagemUrl] = useState('')
  const initialRef = useRef<{ plataforma?: string; imagem_url?: string }>({})

  const canSave = useMemo(() => !loading && !!contaId, [loading, contaId])

  useEffect(() => {
    const run = async () => {
      setError(null)
      if (!open) return
      const basePlat = prefill?.plataforma ?? ''
      const baseImg = prefill?.imagem_url ?? ''
      try {
        if (contaId) {
          const res = await fetch(`/api/modulos/marketing/contas/${contaId}`, { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            const d = json?.data as Record<string, unknown> | undefined
            if (d) {
              const plat = String(d['plataforma'] ?? basePlat)
              const img = String(d['imagem_url'] ?? baseImg)
              setPlataforma(plat)
              setImagemUrl(img)
              initialRef.current = { plataforma: plat, imagem_url: img }
              return
            }
          }
        }
      } catch (_) {
        // ignore
      }
      setPlataforma(basePlat)
      setImagemUrl(baseImg)
      initialRef.current = { plataforma: basePlat, imagem_url: baseImg }
    }
    run()
  }, [open, contaId, prefill])

  const save = async () => {
    if (!contaId) return
    setLoading(true)
    setError(null)
    try {
      const patch: Record<string, unknown> = {}
      if (plataforma !== (initialRef.current.plataforma ?? '')) patch['plataforma'] = plataforma
      if (imagemUrl !== (initialRef.current.imagem_url ?? '')) patch['imagem_url'] = imagemUrl
      if (Object.keys(patch).length) {
        const res = await fetch(`/api/modulos/marketing/contas/${contaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!res.ok) throw new Error('Falha ao salvar')
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
          <SheetTitle>Editar Plataforma</SheetTitle>
          <SheetDescription>Atualize a imagem (link) e o título da plataforma.</SheetDescription>
        </SheetHeader>
        {error && (
          <div className="mt-4 mb-2 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">{error}</div>
        )}
        <div className="mt-4 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="plataforma">Título (Plataforma)</Label>
            <Input id="plataforma" value={plataforma} onChange={(e) => setPlataforma(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imagem_url">Link da Imagem (https)</Label>
            <Input id="imagem_url" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://exemplo.com/logo.png" />
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


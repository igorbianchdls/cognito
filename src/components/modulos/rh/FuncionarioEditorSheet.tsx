"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type FuncionarioForm = {
  nome_completo?: string
  email_corporativo?: string
  telefone?: string
  status?: string
  data_nascimento?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  funcionarioId: string | number | null
  funcionarioPrefill?: FuncionarioForm
  onSaved: () => void
}

export default function FuncionarioEditorSheet({ open, onOpenChange, funcionarioId, funcionarioPrefill, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FuncionarioForm>({})
  const initialRef = useRef<FuncionarioForm>({})

  const canSave = useMemo(() => !loading && !!funcionarioId, [loading, funcionarioId])

  useEffect(() => {
    const run = async () => {
      setError(null)
      if (!open) return
      const base: FuncionarioForm = {
        nome_completo: funcionarioPrefill?.nome_completo ?? '',
        email_corporativo: funcionarioPrefill?.email_corporativo ?? '',
        telefone: funcionarioPrefill?.telefone ?? '',
        status: funcionarioPrefill?.status ?? '',
        data_nascimento: funcionarioPrefill?.data_nascimento ?? '',
      }
      try {
        if (funcionarioId) {
          const res = await fetch(`/api/modulos/rh/funcionarios/${funcionarioId}`, { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            const d = json?.data as Record<string, unknown> | undefined
            if (d) {
              const next: FuncionarioForm = {
                nome_completo: String(d['nome_completo'] ?? base.nome_completo ?? ''),
                email_corporativo: String(d['email_corporativo'] ?? base.email_corporativo ?? ''),
                telefone: String(d['telefone'] ?? base.telefone ?? ''),
                status: String(d['status'] ?? base.status ?? ''),
                data_nascimento: String(d['data_nascimento'] ?? base.data_nascimento ?? ''),
              }
              setForm(next)
              initialRef.current = next
              return
            }
          }
        }
      } catch (_) {
        // fallback to base
      }
      setForm(base)
      initialRef.current = base
    }
    run()
  }, [open, funcionarioId, funcionarioPrefill])

  const onChange = (k: keyof FuncionarioForm, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const getPatch = (): Record<string, unknown> | null => {
    const changes: Record<string, unknown> = {}
    const keys: (keyof FuncionarioForm)[] = ['nome_completo', 'email_corporativo', 'telefone', 'status', 'data_nascimento']
    for (const key of keys) {
      const before = initialRef.current[key] ?? ''
      const now = form[key] ?? ''
      if (now !== before) {
        // Map to DB keys
        if (key === 'nome_completo') changes['nomecompleto'] = now
        else if (key === 'email_corporativo') changes['emailcorporativo'] = now
        else if (key === 'telefone') changes['telefonecorporativo'] = now
        else if (key === 'data_nascimento') changes['datanascimento'] = now
        else changes[String(key)] = now
      }
    }
    return Object.keys(changes).length ? changes : null
  }

  const save = async () => {
    if (!funcionarioId) return
    setLoading(true)
    setError(null)
    try {
      const patch = getPatch()
      if (patch && Object.keys(patch).length) {
        const res = await fetch(`/api/modulos/rh/funcionarios/${funcionarioId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!res.ok) throw new Error('Falha ao salvar funcionário')
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
      <SheetContent side="right" className="w-[520px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Funcionário</SheetTitle>
          <SheetDescription>Atualize os dados básicos do funcionário.</SheetDescription>
        </SheetHeader>

        {error && (
          <div className="mt-4 mb-2 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">{error}</div>
        )}

        <div className="mt-4 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nome_completo">Nome Completo</Label>
            <Input id="nome_completo" value={form.nome_completo ?? ''} onChange={(e) => onChange('nome_completo', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email_corporativo">E-mail Corporativo</Label>
            <Input id="email_corporativo" type="email" value={form.email_corporativo ?? ''} onChange={(e) => onChange('email_corporativo', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={form.telefone ?? ''} onChange={(e) => onChange('telefone', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Input id="status" value={form.status ?? ''} onChange={(e) => onChange('status', e.target.value)} placeholder="ativo | inativo | férias" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input id="data_nascimento" type="date" value={form.data_nascimento ?? ''} onChange={(e) => onChange('data_nascimento', e.target.value)} />
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


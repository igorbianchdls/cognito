"use client"

import * as React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function CadastroRegraContabilSheet({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [origem, setOrigem] = React.useState('contas_a_pagar')
  const [subtipo, setSubtipo] = React.useState('principal')
  const [planoContaId, setPlanoContaId] = React.useState('')
  const [contaDebitoId, setContaDebitoId] = React.useState('')
  const [contaCreditoId, setContaCreditoId] = React.useState('')
  const [descricao, setDescricao] = React.useState('')

  async function handleSave() {
    try {
      setSaving(true); setError(null)
      const body = {
        origem,
        subtipo: subtipo || null,
        plano_conta_id: Number(planoContaId),
        conta_debito_id: Number(contaDebitoId),
        conta_credito_id: Number(contaCreditoId),
        descricao: descricao || null,
      }
      const res = await fetch('/api/modulos/contabilidade/regras-contabeis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
      setOpen(false)
      setOrigem('contas_a_pagar'); setSubtipo('principal'); setPlanoContaId(''); setContaDebitoId(''); setContaCreditoId(''); setDescricao('')
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar')
    } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="ml-3 h-8 rounded bg-amber-200 px-3 text-gray-900 hover:bg-amber-300" variant="secondary">
          Nova Regra
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[720px] p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Nova Regra Contábil</SheetTitle>
            <SheetDescription>Origem + mapeamento de contas; crie a regra para o plano informado.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Origem</Label>
                <Select value={origem} onValueChange={setOrigem}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contas_a_pagar">Contas a Pagar</SelectItem>
                    <SelectItem value="pagamentos_efetuados">Pagamentos Efetuados</SelectItem>
                    <SelectItem value="contas_a_receber">Contas a Receber</SelectItem>
                    <SelectItem value="pagamentos_recebidos">Pagamentos Recebidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subtipo (opcional)</Label>
                <Input value={subtipo} onChange={(e) => setSubtipo(e.target.value)} placeholder="ex.: principal" />
              </div>
              <div>
                <Label>Plano de Contas (ID)</Label>
                <Input value={planoContaId} onChange={(e) => setPlanoContaId(e.target.value)} placeholder="ex.: 101" />
              </div>
              <div>
                <Label>Conta Débito (ID)</Label>
                <Input value={contaDebitoId} onChange={(e) => setContaDebitoId(e.target.value)} placeholder="ex.: 601" />
              </div>
              <div>
                <Label>Conta Crédito (ID)</Label>
                <Input value={contaCreditoId} onChange={(e) => setContaCreditoId(e.target.value)} placeholder="ex.: 211" />
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Texto livre do histórico" />
              </div>
            </div>
          </div>
          <SheetFooter className="p-4 border-t">
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={saving || !planoContaId || !contaDebitoId || !contaCreditoId}>Salvar</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}


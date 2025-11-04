"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroOportunidadeSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [contas, setContas] = React.useState<Item[]>([])
  const [vendedores, setVendedores] = React.useState<Item[]>([])

  const [nome, setNome] = React.useState("")
  const [contaId, setContaId] = React.useState("")
  const [usuarioId, setUsuarioId] = React.useState("")
  const [estagio, setEstagio] = React.useState("")
  const [valor, setValor] = React.useState("")
  const [prob, setProb] = React.useState("")
  const [dataFechamento, setDataFechamento] = React.useState("")
  const [status, setStatus] = React.useState("")

  const canSave = !!nome.trim()
  const reset = () => { setNome(""); setContaId(""); setUsuarioId(""); setEstagio(""); setValor(""); setProb(""); setDataFechamento(""); setStatus(""); setError(null) }

  const fetchList = async (url: string): Promise<Item[]> => {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json?.success || !Array.isArray(json?.rows)) return []
      return json.rows as Item[]
    } catch { return [] }
  }

  React.useEffect(() => {
    if (!open) return
    ;(async () => {
      const [cs, vs] = await Promise.all([
        fetchList('/api/modulos/crm/contas/list'),
        fetchList('/api/modulos/vendas/vendedores/list'),
      ])
      setContas(cs)
      setVendedores(vs)
    })()
  }, [open])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.set('nome', nome.trim())
      if (contaId) fd.set('conta_id', contaId)
      if (usuarioId) fd.set('usuario_id', usuarioId)
      if (estagio) fd.set('estagio', estagio.trim())
      if (valor) fd.set('valor', valor)
      if (prob) fd.set('probabilidade', prob)
      if (dataFechamento) fd.set('data_fechamento', dataFechamento)
      if (status) fd.set('status', status.trim())
      const res = await fetch('/api/modulos/crm/oportunidades', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const id = Number(json?.id)
      setOpen(false)
      reset()
      if (!Number.isNaN(id)) onCreated?.(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-3xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Oportunidade</SheetTitle>
            <SheetDescription>Defina os dados da oportunidade</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label>Nome da Oportunidade<span className="text-red-500"> *</span></Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <Label>Conta</Label>
                <Select value={contaId} onValueChange={setContaId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                  <SelectContent>
                    {contas.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsável</Label>
                <Select value={usuarioId} onValueChange={setUsuarioId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {vendedores.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estágio</Label>
                <Input value={estagio} onChange={(e) => setEstagio(e.target.value)} placeholder="ex: qualificação, proposta, fechado" />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
              </div>
              <div>
                <Label>Probabilidade (%)</Label>
                <Input type="number" step="1" value={prob} onChange={(e) => setProb(e.target.value)} />
              </div>
              <div>
                <Label>Data de Fechamento</Label>
                <Input type="date" value={dataFechamento} onChange={(e) => setDataFechamento(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Input value={status} onChange={(e) => setStatus(e.target.value)} />
              </div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}


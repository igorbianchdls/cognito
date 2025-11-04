"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroContaSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [vendedores, setVendedores] = React.useState<Item[]>([])

  const [nome, setNome] = React.useState("")
  const [setor, setSetor] = React.useState("")
  const [site, setSite] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [enderecoCobranca, setEnderecoCobranca] = React.useState("")
  const [usuarioId, setUsuarioId] = React.useState("")

  const canSave = !!nome.trim()
  const reset = () => { setNome(""); setSetor(""); setSite(""); setTelefone(""); setEnderecoCobranca(""); setUsuarioId(""); setError(null) }

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
      const vs = await fetchList('/api/modulos/vendas/vendedores/list')
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
      if (setor) fd.set('setor', setor.trim())
      if (site) fd.set('site', site.trim())
      if (telefone) fd.set('telefone', telefone.trim())
      if (enderecoCobranca) fd.set('endereco_cobranca', enderecoCobranca.trim())
      if (usuarioId) fd.set('usuario_id', usuarioId)
      const res = await fetch('/api/modulos/crm/contas', { method: 'POST', body: fd })
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
      <SheetContent side="right" className="w-screen max-w-2xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Conta</SheetTitle>
            <SheetDescription>Defina os dados da conta</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Nome<span className="text-red-500"> *</span></Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <Label>Setor</Label>
                <Input value={setor} onChange={(e) => setSetor(e.target.value)} />
              </div>
              <div>
                <Label>Site</Label>
                <Input value={site} onChange={(e) => setSite(e.target.value)} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço de Cobrança</Label>
                <Input value={enderecoCobranca} onChange={(e) => setEnderecoCobranca(e.target.value)} />
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

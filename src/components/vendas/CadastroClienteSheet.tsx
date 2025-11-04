"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type Props = {
  triggerLabel?: string
  onCreated?: (id: number) => void
}

type Item = { id: number; nome: string }

export default function CadastroClienteSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [vendedores, setVendedores] = React.useState<Item[]>([])
  const [territorios, setTerritorios] = React.useState<Item[]>([])

  const [nome, setNome] = React.useState("")
  const [nomeFantasia, setNomeFantasia] = React.useState("")
  const [razaoSocial, setRazaoSocial] = React.useState("")
  const [cpfCnpj, setCpfCnpj] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [vendedorId, setVendedorId] = React.useState("")
  const [territorioId, setTerritorioId] = React.useState("")
  const [canalOrigem, setCanalOrigem] = React.useState("")
  const [categoriaCliente, setCategoriaCliente] = React.useState("")
  const [statusCliente, setStatusCliente] = React.useState("")
  const [clienteDesde, setClienteDesde] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const canSave = !!nome.trim()

  const resetForm = () => {
    setNome("")
    setNomeFantasia("")
    setRazaoSocial("")
    setCpfCnpj("")
    setEmail("")
    setTelefone("")
    setVendedorId("")
    setTerritorioId("")
    setCanalOrigem("")
    setCategoriaCliente("")
    setStatusCliente("")
    setClienteDesde("")
    setAtivo(true)
    setError(null)
  }

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
      const [ve, te] = await Promise.all([
        fetchList('/api/modulos/vendas/vendedores/list'),
        fetchList('/api/modulos/vendas/territorios/list'),
      ])
      setVendedores(ve)
      setTerritorios(te)
    })()
  }, [open])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.set('nome', nome.trim())
      if (nomeFantasia) fd.set('nome_fantasia', nomeFantasia.trim())
      if (razaoSocial) fd.set('razao_social', razaoSocial.trim())
      if (cpfCnpj) fd.set('cpf_cnpj', cpfCnpj.trim())
      if (email) fd.set('email', email.trim())
      if (telefone) fd.set('telefone', telefone.trim())
      if (vendedorId) fd.set('vendedor_id', vendedorId)
      if (territorioId) fd.set('territorio_id', territorioId)
      if (canalOrigem) fd.set('canal_origem', canalOrigem.trim())
      if (categoriaCliente) fd.set('categoria_cliente', categoriaCliente.trim())
      if (statusCliente) fd.set('status_cliente', statusCliente.trim())
      if (clienteDesde) fd.set('cliente_desde', clienteDesde)
      fd.set('ativo', String(ativo))

      const res = await fetch('/api/modulos/vendas/clientes', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const id = Number(json?.id)
      setOpen(false)
      resetForm()
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
        <Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-3xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Cliente</SheetTitle>
            <SheetDescription>Preencha os dados do cliente</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Nome<span className="text-red-500"> *</span></Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <Label>CPF/CNPJ</Label>
                <Input value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
              </div>

              <div>
                <Label>Nome Fantasia</Label>
                <Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
              </div>
              <div>
                <Label>Razão Social</Label>
                <Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
              <div>
                <Label>Vendedor</Label>
                <Select value={vendedorId} onValueChange={setVendedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map(v => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Território</Label>
                <Select value={territorioId} onValueChange={setTerritorioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o território" />
                  </SelectTrigger>
                  <SelectContent>
                    {territorios.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Canal de Origem</Label>
                <Input value={canalOrigem} onChange={(e) => setCanalOrigem(e.target.value)} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={categoriaCliente} onChange={(e) => setCategoriaCliente(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Input value={statusCliente} onChange={(e) => setStatusCliente(e.target.value)} placeholder="ex: ativo, potencial" />
              </div>

              <div>
                <Label>Cliente desde</Label>
                <Input type="date" value={clienteDesde} onChange={(e) => setClienteDesde(e.target.value)} />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="ativo" checked={ativo} onCheckedChange={(c) => setAtivo(c === true)} />
                <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
              </div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t">
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={onSave} disabled={!canSave || loading}>
              {loading ? 'Salvando…' : 'Salvar'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

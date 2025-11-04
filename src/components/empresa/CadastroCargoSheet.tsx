"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  triggerLabel?: string
  onCreated?: (cargoId: number) => void
}

type Empresa = { id: number; razao_social: string; nome_fantasia?: string }
type Departamento = { id: number; nome: string; codigo?: string }

const NIVEIS = [
  { value: 'operacional', label: 'Operacional' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'gerencial', label: 'Gerencial' },
  { value: 'diretoria', label: 'Diretoria' },
]

export default function CadastroCargoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])
  const [departamentos, setDepartamentos] = React.useState<Departamento[]>([])

  const [empresaId, setEmpresaId] = React.useState("")
  const [departamentoId, setDepartamentoId] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [nome, setNome] = React.useState("")
  const [nivel, setNivel] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const resetForm = () => {
    setEmpresaId("")
    setDepartamentoId("")
    setCodigo("")
    setNome("")
    setNivel("")
    setDescricao("")
    setAtivo(true)
    setError(null)
  }

  const loadEmpresas = React.useCallback(async () => {
    try {
      const res = await fetch('/api/empresa/empresas/list', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        setEmpresas(json.rows)
      } else {
        setEmpresas([])
      }
    } catch {
      setEmpresas([])
    }
  }, [])

  const loadDepartamentos = React.useCallback(async (empId: string) => {
    if (!empId) {
      setDepartamentos([])
      return
    }
    try {
      const res = await fetch(`/api/empresa/departamentos/list?empresa_id=${empId}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        setDepartamentos(json.rows)
      } else {
        setDepartamentos([])
      }
    } catch {
      setDepartamentos([])
    }
  }, [])

  React.useEffect(() => {
    if (open) loadEmpresas()
  }, [open, loadEmpresas])

  React.useEffect(() => {
    if (empresaId) {
      loadDepartamentos(empresaId)
      setDepartamentoId("") // Reset departamento when empresa changes
    }
  }, [empresaId, loadDepartamentos])

  const canSave = !!empresaId && !!codigo.trim() && !!nome.trim()

  const onSave = async () => {
    if (!canSave || loading) return

    try {
      setLoading(true)
      setError(null)

      const fd = new FormData()
      fd.set('view', 'cargos')
      fd.set('empresa_id', empresaId)
      if (departamentoId) fd.set('departamento_id', departamentoId)
      fd.set('codigo', codigo.trim())
      fd.set('nome', nome.trim())
      if (nivel) fd.set('nivel', nivel)
      if (descricao) fd.set('descricao', descricao.trim())
      fd.set('ativo', String(ativo))

      const res = await fetch('/api/modulos/empresa/create', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      }

      const cargoId = Number(json?.id)
      setOpen(false)
      resetForm()
      if (typeof cargoId === 'number' && !Number.isNaN(cargoId)) {
        onCreated?.(cargoId)
      }
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
      <SheetContent side="right" className="w-screen max-w-2xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Cargo</SheetTitle>
            <SheetDescription>Preencha os dados do cargo</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="md:col-span-2">
                <Label>Empresa <span className="text-red-500">*</span></Label>
                <Select onValueChange={setEmpresaId} value={empresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nome_fantasia || e.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Departamento</Label>
                <Select onValueChange={setDepartamentoId} value={departamentoId} disabled={!empresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder={empresaId ? "Selecione o departamento" : "Selecione uma empresa primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.codigo ? `${d.codigo} - ${d.nome}` : d.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Código <span className="text-red-500">*</span></Label>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: CARGO001" />
              </div>

              <div>
                <Label>Nome <span className="text-red-500">*</span></Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Analista de Sistemas" />
              </div>

              <div className="md:col-span-2">
                <Label>Nível</Label>
                <Select onValueChange={setNivel} value={nivel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVEIS.map(n => (
                      <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={4}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva as responsabilidades e requisitos do cargo"
                />
              </div>

              <div className="md:col-span-2 flex items-center space-x-2">
                <Checkbox id="ativo" checked={ativo} onCheckedChange={(checked) => setAtivo(checked === true)} />
                <Label htmlFor="ativo" className="cursor-pointer">Cargo ativo</Label>
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

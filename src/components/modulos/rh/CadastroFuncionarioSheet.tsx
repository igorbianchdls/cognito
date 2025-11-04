"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { validateEmail } from "@/lib/validators"

type Props = {
  triggerLabel?: string
  onCreated?: (funcionarioId: number) => void
}

type Cargo = { cargoid: number; nome: string }
type Departamento = { departamentoid: number; nome: string }
type Funcionario = { funcionarioid: number; nomecompleto: string }

export default function CadastroFuncionarioSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [cargos, setCargos] = React.useState<Cargo[]>([])
  const [departamentos, setDepartamentos] = React.useState<Departamento[]>([])
  const [gestores, setGestores] = React.useState<Funcionario[]>([])

  const [nomeCompleto, setNomeCompleto] = React.useState("")
  const [emailCorporativo, setEmailCorporativo] = React.useState("")
  const [telefoneCorporativo, setTelefoneCorporativo] = React.useState("")
  const [status, setStatus] = React.useState("ativo")
  const [dataNascimento, setDataNascimento] = React.useState("")
  const [cargoId, setCargoId] = React.useState("")
  const [departamentoId, setDepartamentoId] = React.useState("")
  const [gestorDiretoId, setGestorDiretoId] = React.useState("")

  const [imagemTipo, setImagemTipo] = React.useState<"url" | "upload">("url")
  const [imagemUrl, setImagemUrl] = React.useState("")
  const [imagemFile, setImagemFile] = React.useState<File | null>(null)

  const resetForm = () => {
    setNomeCompleto("")
    setEmailCorporativo("")
    setTelefoneCorporativo("")
    setStatus("ativo")
    setDataNascimento("")
    setCargoId("")
    setDepartamentoId("")
    setGestorDiretoId("")
    setImagemTipo("url")
    setImagemUrl("")
    setImagemFile(null)
    setError(null)
  }

  const loadOptions = React.useCallback(async () => {
    try {
      // Carregar cargos
      const cargoRes = await fetch('/api/modulos/rh?view=cargos&pageSize=1000', { cache: 'no-store' })
      const cargoJson = await cargoRes.json()
      if (cargoRes.ok && Array.isArray(cargoJson?.rows)) {
        setCargos(cargoJson.rows)
      }

      // Carregar departamentos
      const deptoRes = await fetch('/api/modulos/rh?view=departamentos&pageSize=1000', { cache: 'no-store' })
      const deptoJson = await deptoRes.json()
      if (deptoRes.ok && Array.isArray(deptoJson?.rows)) {
        setDepartamentos(deptoJson.rows)
      }

      // Carregar funcionários (para gestor)
      const funcRes = await fetch('/api/modulos/rh/funcionarios/list', { cache: 'no-store' })
      const funcJson = await funcRes.json()
      if (funcRes.ok && Array.isArray(funcJson?.rows)) {
        setGestores(funcJson.rows)
      }
    } catch (err) {
      console.error('Erro ao carregar opções:', err)
    }
  }, [])

  React.useEffect(() => {
    if (open) loadOptions()
  }, [open, loadOptions])

  const canSave = !!nomeCompleto.trim() && !!emailCorporativo.trim()

  const onSave = async () => {
    if (!canSave || loading) return

    // Validações
    if (!validateEmail(emailCorporativo)) {
      setError('E-mail inválido')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const fd = new FormData()
      fd.set('view', 'funcionarios')
      fd.set('nomecompleto', nomeCompleto.trim())
      fd.set('emailcorporativo', emailCorporativo.trim())
      if (telefoneCorporativo) fd.set('telefonecorporativo', telefoneCorporativo.trim())
      fd.set('status', status)
      if (dataNascimento) fd.set('datanascimento', dataNascimento)
      if (cargoId) fd.set('cargoid', cargoId)
      if (departamentoId) fd.set('departamentoid', departamentoId)
      if (gestorDiretoId) fd.set('gestordiretoid', gestorDiretoId)

      // Imagem: URL ou Upload
      if (imagemTipo === 'url' && imagemUrl) {
        fd.set('imagem_url', imagemUrl.trim())
      } else if (imagemTipo === 'upload' && imagemFile) {
        fd.set('file', imagemFile)
      }

      const res = await fetch('/api/modulos/rh/create', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      }

      const funcionarioId = Number(json?.id)
      setOpen(false)
      resetForm()
      if (typeof funcionarioId === 'number' && !Number.isNaN(funcionarioId)) {
        onCreated?.(funcionarioId)
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
            <SheetTitle>Cadastrar Funcionário</SheetTitle>
            <SheetDescription>Preencha os dados do funcionário</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nome Completo <span className="text-red-500">*</span></Label>
                <Input value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} placeholder="Ex: João Silva" />
              </div>

              <div>
                <Label>E-mail Corporativo <span className="text-red-500">*</span></Label>
                <Input type="email" value={emailCorporativo} onChange={(e) => setEmailCorporativo(e.target.value)} placeholder="joao@empresa.com" />
              </div>

              <div>
                <Label>Telefone Corporativo</Label>
                <Input value={telefoneCorporativo} onChange={(e) => setTelefoneCorporativo(e.target.value)} placeholder="(11) 98765-4321" />
              </div>

              <div>
                <Label>Status</Label>
                <Select onValueChange={setStatus} value={status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
              </div>

              <div>
                <Label>Cargo</Label>
                <Select onValueChange={setCargoId} value={cargoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos.map(c => (
                      <SelectItem key={c.cargoid} value={String(c.cargoid)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Departamento</Label>
                <Select onValueChange={setDepartamentoId} value={departamentoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map(d => (
                      <SelectItem key={d.departamentoid} value={String(d.departamentoid)}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Gestor Direto</Label>
                <Select onValueChange={setGestorDiretoId} value={gestorDiretoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {gestores.map(g => (
                      <SelectItem key={g.funcionarioid} value={String(g.funcionarioid)}>{g.nomecompleto}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Imagem do Funcionário</Label>
                <RadioGroup value={imagemTipo} onValueChange={(v) => setImagemTipo(v as "url" | "upload")} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="url" id="imagem-url" />
                    <Label htmlFor="imagem-url" className="cursor-pointer">URL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upload" id="imagem-upload" />
                    <Label htmlFor="imagem-upload" className="cursor-pointer">Upload</Label>
                  </div>
                </RadioGroup>
                {imagemTipo === 'url' ? (
                  <Input className="mt-2" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://exemplo.com/foto.jpg" />
                ) : (
                  <Input className="mt-2" type="file" accept="image/*" onChange={(e) => setImagemFile(e.target.files?.[0] || null)} />
                )}
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

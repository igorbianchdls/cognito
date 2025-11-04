"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type Props = {
  triggerLabel?: string
  onCreated?: (id: number) => void
}

type Produto = { id: number; nome: string }
type Variacao = { id: number; sku: string; produto_nome: string }

export default function CadastroDadosFiscaisSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [produtos, setProdutos] = React.useState<Produto[]>([])
  const [variacoes, setVariacoes] = React.useState<Variacao[]>([])

  const [produtoId, setProdutoId] = React.useState("")
  const [variacaoId, setVariacaoId] = React.useState("")
  const [ncm, setNcm] = React.useState("")
  const [cest, setCest] = React.useState("")
  const [cfop, setCfop] = React.useState("")
  const [cst, setCst] = React.useState("")
  const [origem, setOrigem] = React.useState("")
  const [aliquotaIcms, setAliquotaIcms] = React.useState("")
  const [aliquotaIpi, setAliquotaIpi] = React.useState("")
  const [aliquotaPis, setAliquotaPis] = React.useState("")
  const [aliquotaCofins, setAliquotaCofins] = React.useState("")
  const [regimeTributario, setRegimeTributario] = React.useState("")

  const canSave = !!variacaoId

  const resetForm = () => {
    setProdutoId("")
    setVariacaoId("")
    setNcm("")
    setCest("")
    setCfop("")
    setCst("")
    setOrigem("")
    setAliquotaIcms("")
    setAliquotaIpi("")
    setAliquotaPis("")
    setAliquotaCofins("")
    setRegimeTributario("")
    setError(null)
  }

  const loadProdutos = React.useCallback(async () => {
    try {
      const res = await fetch('/api/modulos/produtos/produtos/list', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) setProdutos(json.rows)
      else setProdutos([])
    } catch {
      setProdutos([])
    }
  }, [])

  const loadVariacoes = React.useCallback(async (produtoId?: string) => {
    try {
      const url = produtoId ? `/api/modulos/produtos/variacoes/list?produto_id=${encodeURIComponent(produtoId)}` : '/api/modulos/produtos/variacoes/list'
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) setVariacoes(json.rows)
      else setVariacoes([])
    } catch {
      setVariacoes([])
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      loadProdutos();
      loadVariacoes(undefined);
    }
  }, [open, loadProdutos, loadVariacoes])

  React.useEffect(() => {
    if (produtoId) {
      loadVariacoes(produtoId)
      setVariacaoId("")
    }
  }, [produtoId, loadVariacoes])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.set('view', 'dados-fiscais')
      fd.set('variacao_id', variacaoId)
      if (ncm) fd.set('ncm', ncm.trim())
      if (cest) fd.set('cest', cest.trim())
      if (cfop) fd.set('cfop', cfop.trim())
      if (cst) fd.set('cst', cst.trim())
      if (origem) fd.set('origem', origem.trim())
      if (aliquotaIcms) fd.set('aliquota_icms', aliquotaIcms)
      if (aliquotaIpi) fd.set('aliquota_ipi', aliquotaIpi)
      if (aliquotaPis) fd.set('aliquota_pis', aliquotaPis)
      if (aliquotaCofins) fd.set('aliquota_cofins', aliquotaCofins)
      if (regimeTributario) fd.set('regime_tributario', regimeTributario.trim())

      const res = await fetch('/api/modulos/produtos/create', { method: 'POST', body: fd })
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
      <SheetContent side="right" className="w-screen max-w-2xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Dados Fiscais</SheetTitle>
            <SheetDescription>Preencha os dados fiscais da variação</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Produto (opcional p/ filtrar)</Label>
                <Select value={produtoId} onValueChange={setProdutoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Variação <span className="text-red-500">*</span></Label>
                <Select value={variacaoId} onValueChange={setVariacaoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a variação" />
                  </SelectTrigger>
                  <SelectContent>
                    {variacoes.map(v => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.produto_nome} — {v.sku}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>NCM</Label>
                <Input value={ncm} onChange={(e) => setNcm(e.target.value)} />
              </div>
              <div>
                <Label>CEST</Label>
                <Input value={cest} onChange={(e) => setCest(e.target.value)} />
              </div>
              <div>
                <Label>CFOP</Label>
                <Input value={cfop} onChange={(e) => setCfop(e.target.value)} />
              </div>
              <div>
                <Label>CST</Label>
                <Input value={cst} onChange={(e) => setCst(e.target.value)} />
              </div>
              <div>
                <Label>Origem</Label>
                <Input value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="ex: nacional / importado" />
              </div>

              <div>
                <Label>ICMS (%)</Label>
                <Input value={aliquotaIcms} onChange={(e) => setAliquotaIcms(e.target.value)} type="number" step="0.01" />
              </div>
              <div>
                <Label>IPI (%)</Label>
                <Input value={aliquotaIpi} onChange={(e) => setAliquotaIpi(e.target.value)} type="number" step="0.01" />
              </div>
              <div>
                <Label>PIS (%)</Label>
                <Input value={aliquotaPis} onChange={(e) => setAliquotaPis(e.target.value)} type="number" step="0.01" />
              </div>
              <div>
                <Label>COFINS (%)</Label>
                <Input value={aliquotaCofins} onChange={(e) => setAliquotaCofins(e.target.value)} type="number" step="0.01" />
              </div>

              <div className="md:col-span-2">
                <Label>Regime Tributário</Label>
                <Input value={regimeTributario} onChange={(e) => setRegimeTributario(e.target.value)} placeholder="ex: simples, lucro presumido" />
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

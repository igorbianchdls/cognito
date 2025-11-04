"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type Props = { triggerLabel?: string; onSaved?: () => void }
type Item = { id: number; nome: string }

export default function CadastroContaFinanceiraSheet({ triggerLabel = "Cadastrar", onSaved }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [bancos, setBancos] = React.useState<Item[]>([])

  const [nome, setNome] = React.useState("")
  const [tipo, setTipo] = React.useState("")
  const [bancoId, setBancoId] = React.useState("")
  const [agencia, setAgencia] = React.useState("")
  const [numeroConta, setNumeroConta] = React.useState("")
  const [pixChave, setPixChave] = React.useState("")
  const [saldoInicial, setSaldoInicial] = React.useState("")
  const [dataAbertura, setDataAbertura] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const canSave = !!nome.trim() && !!tipo.trim()
  const reset = () => { setNome(""); setTipo(""); setBancoId(""); setAgencia(""); setNumeroConta(""); setPixChave(""); setSaldoInicial(""); setDataAbertura(""); setAtivo(true); setError(null) }

  const fetchList = async (url: string): Promise<Item[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as Item[] : [] } catch { return [] }
  }

  React.useEffect(() => { if (!open) return; (async () => { const bs = await fetchList('/api/modulos/financeiro/bancos/list'); setBancos(bs) })() }, [open])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('nome_conta', nome.trim())
      fd.set('tipo_conta', tipo.trim())
      if (bancoId) fd.set('banco_id', bancoId)
      if (agencia) fd.set('agencia', agencia.trim())
      if (numeroConta) fd.set('numero_conta', numeroConta.trim())
      if (pixChave) fd.set('pix_chave', pixChave.trim())
      if (saldoInicial) fd.set('saldo_inicial', saldoInicial)
      if (dataAbertura) fd.set('data_abertura', dataAbertura)
      fd.set('ativo', String(ativo))
      const res = await fetch('/api/modulos/financeiro/contas-financeiras', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      setOpen(false); reset(); onSaved?.()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar') } finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button></SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-2xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Conta Financeira</SheetTitle><SheetDescription>Defina os dados da conta</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Nome da Conta<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
              <div><Label>Tipo de Conta<span className="text-red-500"> *</span></Label><Input value={tipo} onChange={(e)=>setTipo(e.target.value)} placeholder="ex: corrente, poupança, carteira" /></div>
              <div>
                <Label>Banco</Label>
                <Select value={bancoId} onValueChange={setBancoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                  <SelectContent>{bancos.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Agência</Label><Input value={agencia} onChange={(e)=>setAgencia(e.target.value)} /></div>
              <div><Label>Número da Conta</Label><Input value={numeroConta} onChange={(e)=>setNumeroConta(e.target.value)} /></div>
              <div><Label>Pix Chave</Label><Input value={pixChave} onChange={(e)=>setPixChave(e.target.value)} /></div>
              <div><Label>Saldo Inicial</Label><Input type="number" step="0.01" value={saldoInicial} onChange={(e)=>setSaldoInicial(e.target.value)} /></div>
              <div><Label>Data de Abertura</Label><Input type="date" value={dataAbertura} onChange={(e)=>setDataAbertura(e.target.value)} /></div>
              <div className="flex items-center space-x-2"><Checkbox id="ativo" checked={ativo} onCheckedChange={(c)=>setAtivo(c === true)} /><Label htmlFor="ativo" className="cursor-pointer">Ativa</Label></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

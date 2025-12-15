"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onSaved?: () => void }
type Item = { id: number; nome: string }

export default function CadastroContaFinanceiraSheet({ triggerLabel = "Cadastrar", onSaved }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)

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

  const reset = () => { setNome(""); setTipo(""); setBancoId(""); setAgencia(""); setNumeroConta(""); setPixChave(""); setSaldoInicial(""); setDataAbertura(""); setAtivo(true) }

  const fetchList = async (url: string): Promise<Item[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as Item[] : [] } catch { return [] }
  }

  React.useEffect(() => { if (!isOpen) return; (async () => { const bs = await fetchList('/api/modulos/financeiro/bancos/list'); setBancos(bs) })() }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(nome.trim() && tipo.trim())) return { success: false, error: 'Informe nome e tipo da conta.' }
    try {
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
      if (!res.ok || !json?.success) return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Conta Financeira"
      description="Defina os dados da conta"
      widthClassName="max-w-2xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { reset(); onSaved?.() }}
    >
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
    </BaseCadastroSheet>
  )
}

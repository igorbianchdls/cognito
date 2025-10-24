"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Conta = {
  id: string | number
  descricao?: string
  data_vencimento?: string
  valor_total?: number | string
  status?: string
  tipo_titulo?: string
}

type FornecedorPrefill = {
  nome_fornecedor?: string
  imagem_url?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  conta: Conta | null
  fornecedorId: string | number | null
  fornecedorPrefill?: FornecedorPrefill
  onSaved: () => void
}

export default function FornecedorEditorSheet({ open, onOpenChange, conta, fornecedorId, fornecedorPrefill, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fornecedor, setFornecedor] = useState<FornecedorPrefill>({ nome_fornecedor: '', imagem_url: '' })
  const [contaForm, setContaForm] = useState<Conta>({ id: '', descricao: '', data_vencimento: '', valor_total: '', status: '' })

  const initialFornecedorRef = useRef<FornecedorPrefill>({})
  const initialContaRef = useRef<Conta>({ id: '' })

  const canSave = useMemo(() => {
    return !loading && fornecedorId && conta?.id
  }, [loading, fornecedorId, conta?.id])

  // Load fornecedor and prefill forms when opened
  useEffect(() => {
    const run = async () => {
      setError(null)
      if (!open) return
      try {
        // Prefill conta fields from props
        setContaForm({
          id: String(conta?.id ?? ''),
          descricao: conta?.descricao ?? '',
          data_vencimento: (conta?.data_vencimento as string) ?? '',
          valor_total: (conta?.valor_total as number | string) ?? '',
          status: conta?.status ?? '',
          tipo_titulo: conta?.tipo_titulo ?? undefined,
        })
        initialContaRef.current = {
          id: String(conta?.id ?? ''),
          descricao: conta?.descricao ?? '',
          data_vencimento: (conta?.data_vencimento as string) ?? '',
          valor_total: (conta?.valor_total as number | string) ?? '',
          status: conta?.status ?? '',
          tipo_titulo: conta?.tipo_titulo ?? undefined,
        }

        // Prefill fornecedor from prefill
        const baseFornecedor = {
          nome_fornecedor: fornecedorPrefill?.nome_fornecedor ?? '',
          imagem_url: fornecedorPrefill?.imagem_url ?? '',
        }

        // Fetch fornecedor full data
        if (fornecedorId) {
          try {
            const res = await fetch(`/api/modulos/financeiro/fornecedores/${fornecedorId}`, { cache: 'no-store' })
            if (res.ok) {
              const json = await res.json()
              if (json?.data) {
                const f = json.data as Record<string, unknown>
                setFornecedor({
                  nome_fornecedor: String(f['nome_fornecedor'] ?? baseFornecedor.nome_fornecedor ?? ''),
                  imagem_url: String(f['imagem_url'] ?? baseFornecedor.imagem_url ?? ''),
                })
                initialFornecedorRef.current = {
                  nome_fornecedor: String(f['nome_fornecedor'] ?? baseFornecedor.nome_fornecedor ?? ''),
                  imagem_url: String(f['imagem_url'] ?? baseFornecedor.imagem_url ?? ''),
                }
              } else {
                setFornecedor(baseFornecedor)
                initialFornecedorRef.current = baseFornecedor
              }
            } else {
              setFornecedor(baseFornecedor)
              initialFornecedorRef.current = baseFornecedor
            }
          } catch {
            setFornecedor(baseFornecedor)
            initialFornecedorRef.current = baseFornecedor
          }
        } else {
          setFornecedor(baseFornecedor)
          initialFornecedorRef.current = baseFornecedor
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar dados')
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fornecedorId])

  const onChangeFornecedor = (k: keyof FornecedorPrefill, v: string) => {
    setFornecedor((prev) => ({ ...prev, [k]: v }))
  }
  const onChangeConta = (k: keyof Conta, v: string | number) => {
    setContaForm((prev) => ({ ...prev, [k]: v }))
  }

  type FornecedorKeys = 'nome_fornecedor' | 'imagem_url'
  const getFornecedorPatch = (): Partial<Pick<FornecedorPrefill, FornecedorKeys>> | null => {
    const changes: Partial<Pick<FornecedorPrefill, FornecedorKeys>> = {}
    const keys: FornecedorKeys[] = ['nome_fornecedor', 'imagem_url']
    for (const key of keys) {
      const before = initialFornecedorRef.current[key] ?? ''
      const now = fornecedor[key] ?? ''
      if (now !== before) changes[key] = now
    }
    return Object.keys(changes).length ? changes : null
  }

  type ContaPatchKeys = 'descricao' | 'data_vencimento' | 'valor_total' | 'status' | 'tipo_titulo'
  const getContaPatch = (): Partial<Pick<Conta, ContaPatchKeys>> | null => {
    const changes: Partial<Pick<Conta, ContaPatchKeys>> = {}
    const keys: ContaPatchKeys[] = ['descricao', 'data_vencimento', 'valor_total', 'status', 'tipo_titulo']
    for (const key of keys) {
      const before = (initialContaRef.current as Conta)[key]
      const now = (contaForm as Conta)[key]
      if (key === 'valor_total') {
        const n = typeof now === 'string' ? (now.trim() === '' ? '' : Number(now)) : now
        const nb = typeof before === 'string' ? (before.trim() === '' ? '' : Number(before)) : before
        if (n !== nb) changes[key] = n as number | string
      } else if (now !== before) {
        if (typeof now !== 'undefined') {
          changes[key] = now as string
        }
      }
    }
    return Object.keys(changes).length ? changes : null
  }

  const save = async () => {
    if (!fornecedorId || !conta?.id) return
    setLoading(true)
    setError(null)
    try {
      const fornecedorPatch = getFornecedorPatch()
      if (fornecedorPatch && Object.keys(fornecedorPatch).length) {
        const res = await fetch(`/api/modulos/financeiro/fornecedores/${fornecedorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fornecedorPatch),
        })
        if (!res.ok) throw new Error('Falha ao salvar fornecedor')
      }

      const contaPatch = getContaPatch()
      if (contaPatch && Object.keys(contaPatch).length) {
        const res = await fetch(`/api/modulos/financeiro/contas-a-pagar/${conta.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contaPatch),
        })
        if (!res.ok) throw new Error('Falha ao salvar conta')
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
          <SheetTitle>Editar Fornecedor e Conta</SheetTitle>
          <SheetDescription>
            Atualize dados do fornecedor (nome e link da imagem) e os campos da conta a pagar.
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="mt-4 mb-2 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Fornecedor</h3>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="nome_fornecedor">Nome</Label>
                <Input id="nome_fornecedor" value={fornecedor.nome_fornecedor ?? ''} onChange={(e) => onChangeFornecedor('nome_fornecedor', e.target.value)} placeholder="Digite o nome do fornecedor" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imagem_url">Link da imagem (https)</Label>
                <Input id="imagem_url" value={fornecedor.imagem_url ?? ''} onChange={(e) => onChangeFornecedor('imagem_url', e.target.value)} placeholder="https://exemplo.com/foto.jpg" />
                <p className="text-xs text-gray-500">Cole um link público (jpg, png, webp). Usamos diretamente no &lt;img&gt;.</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Conta a Pagar</h3>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input id="descricao" value={String(contaForm.descricao ?? '')} onChange={(e) => onChangeConta('descricao', e.target.value)} placeholder="Descrição da conta" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data_vencimento">Vencimento</Label>
                <Input id="data_vencimento" type="date" value={String(contaForm.data_vencimento ?? '')} onChange={(e) => onChangeConta('data_vencimento', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valor_total">Valor Total</Label>
                <Input id="valor_total" type="number" step="0.01" value={String(contaForm.valor_total ?? '')} onChange={(e) => onChangeConta('valor_total', e.target.value)} placeholder="0,00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" value={String(contaForm.status ?? '')} onChange={(e) => onChangeConta('status', e.target.value)} placeholder="pendente | pago | vencido" />
              </div>
            </div>
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

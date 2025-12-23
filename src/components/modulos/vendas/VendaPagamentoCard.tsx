"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import ParcelasEditor, { type Parcela } from "@/components/modulos/financeiro/shared/ParcelasEditor"
import type { PaymentConditionConfig } from "@/components/modulos/financeiro/shared/PaymentConditionHeader"

function fmtBRL(n: number) {
  return (Number(n || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export type VendaPagamentoCardProps = {
  total: number
  cond: PaymentConditionConfig
  onChangeCond: (patch: Partial<PaymentConditionConfig>) => void
  parcelas: Parcela[]
  onChangeParcel: (idx: number, patch: Partial<Parcela>) => void
  formasPagamento: Array<{ value: string; label: string }>
  contas: Array<{ value: string; label: string }>
}

export default function VendaPagamentoCard({ total, cond, onChangeCond, parcelas, onChangeParcel, formasPagamento, contas }: VendaPagamentoCardProps) {
  const [showEditor, setShowEditor] = React.useState(false)

  const parcelasOpts = React.useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}x` })), [])

  return (
    <Card className="p-4 mx-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-base font-semibold text-slate-800">Informações de pagamento</div>
        <Button variant="outline" size="sm" onClick={() => setShowEditor((v) => !v)}>
          {showEditor ? 'Fechar parcelas' : 'Editar parcelas'}
        </Button>
      </div>

      {/* Cabeçalho ilustrando os campos pedidos na captura */}
      <div className="hidden md:grid md:grid-cols-12 gap-3 text-xs text-slate-600 mb-1 px-1">
        <div className="md:col-span-2">Forma de pagamento</div>
        <div className="md:col-span-2">Conta de recebimento</div>
        <div className="md:col-span-1">Percentual</div>
        <div className="md:col-span-2">Valor a receber</div>
        <div className="md:col-span-2">Condição de pagamento</div>
        <div className="md:col-span-2">Vencimento</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-2">
          <Select value={cond.formaPadrao} onValueChange={(v) => onChangeCond({ formaPadrao: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {formasPagamento.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select value={cond.contaPadrao} onValueChange={(v) => onChangeCond({ contaPadrao: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {contas.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-1">
          <Input readOnly value={`100%`} />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">R$</span>
            <Input readOnly className="text-right" value={fmtBRL(total)} />
          </div>
        </div>

        <div className="md:col-span-2">
          <Select value={String(cond.parcelas || 1)} onValueChange={(v) => onChangeCond({ parcelas: Number(v) || 1 })}>
            <SelectTrigger>
              <SelectValue placeholder="1x" />
            </SelectTrigger>
            <SelectContent>
              {parcelasOpts.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Input type="date" value={cond.primeiroVenc} onChange={(e) => onChangeCond({ primeiroVenc: e.target.value })} />
        </div>
      </div>

      {showEditor && (
        <div className="mt-4">
          <ParcelasEditor
            total={total}
            parcelas={parcelas}
            onChangeParcel={onChangeParcel}
            formasPagamento={formasPagamento}
            contas={contas}
            formaPadrao={cond.formaPadrao}
            contaPadrao={cond.contaPadrao}
          />
        </div>
      )}
    </Card>
  )
}


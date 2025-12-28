"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type VendaInfoValues = {
  tipoVenda: "orcamento" | "avulsa" | "recorrente"
  situacao: string
  numeroVenda: string
  cliente: string
  canal: string
  dataVenda: string
  categoria: string
  vendedor: string
}

export type VendaInfoCardProps = {
  values: VendaInfoValues
  onChange: (patch: Partial<VendaInfoValues>) => void
  clienteOptions?: Array<{ value: string; label: string }>
  canalOptions?: Array<{ value: string; label: string }>
  categoriaOptions?: Array<{ value: string; label: string }>
  vendedorOptions?: Array<{ value: string; label: string }>
}

export default function VendaInfoCard({ values, onChange, clienteOptions = [], canalOptions = [], categoriaOptions = [], vendedorOptions = [] }: VendaInfoCardProps) {
  return (
    <Card className="p-4 mx-4">
      <div className="text-base font-semibold text-slate-800 mb-3">Informações da venda</div>

      {/* Linha de controles do topo */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
        <div className="md:col-span-8">
          <Label className="text-sm text-slate-600">Tipo da venda</Label>
          <div className="mt-1">
            <Tabs value={values.tipoVenda} onValueChange={(v) => onChange({ tipoVenda: v as VendaInfoValues["tipoVenda"] })}>
              <TabsList>
                <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
                <TabsTrigger value="avulsa">Venda avulsa</TabsTrigger>
                <TabsTrigger value="recorrente">Venda recorrente (contrato)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="md:col-span-4">
          <Label className="text-sm text-slate-600">Situação da negociação</Label>
          <Select value={values.situacao} onValueChange={(v) => onChange({ situacao: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="em_negociacao">Em negociação</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha de campos principais */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Número da venda *</Label>
          <Input value={values.numeroVenda} onChange={(e) => onChange({ numeroVenda: e.target.value })} placeholder="000" />
        </div>
        <div className="md:col-span-4">
          <Label className="text-sm text-slate-600">Cliente *</Label>
          <Select value={values.cliente} onValueChange={(v) => onChange({ cliente: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {clienteOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Canal de venda *</Label>
          <Select value={values.canal} onValueChange={(v) => onChange({ canal: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {canalOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Data da venda *</Label>
          <Input type="date" value={values.dataVenda} onChange={(e) => onChange({ dataVenda: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Categoria</Label>
          <Select value={values.categoria} onValueChange={(v) => onChange({ categoria: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categoriaOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Vendedor responsável</Label>
          <Select value={values.vendedor} onValueChange={(v) => onChange({ vendedor: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {vendedorOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}

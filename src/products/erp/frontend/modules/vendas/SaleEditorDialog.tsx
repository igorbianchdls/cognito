"use client";


import { lineTotal } from '@/products/erp/shared/erpMoney';
import {
    CalendarDays,
    Loader2,
    Plus,
    Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErpAsyncCatalogSelect } from "@/products/erp/frontend/components/ErpAsyncCatalogSelect";

import { FieldInput, FieldSelect } from '@/products/erp/frontend/components/ErpFormFields';
import type { Dispatch, SetStateAction } from 'react';
import { Catalogs, Option, currency, money, newItem } from './salesWorkspaceModel';
import type { SaleForm } from './useSaleForm';

// Dialog to create or edit a sale or quote.
export function SaleEditorDialog({ editorOpen, setEditorOpen, isQuote, editingSale, catalogs, setCatalogs, saving, saveSale, form }: {
  editorOpen: boolean; setEditorOpen: Dispatch<SetStateAction<boolean>>; isQuote: boolean; editingSale: { id: string; version: number } | null;
  catalogs: Catalogs; setCatalogs: Dispatch<SetStateAction<Catalogs>>; saving: boolean; saveSale: () => Promise<void>; form: SaleForm;
}) {
  const { customerId, sellerId, setSellerId, number, setNumber, saleDate, setSaleDate, competence, setCompetence, validity, setValidity, deliveryForecast, setDeliveryForecast, categoryId, setCategoryId, costCenterId, setCostCenterId, items, setItems, discountType, setDiscountType, discount, setDiscount, freight, setFreight, installments, setInstallments, billingEmails, setBillingEmails, billingWhatsapp, setBillingWhatsapp, notes, setNotes, discountError, total, selectCustomer, selectCatalogItem, changeInstallmentCount } = form;
  return (
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="h-[94vh] max-w-[min(1180px,96vw)] gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>
              {editingSale
                ? `Editar ${isQuote ? "orcamento" : "venda"}`
                : `Novo ${isQuote ? "orcamento" : "pedido de venda"}`}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <section className="grid gap-4 border-b px-6 py-5">
              <h2 className="text-sm font-semibold">
                Informacoes {isQuote ? "do orçamento" : "da venda"}
              </h2>
              <div className="grid gap-4 md:grid-cols-4">
                <ErpAsyncCatalogSelect
                  label="Cliente *"
                  type="cliente"
                  value={customerId}
                  onChange={selectCustomer}
                  selectedLabel={catalogs.customers.find((item) => item.id === customerId)?.nome}
                />
                <FieldSelect
                  label="Vendedor responsável"
                  value={sellerId}
                  onChange={setSellerId}
                  options={catalogs.responsibles.map((item) => [
                    item.id,
                    item.nome,
                  ])}
                />
                <FieldInput
                  label="Número"
                  value={number}
                  onChange={setNumber}
                  placeholder="Automático"
                />
                <FieldInput
                  label={isQuote ? "Data do orçamento" : "Data da venda"}
                  value={saleDate}
                  onChange={setSaleDate}
                  type="date"
                />
                <FieldInput
                  label="Competência"
                  value={competence}
                  onChange={setCompetence}
                  type="date"
                />
                {isQuote ? (
                  <>
                    <FieldInput
                      label="Validade"
                      value={validity}
                      onChange={setValidity}
                      type="date"
                    />
                    <FieldInput
                      label="Previsão de entrega"
                      value={deliveryForecast}
                      onChange={setDeliveryForecast}
                      type="date"
                    />
                  </>
                ) : null}
                <FieldSelect
                  label="Categoria financeira"
                  value={categoryId}
                  onChange={setCategoryId}
                  options={catalogs.categories.map((item) => [
                    item.id,
                    item.nome,
                  ])}
                />
                <FieldSelect
                  label="Centro de custo"
                  value={costCenterId}
                  onChange={setCostCenterId}
                  options={catalogs.costCenters.map((item) => [
                    item.id,
                    item.nome,
                  ])}
                />
                {!isQuote ? (
                  <>
                    <FieldInput
                      label="Emails de cobrança"
                      value={billingEmails}
                      onChange={setBillingEmails}
                      placeholder="financeiro@cliente.com"
                    />
                    <FieldInput
                      label="WhatsApp de cobrança"
                      value={billingWhatsapp}
                      onChange={setBillingWhatsapp}
                    />
                  </>
                ) : null}
              </div>
            </section>
            <section className="grid gap-4 border-b px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Itens da venda</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItems((current) => [...current, newItem()])}
                >
                  <Plus className="size-4" />
                  Adicionar item
                </Button>
              </div>
              <div className="hidden grid-cols-[120px_2fr_100px_120px_120px_120px_40px] gap-2 px-1 text-xs font-medium text-gray-500 md:grid">
                <span>Tipo</span>
                <span>Produto ou serviço</span>
                <span>Quantidade</span>
                <span>Valor unitário</span>
                <span>Desconto</span>
                <span>Total</span>
                <span />
              </div>
              {items.map((item) => {
                const catalog =
                  item.tipo === "produto"
                    ? catalogs.products
                    : catalogs.services;
                let itemTotal=0;
                try {if(money(item.quantidade)>0)itemTotal=lineTotal(item.quantidade,item.valorUnitario,item.desconto||0)} catch { /* Validation on save reports invalid items. */ }
                return (
                  <div
                    key={item.rowId}
                    className="grid gap-2 rounded-md border p-3 md:grid-cols-[120px_2fr_100px_120px_120px_120px_40px]"
                  >
                    <select
                      value={item.tipo}
                      className="h-10 rounded-md bg-gray-50 px-2 text-sm"
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((row) =>
                            row.rowId === item.rowId
                              ? {
                                  ...newItem(),
                                  rowId: row.rowId,
                                  tipo: event.target.value as
                                    | "produto"
                                    | "servico",
                                }
                              : row,
                          ),
                        )
                      }
                    >
                      <option value="produto">Produto</option>
                      <option value="servico">Servico</option>
                    </select>
                    <ErpAsyncCatalogSelect
                      type={item.tipo}
                      value={item.itemId}
                      selectedLabel={catalog.find((option) => option.id === item.itemId)?.nome}
                      onChange={(value, record) => {
                        setCatalogs((current) => {
                          const key = item.tipo === "produto" ? "products" : "services";
                          return { ...current, [key]: [record as Option, ...current[key].filter((option) => option.id !== record.id)] };
                        });
                        selectCatalogItem(item.rowId, value, record);
                      }}
                    />
                    <Input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={item.quantidade}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((row) =>
                            row.rowId === item.rowId
                              ? { ...row, quantidade: event.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.valorUnitario}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((row) =>
                            row.rowId === item.rowId
                              ? { ...row, valorUnitario: event.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.desconto}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((row) =>
                            row.rowId === item.rowId
                              ? { ...row, desconto: event.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    <div className="flex h-10 items-center justify-end font-medium">
                      {currency(itemTotal)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remover item"
                      disabled={items.length === 1}
                      onClick={() =>
                        setItems((current) =>
                          current.filter((row) => row.rowId !== item.rowId),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
              <label className="grid gap-1 text-sm">Tipo de desconto<select className="rounded border p-2" value={discountType} onChange={e=>setDiscountType(e.target.value as 'valor'|'percentual')}><option value="valor">Valor em reais</option><option value="percentual">Percentual</option></select></label>
              {discountError && <p role="alert" className="text-sm text-red-700">{discountError}</p>}
              <div className="grid gap-4 md:grid-cols-4">
                <FieldInput
                  label={discountType === "percentual" ? "Desconto geral (%)" : "Desconto geral (R$)"}
                  value={discount}
                  onChange={setDiscount}
                  type="number"
                />
                <FieldInput
                  label="Frete"
                  value={freight}
                  onChange={setFreight}
                  type="number"
                />
                <div className="md:col-span-2 rounded-md bg-gray-50 p-4 text-right">
                  <p className="text-xs text-gray-500">Total da venda</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {currency(total)}
                  </p>
                </div>
              </div>
            </section>
            <section className="grid gap-4 border-b px-6 py-5">
              <div className="flex items-end justify-between">
                <h2 className="text-sm font-semibold">Condição de pagamento</h2>
                <div className="grid gap-1">
                  <Label>Parcelas</Label>
                  <Input
                    className="w-24"
                    type="number"
                    min="1"
                    max="48"
                    value={installments.length}
                    onChange={(event) =>
                      changeInstallmentCount(Number(event.target.value))
                    }
                  />
                </div>
              </div>
              <div className="hidden grid-cols-[80px_160px_140px_1fr_1fr] gap-2 text-xs font-medium text-gray-500 md:grid">
                <span>Parcela</span>
                <span>Vencimento</span>
                <span>Valor</span>
                <span>Conta</span>
                <span>Metodo</span>
              </div>
              {installments.map((row, index) => (
                <div
                  key={row.numero}
                  className="grid gap-2 md:grid-cols-[80px_160px_140px_1fr_1fr]"
                >
                  <Input
                    value={`${row.numero}/${installments.length}`}
                    disabled
                  />
                  <Input
                    type="date"
                    value={row.vencimento}
                    onChange={(event) =>
                      setInstallments((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, vencimento: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={row.valor}
                    onChange={(event) =>
                      setInstallments((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, valor: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <select
                    value={row.contaFinanceiraId}
                    className="h-10 rounded-md bg-gray-50 px-2 text-sm"
                    onChange={(event) =>
                      setInstallments((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, contaFinanceiraId: event.target.value }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="">Selecione</option>
                    {catalogs.financialAccounts.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.metodoPagamentoId}
                    className="h-10 rounded-md bg-gray-50 px-2 text-sm"
                    onChange={(event) =>
                      setInstallments((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, metodoPagamentoId: event.target.value }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="">Selecione</option>
                    {catalogs.paymentMethods.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.nome}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </section>
            <section className="grid gap-2 px-6 py-5">
              <Label>Observacoes</Label>
              <Textarea
                value={notes}
                className="min-h-24"
                onChange={(event) => setNotes(event.target.value)}
              />
            </section>
          </div>
          <div className="flex items-center justify-between border-t bg-white px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="size-4" />
              {isQuote
                ? "Orçamentos não movimentam financeiro ou estoque"
                : "A confirmação gera contas a receber"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={saving} onClick={() => void saveSale()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {editingSale
                  ? "Salvar alterações"
                  : `Salvar ${isQuote ? "orcamento" : "venda"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}

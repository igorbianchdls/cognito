"use client";


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
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ErpAsyncCatalogSelect } from "@/products/erp/frontend/components/ErpAsyncCatalogSelect";

import { FieldInput, FieldSelect } from '@/products/erp/frontend/components/ErpFormFields';
import type { Dispatch, SetStateAction } from 'react';
import { CatalogItem, PurchaseCatalogs, formatCurrency, newItem } from './purchaseWorkspaceModel';
import type { PurchaseForm } from './usePurchaseForm';

// Dialog to create or edit a purchase.
export function PurchaseEditorDialog({ catalogs, setCatalogs, editorOpen, setEditorOpen, editingPurchase, saving, savePurchase, itemCatalog, form }: {
  catalogs: PurchaseCatalogs;
  setCatalogs: Dispatch<SetStateAction<PurchaseCatalogs>>;
  editorOpen: boolean;
  setEditorOpen: Dispatch<SetStateAction<boolean>>;
  editingPurchase: { id: string; version: number; } | null;
  saving: boolean;
  savePurchase: () => Promise<void>;
  itemCatalog: CatalogItem[];
  form: PurchaseForm;
}) {
  const { tipoCompra, setTipoCompra, tipoMovimento, setTipoMovimento, fornecedorId, setFornecedorId, numero, setNumero, dataCompra, setDataCompra, dataCompetencia, setDataCompetencia, dataEntrega, setDataEntrega, categoriaId, setCategoriaId, centroCustoId, setCentroCustoId, naturezaId, setNaturezaId, geraFinanceiro, setGeraFinanceiro, contaFinanceiraId, setContaFinanceiraId, metodoPagamentoId, setMetodoPagamentoId, items, setItems, desconto, setDesconto, frete, setFrete, seguro, setSeguro, outrasDespesas, setOutrasDespesas, impostosRetidos, setImpostosRetidos, installments, setInstallments, observacoes, setObservacoes, total, changeInstallmentCount, selectItem } = form;
  return (
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="h-[94vh] max-w-[min(1180px,96vw)] gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>
              {editingPurchase ? "Editar cotacao" : "Nova compra"}
            </DialogTitle>
            <DialogDescription>Informe fornecedor, itens e condições de pagamento desta compra.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            <section className="grid gap-4 border-b px-6 py-5">
              <h2 className="text-sm font-semibold">Informações da compra</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                  <Label>Tipo de compra</Label>
                  <div className="flex h-10 overflow-hidden rounded-md border">
                    <button
                      className={`flex-1 text-sm ${tipoCompra === "produto" ? "bg-gray-950 text-white" : "bg-white"}`}
                      onClick={() => {
                        setTipoCompra("produto");
                        setItems([newItem()]);
                      }}
                    >
                      Produtos
                    </button>
                    <button
                      className={`flex-1 text-sm ${tipoCompra === "servico" ? "bg-gray-950 text-white" : "bg-white"}`}
                      onClick={() => {
                        setTipoCompra("servico");
                        setItems([{ ...newItem(), kind: "servico" }]);
                      }}
                    >
                      Servicos
                    </button>
                  </div>
                </div>
                <FieldSelect
                  label="Tipo de movimento"
                  value={tipoMovimento}
                  onChange={setTipoMovimento}
                  options={[
                    ["cotacao", "Cotacao de compra"],
                    ["pedido_recorrente", "Pedido recorrente"],
                    ["pedido_compra", "Pedido de compra"],
                    ["compra", "Compra"],
                  ]}
                />
                <ErpAsyncCatalogSelect
                  label="Fornecedor *"
                  type="fornecedor"
                  value={fornecedorId}
                  onChange={(value, record) => {
                    setFornecedorId(value);
                    setCatalogs((current) => ({ ...current, suppliers: [record as CatalogItem, ...current.suppliers.filter((item) => item.id !== record.id)] }));
                  }}
                  selectedLabel={catalogs.suppliers.find((item) => item.id === fornecedorId)?.nome}
                />
                <FieldInput
                  label="Número"
                  value={numero}
                  onChange={setNumero}
                  placeholder="Automático"
                />
                <FieldInput
                  label="Data da compra"
                  value={dataCompra}
                  onChange={setDataCompra}
                  type="date"
                />
                <FieldInput
                  label="Competência"
                  value={dataCompetencia}
                  onChange={setDataCompetencia}
                  type="date"
                />
                <FieldInput
                  label="Entrega prevista"
                  value={dataEntrega}
                  onChange={setDataEntrega}
                  type="date"
                />
                <FieldSelect
                  label="Natureza da operação"
                  value={naturezaId}
                  onChange={setNaturezaId}
                  options={catalogs.operationNatures.map((item) => [
                    item.id,
                    item.nome,
                  ])}
                />
                <FieldSelect
                  label="Categoria financeira"
                  value={categoriaId}
                  onChange={setCategoriaId}
                  options={catalogs.categories.map((item) => [
                    item.id,
                    item.nome,
                  ])}
                />
                <FieldSelect
                  label="Centro de custo"
                  value={centroCustoId}
                  onChange={setCentroCustoId}
                  options={catalogs.costCenters.map((item) => [
                    item.id,
                    item.nome,
                  ])}
                />
              </div>
            </section>

            <section className="grid gap-4 border-b px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Itens da compra</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setItems((current) => [
                      ...current,
                      { ...newItem(), kind: tipoCompra },
                    ])
                  }
                >
                  <Plus className="size-4" />
                  Adicionar linha
                </Button>
              </div>
              <div className="grid gap-2">
                {items.map((item) => (
                  <div
                    key={item.rowId}
                    className="grid gap-2 rounded-md bg-gray-50 p-3 lg:grid-cols-[2fr_1.2fr_90px_110px_110px_40px]"
                  >
                    <ErpAsyncCatalogSelect
                      type={tipoCompra}
                      value={item.itemId}
                      selectedLabel={itemCatalog.find((catalogItem) => catalogItem.id === item.itemId)?.nome}
                      onChange={(value, record) => {
                        setCatalogs((current) => {
                          const key = tipoCompra === "produto" ? "products" : "services";
                          return { ...current, [key]: [record as CatalogItem, ...current[key].filter((catalogItem) => catalogItem.id !== record.id)] };
                        });
                        selectItem(item.rowId, value, record);
                      }}
                    />
                    <Input
                      value={item.detalhes}
                      placeholder="Detalhes do item"
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((row) =>
                            row.rowId === item.rowId
                              ? { ...row, detalhes: event.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    <Input
                      value={item.quantidade}
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      title="Quantidade"
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
                      value={item.valorUnitario}
                      type="number"
                      min="0"
                      step="0.01"
                      title="Valor unitário"
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
                      value={item.percentualDesconto}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      title="Desconto percentual"
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((row) =>
                            row.rowId === item.rowId
                              ? {
                                  ...row,
                                  percentualDesconto: event.target.value,
                                }
                              : row,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remover linha"
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
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-6">
                <FieldInput
                  label="Desconto"
                  value={desconto}
                  onChange={setDesconto}
                  type="number"
                />
                <FieldInput
                  label="Frete"
                  value={frete}
                  onChange={setFrete}
                  type="number"
                />
                <FieldInput
                  label="Seguro"
                  value={seguro}
                  onChange={setSeguro}
                  type="number"
                />
                <FieldInput
                  label="Outras despesas"
                  value={outrasDespesas}
                  onChange={setOutrasDespesas}
                  type="number"
                />
                <FieldInput
                  label="Impostos retidos"
                  value={impostosRetidos}
                  onChange={setImpostosRetidos}
                  type="number"
                />
                <div className="grid content-end">
                  <p className="text-xs text-gray-500">Total da compra</p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 border-b px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Informações de pagamento
                </h2>
                <div className="flex items-center gap-2">
                  <Label htmlFor="gera-financeiro">Gerar financeiro</Label>
                  <Switch
                    id="gera-financeiro"
                    checked={geraFinanceiro}
                    onCheckedChange={setGeraFinanceiro}
                  />
                </div>
              </div>
              {geraFinanceiro && total > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FieldSelect
                      label="Forma de pagamento"
                      value={metodoPagamentoId}
                      onChange={setMetodoPagamentoId}
                      options={catalogs.paymentMethods.map((item) => [
                        item.id,
                        item.nome,
                      ])}
                    />
                    <FieldSelect
                      label="Conta de pagamento"
                      value={contaFinanceiraId}
                      onChange={setContaFinanceiraId}
                      options={catalogs.financialAccounts.map((item) => [
                        item.id,
                        item.nome,
                      ])}
                    />
                    <div className="grid gap-2">
                      <Label>Quantidade de parcelas</Label>
                      <Input
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
                  <div className="grid gap-2">
                    {installments.map((installment, index) => (
                      <div
                        key={installment.numero}
                        className="grid gap-2 md:grid-cols-[90px_180px_180px_1fr]"
                      >
                        <Input
                          value={`${installment.numero}/${installments.length}`}
                          disabled
                        />
                        <Input
                          type="date"
                          value={installment.vencimento}
                          onChange={(event) =>
                            setInstallments((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, vencimento: event.target.value }
                                  : row,
                              ),
                            )
                          }
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={installment.valor}
                          onChange={(event) =>
                            setInstallments((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, valor: event.target.value }
                                  : row,
                              ),
                            )
                          }
                        />
                        <Input
                          value={installment.observacoes}
                          placeholder="Observações da parcela"
                          onChange={(event) =>
                            setInstallments((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, observacoes: event.target.value }
                                  : row,
                              ),
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Esta compra não criara lançamento financeiro.
                </p>
              )}
            </section>
            <section className="grid gap-2 px-6 py-5">
              <Label>Observações complementares</Label>
              <Textarea
                value={observacoes}
                className="min-h-24"
                onChange={(event) => setObservacoes(event.target.value)}
              />
            </section>
          </div>
          <div className="flex items-center justify-between border-t bg-white px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="size-4" />
              {tipoMovimento === "compra"
                ? "Gera despesa efetiva"
                : tipoMovimento.includes("pedido")
                  ? "Gera previsão financeira"
                  : "Sem impacto financeiro"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={saving} onClick={() => void savePurchase()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {editingPurchase ? "Salvar alterações" : "Salvar compra"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}

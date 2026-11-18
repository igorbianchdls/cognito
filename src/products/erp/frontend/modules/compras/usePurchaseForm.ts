"use client";


import { useMemo, useState } from "react";

import { type ErpCatalogRecord } from "@/products/erp/frontend/components/ErpAsyncCatalogSelect";

import { CatalogItem, PlannedInstallment, PurchaseCatalogs, PurchaseItem, datePlusMonths, money, newItem, today } from './purchaseWorkspaceModel';

// State of the purchase editor: fields, items, extra costs, installments and the totals derived from them.
export function usePurchaseForm({ catalogs }: { catalogs: PurchaseCatalogs }) {
  const [tipoCompra, setTipoCompra] = useState<"produto" | "servico">(
    "produto",
  );
  const [tipoMovimento, setTipoMovimento] = useState("cotacao");
  const [fornecedorId, setFornecedorId] = useState("");
  const [numero, setNumero] = useState("");
  const [dataCompra, setDataCompra] = useState(today());
  const [dataCompetencia, setDataCompetencia] = useState(today());
  const [dataEntrega, setDataEntrega] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [centroCustoId, setCentroCustoId] = useState("");
  const [naturezaId, setNaturezaId] = useState("");
  const [geraFinanceiro, setGeraFinanceiro] = useState(true);
  const [contaFinanceiraId, setContaFinanceiraId] = useState("");
  const [metodoPagamentoId, setMetodoPagamentoId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([newItem()]);
  const [desconto, setDesconto] = useState("0");
  const [frete, setFrete] = useState("0");
  const [seguro, setSeguro] = useState("0");
  const [outrasDespesas, setOutrasDespesas] = useState("0");
  const [impostosRetidos, setImpostosRetidos] = useState("0");
  const [installments, setInstallments] = useState<PlannedInstallment[]>([
    { numero: 1, vencimento: today(), valor: "0", observacoes: "" },
  ]);
  const [observacoes, setObservacoes] = useState("");

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const gross = money(item.quantidade) * money(item.valorUnitario);
        return sum + gross * (1 - money(item.percentualDesconto) / 100);
      }, 0),
    [items],
  );
  const total = Math.max(
    0,
    subtotal -
      money(desconto) +
      money(frete) +
      money(seguro) +
      money(outrasDespesas) -
      money(impostosRetidos),
  );

  // Whenever the total changes (and on the first render), spread it across the installments again.
  // Done during render (not in an effect) so the installments never show a stale split.
  const [splitTotal, setSplitTotal] = useState<number | null>(null);
  if (splitTotal !== total) {
    setSplitTotal(total);
    setInstallments((current) => {
      const count = Math.max(1, current.length);
      const base = Math.floor((total * 100) / count) / 100;
      let allocated = 0;
      return current.map((installment, index) => {
        const value =
          index === count - 1 ? Number((total - allocated).toFixed(2)) : base;
        allocated += value;
        return { ...installment, valor: value.toFixed(2) };
      });
    });
  }

  function changeInstallmentCount(count: number) {
    const safeCount = Math.min(48, Math.max(1, count || 1));
    setInstallments(
      Array.from({ length: safeCount }, (_, index) => ({
        numero: index + 1,
        vencimento: datePlusMonths(dataCompra, index),
        valor: "0",
        observacoes: "",
      })),
    );
  }

  function selectItem(rowId: string, itemId: string, record?: ErpCatalogRecord) {
    const catalog =
      tipoCompra === "produto" ? catalogs.products : catalogs.services;
    const selected = (record as CatalogItem | undefined) || catalog.find((item) => item.id === itemId);
    setItems((current) =>
      current.map((item) =>
        item.rowId === rowId
          ? {
              ...item,
              kind: tipoCompra,
              itemId,
              descricao: selected?.nome || "",
              unidade: selected?.unidade || "UN",
              valorUnitario: String(selected?.valor_padrao || 0),
            }
          : item,
      ),
    );
  }

  return { tipoCompra, setTipoCompra, tipoMovimento, setTipoMovimento, fornecedorId, setFornecedorId, numero, setNumero, dataCompra, setDataCompra, dataCompetencia, setDataCompetencia, dataEntrega, setDataEntrega, categoriaId, setCategoriaId, centroCustoId, setCentroCustoId, naturezaId, setNaturezaId, geraFinanceiro, setGeraFinanceiro, contaFinanceiraId, setContaFinanceiraId, metodoPagamentoId, setMetodoPagamentoId, items, setItems, desconto, setDesconto, frete, setFrete, seguro, setSeguro, outrasDespesas, setOutrasDespesas, impostosRetidos, setImpostosRetidos, installments, setInstallments, observacoes, setObservacoes, subtotal, total, changeInstallmentCount, selectItem };
}

export type PurchaseForm = ReturnType<typeof usePurchaseForm>;

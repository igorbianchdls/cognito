"use client";


import { discountAmount, lineTotal, sumMoney } from '@/products/erp/shared/erpMoney';
import {
    useMemo,
    useState
} from "react";

import { type ErpCatalogRecord } from "@/products/erp/frontend/components/ErpAsyncCatalogSelect";

import type { Dispatch, SetStateAction } from "react";
import { Catalogs, Customer, Installment, Option, SaleItem, addMonthsClamped, money, newItem, today } from './salesWorkspaceModel';

// State of the sale/quote editor: fields, items, discount, installments and the totals derived from them.
export function useSaleForm({ catalogs, setCatalogs }: { catalogs: Catalogs; setCatalogs: Dispatch<SetStateAction<Catalogs>> }) {
  const [customerId, setCustomerId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [number, setNumber] = useState("");
  const [saleDate, setSaleDate] = useState(today());
  const [competence, setCompetence] = useState(today());
  const [validity, setValidity] = useState("");
  const [deliveryForecast, setDeliveryForecast] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [items, setItems] = useState<SaleItem[]>([newItem()]);
  const [discountType,setDiscountType] = useState<'valor'|'percentual'>('valor');
  const [discount, setDiscount] = useState("0");
  const [freight, setFreight] = useState("0");
  const [installments, setInstallments] = useState<Installment[]>([
    {
      numero: 1,
      vencimento: today(),
      valor: "0",
      contaFinanceiraId: "",
      metodoPagamentoId: "",
    },
  ]);
  const [billingEmails, setBillingEmails] = useState("");
  const [billingWhatsapp, setBillingWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  const subtotal = useMemo(()=>sumMoney(items.map(item=>{
    if (!money(item.quantidade)) return 0;
    try { return lineTotal(item.quantidade,item.valorUnitario,item.desconto||0) } catch { return 0 }
  })),[items]);
  let discountError=''; let appliedDiscount=0;
  try { appliedDiscount=discountAmount(subtotal,discount||0,discountType) } catch(e){ discountError=e instanceof Error?e.message:'Desconto inválido.' }
  const total = Math.max(0,sumMoney([subtotal,-appliedDiscount,money(freight)]));

  // Whenever the total changes (and on the first render), spread it across the installments again.
  // Done during render (not in an effect) so the installments never show a stale split.
  const [splitTotal, setSplitTotal] = useState<number | null>(null);
  if (splitTotal !== total) {
    setSplitTotal(total);
    setInstallments((current) => {
      const count = Math.max(1, current.length);
      const base = Math.floor((total * 100) / count) / 100;
      let allocated = 0;
      return current.map((row, index) => {
        const value =
          index === count - 1 ? Number((total - allocated).toFixed(2)) : base;
        allocated += value;
        return { ...row, valor: value.toFixed(2) };
      });
    });
  }

  function selectCustomer(id: string, record?: ErpCatalogRecord) {
    setCustomerId(id);
    const customer = (record as Customer | undefined) || catalogs.customers.find((item) => item.id === id);
    if (record) {
      setCatalogs((current) => ({
        ...current,
        customers: [record as Customer, ...current.customers.filter((item) => item.id !== record.id)],
      }));
    }
    setBillingEmails(
      (customer?.contato_cobranca_emails?.length
        ? customer.contato_cobranca_emails
        : customer?.email
          ? [customer.email]
          : []
      ).join(", "),
    );
    setBillingWhatsapp(
      customer?.contato_cobranca_whatsapp ||
        customer?.celular ||
        customer?.telefone ||
        "",
    );
  }

  function selectCatalogItem(rowId: string, id: string, record?: ErpCatalogRecord) {
    setItems((current) =>
      current.map((row) => {
        if (row.rowId !== rowId) return row;
        const catalog =
          row.tipo === "produto" ? catalogs.products : catalogs.services;
        const selected = (record as Option | undefined) || catalog.find((item) => item.id === id);
        return {
          ...row,
          itemId: id,
          descricao: selected?.nome || "",
          unidade: selected?.unidade || "UN",
          valorUnitario: String(selected?.valor_padrao || 0),
        };
      }),
    );
  }

  function changeInstallmentCount(count: number) {
    const safeCount = Math.min(48, Math.max(1, count || 1));
    const defaultAccount =
      catalogs.financialAccounts.find((item) => item.padrao)?.id || "";
    setInstallments(
      Array.from({ length: safeCount }, (_, index) => ({
        numero: index + 1,
        vencimento: addMonthsClamped(saleDate, index),
        valor: "0",
        contaFinanceiraId: defaultAccount,
        metodoPagamentoId: "",
      })),
    );
  }

  return { customerId, setCustomerId, sellerId, setSellerId, number, setNumber, saleDate, setSaleDate, competence, setCompetence, validity, setValidity, deliveryForecast, setDeliveryForecast, categoryId, setCategoryId, costCenterId, setCostCenterId, items, setItems, discountType, setDiscountType, discount, setDiscount, freight, setFreight, installments, setInstallments, billingEmails, setBillingEmails, billingWhatsapp, setBillingWhatsapp, notes, setNotes, subtotal, appliedDiscount, discountError, total, selectCustomer, selectCatalogItem, changeInstallmentCount };
}

export type SaleForm = ReturnType<typeof useSaleForm>;

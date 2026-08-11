"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  Check,
  Eye,
  FileCheck2,
  Loader2,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  X,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ErpPagination } from "@/products/erp/frontend/components/ErpPagination";
import { ErpDocumentDetailsDialog } from "@/products/erp/frontend/components/ErpDocumentDetailsDialog";
import { ErpAsyncCatalogSelect, type ErpCatalogRecord } from "@/products/erp/frontend/components/ErpAsyncCatalogSelect";
import { useErpAccess } from "@/products/erp/frontend/hooks/useErpAccess";

type Option = {
  id: string;
  nome: string;
  codigo?: string;
  unidade?: string;
  valor_padrao?: number;
  padrao?: boolean;
};
type Customer = Option & {
  documento?: string;
  email?: string;
  celular?: string;
  telefone?: string;
  contato_cobranca_emails?: string[];
  contato_cobranca_whatsapp?: string;
};
type Catalogs = {
  customers: Customer[];
  responsibles: Option[];
  products: Option[];
  services: Option[];
  categories: Option[];
  costCenters: Option[];
  financialAccounts: Option[];
  paymentMethods: Option[];
};
type SaleRecord = {
  id: string;
  numero: string;
  cliente: string;
  data: string;
  total: number;
  status: string;
  atendimento_status: string;
  fiscal_status: string;
  situacao: string;
  validade?: string;
  versao: number;
};
type SaleItem = {
  rowId: string;
  tipo: "produto" | "servico";
  itemId: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  desconto: string;
};
type Installment = {
  numero: number;
  vencimento: string;
  valor: string;
  contaFinanceiraId: string;
  metodoPagamentoId: string;
};
type FulfillItem = {
  id: string;
  descricao: string;
  pendente: number;
  quantidade: string;
};

const emptyCatalogs: Catalogs = {
  customers: [],
  responsibles: [],
  products: [],
  services: [],
  categories: [],
  costCenters: [],
  financialAccounts: [],
  paymentMethods: [],
};
const today = () => new Date().toISOString().slice(0, 10);
const money = (value: string | number) =>
  Number(String(value || 0).replace(",", ".")) || 0;
const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

function addMonthsClamped(value: string, months: number) {
  const [year, month, day] = value.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function newItem(): SaleItem {
  return {
    rowId: crypto.randomUUID(),
    tipo: "produto",
    itemId: "",
    descricao: "",
    unidade: "UN",
    quantidade: "1",
    valorUnitario: "0",
    desconto: "0",
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string | { message?: string };
  };
  if (!response.ok)
    throw new Error(
      typeof body.error === "string"
        ? body.error
        : body.error?.message || "Nao foi possivel concluir a operacao.",
    );
  return body as T;
}

function statusTone(status: string) {
  if (["confirmada", "atendido", "emitida", "nao_aplicavel"].includes(status))
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "cancelada")
    return "border-gray-200 bg-gray-100 text-gray-500";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function SalesWorkspacePage({
  documentType = "venda",
}: {
  documentType?: "venda" | "orcamento";
}) {
  const isQuote = documentType === "orcamento";
  const canManage = useErpAccess().can("erp.vendas.gerenciar");
  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [fiscalOpen, setFiscalOpen] = useState(false);
  const [fiscalLoading, setFiscalLoading] = useState(false);
  const [fiscalResult, setFiscalResult] = useState<{ ready: boolean; issues: Array<{ code: string; field: string; message: string; severity: 'error' | 'warning' }> } | null>(null);
  const [fulfillOpen, setFulfillOpen] = useState(false);
  const [fulfillSale, setFulfillSale] = useState<SaleRecord | null>(null);
  const [fulfillItems, setFulfillItems] = useState<FulfillItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<{
    sale: Record<string, unknown>;
    items: Record<string, unknown>[];
    installments: Record<string, unknown>[];
    events: Record<string, unknown>[];
  } | null>(null);
  const [editingSale, setEditingSale] = useState<{
    id: string;
    version: number;
  } | null>(null);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "50");
      if (deferredQuery.trim()) params.set("query", deferredQuery.trim());
      if (status) params.set("filter.status", status);
      params.set("filter.tipo_documento", documentType);
      const [salesResponse, catalogsResponse] = await Promise.all([
        fetch(`/api/erp/vendas${params.size ? `?${params}` : ""}`, {
          cache: "no-store",
        }),
        fetch("/api/erp/vendas/catalogos", { cache: "no-store" }),
      ]);
      const salesPage = await parseResponse<{
        records: SaleRecord[];
        total: number;
      }>(salesResponse);
      setRecords(salesPage.records);
      setTotalRecords(salesPage.total);
      setCatalogs(await parseResponse<Catalogs>(catalogsResponse));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : `Nao foi possivel carregar ${isQuote ? "os orcamentos" : "as vendas"}.`,
      );
    } finally {
      setLoading(false);
    }
  }, [deferredQuery, documentType, isQuote, page, status]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            money(item.quantidade) * money(item.valorUnitario) -
              money(item.desconto),
          ),
        0,
      ),
    [items],
  );
  const total = Math.max(0, subtotal - money(discount) + money(freight));

  useEffect(() => {
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
  }, [total]);

  function resetForm() {
    const date = today();
    setCustomerId("");
    setSellerId("");
    setNumber("");
    setSaleDate(date);
    setCompetence(date);
    setValidity("");
    setDeliveryForecast("");
    setCategoryId("");
    setCostCenterId("");
    setItems([newItem()]);
    setDiscount("0");
    setFreight("0");
    setBillingEmails("");
    setBillingWhatsapp("");
    setNotes("");
    setInstallments([
      {
        numero: 1,
        vencimento: date,
        valor: "0",
        contaFinanceiraId:
          catalogs.financialAccounts.find((item) => item.padrao)?.id || "",
        metodoPagamentoId: "",
      },
    ]);
    setError(null);
    setEditingSale(null);
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

  async function saveSale() {
    setSaving(true);
    setError(null);
    try {
      await parseResponse(
        await fetch(
          editingSale ? `/api/erp/vendas/${editingSale.id}` : "/api/erp/vendas",
          {
            method: editingSale ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify({
              expectedVersion: editingSale?.version,
              values: {
                cliente_id: customerId,
                vendedor_id: sellerId || null,
                numero: number,
                data_venda: saleDate,
                data_competencia: competence,
                tipo_documento: documentType,
                validade_em: validity || null,
                previsao_entrega: deliveryForecast || null,
                categoria_id: categoryId,
                centro_custo_id: costCenterId,
                desconto: discount,
                frete: freight,
                itens: items.map((item) => ({
                  tipo: item.tipo,
                  item_id: item.itemId,
                  descricao: item.descricao,
                  quantidade: item.quantidade,
                  valor_unitario: item.valorUnitario,
                  desconto: item.desconto,
                })),
                parcelas: installments.map((row) => ({
                  numero_parcela: row.numero,
                  data_vencimento: row.vencimento,
                  valor: row.valor,
                  conta_financeira_id: row.contaFinanceiraId,
                  metodo_pagamento_id: row.metodoPagamentoId,
                })),
                cobranca_emails: billingEmails
                  .split(",")
                  .map((email) => email.trim())
                  .filter(Boolean),
                cobranca_whatsapp: billingWhatsapp,
                observacoes: notes,
              },
            }),
          },
        ),
      );
      setEditorOpen(false);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : `Nao foi possivel salvar ${isQuote ? "o orcamento" : "a venda"}.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    record: SaleRecord,
    action: "confirmar" | "cancelar",
  ) {
    const actionLabel =
      action === "confirmar"
        ? "Confirmar"
        : "Cancelar";
    if (!window.confirm(`${actionLabel} a venda ${record.numero}?`)) return;
    setLoading(true);
    setError(null);
    try {
      await parseResponse(
        await fetch(`/api/erp/vendas/${record.id}/${action}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({ values: {} }),
        }),
      );
      await loadData();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel atualizar a venda.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function runQuoteAction(
    record: SaleRecord,
    action: "enviar" | "aprovar" | "recusar" | "cancelar" | "converter",
  ) {
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        action === "converter"
          ? `/api/erp/orcamentos/${record.id}/converter`
          : `/api/erp/orcamentos/${record.id}/acao`;
      await parseResponse(
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "converter"
              ? { expectedVersion: record.versao }
              : { action, expectedVersion: record.versao },
          ),
        }),
      );
      await loadData();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel atualizar o orcamento.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function openDetails(record: SaleRecord) {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetails(null);
    setError(null);
    try {
      setDetails(
        await parseResponse(
          await fetch(`/api/erp/vendas/${record.id}`, { cache: "no-store" }),
        ),
      );
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Nao foi possivel carregar a venda.",
      );
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function openFiscalPreflight(record: SaleRecord) {
    setFiscalOpen(true); setFiscalLoading(true); setFiscalResult(null); setError(null);
    try {
      setFiscalResult(await parseResponse(await fetch(`/api/erp/vendas/${record.id}/pre-validacao-fiscal`, { cache: 'no-store' })));
    } catch (preflightError) { setError(preflightError instanceof Error ? preflightError.message : 'Nao foi possivel validar os dados fiscais.'); setFiscalOpen(false); }
    finally { setFiscalLoading(false); }
  }

  async function openFulfill(record: SaleRecord) {
    setLoading(true);
    setError(null);
    try {
      const body = await parseResponse<{ items: Record<string, unknown>[] }>(
        await fetch(`/api/erp/vendas/${record.id}`, { cache: "no-store" }),
      );
      const pending = body.items
        .filter((item) => item.tipo === "produto")
        .map((item) => {
          const balance = Math.max(
            0,
            Number(item.quantidade || 0) -
              Number(item.quantidade_atendida || 0),
          );
          return {
            id: String(item.id),
            descricao: String(item.descricao || ""),
            pendente: balance,
            quantidade: String(balance),
          };
        })
        .filter((item) => item.pendente > 0);
      if (!pending.length) {
        await parseResponse(
          await fetch(`/api/erp/vendas/${record.id}/atender`, {
            method: "POST",
          }),
        );
        await loadData();
        return;
      }
      setFulfillSale(record);
      setFulfillItems(pending);
      setFulfillOpen(true);
    } catch (fulfillError) {
      setError(
        fulfillError instanceof Error
          ? fulfillError.message
          : "Nao foi possivel preparar o atendimento.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function fulfill() {
    if (!fulfillSale) return;
    setSaving(true);
    setError(null);
    try {
      await parseResponse(
        await fetch(`/api/erp/vendas/${fulfillSale.id}/atender-parcial`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            data: today(),
            items: fulfillItems
              .filter((item) => Number(item.quantidade) > 0)
              .map((item) => ({
                item_id: item.id,
                quantidade: item.quantidade,
              })),
          }),
        }),
      );
      setFulfillOpen(false);
      await loadData();
    } catch (fulfillError) {
      setError(
        fulfillError instanceof Error
          ? fulfillError.message
          : "Nao foi possivel atender os produtos.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function openEdit(record: SaleRecord) {
    setLoading(true);
    setError(null);
    try {
      const body = await parseResponse<{
        sale: Record<string, unknown>;
        items: Record<string, unknown>[];
        installments: Record<string, unknown>[];
      }>(await fetch(`/api/erp/vendas/${record.id}`, { cache: "no-store" }));
      const sale = body.sale;
      setEditingSale({ id: record.id, version: Number(sale.versao || 1) });
      setCustomerId(String(sale.cliente_id || ""));
      setNumber(String(sale.numero || ""));
      setSellerId(String(sale.vendedor_id || ""));
      setSaleDate(String(sale.data_venda || "").slice(0, 10));
      setCompetence(
        String(sale.data_competencia || sale.data_venda || "").slice(0, 10),
      );
      setValidity(String(sale.validade_em || "").slice(0, 10));
      setDeliveryForecast(String(sale.previsao_entrega || "").slice(0, 10));
      setCategoryId(String(sale.categoria_id || ""));
      setCostCenterId(String(sale.centro_custo_id || ""));
      setDiscount(String(sale.desconto || 0));
      setFreight(String(sale.frete || 0));
      setNotes(String(sale.observacoes || ""));
      setBillingEmails(
        Array.isArray(sale.cobranca_emails)
          ? sale.cobranca_emails.join(", ")
          : "",
      );
      setBillingWhatsapp(String(sale.cobranca_whatsapp || ""));
      setItems(
        body.items.map((item) => ({
          rowId: crypto.randomUUID(),
          tipo: item.tipo === "servico" ? "servico" : "produto",
          itemId: String(item.item_id || ""),
          descricao: String(item.descricao || ""),
          unidade: "UN",
          quantidade: String(item.quantidade || 1),
          valorUnitario: String(item.valor_unitario || 0),
          desconto: String(item.desconto || 0),
        })),
      );
      setInstallments(
        body.installments.map((row) => ({
          numero: Number(row.numero_parcela || 1),
          vencimento: String(row.data_vencimento || "").slice(0, 10),
          valor: String(row.valor || 0),
          contaFinanceiraId: String(row.conta_financeira_id || ""),
          metodoPagamentoId: String(row.metodo_pagamento_id || ""),
        })),
      );
      setEditorOpen(true);
    } catch (editError) {
      setError(
        editError instanceof Error
          ? editError.message
          : `Nao foi possivel editar ${isQuote ? "o orcamento" : "a venda"}.`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">ERP / Vendas</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            {isQuote ? "Orcamentos" : "Vendas"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isQuote
              ? "Propostas comerciais com validade, aprovacao e conversao em venda."
              : "Pedidos, recebimentos previstos e confirmacao financeira."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Atualizar"
            onClick={() => void loadData()}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button
            disabled={!canManage}
            onClick={() => {
              resetForm();
              setEditorOpen(true);
            }}
          >
            <Plus className="size-4" />
            {isQuote ? "Novo orcamento" : "Nova venda"}
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-y py-3 md:flex-row">
        <Input
          value={query}
          placeholder="Buscar por numero ou cliente"
          className="md:max-w-sm"
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <select
          value={status}
          className="h-10 rounded-md bg-gray-50 px-3 text-sm"
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas as situacoes</option>
          <option value="rascunho">Rascunho</option>
          <option value="confirmada">Confirmada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Numero</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>{isQuote ? "Validade" : "Data"}</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Situacao</TableHead>
              {!isQuote ? <TableHead>Atendimento</TableHead> : null}
              {!isQuote ? <TableHead>Fiscal</TableHead> : null}
              <TableHead className="w-64" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={isQuote ? 6 : 8}
                  className="h-32 text-center text-gray-500"
                >
                  <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                  Carregando
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isQuote ? 6 : 8}
                  className="h-32 text-center text-gray-500"
                >
                  Nenhum {isQuote ? "orcamento" : "pedido"} encontrado.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.numero}</TableCell>
                  <TableCell>{record.cliente}</TableCell>
                  <TableCell>
                    {isQuote ? record.validade || "-" : record.data}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {currency(record.total)}
                  </TableCell>
                  {!isQuote ? <TableCell><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusTone(record.atendimento_status)}`}>{record.atendimento_status.replaceAll("_", " ")}</span></TableCell> : null}
                  {!isQuote ? <TableCell><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusTone(record.fiscal_status)}`}>{record.fiscal_status.replaceAll("_", " ")}</span></TableCell> : null}
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusTone(record.status)}`}
                    >
                      {isQuote
                        ? record.situacao.replaceAll("_", " ")
                        : record.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Ver detalhes"
                        onClick={() => void openDetails(record)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {!isQuote ? <Button size="icon" variant="ghost" title="Pre-validacao fiscal" onClick={() => void openFiscalPreflight(record)}><ShieldCheck className="size-4" /></Button> : null}
                      {canManage ? (
                        <>
                          {record.status === "rascunho" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title={
                                isQuote ? "Editar orcamento" : "Editar venda"
                              }
                              onClick={() => void openEdit(record)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {isQuote ? (
                            <>
                              {record.situacao === "em_andamento" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Registrar envio"
                                  onClick={() =>
                                    void runQuoteAction(record, "enviar")
                                  }
                                >
                                  <Send className="size-4" />
                                </Button>
                              ) : null}
                              {record.situacao === "em_andamento" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Aprovar"
                                  onClick={() =>
                                    void runQuoteAction(record, "aprovar")
                                  }
                                >
                                  <Check className="size-4" />
                                </Button>
                              ) : null}
                              {record.situacao === "aprovado" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Converter em venda"
                                  onClick={() =>
                                    void runQuoteAction(record, "converter")
                                  }
                                >
                                  <FileCheck2 className="size-4" />
                                </Button>
                              ) : null}
                              {!["recusado"].includes(record.situacao) &&
                              record.status !== "cancelada" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Recusar"
                                  onClick={() =>
                                    void runQuoteAction(record, "recusar")
                                  }
                                >
                                  <X className="size-4" />
                                </Button>
                              ) : null}
                            </>
                          ) : (
                            <>
                              {record.status === "rascunho" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Confirmar venda"
                                  onClick={() =>
                                    void runAction(record, "confirmar")
                                  }
                                >
                                  <Check className="size-4" />
                                </Button>
                              ) : null}
                              {record.status === "confirmada" && ["pendente", "parcial"].includes(record.atendimento_status) ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Registrar atendimento"
                                  onClick={() => void openFulfill(record)}
                                >
                                  <PackageCheck className="size-4" />
                                </Button>
                              ) : null}
                              {record.status !== "cancelada" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Cancelar venda"
                                  onClick={() =>
                                    void runAction(record, "cancelar")
                                  }
                                >
                                  <X className="size-4" />
                                </Button>
                              ) : null}
                            </>
                          )}
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ErpPagination
          page={page}
          pageSize={50}
          total={totalRecords}
          onPageChange={setPage}
        />
      </div>

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
                Informacoes {isQuote ? "do orcamento" : "da venda"}
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
                  label="Vendedor responsavel"
                  value={sellerId}
                  onChange={setSellerId}
                  options={catalogs.responsibles.map((item) => [
                    item.id,
                    item.nome,
                  ])}
                />
                <FieldInput
                  label="Numero"
                  value={number}
                  onChange={setNumber}
                  placeholder="Automatico"
                />
                <FieldInput
                  label={isQuote ? "Data do orcamento" : "Data da venda"}
                  value={saleDate}
                  onChange={setSaleDate}
                  type="date"
                />
                <FieldInput
                  label="Competencia"
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
                      label="Previsao de entrega"
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
                      label="Emails de cobranca"
                      value={billingEmails}
                      onChange={setBillingEmails}
                      placeholder="financeiro@cliente.com"
                    />
                    <FieldInput
                      label="WhatsApp de cobranca"
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
                <span>Produto ou servico</span>
                <span>Quantidade</span>
                <span>Valor unitario</span>
                <span>Desconto</span>
                <span>Total</span>
                <span />
              </div>
              {items.map((item) => {
                const catalog =
                  item.tipo === "produto"
                    ? catalogs.products
                    : catalogs.services;
                const itemTotal = Math.max(
                  0,
                  money(item.quantidade) * money(item.valorUnitario) -
                    money(item.desconto),
                );
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
              <div className="grid gap-4 md:grid-cols-4">
                <FieldInput
                  label="Desconto geral"
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
                <h2 className="text-sm font-semibold">Condicao de pagamento</h2>
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
                ? "Orcamentos nao movimentam financeiro ou estoque"
                : "A confirmacao gera contas a receber"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={saving} onClick={() => void saveSale()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {editingSale
                  ? "Salvar alteracoes"
                  : `Salvar ${isQuote ? "orcamento" : "venda"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={fulfillOpen} onOpenChange={setFulfillOpen}>
        <DialogContent className="max-w-[min(760px,96vw)]">
          <DialogHeader>
            <DialogTitle>Atender produtos de {fulfillSale?.numero}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Informe as quantidades entregues agora. O saldo restante continuara
            reservado e pendente.
          </p>
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto">
            {fulfillItems.map((item) => (
              <div
                key={item.id}
                className="grid items-center gap-2 rounded-md bg-gray-50 p-3 md:grid-cols-[1fr_160px]"
              >
                <div>
                  <p className="text-sm font-medium">{item.descricao}</p>
                  <p className="text-xs text-gray-500">
                    Pendente: {item.pendente}
                  </p>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={item.pendente}
                  step="0.0001"
                  value={item.quantidade}
                  onChange={(event) =>
                    setFulfillItems((current) =>
                      current.map((row) =>
                        row.id === item.id
                          ? { ...row, quantidade: event.target.value }
                          : row,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFulfillOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                saving ||
                !fulfillItems.some((item) => Number(item.quantidade) > 0)
              }
              onClick={() => void fulfill()}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PackageCheck className="size-4" />
              )}
              Confirmar atendimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={fiscalOpen} onOpenChange={setFiscalOpen}><DialogContent className="max-w-[min(720px,96vw)]"><DialogHeader><DialogTitle>Pre-validacao fiscal</DialogTitle></DialogHeader>{fiscalLoading ? <div className="py-16 text-center text-sm text-gray-500"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />Validando cadastros e itens...</div> : fiscalResult ? <div className="grid gap-4"><div className={`rounded-md border px-4 py-3 text-sm ${fiscalResult.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{fiscalResult.ready ? 'A venda possui os dados minimos para a futura emissao fiscal.' : 'Existem campos que precisam ser corrigidos antes da emissao.'}</div><div className="grid gap-2">{fiscalResult.issues.map((issue) => <div key={`${issue.code}-${issue.field}`} className="grid grid-cols-[80px_1fr] gap-3 border-b py-3"><span className={`text-xs font-medium uppercase ${issue.severity === 'error' ? 'text-rose-600' : 'text-amber-600'}`}>{issue.severity === 'error' ? 'Impeditivo' : 'Aviso'}</span><div><p className="text-sm text-gray-900">{issue.message}</p><p className="mt-1 text-xs text-gray-500">{issue.field}</p></div></div>)}</div></div> : null}</DialogContent></Dialog>
      <ErpDocumentDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={`Detalhes ${isQuote ? "do orcamento" : "da venda"}`}
        loading={detailsLoading}
        document={details?.sale}
        items={details?.items}
        installments={details?.installments}
        events={details?.events}
      />
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        value={value}
        type={type}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <select
        value={value}
        className="h-10 w-full rounded-md bg-gray-50 px-3 text-sm"
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Selecione</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

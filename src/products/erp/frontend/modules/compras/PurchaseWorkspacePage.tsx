"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Eye,
  Loader2,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

type CatalogItem = {
  id: string;
  nome: string;
  codigo?: string;
  documento?: string;
  unidade?: string;
  valor_padrao?: string | number;
  gera_financeiro_padrao?: boolean;
};

type PurchaseCatalogs = {
  suppliers: CatalogItem[];
  products: CatalogItem[];
  services: CatalogItem[];
  categories: CatalogItem[];
  costCenters: CatalogItem[];
  financialAccounts: CatalogItem[];
  paymentMethods: CatalogItem[];
  operationNatures: CatalogItem[];
  locations: CatalogItem[];
};

type PurchaseRecord = {
  id: string;
  numero: string;
  fornecedor: string;
  data: string;
  entrega: string;
  total: number;
  tipo_compra: string;
  tipo_movimento: string;
  financeiro: string;
  status: string;
};

type PurchaseItem = {
  rowId: string;
  kind: "produto" | "servico";
  itemId: string;
  descricao: string;
  detalhes: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  percentualDesconto: string;
};

type PlannedInstallment = {
  numero: number;
  vencimento: string;
  valor: string;
  observacoes: string;
};

type ReceiveItem = {
  id: string;
  descricao: string;
  pendente: number;
  quantidade: string;
  localEstoqueId: string;
};

const emptyCatalogs: PurchaseCatalogs = {
  suppliers: [],
  products: [],
  services: [],
  categories: [],
  costCenters: [],
  financialAccounts: [],
  paymentMethods: [],
  operationNatures: [],
  locations: [],
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value: string | number) {
  const parsed = Number(String(value || 0).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function newItem(): PurchaseItem {
  return {
    rowId: crypto.randomUUID(),
    kind: "produto",
    itemId: "",
    descricao: "",
    detalhes: "",
    unidade: "UN",
    quantidade: "1",
    valorUnitario: "0",
    percentualDesconto: "0",
  };
}

function datePlusMonths(dateText: string, months: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

function movementLabel(value: string) {
  return (
    {
      cotacao: "Cotacao",
      pedido_recorrente: "Pedido recorrente",
      pedido_compra: "Pedido de compra",
      compra: "Compra",
      cancelada: "Cancelada",
    }[value] || value
  );
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string | { message?: string };
  };
  if (!response.ok)
    throw new Error(
      typeof body.error === "string"
        ? body.error
        : body.error?.message || "Nao foi possivel completar a operacao.",
    );
  return body as T;
}

export function PurchaseWorkspacePage() {
  const canManage = useErpAccess().can("erp.compras.gerenciar");
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [catalogs, setCatalogs] = useState<PurchaseCatalogs>(emptyCatalogs);
  const [query, setQuery] = useState("");
  const [movementFilter, setMovementFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receivePurchase, setReceivePurchase] = useState<PurchaseRecord | null>(
    null,
  );
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<{
    purchase: Record<string, unknown>;
    items: Record<string, unknown>[];
    installments: Record<string, unknown>[];
    events: Record<string, unknown>[];
    invoices: Record<string, unknown>[];
  } | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<{
    id: string;
    version: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "50");
      if (query.trim()) params.set("query", query.trim());
      if (movementFilter) params.set("filter.tipo_movimento", movementFilter);
      const [recordsResponse, catalogsResponse] = await Promise.all([
        fetch(`/api/erp/compras${params.size ? `?${params}` : ""}`, {
          cache: "no-store",
        }),
        fetch("/api/erp/compras/catalogos", { cache: "no-store" }),
      ]);
      const recordBody = await parseResponse<{
        records: PurchaseRecord[];
        total: number;
      }>(recordsResponse);
      setRecords(recordBody.records);
      setTotalRecords(recordBody.total);
      setCatalogs(await parseResponse<PurchaseCatalogs>(catalogsResponse));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar compras.",
      );
    } finally {
      setLoading(false);
    }
  }, [movementFilter, page, query]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  useEffect(() => {
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
  }, [total]);

  function resetForm() {
    const date = today();
    setTipoCompra("produto");
    setTipoMovimento("cotacao");
    setFornecedorId("");
    setNumero("");
    setDataCompra(date);
    setDataCompetencia(date);
    setDataEntrega("");
    setCategoriaId("");
    setCentroCustoId("");
    setNaturezaId("");
    setGeraFinanceiro(true);
    setContaFinanceiraId("");
    setMetodoPagamentoId("");
    setItems([newItem()]);
    setDesconto("0");
    setFrete("0");
    setSeguro("0");
    setOutrasDespesas("0");
    setImpostosRetidos("0");
    setInstallments([
      { numero: 1, vencimento: date, valor: "0", observacoes: "" },
    ]);
    setObservacoes("");
    setError(null);
    setEditingPurchase(null);
  }

  function openEditor() {
    resetForm();
    setEditorOpen(true);
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

  async function savePurchase() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        editingPurchase
          ? `/api/erp/compras/${editingPurchase.id}`
          : "/api/erp/compras",
        {
          method: editingPurchase ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            expectedVersion: editingPurchase?.version,
            values: {
              tipo_compra: tipoCompra,
              tipo_movimento: tipoMovimento,
              fornecedor_id: fornecedorId,
              numero,
              data_compra: dataCompra,
              data_competencia: dataCompetencia,
              data_prevista_entrega: dataEntrega,
              categoria_id: categoriaId,
              centro_custo_id: centroCustoId,
              natureza_operacao_id: naturezaId,
              gera_financeiro: geraFinanceiro,
              conta_financeira_id: contaFinanceiraId,
              metodo_pagamento_id: metodoPagamentoId,
              desconto,
              frete,
              seguro,
              outras_despesas: outrasDespesas,
              impostos_retidos: impostosRetidos,
              observacoes,
              itens: items.map((item) => ({
                produto_id: item.kind === "produto" ? item.itemId : null,
                servico_id: item.kind === "servico" ? item.itemId : null,
                descricao: item.descricao,
                detalhes: item.detalhes,
                unidade: item.unidade,
                quantidade: item.quantidade,
                valor_unitario: item.valorUnitario,
                percentual_desconto: item.percentualDesconto,
              })),
              parcelas:
                total > 0
                  ? installments.map((installment) => ({
                      numero_parcela: installment.numero,
                      data_vencimento: installment.vencimento,
                      valor: installment.valor,
                      observacoes: installment.observacoes,
                      conta_financeira_id: contaFinanceiraId,
                      metodo_pagamento_id: metodoPagamentoId,
                    }))
                  : [],
            },
          }),
        },
      );
      await parseResponse(response);
      setEditorOpen(false);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nao foi possivel salvar a compra.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    record: PurchaseRecord,
    action: "confirmar" | "cancelar",
  ) {
    const verb = action === "confirmar" ? "efetivar" : "cancelar";
    if (
      !window.confirm(`Deseja ${verb} a compra ${record.numero || record.id}?`)
    )
      return;
    setLoading(true);
    setError(null);
    try {
      await parseResponse(
        await fetch(`/api/erp/compras/${record.id}/${action}`, {
          method: "POST",
        }),
      );
      await loadData();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : `Nao foi possivel ${verb} a compra.`,
      );
      setLoading(false);
    }
  }

  async function openDetails(record: PurchaseRecord) {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetails(null);
    setError(null);
    try {
      setDetails(
        await parseResponse(
          await fetch(`/api/erp/compras/${record.id}`, { cache: "no-store" }),
        ),
      );
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Nao foi possivel carregar a compra.",
      );
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function openReceive(record: PurchaseRecord) {
    setLoading(true);
    setError(null);
    try {
      const body = await parseResponse<{ items: Record<string, unknown>[] }>(
        await fetch(`/api/erp/compras/${record.id}`, { cache: "no-store" }),
      );
      const defaultLocation = catalogs.locations[0]?.id || "";
      const pending = body.items
        .filter((item) => item.tipo === "produto" && item.controla_estoque)
        .map((item) => {
          const balance = Math.max(
            0,
            Number(item.quantidade || 0) -
              Number(item.quantidade_recebida || 0),
          );
          return {
            id: String(item.id),
            descricao: String(item.descricao || ""),
            pendente: balance,
            quantidade: String(balance),
            localEstoqueId: String(item.local_estoque_id || defaultLocation),
          };
        })
        .filter((item) => item.pendente > 0);
      if (!pending.length)
        throw new Error(
          "Esta compra nao possui produtos pendentes de recebimento.",
        );
      setReceivePurchase(record);
      setReceiveItems(pending);
      setReceiveOpen(true);
    } catch (receiveError) {
      setError(
        receiveError instanceof Error
          ? receiveError.message
          : "Nao foi possivel preparar o recebimento.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function receive() {
    if (!receivePurchase) return;
    setSaving(true);
    setError(null);
    try {
      await parseResponse(
        await fetch(`/api/erp/compras/${receivePurchase.id}/receber`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            data: today(),
            items: receiveItems
              .filter((item) => Number(item.quantidade) > 0)
              .map((item) => ({
                item_id: item.id,
                quantidade: item.quantidade,
                local_estoque_id: item.localEstoqueId,
              })),
          }),
        }),
      );
      setReceiveOpen(false);
      await loadData();
    } catch (receiveError) {
      setError(
        receiveError instanceof Error
          ? receiveError.message
          : "Nao foi possivel registrar o recebimento.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function openEdit(record: PurchaseRecord) {
    setLoading(true);
    setError(null);
    try {
      const body = await parseResponse<{
        purchase: Record<string, unknown>;
        items: Record<string, unknown>[];
        installments: Record<string, unknown>[];
      }>(await fetch(`/api/erp/compras/${record.id}`, { cache: "no-store" }));
      const purchase = body.purchase;
      setEditingPurchase({
        id: record.id,
        version: Number(purchase.versao || 1),
      });
      setTipoCompra(purchase.tipo_compra === "servico" ? "servico" : "produto");
      setTipoMovimento("cotacao");
      setFornecedorId(String(purchase.fornecedor_id || ""));
      setNumero(String(purchase.numero || ""));
      setDataCompra(String(purchase.data_compra || "").slice(0, 10));
      setDataCompetencia(
        String(purchase.data_competencia || purchase.data_compra || "").slice(
          0,
          10,
        ),
      );
      setDataEntrega(String(purchase.data_prevista_entrega || "").slice(0, 10));
      setCategoriaId(String(purchase.categoria_id || ""));
      setCentroCustoId(String(purchase.centro_custo_id || ""));
      setNaturezaId(String(purchase.natureza_operacao_id || ""));
      setGeraFinanceiro(Boolean(purchase.gera_financeiro));
      setContaFinanceiraId(String(purchase.conta_financeira_id || ""));
      setMetodoPagamentoId(String(purchase.metodo_pagamento_id || ""));
      setDesconto(String(purchase.desconto || 0));
      setFrete(String(purchase.frete || 0));
      setSeguro(String(purchase.seguro || 0));
      setOutrasDespesas(String(purchase.outras_despesas || 0));
      setImpostosRetidos(String(purchase.impostos_retidos || 0));
      setObservacoes(String(purchase.observacoes || ""));
      setItems(
        body.items.map((item) => {
          const gross =
            money(item.quantidade as number) *
            money(item.valor_unitario as number);
          const percent =
            gross > 0
              ? (money(item.valor_desconto as number) / gross) * 100
              : 0;
          return {
            rowId: crypto.randomUUID(),
            kind: item.tipo === "servico" ? "servico" : "produto",
            itemId: String(item.item_id || ""),
            descricao: String(item.descricao || ""),
            detalhes: String(item.detalhes || ""),
            unidade: String(item.unidade || "UN"),
            quantidade: String(item.quantidade || 1),
            valorUnitario: String(item.valor_unitario || 0),
            percentualDesconto: percent.toFixed(4),
          };
        }),
      );
      setInstallments(
        body.installments.map((row) => ({
          numero: Number(row.numero_parcela || 1),
          vencimento: String(row.data_vencimento || "").slice(0, 10),
          valor: String(row.valor || 0),
          observacoes: String(row.descricao || ""),
        })),
      );
      setEditorOpen(true);
    } catch (editError) {
      setError(
        editError instanceof Error
          ? editError.message
          : "Nao foi possivel editar a compra.",
      );
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(
    () => ({
      total: records.reduce((sum, record) => sum + record.total, 0),
      pedidos: records.filter((record) =>
        record.tipo_movimento.includes("pedido"),
      ).length,
      efetivas: records.filter((record) => record.tipo_movimento === "compra")
        .length,
    }),
    [records],
  );

  const itemCatalog =
    tipoCompra === "produto" ? catalogs.products : catalogs.services;

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">ERP / Compras</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">Compras</h1>
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
          <Button disabled={!canManage} onClick={openEditor}>
            <Plus className="size-4" />
            Nova compra
          </Button>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border bg-gray-200 sm:grid-cols-3">
        <div className="bg-white p-4">
          <p className="text-xs text-gray-500">Valor listado</p>
          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(summary.total)}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs text-gray-500">Pedidos em aberto</p>
          <p className="mt-1 text-xl font-semibold">{summary.pedidos}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs text-gray-500">Compras efetivas</p>
          <p className="mt-1 text-xl font-semibold">{summary.efetivas}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-y py-3 md:flex-row">
        <Input
          value={query}
          placeholder="Buscar por numero ou fornecedor"
          className="md:max-w-sm"
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <select
          value={movementFilter}
          className="h-10 rounded-md bg-gray-50 px-3 text-sm"
          onChange={(event) => {
            setMovementFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os movimentos</option>
          <option value="cotacao">Cotacoes</option>
          <option value="pedido_recorrente">Pedidos recorrentes</option>
          <option value="pedido_compra">Pedidos de compra</option>
          <option value="compra">Compras</option>
          <option value="cancelada">Canceladas</option>
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
              <TableHead>Fornecedor</TableHead>
              <TableHead>Movimento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Financeiro</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-gray-500"
                >
                  <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                  Carregando
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-gray-500"
                >
                  Nenhuma compra encontrada.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.numero}</TableCell>
                  <TableCell>{record.fornecedor}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {movementLabel(record.tipo_movimento)}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.data}</TableCell>
                  <TableCell>{record.entrega || "-"}</TableCell>
                  <TableCell>{record.financeiro}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(record.total)}
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
                      {canManage ? (
                        <>
                          {record.tipo_movimento === "cotacao" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Editar cotacao"
                              onClick={() => void openEdit(record)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {!["compra", "cancelada"].includes(
                            record.tipo_movimento,
                          ) ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Confirmar compra"
                              onClick={() =>
                                void runAction(record, "confirmar")
                              }
                            >
                              <Check className="size-4" />
                            </Button>
                          ) : null}
                          {record.tipo_movimento === "compra" &&
                          ["confirmada", "parcialmente_recebida"].includes(
                            record.status,
                          ) ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Registrar recebimento"
                              onClick={() => void openReceive(record)}
                            >
                              <PackageCheck className="size-4" />
                            </Button>
                          ) : null}
                          {record.tipo_movimento !== "cancelada" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Cancelar"
                              onClick={() => void runAction(record, "cancelar")}
                            >
                              <X className="size-4" />
                            </Button>
                          ) : null}
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
              {editingPurchase ? "Editar cotacao" : "Nova compra"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <section className="grid gap-4 border-b px-6 py-5">
              <h2 className="text-sm font-semibold">Informacoes da compra</h2>
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
                  label="Numero"
                  value={numero}
                  onChange={setNumero}
                  placeholder="Automatico"
                />
                <FieldInput
                  label="Data da compra"
                  value={dataCompra}
                  onChange={setDataCompra}
                  type="date"
                />
                <FieldInput
                  label="Competencia"
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
                  label="Natureza da operacao"
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
                      title="Valor unitario"
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
                  Informacoes de pagamento
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
                          placeholder="Observacoes da parcela"
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
                  Esta compra nao criara lancamento financeiro.
                </p>
              )}
            </section>
            <section className="grid gap-2 px-6 py-5">
              <Label>Observacoes complementares</Label>
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
                  ? "Gera previsao financeira"
                  : "Sem impacto financeiro"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={saving} onClick={() => void savePurchase()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {editingPurchase ? "Salvar alteracoes" : "Salvar compra"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-[min(820px,96vw)]">
          <DialogHeader>
            <DialogTitle>
              Receber produtos de {receivePurchase?.numero}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Informe somente as quantidades recebidas agora. O saldo restante
            continuara pendente.
          </p>
          <div className="grid max-h-[58vh] gap-2 overflow-y-auto">
            {receiveItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-md bg-gray-50 p-3 md:grid-cols-[1fr_150px_220px]"
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
                    setReceiveItems((current) =>
                      current.map((row) =>
                        row.id === item.id
                          ? { ...row, quantidade: event.target.value }
                          : row,
                      ),
                    )
                  }
                />
                <select
                  className="h-10 rounded-md bg-white px-3 text-sm"
                  value={item.localEstoqueId}
                  onChange={(event) =>
                    setReceiveItems((current) =>
                      current.map((row) =>
                        row.id === item.id
                          ? { ...row, localEstoqueId: event.target.value }
                          : row,
                      ),
                    )
                  }
                >
                  <option value="">Selecione o local</option>
                  {catalogs.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.nome}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                saving ||
                !receiveItems.some(
                  (item) => Number(item.quantidade) > 0 && item.localEstoqueId,
                )
              }
              onClick={() => void receive()}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PackageCheck className="size-4" />
              )}
              Confirmar recebimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ErpDocumentDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title="Detalhes da compra"
        loading={detailsLoading}
        document={details?.purchase}
        items={details?.items}
        installments={details?.installments}
        events={details?.events}
        invoices={details?.invoices}
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

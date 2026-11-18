"use client";

import { useErpConfirmation } from '@/products/erp/frontend/components/ErpConfirmation';

import { ErpMutation } from '@/products/erp/frontend/services/erpMutation';
import { sumMoney } from '@/products/erp/shared/erpMoney';
import {
    Plus
} from "lucide-react";
import {
    useCallback,
    useDeferredValue,
    useEffect,
    useState
} from "react";

import { Button } from "@/components/ui/button";
import { ErpDocumentDetailsDialog } from "@/products/erp/frontend/components/ErpDocumentDetailsDialog";
import { ErpFilterButton, ErpPeriodSummary, ErpSalesTabs, ErpSearchToolbar, ErpWorkspaceHeader } from "@/products/erp/frontend/components/ErpWorkspaceChrome";
import { useErpAccess } from "@/products/erp/frontend/hooks/useErpAccess";

import { SaleEditorDialog } from './SaleEditorDialog';
import { SaleFiscalDialog } from './SaleFiscalDialog';
import { SaleFulfillDialog } from './SaleFulfillDialog';
import { SalesTable } from './SalesTable';
import { Catalogs, FulfillItem, SaleRecord, currency, emptyCatalogs, newItem, parseResponse, today } from './salesWorkspaceModel';
import { useSaleForm } from './useSaleForm';

export function SalesWorkspacePage({
  documentType = "venda",
}: {
  documentType?: "venda" | "orcamento";
}) {
  const confirmAction = useErpConfirmation()

  const isQuote = documentType === "orcamento";
  const canManage = useErpAccess().can("erp.vendas.gerenciar");
  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const form = useSaleForm({ catalogs, setCatalogs });
  const { customerId, setCustomerId, sellerId, setSellerId, number, setNumber, saleDate, setSaleDate, competence, setCompetence, validity, setValidity, deliveryForecast, setDeliveryForecast, categoryId, setCategoryId, costCenterId, setCostCenterId, items, setItems, discountType, setDiscountType, discount, setDiscount, freight, setFreight, installments, setInstallments, billingEmails, setBillingEmails, billingWhatsapp, setBillingWhatsapp, notes, setNotes, discountError } = form;

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
          : `Não foi possível carregar ${isQuote ? "os orçamentos" : "as vendas"}.`,
      );
    } finally {
      setLoading(false);
    }
  }, [deferredQuery, documentType, isQuote, page, status]);

  useEffect(() => {
    void loadData();
  }, [loadData]);


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
    setDiscountType("valor");
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


  const [createOperation] = useState(()=>new ErpMutation(undefined,true));
  async function saveSale() {
    if (saving) return;
    if (discountError) {setError(discountError);return;}
    setSaving(true);
    setError(null);
    try {
      const payload = {values: {
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
                tipo_desconto: discountType,
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

      }};
      if (editingSale) await parseResponse(await fetch(`/api/erp/vendas/${editingSale.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,expectedVersion:editingSale.version})}));
      else await createOperation.submit('/api/erp/vendas',payload);
      setEditorOpen(false);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : `Não foi possível salvar ${isQuote ? "o orçamento" : "a venda"}.`,
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
    if (!(await confirmAction({
      title: actionLabel + ' venda',
      description: action === 'confirmar'
        ? 'A confirmação gera as parcelas a receber e reserva os produtos de estoque. A entrega é registrada no atendimento da venda.'
        : 'O cancelamento encerra os valores a receber e libera as reservas ainda não entregues. Vendas com entregas ou devoluções registradas não podem ser canceladas diretamente. Recebimentos precisam ser estornados antes.',
      details: [record.numero, record.cliente, currency(record.total)].join(' · '),
      confirmLabel: actionLabel + ' venda', destructive: action === 'cancelar',
    }))) return;
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
          body: JSON.stringify({ values: {expectedVersion:record.versao} }),
        }),
      );
      await loadData();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Não foi possível atualizar a venda.",
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
          : "Não foi possível atualizar o orçamento.",
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
          : "Não foi possível carregar a venda.",
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
    } catch (preflightError) { setError(preflightError instanceof Error ? preflightError.message : 'Não foi possível validar os dados fiscais.'); setFiscalOpen(false); }
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
          : "Não foi possível preparar o atendimento.",
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
          : "Não foi possível atender os produtos.",
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
      setDiscountType(sale.tipo_desconto === "percentual" ? "percentual" : "valor");
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
          : `Não foi possível editar ${isQuote ? "o orçamento" : "a venda"}.`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col bg-white">
      <ErpWorkspaceHeader
        section="Vendas"
        title={isQuote ? "Orçamentos" : "Pedidos de venda"}
        menuItems={[{ label: "Atualizar dados", onSelect: () => void loadData() }]}
        primaryAction={canManage ? <Button
          aria-label={isQuote ? "Adicionar orçamento" : "Adicionar venda"}
          className="h-11 rounded-md bg-[#c9f20a] px-5 font-medium text-[#142000] shadow-none hover:bg-[#b9df09]"
          onClick={() => { resetForm(); setEditorOpen(true); }}
        ><Plus className="size-4" />Adicionar</Button> : undefined}
      />
      <ErpSalesTabs activeHref={isQuote ? "/erp/vendas/orcamentos" : "/erp/vendas/pedidos"} />
      <ErpPeriodSummary title="Resumo desta página" description="Considera os registros carregados com os filtros atuais." metrics={[
        { label: isQuote ? 'Orçamentos' : 'Pedidos', value: String(records.length) },
        { label: isQuote ? 'Em andamento' : 'Rascunhos', value: String(records.filter(record => record.status !== 'cancelada' && (isQuote ? ['em_andamento','enviada'].includes(record.situacao) : record.status === 'rascunho')).length) },
        { label: isQuote ? 'Aprovados' : 'Confirmados', value: String(records.filter(record => record.status !== 'cancelada' && (isQuote ? record.situacao === 'aprovado' : record.status === 'confirmada')).length), tone: 'success' },
        { label: isQuote ? 'Recusados' : 'Cancelados', value: String(records.filter(record => isQuote ? record.situacao === 'recusado' : record.status === 'cancelada').length), tone: 'danger' },
        { label: 'Valor listado', value: currency(sumMoney(records.map(record => record.total))) },
      ]} />
      <ErpSearchToolbar
        query={query}
        onQueryChange={value => { setQuery(value); setPage(1); }}
        placeholder="Pesquisar por descrição, número ou cliente…"
        resultLabel={<>{totalRecords ? (page - 1) * 50 + 1 : 0}–{Math.min(page * 50, totalRecords)} de {totalRecords}</>}
      ><ErpFilterButton active={Boolean(status)} onClick={() => setFiltersOpen(current => !current)} /></ErpSearchToolbar>
      {filtersOpen ? <div className="flex flex-wrap gap-2 border-b border-[#e7e7e4] bg-[#fafaf8] px-5 py-3 md:px-8 lg:px-10">
        <select
          aria-label="Situação"
          value={status}
          className="h-10 rounded-md border border-[#dfdfdc] bg-white px-3 text-sm"
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas as situações</option>
          <option value="rascunho">Rascunho</option>
          <option value="confirmada">Confirmada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div> : null}
      {error ? (
        <div role="alert" className="mx-5 mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:mx-8 lg:mx-10">
          {error}
        </div>
      ) : null}
      <SalesTable records={records} loading={loading} isQuote={isQuote} canManage={canManage} page={page} totalRecords={totalRecords} setPage={setPage} openDetails={openDetails} openFiscalPreflight={openFiscalPreflight} openEdit={openEdit} runQuoteAction={runQuoteAction} runAction={runAction} openFulfill={openFulfill} />

      <SaleEditorDialog editorOpen={editorOpen} setEditorOpen={setEditorOpen} isQuote={isQuote} editingSale={editingSale} catalogs={catalogs} setCatalogs={setCatalogs} saving={saving} saveSale={saveSale} form={form} />
      <SaleFulfillDialog fulfillOpen={fulfillOpen} setFulfillOpen={setFulfillOpen} fulfillSale={fulfillSale} fulfillItems={fulfillItems} setFulfillItems={setFulfillItems} saving={saving} fulfill={fulfill} />
      <SaleFiscalDialog fiscalOpen={fiscalOpen} setFiscalOpen={setFiscalOpen} fiscalLoading={fiscalLoading} fiscalResult={fiscalResult} />
      <ErpDocumentDetailsDialog
        documentKind="vendas"
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={`Detalhes ${isQuote ? "do orçamento" : "da venda"}`}
        loading={detailsLoading}
        document={details?.sale}
        items={details?.items}
        installments={details?.installments}
        events={details?.events}
      />
    </div>
  );
}

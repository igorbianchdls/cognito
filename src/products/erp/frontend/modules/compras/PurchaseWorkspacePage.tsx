"use client";

import { useErpConfirmation, useErpPrompt } from '@/products/erp/frontend/components/ErpConfirmation';

import {
    Plus
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErpDocumentDetailsDialog } from "@/products/erp/frontend/components/ErpDocumentDetailsDialog";
import { ErpFilterButton, ErpModuleWorkspaceTabs, ErpPeriodSummary, ErpSearchToolbar, ErpWorkspaceHeader } from "@/products/erp/frontend/components/ErpWorkspaceChrome";
import { useErpAccess } from "@/products/erp/frontend/hooks/useErpAccess";

import { PurchaseEditorDialog } from './PurchaseEditorDialog';
import { PurchaseReceiveDialog } from './PurchaseReceiveDialog';
import { PurchasesTable } from './PurchasesTable';
import { PurchaseCatalogs, PurchaseRecord, ReceiveItem, emptyCatalogs, formatCurrency, money, newItem, parseResponse, today } from './purchaseWorkspaceModel';
import { usePurchaseForm } from './usePurchaseForm';

export function PurchaseWorkspacePage() {
  const confirmAction = useErpConfirmation()
  const prompt = useErpPrompt()

  const canManage = useErpAccess().can("erp.compras.gerenciar");
  const access = useErpAccess()
  const canReturn = canManage && access.can('erp.financeiro.gerenciar') && access.can('erp.estoque.movimentar')
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [catalogs, setCatalogs] = useState<PurchaseCatalogs>(emptyCatalogs);
  const [query, setQuery] = useState("");
  const [movementFilter, setMovementFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const form = usePurchaseForm({ catalogs });
  const { tipoCompra, setTipoCompra, tipoMovimento, setTipoMovimento, fornecedorId, setFornecedorId, numero, setNumero, dataCompra, setDataCompra, dataCompetencia, setDataCompetencia, dataEntrega, setDataEntrega, categoriaId, setCategoriaId, centroCustoId, setCentroCustoId, naturezaId, setNaturezaId, geraFinanceiro, setGeraFinanceiro, contaFinanceiraId, setContaFinanceiraId, metodoPagamentoId, setMetodoPagamentoId, items, setItems, desconto, setDesconto, frete, setFrete, seguro, setSeguro, outrasDespesas, setOutrasDespesas, impostosRetidos, setImpostosRetidos, installments, setInstallments, observacoes, setObservacoes, total } = form;

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
          : "Não foi possível carregar compras.",
      );
    } finally {
      setLoading(false);
    }
  }, [movementFilter, page, query]);

  useEffect(() => {
    void loadData();
  }, [loadData]);


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
          : "Não foi possível salvar a compra.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function returnPurchase(record: PurchaseRecord) {
    const motivo = await prompt({ title: 'Devolver compra integral ao fornecedor', description: 'Todos os produtos recebidos serão retirados do estoque e as contas a pagar serão canceladas. Pagamentos, créditos e renegociações precisam ser revertidos antes. A nota de entrada e o histórico serão preservados. Esta operação não emite nota fiscal de devolução.', inputLabel: 'Motivo (mínimo de 3 caracteres)', type: 'text', minimumLength: 3, defaultValue: '', maximum: 1000, details: `${record.numero} · ${record.fornecedor} · ${formatCurrency(record.total)}`, confirmLabel: 'Registrar devolução integral', destructive: true })
    if (motivo === null) return
    if (motivo.trim().length < 3) { setError('Informe um motivo com pelo menos 3 caracteres.'); return }
    setLoading(true); setError(null)
    try {
      await parseResponse(await fetch(`/api/erp/compras/${record.id}/devolver`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ expectedVersion: record.versao, motivo }) }))
      await loadData()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível devolver a compra.'); setLoading(false) }
  }

  async function runAction(
    record: PurchaseRecord,
    action: "confirmar" | "cancelar",
  ) {
    const verb = action === "confirmar" ? "efetivar" : "cancelar";
    if (
      !(await confirmAction({
        title: action === 'confirmar' ? 'Efetivar compra' : 'Cancelar compra',
        description: action === 'confirmar'
          ? 'A compra será efetivada e as parcelas a pagar serão geradas, se o financeiro estiver habilitado. Produtos de estoque precisam ter o recebimento registrado separadamente.'
          : 'A compra será cancelada e seus efeitos financeiros e de estoque serão revertidos. Pagamentos existentes precisam ser estornados antes.',
        details: [record.numero || record.id, record.fornecedor, formatCurrency(record.total)].join(' · '),
        confirmLabel: action === 'confirmar' ? 'Efetivar compra' : 'Cancelar compra',
        destructive: action === 'cancelar',
      }))
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
          : `Não foi possível ${verb} a compra.`,
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
          : "Não foi possível carregar a compra.",
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
          "Esta compra não possui produtos pendentes de recebimento.",
        );
      setReceivePurchase(record);
      setReceiveItems(pending);
      setReceiveOpen(true);
    } catch (receiveError) {
      setError(
        receiveError instanceof Error
          ? receiveError.message
          : "Não foi possível preparar o recebimento.",
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
          : "Não foi possível registrar o recebimento.",
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
          : "Não foi possível editar a compra.",
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
    <div className="flex min-h-full min-w-0 flex-col bg-white">
      <ErpWorkspaceHeader section="Compras" title="Compras" menuItems={[{ label: 'Atualizar dados', onSelect: () => void loadData() }]} primaryAction={canManage ? <Button aria-label="Adicionar compra" className="h-11 rounded-md bg-[#c9f20a] px-5 font-medium text-[#142000] shadow-none hover:bg-[#b9df09]" onClick={openEditor}><Plus className="size-4" />Adicionar</Button> : undefined} />
      <ErpModuleWorkspaceTabs sectionId="compras" moduleId="pedidos-compra" />
      <ErpPeriodSummary title="Resumo desta página" description="Considera os registros carregados com os filtros atuais." metrics={[
        { label: 'Compras listadas', value: String(records.length) },
        { label: 'Pedidos', value: String(summary.pedidos) },
        { label: 'Compras efetivas', value: String(summary.efetivas), tone: 'success' },
        { label: 'Valor listado', value: formatCurrency(summary.total) },
      ]} />
      <ErpSearchToolbar query={query} onQueryChange={value => { setQuery(value); setPage(1); }} placeholder="Pesquisar por descrição, número ou fornecedor…" resultLabel={<>{totalRecords ? (page - 1) * 50 + 1 : 0}–{Math.min(page * 50, totalRecords)} de {totalRecords}</>}>
        <ErpFilterButton active={Boolean(movementFilter)} onClick={() => setFiltersOpen(current => !current)} />
      </ErpSearchToolbar>
      {filtersOpen ? <div className="flex flex-wrap gap-2 border-b border-[#e7e7e4] bg-[#fafaf8] px-5 py-3 md:px-8 lg:px-10">
        <select
          aria-label="Movimento"
          value={movementFilter}
          className="h-10 rounded-md border border-[#dfdfdc] bg-white px-3 text-sm"
          onChange={(event) => {
            setMovementFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os movimentos</option>
          <option value="cotacao">Cotações</option>
          <option value="pedido_recorrente">Pedidos recorrentes</option>
          <option value="pedido_compra">Pedidos de compra</option>
          <option value="compra">Compras</option>
          <option value="cancelada">Canceladas</option>
          <option value="devolucao_fornecedor">Devolvidas ao fornecedor</option>
        </select>
      </div> : null}

      {error ? (
        <div role="alert" className="mx-5 mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:mx-8 lg:mx-10">
          {error}
        </div>
      ) : null}
      <PurchasesTable canManage={canManage} canReturn={canReturn} records={records} page={page} setPage={setPage} totalRecords={totalRecords} loading={loading} returnPurchase={returnPurchase} runAction={runAction} openDetails={openDetails} openReceive={openReceive} openEdit={openEdit} />

      <PurchaseEditorDialog catalogs={catalogs} setCatalogs={setCatalogs} editorOpen={editorOpen} setEditorOpen={setEditorOpen} editingPurchase={editingPurchase} saving={saving} savePurchase={savePurchase} itemCatalog={itemCatalog} form={form} />
      <PurchaseReceiveDialog catalogs={catalogs} receiveOpen={receiveOpen} setReceiveOpen={setReceiveOpen} receivePurchase={receivePurchase} receiveItems={receiveItems} setReceiveItems={setReceiveItems} saving={saving} receive={receive} />
      <ErpDocumentDetailsDialog
        documentKind="compras"
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

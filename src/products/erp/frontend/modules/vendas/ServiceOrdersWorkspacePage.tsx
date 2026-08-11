"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Eye,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Trash2,
  Wrench,
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
import { useErpAccess } from "@/products/erp/frontend/hooks/useErpAccess";
import { ErpAsyncCatalogSelect, type ErpCatalogRecord } from "@/products/erp/frontend/components/ErpAsyncCatalogSelect";
import {
  parseErpResponse,
  formatErpCurrency,
  formatErpValue,
} from "@/products/erp/frontend/services/erpProfessionalClient";

type Option = {
  id: string;
  nome: string;
  codigo?: string;
  valor_padrao?: number;
};
type Catalogs = {
  customers: Option[];
  responsibles: Option[];
  products: Option[];
  services: Option[];
};
type ServiceOrder = {
  id: string;
  numero: string;
  status: string;
  data_inicio: string;
  previsao_entrega?: string;
  cliente: string;
  responsavel?: string;
  equipamento?: string;
  marca?: string;
  modelo?: string;
  total: number;
  itens: number;
  versao: number;
};
type OrderItem = {
  rowId: string;
  tipo: "produto" | "servico";
  itemId: string;
  descricao: string;
  quantidade: string;
  valor: string;
  desconto: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyCatalogs: Catalogs = {
  customers: [],
  responsibles: [],
  products: [],
  services: [],
};
const newItem = (): OrderItem => ({
  rowId: crypto.randomUUID(),
  tipo: "servico",
  itemId: "",
  descricao: "",
  quantidade: "1",
  valor: "0",
  desconto: "0",
});

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  orcamento_pendente: "Orcamento pendente",
  aprovada: "Aprovada",
  em_execucao: "Em execucao",
  concluida: "Concluida",
  cancelada: "Cancelada",
};

function statusClass(status: string) {
  if (status === "concluida")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "cancelada")
    return "border-gray-200 bg-gray-100 text-gray-500";
  if (status === "em_execucao")
    return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function ServiceOrdersWorkspacePage() {
  const canManage = useErpAccess().can("erp.vendas.gerenciar");
  const [records, setRecords] = useState<ServiceOrder[]>([]);
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [details, setDetails] = useState<{
    order: Record<string, unknown>;
    items: Record<string, unknown>[];
    events: Record<string, unknown>[];
  } | null>(null);

  const [clienteId, setClienteId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [dataInicio, setDataInicio] = useState(today());
  const [previsao, setPrevisao] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [problema, setProblema] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [observacoesPublicas, setObservacoesPublicas] = useState("");
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [items, setItems] = useState<OrderItem[]>([newItem()]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (status) params.set("status", status);
      const [ordersResponse, catalogsResponse] = await Promise.all([
        fetch(`/api/erp/ordens-servico?${params}`, { cache: "no-store" }),
        fetch("/api/erp/vendas/catalogos", { cache: "no-store" }),
      ]);
      setRecords(
        (await parseErpResponse<{ records: ServiceOrder[] }>(ordersResponse))
          .records,
      );
      setCatalogs(await parseErpResponse<Catalogs>(catalogsResponse));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar as ordens.",
      );
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            Number(item.quantidade || 0) * Number(item.valor || 0) -
              Number(item.desconto || 0),
          ),
        0,
      ),
    [items],
  );

  function reset() {
    setClienteId("");
    setResponsavelId("");
    setDataInicio(today());
    setPrevisao("");
    setEquipamento("");
    setMarca("");
    setModelo("");
    setSerie("");
    setProblema("");
    setDiagnostico("");
    setObservacoesPublicas("");
    setObservacoesInternas("");
    setItems([newItem()]);
    setError(null);
  }

  function selectItem(rowId: string, itemId: string, record?: ErpCatalogRecord) {
    setItems((current) =>
      current.map((row) => {
        if (row.rowId !== rowId) return row;
        const catalog =
          row.tipo === "produto" ? catalogs.products : catalogs.services;
        const selected = (record as Option | undefined) || catalog.find((option) => option.id === itemId);
        return {
          ...row,
          itemId,
          descricao: selected?.nome || "",
          valor: String(selected?.valor_padrao || 0),
        };
      }),
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await parseErpResponse(
        await fetch("/api/erp/ordens-servico", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            cliente_id: clienteId,
            responsavel_id: responsavelId || null,
            data_inicio: dataInicio,
            previsao_entrega: previsao || null,
            equipamento: equipamento || null,
            marca: marca || null,
            modelo: modelo || null,
            numero_serie: serie || null,
            problema_informado: problema || null,
            diagnostico: diagnostico || null,
            observacoes_publicas: observacoesPublicas || null,
            observacoes_internas: observacoesInternas || null,
            desconto: 0,
            itens: items.map((item) => ({
              tipo: item.tipo,
              item_id: item.itemId,
              descricao: item.descricao,
              quantidade: item.quantidade,
              valor_unitario: item.valor,
              desconto: item.desconto,
            })),
          }),
        }),
      );
      setEditorOpen(false);
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nao foi possivel salvar a ordem.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function openDetails(record: ServiceOrder) {
    setDetailOpen(true);
    setDetails(null);
    try {
      setDetails(
        await parseErpResponse(
          await fetch(`/api/erp/ordens-servico/${record.id}`, {
            cache: "no-store",
          }),
        ),
      );
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Nao foi possivel carregar a ordem.",
      );
      setDetailOpen(false);
    }
  }

  async function runAction(
    record: ServiceOrder,
    action:
      | "aprovar"
      | "iniciar"
      | "concluir"
      | "cancelar"
      | "gerar_orcamento"
      | "gerar_venda",
  ) {
    setLoading(true);
    setError(null);
    try {
      await parseErpResponse(
        await fetch(`/api/erp/ordens-servico/${record.id}/acao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, expectedVersion: record.versao }),
        }),
      );
      await load();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel executar a acao.",
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
            Ordens de servico
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Da entrada do equipamento ate a conclusao e conversao comercial.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Atualizar"
            onClick={() => void load()}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button
            disabled={!canManage}
            onClick={() => {
              reset();
              setEditorOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nova ordem
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-y py-3 md:flex-row">
        <Input
          className="md:max-w-sm"
          placeholder="Buscar por numero, cliente ou equipamento"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="h-10 rounded-md bg-gray-50 px-3 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todas as situacoes</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
              <TableHead>Equipamento</TableHead>
              <TableHead>Previsao</TableHead>
              <TableHead>Situacao</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-64" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-gray-500"
                >
                  <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                  Carregando
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-gray-500"
                >
                  Nenhuma ordem de servico encontrada.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.numero}</TableCell>
                  <TableCell>{record.cliente}</TableCell>
                  <TableCell>
                    {[record.equipamento, record.marca, record.modelo]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </TableCell>
                  <TableCell>
                    {formatErpValue(record.previsao_entrega)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(record.status)}`}
                    >
                      {statusLabels[record.status] || record.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatErpCurrency(record.total)}
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
                          {["rascunho", "orcamento_pendente"].includes(
                            record.status,
                          ) ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Aprovar"
                              onClick={() => void runAction(record, "aprovar")}
                            >
                              <Check className="size-4" />
                            </Button>
                          ) : null}
                          {record.status === "aprovada" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Iniciar execucao"
                              onClick={() => void runAction(record, "iniciar")}
                            >
                              <Play className="size-4" />
                            </Button>
                          ) : null}
                          {record.status === "em_execucao" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Concluir"
                              onClick={() => void runAction(record, "concluir")}
                            >
                              <Wrench className="size-4" />
                            </Button>
                          ) : null}
                          {record.status !== "cancelada" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Gerar orcamento"
                              onClick={() =>
                                void runAction(record, "gerar_orcamento")
                              }
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                          ) : null}
                          {record.status === "concluida" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Gerar venda"
                              onClick={() =>
                                void runAction(record, "gerar_venda")
                              }
                            >
                              <ShoppingBag className="size-4" />
                            </Button>
                          ) : null}
                          {!["concluida", "cancelada"].includes(
                            record.status,
                          ) ? (
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
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="h-[92vh] max-w-[min(1060px,96vw)] overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Nova ordem de servico</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-5">
            <div className="grid gap-6">
              <section className="grid gap-4">
                <h2 className="text-sm font-semibold">Atendimento</h2>
                <div className="grid gap-4 md:grid-cols-4">
                  <ErpAsyncCatalogSelect
                    label="Cliente *"
                    type="cliente"
                    value={clienteId}
                    onChange={(value, record) => {
                      setClienteId(value);
                      setCatalogs((current) => ({ ...current, customers: [record as Option, ...current.customers.filter((item) => item.id !== record.id)] }));
                    }}
                    selectedLabel={catalogs.customers.find((item) => item.id === clienteId)?.nome}
                  />
                  <SelectField
                    label="Responsavel"
                    value={responsavelId}
                    onChange={setResponsavelId}
                    options={catalogs.responsibles}
                  />
                  <InputField
                    label="Inicio"
                    type="date"
                    value={dataInicio}
                    onChange={setDataInicio}
                  />
                  <InputField
                    label="Previsao"
                    type="date"
                    value={previsao}
                    onChange={setPrevisao}
                  />
                  <InputField
                    label="Equipamento"
                    value={equipamento}
                    onChange={setEquipamento}
                  />
                  <InputField label="Marca" value={marca} onChange={setMarca} />
                  <InputField
                    label="Modelo"
                    value={modelo}
                    onChange={setModelo}
                  />
                  <InputField
                    label="Numero de serie"
                    value={serie}
                    onChange={setSerie}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Problema informado"
                    value={problema}
                    onChange={setProblema}
                  />
                  <TextField
                    label="Diagnostico"
                    value={diagnostico}
                    onChange={setDiagnostico}
                  />
                </div>
              </section>
              <section className="grid gap-3 border-t pt-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Produtos e servicos</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setItems((current) => [...current, newItem()])
                    }
                  >
                    <Plus className="size-4" />
                    Adicionar
                  </Button>
                </div>
                {items.map((item) => {
                  const options =
                    item.tipo === "produto"
                      ? catalogs.products
                      : catalogs.services;
                  return (
                    <div
                      key={item.rowId}
                      className="grid gap-2 rounded-md bg-gray-50 p-3 md:grid-cols-[120px_2fr_100px_130px_130px_40px]"
                    >
                      <select
                        className="h-10 rounded-md bg-white px-2 text-sm"
                        value={item.tipo}
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
                        <option value="servico">Servico</option>
                        <option value="produto">Produto</option>
                      </select>
                      <ErpAsyncCatalogSelect
                        type={item.tipo}
                        value={item.itemId}
                        selectedLabel={options.find((option) => option.id === item.itemId)?.nome}
                        onChange={(value, record) => {
                          setCatalogs((current) => {
                            const key = item.tipo === "produto" ? "products" : "services";
                            return { ...current, [key]: [record as Option, ...current[key].filter((option) => option.id !== record.id)] };
                          });
                          selectItem(item.rowId, value, record);
                        }}
                      />
                      {(["quantidade", "valor", "desconto"] as const).map(
                        (key) => (
                          <Input
                            key={key}
                            type="number"
                            min="0"
                            step="0.01"
                            title={key}
                            value={item[key]}
                            onChange={(event) =>
                              setItems((current) =>
                                current.map((row) =>
                                  row.rowId === item.rowId
                                    ? { ...row, [key]: event.target.value }
                                    : row,
                                ),
                              )
                            }
                          />
                        ),
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={items.length === 1}
                        title="Remover"
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
                <div className="text-right">
                  <span className="text-xs text-gray-500">Total previsto</span>
                  <p className="text-xl font-semibold">
                    {formatErpCurrency(total)}
                  </p>
                </div>
              </section>
              <section className="grid gap-4 border-t pt-5 md:grid-cols-2">
                <TextField
                  label="Observacoes para o cliente"
                  value={observacoesPublicas}
                  onChange={setObservacoesPublicas}
                />
                <TextField
                  label="Observacoes internas"
                  value={observacoesInternas}
                  onChange={setObservacoesInternas}
                />
              </section>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar ordem
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-[min(900px,96vw)]">
          <DialogHeader>
            <DialogTitle>Detalhes da ordem</DialogTitle>
          </DialogHeader>
          {details ? (
            <div className="grid max-h-[75vh] gap-5 overflow-y-auto">
              <dl className="grid gap-3 bg-gray-50 p-4 md:grid-cols-4">
                {[
                  "numero",
                  "status",
                  "cliente_nome",
                  "responsavel_nome",
                  "equipamento",
                  "marca",
                  "modelo",
                  "numero_serie",
                  "problema_informado",
                  "diagnostico",
                  "total",
                ].map((key) =>
                  details.order[key] ? (
                    <div key={key}>
                      <dt className="text-xs text-gray-500">
                        {key.replaceAll("_", " ")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium">
                        {formatErpValue(details.order[key])}
                      </dd>
                    </div>
                  ) : null,
                )}
              </dl>
              <SimpleTable title="Itens" rows={details.items} />
              <SimpleTable title="Historico" rows={details.events} />
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-gray-500">
              Carregando...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <select
        className="h-10 rounded-md bg-gray-50 px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Textarea
        className="min-h-24"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
function SimpleTable({
  title,
  rows,
}: {
  title: string;
  rows: Record<string, unknown>[];
}) {
  const columns = rows.length
    ? Object.keys(rows[0])
        .filter(
          (key) => !["tenant_id", "metadata", "excluido_em"].includes(key),
        )
        .slice(0, 7)
    : [];
  return rows.length ? (
    <section>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>
                  {column.replaceAll("_", " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={String(row.id || index)}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {formatErpValue(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  ) : null;
}

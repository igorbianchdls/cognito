"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Printer, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatErpCurrency,
  formatErpValue,
  parseErpResponse,
} from "@/products/erp/frontend/services/erpProfessionalClient";

type ReportId =
  | "dre-caixa"
  | "fluxo-diario"
  | "fluxo-mensal"
  | "posicao-financeira"
  | "vendas-clientes"
  | "vendas-vendedores"
  | "vendas-produtos"
  | "compras-fornecedores"
  | "compras-categorias"
  | "valor-estoque";
type ReportDefinition = {
  title: string;
  description: string;
  currency: string[];
  numeric: string[];
  chartLabel: string;
  chartValue: string;
};

const reports: Record<ReportId, ReportDefinition> = {
  "dre-caixa": {
    title: "DRE por caixa",
    description: "Receitas e despesas conforme o momento do pagamento.",
    currency: ["valor"],
    numeric: [],
    chartLabel: "categoria",
    chartValue: "valor",
  },
  "fluxo-diario": {
    title: "Fluxo de caixa diario",
    description: "Entradas, saidas e saldo realizado por dia e conta.",
    currency: ["entradas", "saidas", "saldo"],
    numeric: [],
    chartLabel: "data",
    chartValue: "saldo",
  },
  "fluxo-mensal": {
    title: "Fluxo de caixa mensal",
    description: "Entradas, saidas e resultado consolidado por mes.",
    currency: ["entradas", "saidas", "saldo"],
    numeric: [],
    chartLabel: "competencia",
    chartValue: "saldo",
  },
  "posicao-financeira": {
    title: "Posicao financeira",
    description: "Saldos de contas a pagar e receber agrupados por situacao.",
    currency: ["saldo"],
    numeric: ["parcelas"],
    chartLabel: "status",
    chartValue: "saldo",
  },
  "vendas-clientes": {
    title: "Vendas por cliente",
    description: "Receita e quantidade de vendas por cliente.",
    currency: ["total"],
    numeric: ["vendas"],
    chartLabel: "cliente",
    chartValue: "total",
  },
  "vendas-vendedores": {
    title: "Vendas por vendedor",
    description: "Receita e quantidade de vendas por responsavel.",
    currency: ["total"],
    numeric: ["vendas"],
    chartLabel: "vendedor",
    chartValue: "total",
  },
  "vendas-produtos": {
    title: "Vendas por produto",
    description: "Quantidade e receita por produto ou servico.",
    currency: ["total"],
    numeric: ["quantidade"],
    chartLabel: "produto",
    chartValue: "total",
  },
  "compras-fornecedores": {
    title: "Compras por fornecedor",
    description: "Volume financeiro e quantidade de compras por fornecedor.",
    currency: ["total"],
    numeric: ["compras"],
    chartLabel: "fornecedor",
    chartValue: "total",
  },
  "compras-categorias": {
    title: "Compras por categoria",
    description: "Volume de despesas agrupado por categoria.",
    currency: ["total"],
    numeric: ["compras"],
    chartLabel: "categoria",
    chartValue: "total",
  },
  "valor-estoque": {
    title: "Valor do estoque",
    description: "Saldo valorizado por produto e local.",
    currency: ["custo_medio", "valor_estoque"],
    numeric: ["quantidade_fisica"],
    chartLabel: "produto",
    chartValue: "valor_estoque",
  },
};

function firstDayOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ProfessionalReportPage({ reportId }: { reportId: ReportId }) {
  const definition = reports[reportId];
  const [from, setFrom] = useState(firstDayOfYear());
  const [to, setTo] = useState(today());
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from, to });
      const body = await parseErpResponse<{
        records: Record<string, unknown>[];
      }>(
        await fetch(`/api/erp/relatorios/${reportId}?${params}`, {
          cache: "no-store",
        }),
      );
      setRecords(body.records);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar o relatorio.",
      );
    } finally {
      setLoading(false);
    }
  }, [from, reportId, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(
    () => (records.length ? Object.keys(records[0]) : []),
    [records],
  );
  const chartData = useMemo(
    () =>
      records.slice(0, 16).map((record) => ({
        label: String(record[definition.chartLabel] || "-").slice(0, 24),
        value: Number(record[definition.chartValue] || 0),
      })),
    [definition, records],
  );

  function exportCsv() {
    if (!records.length) return;
    const escape = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      columns.join(";"),
      ...records.map((record) =>
        columns.map((column) => escape(record[column])).join(";"),
      ),
    ].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    link.download = `${reportId}-${from}-${to}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="flex min-h-full flex-col gap-5 print:block">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">ERP / Relatorios</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            {definition.title}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{definition.description}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="icon"
            title="Atualizar"
            onClick={() => void load()}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir / PDF
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 border-y py-3 print:hidden">
        <label className="grid gap-1 text-xs text-gray-500">
          De
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs text-gray-500">
          Ate
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
      </div>
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {!loading && chartData.length ? (
        <section className="h-72 border-b pb-5 print:hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                angle={-25}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatErpCurrency(value)} />
              <Bar dataKey="value" fill="#18181b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : null}
      <div className="overflow-x-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((column) => (
                <TableHead key={column}>
                  {column.replaceAll("_", " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(1, columns.length)}
                  className="h-32 text-center text-gray-500"
                >
                  <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                  Carregando
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(1, columns.length)}
                  className="h-32 text-center text-gray-500"
                >
                  Nenhum resultado no periodo.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      className={
                        definition.currency.includes(column) ||
                        definition.numeric.includes(column)
                          ? "text-right"
                          : ""
                      }
                    >
                      {definition.currency.includes(column)
                        ? formatErpCurrency(record[column])
                        : formatErpValue(record[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function isProfessionalReport(value?: string): value is ReportId {
  return Boolean(value && value in reports);
}

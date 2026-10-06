"use client";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  Package,
  Wrench,
} from "lucide-react";
import { ErpRecordIdentity } from "@/products/erp/frontend/components/ErpRecordIdentity";
import { ErpStatusBadge } from "@/products/erp/frontend/components/ErpWorkspaceChrome";
import type {
  DashboardList,
  DashboardResponse,
} from "@/products/erp/shared/dashboardContracts";
import {
  DashboardChartView,
  DashboardListView,
  DashboardMetrics,
  dashboardDate,
  dashboardValue,
} from "../components/DashboardViews";

function OverviewTable({
  list,
  upcoming = false,
}: {
  list: DashboardList;
  upcoming?: boolean;
}) {
  return (
    <section className="erp-dashboard-table-section">
      <div className="erp-dashboard-section-heading">
        <h2>{list.title}</h2>
        {list.href ? (
          <Link href={list.href} className="erp-dashboard-text-link">
            Ver todos
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {list.rows.length ? (
        <div className="min-w-0 overflow-x-auto">
          <table
            className="erp-workspace-table erp-dashboard-table w-full text-left"
            aria-label={list.title}
          >
            <thead>
              <tr>
                <th scope="col" className="erp-table-identity-heading">
                  {upcoming ? "Descrição" : "Cliente"}
                </th>
                {upcoming ? (
                  <th scope="col" className="whitespace-nowrap">
                    Vencimento
                  </th>
                ) : null}
                <th scope="col" className="whitespace-nowrap text-right">
                  {upcoming ? "Saldo a pagar" : "Vendas no período"}
                </th>
                {upcoming ? <th scope="col">Situação</th> : null}
              </tr>
            </thead>
            <tbody>
              {list.rows.slice(0, 5).map((row) => {
                const identity = (
                  <ErpRecordIdentity
                    name={row.label}
                    category={row.detail}
                    showCategory={Boolean(row.detail)}
                    identityKey={"dashboard:" + list.key + ":" + row.id}
                  />
                );
                return (
                  <tr key={row.id}>
                    <td>
                      {row.href ? (
                        <Link
                          href={row.href}
                          className="erp-dashboard-record-link"
                        >
                          {identity}
                        </Link>
                      ) : (
                        identity
                      )}
                    </td>
                    {upcoming ? (
                      <td className="whitespace-nowrap">
                        {row.date ? dashboardDate(row.date).slice(0, 5) : "—"}
                      </td>
                    ) : null}
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {dashboardValue(row.value, row.format)}
                    </td>
                    {upcoming ? (
                      <td>
                        <ErpStatusBadge
                          status={row.status || "aberto"}
                          label={row.status || "Em aberto"}
                          tone={
                            /vencid/i.test(row.status || "")
                              ? "danger"
                              : "default"
                          }
                        />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="erp-dashboard-empty">
          {upcoming
            ? "Nenhuma parcela a pagar nos próximos sete dias."
            : "Nenhuma venda confirmada neste período."}
        </p>
      )}
    </section>
  );
}

export function OverviewDashboardView({ data }: { data: DashboardResponse }) {
  const mainKeys = [
    "erp.financeiro.visualizar-saldo",
    "erp.vendas.visualizar-vendas",
    "erp.compras.visualizar-compras",
    "erp.relatorios.visualizar-resultado",
  ];
  const main = mainKeys.flatMap((key) => {
    const m = data.metrics.find((metric) => metric.key === key);
    return m
      ? [{ ...m, label: key.endsWith("-saldo") ? "Saldo disponível" : m.label }]
      : [];
  });
  const attentionItems = [
    {
      key: "erp.financeiro.visualizar-pagar-vencido",
      icon: AlertCircle,
      label: "Pagamentos vencidos",
      urgent: true,
    },
    {
      key: "erp.financeiro.visualizar-proximos",
      icon: Clock3,
      label: "A pagar em 7 dias",
      urgent: false,
    },
    {
      key: "erp.estoque.visualizar-repor",
      icon: Package,
      label: "Produtos para repor",
      urgent: false,
    },
    {
      key: "erp.vendas.visualizar-atrasadas",
      icon: Wrench,
      label: "Ordens atrasadas",
      urgent: false,
    },
  ].flatMap((item) => {
    const metric = data.metrics.find((m) => m.key === item.key);
    return metric ? [{ ...item, metric }] : [];
  });
  const upcoming = data.lists.find((l) => l.key === "proximos-vencimentos");
  const clients = data.lists.find((l) => l.key === "clientes");
  const other = data.lists.filter(
    (l) => !["proximos-vencimentos", "clientes"].includes(l.key),
  );
  return (
    <>
      {main.length ? (
        <DashboardMetrics metrics={main} appearance="ramp" />
      ) : null}
      {attentionItems.length ? (
        <section
          className="erp-dashboard-attention"
          aria-label="Precisa da sua atenção"
        >
          <h2 className="erp-dashboard-section-title">
            Precisa da sua atenção
          </h2>
          <div className="erp-dashboard-attention-grid">
            {attentionItems.map(({ metric, icon: Icon, label, urgent }) => {
              const tone =
                metric.value === 0
                  ? "erp-dashboard-attention-neutral"
                  : urgent
                    ? "erp-dashboard-attention-urgent"
                    : "erp-dashboard-attention-warning";
              const content = (
                <>
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="erp-dashboard-attention-label">
                      {label}
                    </span>
                    <span className="erp-dashboard-attention-value tabular-nums">
                      {dashboardValue(metric.value, metric.format)}
                      {metric.key.endsWith("-repor")
                        ? " produtos"
                        : metric.key.endsWith("-atrasadas")
                          ? " ordens"
                          : ""}
                    </span>
                  </span>
                  {metric.href ? (
                    <ChevronRight
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : null}
                </>
              );
              return metric.href ? (
                <Link
                  key={metric.key}
                  href={metric.href}
                  title={metric.description}
                  className={"erp-dashboard-attention-item " + tone}
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={metric.key}
                  className={"erp-dashboard-attention-item " + tone}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      {!main.length && !attentionItems.length ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Seu perfil não tem áreas disponíveis para este resumo.
        </p>
      ) : null}
      {data.charts.length ? (
        <div className="erp-dashboard-charts-grid grid lg:grid-cols-5">
          {data.charts.map((chart, index) => (
            <div
              key={chart.key}
              className={
                "min-w-0 " +
                (data.charts.length === 1
                  ? "lg:col-span-5"
                  : index === 0
                    ? "lg:col-span-3"
                    : "lg:col-span-2")
              }
            >
              <DashboardChartView chart={chart} appearance="ramp" />
            </div>
          ))}
        </div>
      ) : null}
      {upcoming || clients ? (
        <div className="erp-dashboard-tables-grid grid xl:grid-cols-2">
          {upcoming ? <OverviewTable list={upcoming} upcoming /> : null}
          {clients ? <OverviewTable list={clients} /> : null}
        </div>
      ) : null}
      {other.length ? (
        <details className="erp-dashboard-other">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Outras pendências e registros
          </summary>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            {other.map((list) => (
              <DashboardListView key={list.key} list={list} appearance="ramp" />
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

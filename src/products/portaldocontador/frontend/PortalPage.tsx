"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Building2,
  ChartNoAxesCombined,
  Wallet,
  Files,
  ListChecks,
  Download,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { OverviewDashboardView } from "@/products/erp/frontend/modules/dashboards/visao-geral/OverviewDashboardView";
import type { DashboardResponse } from "@/products/erp/shared/dashboardContracts";
import type {
  PortalCompany,
  PortalSection,
  PortalTable,
  PortalColumn,
} from "../shared/contracts";

const sections = [
  { id: "resumo", name: "Visão geral", icon: ChartNoAxesCombined },
  { id: "financeiro", name: "Financeiro", icon: Wallet },
  { id: "documentos", name: "Documentos", icon: Files },
  { id: "relatorios", name: "Relatórios", icon: ChartNoAxesCombined },
  { id: "pendencias", name: "Pendências", icon: ListChecks },
] as const;
export async function portalFetch(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { cache: "no-store", ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.error?.message ||
        body.error ||
        "Não foi possível concluir a consulta.",
    );
  }
  return response;
}
function cell(value: unknown, column: PortalColumn) {
  if (value == null) return "—";
  if (column.format === "currency")
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  if (column.format === "date") {
    const date = String(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date.split("-").reverse().join("/")
      : String(value);
  }
  if (column.format === "bytes")
    return Number(value) < 1024
      ? value + " B"
      : (Number(value) / 1024).toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        }) + " KB";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
export function PortalPage({
  companyId,
  section = "resumo",
}: {
  companyId?: number;
  section?: PortalSection;
}) {
  const router = useRouter(),
    search = useSearchParams(),
    searchKey = search.toString();
  const [companies, setCompanies] = useState<PortalCompany[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const [data, setData] = useState<{
      table?: PortalTable;
      dashboard?: DashboardResponse;
    } | null>(null),
    [downloading, setDownloading] = useState(false);
  const company = companies?.find((c) => c.id === companyId);
  const today = company
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: company.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())
    : "";
  const from = search.get("from") || today.slice(0, 7) + "-01",
    to = search.get("to") || today;
  const side = search.get("side") || "pagar",
    report = search.get("report") || "fluxo-de-caixa",
    query = search.get("query") || "";
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    portalFetch("/api/contador/empresas", { signal: abort.signal })
      .then((r) => r.json())
      .then((r) => setCompanies(r.companies))
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [revision]);
  useEffect(() => {
    if (!companyId || !company) return;
    const abort = new AbortController();
    setData(null);
    setError("");
    setBusy(true);
    portalFetch(`/api/contador/empresas/${companyId}/${section}?${searchKey}`, {
      signal: abort.signal,
    })
      .then((r) => r.json())
      .then(setData)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setBusy(false);
      });
    return () => abort.abort();
  }, [companyId, company, section, searchKey, revision]);
  function change(values: Record<string, string>) {
    const params = new URLSearchParams(searchKey);
    params.delete("page");
    Object.entries(values).forEach(([key, value]) =>
      value ? params.set(key, value) : params.delete(key),
    );
    router.replace(
      `/contador/empresas/${companyId}/${section === "resumo" ? "" : section}?${params}`,
    );
  }
  async function download(url: string, name: string) {
    setDownloading(true);
    setError("");
    try {
      const response = await portalFetch(url);
      const blob = await response.blob(),
        href = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = href;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível baixar o arquivo.",
      );
    } finally {
      setDownloading(false);
    }
  }
  const title = sections.find((s) => s.id === section)?.name || "Visão geral";
  const allowed = (id: string) =>
    id === "resumo" ||
    id === "documentos" ||
    (id === "relatorios"
      ? company?.capabilities.includes("erp.relatorios.visualizar") &&
        company.capabilities.includes("erp.financeiro.visualizar")
      : company?.capabilities.includes("erp.financeiro.visualizar"));
  return (
    <div className="contador-shell">
      <aside className="contador-sidebar">
        <Link className="contador-brand" href="/contador">
          Otto <span>Portal do Contador</span>
        </Link>
        <Link className="contador-company-back" href="/contador">
          <Building2 size={17} /> Empresas
        </Link>
        {company ? (
          <>
            <p className="contador-company-name">{company.name}</p>
            <nav aria-label="Menu do portal">
              {sections
                .filter((s) => allowed(s.id))
                .map((s) => (
                  <Link
                    key={s.id}
                    aria-current={section === s.id ? "page" : undefined}
                    href={`/contador/empresas/${company.id}/${s.id === "resumo" ? "" : s.id}?${new URLSearchParams({ from, to })}`}
                  >
                    <s.icon size={17} />
                    {s.name}
                  </Link>
                ))}
            </nav>
          </>
        ) : null}
        <div className="contador-sidebar-footer">
          <Link href="/erp">
            <ArrowLeft size={16} /> Abrir ERP
          </Link>
          <UserButton />
        </div>
      </aside>
      <main className="contador-main erp-workspace-surface">
        <header className="contador-header">
          <div>
            <p>Portal do Contador{company ? " / " + company.name : ""}</p>
            <h1>{companyId ? title : "Empresas"}</h1>
          </div>
          <div className="contador-controls">
            {company ? (
              <>
                <label>
                  Empresa
                  <select
                    aria-label="Empresa"
                    value={companyId}
                    onChange={(e) =>
                      router.push(`/contador/empresas/${e.target.value}`)
                    }
                  >
                    {companies?.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  De
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => change({ from: e.target.value })}
                  />
                </label>
                <label>
                  Até
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => change({ to: e.target.value })}
                  />
                </label>
              </>
            ) : null}
            <button disabled={busy} onClick={() => setRevision((v) => v + 1)}>
              <RefreshCw size={15} /> Atualizar
            </button>
          </div>
        </header>
        {error ? (
          <p role="alert" className="contador-error">
            {error}
          </p>
        ) : null}
        {companies === null && !error ? (
          <p className="contador-empty" role="status">
            Carregando empresas…
          </p>
        ) : null}
        {!companyId && companies ? (
          <section className="contador-companies">
            {companies.length ? (
              companies.map((c) => (
                <Link key={c.id} href={`/contador/empresas/${c.id}`}>
                  <Building2 size={24} />
                  <h2>{c.name}</h2>
                  <p>Consultar dados e documentos →</p>
                </Link>
              ))
            ) : (
              <div className="contador-empty">
                <h2>Nenhuma empresa liberada</h2>
                <p>
                  O administrador da empresa precisa habilitar seu acesso ao
                  Portal do Contador em Configurações → Membros.
                </p>
              </div>
            )}
          </section>
        ) : null}
        {companyId && companies && !company ? (
          <p className="contador-empty">
            Esta empresa não está disponível para sua conta.
          </p>
        ) : null}
        {company && section !== "resumo" ? (
          <div className="contador-toolbar">
            {section === "financeiro" ? (
              <div className="contador-tabs" aria-label="Consultas financeiras">
                {[
                  ["pagar", "Contas a pagar"],
                  ["receber", "Contas a receber"],
                  ["movimentacoes", "Movimentações"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    aria-pressed={side === id}
                    onClick={() => change({ side: id })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {section === "relatorios" ? (
              <label>
                Relatório
                <select
                  value={report}
                  onChange={(e) => change({ report: e.target.value })}
                >
                  <option value="fluxo-de-caixa">Fluxo de caixa</option>
                  <option value="dre-caixa">DRE por caixa</option>
                  <option value="dre-competencia">DRE por competência</option>
                </select>
              </label>
            ) : null}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                change({
                  query: String(
                    new FormData(e.currentTarget).get("query") || "",
                  ),
                });
              }}
            >
              <input
                key={query}
                name="query"
                defaultValue={query}
                placeholder="Pesquisar registros"
                aria-label="Pesquisar registros"
              />
              <button type="submit">Buscar</button>
            </form>
            <button
              disabled={busy || downloading || !data?.table}
              onClick={() => {
                const params = new URLSearchParams(searchKey);
                params.delete("page");
                params.set("source", section);
                void download(
                  `/api/contador/empresas/${companyId}/exportar?${params}`,
                  `contador-${section}-${companyId}-${from}-${to}.csv`,
                );
              }}
            >
              <Download size={15} /> Exportar CSV
            </button>
          </div>
        ) : null}
        {busy ? (
          <p className="contador-empty" role="status">
            Consultando dados…
          </p>
        ) : null}
        {data?.dashboard ? (
          <div data-dashboard="visao-geral">
            <div className="erp-dashboard-content">
              <div className="erp-dashboard-meta">
                <span>
                  {data.dashboard.period.from.split("-").reverse().join("/")} a{" "}
                  {data.dashboard.period.to.split("-").reverse().join("/")}
                </span>
                <span>
                  Posições atuais em{" "}
                  {data.dashboard.reference.split("-").reverse().join("/")} ·
                  Somente leitura
                </span>
              </div>
              <OverviewDashboardView data={data.dashboard} />
            </div>
          </div>
        ) : null}
        {data?.table ? (
          <>
            <div className="contador-table-scroll">
              <table>
                <thead>
                  <tr>
                    {data.table.columns.map((c) => (
                      <th scope="col" key={c.key}>
                        {c.label}
                      </th>
                    ))}
                    {section === "documentos" ? (
                      <th scope="col">Download</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {data.table.records.map((r, i) => (
                    <tr key={String(r.id || i)}>
                      {data.table!.columns.map((c) => (
                        <td
                          key={c.key}
                          className={
                            c.format === "currency"
                              ? Number(r[c.key]) < 0
                                ? "contador-negative"
                                : Number(r[c.key]) > 0
                                  ? "contador-positive"
                                  : ""
                              : ""
                          }
                        >
                          {cell(r[c.key], c)}
                        </td>
                      ))}
                      {section === "documentos" ? (
                        <td>
                          <button
                            disabled={downloading}
                            onClick={() =>
                              void download(
                                `/api/contador/empresas/${companyId}/documentos/${encodeURIComponent(String(r.id))}`,
                                String(r.nome || "documento"),
                              )
                            }
                          >
                            <Download size={15} /> Baixar
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.table.records.length ? (
                <p className="contador-empty">
                  Nenhum registro encontrado para os filtros selecionados.
                </p>
              ) : null}
            </div>
            <footer className="contador-pagination">
              <p>
                {data.table.total.toLocaleString("pt-BR")} registros · Página{" "}
                {data.table.page}
              </p>
              <div>
                <button
                  disabled={data.table.page <= 1 || busy}
                  onClick={() => change({ page: String(data.table!.page - 1) })}
                >
                  Anterior
                </button>
                <button
                  disabled={
                    data.table.page * data.table.pageSize >= data.table.total ||
                    busy
                  }
                  onClick={() => change({ page: String(data.table!.page + 1) })}
                >
                  Próxima
                </button>
              </div>
            </footer>
            <p className="contador-note">{data.table.note}</p>
          </>
        ) : null}
      </main>
    </div>
  );
}

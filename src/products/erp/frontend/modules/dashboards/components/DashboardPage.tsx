"use client";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DASHBOARDS,
  dashboardFilterSchema,
  dashboardToday,
  type DashboardId,
  type DashboardResponse,
} from "@/products/erp/shared/dashboardContracts";
import { parseErpResponse } from "@/products/erp/frontend/services/erpProfessionalClient";
import {
  DashboardChartView,
  DashboardListView,
  DashboardMetrics,
  dashboardDate,
} from "./DashboardViews";
import { OverviewDashboardView } from "../visao-geral/OverviewDashboardView";
export function DashboardPage({ id }: { id: DashboardId }) {
  const search = useSearchParams(),
    { orgId, userId } = useAuth();
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <DashboardPageContent
      key={[id, search.toString(), orgId, userId].join("|")}
      id={id}
      filtersOpen={filtersOpen}
      setFiltersOpen={setFiltersOpen}
    />
  );
}
function DashboardPageContent({
  id,
  filtersOpen,
  setFiltersOpen,
}: {
  id: DashboardId;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
}) {
  const search = useSearchParams(),
    router = useRouter(),
    pathname = usePathname(),
    today = dashboardToday();
  const from = search.get("from") || today.slice(0, 7) + "-01",
    to = search.get("to") || today,
    compare = search.get("compare") !== "false",
    includeForecast = search.get("includeForecast") === "true";
  const [draftFrom, setDraftFrom] = useState(from),
    [draftTo, setDraftTo] = useState(to),
    [data, setData] = useState<DashboardResponse | null>(null),
    [error, setError] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const response = await fetch(
          "/api/erp/dashboards/" +
            id +
            "?" +
            new URLSearchParams({
              from,
              to,
              compare: String(compare),
              includeForecast: String(includeForecast),
            }),
          { cache: "no-store", signal },
        );
        const result = await parseErpResponse<DashboardResponse>(response);
        if (!signal.aborted) setData(result);
      } catch (e) {
        if (!signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar o dashboard.",
          );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [id, from, to, compare, includeForecast],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, revision]);
  const apply = (
    nextFrom: string,
    nextTo: string,
    comparison = compare,
    forecast = includeForecast,
  ) => {
    const result = dashboardFilterSchema.safeParse({
      from: nextFrom,
      to: nextTo,
      compare: comparison,
      includeForecast: forecast,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setDraftFrom(nextFrom);
    setDraftTo(nextTo);
    router.replace(
      pathname +
        "?" +
        new URLSearchParams({
          from: nextFrom,
          to: nextTo,
          compare: String(comparison),
          includeForecast: String(forecast),
        }),
      { scroll: false },
    );
  };
  const lastMonth = (() => {
    const d = new Date(today + "T12:00:00Z");
    return {
      from: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1, 12))
        .toISOString()
        .slice(0, 10),
      to: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0, 12))
        .toISOString()
        .slice(0, 10),
    };
  })();
  const previousMonth = () => apply(lastMonth.from, lastMonth.to);
  const preset =
    from === today.slice(0, 7) + "-01" && to === today
      ? "current"
      : from === lastMonth.from && to === lastMonth.to
        ? "previous"
        : "custom";
  const monthLabel = (date: string) => {
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "America/Fortaleza",
    }).format(new Date(date + "T12:00:00Z"));
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
  const isOverview = id === "visao-geral";
  const control = isOverview
    ? "erp-dashboard-control"
    : "h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-2 focus:outline-blue-600";
  const dashboardSelector = (
    <select
      aria-label="Dashboard"
      value={id}
      disabled={!data}
      className={control + " max-w-full flex-1 sm:w-44 sm:flex-none"}
      onChange={(e) =>
        router.push(
          "/erp/dashboards/" +
            e.target.value +
            "?" +
            new URLSearchParams({
              from,
              to,
              compare: String(compare),
              includeForecast: String(includeForecast),
            }),
        )
      }
    >
      {(data?.availableDashboards || [id]).map((d) => (
        <option key={d} value={d}>
          {DASHBOARDS[d].title}
        </option>
      ))}
    </select>
  );
  const periodSelector = (
    <select
      aria-label="Período"
      value={preset}
      className={control + " max-w-full flex-1 sm:w-52 sm:flex-none"}
      onChange={(e) => {
        if (e.target.value === "current")
          apply(today.slice(0, 7) + "-01", today);
        else if (e.target.value === "previous") previousMonth();
        else setFiltersOpen(true);
      }}
    >
      <option value="current">{monthLabel(today)} · até hoje</option>
      <option value="previous">{monthLabel(lastMonth.from)}</option>
      <option value="custom">
        {preset === "custom"
          ? dashboardDate(from) + " – " + dashboardDate(to)
          : "Período personalizado"}
      </option>
    </select>
  );
  const refreshAction = (
    <Button
      variant="outline"
      className={
        isOverview
          ? "erp-dashboard-refresh"
          : "h-10 border-slate-200 bg-white text-blue-700"
      }
      disabled={loading}
      onClick={() => setRevision((r) => r + 1)}
    >
      {loading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 size-4" />
      )}
      Atualizar
    </Button>
  );
  const filterAction = (
    <Button
      variant="outline"
      className={
        isOverview
          ? "erp-dashboard-filter-button"
          : "h-8 border-slate-200 bg-white text-xs"
      }
      aria-expanded={filtersOpen}
      aria-controls="dashboard-filters"
      onClick={() => setFiltersOpen(!filtersOpen)}
    >
      <SlidersHorizontal className="size-3.5" />
      Filtros
    </Button>
  );
  return (
    <div
      className={
        isOverview
          ? "erp-dashboard-overview"
          : "mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-5 bg-white p-4 text-slate-900 md:p-7"
      }
      data-dashboard={id}
    >
      <div
        className={
          isOverview
            ? "erp-dashboard-header"
            : "flex flex-wrap items-start justify-between gap-4"
        }
      >
        <div>
          {isOverview ? (
            <p className="erp-workspace-eyebrow">Dashboards</p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {DASHBOARDS[id].title}
          </h1>
          {!isOverview ? (
            <p className="mt-1.5 text-sm text-slate-500">
              {DASHBOARDS[id].description}
            </p>
          ) : null}
        </div>
        <div
          className={
            isOverview
              ? "erp-dashboard-header-controls"
              : "flex flex-wrap items-center gap-2"
          }
        >
          {isOverview ? (
            <>
              <label className="erp-dashboard-dashboard-picker">
                <span>Visualização</span>
                {dashboardSelector}
              </label>
              <label className="erp-dashboard-period-picker">
                <span>Período</span>
                {periodSelector}
              </label>
            </>
          ) : (
            <>
              {dashboardSelector}
              {periodSelector}
            </>
          )}
          {refreshAction}
          {isOverview ? filterAction : null}
        </div>
      </div>
      {!isOverview ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Período: {dashboardDate(from)} a {dashboardDate(to)}
            {includeForecast && ["financeiro", "visao-geral"].includes(id) ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                Inclui previsões
              </span>
            ) : null}
          </p>
          {filterAction}
        </div>
      ) : null}
      <div className={isOverview ? "erp-dashboard-content" : "contents"}>
        {filtersOpen ? (
          <form
            id="dashboard-filters"
            onSubmit={(e) => {
              e.preventDefault();
              apply(draftFrom, draftTo);
            }}
            className={
              isOverview
                ? "erp-dashboard-filter-panel"
                : "flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            }
          >
            <CalendarDays
              className="mb-2 size-5 text-slate-400"
              aria-hidden="true"
            />
            <label className="text-xs font-medium text-slate-600">
              De
              <Input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="mt-1 w-[155px] bg-white"
                required
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Até
              <Input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="mt-1 w-[155px] bg-white"
                required
              />
            </label>
            <Button type="submit">Aplicar período</Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => apply(today.slice(0, 7) + "-01", today)}
              >
                Mês atual
              </Button>
              <Button type="button" variant="outline" onClick={previousMonth}>
                Mês anterior
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 pb-2 text-xs text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={compare}
                  onChange={(e) => apply(from, to, e.target.checked)}
                />
                Comparar período anterior
              </label>
              {["financeiro", "visao-geral"].includes(id) ? (
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeForecast}
                    onChange={(e) => apply(from, to, compare, e.target.checked)}
                  />
                  Incluir previsões financeiras
                </label>
              ) : null}
            </div>
          </form>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {error}
            <button
              type="button"
              className="ml-3 underline"
              onClick={() => setRevision((r) => r + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : null}
        {loading ? (
          <div
            role="status"
            aria-label="Carregando dashboard"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-40 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
            <span className="sr-only">Carregando indicadores…</span>
          </div>
        ) : null}
        {!loading && data ? (
          <>
            <div
              className={
                isOverview
                  ? "erp-dashboard-meta"
                  : "flex flex-wrap justify-between gap-2 text-xs text-slate-500"
              }
            >
              <span>
                {isOverview ? "Período: " : ""}
                {dashboardDate(data.period.from)} a{" "}
                {dashboardDate(data.period.to)}
                {isOverview && includeForecast ? (
                  <span className="erp-dashboard-forecast-note">
                    Inclui previsões
                  </span>
                ) : null}
                {!isOverview && data.previousPeriod
                  ? " · Comparação: " +
                    dashboardDate(data.previousPeriod.from) +
                    " a " +
                    dashboardDate(data.previousPeriod.to)
                  : ""}
              </span>
              <span>
                Posição: {dashboardDate(data.reference)} · Atualizado às{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  timeZone: data.timezone,
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(data.generatedAt))}
              </span>
            </div>
            {id === "visao-geral" ? (
              <OverviewDashboardView data={data} />
            ) : (
              <>
                {data.metrics.length ? (
                  <DashboardMetrics metrics={data.metrics} />
                ) : (
                  <p className="rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
                    Seu perfil não tem áreas disponíveis para este resumo.
                  </p>
                )}
                <div className="grid gap-5 lg:grid-cols-2">
                  {data.charts.map((chart) => (
                    <DashboardChartView key={chart.key} chart={chart} />
                  ))}
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  {data.lists.map((list) => (
                    <DashboardListView key={list.key} list={list} />
                  ))}
                </div>
              </>
            )}
            {data.notes.length ? (
              <details className="text-xs leading-6 text-slate-500">
                <summary className="cursor-pointer">
                  Como interpretar os indicadores
                </summary>
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
                  {data.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              </details>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

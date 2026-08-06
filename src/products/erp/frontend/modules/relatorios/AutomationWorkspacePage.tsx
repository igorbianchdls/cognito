"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Play, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatErpValue,
  parseErpResponse,
} from "@/products/erp/frontend/services/erpProfessionalClient";

type AutomationType =
  | "contratos"
  | "recorrencias_financeiras"
  | "titulos_vencidos"
  | "indicadores"
  | "estoque_minimo";
const routines: Array<{
  id: AutomationType;
  label: string;
  description: string;
}> = [
  {
    id: "contratos",
    label: "Contratos",
    description: "Gera vendas recorrentes vencidas.",
  },
  {
    id: "recorrencias_financeiras",
    label: "Recorrencias financeiras",
    description: "Gera contas recorrentes da competencia.",
  },
  {
    id: "titulos_vencidos",
    label: "Titulos vencidos",
    description: "Atualiza a situacao de parcelas atrasadas.",
  },
  {
    id: "indicadores",
    label: "Indicadores",
    description: "Atualiza os indicadores operacionais.",
  },
  {
    id: "estoque_minimo",
    label: "Estoque minimo",
    description: "Verifica produtos que precisam de reposicao.",
  },
];

export function AutomationWorkspacePage() {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(
        (
          await parseErpResponse<{ records: Record<string, unknown>[] }>(
            await fetch("/api/erp/automacoes", { cache: "no-store" }),
          )
        ).records,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar as execucoes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function run(tipo: AutomationType) {
    setRunning(tipo);
    setError(null);
    try {
      await parseErpResponse(
        await fetch("/api/erp/automacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo }),
        }),
      );
      await load();
    } catch (runError) {
      setError(
        runError instanceof Error
          ? runError.message
          : "Nao foi possivel executar a rotina.",
      );
    } finally {
      setRunning(null);
    }
  }
  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">ERP / Operacao</p>
          <h1 className="mt-1 text-2xl font-semibold">Rotinas automaticas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comandos internos idempotentes. O Postgres continua sendo a fonte da
            verdade.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          title="Atualizar"
          onClick={() => void load()}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <section className="grid gap-px overflow-hidden rounded-md border bg-gray-200 md:grid-cols-2 xl:grid-cols-3">
        {routines.map((routine) => (
          <div
            key={routine.id}
            className="flex items-center gap-3 bg-white p-4"
          >
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">{routine.label}</h2>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {routine.description}
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              title={`Executar ${routine.label}`}
              disabled={Boolean(running)}
              onClick={() => void run(routine.id)}
            >
              {running === routine.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
            </Button>
          </div>
        ))}
      </section>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Rotina</TableHead>
              <TableHead>Competencia</TableHead>
              <TableHead>Situacao</TableHead>
              <TableHead>Tentativas</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : records.length ? (
              records.map((record) => (
                <TableRow key={String(record.id)}>
                  <TableCell>{formatErpValue(record.tipo)}</TableCell>
                  <TableCell>{formatErpValue(record.competencia)}</TableCell>
                  <TableCell>{formatErpValue(record.status)}</TableCell>
                  <TableCell>{formatErpValue(record.tentativas)}</TableCell>
                  <TableCell>{formatErpValue(record.iniciado_em)}</TableCell>
                  <TableCell>{formatErpValue(record.finalizado_em)}</TableCell>
                  <TableCell className="max-w-64 truncate">
                    {formatErpValue(record.erro)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-28 text-center text-gray-500"
                >
                  Nenhuma execucao registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { LockKeyhole, Loader2, UnlockKeyhole } from "lucide-react";

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
import {
  formatErpValue,
  parseErpResponse,
} from "@/products/erp/frontend/services/erpProfessionalClient";

type Closure = {
  id: string;
  modulo: string;
  periodo_inicio: string;
  periodo_fim: string;
  motivo?: string;
  fechado_em: string;
  reaberto_em?: string;
};
const today = () => new Date().toISOString().slice(0, 10);
const firstDay = () => `${today().slice(0, 7)}-01`;

export function PeriodClosuresPage() {
  const canManage = useErpAccess().can("erp.configuracoes.gerenciar");
  const [records, setRecords] = useState<Closure[]>([]);
  const [open, setOpen] = useState(false);
  const [module, setModule] = useState("financeiro");
  const [from, setFrom] = useState(firstDay());
  const [to, setTo] = useState(today());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(
        (
          await parseErpResponse<{ records: Closure[] }>(
            await fetch("/api/erp/fechamentos", { cache: "no-store" }),
          )
        ).records,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar os fechamentos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function closePeriod() {
    setSaving(true);
    setError(null);
    try {
      await parseErpResponse(
        await fetch("/api/erp/fechamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modulo: module,
            periodo_inicio: from,
            periodo_fim: to,
            motivo: reason || null,
          }),
        }),
      );
      setOpen(false);
      await load();
    } catch (closeError) {
      setError(
        closeError instanceof Error
          ? closeError.message
          : "Nao foi possivel fechar o periodo.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function reopen(id: string) {
    setSaving(true);
    setError(null);
    try {
      await parseErpResponse(
        await fetch("/api/erp/fechamentos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }),
      );
      await load();
    } catch (reopenError) {
      setError(
        reopenError instanceof Error
          ? reopenError.message
          : "Nao foi possivel reabrir o periodo.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">ERP / Financeiro</p>
          <h1 className="mt-1 text-2xl font-semibold">
            Fechamentos de periodo
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Bloqueie alteracoes retroativas em vendas, compras, financeiro e
            estoque.
          </p>
        </div>
        <Button disabled={!canManage} onClick={() => setOpen(true)}>
          <LockKeyhole className="size-4" />
          Fechar periodo
        </Button>
      </div>
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Modulo</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Situacao</TableHead>
              <TableHead>Fechado em</TableHead>
              <TableHead className="w-28" />
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
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.modulo}</TableCell>
                  <TableCell>{formatErpValue(record.periodo_inicio)}</TableCell>
                  <TableCell>{formatErpValue(record.periodo_fim)}</TableCell>
                  <TableCell>{record.motivo || "-"}</TableCell>
                  <TableCell>
                    {record.reaberto_em ? "Reaberto" : "Fechado"}
                  </TableCell>
                  <TableCell>{formatErpValue(record.fechado_em)}</TableCell>
                  <TableCell>
                    {!record.reaberto_em && canManage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving}
                        onClick={() => void reopen(record.id)}
                      >
                        <UnlockKeyhole className="size-4" />
                        Reabrir
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-28 text-center text-gray-500"
                >
                  Nenhum periodo fechado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar periodo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-2">
              <Label>Modulo</Label>
              <select
                className="h-10 rounded-md bg-gray-50 px-3 text-sm"
                value={module}
                onChange={(event) => setModule(event.target.value)}
              >
                <option value="financeiro">Financeiro</option>
                <option value="vendas">Vendas</option>
                <option value="compras">Compras</option>
                <option value="estoque">Estoque</option>
                <option value="todos">Todos</option>
              </select>
            </label>
            <label className="grid gap-2">
              <Label>Inicio</Label>
              <Input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <Label>Fim</Label>
              <Input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <Label>Motivo</Label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={saving} onClick={() => void closePeriod()}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              Confirmar fechamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

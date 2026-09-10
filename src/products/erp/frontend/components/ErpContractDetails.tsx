"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseErpResponse } from "@/products/erp/frontend/services/erpProfessionalClient";
import { useErpAccess } from "@/products/erp/frontend/hooks/useErpAccess";
type Item = {
  id: string | number;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
};
type Detail = {
  record: { numero: string; versao: number; proxima_geracao_em: string };
  versions: Array<{
    numero: number;
    vigencia_inicio: string;
    vigencia_fim: string | null;
    motivo: string;
    itens: Item[];
  }>;
  cycles: Array<{
    id: string;
    periodo_inicio: string;
    periodo_fim: string;
    status: string;
    venda_id: string;
  }>;
};
export function ErpContractDetails({
  id,
  onClose,
  onSaved,
}: {
  id: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const access = useErpAccess(),
    [detail, setDetail] = useState<Detail | null>(null),
    [items, setItems] = useState<Item[]>([]),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    void fetch(`/api/erp/contratos/${id}`)
      .then((r) => parseErpResponse<Detail>(r))
      .then((d) => {
        if (active) {
          setDetail(d);
          setItems(d.versions[0]?.itens || []);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function save() {
    if (!detail || saving || !access.can("erp.vendas.gerenciar")) return;
    setSaving(true);
    setError("");
    try {
      await parseErpResponse(
        await fetch(`/api/erp/contratos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expectedVersion: detail.record.versao,
            inicio: detail.record.proxima_geracao_em.slice(0, 10),
            motivo: reason,
            itens: items.map((i) => ({
              id: String(i.id),
              quantidade: i.quantidade,
              valor_unitario: i.valor_unitario,
            })),
          }),
        }),
      );
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contrato {detail?.record.numero}</DialogTitle>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {!detail ? (
          <p>Carregando contrato…</p>
        ) : (
          <>
            <h3 className="font-semibold">Versões comerciais</h3>
            {detail.versions.map((v) => (
              <div key={v.numero} className="rounded border p-3 text-sm">
                <p>
                  Versão {v.numero}: {v.vigencia_inicio.slice(0, 10)} até{" "}
                  {v.vigencia_fim?.slice(0, 10) || "sem término"}
                </p>
                <p>{v.motivo}</p>
                {v.itens.map((i) => (
                  <p key={i.id}>
                    {i.descricao}: {i.quantidade} ×{" "}
                    {Number(i.valor_unitario).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                ))}
              </div>
            ))}
            <h3 className="font-semibold">Ciclos gerados</h3>
            {detail.cycles.length ? (
              detail.cycles.map((c) => (
                <p key={c.id} className="text-sm">
                  {c.periodo_inicio?.slice(0, 10)} a{" "}
                  {c.periodo_fim?.slice(0, 10)} — {c.status} — venda{" "}
                  {c.venda_id || "não gerada"}
                </p>
              ))
            ) : (
              <p className="text-sm">Nenhum ciclo gerado.</p>
            )}
            {access.can("erp.vendas.gerenciar") && (
              <fieldset disabled={saving} className="grid gap-3 border-t pt-4">
                <legend className="font-semibold">
                  Novas condições na próxima geração
                </legend>
                <p className="text-sm">
                  Vigência a partir de{" "}
                  {detail.record.proxima_geracao_em?.slice(0, 10)}. Os ciclos
                  anteriores são preservados.
                </p>
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-2 gap-2">
                    <p className="col-span-2 text-sm">{item.descricao}</p>
                    <label className="text-sm">
                      Quantidade
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={item.quantidade}
                        onChange={(e) =>
                          setItems((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? { ...r, quantidade: Number(e.target.value) }
                                : r,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="text-sm">
                      Preço unitário
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.valor_unitario}
                        onChange={(e) =>
                          setItems((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    valor_unitario: Number(e.target.value),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                ))}
                <label className="text-sm">
                  Motivo
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <Button
                  disabled={saving || !reason.trim()}
                  onClick={() => void save()}
                >
                  Salvar nova versão
                </Button>
              </fieldset>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

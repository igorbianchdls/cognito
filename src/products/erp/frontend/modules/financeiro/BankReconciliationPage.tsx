"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Settings2, X } from "lucide-react";

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
import { ErpOperationsWorkspacePage } from "@/products/erp/frontend/components/ErpOperationsWorkspacePage";
import {
  formatErpCurrency,
  formatErpValue,
  parseErpResponse,
} from "@/products/erp/frontend/services/erpProfessionalClient";
import { ERP_OPERATION_CONFIGS } from "@/products/erp/shared/operations";

type Suggestion = {
  transacao_id: string;
  pagamento_id: string;
  data: string;
  descricao: string;
  valor: number;
  diferenca_valor: number;
  diferenca_dias: number;
  tipo: string;
  segura: boolean;
};
type Completed = {
  transacao_bancaria_id: string;
  pagamento_id: string;
  origem_conciliacao: string;
  valor_conciliado: number;
  conciliado_em: string;
  data: string;
  descricao: string;
};

export function BankReconciliationPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [completed, setCompleted] = useState<Completed[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [days, setDays] = useState("5");
  const [amount, setAmount] = useState("0");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [suggestionBody, ruleBody, completedBody] = await Promise.all([
        fetch("/api/erp/conciliacao/sugestoes", { cache: "no-store" }).then(
          (response) => parseErpResponse<{ records: Suggestion[] }>(response),
        ),
        fetch("/api/erp/conciliacao/regras", { cache: "no-store" }).then(
          (response) =>
            parseErpResponse<{ records: Record<string, unknown>[] }>(response),
        ),
        fetch("/api/erp/conciliacao/concluidas", { cache: "no-store" }).then(
          (response) => parseErpResponse<{ records: Completed[] }>(response),
        ),
      ]);
      setSuggestions(suggestionBody.records);
      setCompleted(completedBody.records);
      const globalRule =
        ruleBody.records.find((record) => !record.conta_financeira_id) ||
        ruleBody.records[0];
      if (globalRule) {
        setDays(String(globalRule.tolerancia_dias || 5));
        setAmount(String(globalRule.tolerancia_valor || 0));
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar as sugestoes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function reconcile(suggestion: Suggestion) {
    setBusy(suggestion.transacao_id);
    setError(null);
    try {
      await parseErpResponse(
        await fetch("/api/erp/operacoes/conciliar-transacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            values: {
              transacao_bancaria_id: suggestion.transacao_id,
              pagamento_id: suggestion.pagamento_id,
              origem_conciliacao: "sugerida",
            },
          }),
        }),
      );
      await load();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel conciliar.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function undo(transactionId: string) {
    setBusy(transactionId);
    setError(null);
    try {
      await parseErpResponse(
        await fetch(
          `/api/erp/conciliacao/transacoes/${transactionId}/desfazer`,
          { method: "POST" },
        ),
      );
      await load();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel desfazer a conciliacao.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function ignore(transactionId: string) {
    setBusy(transactionId);
    setError(null);
    try {
      await parseErpResponse(
        await fetch(
          `/api/erp/conciliacao/transacoes/${transactionId}/ignorar`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ignored: true }),
          },
        ),
      );
      await load();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel ignorar a transacao.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function saveRule() {
    setBusy("rule");
    setError(null);
    try {
      await parseErpResponse(
        await fetch("/api/erp/conciliacao/regras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: "Regra geral",
            conta_financeira_id: null,
            correspondencia_exata: true,
            correspondencia_aproximada: true,
            tolerancia_dias: days,
            tolerancia_valor: amount,
          }),
        }),
      );
      setSettingsOpen(false);
      await load();
    } catch (ruleError) {
      setError(
        ruleError instanceof Error
          ? ruleError.message
          : "Nao foi possivel salvar a regra.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-7">
      <ErpOperationsWorkspacePage
        config={ERP_OPERATION_CONFIGS["conciliacao-bancaria"]}
      />
      <section className="border-t pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Sugestoes de correspondencia
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Correspondencias exatas podem ser confirmadas; casos aproximados
              permanecem para revisao.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="size-4" />
            Regras
          </Button>
        </div>
        {error ? (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Data</TableHead>
                <TableHead>Extrato</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Correspondencia</TableHead>
                <TableHead>Diferenca</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : suggestions.length ? (
                suggestions.map((suggestion) => (
                  <TableRow key={suggestion.transacao_id}>
                    <TableCell>{formatErpValue(suggestion.data)}</TableCell>
                    <TableCell>{suggestion.descricao}</TableCell>
                    <TableCell className="text-right">
                      {formatErpCurrency(suggestion.valor)}
                    </TableCell>
                    <TableCell>{suggestion.tipo}</TableCell>
                    <TableCell>
                      {formatErpCurrency(suggestion.diferenca_valor)} /{" "}
                      {suggestion.diferenca_dias} dia(s)
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {suggestion.segura &&
                        Number(suggestion.diferenca_valor) <= 0.01 ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Conciliar"
                            disabled={busy === suggestion.transacao_id}
                            onClick={() => void reconcile(suggestion)}
                          >
                            <Check className="size-4" />
                          </Button>
                        ) : null}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Ignorar"
                          disabled={busy === suggestion.transacao_id}
                          onClick={() => void ignore(suggestion.transacao_id)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-28 text-center text-gray-500"
                  >
                    Nenhuma sugestao pendente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      <section className="border-t pt-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Conciliacoes recentes</h2>
          <p className="mt-1 text-sm text-gray-600">
            Historico ativo com possibilidade de desfazer sem apagar o registro
            original.
          </p>
        </div>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Data</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Conciliada em</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {completed.length ? (
                completed.map((item) => (
                  <TableRow key={item.transacao_bancaria_id}>
                    <TableCell>{formatErpValue(item.data)}</TableCell>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell>{item.origem_conciliacao}</TableCell>
                    <TableCell className="text-right">
                      {formatErpCurrency(item.valor_conciliado)}
                    </TableCell>
                    <TableCell>{formatErpValue(item.conciliado_em)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === item.transacao_bancaria_id}
                        onClick={() => void undo(item.transacao_bancaria_id)}
                      >
                        Desfazer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-gray-500"
                  >
                    Nenhuma conciliacao ativa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regra geral de conciliacao</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <Label>Tolerancia em dias</Label>
              <Input
                type="number"
                min="0"
                max="30"
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <Label>Tolerancia de valor</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={busy === "rule"} onClick={() => void saveRule()}>
              {busy === "rule" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Salvar regra
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

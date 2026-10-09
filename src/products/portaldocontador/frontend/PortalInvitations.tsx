"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { portalFetch } from "./portalHttp";
import type { PortalInvitation } from "../shared/contracts";
import "./portal.css";

const labels: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  revoked: "Revogado",
  expired: "Expirado",
};
export function PortalInvitations({ companyId }: { companyId: number }) {
  return <CompanyInvitations key={companyId} companyId={companyId} />;
}
function CompanyInvitations({ companyId }: { companyId: number }) {
  const [rows, setRows] = useState<PortalInvitation[]>([]),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    const abort = new AbortController();
    portalFetch(`/api/contador/convites?companyId=${companyId}`, {
      signal: abort.signal,
    })
      .then((r) => r.json())
      .then((r) => {
        if (abort.signal.aborted) return;
        setRows(r.invitations);
        setLoaded(true);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => {
      active.current = false;
      abort.abort();
    };
  }, [companyId]);
  async function update(method: string, body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await portalFetch("/api/contador/convites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, companyId }),
      });
      const result = await response.json();
      if (!active.current) return;
      setRows(result.invitations);
      setEmail("");
    } catch (e) {
      if (!active.current) return;
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível atualizar os convites.",
      );
    } finally {
      if (active.current) setBusy(false);
    }
  }
  return (
    <section className="contador-invitations">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-medium">Portal do Contador</h3>
        <Link className="text-sm underline" href="/contador">
          Abrir portal
        </Link>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Convide um contador para consultar esta empresa. Novos membros recebem o
        perfil Contador, sem permissão para alterar dados do ERP.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void update("POST", { email });
        }}
      >
        <input
          aria-label="E-mail do contador"
          className="rounded-sm border border-slate-200 p-2 text-sm"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contador@escritorio.com.br"
        />
        <button
          className="rounded-sm border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
          disabled={busy}
          type="submit"
        >
          {busy ? "Aguarde…" : "Enviar convite"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {loaded && !rows.length ? (
        <p className="text-sm text-slate-500">
          Nenhum convite enviado pelo portal.
        </p>
      ) : null}
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <div>
              {row.email}
              <small>
                {labels[row.status] || row.status}
                {row.syncPending ? " · Sincronização pendente" : ""}
                {row.expiresAt
                  ? " · Expira em " +
                    new Date(row.expiresAt).toLocaleDateString("pt-BR")
                  : ""}
              </small>
            </div>
            {row.status === "pending" ? (
              <button
                className="text-sm underline disabled:opacity-50"
                disabled={busy}
                onClick={() => void update("DELETE", { invitationId: row.id })}
              >
                Revogar convite
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

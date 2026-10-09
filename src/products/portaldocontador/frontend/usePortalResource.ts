"use client";
import { useEffect, useState } from "react";
import { portalFetch } from "./portalHttp";

/** Uma resposta só pode aparecer na empresa, nos filtros e na revisão que a solicitaram. */
export function usePortalResource<T>(url: string | null, revision = 0) {
  const key = JSON.stringify([url, revision]);
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (!url) return;
    const abort = new AbortController();
    portalFetch(url, { signal: abort.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!abort.signal.aborted) setResult({ key, data, error: "" });
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setResult({
            key,
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Não foi possível carregar os dados.",
          });
      });
    return () => abort.abort();
  }, [url, key]);
  const current = url && result?.key === key ? result : null;
  return {
    key,
    data: current?.data ?? null,
    error: current?.error ?? "",
    loading: Boolean(url && !current),
  };
}

"use client";

import React from "react";
import { useStore } from "@nanostores/react";
import { $previewJsonrPath, sandboxActions } from "@/chat/sandbox";
import { DataProvider } from "@/products/bi/json-render/context";
import { Renderer } from "@/products/bi/json-render/renderer";
import { registry } from "@/products/bi/json-render/registry";

type Props = { chatId?: string };

type PreviewRenderBoundaryProps = {
  resetKey: string;
  onError: (error: unknown) => void;
  children: React.ReactNode;
};

type PreviewRenderBoundaryState = {
  hasError: boolean;
};

class PreviewRenderBoundary extends React.Component<PreviewRenderBoundaryProps, PreviewRenderBoundaryState> {
  constructor(props: PreviewRenderBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PreviewRenderBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  componentDidUpdate(prevProps: PreviewRenderBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

type ComponentBoundaryState = {
  hasError: boolean;
  message: string | null;
};

class ComponentBoundary extends React.Component<{ children: React.ReactNode }, ComponentBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: unknown): ComponentBoundaryState {
    const message = error instanceof Error ? error.message : "Erro inesperado no preview";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    try {
      console.error("[JsonRenderPreview] uncaught error", error);
    } catch {
      // noop
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full min-h-0 overflow-auto p-2 bg-gray-50">
          <div className="rounded border border-red-300 bg-red-50 text-red-700 text-xs p-3">
            {this.state.message || "Erro inesperado no preview"}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function isValidJsonrPath(path: string | null | undefined): path is string {
  if (!path) return false;
  const p = String(path).trim();
  return p.startsWith("/vercel/sandbox/") && p.endsWith(".jsonr");
}

function JsonRenderPreviewInner({ chatId }: Props) {
  const jsonrPath = useStore($previewJsonrPath);
  const [error, setError] = React.useState<string | null>(null);
  const [tree, setTree] = React.useState<any | any[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [refreshTick, setRefreshTick] = React.useState(0);
  const [pathsError, setPathsError] = React.useState<string | null>(null);
  const hydratedPreviewPathForChatRef = React.useRef<string | null>(null);

  const refreshPaths = React.useCallback(async (): Promise<string[]> => {
    if (!chatId) {
      setPathsError(null);
      return [];
    }
    try {
      const collected: string[] = [];
      const dirs = ["/vercel/sandbox/dashboard", "/vercel/sandbox"];
      let firstErr: string | null = null;

      for (const dir of dirs) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fs-list", chatId, path: dir }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          entries?: Array<{ path: string; type: "file" | "dir" }>;
          error?: string;
        };
        if (!res.ok || data.ok === false) {
          if (!firstErr) firstErr = data.error || `Falha ao listar ${dir}`;
          continue;
        }
        for (const e of data.entries || []) {
          if (e.type === "file" && e.path.endsWith(".jsonr")) {
            collected.push(e.path);
          }
        }
      }

      const unique = Array.from(new Set(collected)).sort();
      setPathsError(unique.length === 0 ? firstErr : null);
      return unique;
    } catch (e: any) {
      setPathsError(e?.message ? String(e.message) : "Falha ao buscar arquivos .jsonr");
      return [];
    }
  }, [chatId]);

  // Hydrate once per chat to avoid overriding user selection with stale storage.
  React.useEffect(() => {
    if (typeof window === "undefined" || !chatId) return;
    if (hydratedPreviewPathForChatRef.current === chatId) return;
    try {
      const saved = window.localStorage.getItem(`previewJsonrPath:${chatId}`);
      hydratedPreviewPathForChatRef.current = chatId;
      if (saved && isValidJsonrPath(saved) && saved !== jsonrPath) {
        sandboxActions.setPreviewPath(saved);
      }
    } catch {
      // ignore storage access errors
    }
  }, [chatId, jsonrPath]);

  React.useEffect(() => {
    if (!chatId) hydratedPreviewPathForChatRef.current = null;
  }, [chatId]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !chatId || !jsonrPath) return;
    try {
      window.localStorage.setItem(`previewJsonrPath:${chatId}`, jsonrPath);
    } catch {
      // ignore storage access errors
    }
  }, [chatId, jsonrPath]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setTree(null);

      if (!chatId) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (!jsonrPath) {
        if (!cancelled) {
          setError("Caminho do .jsonr não configurado.");
          setLoading(false);
        }
        return;
      }
      if (!isValidJsonrPath(jsonrPath)) {
        if (!cancelled) {
          setError("Caminho inválido do .jsonr.");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fs-read", chatId, path: jsonrPath }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          content?: string;
          isBinary?: boolean;
          error?: string;
        };

        if (!res.ok || data.ok === false) {
          const found = await refreshPaths();
          const candidate = found[0];
          if (!cancelled && candidate && candidate !== jsonrPath) {
            sandboxActions.setPreviewPath(candidate);
            setLoading(false);
            return;
          }
          if (!cancelled) {
            setError(data.error || `Falha ao ler arquivo ${jsonrPath}`);
            setLoading(false);
          }
          return;
        }

        if (data.isBinary) {
          if (!cancelled) {
            setError("Arquivo .jsonr binário inválido.");
            setLoading(false);
          }
          return;
        }

        const txt = String(data.content ?? "");
        try {
          const parsed = JSON.parse(txt);
          if (parsed == null || typeof parsed !== "object") {
            if (!cancelled) {
              setError("JSONR inválido: esperado objeto/array não nulo.");
              setTree(null);
            }
          } else if (!cancelled) {
            setTree(parsed);
          }
        } catch (e: any) {
          if (!cancelled) setError(e?.message ? String(e.message) : "JSON inválido");
        }
      } catch (e: any) {
        const found = await refreshPaths();
        const candidate = found[0];
        if (!cancelled && candidate && candidate !== jsonrPath) {
          sandboxActions.setPreviewPath(candidate);
          setLoading(false);
          return;
        }
        if (!cancelled) setError(e?.message ? String(e.message) : "Erro ao buscar .jsonr");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, jsonrPath, refreshTick, refreshPaths]);

  React.useEffect(() => {
    void refreshPaths();
  }, [refreshPaths]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onRefresh = () => setRefreshTick((v) => v + 1);
    window.addEventListener("sandbox-preview-refresh", onRefresh);
    return () => window.removeEventListener("sandbox-preview-refresh", onRefresh);
  }, []);

  React.useEffect(() => {
    if (!error) return;
    sandboxActions.pushArtifactNotification({ source: "preview", message: error });
  }, [error]);

  React.useEffect(() => {
    if (!pathsError) return;
    sandboxActions.pushArtifactNotification({ source: "paths", message: pathsError });
  }, [pathsError]);

  return (
    <div className="h-full w-full min-h-0 overflow-auto p-0 bg-gray-50">
      {!chatId && !error && !loading && (
        <div className="rounded border border-gray-200 bg-white text-gray-600 text-xs p-3">
          UI de preview aberta. Inicie um computador para carregar e renderizar arquivos `.jsonr`.
        </div>
      )}
      {!error && loading && <div className="text-xs text-gray-500 p-2">Carregando...</div>}
      {error && !loading && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 text-xs p-3">{error}</div>
      )}
      {!error && !loading && tree && (
        <div className="rounded-none border-0 bg-white p-0 min-h-[420px]">
          <PreviewRenderBoundary
            resetKey={`${jsonrPath || ""}:${refreshTick}`}
            onError={(err) => {
              const message = err instanceof Error ? err.message : "Erro ao renderizar dashboard";
              setError(message);
            }}
          >
            <DataProvider initialData={{}}>
              <Renderer tree={tree} registry={registry} />
            </DataProvider>
          </PreviewRenderBoundary>
        </div>
      )}
    </div>
  );
}

export default function JsonRenderPreview(props: Props) {
  return (
    <ComponentBoundary>
      <JsonRenderPreviewInner {...props} />
    </ComponentBoundary>
  );
}

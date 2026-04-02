"use client";

import React from "react";
import { useStore } from "@nanostores/react";
import { DashboardRenderer } from "@/products/dashboard/render/dashboardRegistry";
import { parseDashboardJsxToTree, type WorkspaceSourceFile } from "@/products/dashboard/workspace/dashboardJsxParser";
import { $previewArtifactPath, sandboxActions } from "@/chat/sandbox";

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

function getPreviewArtifactKind(path: string | null | undefined): "tsx" | null {
  if (!path) return null;
  const p = String(path).trim();
  if (!p.startsWith("/vercel/sandbox/")) return null;
  if (p.endsWith(".tsx")) return "tsx";
  return null;
}

function isSupportedPreviewPath(path: string | null | undefined): path is string {
  return getPreviewArtifactKind(path) !== null;
}

function comparePreviewPaths(a: string, b: string) {
  const aKind = getPreviewArtifactKind(a);
  const bKind = getPreviewArtifactKind(b);
  if (aKind !== bKind) {
    if (aKind === "tsx") return -1;
    if (bKind === "tsx") return 1;
  }
  return a.localeCompare(b);
}

function dirname(path: string) {
  const normalized = String(path || "").replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

async function readSandboxTextFile(chatId: string, path: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "fs-read", chatId, path }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    content?: string;
    isBinary?: boolean;
    error?: string;
  };
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Falha ao ler arquivo ${path}`);
  }
  if (data.isBinary) {
    throw new Error(`Arquivo binario nao suportado no preview: ${path}`);
  }
  return String(data.content || "");
}

async function loadPreviewTsxFiles(chatId: string, entryPath: string): Promise<WorkspaceSourceFile[]> {
  const sourceExtPattern = /\.(ts|tsx|js|jsx)$/i;
  const entryContent = await readSandboxTextFile(chatId, entryPath);
  const files = new Map<string, string>([[entryPath, entryContent]]);
  const dir = dirname(entryPath);
  if (!dir) return [{ path: entryPath, content: entryContent }];

  try {
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
      throw new Error(data.error || `Falha ao listar ${dir}`);
    }

    const siblingPaths = (data.entries || [])
      .filter((entry) => entry.type === "file" && sourceExtPattern.test(entry.path))
      .map((entry) => entry.path)
      .filter((path) => path !== entryPath);

    const siblingReads = await Promise.all(
      siblingPaths.map(async (path) => {
        try {
          return { path, content: await readSandboxTextFile(chatId, path) };
        } catch {
          return null;
        }
      }),
    );

    for (const file of siblingReads) {
      if (file) files.set(file.path, file.content);
    }
  } catch {
    // Fallback to the entry file only.
  }

  return Array.from(files, ([path, content]) => ({ path, content }));
}

function JsonRenderPreviewInner({ chatId }: Props) {
  const previewPath = useStore($previewArtifactPath);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [tree, setTree] = React.useState<any>(null);
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
          if (e.type === "file" && e.path.endsWith(".tsx")) {
            collected.push(e.path);
          }
        }
      }

      const unique = Array.from(new Set(collected)).sort(comparePreviewPaths);
      setPathsError(unique.length === 0 ? firstErr : null);
      return unique;
    } catch (e: any) {
      setPathsError(e?.message ? String(e.message) : "Falha ao buscar arquivos de preview");
      return [];
    }
  }, [chatId]);

  // Hydrate once per chat to avoid overriding user selection with stale storage.
  React.useEffect(() => {
    if (typeof window === "undefined" || !chatId) return;
    if (hydratedPreviewPathForChatRef.current === chatId) return;
    try {
      const saved = window.localStorage.getItem(`previewArtifactPath:${chatId}`);
      hydratedPreviewPathForChatRef.current = chatId;
      if (saved && isSupportedPreviewPath(saved) && saved !== previewPath) {
        sandboxActions.setPreviewPath(saved);
      }
    } catch {
      // ignore storage access errors
    }
  }, [chatId, previewPath]);

  React.useEffect(() => {
    if (!chatId) hydratedPreviewPathForChatRef.current = null;
  }, [chatId]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !chatId || !previewPath) return;
    try {
      window.localStorage.setItem(`previewArtifactPath:${chatId}`, previewPath);
    } catch {
      // ignore storage access errors
    }
  }, [chatId, previewPath]);

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
      if (!previewPath) {
        if (!cancelled) {
          setError("Caminho do preview nao configurado.");
          setLoading(false);
        }
        return;
      }
      const kind = getPreviewArtifactKind(previewPath);
      if (!kind) {
        if (!cancelled) {
          setError("Caminho invalido do preview.");
          setLoading(false);
        }
        return;
      }

      try {
        const files = await loadPreviewTsxFiles(chatId, previewPath);
        const nextTree = await parseDashboardJsxToTree(previewPath, files);
        if (!cancelled) setTree(nextTree);
      } catch (e: any) {
        const found = await refreshPaths();
        const candidate = found[0];
        if (!cancelled && candidate && candidate !== previewPath) {
          sandboxActions.setPreviewPath(candidate);
          setLoading(false);
          return;
        }
        if (!cancelled) setError(e?.message ? String(e.message) : "Erro ao carregar preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, previewPath, refreshTick, refreshPaths]);

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
          UI de preview aberta. Inicie um computador para carregar e renderizar artefatos `.tsx`.
        </div>
      )}
      {!error && loading && <div className="text-xs text-gray-500 p-2">Carregando...</div>}
      {!error && !loading && tree && <DashboardRenderer tree={tree} />}
      {error && !loading && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 text-xs p-3">{error}</div>
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

"use client";

import React from "react";
import { useStore } from "@nanostores/react";
import { $previewDslPath, sandboxActions } from "@/chat/sandbox";
import { DataProvider } from "@/products/bi/json-render/context";
import JsonPreviewPanel from "@/products/bi/features/dashboard-editor/components/JsonPreviewPanel";
import PropertiesPanel from "@/products/bi/features/dashboard-editor/components/PropertiesPanel";
import useDashboardVisualEditor from "@/products/bi/features/dashboard-editor/hooks/useDashboardVisualEditor";
import {
  parseDashboardTemplateDslToTree,
  renderDashboardTemplateDslFromTree,
} from "@/products/bi/features/dashboard-playground/parsers/dashboardTemplateDslParser";
import type {
  JsonNodePath,
  NodeDropPlacement,
  NodeMoveDirection,
} from "@/products/bi/features/dashboard-editor/types/editor-types";
import {
  deleteNodeAtPath,
  duplicateNodeAtPath,
  moveNodeAtPath,
  moveNodeRelativeToPath,
  replaceNodeProps as replaceNodePropsInTree,
} from "@/products/bi/features/dashboard-editor/lib/jsonTreeOps";

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

function isValidDslPath(path: string | null | undefined): path is string {
  if (!path) return false;
  const p = String(path).trim();
  return p.startsWith("/vercel/sandbox/") && p.endsWith(".dsl");
}

function extractTemplateNameFromPath(path: string): string {
  const raw = String(path || "").trim();
  const fileName = raw.split("/").filter(Boolean).pop() || "dashboard";
  const base = fileName.replace(/\.dsl$/i, "");
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "dashboard";
}

function JsonRenderPreviewInner({ chatId }: Props) {
  const dslPath = useStore($previewDslPath);
  const [error, setError] = React.useState<string | null>(null);
  const [tree, setTree] = React.useState<any | any[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [refreshTick, setRefreshTick] = React.useState(0);
  const [pathsError, setPathsError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<boolean>(false);
  const hydratedPreviewPathForChatRef = React.useRef<string | null>(null);

  const persistTree = React.useCallback(
    async (nextTree: any) => {
      if (!chatId || !dslPath || !isValidDslPath(dslPath)) return false;
      setSaving(true);
      try {
        const content = renderDashboardTemplateDslFromTree(nextTree, extractTemplateNameFromPath(dslPath));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "fs-write",
            chatId,
            path: dslPath,
            content,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || `Falha ao salvar ${dslPath}`);
        }
        return true;
      } catch (e: any) {
        const msg = e?.message ? String(e.message) : "Falha ao salvar dashboard";
        sandboxActions.pushArtifactNotification({ source: "preview", message: msg });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [chatId, dslPath],
  );

  const duplicateNode = React.useCallback(
    (path: JsonNodePath) => {
      if (!tree) return;
      const next = duplicateNodeAtPath(tree as any, path);
      if (next === tree) return;
      setTree(next as any);
      void persistTree(next);
    },
    [persistTree, tree],
  );

  const deleteNode = React.useCallback(
    (path: JsonNodePath) => {
      if (!tree) return;
      const next = deleteNodeAtPath(tree as any, path);
      if (next === tree) return;
      setTree(next as any);
      void persistTree(next);
    },
    [persistTree, tree],
  );

  const moveNode = React.useCallback(
    (path: JsonNodePath, direction: NodeMoveDirection) => {
      if (!tree) return false;
      const next = moveNodeAtPath(tree as any, path, direction);
      if (next === tree) return false;
      setTree(next as any);
      void persistTree(next);
      return true;
    },
    [persistTree, tree],
  );

  const moveNodeRelative = React.useCallback(
    (sourcePath: JsonNodePath, targetPath: JsonNodePath, placement: NodeDropPlacement) => {
      if (!tree) return false;
      const next = moveNodeRelativeToPath(tree as any, sourcePath, targetPath, placement);
      if (next === tree) return false;
      setTree(next as any);
      void persistTree(next);
      return true;
    },
    [persistTree, tree],
  );

  const replaceNodeProps = React.useCallback(
    (path: JsonNodePath, props: Record<string, any>) => {
      if (!tree) return;
      const next = replaceNodePropsInTree(tree as any, path, props);
      if (next === tree) return;
      setTree(next as any);
      void persistTree(next);
    },
    [persistTree, tree],
  );

  const visualEditor = useDashboardVisualEditor({
    onDuplicateNode: duplicateNode,
    onDeleteNode: deleteNode,
    onMoveNode: moveNode,
    onMoveNodeRelative: moveNodeRelative,
  });

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
          if (e.type === "file" && e.path.endsWith(".dsl")) {
            collected.push(e.path);
          }
        }
      }

      const unique = Array.from(new Set(collected)).sort();
      setPathsError(unique.length === 0 ? firstErr : null);
      return unique;
    } catch (e: any) {
      setPathsError(e?.message ? String(e.message) : "Falha ao buscar arquivos .dsl");
      return [];
    }
  }, [chatId]);

  // Hydrate once per chat to avoid overriding user selection with stale storage.
  React.useEffect(() => {
    if (typeof window === "undefined" || !chatId) return;
    if (hydratedPreviewPathForChatRef.current === chatId) return;
    try {
      const saved = window.localStorage.getItem(`previewDslPath:${chatId}`);
      hydratedPreviewPathForChatRef.current = chatId;
      if (saved && isValidDslPath(saved) && saved !== dslPath) {
        sandboxActions.setPreviewPath(saved);
      }
    } catch {
      // ignore storage access errors
    }
  }, [chatId, dslPath]);

  React.useEffect(() => {
    if (!chatId) hydratedPreviewPathForChatRef.current = null;
  }, [chatId]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !chatId || !dslPath) return;
    try {
      window.localStorage.setItem(`previewDslPath:${chatId}`, dslPath);
    } catch {
      // ignore storage access errors
    }
  }, [chatId, dslPath]);

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
      if (!dslPath) {
        if (!cancelled) {
          setError("Caminho do .dsl não configurado.");
          setLoading(false);
        }
        return;
      }
      if (!isValidDslPath(dslPath)) {
        if (!cancelled) {
          setError("Caminho inválido do .dsl.");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fs-read", chatId, path: dslPath }),
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
          if (!cancelled && candidate && candidate !== dslPath) {
            sandboxActions.setPreviewPath(candidate);
            setLoading(false);
            return;
          }
          if (!cancelled) {
            setError(data.error || `Falha ao ler arquivo ${dslPath}`);
            setLoading(false);
          }
          return;
        }

        if (data.isBinary) {
          if (!cancelled) {
            setError("Arquivo .dsl binário inválido.");
            setLoading(false);
          }
          return;
        }

        const txt = String(data.content ?? "");
        try {
          const parsed = parseDashboardTemplateDslToTree(txt);
          if (!cancelled) setTree(parsed as any);
        } catch (e: any) {
          if (!cancelled) setError(e?.message ? String(e.message) : "DSL inválido");
        }
      } catch (e: any) {
        const found = await refreshPaths();
        const candidate = found[0];
        if (!cancelled && candidate && candidate !== dslPath) {
          sandboxActions.setPreviewPath(candidate);
          setLoading(false);
          return;
        }
        if (!cancelled) setError(e?.message ? String(e.message) : "Erro ao buscar .dsl");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, dslPath, refreshTick, refreshPaths]);

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
          UI de preview aberta. Inicie um computador para carregar e renderizar arquivos `.dsl`.
        </div>
      )}
      {!error && loading && <div className="text-xs text-gray-500 p-2">Carregando...</div>}
      {error && !loading && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 text-xs p-3">{error}</div>
      )}
      {!error && !loading && tree && (
        <div className="rounded-none border-0 bg-white p-0 min-h-[420px]">
          <PreviewRenderBoundary
            resetKey={`${dslPath || ""}:${refreshTick}`}
            onError={(err) => {
              const message = err instanceof Error ? err.message : "Erro ao renderizar dashboard";
              setError(message);
            }}
          >
            <DataProvider initialData={{}}>
              <JsonPreviewPanel
                tree={tree as any}
                hideHeader
                actionHint={saving ? "Salvando..." : "Editor visual ativo"}
                visualEditor={{
                  enabled: true,
                  selectedPath: visualEditor.selectedPath,
                  onNodeAction: visualEditor.handleNodeAction,
                  onNodeMove: visualEditor.handleNodeMove,
                  onNodeDropReorder: visualEditor.handleNodeDropReorder,
                }}
                propertiesPanel={
                  visualEditor.isPropertiesOpen ? (
                    <PropertiesPanel
                      tree={tree as any}
                      selectedPath={visualEditor.selectedPath}
                      isOpen={visualEditor.isPropertiesOpen}
                      onClose={visualEditor.closeProperties}
                      onSetNodeProp={() => {}}
                      onReplaceNodeProps={replaceNodeProps}
                    />
                  ) : null
                }
              />
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

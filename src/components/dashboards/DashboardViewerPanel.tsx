"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore as useNanoStore } from "@nanostores/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ResponsiveGridCanvas from "@/components/visual-builder/ResponsiveGridCanvas";
import { $visualBuilderState, visualBuilderActions, type GlobalFilters } from "@/stores/visualBuilderStore";
import { dashboardsApi } from "@/stores/dashboardsStore";
import ClientErrorBoundary from "@/components/common/ClientErrorBoundary";
import { ThemeManager, type ThemeName } from "@/components/visual-builder/ThemeManager";
import { headerUiActions } from "@/stores/ui/headerUiStore";

function isDsl(code: string) {
  return code.trim().startsWith('<');
}

function readStyleFromDsl(dsl: string): Record<string, unknown> | null {
  const m = dsl.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
  if (!m || !m[1]) return null;
  try { return JSON.parse(m[1].trim()) as Record<string, unknown>; } catch { return null; }
}

function getThemeFromCode(code: string): ThemeName | undefined {
  if (!code) return undefined;
  if (isDsl(code)) {
    const style = readStyleFromDsl(code);
    if (style && typeof style['theme'] === 'string' && ThemeManager.isValidTheme(style['theme'] as string)) return style['theme'] as ThemeName;
    const m = code.match(/<dashboard\b[^>]*\btheme=\"([^\"]+)\"/i);
    if (m && m[1] && ThemeManager.isValidTheme(m[1])) return m[1] as ThemeName;
    return undefined;
  }
  try {
    const cfg = JSON.parse(code) as { theme?: string };
    return cfg.theme && ThemeManager.isValidTheme(cfg.theme) ? (cfg.theme as ThemeName) : undefined;
  } catch { return undefined; }
}

export default function DashboardViewerPanel({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vb = useNanoStore($visualBuilderState);
  const [meta, setMeta] = useState<{ title?: string; description?: string | null }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Ensure dashboardId is in query string for widgets relying on it (e.g., insights2)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      if (id && sp.get('dashboardId') !== id) {
        sp.set('dashboardId', id);
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
      }
    } catch {}
  }, [id]);

  // Load dashboard and feed visualBuilder store
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        // Reset stores to avoid style/theme leaks
        visualBuilderActions.reset();
        headerUiActions.resetAll();

        const { item } = await dashboardsApi.get(id);
        if (!mounted) return;
        setMeta({ title: item.title, description: item.description ?? null });
        visualBuilderActions.updateCode(item.sourcecode || '{}');
      } catch (e) {
        if (!mounted) return;
        setError((e as Error).message || 'Falha ao carregar dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const themeName = useMemo(() => getThemeFromCode(vb.code || ''), [vb.code]);

  const handleFilterChange = (filters: GlobalFilters) => {
    setIsFilterLoading(true);
    try {
      visualBuilderActions.updateGlobalDateInCode(filters);
    } finally {
      setTimeout(() => setIsFilterLoading(false), 600);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-40 bg-white border rounded-xl animate-pulse" />))}
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="min-h-screen p-6"><div className="p-4 bg-red-50 border border-red-200 rounded">{error}</div></div>;
  }

  return (
    <div className="h-full min-h-screen bg-gray-50 py-2 px-4">
      <ClientErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded">Falha ao renderizar widgets.</div>}>
        <ResponsiveGridCanvas
          widgets={vb.widgets}
          gridConfig={vb.gridConfig}
          globalFilters={vb.globalFilters}
          viewportMode={selectedViewport}
          headerTitle={meta.title || vb.dashboardTitle || 'Dashboard'}
          headerSubtitle={(meta.description ?? undefined) || vb.dashboardSubtitle}
          themeName={themeName}
          onFilterChange={handleFilterChange}
          isFilterLoading={isFilterLoading}
        />
      </ClientErrorBoundary>
    </div>
  );
}


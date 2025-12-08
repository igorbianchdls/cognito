"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { dashboardsApi, type Dashboard } from "@/stores/dashboardsStore";
import { ConfigParser } from "@/components/visual-builder/ConfigParser";
import WidgetRenderer from "@/components/visual-builder/WidgetRenderer";

type Parse = ReturnType<typeof ConfigParser.parse>;

export default function DashboardViewPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [item, setItem] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [parse, setParse] = useState<Parse | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { item } = await dashboardsApi.get(id);
        if (!mounted) return;
        setItem(item);
        const result = ConfigParser.parse(item.sourcecode || "{}");
        setParse(result);
      } catch (e) {
        if (!mounted) return;
        setError((e as Error).message || "Falha ao carregar dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return <div className="min-h-screen p-6"><div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-4" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_,i) => (<div key={i} className="h-40 bg-white border rounded-xl animate-pulse" />))}</div></div>;
  }
  if (error) {
    return <div className="min-h-screen p-6"><div className="p-4 bg-red-50 border border-red-200 rounded">{error}</div></div>;
  }
  if (!item || !parse) {
    return <div className="min-h-screen p-6"><div className="p-4 bg-white border rounded">Dashboard não encontrado.</div></div>;
  }

  const widgets = parse.widgets || [];
  const grid = parse.gridConfig || { cols: 12 } as Parse["gridConfig"];
  const cols = Math.max(1, grid.cols || 12);

  // Order widgets by position (y then x) for stable layout
  const ordered = useMemo(() => {
    return [...widgets].sort((a, b) => {
      const ay = (a.position?.y ?? 0);
      const by = (b.position?.y ?? 0);
      if (ay !== by) return ay - by;
      const ax = (a.position?.x ?? 0);
      const bx = (b.position?.x ?? 0);
      return ax - bx;
    });
  }, [widgets]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {(parse.dashboardTitle || item.title) && (
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900">{parse.dashboardTitle || item.title}</h1>
            {parse.dashboardSubtitle || item.description ? (
              <p className="text-sm text-gray-600 mt-1">{parse.dashboardSubtitle || item.description}</p>
            ) : null}
          </div>
        )}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {ordered.map((w) => {
            const span = Math.max(1, Math.min(cols, (w.span?.desktop || w.position?.w || 3)));
            const minH = (() => {
              if (typeof w.heightPx === 'number' && w.heightPx > 0) return `${w.heightPx}px`;
              if (w.type === 'kpi') return '100px';
              if (['bar','line','pie','area','stackedbar','groupedbar','stackedlines','radialstacked','pivotbar'].includes(w.type)) return '500px';
              return '280px';
            })();
            return (
              <div key={w.id} className="bg-white border rounded-lg" style={{ gridColumn: `span ${span}`, borderColor: grid.borderColor || '#e5e7eb', minHeight: minH }}>
                <WidgetRenderer widget={w} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

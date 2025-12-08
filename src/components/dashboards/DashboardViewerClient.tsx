"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import ClientErrorBoundary from "@/components/common/ClientErrorBoundary";
import { ConfigParser } from "@/components/visual-builder/ConfigParser";

const WidgetRenderer = dynamic(() => import("@/components/visual-builder/WidgetRenderer"), { ssr: false });

export default function DashboardViewerClient({ title, description, sourcecode }: { title?: string; description?: string | null; sourcecode: string }) {
  const parsed = useMemo(() => ConfigParser.parse(sourcecode || "{}"), [sourcecode]);
  const widgets = parsed.widgets || [];
  const grid = parsed.gridConfig || { cols: 12 };
  const cols = Math.max(1, grid.cols || 12);

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
        {(parsed.dashboardTitle || title) && (
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900">{parsed.dashboardTitle || title}</h1>
            {(parsed.dashboardSubtitle || description) ? (
              <p className="text-sm text-gray-600 mt-1">{parsed.dashboardSubtitle || description}</p>
            ) : null}
          </div>
        )}
        <ClientErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded">Falha ao renderizar widgets.</div>}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
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
        </ClientErrorBoundary>
      </div>
    </div>
  );
}


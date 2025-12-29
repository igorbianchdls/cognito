"use client";

import * as React from "react";
import type { Dashboard } from "@/stores/dashboardsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Lock, Users, Globe2, Trash2 } from "lucide-react";
import { dashboardsApi } from "@/stores/dashboardsStore";

type Props = {
  item: Dashboard & { created_at?: string; updated_at?: string };
  onOpen?: (id: string) => void;
  onCopyId?: (id: string) => void;
  onDeleted?: (id: string) => void;
};

const visibilityBadge = (v: Dashboard["visibility"]) => {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    private: { cls: "bg-gray-100 text-gray-800", icon: <Lock className="w-3.5 h-3.5" />, label: "Privado" },
    org: { cls: "bg-indigo-100 text-indigo-800", icon: <Users className="w-3.5 h-3.5" />, label: "Equipe" },
    public: { cls: "bg-green-100 text-green-800", icon: <Globe2 className="w-3.5 h-3.5" />, label: "Público" },
  };
  const b = map[v] || map.private;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${b.cls}`}>
      {b.icon}
      {b.label}
    </span>
  );
};

export default function DashboardCard({ item, onOpen, onCopyId, onDeleted }: Props) {
  const handleOpen = () => {
    if (onOpen) onOpen(item.id);
    else window.open(`/nexus?dashboardId=${item.id}`, "_self");
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.id);
      if (onCopyId) onCopyId(item.id);
    } catch {}
  };
  const [deleting, setDeleting] = React.useState(false);
  const handleDelete = async () => {
    if (deleting) return;
    const ok = window.confirm(`Apagar o dashboard "${item.title || item.id}"?`);
    if (!ok) return;
    try {
      setDeleting(true);
      await dashboardsApi.remove(item.id);
      if (onDeleted) onDeleted(item.id);
    } catch (e) {
      alert((e as Error).message || 'Falha ao apagar dashboard');
    } finally {
      setDeleting(false);
    }
  };

  const recentlyUpdated = (() => {
    if (!item.updated_at) return false;
    try {
      const dt = new Date(item.updated_at);
      const diff = Date.now() - dt.getTime();
      return diff < 1000 * 60 * 60 * 24 * 7; // 7 days
    } catch { return false; }
  })();

  return (
    <div
      className="flex flex-col justify-between bg-white border rounded-xl p-4 h-full hover:shadow-sm hover:-translate-y-[1px] transition duration-150"
      style={{ borderColor: "#e5e7eb" }}
    >
      <div>
        {/* Top row: icon + optional featured */}
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-2">
            {visibilityBadge(item.visibility)}
          </div>
          {recentlyUpdated && (
            <Badge variant="secondary" className="text-[10px] tracking-wide">ATUALIZADO</Badge>
          )}
        </div>

        {/* Title + description */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title || "(sem título)"}</h3>
          <p className="text-xs text-gray-600 line-clamp-2">{item.description || "Sem descrição"}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">v{item.version ?? 1}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5 mr-1" /> ID
          </Button>
          <Button size="sm" variant="secondary" onClick={() => window.open(`/dashboards/${item.id}/view?dashboardId=${item.id}`, "_self") }>
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
          </Button>
          <Button size="sm" onClick={handleOpen}>
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Editar
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting} title="Apagar dashboard">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> {deleting ? 'Apagando…' : 'Apagar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

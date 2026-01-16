'use client';

import { Atom, ChevronRight } from 'lucide-react';

type ArtifactToolCardProps = {
  id: string;
  title?: string | null;
  type?: string | null;
  command: 'create' | 'update' | string;
  onOpen: () => void;
};

export default function ArtifactToolCard({ id, title, type, command, onOpen }: ArtifactToolCardProps) {
  const displayTitle = title || id;
  const subtitle = 'Artefato interativo';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-[#FCFCFA] hover:bg-[#F7F7F5] border border-gray-200 rounded-md px-4 py-3 flex items-center justify-between transition-colors"
      aria-label={`Abrir artifact ${displayTitle}`}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{displayTitle}</div>
        <div className="text-xs text-gray-500 truncate">{subtitle}</div>
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <span className="text-[10px] uppercase tracking-wide">{command}</span>
        <div className="w-9 h-11 rounded-md border border-gray-200 flex items-center justify-center bg-white">
          <Atom className="w-4 h-4" />
        </div>
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}


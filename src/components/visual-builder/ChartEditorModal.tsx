'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ChartEditorModalProps {
  isOpen: boolean;
  initialTitle?: string;
  onClose: () => void;
  onSave: (data: { titleText: string }) => void;
}

export default function ChartEditorModal({ isOpen, initialTitle, onClose, onSave }: ChartEditorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [titleText, setTitleText] = useState(initialTitle || '');

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => { if (isOpen) setTitleText(initialTitle || ''); }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[520px] max-w-[95vw] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Editar Chart</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Título (HTML &lt;h1&gt;)</label>
            <input className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={titleText} onChange={e=>setTitleText(e.target.value)} placeholder="Ex.: Faturamento Mensal" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">Cancelar</button>
          <button onClick={() => onSave({ titleText })} className="px-4 py-2 rounded-md bg-blue-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  const root = typeof document !== 'undefined' ? document.body : null;
  return root ? createPortal(modal, root) : null;
}


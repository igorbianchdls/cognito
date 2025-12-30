'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface GroupSpecDraft {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

interface GroupEditorModalProps {
  open: boolean;
  groupId: string;
  initial: GroupSpecDraft;
  onClose: () => void;
  onSave: (spec: GroupSpecDraft) => void;
}

export default function GroupEditorModal({ open, groupId, initial, onClose, onSave }: GroupEditorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState<string>(initial.title || '');
  const [subtitle, setSubtitle] = useState<string>(initial.subtitle || '');
  const [backgroundColor, setBackgroundColor] = useState<string>(initial.backgroundColor || '');
  const [borderColor, setBorderColor] = useState<string>(initial.borderColor || '');
  const [borderWidth, setBorderWidth] = useState<number | undefined>(initial.borderWidth);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => {
    if (open) {
      setTitle(initial.title || '');
      setSubtitle(initial.subtitle || '');
      setBackgroundColor(initial.backgroundColor || '');
      setBorderColor(initial.borderColor || '');
      setBorderWidth(initial.borderWidth);
    }
  }, [open, initial.title, initial.subtitle, initial.backgroundColor, initial.borderColor, initial.borderWidth]);

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-28 right-8 w-[28rem] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Editar Grupo: {groupId}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fechar">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do grupo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
              <input className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtítulo (opcional)" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Fundo</h4>
              <input type="color" className="px-1 py-1 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" value={backgroundColor || '#ffffff'} onChange={e => setBackgroundColor(e.target.value)} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Borda</h4>
              <div className="grid grid-cols-3 gap-2 items-center">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Largura</label>
                  <input type="number" min={0} className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={borderWidth ?? ''} onChange={e => setBorderWidth(e.target.value ? parseInt(e.target.value) : undefined)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cor</label>
                  <input type="color" className="w-full px-1 py-1 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" value={borderColor || '#e5e7eb'} onChange={e => setBorderColor(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
          <button type="button" onClick={() => onSave({ title, subtitle, backgroundColor, borderColor, borderWidth })} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Salvar</button>
        </div>
      </div>
    </div>
  );

  return mounted && typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}


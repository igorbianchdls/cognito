'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontManager } from './FontManager';

export interface GroupSpecDraft {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  // Typography
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
  titleMarginBottom?: number;
  subtitleFontFamily?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: string | number;
  subtitleColor?: string;
  subtitleMarginBottom?: number;
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
  const [titleFontFamily, setTitleFontFamily] = useState<string>(initial.titleFontFamily || '');
  const [titleFontSize, setTitleFontSize] = useState<number | undefined>(initial.titleFontSize);
  const [titleFontWeight, setTitleFontWeight] = useState<string | number | undefined>(initial.titleFontWeight);
  const [titleColor, setTitleColor] = useState<string>(initial.titleColor || '');
  const [titleMarginBottom, setTitleMarginBottom] = useState<number | undefined>(initial.titleMarginBottom);
  const [subtitleFontFamily, setSubtitleFontFamily] = useState<string>(initial.subtitleFontFamily || '');
  const [subtitleFontSize, setSubtitleFontSize] = useState<number | undefined>(initial.subtitleFontSize);
  const [subtitleFontWeight, setSubtitleFontWeight] = useState<string | number | undefined>(initial.subtitleFontWeight);
  const [subtitleColor, setSubtitleColor] = useState<string>(initial.subtitleColor || '');
  const [subtitleMarginBottom, setSubtitleMarginBottom] = useState<number | undefined>(initial.subtitleMarginBottom);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => {
    if (open) {
      setTitle(initial.title || '');
      setSubtitle(initial.subtitle || '');
      setBackgroundColor(initial.backgroundColor || '');
      setBorderColor(initial.borderColor || '');
      setBorderWidth(initial.borderWidth);
      setTitleFontFamily(initial.titleFontFamily || '');
      setTitleFontSize(initial.titleFontSize);
      setTitleFontWeight(initial.titleFontWeight);
      setTitleColor(initial.titleColor || '');
      setTitleMarginBottom(initial.titleMarginBottom);
      setSubtitleFontFamily(initial.subtitleFontFamily || '');
      setSubtitleFontSize(initial.subtitleFontSize);
      setSubtitleFontWeight(initial.subtitleFontWeight);
      setSubtitleColor(initial.subtitleColor || '');
      setSubtitleMarginBottom(initial.subtitleMarginBottom);
    }
  }, [open, initial.title, initial.subtitle, initial.backgroundColor, initial.borderColor, initial.borderWidth, initial.titleFontFamily, initial.titleFontSize, initial.titleFontWeight, initial.titleColor, initial.titleMarginBottom, initial.subtitleFontFamily, initial.subtitleFontSize, initial.subtitleFontWeight, initial.subtitleColor, initial.subtitleMarginBottom]);

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
            {/* Title Typography */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Título • Tipografia</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={titleFontFamily} onChange={e => setTitleFontFamily(e.target.value)}>
                  <option value="">(Padrão)</option>
                  {FontManager.getAvailableFonts().map(f => (<option key={f.key} value={f.family}>{f.name}</option>))}
                </select>
                <input type="color" className="px-1 py-1 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" value={titleColor || '#000000'} onChange={e => setTitleColor(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min={8} className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tamanho" value={titleFontSize ?? ''} onChange={e => setTitleFontSize(e.target.value ? parseInt(e.target.value) : undefined)} />
                <select className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={String(titleFontWeight ?? '')} onChange={e => setTitleFontWeight(e.target.value ? (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) : undefined)}>
                  <option value="">Peso</option>
                  {[100,200,300,400,500,600,700,800,900].map(w => (<option key={w} value={String(w)}>{w}</option>))}
                </select>
                <input type="number" min={0} className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Margin bottom" value={titleMarginBottom ?? ''} onChange={e => setTitleMarginBottom(e.target.value ? parseInt(e.target.value) : undefined)} />
              </div>
            </div>
            {/* Subtitle Typography */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Subtítulo • Tipografia</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={subtitleFontFamily} onChange={e => setSubtitleFontFamily(e.target.value)}>
                  <option value="">(Padrão)</option>
                  {FontManager.getAvailableFonts().map(f => (<option key={f.key} value={f.family}>{f.name}</option>))}
                </select>
                <input type="color" className="px-1 py-1 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10" value={subtitleColor || '#6b7280'} onChange={e => setSubtitleColor(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min={8} className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tamanho" value={subtitleFontSize ?? ''} onChange={e => setSubtitleFontSize(e.target.value ? parseInt(e.target.value) : undefined)} />
                <select className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={String(subtitleFontWeight ?? '')} onChange={e => setSubtitleFontWeight(e.target.value ? (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) : undefined)}>
                  <option value="">Peso</option>
                  {[100,200,300,400,500,600,700,800,900].map(w => (<option key={w} value={String(w)}>{w}</option>))}
                </select>
                <input type="number" min={0} className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Margin bottom" value={subtitleMarginBottom ?? ''} onChange={e => setSubtitleMarginBottom(e.target.value ? parseInt(e.target.value) : undefined)} />
              </div>
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
          <button type="button" onClick={() => onSave({ title, subtitle, backgroundColor, borderColor, borderWidth, titleFontFamily, titleFontSize, titleFontWeight, titleColor, titleMarginBottom, subtitleFontFamily, subtitleFontSize, subtitleFontWeight, subtitleColor, subtitleMarginBottom })} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Salvar</button>
        </div>
      </div>
    </div>
  );

  return mounted && typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}

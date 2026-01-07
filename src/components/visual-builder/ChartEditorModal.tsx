'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontManager } from './FontManager';

interface ChartEditorModalProps {
  isOpen: boolean;
  initial: {
    titleText: string;
    titleFontFamily?: string;
    titleFontSize?: number;
    titleFontWeight?: string | number;
    titleColor?: string;
    // Container (article) styles
    backgroundColor?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | '';
    borderRadius?: number;
  };
  onClose: () => void;
  onSave: (data: { titleText: string; titleFontFamily?: string; titleFontSize?: number; titleFontWeight?: string | number; titleColor?: string; backgroundColor?: string; opacity?: number; borderColor?: string; borderWidth?: number; borderStyle?: 'solid'|'dashed'|'dotted'|''; borderRadius?: number }) => void;
}

export default function ChartEditorModal({ isOpen, initial, onClose, onSave }: ChartEditorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [titleText, setTitleText] = useState(initial.titleText || '');
  const [titleFontFamily, setTitleFontFamily] = useState(initial.titleFontFamily || '');
  const [titleFontSize, setTitleFontSize] = useState<number | undefined>(initial.titleFontSize);
  const [titleFontWeight, setTitleFontWeight] = useState<string | number | undefined>(initial.titleFontWeight);
  const [titleColor, setTitleColor] = useState(initial.titleColor || '#111827');
  const [backgroundColor, setBackgroundColor] = useState(initial.backgroundColor || '');
  const [opacity, setOpacity] = useState<number | undefined>(initial.opacity);
  const [borderColor, setBorderColor] = useState(initial.borderColor || '');
  const [borderWidth, setBorderWidth] = useState<number | undefined>(initial.borderWidth);
  const [borderStyle, setBorderStyle] = useState<'solid'|'dashed'|'dotted'|''>(initial.borderStyle || '');
  const [borderRadius, setBorderRadius] = useState<number | undefined>(initial.borderRadius);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => {
    if (isOpen) {
      setTitleText(initial.titleText || '');
      setTitleFontFamily(initial.titleFontFamily || '');
      setTitleFontSize(initial.titleFontSize);
      setTitleFontWeight(initial.titleFontWeight);
      setTitleColor(initial.titleColor || '#111827');
      setBackgroundColor(initial.backgroundColor || '');
      setOpacity(initial.opacity);
      setBorderColor(initial.borderColor || '');
      setBorderWidth(initial.borderWidth);
      setBorderStyle(initial.borderStyle || '');
      setBorderRadius(initial.borderRadius);
    }
  }, [isOpen, initial]);

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
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Tipografia do Título</label>
            <div className="grid grid-cols-3 gap-2">
              <select className="px-2 py-2 bg-gray-100 border-0 rounded-md" value={titleFontFamily} onChange={e=>setTitleFontFamily(e.target.value)}>
                <option value="">(Padrão)</option>
                {FontManager.getAvailableFonts().map(f => (
                  <option key={f.key} value={f.family}>{f.name}</option>
                ))}
              </select>
              <input type="number" min={10} className="px-2 py-2 bg-gray-100 border-0 rounded-md" placeholder="Tamanho" value={titleFontSize ?? ''} onChange={e=>setTitleFontSize(e.target.value ? parseInt(e.target.value) : undefined)} />
              <select className="px-2 py-2 bg-gray-100 border-0 rounded-md" value={String(titleFontWeight ?? '')} onChange={e=>setTitleFontWeight(e.target.value ? (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) : undefined)}>
                <option value="">Peso</option>
                {[100,200,300,400,500,600,700,800,900].map(w => <option key={w} value={String(w)}>{w}</option>)}
              </select>
            </div>
            <div className="mt-2">
              <label className="text-xs text-gray-600 block mb-1">Cor</label>
              <input type="color" className="px-1 py-1 bg-gray-100 border-0 rounded-md h-10" value={titleColor} onChange={e=>setTitleColor(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Container do Article</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fundo</label>
                <input type="color" className="w-full px-1 py-1 bg-gray-100 border-0 rounded-md h-10" value={backgroundColor || '#ffffff'} onChange={e=>setBackgroundColor(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Opacidade</label>
                <input type="number" min={0} max={1} step={0.05} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={opacity ?? ''} onChange={e=>setOpacity(e.target.value===''?undefined:parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Borda (px)</label>
                <input type="number" min={0} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={borderWidth ?? ''} onChange={e=>setBorderWidth(e.target.value===''?undefined:parseInt(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Estilo</label>
                <select className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={borderStyle} onChange={e=>setBorderStyle((e.target.value as any) || '')}>
                  <option value="">(padrão)</option>
                  <option value="solid">solid</option>
                  <option value="dashed">dashed</option>
                  <option value="dotted">dotted</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cor</label>
                <input type="color" className="w-full px-1 py-1 bg-gray-100 border-0 rounded-md h-10" value={borderColor || '#e5e7eb'} onChange={e=>setBorderColor(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Raio (px)</label>
                <input type="number" min={0} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={borderRadius ?? ''} onChange={e=>setBorderRadius(e.target.value===''?undefined:parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">Cancelar</button>
          <button onClick={() => onSave({ titleText, titleFontFamily, titleFontSize, titleFontWeight, titleColor, backgroundColor, opacity, borderColor, borderWidth, borderStyle, borderRadius })} className="px-4 py-2 rounded-md bg-blue-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  const root = typeof document !== 'undefined' ? document.body : null;
  return root ? createPortal(modal, root) : null;
}

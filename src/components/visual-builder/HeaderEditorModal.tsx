'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface HeaderEditorModalProps {
  isOpen: boolean;
  initialTitle?: string;
  initialSubtitle?: string;
  initialConfig?: import('./ConfigParser').HeaderConfig;
  onClose: () => void;
  onSave: (data: { title: string; subtitle: string; config?: import('./ConfigParser').HeaderConfig }) => void;
}

export default function HeaderEditorModal({ isOpen, initialTitle, initialSubtitle, initialConfig, onClose, onSave }: HeaderEditorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState(initialTitle || '');
  const [subtitle, setSubtitle] = useState(initialSubtitle || '');
  const [titleFontFamily, setTitleFontFamily] = useState<string>(initialConfig?.titleFontFamily || '');
  const [titleFontSize, setTitleFontSize] = useState<number | undefined>(initialConfig?.titleFontSize);
  const [titleFontWeight, setTitleFontWeight] = useState<string | number | undefined>(initialConfig?.titleFontWeight);
  const [titleColor, setTitleColor] = useState<string>(initialConfig?.titleColor || '');
  const [subtitleFontFamily, setSubtitleFontFamily] = useState<string>(initialConfig?.subtitleFontFamily || '');
  const [subtitleFontSize, setSubtitleFontSize] = useState<number | undefined>(initialConfig?.subtitleFontSize);
  const [subtitleFontWeight, setSubtitleFontWeight] = useState<string | number | undefined>(initialConfig?.subtitleFontWeight);
  const [subtitleColor, setSubtitleColor] = useState<string>(initialConfig?.subtitleColor || '');
  const [backgroundColor, setBackgroundColor] = useState<string>(initialConfig?.backgroundColor || '');

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || '');
      setSubtitle(initialSubtitle || '');
      setTitleFontFamily(initialConfig?.titleFontFamily || '');
      setTitleFontSize(initialConfig?.titleFontSize);
      setTitleFontWeight(initialConfig?.titleFontWeight);
      setTitleColor(initialConfig?.titleColor || '');
      setSubtitleFontFamily(initialConfig?.subtitleFontFamily || '');
      setSubtitleFontSize(initialConfig?.subtitleFontSize);
      setSubtitleFontWeight(initialConfig?.subtitleFontWeight);
      setSubtitleColor(initialConfig?.subtitleColor || '');
      setBackgroundColor(initialConfig?.backgroundColor || '');
    }
  }, [isOpen, initialTitle, initialSubtitle, initialConfig]);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-24 right-8 w-[28rem] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Editar Header</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título do dashboard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Subtítulo (opcional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Título • Tipografia</h4>
                <input className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" placeholder="Font family" value={titleFontFamily} onChange={e => setTitleFontFamily(e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" min={8} className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tamanho" value={titleFontSize ?? ''} onChange={e => setTitleFontSize(e.target.value ? parseInt(e.target.value) : undefined)} />
                  <input type="text" className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Peso (ex. 600)" value={String(titleFontWeight ?? '')} onChange={e => setTitleFontWeight(e.target.value ? (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) : undefined)} />
                  <input type="text" className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="# Cor" value={titleColor} onChange={e => setTitleColor(e.target.value)} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Subtítulo • Tipografia</h4>
                <input className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" placeholder="Font family" value={subtitleFontFamily} onChange={e => setSubtitleFontFamily(e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" min={8} className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tamanho" value={subtitleFontSize ?? ''} onChange={e => setSubtitleFontSize(e.target.value ? parseInt(e.target.value) : undefined)} />
                  <input type="text" className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Peso (ex. 400)" value={String(subtitleFontWeight ?? '')} onChange={e => setSubtitleFontWeight(e.target.value ? (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) : undefined)} />
                  <input type="text" className="px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="# Cor" value={subtitleColor} onChange={e => setSubtitleColor(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="mt-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Container</h4>
              <input className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Background (ex.: #ffffff)" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >Cancelar</button>
          <button
            type="button"
            onClick={() => onSave({ title, subtitle, config: {
              ...(titleFontFamily ? { titleFontFamily } : {}),
              ...(titleFontSize ? { titleFontSize } : {}),
              ...(titleFontWeight ? { titleFontWeight } : {}),
              ...(titleColor ? { titleColor } : {}),
              ...(subtitleFontFamily ? { subtitleFontFamily } : {}),
              ...(subtitleFontSize ? { subtitleFontSize } : {}),
              ...(subtitleFontWeight ? { subtitleFontWeight } : {}),
              ...(subtitleColor ? { subtitleColor } : {}),
              ...(backgroundColor ? { backgroundColor } : {}),
            } })}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >Salvar</button>
        </div>
      </div>
    </div>
  );

  return mounted && typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}

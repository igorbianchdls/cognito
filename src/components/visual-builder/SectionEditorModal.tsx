'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface SectionEditorInitial {
  display?: 'flex' | 'grid';
  gap?: number; // px
  // Flex options
  flexDirection?: 'row' | 'column';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  // Grid options
  gridTemplateColumns?: string; // e.g., repeat(3, 1fr)
  // Spacing
  padding?: number; // px
  margin?: number; // px
  // Container styles
  backgroundColor?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | '';
  borderRadius?: number;
}

interface SectionEditorModalProps {
  isOpen: boolean;
  initial: SectionEditorInitial;
  onClose: () => void;
  onSave: (out: SectionEditorInitial) => void;
}

export default function SectionEditorModal({ isOpen, initial, onClose, onSave }: SectionEditorModalProps) {
  const [mounted, setMounted] = useState(false);

  // Local state
  const [display, setDisplay] = useState<SectionEditorInitial['display']>(initial.display || 'flex');
  const [gap, setGap] = useState<number | undefined>(initial.gap);
  const [flexDirection, setFlexDirection] = useState<SectionEditorInitial['flexDirection']>(initial.flexDirection || 'row');
  const [flexWrap, setFlexWrap] = useState<SectionEditorInitial['flexWrap']>(initial.flexWrap || 'nowrap');
  const [justifyContent, setJustifyContent] = useState<SectionEditorInitial['justifyContent']>(initial.justifyContent || 'flex-start');
  const [alignItems, setAlignItems] = useState<SectionEditorInitial['alignItems']>(initial.alignItems || 'stretch');
  const [gridTemplateColumns, setGridTemplateColumns] = useState(initial.gridTemplateColumns || '');
  const [padding, setPadding] = useState<number | undefined>(initial.padding);
  const [margin, setMargin] = useState<number | undefined>(initial.margin);
  const [backgroundColor, setBackgroundColor] = useState(initial.backgroundColor || '');
  const [opacity, setOpacity] = useState<number | undefined>(initial.opacity);
  const [borderColor, setBorderColor] = useState(initial.borderColor || '');
  const [borderWidth, setBorderWidth] = useState<number | undefined>(initial.borderWidth);
  const [borderStyle, setBorderStyle] = useState<SectionEditorInitial['borderStyle']>(initial.borderStyle || '');
  const [borderRadius, setBorderRadius] = useState<number | undefined>(initial.borderRadius);

  // Dirty flags to only apply what changed
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const markDirty = (k: string) => setDirty(d => ({ ...d, [k]: true }));

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => {
    if (isOpen) {
      setDisplay(initial.display || 'flex');
      setGap(initial.gap);
      setFlexDirection(initial.flexDirection || 'row');
      setFlexWrap(initial.flexWrap || 'nowrap');
      setJustifyContent(initial.justifyContent || 'flex-start');
      setAlignItems(initial.alignItems || 'stretch');
      setGridTemplateColumns(initial.gridTemplateColumns || '');
      setPadding(initial.padding);
      setMargin(initial.margin);
      setBackgroundColor(initial.backgroundColor || '');
      setOpacity(initial.opacity);
      setBorderColor(initial.borderColor || '');
      setBorderWidth(initial.borderWidth);
      setBorderStyle(initial.borderStyle || '');
      setBorderRadius(initial.borderRadius);
      setDirty({});
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[720px] max-w-[95vw] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Editar Section</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">✕</button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Display</label>
              <select className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={display} onChange={e => { setDisplay(e.target.value as any); markDirty('display'); }}>
                <option value="flex">flex</option>
                <option value="grid">grid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Gap (px)</label>
              <input type="number" min={0} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={gap ?? ''} onChange={e => { setGap(e.target.value===''?undefined:parseInt(e.target.value)); markDirty('gap'); }} />
            </div>
          </div>

          {display === 'flex' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Direction</label>
                <select className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={flexDirection} onChange={e => { setFlexDirection(e.target.value as any); markDirty('flexDirection'); }}>
                  <option value="row">row</option>
                  <option value="column">column</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Wrap</label>
                <select className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={flexWrap} onChange={e => { setFlexWrap(e.target.value as any); markDirty('flexWrap'); }}>
                  <option value="nowrap">nowrap</option>
                  <option value="wrap">wrap</option>
                  <option value="wrap-reverse">wrap-reverse</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Justify</label>
                <select className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={justifyContent} onChange={e => { setJustifyContent(e.target.value as any); markDirty('justifyContent'); }}>
                  <option value="flex-start">flex-start</option>
                  <option value="center">center</option>
                  <option value="flex-end">flex-end</option>
                  <option value="space-between">space-between</option>
                  <option value="space-around">space-around</option>
                  <option value="space-evenly">space-evenly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Align</label>
                <select className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={alignItems} onChange={e => { setAlignItems(e.target.value as any); markDirty('alignItems'); }}>
                  <option value="stretch">stretch</option>
                  <option value="flex-start">flex-start</option>
                  <option value="center">center</option>
                  <option value="flex-end">flex-end</option>
                  <option value="baseline">baseline</option>
                </select>
              </div>
            </div>
          )}

          {display === 'grid' && (
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">grid-template-columns</label>
              <input className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={gridTemplateColumns} onChange={e => { setGridTemplateColumns(e.target.value); markDirty('gridTemplateColumns'); }} placeholder="ex.: repeat(3, 1fr)" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Padding (px)</label>
              <input type="number" min={0} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={padding ?? ''} onChange={e => { setPadding(e.target.value===''?undefined:parseInt(e.target.value)); markDirty('padding'); }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Margin (px)</label>
              <input type="number" min={0} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={margin ?? ''} onChange={e => { setMargin(e.target.value===''?undefined:parseInt(e.target.value)); markDirty('margin'); }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Fundo</label>
              <input type="color" className="w-full px-1 py-1 bg-gray-100 border-0 rounded-md h-10" value={backgroundColor || '#ffffff'} onChange={e => { setBackgroundColor(e.target.value); markDirty('backgroundColor'); }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Opacidade</label>
              <input type="number" min={0} max={1} step={0.05} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={opacity ?? ''} onChange={e => { setOpacity(e.target.value===''?undefined:parseFloat(e.target.value)); markDirty('opacity'); }} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Borda (px)</label>
              <input type="number" min={0} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={borderWidth ?? ''} onChange={e => { setBorderWidth(e.target.value===''?undefined:parseInt(e.target.value)); markDirty('borderWidth'); }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Estilo</label>
              <select className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={borderStyle} onChange={e => { setBorderStyle((e.target.value as any) || ''); markDirty('borderStyle'); }}>
                <option value="">(padrão)</option>
                <option value="solid">solid</option>
                <option value="dashed">dashed</option>
                <option value="dotted">dotted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Cor</label>
              <input type="color" className="w-full px-1 py-1 bg-gray-100 border-0 rounded-md h-10" value={borderColor || '#e5e7eb'} onChange={e => { setBorderColor(e.target.value); markDirty('borderColor'); }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Raio (px)</label>
              <input type="number" min={0} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={borderRadius ?? ''} onChange={e => { setBorderRadius(e.target.value===''?undefined:parseInt(e.target.value)); markDirty('borderRadius'); }} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">Cancelar</button>
          <button onClick={() => onSave({
            ...(dirty.display ? { display } : {}),
            ...(dirty.gap ? { gap } : {}),
            ...(display === 'flex' && dirty.flexDirection ? { flexDirection } : {}),
            ...(display === 'flex' && dirty.flexWrap ? { flexWrap } : {}),
            ...(display === 'flex' && dirty.justifyContent ? { justifyContent } : {}),
            ...(display === 'flex' && dirty.alignItems ? { alignItems } : {}),
            ...(display === 'grid' && dirty.gridTemplateColumns ? { gridTemplateColumns } : {}),
            ...(dirty.padding ? { padding } : {}),
            ...(dirty.margin ? { margin } : {}),
            ...(dirty.backgroundColor ? { backgroundColor } : {}),
            ...(dirty.opacity ? { opacity } : {}),
            ...(dirty.borderColor ? { borderColor } : {}),
            ...(dirty.borderWidth ? { borderWidth } : {}),
            ...(dirty.borderStyle ? { borderStyle } : {}),
            ...(dirty.borderRadius ? { borderRadius } : {}),
          })} className="px-4 py-2 rounded-md bg-blue-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  );

  return mounted && typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}


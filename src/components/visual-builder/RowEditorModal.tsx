'use client';

import React, { useEffect, useState } from 'react';

export type RowBreakpointSpec = {
  columns: number;
  gapX?: number;
  gapY?: number;
  autoRowHeight?: number;
};

export type RowSpec = {
  desktop: RowBreakpointSpec;
  tablet: RowBreakpointSpec;
  mobile: RowBreakpointSpec;
};

export default function RowEditorModal({
  rowId,
  open,
  initial,
  onClose,
  onSave,
}: {
  rowId: string;
  open: boolean;
  initial: RowSpec;
  onClose: () => void;
  onSave: (spec: RowSpec) => void;
}) {
  const [spec, setSpec] = useState<RowSpec>(initial);

  useEffect(() => {
    if (open) setSpec(initial);
  }, [open, initial]);

  if (!open) return null;

  const Field = ({
    label,
    value,
    onChange,
    min = 0,
  }: { label: string; value: number | undefined; onChange: (n: number) => void; min?: number }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        min={min}
        value={value ?? 0}
        onChange={(e) => onChange(Number.parseInt(e.target.value || '0') || 0)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const Section = ({ title, bp }: { title: string; bp: keyof RowSpec }) => (
    <div className="border rounded-md p-3">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="grid grid-cols-4 gap-3">
        <Field label="Columns" min={1} value={spec[bp].columns} onChange={(n) => setSpec({ ...spec, [bp]: { ...spec[bp], columns: Math.max(1, n) } })} />
        <Field label="Gap X" value={spec[bp].gapX ?? 0} onChange={(n) => setSpec({ ...spec, [bp]: { ...spec[bp], gapX: Math.max(0, n) } })} />
        <Field label="Gap Y" value={spec[bp].gapY ?? 0} onChange={(n) => setSpec({ ...spec, [bp]: { ...spec[bp], gapY: Math.max(0, n) } })} />
        <Field label="Auto Row Height" value={spec[bp].autoRowHeight ?? 0} onChange={(n) => setSpec({ ...spec, [bp]: { ...spec[bp], autoRowHeight: Math.max(0, n) } })} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-8 pointer-events-none">
      <div className="w-[560px] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 pointer-events-auto max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Editar Row {rowId}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-3">
          <Section title="Desktop" bp="desktop" />
          <Section title="Tablet" bp="tablet" />
          <Section title="Mobile" bp="mobile" />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">Cancelar</button>
          <button onClick={() => onSave(spec)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
        </div>
      </div>
    </div>
  );
}


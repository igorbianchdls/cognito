"use client";

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

type Linha = { conta: string; valor: number };
type Secao = { nome: string; linhas: Linha[] };

export default function BPTabela({
  title,
  secoes,
  className,
}: {
  title: string;
  secoes: Secao[];
  className?: string;
}) {
  const totalGeral = useMemo(
    () => secoes.reduce((acc, s) => acc + s.linhas.reduce((a, l) => a + Number(l.valor || 0), 0), 0),
    [secoes]
  );

  const formatBRL = (n?: number) => (Number(n || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  const expandAll = () => {
    const next: Record<string, boolean> = {};
    secoes.forEach((s, i) => { next[`${s.nome}-${i}`] = false; });
    setCollapsed(next);
  };
  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    secoes.forEach((s, i) => { next[`${s.nome}-${i}`] = true; });
    setCollapsed(next);
  };

  return (
    <div className={className}>
      <div className="text-lg font-semibold mb-3 text-gray-800">{title}</div>
      <div className="flex items-center justify-end gap-2 mb-2">
        <button onClick={expandAll} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">Expandir tudo</button>
        <button onClick={collapseAll} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">Contrair tudo</button>
      </div>

      <div className="space-y-4">
        {secoes.map((sec, i) => {
          const totalSec = sec.linhas.reduce((a, l) => a + Number(l.valor || 0), 0);
          const key = `${sec.nome}-${i}`;
          const isCollapsed = !!collapsed[key];
          return (
            <div key={key} className="border border-gray-200 rounded">
              <button onClick={() => toggle(key)} className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{sec.nome}</span>
                </div>
                <div className="text-sm font-semibold text-gray-800">{formatBRL(totalSec)}</div>
              </button>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="text-gray-600">
                      <tr>
                        <th className="text-left px-3 py-2">Conta</th>
                        <th className="text-right px-3 py-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.linhas.map((l, idx) => (
                        <tr key={`${l.conta}-${idx}`} className="border-t border-gray-100">
                          <td className="px-3 py-1.5 text-gray-700">{l.conta}</td>
                          <td className="px-3 py-1.5 text-right text-gray-800">{formatBRL(Number(l.valor || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-between border-t pt-2 text-sm">
          <div className="font-semibold text-gray-700">Total {title}</div>
          <div className="font-bold text-gray-900">{formatBRL(totalGeral)}</div>
        </div>
      </div>
    </div>
  );
}

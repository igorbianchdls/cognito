"use client";

import React from 'react';

export default function WaterfallDRE({
  receita,
  cogs,
  opex,
  lucro,
  height = 220,
}: {
  receita: number;
  cogs: number; // negativo
  opex: number; // negativo
  lucro: number; // final
  height?: number;
}) {
  // Calcular cumulativo
  const steps = [
    { id: 'Receita', color: '#10b981', from: 0, to: receita },
    { id: 'COGS', color: '#ef4444', from: receita, to: receita + cogs },
    { id: 'Opex', color: '#6366f1', from: receita + cogs, to: receita + cogs + opex },
    { id: 'Resultado', color: '#2563eb', from: 0, to: lucro },
  ];
  const values = steps.map(s => Math.abs(s.to - s.from)).concat(Math.abs(lucro), Math.abs(receita));
  const maxVal = Math.max(1, ...values);

  const W = 520;
  const H = height;
  const padX = 24;
  const padY = 18;
  const barW = 60;
  const gap = 36;

  const scaleY = (v: number) => (v / maxVal) * (H - padY * 2);
  const baseY = (y: number) => H - padY - y;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Waterfall DRE">
      {steps.map((s, i) => {
        const x = padX + i * (barW + gap);
        const fromH = scaleY(Math.max(0, s.from));
        const toH = scaleY(Math.max(0, s.to));
        const barH = Math.abs(toH - fromH);
        const y = baseY(Math.max(toH, fromH));
        const labelY = H - 4;
        return (
          <g key={s.id}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={s.color} opacity={0.85} />
            <text x={x + barW / 2} y={labelY} fontSize={11} textAnchor="middle" fill="#6b7280">{s.id}</text>
          </g>
        );
      })}
    </svg>
  );
}


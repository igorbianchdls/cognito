"use client";

import { AlertTriangle, ArrowDown, Info } from 'lucide-react';
import type { Insight2Item } from '@/stores/nexus/insights2Store';
import { cn } from '@/lib/utils';

interface InsightsCard2Props {
  title?: string;
  items: Insight2Item[];
  compact?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  className?: string;
  // Title typography
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
  titleMarginBottom?: number;
}

function IconForVariant({ variant }: { variant?: Insight2Item['variant'] }) {
  switch (variant) {
    case 'risk':
      return <AlertTriangle className="w-4 h-4 text-black" />;
    case 'slow':
      return <ArrowDown className="w-4 h-4 text-black" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-black" />;
  }
}

export default function InsightsCard2({ title = 'Insights', items, compact = true, backgroundColor, borderColor, borderRadius, className, titleFontFamily, titleFontSize, titleFontWeight, titleColor, titleMarginBottom }: InsightsCard2Props) {
  const padY = compact ? 'py-2' : 'py-3';
  const padX = 'px-3';

  return (
    <div
      className={cn('w-full', className)}
      style={{
        backgroundColor: backgroundColor || 'transparent',
        borderColor: borderColor || 'transparent',
        borderRadius: borderRadius ? `${borderRadius}px` : '8px',
      }}
    >
      <div
        className={cn('px-3 pt-3')}
        style={{
          fontFamily: titleFontFamily,
          fontSize: titleFontSize ? `${titleFontSize}px` : undefined,
          fontWeight: titleFontWeight as React.CSSProperties['fontWeight'],
          color: titleColor || '#111827',
          marginBottom: titleMarginBottom ?? 8,
        }}
      >
        {title}
      </div>
      <div className="px-2 pb-2">
        <ul role="list" className="flex flex-col gap-2">
          {items.map((it) => (
            <li
              role="listitem"
              key={it.id}
              className={cn('flex items-start gap-3 rounded-md bg-white border border-gray-200', padY, padX)}
            >
              <div className="shrink-0 rounded-md w-6 h-6 bg-yellow-100 flex items-center justify-center">
                <IconForVariant variant={it.variant} />
              </div>
              <div className="flex-1 text-sm text-gray-700">
                <span className="font-semibold">{it.label}: </span>
                {it.link ? (
                  it.link.url ? (
                    <a className="underline" href={it.link.url} target="_blank" rel="noreferrer">
                      {it.link.text}
                    </a>
                  ) : (
                    <span className="underline cursor-default">{it.link.text}</span>
                  )
                ) : null}
                {it.tail ? <span>{' '}{it.tail}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

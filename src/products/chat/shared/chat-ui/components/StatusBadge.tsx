"use client";

import React from 'react';
import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  label?: string;
};

export default function StatusBadge({ label = 'Latest' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
        'bg-emerald-100 text-emerald-800'
      )}
    >
      {label}
    </span>
  );
}


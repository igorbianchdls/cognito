"use client";

import React from 'react';
import { getSandboxStatusClasses, getSandboxStatusLabel, type SandboxStatus } from '@/chat/sandbox';
import { Monitor } from 'lucide-react';

type SandboxStatusBadgeProps = {
  status: SandboxStatus;
};

export default function SandboxStatusBadge({ status }: SandboxStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${getSandboxStatusClasses(status)}`}>
      <Monitor className="h-3.5 w-3.5" />
      Computador: {getSandboxStatusLabel(status)}
    </span>
  );
}

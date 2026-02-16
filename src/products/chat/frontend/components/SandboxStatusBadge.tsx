"use client";

import React from 'react';
import { getSandboxStatusClasses, getSandboxStatusLabel, type SandboxStatus } from '@/products/chat/frontend/lib/sandboxStatus';

type SandboxStatusBadgeProps = {
  status: SandboxStatus;
};

export default function SandboxStatusBadge({ status }: SandboxStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${getSandboxStatusClasses(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      Sandbox: {getSandboxStatusLabel(status)}
    </span>
  );
}

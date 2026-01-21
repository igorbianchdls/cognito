"use client";

import React from 'react';
import { MoreHorizontal } from 'lucide-react';

type SandboxHeaderProps = {
  title?: string;
};

export default function SandboxHeader({ title = 'Sandbox' }: SandboxHeaderProps) {
  return (
    <div className="flex items-center justify-between h-12 border-b px-4">
      <div className="text-sm font-medium text-gray-700">{title}</div>
      <button type="button" className="text-gray-500 hover:text-gray-700">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
}


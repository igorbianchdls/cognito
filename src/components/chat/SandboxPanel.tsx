"use client";

import React from 'react';
import SandboxHeader from './SandboxHeader';
import SandboxBody from './SandboxBody';

type SandboxPanelProps = {
  className?: string;
  style?: React.CSSProperties;
};

export default function SandboxPanel({ className, style }: SandboxPanelProps) {
  return (
    <div
      className={`h-full min-h-0 w-full overflow-hidden grid grid-rows-[auto_1fr] border-l border-gray-200 ${
        className ?? ''
      }`}
      style={style}
    >
      <SandboxHeader />
      <SandboxBody />
    </div>
  );
}

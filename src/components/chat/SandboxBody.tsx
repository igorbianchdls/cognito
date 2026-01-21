"use client";

import React from 'react';

type SandboxBodyProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

export default function SandboxBody({ className, style, children }: SandboxBodyProps) {
  return (
    <div className={`min-h-0 overflow-y-auto p-4 ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}


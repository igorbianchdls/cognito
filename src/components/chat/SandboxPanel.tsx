"use client";

import React from 'react';

type SandboxPanelProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

// Minimal container for the Sandbox area. UI internals will be added later.
export default function SandboxPanel({ className, style, children }: SandboxPanelProps) {
  return (
    <div className={`h-full min-h-0 w-full overflow-hidden ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}


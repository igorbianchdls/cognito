"use client";

import React from 'react';

type ChatPanelProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

// Minimal container for the Chat area. UI internals will be added later.
export default function ChatPanel({ className, style, children }: ChatPanelProps) {
  return (
    <div className={`h-full min-h-0 w-full overflow-hidden ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}


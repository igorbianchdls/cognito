"use client";

import React from 'react';
import FileExplorer from '../file-explorer/FileExplorer';

type SandboxBodyProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

export default function SandboxBody({ className, style, children, chatId }: SandboxBodyProps & { chatId?: string }) {
  return (
    <div className={`min-h-0 overflow-hidden ${className ?? ''}`} style={style}>
      <FileExplorer chatId={chatId} />
      {children}
    </div>
  );
}

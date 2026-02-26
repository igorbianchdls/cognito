"use client";

import React from 'react';
import FileExplorer from '@/components/file-explorer/FileExplorer';
import { useStore } from '@nanostores/react';
import { $sandboxActiveTab } from '@/chat/sandbox';
import JsonRenderPreview from './json-render/JsonRenderPreview';

type SandboxBodyProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

export default function SandboxBody({ className, style, children, chatId }: SandboxBodyProps & { chatId?: string }) {
  const active = useStore($sandboxActiveTab);
  return (
    <div className={`ui-text min-h-0 overflow-hidden ${className ?? ''}`} style={style}>
      {active === 'code' && <FileExplorer chatId={chatId} />}
      {(active === 'preview' || active === 'dashboard') && <JsonRenderPreview chatId={chatId} />}
      {children}
    </div>
  );
}

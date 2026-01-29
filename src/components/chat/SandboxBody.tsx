"use client";

import React from 'react';
import FileExplorer from '../file-explorer/FileExplorer';
import { useStore } from '@nanostores/react';
import { $sandboxActiveTab } from '@/stores/chat/sandboxStore';
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
      {active === 'preview' && <JsonRenderPreview chatId={chatId} />}
      {active === 'console' && (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">Console (em breve)</div>
      )}
      {children}
    </div>
  );
}

"use client";

import React from 'react';
import FileExplorer from '@/components/file-explorer/FileExplorer';
import { useStore } from '@nanostores/react';
import { $sandboxActiveTab } from '@/features/chat/state/sandboxStore';
import JsonRenderPreview from './json-render/JsonRenderPreview';
import DashboardPicker from './json-render/DashboardPicker';

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
      {active === 'dashboard' && (
        <DashboardPicker chatId={chatId} />
      )}
      {children}
    </div>
  );
}

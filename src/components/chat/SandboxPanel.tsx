"use client";

import React from 'react';
import SandboxHeader from './SandboxHeader';
import SandboxBody from './SandboxBody';

type SandboxPanelProps = {
  className?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
  onExpand?: () => void;
  expanded?: boolean;
};

export default function SandboxPanel({ className, style, onClose, onExpand, expanded, chatId }: SandboxPanelProps & { chatId?: string }) {
  return (
    <div
      className={`ui-text h-full min-h-0 w-full overflow-hidden grid grid-rows-[auto_1fr] border-l border-gray-200 ${
        className ?? ''
      }`}
      style={style}
    >
      <SandboxHeader onClose={onClose} onExpand={onExpand} expanded={expanded} />
      <SandboxBody chatId={chatId} />
    </div>
  );
}

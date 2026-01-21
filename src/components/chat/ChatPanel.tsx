"use client";

import React from 'react';
import ChatContainer from './ChatContainer';

type ChatPanelProps = {
  className?: string;
  style?: React.CSSProperties;
  onOpenSandbox?: () => void;
};

export default function ChatPanel({ className, style, onOpenSandbox }: ChatPanelProps) {
  return (
    <div className={`h-full min-h-0 w-full overflow-hidden ${className ?? ''}`} style={style}>
      <ChatContainer onOpenSandbox={onOpenSandbox} />
    </div>
  );
}

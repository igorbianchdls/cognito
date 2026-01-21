"use client";

import React from 'react';
import ChatContainer from './ChatContainer';

type ChatPanelProps = {
  className?: string;
  style?: React.CSSProperties;
  onOpenSandbox?: () => void;
  withSideMargins?: boolean;
};

export default function ChatPanel({ className, style, onOpenSandbox, withSideMargins }: ChatPanelProps) {
  return (
    <div className={`h-full min-h-0 w-full overflow-hidden ${className ?? ''}`} style={style}>
      <ChatContainer onOpenSandbox={onOpenSandbox} withSideMargins={withSideMargins} />
    </div>
  );
}

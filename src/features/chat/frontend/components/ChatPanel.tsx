"use client";

import React from 'react';
import ChatContainer from './ChatContainer';

type ChatPanelProps = {
  className?: string;
  style?: React.CSSProperties;
  onOpenSandbox?: (chatId?: string) => void;
  withSideMargins?: boolean;
  // New props for routing/auto-send flow
  redirectOnFirstMessage?: boolean;
  initialMessage?: string;
  autoSendPrefill?: boolean;
  initialChatId?: string;
  autoStartSandbox?: boolean;
  initialEngine?: 'claude-sonnet' | 'claude-haiku' | 'openai-gpt5nano' | 'openai-gpt5mini';
};

export default function ChatPanel({ className, style, onOpenSandbox, withSideMargins, redirectOnFirstMessage, initialMessage, autoSendPrefill, initialChatId, autoStartSandbox, initialEngine }: ChatPanelProps) {
  return (
    <div className={`ui-text h-full min-h-0 w-full overflow-hidden ${className ?? ''}`} style={style}>
      <ChatContainer
        onOpenSandbox={onOpenSandbox}
        withSideMargins={withSideMargins}
        redirectOnFirstMessage={redirectOnFirstMessage}
        initialMessage={initialMessage}
        autoSendPrefill={autoSendPrefill}
        initialChatId={initialChatId}
        autoStartSandbox={autoStartSandbox}
        initialEngine={initialEngine}
      />
    </div>
  );
}

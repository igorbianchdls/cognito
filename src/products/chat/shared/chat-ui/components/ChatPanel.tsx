"use client";

import React from 'react';
import ChatContainer from './ChatContainer';

type ChatPanelProps = {
  className?: string;
  style?: React.CSSProperties;
  withSideMargins?: boolean;
  // New props for routing/auto-send flow
  redirectOnFirstMessage?: boolean;
  initialMessage?: string;
  autoSendPrefill?: boolean;
  initialChatId?: string;
  initialEngine?: 'claude-sonnet' | 'claude-haiku' | 'openai-gpt5' | 'openai-gpt5mini';
  runtimeKind?: 'codex' | 'agentsdk';
  workspaceOpen?: boolean;
  onToggleWorkspace?: () => void;
  onActivateArtifact?: (artifactId: string) => void;
};

export default function ChatPanel({ className, style, withSideMargins, redirectOnFirstMessage, initialMessage, autoSendPrefill, initialChatId, initialEngine, runtimeKind, workspaceOpen, onToggleWorkspace, onActivateArtifact }: ChatPanelProps) {
  return (
    <div className={`ui-text h-full min-h-0 w-full overflow-hidden ${className ?? ''}`} style={style}>
      <ChatContainer
        withSideMargins={withSideMargins}
        redirectOnFirstMessage={redirectOnFirstMessage}
        initialMessage={initialMessage}
        autoSendPrefill={autoSendPrefill}
        initialChatId={initialChatId}
        initialEngine={initialEngine}
        runtimeKind={runtimeKind}
        workspaceOpen={workspaceOpen}
        onToggleWorkspace={onToggleWorkspace}
        onActivateArtifact={onActivateArtifact}
      />
    </div>
  );
}

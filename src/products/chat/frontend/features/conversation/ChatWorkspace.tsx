"use client";

import { useState } from "react";

import PageContainer from "@/components/layout/PageContainer";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatPanel, SandboxPanel } from "@/chat/ui";
import { useChatConversationUiState } from "@/products/chat/frontend/features/conversation/ui-state/useChatConversationUiState";

export type ChatEngineId =
  | "claude-sonnet"
  | "claude-haiku"
  | "openai-gpt5"
  | "openai-gpt5nano"
  | "openai-gpt5mini";

type ChatWorkspaceProps = {
  redirectOnFirstMessage: boolean;
  initialChatId?: string;
  initialMessage?: string;
  autoSendPrefill?: boolean;
  autoStartSandbox?: boolean;
  initialEngine?: ChatEngineId;
};

export default function ChatWorkspace({
  redirectOnFirstMessage,
  initialChatId,
  initialMessage,
  autoSendPrefill,
  autoStartSandbox,
  initialEngine,
}: ChatWorkspaceProps) {
  const {
    artifactOpen,
    setArtifactOpen,
    artifactExpanded,
    setArtifactExpanded,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useChatConversationUiState({ chatId: initialChatId });
  const [chatId, setChatId] = useState<string | null>(null);
  const splitOpen = artifactOpen && !artifactExpanded;

  return (
    <SidebarProvider open={!sidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              <div
                className={
                  splitOpen
                    ? "flex h-full min-h-0 flex-col gap-2 p-2 lg:flex-row"
                    : "h-full min-h-0"
                }
              >
                <div
                  className={[
                    artifactExpanded ? "hidden" : "h-full min-h-0 min-w-0",
                    splitOpen ? "w-full lg:basis-[25%] lg:max-w-[25%] lg:min-w-[360px] lg:py-0" : "w-full",
                  ].join(' ')}
                >
                  <div
                    className={
                      splitOpen
                        ? "h-full min-h-0 min-w-0 overflow-hidden rounded-md bg-white"
                        : "h-full min-h-0 min-w-0"
                    }
                  >
                    <ChatPanel
                      onOpenSandbox={(id) => {
                        setChatId(id ?? null);
                        setArtifactOpen(true);
                        setArtifactExpanded(false);
                      }}
                      withSideMargins={!artifactOpen}
                      redirectOnFirstMessage={redirectOnFirstMessage}
                      initialChatId={initialChatId}
                      initialMessage={initialMessage}
                      autoSendPrefill={autoSendPrefill}
                      autoStartSandbox={autoStartSandbox}
                      initialEngine={initialEngine}
                    />
                  </div>
                </div>
                <div
                  className={[
                    !artifactOpen ? "hidden" : "h-full min-h-0 min-w-0",
                    splitOpen ? "w-full lg:basis-[75%] lg:min-w-0" : "w-full",
                  ].join(' ')}
                >
                  <div
                    className={
                      splitOpen
                        ? "h-full min-h-0 min-w-0 overflow-hidden rounded-md border border-gray-200 bg-white"
                        : "h-full min-h-0 min-w-0"
                    }
                  >
                    <SandboxPanel
                      className={splitOpen ? "border-0 rounded-none" : undefined}
                      chatId={chatId ?? undefined}
                      onClose={() => {
                        setArtifactOpen(false);
                        setArtifactExpanded(false);
                      }}
                      onExpand={() => setArtifactExpanded(!artifactExpanded)}
                      expanded={artifactExpanded}
                    />
                  </div>
                </div>
              </div>
            </PageContainer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

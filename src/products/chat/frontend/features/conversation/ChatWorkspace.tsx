"use client";

import PageContainer from "@/components/layout/PageContainer";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatPanel } from "@/chat/ui";
import { useChatConversationUiState } from "@/products/chat/frontend/features/conversation/ui-state/useChatConversationUiState";

export type ChatEngineId =
  | "claude-sonnet"
  | "claude-haiku"
  | "openai-gpt5"
  | "openai-gpt5nano"
  | "openai-gpt5mini";

export type ChatRuntimeKind = "codex" | "agentsdk";

type ChatWorkspaceProps = {
  redirectOnFirstMessage: boolean;
  initialChatId?: string;
  initialMessage?: string;
  autoSendPrefill?: boolean;
  initialEngine?: ChatEngineId;
  runtimeKind?: ChatRuntimeKind;
};

export default function ChatWorkspace({
  redirectOnFirstMessage,
  initialChatId,
  initialMessage,
  autoSendPrefill,
  initialEngine,
  runtimeKind = "codex",
}: ChatWorkspaceProps) {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useChatConversationUiState({ chatId: initialChatId });

  return (
    <SidebarProvider open={!sidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              <div className="h-full min-h-0 p-0">
                <ChatPanel
                  withSideMargins
                  redirectOnFirstMessage={redirectOnFirstMessage}
                  initialChatId={initialChatId}
                  initialMessage={initialMessage}
                  autoSendPrefill={autoSendPrefill}
                  initialEngine={initialEngine}
                  runtimeKind={runtimeKind}
                />
              </div>
            </PageContainer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useEffect } from "react";

import PageContainer from "@/components/layout/PageContainer";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatPanel } from "@/chat/ui";
import { useChatConversationUiState } from "@/products/chat/frontend/features/conversation/ui-state/useChatConversationUiState";
import { ChatArtifactWorkspacePanel } from "@/products/chat/frontend/features/conversation/ChatArtifactWorkspacePanel";

export type ChatEngineId =
  | "claude-sonnet"
  | "claude-haiku"
  | "openai-gpt5"
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
    workspaceOpen,
    setWorkspaceOpen,
    selectedArtifactId,
    setSelectedArtifactId,
  } = useChatConversationUiState({ chatId: initialChatId });

  useEffect(() => {
    if (!workspaceOpen) return;
    setSidebarCollapsed(true);
  }, [workspaceOpen, setSidebarCollapsed]);

  return (
    <SidebarProvider open={!sidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className={workspaceOpen ? "min-w-0 basis-1/4 border-r border-[#E6E6E2]" : "min-w-0 flex-1"}>
            <PageContainer>
              <div className="h-full min-h-0 p-0">
                <ChatPanel
                  withSideMargins={!workspaceOpen}
                  redirectOnFirstMessage={redirectOnFirstMessage}
                  initialChatId={initialChatId}
                  initialMessage={initialMessage}
                  autoSendPrefill={autoSendPrefill}
                  initialEngine={initialEngine}
                  runtimeKind={runtimeKind}
                  workspaceOpen={workspaceOpen}
                  onToggleWorkspace={() => setWorkspaceOpen(!workspaceOpen)}
                  onActivateArtifact={(artifactId) => {
                    setSelectedArtifactId(artifactId)
                    setWorkspaceOpen(true)
                  }}
                />
              </div>
            </PageContainer>
          </div>
          {workspaceOpen ? (
            <div className="min-w-0 basis-3/4 bg-[#F7F7F6]">
              <ChatArtifactWorkspacePanel
                selectedArtifactId={selectedArtifactId}
                onSelectArtifactId={setSelectedArtifactId}
              />
            </div>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

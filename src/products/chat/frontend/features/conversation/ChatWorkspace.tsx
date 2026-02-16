"use client";

import { useState } from "react";

import PageContainer from "@/components/layout/PageContainer";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ChatPanel from "@/products/chat/frontend/components/ChatPanel";
import SandboxPanel from "@/products/chat/frontend/components/SandboxPanel";

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
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxExpanded, setSandboxExpanded] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              <div
                className={
                  showSandbox && !sandboxExpanded
                    ? "grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
                    : "grid h-full grid-cols-1"
                }
              >
                <div className={sandboxExpanded ? "hidden" : "h-full min-h-0 min-w-0"}>
                  <ChatPanel
                    onOpenSandbox={(id) => {
                      setChatId(id ?? null);
                      setShowSandbox(true);
                      setSandboxExpanded(false);
                    }}
                    withSideMargins={!showSandbox}
                    redirectOnFirstMessage={redirectOnFirstMessage}
                    initialChatId={initialChatId}
                    initialMessage={initialMessage}
                    autoSendPrefill={autoSendPrefill}
                    autoStartSandbox={autoStartSandbox}
                    initialEngine={initialEngine}
                  />
                </div>
                <div className={!showSandbox ? "hidden" : "h-full min-h-0 min-w-0 p-2"}>
                  <SandboxPanel
                    chatId={chatId ?? undefined}
                    onClose={() => {
                      setShowSandbox(false);
                      setSandboxExpanded(false);
                    }}
                    onExpand={() => setSandboxExpanded(!sandboxExpanded)}
                    expanded={sandboxExpanded}
                  />
                </div>
              </div>
            </PageContainer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

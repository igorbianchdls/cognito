"use client";

import { useState } from "react";

import PageContainer from "@/components/layout/PageContainer";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatPanel, SandboxPanel } from "@/chat/ui";

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
  const splitOpen = showSandbox && !sandboxExpanded;

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              <div className={splitOpen ? "flex h-full min-h-0 flex-col lg:flex-row" : "h-full min-h-0"}>
                <div
                  className={[
                    sandboxExpanded ? "hidden" : "h-full min-h-0 min-w-0",
                    splitOpen ? "w-full lg:basis-[42%] lg:max-w-[42%] lg:min-w-[360px]" : "w-full",
                  ].join(' ')}
                >
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
                <div
                  className={[
                    !showSandbox ? "hidden" : "h-full min-h-0 min-w-0 p-2",
                    splitOpen ? "w-full lg:basis-[58%] lg:min-w-0" : "w-full",
                  ].join(' ')}
                >
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

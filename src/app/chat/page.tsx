"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import PageContainer from "@/components/chat/PageContainer";
import ChatPanel from "@/components/chat/ChatPanel";
import SandboxPanel from "@/components/chat/SandboxPanel";

export default function ChatRoutePage() {
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxExpanded, setSandboxExpanded] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  return (
    <SidebarProvider>
      {/* Left sidebar with right border by default */}
      <SidebarShadcn />
      {/* Right content area */}
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              {/* Always mounted panels; toggle visibility/layout only */}
              <div className={showSandbox && !sandboxExpanded ? 'grid h-full grid-cols-1 lg:grid-cols-[1fr_2fr]' : 'grid h-full grid-cols-1'}>
                {/* Chat cell */}
                <div className={sandboxExpanded ? 'hidden' : 'h-full min-h-0'}>
                  <ChatPanel
                    onOpenSandbox={(id) => { setChatId(id); setShowSandbox(true); setSandboxExpanded(false); }}
                    withSideMargins={!showSandbox}
                  />
                </div>
                {/* Sandbox cell (kept mounted; hidden when closed) */}
                <div className={!showSandbox ? 'hidden' : 'h-full min-h-0 p-2'}>
                  <SandboxPanel
                    chatId={chatId ?? undefined}
                    onClose={() => { setShowSandbox(false); setSandboxExpanded(false); }}
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

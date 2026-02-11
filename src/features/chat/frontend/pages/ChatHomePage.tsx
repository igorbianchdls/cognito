"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import PageContainer from "@/components/layout/PageContainer";
import ChatPanel from "@/features/chat/frontend/components/ChatPanel";
import SandboxPanel from "@/features/chat/frontend/components/SandboxPanel";

export default function ChatRoutePage() {
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxExpanded, setSandboxExpanded] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  return (
    <SidebarProvider>
      {/* Left sidebar with right border by default */}
      <SidebarShadcn showHeaderTrigger={false} />
      {/* Right content area */}
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              {/* Always mounted panels; toggle visibility/layout only */}
              <div className={showSandbox && !sandboxExpanded ? 'grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]' : 'grid h-full grid-cols-1'}>
                {/* Chat cell */}
                <div className={sandboxExpanded ? 'hidden' : 'h-full min-h-0 min-w-0'}>
                  <ChatPanel
                    onOpenSandbox={(id) => { setChatId(id ?? null); setShowSandbox(true); setSandboxExpanded(false); }}
                    withSideMargins={!showSandbox}
                    // Redirect to /chat/[id] on first message
                    redirectOnFirstMessage={true}
                  />
                </div>
                {/* Sandbox cell (kept mounted; hidden when closed) */}
                <div className={!showSandbox ? 'hidden' : 'h-full min-h-0 min-w-0 p-2'}>
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

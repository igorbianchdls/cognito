"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import PageContainer from "@/components/chat/PageContainer";
import ChatPanel from "@/components/chat/ChatPanel";
import SandboxPanel from "@/components/chat/SandboxPanel";

export default function ChatRoutePage() {
  const [showSandbox, setShowSandbox] = useState(false);

  return (
    <SidebarProvider>
      {/* Left sidebar with right border by default */}
      <SidebarShadcn />
      {/* Right content area */}
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              {showSandbox ? (
                <div className="grid h-full grid-cols-1 lg:grid-cols-2">
                  <div className="h-full min-h-0">
                    <ChatPanel onOpenSandbox={() => setShowSandbox(true)} />
                  </div>
                  <div className="h-full min-h-0">
                    <SandboxPanel onClose={() => setShowSandbox(false)} />
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <ChatPanel onOpenSandbox={() => setShowSandbox(true)} />
                </div>
              )}
            </PageContainer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

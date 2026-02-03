"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from 'next/navigation';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import PageContainer from "@/components/chat/PageContainer";
import ChatPanel from "@/components/chat/ChatPanel";
import SandboxPanel from "@/components/chat/SandboxPanel";

export default function ChatRoutePageWithId() {
  const params = useParams();
  const urlId = (typeof params?.id === 'string') ? params.id : Array.isArray(params?.id) ? params?.id?.[0] : undefined;
  const search = useSearchParams();
  const auto = search?.get('auto') === '1';

  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxExpanded, setSandboxExpanded] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!urlId) return;
    try {
      const key = `first:${urlId}`;
      const raw = sessionStorage.getItem(key) || '';
      if (raw) {
        setPrefill(raw);
        sessionStorage.removeItem(key);
      }
    } catch {
      // ignore storage errors
    }
  }, [urlId]);

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <PageContainer>
              <div className={showSandbox && !sandboxExpanded ? 'grid h-full grid-cols-1 lg:grid-cols-[1fr_2fr]' : 'grid h-full grid-cols-1'}>
                <div className={sandboxExpanded ? 'hidden' : 'h-full min-h-0'}>
                  <ChatPanel
                    onOpenSandbox={(id) => { setChatId(id ?? null); setShowSandbox(true); setSandboxExpanded(false); }}
                    withSideMargins={!showSandbox}
                    // do not redirect here; we're already in /chat/[id]
                    redirectOnFirstMessage={false}
                    initialMessage={prefill}
                    autoSendPrefill={Boolean(prefill)}
                    initialChatId={urlId}
                    autoStartSandbox={auto}
                  />
                </div>
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

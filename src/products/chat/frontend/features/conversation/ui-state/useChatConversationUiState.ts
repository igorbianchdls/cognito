"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useStore } from "@nanostores/react";

import { $sandboxActiveTab, sandboxActions, type SandboxTab } from "@/chat/sandbox";

type StoredConversationUiState = {
  artifactOpen?: boolean;
  artifactExpanded?: boolean;
  artifactTab?: SandboxTab;
};

type Options = {
  chatId?: string;
};

const STORAGE_PREFIX = "chat-ui:";

function parseBool(input: string | null | undefined): boolean | null {
  if (input == null) return null;
  const v = String(input).trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return null;
}

function parseTab(input: string | null | undefined): SandboxTab | null {
  const v = String(input || "").trim().toLowerCase();
  return v === "preview" || v === "code" || v === "dashboard" ? (v as SandboxTab) : null;
}

function readStoredState(chatId?: string): StoredConversationUiState | null {
  if (!chatId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${chatId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConversationUiState;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function useChatConversationUiState({ chatId }: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = useStore($sandboxActiveTab);

  const [artifactOpen, setArtifactOpen] = React.useState(false);
  const [artifactExpanded, setArtifactExpanded] = React.useState(false);
  const hydratedRef = React.useRef(false);
  const applyingUrlRef = React.useRef(false);

  const urlSnapshot = React.useMemo(() => searchParams?.toString() ?? "", [searchParams]);

  React.useEffect(() => {
    const qs = searchParams;
    const urlOpen = parseBool(qs?.get("artifact"));
    const urlExpanded = parseBool(qs?.get("artifactExpanded"));
    const urlTab = parseTab(qs?.get("artifactTab"));
    const hasUrlState = urlOpen !== null || urlExpanded !== null || urlTab !== null;

    if (hasUrlState) {
      applyingUrlRef.current = true;
      if (urlOpen !== null) setArtifactOpen(urlOpen);
      if (urlExpanded !== null) setArtifactExpanded(urlExpanded);
      if (urlTab && urlTab !== activeTab) sandboxActions.setActiveTab(urlTab);
      hydratedRef.current = true;
      queueMicrotask(() => {
        applyingUrlRef.current = false;
      });
      return;
    }

    if (hydratedRef.current) return;
    const stored = readStoredState(chatId);
    if (stored) {
      if (typeof stored.artifactOpen === "boolean") setArtifactOpen(stored.artifactOpen);
      if (typeof stored.artifactExpanded === "boolean") setArtifactExpanded(stored.artifactExpanded);
      if (stored.artifactTab && stored.artifactTab !== activeTab) sandboxActions.setActiveTab(stored.artifactTab);
    }
    hydratedRef.current = true;
  }, [searchParams, chatId, activeTab]);

  React.useEffect(() => {
    if (!hydratedRef.current || applyingUrlRef.current) return;
    if (!chatId || typeof window === "undefined") return;
    const nextState: StoredConversationUiState = {
      artifactOpen,
      artifactExpanded,
      artifactTab: activeTab,
    };
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${chatId}`, JSON.stringify(nextState));
    } catch {
      // ignore quota/storage errors
    }
  }, [chatId, artifactOpen, artifactExpanded, activeTab]);

  React.useEffect(() => {
    if (!hydratedRef.current || applyingUrlRef.current) return;
    if (!pathname) return;

    const current = new URLSearchParams(urlSnapshot);
    const next = new URLSearchParams(urlSnapshot);

    if (artifactOpen) {
      next.set("artifact", "1");
      next.set("artifactTab", activeTab);
      if (artifactExpanded) next.set("artifactExpanded", "1");
      else next.delete("artifactExpanded");
    } else {
      next.delete("artifact");
      next.delete("artifactTab");
      next.delete("artifactExpanded");
    }

    if (current.toString() === next.toString()) return;
    const nextUrl = next.toString() ? `${pathname}?${next.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [artifactOpen, artifactExpanded, activeTab, pathname, router, urlSnapshot]);

  return {
    artifactOpen,
    setArtifactOpen,
    artifactExpanded,
    setArtifactExpanded,
    artifactTab: activeTab,
    setArtifactTab: (tab: SandboxTab) => sandboxActions.setActiveTab(tab),
  };
}

export default useChatConversationUiState;

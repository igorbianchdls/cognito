"use client";

import React from "react";

type StoredConversationUiState = {
  sidebarCollapsed?: boolean;
  workspaceOpen?: boolean;
  selectedArtifactId?: string | null;
};

type Options = {
  chatId?: string;
};

const STORAGE_PREFIX = "chat-ui:";
const GLOBAL_SIDEBAR_KEY = "ui:sidebar:collapsed";

function parseBool(input: string | null | undefined): boolean | null {
  if (input == null) return null;
  const v = String(input).trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return null;
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

function readGlobalSidebarCollapsed(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GLOBAL_SIDEBAR_KEY);
    return parseBool(raw);
  } catch {
    return null;
  }
}

export function useChatConversationUiState({ chatId }: Options) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [workspaceOpen, setWorkspaceOpen] = React.useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = React.useState<string | null>(null);
  const hydratedRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readStoredState(chatId);
    const restoredSidebarCollapsed =
      typeof stored?.sidebarCollapsed === "boolean"
        ? stored.sidebarCollapsed
        : readGlobalSidebarCollapsed();
    if (typeof restoredSidebarCollapsed === "boolean") {
      setSidebarCollapsed(restoredSidebarCollapsed);
    }
    if (typeof stored?.workspaceOpen === "boolean") {
      setWorkspaceOpen(stored.workspaceOpen);
    }
    if (typeof stored?.selectedArtifactId === "string" && stored.selectedArtifactId.trim()) {
      setSelectedArtifactId(stored.selectedArtifactId);
    } else {
      setSelectedArtifactId(null);
    }

    if (hydratedRef.current) return;
    hydratedRef.current = true;
  }, [chatId]);

  React.useEffect(() => {
    if (!hydratedRef.current) return;
    if (!chatId || typeof window === "undefined") return;
    const nextState: StoredConversationUiState = {
      sidebarCollapsed,
      workspaceOpen,
      selectedArtifactId,
    };
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${chatId}`, JSON.stringify(nextState));
    } catch {
      // ignore quota/storage errors
    }
  }, [chatId, sidebarCollapsed, workspaceOpen, selectedArtifactId]);

  React.useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(GLOBAL_SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      // ignore quota/storage errors
    }
  }, [sidebarCollapsed]);

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    workspaceOpen,
    setWorkspaceOpen,
    selectedArtifactId,
    setSelectedArtifactId,
  };
}

export default useChatConversationUiState;

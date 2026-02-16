"use client";

import { useEffect, useState } from "react";

import type { ChatEngineId } from "@/products/chat/frontend/features/conversation/ChatWorkspace";

export function useChatPrefill(chatId?: string) {
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const [prefillEngine, setPrefillEngine] = useState<ChatEngineId | undefined>(undefined);

  useEffect(() => {
    if (!chatId) return;

    try {
      const key = `first:${chatId}`;
      const raw = sessionStorage.getItem(key) || "";
      if (raw) {
        setPrefill(raw);
        sessionStorage.removeItem(key);
      }

      const rawEngine = sessionStorage.getItem(`firstEngine:${chatId}`) || "";
      if (
        rawEngine === "claude-sonnet" ||
        rawEngine === "claude-haiku" ||
        rawEngine === "openai-gpt5" ||
        rawEngine === "openai-gpt5nano" ||
        rawEngine === "openai-gpt5mini"
      ) {
        setPrefillEngine(rawEngine);
        sessionStorage.removeItem(`firstEngine:${chatId}`);
      }
    } catch {
      // Ignore storage errors.
    }
  }, [chatId]);

  return { prefill, prefillEngine };
}

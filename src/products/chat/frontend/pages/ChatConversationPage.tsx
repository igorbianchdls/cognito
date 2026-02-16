"use client";

import { useParams, useSearchParams } from "next/navigation";

import ChatWorkspace from "@/products/chat/frontend/features/conversation/ChatWorkspace";
import { useChatPrefill } from "@/products/chat/frontend/features/conversation/useChatPrefill";

export default function ChatConversationPage() {
  const params = useParams();
  const urlId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id?.[0]
        : undefined;
  const search = useSearchParams();
  const auto = search?.get("auto") === "1";

  const { prefill, prefillEngine } = useChatPrefill(urlId);

  return (
    <ChatWorkspace
      redirectOnFirstMessage={false}
      initialChatId={urlId}
      initialMessage={prefill}
      autoSendPrefill={Boolean(prefill)}
      autoStartSandbox={auto}
      initialEngine={prefillEngine}
    />
  );
}

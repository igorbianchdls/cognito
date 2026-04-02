"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { sandboxActions } from "@/chat/sandbox";
import ChatWorkspace from "@/products/chat/frontend/features/conversation/ChatWorkspace";
import { useChatPrefill } from "@/products/chat/frontend/features/conversation/useChatPrefill";
import type { ChatRuntimeKind } from "@/products/chat/frontend/features/conversation/ChatWorkspace";

export default function ChatConversationPage({ runtimeKind = "codex" }: { runtimeKind?: ChatRuntimeKind }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id?.[0]
        : undefined;
  const { prefill, prefillEngine } = useChatPrefill(urlId);
  const runtimeDefaultEngine = runtimeKind === "agentsdk" ? "claude-haiku" : "openai-gpt5mini";

  useEffect(() => {
    if (!urlId) return;
    const artifactPath = (searchParams.get("artifactPath") || "").trim();
    const isSupportedArtifact =
      artifactPath.startsWith("/vercel/sandbox/") &&
      (artifactPath.endsWith(".dsl") || artifactPath.endsWith(".tsx"));
    if (!artifactPath || !isSupportedArtifact) return;
    sandboxActions.setPreviewPath(artifactPath);
    sandboxActions.setActiveTab("preview");
    try {
      window.localStorage.setItem(`previewDslPath:${urlId}`, artifactPath);
    } catch {
      // noop
    }
  }, [searchParams, urlId]);

  return (
    <ChatWorkspace
      redirectOnFirstMessage={false}
      initialChatId={urlId}
      initialMessage={prefill}
      autoSendPrefill={Boolean(prefill)}
      initialEngine={prefillEngine || runtimeDefaultEngine}
      runtimeKind={runtimeKind}
    />
  );
}

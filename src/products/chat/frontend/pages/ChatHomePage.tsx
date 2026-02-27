"use client";

import ChatWorkspace from "@/products/chat/frontend/features/conversation/ChatWorkspace";
import type { ChatRuntimeKind } from "@/products/chat/frontend/features/conversation/ChatWorkspace";

export default function ChatHomePage({ runtimeKind = "codex" }: { runtimeKind?: ChatRuntimeKind }) {
  const initialEngine = runtimeKind === "agentsdk" ? "claude-haiku" : "openai-gpt5mini";
  return <ChatWorkspace redirectOnFirstMessage runtimeKind={runtimeKind} initialEngine={initialEngine} />;
}

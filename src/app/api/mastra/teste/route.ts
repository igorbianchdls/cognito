import { NextRequest } from "next/server";
import { testAgent } from "@/app/bigquery-test/agent/testAgent";
import type { CoreMessage } from "ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    const isCoreMessageArray = (val: unknown): val is CoreMessage[] => {
      const isRole = (r: unknown): r is CoreMessage['role'] =>
        r === "user" || r === "assistant" || r === "system";
      return (
        Array.isArray(val) &&
        val.every((m) => {
          if (!m || typeof m !== "object") return false;
          const role = (m as { role?: unknown }).role;
          const content = (m as { content?: unknown }).content;
          return isRole(role) && typeof content === "string";
        })
      );
    };

    let messages: CoreMessage[] | null = null;
    if (typeof body === "object" && body !== null && "messages" in body) {
      const maybeMessages = (body as { messages?: unknown }).messages;
      if (isCoreMessageArray(maybeMessages)) {
        messages = maybeMessages;
      }
    }

    if (!messages) {
      // Backward compatibility: support { prompt }
      const prompt =
        typeof body === "object" && body !== null && "prompt" in body
          ? (body as { prompt?: unknown }).prompt
          : undefined;
      if (typeof prompt === "string" && prompt.trim().length > 0) {
        messages = [{ role: "user", content: prompt }];
      }
    }

    if (!messages || messages.length === 0) {
      return Response.json({ error: "Invalid messages or prompt" }, { status: 400 });
    }

    const result = await testAgent.generate(messages);

    const resUnknown: unknown = result;
    let text = "";
    if (typeof resUnknown === "object" && resUnknown !== null && "text" in resUnknown) {
      const t = (resUnknown as { text?: unknown }).text;
      if (typeof t === "string") text = t;
    }
    let model: string | undefined = undefined;
    if (typeof resUnknown === "object" && resUnknown !== null && "response" in resUnknown) {
      const resp = (resUnknown as { response?: unknown }).response;
      if (typeof resp === "object" && resp !== null && "modelId" in resp) {
        const mid = (resp as { modelId?: unknown }).modelId;
        if (typeof mid === "string") model = mid;
      }
    }

    return Response.json({ text, model });
  } catch (err: unknown) {
    console.error("Mastra agent error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: "ok" });
}

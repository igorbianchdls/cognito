import { NextRequest } from "next/server";
import { dcrWorkflow } from "@/app/bigquery-test/agent/dcrWorkflow";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const question =
      typeof body === "object" && body !== null && "question" in body
        ? (body as { question?: unknown }).question
        : undefined;
    if (typeof question !== "string" || question.trim().length === 0) {
      return Response.json({ error: "Invalid question" }, { status: 400 });
    }

    const run = await dcrWorkflow.createRunAsync();
    const streamResult = await run.stream({ inputData: { question } });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.fullStream) {
            // Send relevant events to client
            if (
              chunk.type === "workflow-step-start" ||
              chunk.type === "workflow-step-finish" ||
              chunk.type === "workflow-finish"
            ) {
              const data = JSON.stringify(chunk) + "\n";
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.close();
        } catch (e) {
          const error =
            e instanceof Error ? e.message : "Stream processing error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: "ok" });
}

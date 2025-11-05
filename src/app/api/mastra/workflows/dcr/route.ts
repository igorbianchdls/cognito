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
    const out = await run.start({ inputData: { question } });
    return Response.json(out);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: "ok" });
}

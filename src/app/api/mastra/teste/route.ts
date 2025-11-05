import { NextRequest } from "next/server";
import { testAgent } from "@/lib/mastra/testAgent";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return Response.json({ error: "Invalid prompt" }, { status: 400 });
    }

    const result = await testAgent.run(prompt);
    return Response.json({ result });
  } catch (err: any) {
    console.error("Mastra agent error:", err);
    return Response.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: "ok" });
}


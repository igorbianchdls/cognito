import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core/agent";

export const drafteeAgent = new Agent({
  name: "dcr-draftee",
  instructions:
    "You write a concise, accurate first draft that directly answers the user's question. Prefer clarity over verbosity.",
  model: anthropic("claude-sonnet-4-20250514"),
});

export const criticAgent = new Agent({
  name: "dcr-critic",
  instructions:
    "You are a strict reviewer. Return 3–7 concrete bullet points listing factual gaps, unclear phrasing, missing structure, or tone issues in the provided draft. Do not rewrite the answer.",
  model: anthropic("claude-sonnet-4-20250514"),
});

export const reviewerAgent = new Agent({
  name: "dcr-reviewer",
  instructions:
    "You produce a clean final answer incorporating all critique items. Keep the reply short, clear, and actionable.",
  model: anthropic("claude-sonnet-4-20250514"),
});


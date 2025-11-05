import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core/agent";

export const testAgent = new Agent({
  name: "test-agent",
  instructions: "You are a helpful assistant.",
  // Align with existing claudeAgents
  model: anthropic("claude-sonnet-4-20250514"),
});

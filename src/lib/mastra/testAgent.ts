import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core/agent";

export const testAgent = new Agent({
  name: "test-agent",
  instructions: "You are a helpful assistant.",
  model: anthropic("claude-3-5-sonnet-latest"),
});


import { z } from "zod";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { drafteeAgent, criticAgent, reviewerAgent } from "@/app/bigquery-test/agent/dcrAgents";

const draftStep = createStep({
  id: "draft",
  inputSchema: z.object({
    question: z.string().min(1, "question is required"),
  }),
  outputSchema: z.object({
    question: z.string(),
    draft: z.string(),
    model: z.string().optional(),
  }),
  execute: async ({ input }) => {
    const res = await drafteeAgent.generate(input.question);
    const draft = await res.text;
    const model = res.response?.modelId;
    return { question: input.question, draft, model };
  },
});

const critiqueStep = createStep({
  id: "critique",
  inputSchema: z.object({
    question: z.string(),
    draft: z.string(),
    model: z.string().optional(),
  }),
  outputSchema: z.object({
    question: z.string(),
    draft: z.string(),
    critique: z.string(),
    model: z.string().optional(),
  }),
  execute: async ({ input }) => {
    const prompt = [
      "Critique the following draft for the given question.",
      "Return 3–7 bullet points of concrete improvements (facts, clarity, structure, tone).",
      "Do not rewrite the answer.",
      "",
      `Question: ${input.question}`,
      "Draft:",
      input.draft,
    ].join("\n");

    const res = await criticAgent.generate(prompt);
    const critique = await res.text;
    const model = res.response?.modelId ?? input.model;
    return { question: input.question, draft: input.draft, critique, model };
  },
});

const reviseStep = createStep({
  id: "revise",
  inputSchema: z.object({
    question: z.string(),
    draft: z.string(),
    critique: z.string(),
    model: z.string().optional(),
  }),
  outputSchema: z.object({
    draft: z.string(),
    critique: z.string(),
    final: z.string(),
    model: z.string().optional(),
  }),
  execute: async ({ input }) => {
    const prompt = [
      "Revise the DRAFT into a clean FINAL answer using ALL CRITIQUE bullets.",
      "Keep it short, clear, and actionable.",
      "",
      `Question: ${input.question}`,
      "CRITIQUE:",
      input.critique,
      "",
      "DRAFT:",
      input.draft,
    ].join("\n");

    const res = await reviewerAgent.generate(prompt);
    const finalText = await res.text;
    const model = res.response?.modelId ?? input.model;
    return { draft: input.draft, critique: input.critique, final: finalText, model };
  },
});

export const dcrWorkflow = createWorkflow({
  id: "dcr-workflow",
  inputSchema: z.object({ question: z.string().min(1) }),
  outputSchema: z.object({
    draft: z.string(),
    critique: z.string(),
    final: z.string(),
    model: z.string().optional(),
  }),
  steps: [],
})
  .then(draftStep)
  .then(critiqueStep)
  .then(reviseStep)
  .commit();


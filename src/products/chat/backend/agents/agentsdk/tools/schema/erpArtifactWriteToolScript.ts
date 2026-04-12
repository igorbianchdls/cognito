import { ARTIFACT_WRITE_TOOL_DESCRIPTION } from '@/products/chat/shared/tools/artifactToolsContract'

export const AGENTSDK_ERP_MCP_ARTIFACT_WRITE_TOOL_SCRIPT = `tool('artifact_write',${JSON.stringify(ARTIFACT_WRITE_TOOL_DESCRIPTION)}, {
  artifact_id: z.string().optional(),
  expected_version: z.number().int().positive().optional(),
  title: z.string().optional(),
  source: z.string(),
  workspace_id: z.string().optional(),
  slug: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  change_summary: z.string().optional(),
}, async (args) => callArtifactWrite(args))`;

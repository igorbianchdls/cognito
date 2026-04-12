import { ARTIFACT_READ_TOOL_DESCRIPTION } from '@/products/chat/shared/tools/artifactToolsContract'

export const AGENTSDK_ERP_MCP_ARTIFACT_READ_TOOL_SCRIPT = `tool('artifact_read',${JSON.stringify(ARTIFACT_READ_TOOL_DESCRIPTION)}, {
  artifact_id: z.string(),
  kind: z.enum(['draft', 'published']).optional(),
  version: z.number().int().positive().optional(),
}, async (args) => callArtifactRead(args))`;

import { ARTIFACT_PATCH_TOOL_DESCRIPTION } from '@/products/chat/shared/tools/artifactToolsContract'

export const AGENTSDK_ERP_MCP_ARTIFACT_PATCH_TOOL_SCRIPT = `tool('artifact_patch',${JSON.stringify(ARTIFACT_PATCH_TOOL_DESCRIPTION)}, {
  artifact_id: z.string(),
  expected_version: z.number().int().positive(),
  operation: z.object({
    type: z.enum(['replace_text', 'replace_full_source']),
    old_string: z.string().optional(),
    new_string: z.string().optional(),
    replace_all: z.boolean().optional(),
    source: z.string().optional(),
    change_summary: z.string().optional(),
  }),
}, async (args) => callArtifactPatch(args))`;

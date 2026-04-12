import { AGENTSDK_ERP_MCP_ARTIFACT_PATCH_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpArtifactPatchToolScript'
import { AGENTSDK_ERP_MCP_ARTIFACT_READ_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpArtifactReadToolScript'
import { AGENTSDK_ERP_MCP_ARTIFACT_WRITE_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpArtifactWriteToolScript'
import { AGENTSDK_ERP_MCP_CRUD_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpCrudToolScript'
import { AGENTSDK_ERP_MCP_DASHBOARD_BUILDER_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpDashboardBuilderToolScript'
import { AGENTSDK_ERP_MCP_DRIVE_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpDriveToolScript'
import { AGENTSDK_ERP_MCP_EMAIL_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpEmailToolScript'
import { AGENTSDK_ERP_MCP_ECOMMERCE_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpEcommerceToolScript'
import { AGENTSDK_ERP_MCP_MARKETING_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpMarketingToolScript'
import { AGENTSDK_ERP_MCP_SQL_EXECUTION_TOOL_SCRIPT } from '@/products/chat/backend/agents/agentsdk/tools/schema/erpSqlExecutionToolScript'

export const AGENTSDK_ERP_MCP_TOOLS_SCRIPT = [
  AGENTSDK_ERP_MCP_ARTIFACT_READ_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_ARTIFACT_WRITE_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_ARTIFACT_PATCH_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_CRUD_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_DASHBOARD_BUILDER_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_DRIVE_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_EMAIL_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_ECOMMERCE_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_MARKETING_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_SQL_EXECUTION_TOOL_SCRIPT,
].join(',\n    ')

import { AGENTSDK_ERP_MCP_CRUD_TOOL_SCRIPT } from '@/products/chat/agentsdk/tools/schema/erpCrudToolScript'
import { AGENTSDK_ERP_MCP_DOCUMENTO_TOOL_SCRIPT } from '@/products/chat/agentsdk/tools/schema/erpDocumentoToolScript'
import { AGENTSDK_ERP_MCP_DRIVE_TOOL_SCRIPT } from '@/products/chat/agentsdk/tools/schema/erpDriveToolScript'
import { AGENTSDK_ERP_MCP_EMAIL_TOOL_SCRIPT } from '@/products/chat/agentsdk/tools/schema/erpEmailToolScript'

export const AGENTSDK_ERP_MCP_TOOLS_SCRIPT = [
  AGENTSDK_ERP_MCP_CRUD_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_DOCUMENTO_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_DRIVE_TOOL_SCRIPT,
  AGENTSDK_ERP_MCP_EMAIL_TOOL_SCRIPT,
].join(',\n    ')

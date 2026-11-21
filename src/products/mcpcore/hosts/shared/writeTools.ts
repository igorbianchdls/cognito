import { actionTools } from '../../actions/catalog'
import { whatsappWrites } from '../../mcp/registerWhatsApp'
import { marketingWrites } from '../../domains/editor/executeTool'

// Tools that change data in any domain: a token without erp:write is challenged before the call.
const writes = new Set(actionTools.map(t => t.name))
export const isWriteTool = (name: unknown) => typeof name === 'string' && (writes.has(name) || whatsappWrites(name) || marketingWrites(name))

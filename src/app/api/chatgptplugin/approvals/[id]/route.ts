import { approvalRequest } from '@/products/chatgptplugin/approvals/http'
export const runtime='nodejs'
export const dynamic='force-dynamic'
async function handle(request:Request,context:{params:Promise<{id:string}>}) {
  return approvalRequest(request,(await context.params).id)
}
export const GET=handle
export const POST=handle

// Social saves through the editor's write queue (one queue, so a post never lands before the file it points to),
// on its own schema.
import { supabase } from './supabase'

export { idle, localStamp, must, onRemoteError, persist, remoteMode, toIso, workspaceReady, type WorkspaceContext } from '@/products/editor/frontend/lib/sync'
export const db = () => supabase()

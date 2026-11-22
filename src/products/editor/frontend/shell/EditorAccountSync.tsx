'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { setWorkspace } from '@/products/editor/frontend/lib/sync'
import { supabaseConfigured } from '@/products/editor/frontend/lib/supabase'
import { connectDrive } from '@/products/drive/frontend/store'
import { connectEditor } from '@/products/editor/frontend/editor/project/store'

/**
 * Opens the active company's Drive and projects: the company is the Clerk organization in the session,
 * the same one the ERP uses. Switching company in Otto switches what the editor loads.
 */
function Sync() {
  const { isLoaded, userId, orgId } = useAuth()
  useEffect(() => {
    if (!isLoaded || !userId || !orgId) return
    const c = { ws: orgId, user: userId }
    setWorkspace(c)
    void connectDrive(c)
    void connectEditor(c)
  }, [isLoaded, userId, orgId])
  return null
}

export function EditorAccountSync() {
  return supabaseConfigured ? <Sync /> : null
}

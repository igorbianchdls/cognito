'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { setWorkspace } from '@/products/editor/frontend/lib/sync'
import { supabaseConfigured } from '@/products/editor/frontend/lib/supabase'
import { connectDrive } from '../store'

/**
 * Opens the active company's Drive: the company is the Clerk organization in the session, the same one the ERP
 * uses. Switching company in Otto switches what the Drive shows.
 */
function Sync() {
  const { isLoaded, userId, orgId } = useAuth()
  useEffect(() => {
    if (!isLoaded || !userId || !orgId) return
    const c = { ws: orgId, user: userId }
    setWorkspace(c)
    void connectDrive(c)
  }, [isLoaded, userId, orgId])
  return null
}

export function DriveAccountSync() {
  return supabaseConfigured ? <Sync /> : null
}

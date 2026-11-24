'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { setWorkspace } from '@/products/editor/frontend/lib/sync'
import { supabaseConfigured } from '@/products/editor/frontend/lib/supabase'
import { connectDrive } from '@/products/drive/frontend/store'
import { connectPosts } from '@/products/marketing/frontend/posts/store'
import { connectAccounts } from '@/products/marketing/frontend/posts/accounts'
import { connectNotifications } from '@/products/marketing/frontend/notifications/store'

/** Opens the active company's posts, accounts and notifications, and the Drive the posts take their media from. */
function Sync() {
  const { isLoaded, userId, orgId } = useAuth()
  useEffect(() => {
    if (!isLoaded || !userId || !orgId) return
    const c = { ws: orgId, user: userId }
    setWorkspace(c)
    void connectDrive(c)
    void connectPosts(c)
    void connectAccounts(c)
    void connectNotifications(c)
  }, [isLoaded, userId, orgId])
  return null
}

export function SocialAccountSync() {
  return supabaseConfigured ? <Sync /> : null
}

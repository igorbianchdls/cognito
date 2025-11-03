import { serve } from 'inngest/next'
import { inngest } from '@/app/workflows/inngest/client'
import { functions } from '@/app/workflows/inngest/functions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const { GET, POST, PUT } = serve({ client: inngest, functions: [...functions] })


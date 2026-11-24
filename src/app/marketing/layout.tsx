import { MarketingShell } from '@/products/editor/frontend/shell/MarketingShell'
import { SocialAccountSync } from '@/products/marketing/frontend/shell/SocialAccountSync'

export const metadata = { title: 'Marketing · Otto' }

/** Marketing product: posting and scheduling, in the Marketing section of the Otto menu. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}<SocialAccountSync /></MarketingShell>
}

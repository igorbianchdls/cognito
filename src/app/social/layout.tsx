import { MarketingShell } from '@/products/editor/frontend/shell/MarketingShell'
import { SocialAccountSync } from '@/products/social/frontend/shell/SocialAccountSync'

export const metadata = { title: 'Social · Otto' }

/** Social product: posting and scheduling, in the Marketing section of the Otto menu. */
export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}<SocialAccountSync /></MarketingShell>
}

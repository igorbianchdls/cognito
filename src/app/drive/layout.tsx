import { MarketingShell } from '@/products/editor/frontend/shell/MarketingShell'
import { DriveAccountSync } from '@/products/drive/frontend/shell/DriveAccountSync'

export const metadata = { title: 'Drive · Otto' }

/** Drive product: the company's drives, folders and files, used by the video editor and by Social. */
export default function DriveLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}<DriveAccountSync /></MarketingShell>
}

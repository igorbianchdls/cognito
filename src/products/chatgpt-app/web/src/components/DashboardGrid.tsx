import { DashboardCard } from '@/products/chatgpt-app/web/src/components/DashboardCard'
import type { DashboardListItem } from '@/products/chatgpt-app/web/src/types/dashboard'

type DashboardGridProps = {
  dashboards: DashboardListItem[]
}

export function DashboardGrid({ dashboards }: DashboardGridProps) {
  return (
    <div className="dashboard-grid">
      {dashboards.map((dashboard, index) => (
        <DashboardCard
          key={dashboard.id || dashboard.slug || index}
          dashboard={dashboard}
        />
      ))}
    </div>
  )
}


import { DashboardCard } from '@/products/plugin/web/src/components/DashboardCard'
import type { DashboardListItem } from '@/products/plugin/web/src/types/dashboard'

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


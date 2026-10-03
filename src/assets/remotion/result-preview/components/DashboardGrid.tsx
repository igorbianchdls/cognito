import { DashboardCard } from '@/assets/remotion/result-preview/components/DashboardCard'
import type { DashboardListItem } from '@/assets/remotion/result-preview/types/dashboard'

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


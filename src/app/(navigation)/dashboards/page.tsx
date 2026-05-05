"use client";

import NexusShell from "@/components/navigation/nexus/NexusShell";
import DashboardGridView from "@/components/navigation/dashboards/DashboardGridView";

export default function DashboardsPage() {
  return (
    <NexusShell outerBg="rgb(253, 253, 253)">
      <div className="px-4 md:px-6">
        <header className="mb-6">
          <h1
            className="text-[44px] font-semibold tracking-[-0.05em] text-[#101828]"
            style={{ fontFamily: 'var(--font-eb-garamond), "EB Garamond", serif' }}
          >
            Dashboards
          </h1>
          <p className="mt-2 text-[16px] text-[#6d7689]">Gerencie e navegue entre dashboards.</p>
        </header>

        <DashboardGridView />
      </div>
    </NexusShell>
  );
}

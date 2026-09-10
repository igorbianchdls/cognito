import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

type ModuleDemo = { title: string; rows: Array<{ name: string }> }

// Preserves existing composition timing while showing native ERP modules.
export function AnimatedMcpConnectorsView({ data, startFrame = 0 }: { data: ModuleDemo; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <section style={{ padding: 20, color: '#16203a', background: '#fff' }}>
        <h2>{data.title}</h2>
        {data.rows.map(row => <div key={row.name} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>{row.name}</div>)}
      </section>
    </McpMobileResultFrame>
  )
}

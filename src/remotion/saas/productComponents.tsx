import { Fragment } from 'react'

import type { SaaSTheme } from '@/remotion/saas/types'

type IntegrationApp = {
  category?: string
  health?: 'Healthy' | 'Warning' | 'Issue'
  label: string
  latency?: string
  mark?: string
  records?: string
  status?: string
}

const defaultIntegrationApps: IntegrationApp[] = [
  { category: 'ERP', health: 'Healthy', label: 'NetSuite', latency: '2 min', mark: 'N', records: '18.4k', status: 'Connected' },
  { category: 'CRM', health: 'Healthy', label: 'Salesforce', latency: '4 min', mark: 'S', records: '9.8k', status: 'Connected' },
  { category: 'Billing', health: 'Warning', label: 'Stripe', latency: '12 min', mark: 'St', records: '42.1k', status: 'Delayed' },
  { category: 'Warehouse', health: 'Healthy', label: 'BigQuery', latency: '1 min', mark: 'BQ', records: '2.1m', status: 'Streaming' },
  { category: 'Support', health: 'Healthy', label: 'Zendesk', latency: '6 min', mark: 'Z', records: '5.2k', status: 'Connected' },
  { category: 'Sheets', health: 'Issue', label: 'Google Sheets', latency: 'Paused', mark: 'G', records: '240', status: 'Needs auth' },
]

function getHealthColor(health: IntegrationApp['health'], theme: SaaSTheme) {
  if (health === 'Issue') return '#B42318'
  if (health === 'Warning') return '#B54708'
  return theme.positive
}

export function IntegrationHubMock({
  apps,
  centerLabel = 'Workspace',
  theme,
}: {
  apps: Array<{ label: string; status?: string; mark?: string }>
  centerLabel?: string
  theme: SaaSTheme
}) {
  return (
    <div style={{ height: 620, position: 'relative', width: '100%' }}>
      <div style={{ background: theme.text, borderRadius: 999, color: '#FFFFFF', display: 'grid', height: 168, left: '50%', placeContent: 'center', position: 'absolute', textAlign: 'center', top: '50%', transform: 'translate(-50%, -50%)', width: 168, zIndex: 5 }}>
        <strong style={{ fontSize: 32, fontWeight: 920, letterSpacing: 0 }}>{centerLabel.slice(0, 1)}</strong>
        <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 15, fontWeight: 780, letterSpacing: 0 }}>{centerLabel}</span>
      </div>
      {apps.map((app, index) => {
        const angle = (Math.PI * 2 * index) / apps.length - Math.PI / 2
        const radius = 232
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        return (
          <div key={app.label} style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 22, boxShadow: '0 18px 44px rgba(20,24,22,0.10)', display: 'flex', gap: 12, left: '50%', padding: '14px 16px', position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>
            <span style={{ alignItems: 'center', background: '#F0F5F2', borderRadius: 14, color: theme.accent, display: 'flex', fontSize: 18, fontWeight: 900, height: 38, justifyContent: 'center', letterSpacing: 0, width: 38 }}>{app.mark || app.label.slice(0, 1)}</span>
            <div style={{ display: 'grid', gap: 2 }}>
              <strong style={{ color: theme.text, fontSize: 17, fontWeight: 840, letterSpacing: 0 }}>{app.label}</strong>
              {app.status ? <span style={{ color: theme.positive, fontSize: 12, fontWeight: 850, letterSpacing: 0 }}>{app.status}</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function IntegrationCatalogMock({
  apps = defaultIntegrationApps,
  theme,
}: {
  apps?: IntegrationApp[]
  theme: SaaSTheme
}) {
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 26, display: 'grid', gap: 18, padding: 22 }}>
      <header style={{ alignItems: 'end', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gap: 5 }}>
          <strong style={{ color: theme.text, fontSize: 28, fontWeight: 920, letterSpacing: 0 }}>Integration catalog</strong>
          <span style={{ color: theme.muted, fontSize: 15, fontWeight: 700, letterSpacing: 0 }}>Connectors grouped by system type and sync state.</span>
        </div>
        <span style={{ background: '#ECFDF3', border: `1px solid ${theme.positive}33`, borderRadius: 999, color: theme.positive, fontSize: 14, fontWeight: 900, letterSpacing: 0, padding: '10px 13px' }}>{apps.length} sources</span>
      </header>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {apps.map((app) => {
          const healthColor = getHealthColor(app.health, theme)
          return (
            <section key={app.label} style={{ background: '#F8FBF9', border: `1px solid ${theme.border}`, borderRadius: 20, display: 'grid', gap: 14, padding: 16 }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
                <span style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 14, color: theme.accent, display: 'flex', fontSize: 16, fontWeight: 920, height: 42, justifyContent: 'center', letterSpacing: 0, width: 42 }}>{app.mark || app.label.slice(0, 1)}</span>
                <div style={{ display: 'grid', gap: 2 }}>
                  <strong style={{ color: theme.text, fontSize: 18, fontWeight: 880, letterSpacing: 0 }}>{app.label}</strong>
                  <span style={{ color: theme.muted, fontSize: 13, fontWeight: 780, letterSpacing: 0 }}>{app.category}</span>
                </div>
              </div>
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: healthColor, fontSize: 13, fontWeight: 900, letterSpacing: 0 }}>{app.status}</span>
                <span style={{ color: theme.muted, fontSize: 13, fontWeight: 780, letterSpacing: 0 }}>{app.latency}</span>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export function IntegrationPipelineMock({
  steps,
  theme,
}: {
  steps?: Array<{ label: string; metric: string; status: string }>
  theme: SaaSTheme
}) {
  const pipelineSteps = steps || [
    { label: 'Extract', metric: '6 sources', status: 'Live' },
    { label: 'Normalize', metric: '42 fields', status: 'Mapped' },
    { label: 'Validate', metric: '3 checks', status: 'Clean' },
    { label: 'Publish', metric: 'Warehouse', status: 'Ready' },
  ]
  return (
    <div style={{ background: theme.text, borderRadius: 28, color: '#FFFFFF', display: 'grid', gap: 24, padding: 26 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: 28, fontWeight: 920, letterSpacing: 0 }}>Sync pipeline</strong>
        <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 15, fontWeight: 780, letterSpacing: 0 }}>Last run: 09:42</span>
      </header>
      <div style={{ alignItems: 'stretch', display: 'grid', gap: 14, gridTemplateColumns: `repeat(${pipelineSteps.length}, 1fr)` }}>
        {pipelineSteps.map((step, index) => (
          <Fragment key={step.label}>
            <section style={{ background: index === pipelineSteps.length - 1 ? theme.accent : 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 20, display: 'grid', gap: 10, minHeight: 132, padding: 16 }}>
              <span style={{ color: index === pipelineSteps.length - 1 ? '#FFFFFF' : 'rgba(255,255,255,0.58)', fontSize: 13, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>Step {index + 1}</span>
              <strong style={{ fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>{step.label}</strong>
              <span style={{ color: index === pipelineSteps.length - 1 ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.68)', fontSize: 15, fontWeight: 760, letterSpacing: 0 }}>{step.metric}</span>
              <span style={{ color: '#A8F0C6', fontSize: 13, fontWeight: 900, letterSpacing: 0 }}>{step.status}</span>
            </section>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export function IntegrationHealthMatrixMock({
  apps = defaultIntegrationApps,
  theme,
}: {
  apps?: IntegrationApp[]
  theme: SaaSTheme
}) {
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 26, overflow: 'hidden' }}>
      <header style={{ background: '#F8FBF9', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', padding: '18px 20px' }}>
        <strong style={{ color: theme.text, fontSize: 24, fontWeight: 910, letterSpacing: 0 }}>Connector health</strong>
        <span style={{ color: theme.muted, fontSize: 14, fontWeight: 780, letterSpacing: 0 }}>SLA monitor</span>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.8fr 0.8fr 0.8fr' }}>
        {['Source', 'Status', 'Latency', 'Records'].map((column) => <span key={column} style={{ color: theme.muted, fontSize: 13, fontWeight: 900, letterSpacing: 0, padding: '13px 16px', textTransform: 'uppercase' }}>{column}</span>)}
        {apps.map((app) => {
          const healthColor = getHealthColor(app.health, theme)
          return (
            <Fragment key={app.label}>
              <div style={{ alignItems: 'center', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 10, padding: '14px 16px' }}>
                <span style={{ background: '#F0F5F2', borderRadius: 12, color: theme.accent, display: 'grid', fontSize: 14, fontWeight: 920, height: 34, letterSpacing: 0, placeContent: 'center', width: 34 }}>{app.mark || app.label.slice(0, 1)}</span>
                <strong style={{ color: theme.text, fontSize: 16, fontWeight: 850, letterSpacing: 0 }}>{app.label}</strong>
              </div>
              <span style={{ borderTop: `1px solid ${theme.border}`, color: healthColor, fontSize: 14, fontWeight: 900, letterSpacing: 0, padding: '18px 16px' }}>{app.status}</span>
              <span style={{ borderTop: `1px solid ${theme.border}`, color: theme.muted, fontSize: 14, fontWeight: 760, letterSpacing: 0, padding: '18px 16px' }}>{app.latency}</span>
              <span style={{ borderTop: `1px solid ${theme.border}`, color: theme.text, fontSize: 14, fontWeight: 850, letterSpacing: 0, padding: '18px 16px' }}>{app.records}</span>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

export function IntegrationFieldMappingMock({
  mappings,
  theme,
}: {
  mappings?: Array<{ source: string; target: string; type: string }>
  theme: SaaSTheme
}) {
  const fieldMappings = mappings || [
    { source: 'customer.email', target: 'account.primary_email', type: 'String' },
    { source: 'invoice.total', target: 'revenue.amount', type: 'Currency' },
    { source: 'deal.stage', target: 'pipeline.status', type: 'Enum' },
    { source: 'subscription.started_at', target: 'contract.start_date', type: 'Date' },
  ]
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 26, display: 'grid', gap: 16, padding: 20 }}>
      <header style={{ display: 'grid', gap: 5 }}>
        <strong style={{ color: theme.text, fontSize: 26, fontWeight: 920, letterSpacing: 0 }}>Field mapping</strong>
        <span style={{ color: theme.muted, fontSize: 15, fontWeight: 700, letterSpacing: 0 }}>Source fields normalized into the product data model.</span>
      </header>
      <div style={{ display: 'grid', gap: 10 }}>
        {fieldMappings.map((mapping) => (
          <div key={`${mapping.source}-${mapping.target}`} style={{ alignItems: 'center', background: '#F8FBF9', border: `1px solid ${theme.border}`, borderRadius: 18, display: 'grid', gap: 14, gridTemplateColumns: '1fr 44px 1fr 92px', padding: '13px 14px' }}>
            <code style={{ color: theme.text, fontFamily: 'monospace', fontSize: 14, fontWeight: 800, letterSpacing: 0 }}>{mapping.source}</code>
            <span style={{ background: theme.accent, borderRadius: 999, color: '#FFFFFF', fontSize: 18, fontWeight: 920, height: 32, letterSpacing: 0, lineHeight: '32px', textAlign: 'center' }}>-&gt;</span>
            <code style={{ color: theme.text, fontFamily: 'monospace', fontSize: 14, fontWeight: 800, letterSpacing: 0 }}>{mapping.target}</code>
            <span style={{ color: theme.muted, fontSize: 13, fontWeight: 850, letterSpacing: 0, textAlign: 'right' }}>{mapping.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuditLogMock({
  events,
  theme,
}: {
  events?: Array<{ actor: string; action: string; time: string; status?: string }>
  theme: SaaSTheme
}) {
  const rows = events || [
    { actor: 'Finance Bot', action: 'Classified 42 invoices', status: 'Complete', time: '09:14' },
    { actor: 'Ana Silva', action: 'Approved board report', status: 'Approved', time: '09:22' },
    { actor: 'ERP Sync', action: 'Updated payment status', status: 'Synced', time: '09:31' },
    { actor: 'Risk Engine', action: 'Flagged vendor anomaly', status: 'Review', time: '09:40' },
  ]
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 24, display: 'grid', overflow: 'hidden' }}>
      <header style={{ background: '#F8FBF9', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', padding: '18px 20px' }}>
        <strong style={{ color: theme.text, fontSize: 22, fontWeight: 880, letterSpacing: 0 }}>Audit log</strong>
        <span style={{ color: theme.muted, fontSize: 14, fontWeight: 760 }}>Live trail</span>
      </header>
      {rows.map((event, index) => (
        <div key={`${event.actor}-${event.time}`} style={{ borderBottom: index === rows.length - 1 ? 'none' : `1px solid ${theme.border}`, display: 'grid', gap: 14, gridTemplateColumns: '90px 1fr 90px', padding: '16px 20px' }}>
          <span style={{ color: theme.muted, fontSize: 15, fontWeight: 760 }}>{event.time}</span>
          <div style={{ display: 'grid', gap: 3 }}>
            <strong style={{ color: theme.text, fontSize: 17, fontWeight: 840, letterSpacing: 0 }}>{event.actor}</strong>
            <span style={{ color: theme.muted, fontSize: 15, fontWeight: 650, letterSpacing: 0 }}>{event.action}</span>
          </div>
          <span style={{ color: event.status === 'Review' ? '#B54708' : theme.positive, fontSize: 14, fontWeight: 880, textAlign: 'right' }}>{event.status}</span>
        </div>
      ))}
    </div>
  )
}

export function SettingsPermissionsMock({ theme }: { theme: SaaSTheme }) {
  const roles = [
    ['Admin', true, true, true],
    ['Finance', true, true, false],
    ['Sales', true, false, false],
    ['Viewer', true, false, false],
  ]
  const permissions = ['View', 'Approve', 'Configure']
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 24, overflow: 'hidden' }}>
      <header style={{ background: '#F8FBF9', borderBottom: `1px solid ${theme.border}`, display: 'grid', gap: 5, padding: 20 }}>
        <strong style={{ color: theme.text, fontSize: 24, fontWeight: 900, letterSpacing: 0 }}>Permissions</strong>
        <span style={{ color: theme.muted, fontSize: 15, fontWeight: 650, letterSpacing: 0 }}>Role-based access for teams and workflows.</span>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr repeat(3, 1fr)' }}>
        <span style={{ color: theme.muted, fontSize: 14, fontWeight: 850, padding: 16 }}>Role</span>
        {permissions.map((permission) => <span key={permission} style={{ color: theme.muted, fontSize: 14, fontWeight: 850, padding: 16, textAlign: 'center' }}>{permission}</span>)}
        {roles.map(([role, ...values]) => (
          <Fragment key={String(role)}>
            <strong key={`${role}-label`} style={{ borderTop: `1px solid ${theme.border}`, color: theme.text, fontSize: 16, fontWeight: 840, padding: 16 }}>{role}</strong>
            {values.map((enabled, index) => <span key={`${role}-${index}`} style={{ borderTop: `1px solid ${theme.border}`, color: enabled ? theme.positive : '#A0A8B2', fontSize: 14, fontWeight: 900, padding: 16, textAlign: 'center' }}>{enabled ? 'Yes' : 'No'}</span>)}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export function InboxTriageMock({ theme }: { theme: SaaSTheme }) {
  const items = [
    { label: 'Vendor payment exception', priority: 'High', sender: 'ERP Sync' },
    { label: 'Campaign overspend detected', priority: 'Medium', sender: 'Marketing Ops' },
    { label: 'Board report ready for review', priority: 'Ready', sender: 'Report Agent' },
    { label: 'Contract renewal due', priority: 'Low', sender: 'Legal Ops' },
  ]
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 24, display: 'grid', gap: 12, padding: 18 }}>
      {items.map((item, index) => (
        <div key={item.label} style={{ alignItems: 'center', background: index === 0 ? '#FFF7ED' : '#F8FBF9', border: `1px solid ${index === 0 ? '#FED7AA' : theme.border}`, borderRadius: 18, display: 'grid', gap: 14, gridTemplateColumns: '1fr auto', padding: 16 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <strong style={{ color: theme.text, fontSize: 18, fontWeight: 850, letterSpacing: 0 }}>{item.label}</strong>
            <span style={{ color: theme.muted, fontSize: 14, fontWeight: 680 }}>{item.sender}</span>
          </div>
          <span style={{ color: item.priority === 'High' ? '#B42318' : item.priority === 'Ready' ? theme.positive : theme.accent, fontSize: 14, fontWeight: 900 }}>{item.priority}</span>
        </div>
      ))}
    </div>
  )
}

export function AIChatWorkspaceMock({ theme }: { theme: SaaSTheme }) {
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 24, display: 'grid', gap: 16, padding: 18 }}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ background: theme.text, borderRadius: 18, color: '#FFFFFF', justifySelf: 'end', maxWidth: 430, padding: '14px 16px' }}>Which accounts are blocking the close?</div>
        <div style={{ background: '#F8FBF9', border: `1px solid ${theme.border}`, borderRadius: 18, color: theme.text, maxWidth: 540, padding: '14px 16px' }}>I found 8 exceptions. Three vendors explain 74% of the delay.</div>
      </div>
      <div style={{ background: '#F8FBF9', border: `1px solid ${theme.border}`, borderRadius: 18, display: 'grid', gap: 10, padding: 16 }}>
        <strong style={{ color: theme.text, fontSize: 18, fontWeight: 880, letterSpacing: 0 }}>Generated action plan</strong>
        {['Send vendor reminders', 'Create approval batch', 'Update board risk note'].map((step, index) => <span key={step} style={{ color: theme.muted, fontSize: 15, fontWeight: 720 }}>{index + 1}. {step}</span>)}
      </div>
    </div>
  )
}

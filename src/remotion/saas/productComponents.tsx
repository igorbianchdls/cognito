import { Fragment } from 'react'

import type { SaaSTheme } from '@/remotion/saas/types'

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

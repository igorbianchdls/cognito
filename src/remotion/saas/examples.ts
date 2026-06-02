import type { SaaSIntroVideoConfig } from '@/remotion/saas/types'

export const ledgerAIIntroConfig: SaaSIntroVideoConfig = {
  brand: {
    mark: 'L',
    name: 'Ledger AI',
    tagline: 'Finance operations workspace',
    theme: {
      accent: '#245BDB',
      accent2: '#22A06B',
      background: '#F4F7FB',
      border: '#D9E2F1',
      muted: '#5E6D82',
      text: '#101828',
    },
  },
  scenes: [
    {
      type: 'hero',
      duration: 150,
      title: 'Close finance work before it becomes a fire drill',
      subtitle: 'Ledger AI connects ERP, bank, CRM and marketing data into one operating layer.',
      metrics: [
        { label: 'Close time', value: '3 days', delta: 'from 11 days' },
        { label: 'Manual checks', value: '-64%', delta: 'automated' },
        { label: 'Forecast accuracy', value: '+18%', delta: 'month over month' },
      ],
      productScreens: [
        { eyebrow: 'Executive workspace', metric: '+$1.2M reconciled', title: 'Live finance command center' },
      ],
    },
    {
      type: 'problem',
      duration: 130,
      title: 'Finance teams lose the week stitching systems together',
      subtitle: 'The work is not one task. It is dozens of disconnected checks across tools.',
      painPoints: ['ERP data does not match bank activity', 'Reports are rebuilt manually every week', 'Approvals happen outside the system of record'],
    },
    {
      type: 'product-tour',
      duration: 170,
      title: 'One workspace for analysis, action and reporting',
      subtitle: 'Move from source data to board-ready output without leaving the product.',
      screens: [
        { accent: '#245BDB', eyebrow: 'Analytics', metric: '+24% margin visibility', title: 'Executive dashboard' },
        { accent: '#22A06B', eyebrow: 'Actions', metric: '98 automations', title: 'Workflow command center' },
        { accent: '#C28F2C', eyebrow: 'Reports', metric: '5 reports generated', title: 'Board-ready narratives' },
      ],
    },
    {
      type: 'workflow',
      duration: 150,
      title: 'Turn messy operations into a clean execution flow',
      subtitle: 'Every handoff is visible, assigned and measurable.',
      steps: [
        { description: 'Connect ERP, bank and revenue sources.', status: 'Synced', title: 'Ingest source data' },
        { description: 'Classify, reconcile and detect exceptions.', status: 'Running', title: 'Analyze exceptions' },
        { description: 'Create the report and route approvals.', status: 'Ready', title: 'Publish outcome' },
      ],
    },
    {
      type: 'integrations',
      duration: 140,
      title: 'Connect the tools your team already runs on',
      subtitle: 'Ledger AI becomes the operating layer across your business systems.',
      logos: [
        { label: 'Stripe', mark: 'S' },
        { label: 'HubSpot', mark: 'H' },
        { label: 'QuickBooks', mark: 'Q' },
        { label: 'Salesforce', mark: 'SF' },
        { label: 'Google Ads', mark: 'G' },
        { label: 'Shopify', mark: 'S' },
      ],
    },
    {
      type: 'metrics',
      duration: 140,
      title: 'The result is a finance team that moves faster with fewer surprises',
      subtitle: 'Use this scene for quantified outcomes in product launch videos.',
      metrics: [
        { label: 'Hours saved monthly', value: '184', delta: '+38 this quarter' },
        { label: 'Reports generated', value: '42', delta: 'board-ready' },
        { label: 'Open risks closed', value: '91%', delta: 'inside SLA' },
        { label: 'Systems connected', value: '12', delta: 'live sync' },
      ],
    },
    {
      type: 'outro',
      duration: 120,
      title: 'Launch a finance operating system your team will actually use',
      subtitle: 'From source data to decisions, every week.',
      cta: 'Book a product walkthrough',
    },
  ],
}

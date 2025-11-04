"use client"

import { Code, Database, GitBranch, Clock4, Network, Webhook, Terminal, Save, Layers, Mail, Shield, FileSearch, Link as LinkIcon } from "lucide-react"
import type { ConnectorCatalog } from "./types"

export const catalog: ConnectorCatalog = {
  actionBlocks: [
    { id: 'requests', label: 'Requests', hint: 'HTTP requests', kind: 'core', stepType: 'action', icon: <Network className="w-4 h-4" /> },
    { id: 'code', label: 'Code', hint: 'Custom JavaScript', kind: 'core', stepType: 'action', icon: <Code className="w-4 h-4" /> },
    { id: 'data-map', label: 'Data Map', hint: 'Transform data', kind: 'helper', stepType: 'action', icon: <Database className="w-4 h-4" /> },
    { id: 'event-transform', label: 'Event transform', hint: 'Mutate event payload', kind: 'helper', stepType: 'action', icon: <Layers className="w-4 h-4" /> },
    { id: 'trigger', label: 'Trigger', hint: 'Start flow', kind: 'core', stepType: 'trigger', icon: <Webhook className="w-4 h-4" /> },
    { id: 'save-to-story', label: 'Save to story', hint: 'Persist execution', kind: 'helper', stepType: 'action', icon: <Save className="w-4 h-4" /> },
    { id: 'webhook', label: 'Webhook', hint: 'Receive URLs', kind: 'core', stepType: 'trigger', icon: <LinkIcon className="w-4 h-4" /> },
    { id: 'terminal', label: 'Terminal', hint: 'Run command', kind: 'helper', stepType: 'action', icon: <Terminal className="w-4 h-4" /> },
  ],
  providers: [
    {
      id: 'abnormal-sec',
      name: 'Abnormal Security',
      count: 12,
      connectors: [
        { id: 'abnormal.alerts', label: 'Alerts', hint: 'List alerts', kind: 'action', stepType: 'action', icon: <Shield className="w-4 h-4" /> },
        { id: 'abnormal.events', label: 'Events', hint: 'Ingest events', kind: 'action', stepType: 'action', icon: <FileSearch className="w-4 h-4" /> },
      ],
    },
    {
      id: 'abuse-ch',
      name: 'Abuse.ch',
      count: 4,
      connectors: [
        { id: 'abuse.ip', label: 'IP check', hint: 'Check malicious IP', kind: 'action', stepType: 'action', icon: <FileSearch className="w-4 h-4" /> },
        { id: 'abuse.hash', label: 'Hash check', hint: 'Check file hash', kind: 'action', stepType: 'action', icon: <FileSearch className="w-4 h-4" /> },
      ],
    },
    {
      id: 'agari',
      name: 'Agari',
      count: 2,
      connectors: [
        { id: 'agari.lookup', label: 'Domain lookup', hint: 'DMARC insights', kind: 'action', stepType: 'action', icon: <FileSearch className="w-4 h-4" /> },
      ],
    },
    {
      id: 'airtable',
      name: 'Airtable',
      count: 10,
      connectors: [
        { id: 'airtable.create', label: 'Create record', hint: 'Insert row', kind: 'action', stepType: 'action', icon: <Database className="w-4 h-4" /> },
        { id: 'airtable.find', label: 'Find records', hint: 'Query rows', kind: 'action', stepType: 'action', icon: <Database className="w-4 h-4" /> },
        { id: 'airtable.updated', label: 'Record updated', hint: 'Trigger on update', kind: 'trigger', stepType: 'trigger', icon: <Clock4 className="w-4 h-4" /> },
      ],
    },
    {
      id: 'email',
      name: 'Email',
      connectors: [
        { id: 'email.send', label: 'Send email', hint: 'SMTP/API', kind: 'action', stepType: 'action', icon: <Mail className="w-4 h-4" /> },
        { id: 'email.incoming', label: 'Incoming email', hint: 'Trigger on receive', kind: 'trigger', stepType: 'trigger', icon: <Mail className="w-4 h-4" /> },
      ],
    },
  ],
}

export const flatAllConnectors = () => [
  ...catalog.actionBlocks.map((c) => ({ ...c, provider: 'Action Blocks' })),
  ...catalog.providers.flatMap((p) => p.connectors.map((c) => ({ ...c, provider: p.name }))),
]

